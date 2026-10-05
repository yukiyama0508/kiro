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
 * 1行の金額を計算する（円未満切り捨て）
 * Math.floor(quantity * unitPrice)
 */
export function computeLineAmount(quantity: number, unitPrice: number): number {
  return Math.floor(quantity * unitPrice);
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
