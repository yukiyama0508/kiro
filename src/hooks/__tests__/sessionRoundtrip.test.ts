import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fc from 'fast-check';
import { SESSION_DATA_VERSION, type SessionData } from '../../types';
import { loadSession } from '../useSessionPersistence';

// ============================================================
// sessionStorage のインメモリモック
// ============================================================
function installSessionStorageMock(): void {
  const store = new Map<string, string>();
  const mock: Storage = {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  };
  vi.stubGlobal('sessionStorage', mock);
  vi.stubGlobal('console', { ...console, error: vi.fn() });
}

// fast-check で有効な SessionData を生成する arbitrary
const sessionDataArb: fc.Arbitrary<SessionData> = fc.record({
  workItems: fc.array(
    fc.record({
      id: fc.uuid(),
      feature: fc.string(),
      category: fc.string(),
      status: fc.constantFrom('新規', '変更', '変更なし', '削除'),
      note: fc.string(),
      manufacturingDays: fc.double({ min: 0, max: 999999, noNaN: true }),
    }),
    { maxLength: 10 },
  ),
  estimateHeader: fc.record({
    issueDate: fc.string(),
    estimateNumber: fc.string(),
    clientName: fc.string(),
    subject: fc.string(),
    validUntil: fc.string(),
    notes: fc.string(),
  }),
  manualLineItems: fc.array(
    fc.record({
      id: fc.uuid(),
      name: fc.string(),
      quantity: fc.double({ min: 0, max: 999999, noNaN: true }),
      unit: fc.string(),
      unitPrice: fc.double({ min: 0, max: 999999999, noNaN: true }),
    }),
    { maxLength: 10 },
  ),
  dailyRates: fc.record({
    default: fc.double({ min: 0, max: 999999999, noNaN: true }),
    overrides: fc.dictionary(fc.string(), fc.double({ min: 0, max: 999999999, noNaN: true })),
  }),
  version: fc.constant(SESSION_DATA_VERSION),
});

describe('sessionStorage ラウンドトリップ', () => {
  beforeEach(() => {
    installSessionStorageMock();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('保存した SessionData を loadSession で復元できる', () => {
    const data: SessionData = {
      workItems: [
        {
          id: 'a',
          feature: '認証機能',
          category: 'A. 認証・ログイン',
          status: '新規',
          note: 'メモ',
          manufacturingDays: 10,
        },
      ],
      estimateHeader: {
        issueDate: '2026-01-01',
        estimateNumber: 'EST-1',
        clientName: '株式会社サンプル',
        subject: '開発',
        validUntil: '2026-02-01',
        notes: '備考',
      },
      manualLineItems: [{ id: 'b', name: '保守', quantity: 1, unit: '式', unitPrice: 50000 }],
      dailyRates: { default: 50000, overrides: { 製造: 60000 } },
      version: SESSION_DATA_VERSION,
    };
    sessionStorage.setItem('estimate-generator:session', JSON.stringify(data));

    const restored = loadSession();
    expect(restored).toEqual(data);
  });

  // Property 8: ラウンドトリップ特性
  it('[Property 8] JSON シリアライズ→デシリアライズで元のオブジェクトと等価', () => {
    fc.assert(
      fc.property(sessionDataArb, (data) => {
        sessionStorage.setItem('estimate-generator:session', JSON.stringify(data));
        const restored = loadSession();
        expect(restored).toEqual(data);
      }),
    );
  });

  it('バージョン不一致のデータは破棄して null を返す', () => {
    const data = { workItems: [], estimateHeader: {}, manualLineItems: [], dailyRates: {}, version: '0.9' };
    sessionStorage.setItem('estimate-generator:session', JSON.stringify(data));
    expect(loadSession()).toBeNull();
  });

  it('不正な形式のデータは破棄して null を返す', () => {
    sessionStorage.setItem('estimate-generator:session', '{"broken": true}');
    expect(loadSession()).toBeNull();
  });

  it('キーが存在しない場合は null を返す', () => {
    expect(loadSession()).toBeNull();
  });
});
