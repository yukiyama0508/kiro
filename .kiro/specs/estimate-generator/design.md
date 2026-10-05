# Design Document

## Overview

見積書ジェネレーターは React + TypeScript + Vite で構築するブラウザ完結型 SPA である。「工数明細シート（WorksheetView）」と「顧客向け見積書（EstimateView）」の2つのビューをタブで切り替えて使用する。データはすべてクライアントサイドで管理し、sessionStorage に自動保存する。PDF 書き出しは @react-pdf/renderer を用いてブラウザ内で完結させる。

---

## Architecture

### コンポーネント階層

```
App
├── ConfigProvider          # 設定ファイルの読み込みと Context 提供
├── SessionProvider         # sessionStorage の自動保存・復元
├── TabBar                  # WorksheetView / EstimateView の切り替え
├── WorksheetView           # 工数明細シート全体
│   ├── WorksheetToolbar    # 「行を追加」ボタン
│   ├── WorksheetTable      # WorkItem の一覧テーブル
│   │   └── WorkItemRow     # 1行分の入力フォーム（カテゴリ・状態はselect）
│   └── WorksheetSummary    # 工程別合計・総合計の集計行
└── EstimateView            # 顧客向け見積書全体
    ├── EstimateHeader      # 発行日・見積番号・宛先・件名・有効期限・備考文の入力
    ├── DailyRateSettings   # 人日単価の共通設定・区分別オーバーライド
    ├── EstimatePreview     # 見積書のプレビュー（A4縦比率）
    │   ├── PreviewHeader   # 宛先・自社情報・タイトル
    │   ├── PreviewTable    # 明細行テーブル（自動生成 + ManualLineItem）
    │   └── PreviewSummary  # 小計・消費税・税込合計・お見積金額
    ├── ManualLineItemList  # 手動追加行の編集UI
    └── PdfExportButton     # PDF書き出しボタン + ローディング表示
```

### データフロー

```
ConfigProvider（設定読み込み）
    │
    ↓
useAppState（中央ステート）
    ├── workItems: WorkItem[]          # 工数明細行
    ├── estimateHeader: Header         # 見積書ヘッダー
    ├── manualLineItems: ManualLineItem[]
    ├── dailyRates: DailyRateMap       # 区分別単価
    └── config: AppConfig              # 設定ファイルの値

    │  変更のたびに debounce(3000ms) で
    ↓
SessionProvider → sessionStorage['estimate-generator:session']

    │  domain 関数で純粋計算
    ↓
computeWorksheet(workItems, config.phaseCoefficients)
    → WorksheetResult（工程別工数・合計）

computeEstimateSections(worksheetResult, config.sectionMappings)
    → EstimateSection[]（自動生成明細行の数量）

computeLineAmounts(sections, manualItems, dailyRates)
    → LineAmount[]（各行の金額）

computeTotals(lineAmounts)
    → { subtotal, taxAmount, totalAmount }
```

---

## Data Models

```typescript
// 工数明細行
interface WorkItem {
  id: string;                  // UUID
  feature: string;             // 機能・要望
  note: string;                // 備考
  manufacturingDays: number;   // 製造工数（人日）
}

// 工程係数マップ（設定ファイル由来）
type PhaseCoefficientMap = Record<string, number>;
// 例: { '進行管理': 0.15, '要件定義': 0.20, ... }

// 工数明細の計算結果（1行分）
interface WorkItemPhaseResult {
  workItemId: string;
  phases: Record<string, number>; // 工程名 → 工数（小数第2位まで）
  rowTotal: number;
}

// 見積書ヘッダー
interface EstimateHeader {
  issueDate: string;       // 発行日 (YYYY-MM-DD)
  estimateNumber: string;  // 見積番号
  clientName: string;      // 宛先会社名
  subject: string;         // 件名
  validUntil: string;      // 有効期限 (YYYY-MM-DD)
  notes: string;           // 備考文
}

// 手動追加明細行
interface ManualLineItem {
  id: string;
  name: string;       // 品名
  quantity: number;   // 数量
  unit: string;       // 単位
  unitPrice: number;  // 単価
}

// 区分別単価マップ
type DailyRateMap = {
  default: number;
  overrides: Record<string, number>; // EstimateSection名 → 単価
};

// 自社情報（設定ファイル由来）
interface CompanyInfo {
  name: string;
  contact: string;
  address: string;
  tel: string;
  email: string;
  registrationNumber: string;
}

// 設定ファイル全体
interface AppConfig {
  companyInfo: CompanyInfo;
  phaseCoefficients: PhaseCoefficientMap;
  sectionMappings: Record<string, string[]>;
  // 例: { 'テスト': ['レビュー', 'テスト設計', 'テスト', 'ユーザテストFB'] }
}

// sessionStorage に保存するアプリ全体の状態
interface SessionData {
  workItems: WorkItem[];
  estimateHeader: EstimateHeader;
  manualLineItems: ManualLineItem[];
  dailyRates: DailyRateMap;
  version: string; // スキーマバージョン（破壊的変更検出用）
}
```

