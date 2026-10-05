# Implementation Plan

## Overview

見積書ジェネレーター（React + TypeScript + Vite）の実装タスク一覧。プロジェクトセットアップから始まり、ドメインロジック・状態管理・WorksheetView・EstimateView・PDF書き出し・スタイリングの順で進める。各タスクは前のタスクの成果物に依存する。

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": [1] },
    { "wave": 2, "tasks": [2] },
    { "wave": 3, "tasks": [3] },
    { "wave": 4, "tasks": [4] },
    { "wave": 5, "tasks": [5] },
    { "wave": 6, "tasks": [6, 7] },
    { "wave": 7, "tasks": [8] },
    { "wave": 8, "tasks": [9] }
  ]
}
```

## Tasks

- [ ] 1. プロジェクトのセットアップ
  - Vite + React + TypeScript でプロジェクトを初期化する（`npm create vite@latest`）
  - ESLint・Prettier・Vitest・fast-check を導入し、設定ファイルを作成する
  - `tsconfig.json` に `"strict": true` を設定する
  - `src/domain/`・`src/components/`・`src/hooks/`・`src/types/`・`src/utils/` のディレクトリ構成を作成する
  - `public/fonts/` に Noto Sans JP（Regular・Bold）の `.ttf` を配置する
  - `public/config.sample.json` を作成し、`config.json` を `.gitignore` に追加する
  - `@react-pdf/renderer` をインストールする
  - **要件との対応:** Requirement 3

- [ ] 2. 型定義の作成
  - `src/types/index.ts` に `WorkItem`・`WorkItemStatus`・`WorkItemPhaseResult` を定義する
  - `src/types/index.ts` に `EstimateHeader`・`ManualLineItem`・`DailyRateMap` を定義する
  - `src/types/index.ts` に `CompanyInfo`・`AppConfig`・`SessionData` を定義する
  - `src/types/index.ts` に `WorksheetAggregate`・`LineAmountResult`・`TotalsResult`・`FieldError` を定義する
  - **要件との対応:** 全要件の基盤

- [ ] 3. ドメインロジックの実装とテスト
  - `src/domain/worksheet.ts` — `computePhaseEfforts` を実装する（係数計算・四捨五入・変更なしゼロ化）
  - `src/domain/worksheet.ts` — `aggregateWorksheet` を実装する（工程別合計・総合計）
  - `src/domain/__tests__/worksheet.test.ts` — `computePhaseEfforts` の単体テストとプロパティテストを書く
  - `src/domain/__tests__/worksheet.test.ts` — `aggregateWorksheet` の単体テストを書く
  - `src/domain/estimate.ts` — `computeSectionQuantities` を実装する（工程合計 → 区分マッピング）
  - `src/domain/estimate.ts` — `computeLineAmount` を実装する（円未満切り捨て）
  - `src/domain/estimate.ts` — `computeTotals` を実装する（消費税切り捨て・税込合計）
  - `src/domain/__tests__/estimate.test.ts` — `computeLineAmount`・`computeTotals` の単体テストとプロパティテストを書く
  - `src/domain/config.ts` — `parseConfig`・`validateCoefficients` を実装する
  - `src/domain/__tests__/config.test.ts` — `parseConfig` の単体テストを書く（正常・不正値・欠損キー）
  - `src/domain/validation.ts` — `validateForExport` を実装する（全エラー同時返却）
  - `src/domain/__tests__/validation.test.ts` — `validateForExport` の単体テストを書く
  - `src/utils/format.ts` — 日本円フォーマット（3桁カンマ・¥記号）と日付フォーマットを実装する
  - **要件との対応:** Requirement 2, 3, 5.8, 6.2, 9

- [ ] 4. 状態管理とセッション永続化
  - `src/hooks/useAppState.ts` — `AppAction` 型と `appReducer` を実装する
  - `src/hooks/useAppState.ts` — `AppStateContext`・`DerivedStateContext` を作成し、Provider を実装する
  - `src/hooks/useDebounce.ts` — 汎用 debounce フックを実装する
  - `src/hooks/useSessionPersistence.ts` — debounce(3000ms) での自動保存と起動時リストアを実装する（バージョン不一致時は破棄）
  - `src/hooks/useConfig.ts` — `config.json` → `config.sample.json` → デフォルト値のフォールバック読み込みを実装する
  - **要件との対応:** Requirement 8

- [ ] 5. 共通コンポーネントとレイアウト
  - `src/components/common/TabBar.tsx` — WorksheetView / EstimateView のタブ切り替えを実装する
  - `src/components/common/ErrorMessage.tsx` — エラーメッセージ表示コンポーネントを実装する
  - `src/App.tsx` — `ConfigProvider`・`SessionProvider`・`TabBar` を組み合わせたルートコンポーネントを実装する
  - **要件との対応:** Requirement 4.5

- [ ] 6. 工数明細シート（WorksheetView）
  - `src/components/worksheet/WorkItemRow.tsx` — No・機能要望・カテゴリ(select)・状態(select)・備考・製造工数の入力行を実装する
  - `WorkItemRow` — 状態「変更なし」のとき工程工数セルをグレーアウト（0固定表示）する
  - `WorkItemRow` — 製造工数のエラー状態表示（0未満・非数値）を実装する
  - `WorkItemRow` — 上下移動ボタンによる並び替えを実装する（並び替え後に No を振り直す）
  - `src/components/worksheet/WorksheetTable.tsx` — WorkItemRow の一覧と「行を追加」ボタンを実装する
  - `src/components/worksheet/WorksheetSummary.tsx` — 工程別合計・総合計の集計行を実装する
  - `src/components/worksheet/WorksheetView.tsx` — WorksheetToolbar・WorksheetTable・WorksheetSummary を組み合わせる
  - **要件との対応:** Requirement 1, 2

- [ ] 7. 顧客向け見積書（EstimateView）
  - `src/components/estimate/EstimateHeader.tsx` — 発行日・見積番号・宛先（御中形式）・件名・有効期限・備考文の入力フォームを実装する
  - `EstimateHeader` — 有効期限が過去日付のとき警告メッセージのみ表示（保存はブロックしない）する
  - `src/components/estimate/DailyRateSettings.tsx` — 共通デフォルト単価と区分別オーバーライドの入力UIを実装する
  - `src/components/estimate/ManualLineItemList.tsx` — 手動追加明細行（品名・数量・単位・単価）の追加・編集・削除UIを実装する
  - `ManualLineItemList` — 数量・単価の不正値エラー表示を実装する（当該行のみ計算停止、他行は継続）
  - `src/components/estimate/EstimatePreview.tsx` — A4縦比率レイアウトでプレビューを実装する（PreviewHeader・PreviewTable・PreviewSummary）
  - `EstimatePreview` — 「お見積金額」を上部に目立つ形式で表示する
  - `EstimatePreview` — 小計・消費税（10%）・税込合計の内訳を表示する
  - `EstimatePreview` — 入力変化を `useDebounce(500)` でプレビューに反映する
  - `src/components/estimate/EstimateView.tsx` — EstimateHeader・DailyRateSettings・ManualLineItemList・EstimatePreview・PdfExportButton を組み合わせる
  - **要件との対応:** Requirement 4, 5, 6

- [ ] 8. PDF 書き出し
  - `@react-pdf/renderer` に Noto Sans JP フォントを登録する（`Font.register()`）
  - `EstimatePreview` と同じレイアウト構造を持つ `@react-pdf/renderer` ドキュメントコンポーネントを実装する
  - `src/components/estimate/PdfExportButton.tsx` — クリック時に `validateForExport()` を実行し、エラー時は生成を中止してエラー表示する
  - `PdfExportButton` — `pdf().toBlob()` で PDF を生成し、ブラウザダウンロードとして提供する
  - `PdfExportButton` — 生成中はローディングスピナーを表示しボタンを無効化する（完了後に有効化）
  - `PdfExportButton` — ファイル名を `見積書_{{宛先会社名}}_{{発行日}}.pdf` 形式で設定する（未入力時は `不明` で代替）
  - `PdfExportButton` — PDF 生成エラー時にエラーメッセージを表示し、ボタンを再度有効化する
  - **要件との対応:** Requirement 7, 9

- [ ] 9. スタイリングと最終調整
  - 全体のスタイルシートを作成する（テーブルレイアウト・フォーム・エラー表示の基本スタイル）
  - WorksheetView のテーブルを横スクロール対応にする（工程列が多いため）
  - 金額フィールドの全表示箇所に `format.ts` の日本円フォーマットを適用する
  - バリデーションエラーの赤枠スタイルと 200ms 以内の解除アニメーションを実装する
  - PDF 書き出しボタンのローディングスピナーを実装する
  - **要件との対応:** Requirement 6.5, 9

## Notes

- ドメインロジック（Task 3）のテストは `vitest run` で全件グリーンになってから次のタスクに進むこと
- `src/domain/` のモジュールは React・DOM に依存してはならない（`import React` 禁止）
- 設定ファイルのフォールバック順は `config.json` → `config.sample.json` → ハードコードデフォルト値
- WorksheetView のテーブルは工程列が多く横に長くなるため、横スクロールを Task 9 で必ず対応すること
- PDF の日本語文字化けは Noto Sans JP の `.ttf` を `Font.register()` で登録することで防止する
