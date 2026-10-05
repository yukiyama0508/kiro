import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { aggregateWorksheet, computePhaseEfforts, roundEffort } from '../worksheet';
import { DEFAULT_PHASE_COEFFICIENTS, type WorkItem } from '../../types';

describe('roundEffort', () => {
  it('小数第3位以下を四捨五入する', () => {
    expect(roundEffort(1.234)).toBe(1.23);
    expect(roundEffort(1.235)).toBe(1.24);
    expect(roundEffort(1.236)).toBe(1.24);
  });

  it('整数はそのまま', () => {
    expect(roundEffort(5)).toBe(5);
  });

  it('0は0', () => {
    expect(roundEffort(0)).toBe(0);
  });
});

describe('computePhaseEfforts', () => {
  it('製造工数に係数を掛けて各工程を算出する', () => {
    const result = computePhaseEfforts(10, DEFAULT_PHASE_COEFFICIENTS, '新規');
    expect(result['製造']).toBe(10);
    expect(result['進行管理']).toBe(1.5); // 10 * 0.15
    expect(result['要件定義']).toBe(2.0); // 10 * 0.20
    expect(result['基本設計']).toBe(3.0); // 10 * 0.30
    expect(result['レビュー']).toBe(0.5); // 10 * 0.05
    expect(result['リリース']).toBe(0.2); // 10 * 0.02
  });

  it('状態が「変更なし」の場合は全工程が0', () => {
    const result = computePhaseEfforts(10, DEFAULT_PHASE_COEFFICIENTS, '変更なし');
    expect(result['製造']).toBe(0);
    for (const phase of Object.keys(DEFAULT_PHASE_COEFFICIENTS)) {
      expect(result[phase]).toBe(0);
    }
  });

  it('製造工数0のとき全工程が0', () => {
    const result = computePhaseEfforts(0, DEFAULT_PHASE_COEFFICIENTS, '新規');
    expect(result['製造']).toBe(0);
    expect(result['進行管理']).toBe(0);
  });

  it('小数第2位まで四捨五入される', () => {
    // 3.333 * 0.15 = 0.49995 → 0.50
    const result = computePhaseEfforts(3.333, DEFAULT_PHASE_COEFFICIENTS, '新規');
    expect(result['進行管理']).toBe(0.5);
  });

  // Property 1: 非負性
  it('[Property 1] 製造工数>=0ならすべての工程工数>=0', () => {
    fc.assert(
      fc.property(fc.double({ min: 0, max: 999999, noNaN: true }), (days) => {
        const result = computePhaseEfforts(days, DEFAULT_PHASE_COEFFICIENTS, '新規');
        return Object.values(result).every((v) => v >= 0);
      }),
    );
  });

  // Property 2: 変更なし行のゼロ化
  it('[Property 2] 変更なしのとき全工程が0', () => {
    fc.assert(
      fc.property(fc.double({ min: 0, max: 999999, noNaN: true }), (days) => {
        const result = computePhaseEfforts(days, DEFAULT_PHASE_COEFFICIENTS, '変更なし');
        return Object.values(result).every((v) => v === 0);
      }),
    );
  });

  // Property 3: 端数処理
  it('[Property 3] 各工程工数は小数第2位までの値', () => {
    fc.assert(
      fc.property(fc.double({ min: 0, max: 999999, noNaN: true }), (days) => {
        const result = computePhaseEfforts(days, DEFAULT_PHASE_COEFFICIENTS, '新規');
        return Object.values(result).every((v) => v === Math.round(v * 100) / 100);
      }),
    );
  });
});

describe('aggregateWorksheet', () => {
  const makeItem = (id: string, days: number, status: WorkItem['status'] = '新規'): WorkItem => ({
    id,
    feature: `機能${id}`,
    category: 'A. 認証・ログイン',
    status,
    note: '',
    manufacturingDays: days,
  });

  it('複数行の工程別合計を算出する', () => {
    const items = [makeItem('1', 10), makeItem('2', 20)];
    const result = aggregateWorksheet(items, DEFAULT_PHASE_COEFFICIENTS);
    expect(result.phaseTotals['製造']).toBe(30);
    expect(result.phaseTotals['進行管理']).toBe(4.5); // 1.5 + 3.0
  });

  it('全行変更なしのとき総合計0', () => {
    const items = [makeItem('1', 10, '変更なし'), makeItem('2', 20, '変更なし')];
    const result = aggregateWorksheet(items, DEFAULT_PHASE_COEFFICIENTS);
    expect(result.grandTotal).toBe(0);
  });

  it('空配列のとき総合計0', () => {
    const result = aggregateWorksheet([], DEFAULT_PHASE_COEFFICIENTS);
    expect(result.grandTotal).toBe(0);
    expect(result.perItem).toHaveLength(0);
  });

  // Property 4: 合計一致
  it('[Property 4] grandTotalは各行rowTotalの合計', () => {
    fc.assert(
      fc.property(
        fc.array(fc.double({ min: 0, max: 9999, noNaN: true }), { maxLength: 20 }),
        (daysList) => {
          const items = daysList.map((d, i) => makeItem(String(i), d));
          const result = aggregateWorksheet(items, DEFAULT_PHASE_COEFFICIENTS);
          const sumOfRows = roundEffort(result.perItem.reduce((s, r) => s + r.rowTotal, 0));
          return result.grandTotal === sumOfRows;
        },
      ),
    );
  });
});
