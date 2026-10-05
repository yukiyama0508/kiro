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
