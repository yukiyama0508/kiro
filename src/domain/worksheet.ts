import {
  DEFAULT_PHASE_COEFFICIENTS,
  type PhaseCoefficientMap,
  type WorkItem,
  type WorkItemPhaseResult,
  type WorksheetAggregate,
} from '../types';

/**
 * 工数を小数第2位に四捨五入する。
 * `value * 100` が浮動小数点誤差でわずかに下振れする（例: 1.005*100 = 100.49999…）と
 * Math.round が切り下がってしまうため、相対誤差分を補正してから丸める。
 */
export function roundEffort(value: number): number {
  const scaled = value * 100;
  // 相対的な誤差（EPSILON）を加味して本来の整数境界へ寄せる
  const corrected = Math.round(scaled + Math.sign(scaled) * Number.EPSILON * scaled);
  return corrected / 100;
}

/**
 * 1行分の工程工数を計算する
 * - 各工程の工数は製造工数 × 係数を小数第2位で四捨五入
 */
export function computePhaseEfforts(
  manufacturingDays: number,
  coefficients: PhaseCoefficientMap,
): Record<string, number> {
  const result: Record<string, number> = {
    製造: roundEffort(manufacturingDays),
  };

  for (const [phase, coeff] of Object.entries(coefficients)) {
    result[phase] = roundEffort(manufacturingDays * coeff);
  }

  return result;
}

/**
 * 全 WorkItem の工程別合計・総合計を集計する
 * phaseTotals には「製造」も含む
 */
export function aggregateWorksheet(
  items: WorkItem[],
  coefficients: PhaseCoefficientMap = DEFAULT_PHASE_COEFFICIENTS,
): WorksheetAggregate {
  const perItem: WorkItemPhaseResult[] = items.map((item) => {
    const phases = computePhaseEfforts(item.manufacturingDays, coefficients);
    const rowTotal = roundEffort(Object.values(phases).reduce((sum, v) => sum + v, 0));
    return { workItemId: item.id, phases, rowTotal };
  });

  // 工程別合計
  const phaseTotals: Record<string, number> = {};
  for (const { phases } of perItem) {
    for (const [phase, effort] of Object.entries(phases)) {
      phaseTotals[phase] = roundEffort((phaseTotals[phase] ?? 0) + effort);
    }
  }

  const grandTotal = roundEffort(perItem.reduce((sum, r) => sum + r.rowTotal, 0));

  return { perItem, phaseTotals, grandTotal };
}
