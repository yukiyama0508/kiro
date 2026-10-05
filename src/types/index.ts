// ============================================================
// 工数明細シート関連
// ============================================================

/** WorkItemの状態 */
export type WorkItemStatus = '新規' | '変更' | '変更なし' | '削除';

/** 工数明細シートの1行分 */
export interface WorkItem {
  id: string;               // UUID
  feature: string;          // 機能・要望
  category: string;         // 対応カテゴリ
  status: WorkItemStatus;   // 状態
  note: string;             // 備考
  manufacturingDays: number; // 製造工数（人日）
}

/** 工数明細の計算結果（1行分） */
export interface WorkItemPhaseResult {
  workItemId: string;
  phases: Record<string, number>; // 工程名 → 工数（小数第2位まで）
  rowTotal: number;
}

/** WorksheetViewの集計結果 */
export interface WorksheetAggregate {
  perItem: WorkItemPhaseResult[];      // 行ごとの工程工数
  phaseTotals: Record<string, number>; // 工程別合計
  grandTotal: number;                  // 総合計工数
}

// ============================================================
// 見積書関連
// ============================================================

/** 見積書ヘッダー */
export interface EstimateHeader {
  issueDate: string;      // 発行日 (YYYY-MM-DD)
  estimateNumber: string; // 見積番号
  clientName: string;     // 宛先会社名
  subject: string;        // 件名
  validUntil: string;     // 有効期限 (YYYY-MM-DD)
  notes: string;          // 備考文
}

/** 手動追加明細行（運用保守費など） */
export interface ManualLineItem {
  id: string;
  name: string;      // 品名
  quantity: number;  // 数量
  unit: string;      // 単位
  unitPrice: number; // 単価
}

/** 区分別単価マップ */
export interface DailyRateMap {
  default: number;
  overrides: Record<string, number>; // EstimateSection名 → 単価
}

/** 明細行の金額計算結果 */
export interface LineAmountResult {
  sectionName: string; // 区分名または品名
  quantity: number;
  unitPrice: number;
  amount: number;      // Math.floor(quantity * unitPrice)
  isManual: boolean;
}

/** 小計・消費税・税込合計 */
export interface TotalsResult {
  subtotal: number;
  taxAmount: number;   // Math.floor(subtotal * 0.1)
  totalAmount: number; // subtotal + taxAmount
}

// ============================================================
// 設定ファイル関連
// ============================================================

/** 自社情報（config.json から読み込む） */
export interface CompanyInfo {
  name: string;
  contact: string;
  address: string;
  tel: string;
  email: string;
  registrationNumber: string;
}

/** 工程係数マップ。Phase名をキー、0より大きく1以下の係数を値とする */
export type PhaseCoefficientMap = Record<string, number>;

/** 設定ファイル全体 */
export interface AppConfig {
  companyInfo: CompanyInfo;
  phaseCoefficients: PhaseCoefficientMap;
  /** EstimateSection名をキー、対応するPhase名の配列を値とする */
  sectionMappings: Record<string, string[]>;
}

// ============================================================
// バリデーション関連
// ============================================================

/** バリデーションエラー（フィールド識別子 + 日本語メッセージ） */
export interface FieldError {
  field: string;   // 例: 'header.issueDate'、'workItem.manufacturingDays'
  message: string; // ユーザー向けエラーメッセージ（日本語）
}

// ============================================================
// sessionStorage 保存データ
// ============================================================

/** sessionStorage に保存するアプリ全体の状態 */
export interface SessionData {
  workItems: WorkItem[];
  estimateHeader: EstimateHeader;
  manualLineItems: ManualLineItem[];
  dailyRates: DailyRateMap;
  version: string; // スキーマバージョン（破壊的変更検出用）
}

// ============================================================
// 定数
// ============================================================

/** 対応カテゴリの選択肢 */
export const WORK_ITEM_CATEGORIES: string[] = [
  'A. 認証・ログイン',
  'B. ダッシュボード',
  'C. データ入力・フォーム',
  'D. 一覧・検索',
  'E. 詳細・閲覧',
  'F. 通知・メール',
  'G. レポート・集計',
  'H. 管理機能',
  'I. API連携',
  'J. インフラ・設定',
  'K. その他',
];

/** WorkItemの状態の選択肢 */
export const WORK_ITEM_STATUSES: WorkItemStatus[] = [
  '新規',
  '変更',
  '変更なし',
  '削除',
];

/** sessionStorageのキー */
export const SESSION_STORAGE_KEY = 'estimate-generator:session';

/** sessionDataのスキーマバージョン */
export const SESSION_DATA_VERSION = '1.0';

/** デフォルトの工程係数 */
export const DEFAULT_PHASE_COEFFICIENTS: PhaseCoefficientMap = {
  進行管理: 0.15,
  要件定義: 0.20,
  基本設計: 0.30,
  レビュー: 0.05,
  テスト設計: 0.05,
  テスト: 0.15,
  ユーザテストFB: 0.02,
  リリース: 0.02,
};

/** デフォルトのEstimateSectionマッピング */
export const DEFAULT_SECTION_MAPPINGS: Record<string, string[]> = {
  要件定義: ['要件定義'],
  管理: ['進行管理'],
  設計: ['基本設計'],
  製造: ['製造'],
  テスト: ['レビュー', 'テスト設計', 'テスト', 'ユーザテストFB'],
  リリース: ['リリース'],
};

/** デフォルトのCompanyInfo（フォールバック用） */
export const DEFAULT_COMPANY_INFO: CompanyInfo = {
  name: '（会社名未設定）',
  contact: '（担当者未設定）',
  address: '（住所未設定）',
  tel: '（TEL未設定）',
  email: '（メール未設定）',
  registrationNumber: '（登録番号未設定）',
};