---

## Domain Layer (`src/domain/`)

UIに依存しない純粋関数のみを置く。React・DOM への参照は一切持たない。

### `src/domain/worksheet.ts`

```typescript
// 1行分の工程工数を計算する（小数第2位・四捨五入）
export function computePhaseEfforts(
  manufacturingDays: number,
  coefficients: PhaseCoefficientMap
): Record<string, number>;

// 全WorkItemの工程別合計・総合計を集計する
export function aggregateWorksheet(
  items: WorkItem[],
  coefficients: PhaseCoefficientMap
): WorksheetAggregate;
```

### `src/domain/estimate.ts`

```typescript
// 工程合計をEstimateSectionにマッピングして数量(人日)を算出する
export function computeSectionQuantities(
  aggregate: WorksheetAggregate,
  sectionMappings: Record<string, string[]>
): Record<string, number>;

// 1行の金額を計算する（円未満切り捨て）
export function computeLineAmount(
  quantity: number,
  unitPrice: number
): number;

// 小計・消費税・税込合計を計算する
export function computeTotals(lineAmounts: number[]): {
  subtotal: number;
  taxAmount: number;   // Math.floor(subtotal * 0.1)
  totalAmount: number;
};
```

### `src/domain/config.ts`

```typescript
// 設定ファイルをバリデーションしてAppConfigに変換する
export function parseConfig(raw: unknown): AppConfig;

// 係数値を検証し、範囲外ならデフォルト値にフォールバックする
export function validateCoefficients(
  input: Record<string, unknown>,
  defaults: PhaseCoefficientMap
): PhaseCoefficientMap;
```

### `src/domain/validation.ts`

```typescript
// 個別フィールドのバリデーション結果
export interface FieldError {
  field: string;
  message: string;
}

// PDF書き出し前の一括バリデーション（全エラーを同時返却）
export function validateForExport(
  header: EstimateHeader,
  workItems: WorkItem[],
  manualItems: ManualLineItem[]
): FieldError[];
```

---

## Component Design

### `WorkItemRow`

- 各セルをインライン編集可能な `<input>` / `<select>` で実装する
- 製造工数の変更は `onChange` で即座にステートを更新し、工程工数は `useMemo` で再計算する
- 上下移動ボタンで並び替え（ドラッグ＆ドロップは将来拡張とする）

### `EstimatePreview`

- `width: 210mm` の比率を維持した `div` を CSS で実装し、A4縦比率を表現する
- 入力値の変化は `useDebounce(500)` を通してプレビューに反映する
- このコンポーネントは `@react-pdf/renderer` の `<Document>` / `<Page>` と同じ構造を持つ HTML として実装し、PDF 生成時はそのまま流用する

### `PdfExportButton`

- クリック時に `validateForExport()` を実行し、エラーがあれば生成せずにエラー表示する
- 生成中は `isPending` ステートで `disabled` + ローディングスピナーを表示する
- PDF 生成は `@react-pdf/renderer` の `pdf().toBlob()` を `async/await` で呼び出す

---

## PDF Generation

### ライブラリ選定

| ライブラリ | 日本語フォント | ブラウザ完結 | 選定 |
|---|---|---|---|
| @react-pdf/renderer | ○（フォント埋め込み可） | ○ | **採用** |
| jsPDF + html2canvas | △（文字化けリスク） | ○ | 不採用 |
| Puppeteer | ○ | ✗（サーバー必須） | 不採用 |

### 日本語フォント対応

- `public/fonts/` に Noto Sans JP（Regular・Bold）の `.ttf` を配置する
- `Font.register()` でフォントを登録し、すべての `<Text>` コンポーネントに適用する

### PDF レイアウト

