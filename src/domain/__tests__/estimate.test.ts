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

  // 浮動小数点の誤差で1円ずれないことを確認する回帰テスト
  it('浮動小数点誤差が出る組み合わせでも正しく計算する', () => {
    // 0.29 * 50000 = 14499.999999999998 になるが正しくは14500
    expect(computeLineAmount(0.29, 50000)).toBe(14500);
    // 0.57 * 50000 = 28499.999999999996 になるが正しくは28500
    expect(computeLineAmount(0.57, 50000)).toBe(28500);
  });

  // Property 5: 円未満切り捨て
  // 実装と同じ式(Math.floor(q*p))で検証すると実装のバグを見逃すため、
  // 数量を小数第2位までの整数（100倍）に正規化した整数演算で期待値を独立に算出する。
  it('[Property 5] 数量を100倍した整数演算での期待値と一致する', () => {
    fc.assert(
      fc.property(
        // 数量は小数第2位まで（0.00〜999999.99）を整数で表現
        fc.integer({ min: 0, max: 99999999 }),
        fc.integer({ min: 0, max: 999999999 }),
        (qTimes100, p) => {
          const quantity = qTimes100 / 100;
          // 期待値: (数量×100) × 単価 を整数で計算してから100で割って切り捨て
          const expected = Math.floor((qTimes100 * p) / 100);
          return computeLineAmount(quantity, p) === expected;
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
