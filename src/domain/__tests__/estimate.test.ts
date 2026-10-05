import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { computeLineAmount, computeSectionQuantities, computeTotals } from '../estimate';
import { DEFAULT_SECTION_MAPPINGS, type WorksheetAggregate } from '../../types';

describe('computeLineAmount', () => {
  it('数量 × 単価の円未満を切り捨てる', () => {
    expect(computeLineAmount(1.5, 50000)).toBe(75000);
    expect(computeLineAmount(1.33, 60000)).toBe(79800); // 79800.0
    expect(computeLineAmount(0.33, 10000)).toBe(3300); // 3300.0
  });

  it('小数の金額は切り捨てる', () => {
    // 0.333 * 10000 = 3330.0 ではなく 3329.9999... になる場合も切り捨て
    expect(computeLineAmount(0.1, 999)).toBe(99); // 99.9 → 99
  });

  it('数量0なら0', () => {
    expect(computeLineAmount(0, 50000)).toBe(0);
  });

  it('単価0なら0', () => {
    expect(computeLineAmount(10, 0)).toBe(0);
  });

  // Property 5: 切り捨て
  it('[Property 5] computeLineAmount(q,p) === Math.floor(q*p)', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 999999, noNaN: true }),
        fc.double({ min: 0, max: 999999999, noNaN: true }),
        (q, p) => {
          return computeLineAmount(q, p) === Math.floor(q * p);
        },
      ),
    );
  });
});

describe('computeTotals', () => {
  it('小計・消費税・税込合計を計算する', () => {
    const result = computeTotals([100000, 200000]);
    expect(result.subtotal).toBe(300000);
    expect(result.taxAmount).toBe(30000); // 300000 * 0.1
    expect(result.totalAmount).toBe(330000);
  });

  it('消費税は円未満切り捨て', () => {
    // 小計 12345 → 税 1234.5 → 1234
    const result = computeTotals([12345]);
    expect(result.taxAmount).toBe(1234);
    expect(result.totalAmount).toBe(13579);
  });

  it('空配列なら全て0', () => {
    const result = computeTotals([]);
    expect(result.subtotal).toBe(0);
    expect(result.taxAmount).toBe(0);
    expect(result.totalAmount).toBe(0);
  });

  // Property 6: 消費税の切り捨て
  it('[Property 6] taxAmount === Math.floor(subtotal * 0.1)', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 999999999 }), { maxLength: 30 }),
        (amounts) => {
          const result = computeTotals(amounts);
          const subtotal = amounts.reduce((s, a) => s + a, 0);
          return result.taxAmount === Math.floor(subtotal * 0.1);
        },
      ),
    );
  });

  // Property 7: 税込合計の整合性
  it('[Property 7] totalAmount === subtotal + taxAmount', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 999999999 }), { maxLength: 30 }),
        (amounts) => {
          const result = computeTotals(amounts);
          return result.totalAmount === result.subtotal + result.taxAmount;
        },
      ),
    );
  });
});

describe('computeSectionQuantities', () => {
  const makeAggregate = (phaseTotals: Record<string, number>): WorksheetAggregate => ({
    perItem: [],
    phaseTotals,
    grandTotal: 0,
  });

  it('工程別合計を区分にマッピングする', () => {
    const aggregate = makeAggregate({
      要件定義: 2,
      進行管理: 1.5,
      基本設計: 3,
      製造: 10,
      レビュー: 0.5,
      テスト設計: 0.5,
      テスト: 1.5,
      ユーザテストFB: 0.2,
      リリース: 0.2,
    });
    const result = computeSectionQuantities(aggregate, DEFAULT_SECTION_MAPPINGS);
    expect(result['要件定義']).toBe(2);
    expect(result['管理']).toBe(1.5);
    expect(result['設計']).toBe(3);
    expect(result['製造']).toBe(10);
    // テスト = レビュー + テスト設計 + テスト + ユーザテストFB = 0.5+0.5+1.5+0.2 = 2.7
    expect(result['テスト']).toBe(2.7);
    expect(result['リリース']).toBe(0.2);
  });

  it('存在しない工程は0として扱う', () => {
    const aggregate = makeAggregate({});
    const result = computeSectionQuantities(aggregate, DEFAULT_SECTION_MAPPINGS);
    expect(result['テスト']).toBe(0);
  });
});