```
[ページ: A4 縦 210mm × 297mm, padding: 20mm]
┌─────────────────────────────────────┐
│ 見積書                    見積番号:  │
│ 発行日:  有効期限:                   │
├──────────────┬──────────────────────┤
│ 宛先（御中） │ 自社情報             │
├──────────────┴──────────────────────┤
│ 件名:                               │
│ お見積金額: ¥X,XXX,XXX（税込）       │
├─────┬──────┬──────┬────────────────┤
│ 品名 │ 数量 │ 単価 │ 金額           │
├─────┼──────┼──────┼────────────────┤
│ ... │  ... │  ... │ ...            │
├─────┴──────┴──────┴────────────────┤
│           小計: ¥X,XXX,XXX          │
│       消費税(10%): ¥XXX,XXX         │
│       税込合計: ¥X,XXX,XXX          │
├─────────────────────────────────────┤
│ 備考:                               │
│ 登録番号:                           │
└─────────────────────────────────────┘
```

---

## Configuration File

### `public/config.sample.json`（リポジトリに含める）

```json
{
  "companyInfo": {
    "name": "株式会社サンプル",
    "contact": "山田 太郎",
    "address": "東京都千代田区〇〇 1-2-3",
    "tel": "03-0000-0000",
    "email": "info@example.com",
    "registrationNumber": "T1234567890123"
  },
  "phaseCoefficients": {
    "進行管理": 0.15,
    "要件定義": 0.20,
    "基本設計": 0.30,
    "レビュー": 0.05,
    "テスト設計": 0.05,
    "テスト": 0.15,
    "ユーザテストFB": 0.02,
    "リリース": 0.02
  },
  "sectionMappings": {
    "要件定義": ["要件定義"],
    "管理": ["進行管理"],
    "設計": ["基本設計"],
    "製造": ["製造"],
    "テスト": ["レビュー", "テスト設計", "テスト", "ユーザテストFB"],
    "リリース": ["リリース"]
  }
}
```

`config.json` は `.gitignore` に登録し、ユーザーが `config.sample.json` をコピーして実際の情報を記入して使用する。

---

## State Management

グローバルステート管理ライブラリは使用せず、React の `useState` / `useReducer` + Context API で管理する。状態ツリーが複雑なため `useReducer` を採用し、`AppStateContext` 経由でコンポーネントに提供する。

```typescript
type AppAction =
  | { type: 'ADD_WORK_ITEM' }
  | { type: 'UPDATE_WORK_ITEM'; payload: { id: string; patch: Partial<WorkItem> } }
  | { type: 'DELETE_WORK_ITEM'; payload: { id: string } }
  | { type: 'MOVE_WORK_ITEM'; payload: { id: string; direction: 'up' | 'down' } }
  | { type: 'UPDATE_HEADER'; payload: Partial<EstimateHeader> }
  | { type: 'ADD_MANUAL_ITEM' }
  | { type: 'UPDATE_MANUAL_ITEM'; payload: { id: string; patch: Partial<ManualLineItem> } }
  | { type: 'DELETE_MANUAL_ITEM'; payload: { id: string } }
  | { type: 'UPDATE_DAILY_RATE'; payload: Partial<DailyRateMap> }
  | { type: 'RESTORE_SESSION'; payload: SessionData };
```

---

## Session Persistence

```typescript
// src/hooks/useSessionPersistence.ts
// AppStateの変更を検知してdebounce(3000ms)でsessionStorageに保存する
// 起動時にsessionStorageからリストアする
```

- 保存キー: `estimate-generator:session`
- スキーマバージョン: `"1.0"` — 読み込み時にバージョン不一致なら破棄して初期状態にフォールバックする

---

## Folder Structure

```
/
├── public/
│   ├── config.sample.json
│   └── fonts/
│       ├── NotoSansJP-Regular.ttf
│       └── NotoSansJP-Bold.ttf
├── src/
│   ├── domain/
│   │   ├── worksheet.ts       # 工程工数の計算（純粋関数）
│   │   ├── estimate.ts        # 明細金額・小計・税の計算（純粋関数）
│   │   ├── config.ts          # 設定ファイルのパース・バリデーション
│   │   ├── validation.ts      # 書き出し前バリデーション
│   │   └── __tests__/
│   │       ├── worksheet.test.ts
│   │       ├── estimate.test.ts
│   │       ├── config.test.ts
│   │       └── validation.test.ts
│   ├── types/
│   │   └── index.ts           # 全型定義（WorkItem, EstimateHeader 等）
│   ├── hooks/
│   │   ├── useAppState.ts     # useReducer ベースの中央ステート
│   │   ├── useSessionPersistence.ts
│   │   ├── useDebounce.ts
│   │   └── useConfig.ts       # config.json / config.sample.json の読み込み
│   ├── components/
│   │   ├── worksheet/
│   │   │   ├── WorksheetView.tsx
│   │   │   ├── WorksheetTable.tsx
│   │   │   ├── WorkItemRow.tsx
│   │   │   └── WorksheetSummary.tsx
│   │   ├── estimate/
│   │   │   ├── EstimateView.tsx
│   │   │   ├── EstimateHeader.tsx
│   │   │   ├── DailyRateSettings.tsx
│   │   │   ├── ManualLineItemList.tsx
│   │   │   ├── EstimatePreview.tsx
│   │   │   └── PdfExportButton.tsx
│   │   └── common/
│   │       ├── TabBar.tsx
│   │       └── ErrorMessage.tsx
│   ├── utils/
│   │   └── format.ts          # 日本円フォーマット・日付フォーマット
│   ├── App.tsx
│   └── main.tsx
├── .gitignore                 # config.json を含む
├── vite.config.ts
├── tsconfig.json
├── eslint.config.js
└── .prettierrc
```

