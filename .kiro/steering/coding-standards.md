---
inclusion: always
---

# コーディング規約

## 技術スタック

- フレームワーク: React + TypeScript
- ビルドツール: Vite
- パッケージマネージャー: npm

## TypeScript

- `strict` モードを有効にすること（`tsconfig.json` に `"strict": true`）
- `any` 型は使用しない。型が不明な場合は `unknown` を使い、型ガードで絞り込むこと
- 関数の引数と戻り値には必ず型を明記すること

## React

- コンポーネントは関数コンポーネントと Hooks で書くこと（クラスコンポーネントは使用しない）

## リンター・フォーマッター

- リンターは ESLint を使用すること
- フォーマッターは Prettier を使用すること
- コミット前に ESLint と Prettier が通ることを確認すること

## テスト

- テストフレームワークは Vitest を使用すること
- プロパティベーステストが必要な場合は fast-check を使用すること

## フォルダ構成

Vite の標準的な構成に従うこと:

```
src/
  domain/       # 金額・工数の計算ロジック（純粋関数のみ、UIに依存しない）
  components/   # React コンポーネント
  hooks/        # カスタム Hooks
  types/        # 型定義
  utils/        # 汎用ユーティリティ
  assets/       # 静的ファイル
public/         # 公開静的ファイル（config.sample.json など）
```

## ドメインロジックの分離

- 金額・工数の計算ロジックは `src/domain/` 配下に純粋関数として置き、UI コンポーネントから分離すること
- `src/domain/` のモジュールは React や DOM に依存してはならない
