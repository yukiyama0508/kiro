import {
  DEFAULT_SECTION_MAPPINGS,
  type LineAmountResult,
  type ManualLineItem,
  type TotalsResult,
  type WorksheetAggregate,
} from '../types';

/**
 * WorksheetAggregate の工程別合計を EstimateSection にマッピングして
 * 区分ごとの数量（人日）を算出する
 */
export function computeSectionQuantities(
  aggregate: WorksheetAggregate,
  sectionMappings: Record<string, string[]> = DEFAULT_SECTION_MAPPINGS,
): Record<string, number> {
  const result: Record<string, number> = {};

  for (const [section, phases] of Object.entries(sectionMappings)) {
    let total = 0;
    for (const phase of phases) {
      total += aggregate.phaseTotals[phase] ?? 0;
    }
    // 各区分の合計も小数第2位まで
    result[section] = Math.round(total * 100) / 100;
  }

  return result;
}

/**
 * 1行の金額を計算する（円未満切り捨て）。
 * 数量は小数第2位まで有効なので、`quantity * unitPrice` を直接 Math.floor すると
 * 浮動小数点誤差で 1 円下振れすることがある（例: 0.29 * 50000 = 14499.999…）。
 * 数量を 100 倍した整数に正規化し、整数演算で金額を算出してから円未満を切り捨てる。
 */
export function computeLineAmount(quantity: number, unitPrice: number): number {
  // 数量を小数第2位までの整数（×100）に正規化。丸めで誤差を吸収する。
  const quantityTimes100 = Math.round(quantity * 100);
  return Math.floor((quantityTimes100 * unitPrice) / 100);
}

/**
 * 自動生成明細行 + 手動追加行の金額リストを作成する
 */
export function computeLineAmounts(
  sectionQuantities: Record<string, number>,
  sectionOrder: string[],
  dailyRateDefault: number,
  dailyRateOverrides: Record<string, number>,
  manualItems: ManualLineItem[],
): LineAmountResult[] {
  const autoLines: LineAmountResult[] = sectionOrder
    .filter((section) => section in sectionQuantities)
    .map((section) => {
      const quantity = sectionQuantities[section] ?? 0;
      const unitPrice = dailyRateOverrides[section] ?? dailyRateDefault;
      return {
        sectionName: section,
        quantity,
        unitPrice,
        amount: computeLineAmount(quantity, unitPrice),
        isManual: false,
      };
    });

  const manualLines: LineAmountResult[] = manualItems.map((item) => ({
    sectionName: item.name,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    amount: computeLineAmount(item.quantity, item.unitPrice),
    isManual: true,
  }));

  return [...autoLines, ...manualLines];
}

/**
 * 小計・消費税・税込合計を計算する
 * - 消費税: Math.floor(subtotal * 0.1)
 */
export function computeTotals(lineAmounts: number[]): TotalsResult {
  const subtotal = lineAmounts.reduce((sum, a) => sum + a, 0);
  const taxAmount = Math.floor(subtotal * 0.1);
  const totalAmount = subtotal + taxAmount;
  return { subtotal, taxAmount, totalAmount };
}