---

## Key Technical Decisions

| 決定事項 | 採用 | 理由 |
|---|---|---|
| PDF生成 | @react-pdf/renderer | 日本語フォント埋め込み・ブラウザ完結 |
| 状態管理 | useReducer + Context | 依存追加なし・複雑なアクションに適合 |
| グローバルストア | 不使用（Context のみ） | ログイン・サーバー不要のシンプルな要件 |
| ドラッグ＆ドロップ | 上下ボタンのみ（初期実装） | 実装コスト削減・要件を満たす最小手段 |
| フォント配置 | public/fonts/ | Vite の静的ファイル配信・ビルド不要 |
| テスト | Vitest + fast-check | コーディング規約準拠・計算ロジックのプロパティテスト |

---

## Components and Interfaces

### Context / Provider インターフェイス

```typescript
// 設定ファイルを提供するContext
interface ConfigContextValue {
  config: AppConfig;
  isLoading: boolean;
  error: string | null;
}

// アプリ全体のステートとDispatchを提供するContext
interface AppStateContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

// 計算済みの導出値を提供するContext（パフォーマンス分離）
interface DerivedStateContextValue {
  worksheetAggregate: WorksheetAggregate;
  sectionQuantities: Record<string, number>;
  lineAmounts: LineAmountResult[];
  totals: TotalsResult;
}
```

### 主要コンポーネントの Props インターフェイス

```typescript
// WorkItemRow
interface WorkItemRowProps {
  item: WorkItem;
  index: number;
  phaseResult: WorkItemPhaseResult;
  onUpdate: (id: string, patch: Partial<WorkItem>) => void;
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  isFirst: boolean;
  isLast: boolean;
}

// ManualLineItemRow
interface ManualLineItemRowProps {
  item: ManualLineItem;
  amount: number; // 計算済み金額（円未満切り捨て済み）
  onUpdate: (id: string, patch: Partial<ManualLineItem>) => void;
  onDelete: (id: string) => void;
  errors: Record<string, string>; // field名 → エラーメッセージ
}

// EstimatePreview（プレビュー + PDF両用）
interface EstimatePreviewProps {
  header: EstimateHeader;
  companyInfo: CompanyInfo;
  autoSections: AutoSectionLine[]; // 自動生成明細行
  manualItems: ManualLineItem[];
  lineAmounts: LineAmountResult[];
  totals: TotalsResult;
}

// PdfExportButton
interface PdfExportButtonProps {
  onValidationError: (errors: FieldError[]) => void;
}
```

### Domain 関数の入出力インターフェイス

```typescript
// worksheet.ts の出力
interface WorksheetAggregate {
  perItem: WorkItemPhaseResult[];           // 行ごとの工程工数
  phaseTotals: Record<string, number>;      // 工程別合計
  grandTotal: number;                       // 総合計工数
}

// estimate.ts の出力
interface LineAmountResult {
  sectionName: string;  // 区分名または品名
  quantity: number;
  unitPrice: number;
  amount: number;       // Math.floor(quantity * unitPrice)
  isManual: boolean;
}

interface TotalsResult {
  subtotal: number;
  taxAmount: number;    // Math.floor(subtotal * 0.1)
  totalAmount: number;  // subtotal + taxAmount
}

// validation.ts の出力
interface FieldError {
  field: string;    // フィールドの識別子（例: 'header.issueDate'）
  message: string;  // ユーザー向けエラーメッセージ（日本語）
}
```

---

## Error Handling

### 設定ファイル読み込みエラー

