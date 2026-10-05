# 見積書ジェネレーター

工数明細を入力すると、顧客向けの見積書を画面上で作成し、A4縦1枚のPDFとして書き出せるブラウザ完結型のWebアプリケーションです。ログイン・サーバー保存は不要で、入力内容は同一セッション中 `sessionStorage` に保持されます。

## 主な機能

- **工数明細シート**: 作業項目ごとに製造工数を入力すると、設定した係数で各工程（進行管理・要件定義・基本設計など）の工数を自動計算
- **見積書の自動生成**: 工程別工数を6区分（要件定義・管理・設計・製造・テスト・リリース）に集計し、見積明細を自動作成
- **手動明細の追加**: 運用保守費などを手動で追加可能
- **金額計算**: 小計・消費税（10%・円未満切り捨て）・税込合計を自動計算
- **PDF書き出し**: 日本語フォント埋め込みで文字化けのないA4縦PDFをダウンロード

## 技術スタック

- React + TypeScript
- Vite（ビルドツール）
- @react-pdf/renderer（PDF生成・日本語フォント埋め込み）
- Vitest + fast-check（テスト）

## セットアップ

```bash
npm install
npm run dev
```

ブラウザで http://localhost:5173/ を開きます。

## 設定ファイル

自社情報・工程係数・区分マッピングは JSON 設定ファイルで管理します。

- `public/config.sample.json` — サンプル設定（リポジトリに含まれる）
- `public/config.json` — 実際の運用設定（`.gitignore` 対象。リポジトリには含めない）

実運用時は `config.sample.json` を `config.json` にコピーし、自社情報を記入してください。
アプリ起動時は `config.json` を優先的に読み込み、存在しない場合は `config.sample.json` にフォールバックします。

```bash
cp public/config.sample.json public/config.json
```

## スクリプト

| コマンド | 内容 |
|---------|------|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | 型チェック + 本番ビルド |
| `npm run test` | テスト実行（単体 + プロパティベース） |
| `npm run lint` | ESLint実行 |
| `npm run format` | Prettier整形 |

## プロジェクト構成

```
src/
  domain/       # 金額・工数の計算ロジック（純粋関数・テスト付き）
  components/   # React コンポーネント（worksheet / estimate / common）
  hooks/        # 状態管理・セッション永続化・設定読み込み
  types/        # 型定義
  utils/        # 日本円・日付フォーマット
public/
  config.sample.json   # サンプル設定
  fonts/               # Noto Sans JP（PDF用日本語フォント）
```

## Playwright MCP（ブラウザ自動動作確認）

Kiro から Playwright MCP を使うと、ブラウザでアプリを開いて工数入力・金額検証・PDF 書き出しまでを自動で動作確認できます。

### 前提（WSL + nvm 環境の場合）

Windows の Kiro から WSL 上の Node（nvm 管理）を使う構成では、設定にハマりどころがあるため以下の順で進めてください。

1. WSL のターミナルで Node を用意（nvm 利用）

   ```bash
   nvm install 22
   nvm use 22
   ```

2. Playwright 用のブラウザ（Chromium）をインストール

   ```bash
   npx -y @playwright/mcp@latest install-browser chrome-for-testing
   ```

   ヘッドレス起動に必要なシステムライブラリが不足する場合は、WSL で以下も実行します（要 sudo）。

   ```bash
   sudo apt-get update && sudo apt-get install -y \
     libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
     libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 \
     libgbm1 libasound2t64 libatspi2.0-0 libpango-1.0-0 libcairo2
   ```

3. MCP 設定を追加

   ワークスペースの `.kiro/settings/mcp.json`（または Kiro コマンドパレット「Open workspace MCP config」）に次を記述します。

   ```json
   {
     "mcpServers": {
       "playwright": {
         "command": "wsl",
         "args": [
           "-d",
           "Ubuntu",
           "bash",
           "-c",
           ". /<ファイルパス>/.nvm/nvm.sh && exec npx -y @playwright/mcp@latest --headless --browser chromium"
         ],
         "disabled": false,
         "autoApprove": ["browser_navigate", "browser_snapshot", "browser_take_screenshot"]
       }
     }
   }
   ```

4. Kiro で設定を保存し、MCP SERVERS ビューで `playwright` を再接続（またはウィンドウをリロード）します。

### 注意: nvm のパスについて

`args` の nvm 読み込みパスは、`$HOME` や `~` が Windows → WSL の受け渡しで正しく展開されず接続に失敗することがあったため、**絶対パス `/<ファイルパス>/.nvm/nvm.sh` を直書き**しています。

- `<ファイルパス>` の部分は、各自の WSL ユーザー名（`whoami` で確認）に置き換えてください。
- **この設定ファイルを commit / 共有する際は、実ユーザー名を `<ファイルパス>` などのプレースホルダに戻してください。**
- `.kiro/settings/mcp.json` を個人環境専用にしてリポジトリに含めない運用（`.gitignore` 追加）も選択肢です。
- **JSON はコメント（`//`）を書けません。** 設定ファイルにコメント行を残すと読み込みに失敗するため、実際に使う際はコメントを削除してください。

### トラブルシュート

- **connection failed / 接続ログが出ない**: Kiro 設定で「MCP support」が有効か確認。
- **`node: command not found`**: nvm の読み込みに失敗。`bash -lc` ではなく、上記の絶対パス `. /<ファイルパス>/.nvm/nvm.sh` 方式を使う。
- **`Unknown font format`（PDF）**: これは MCP とは別問題。`public/fonts/` の `.ttf` が実バイナリか確認（HTML を誤取得していないか）。
- **`Browser ... is not installed`**: 手順2の `install-browser chrome-for-testing` を実行。