| 状況 | 挙動 |
|---|---|
| `config.json` が存在しない | `config.sample.json` の読み込みにフォールバック |
| `config.sample.json` も存在しない | ハードコードのデフォルト値で起動継続、コンソールにエラー出力 |
| JSON パースエラー | 同上（デフォルト値にフォールバック） |
| `phaseCoefficients` に範囲外の値 | 該当フィールドのみデフォルト係数に置き換え、他フィールドは使用 |

### PDF 生成エラー

- `PdfExportButton` の `try/catch` でキャッチし、`<ErrorMessage>` コンポーネントでユーザーに表示する
- エラー後はボタンを再度 `enabled` にして再試行を可能にする

### sessionStorage 読み込みエラー

- JSON パースエラーや `version` 不一致の場合は保存データを破棄し、空の初期状態で起動する
- エラー内容はコンソールに出力するが、ユーザーへのダイアログは表示しない

### 入力バリデーションエラー

- フィールド単位でリアルタイムにエラー表示（200ms 以内に解除）
- PDF 書き出しボタンクリック時は `validateForExport()` で全エラーを一括収集し同時表示する

---

## Correctness Properties

計算ロジックに対して Vitest + fast-check でプロパティテストを実施する。

### Property 1: 工数の非負性

`manufacturingDays >= 0` を満たす入力に対して、すべての工程工数の計算結果は `>= 0` であること。

**Validates: Requirements 2.1, 2.7**

### Property 3: 工数の端数処理

任意の有効な入力に対して、各工程工数は `Math.round(x * 100) / 100` と等価な小数第2位までの値であること。

**Validates: Requirements 2.7**

### Property 4: 工数合計の整合性

`worksheetAggregate.grandTotal === sum(perItem[i].rowTotal)` がすべての入力に対して成立すること。

**Validates: Requirements 2.4, 2.5**

### Property 5: 明細金額の切り捨て

任意の有効な数量 `q`・単価 `p` に対して `computeLineAmount(q, p) === Math.floor(q * p)` が成立すること。

**Validates: Requirements 5.8**

### Property 6: 消費税の切り捨て

任意の小計 `s` に対して `taxAmount === Math.floor(s * 0.1)` が成立すること。

**Validates: Requirements 6.2**

### Property 7: 税込合計の整合性

`totalAmount === subtotal + taxAmount` がすべての入力に対して成立すること。

**Validates: Requirements 6.2, 6.4**

### Property 8: セッションデータのラウンドトリップ

任意の有効な `SessionData` オブジェクトを JSON シリアライズ → デシリアライズした結果が、すべてのフィールドで元のオブジェクトと等値であること。

**Validates: Requirements 8.5**

---

## Testing Strategy

### 単体テスト（Vitest）

| テスト対象 | ファイル | 主なケース |
|---|---|---|
| `computePhaseEfforts` | `worksheet.test.ts` | 通常値・0・端数処理 |
| `aggregateWorksheet` | `worksheet.test.ts` | 複数行の合計・空配列 |
| `computeLineAmount` | `estimate.test.ts` | 円未満切り捨て・0・上限値 |
| `computeTotals` | `estimate.test.ts` | 消費税切り捨て・空配列 |
| `parseConfig` | `config.test.ts` | 正常・不正値フォールバック・欠損キー |
| `validateForExport` | `validation.test.ts` | 全エラー同時検出・正常通過 |
| `loadSession` | `sessionRoundtrip.test.ts` | 復元・バージョン不一致破棄・不正形式破棄 |

### プロパティベーステスト（fast-check）

- `computePhaseEfforts`: 任意の非負数入力に対して端数処理・非負性を検証（Property 1〜3）
- `computeLineAmount`: 数量を100倍した整数演算での期待値と一致することを検証（Property 5。実装と同じ式では検証しない）
- `computeTotals`: 任意の金額配列に対して消費税切り捨て・合計整合性を検証（Property 6〜7）
- `loadSession`: 任意の有効な SessionData の JSON ラウンドトリップで等価性を検証（Property 8）

### 浮動小数点の回帰テスト

- `computeLineAmount(0.29, 50000) === 14500` など、素朴な `Math.floor(q * p)` では 1 円下振れする組み合わせを明示的に検証する
- `roundEffort(1.005) === 1.01` など、素朴な `Math.round(x * 100)` では切り下がる境界値を明示的に検証する

### コンポーネントテスト

コンポーネントテストは初期実装のスコープ外とし、ドメインロジックのテストを優先する。
