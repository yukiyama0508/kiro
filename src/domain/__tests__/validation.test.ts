import { describe, expect, it } from 'vitest';
import { validateForExport } from '../validation';
import type { EstimateHeader, ManualLineItem, WorkItem } from '../../types';

const validHeader: EstimateHeader = {
  issueDate: '2026-01-01',
  estimateNumber: 'EST-001',
  clientName: '株式会社サンプル',
  subject: 'システム開発',
  validUntil: '2026-02-01',
  notes: '',
};

const makeWorkItem = (days: number): WorkItem => ({
  id: '1',
  feature: '機能A',
  category: 'A. 認証・ログイン',
  status: '新規',
  note: '',
  manufacturingDays: days,
});

const makeManualItem = (quantity: number, unitPrice: number): ManualLineItem => ({
  id: '1',
  name: '運用保守',
  quantity,
  unit: '式',
  unitPrice,
});

describe('validateForExport', () => {
  it('正常な入力ではエラーなし', () => {
    const errors = validateForExport(validHeader, [makeWorkItem(10)], []);
    expect(errors).toHaveLength(0);
  });

  it('発行日が空ならエラー', () => {
    const errors = validateForExport({ ...validHeader, issueDate: '' }, [], []);
    expect(errors.some((e) => e.field === 'header.issueDate')).toBe(true);
  });

  it('必須フィールドが全て空なら3件のエラーを同時返却', () => {
    const errors = validateForExport(
      { ...validHeader, issueDate: '', clientName: '', subject: '' },
      [],
      [],
    );
    expect(errors.filter((e) => e.field.startsWith('header.'))).toHaveLength(3);
  });

  it('必須フィールドエラーと数値上限エラーを同時に返却する', () => {
    const errors = validateForExport(
      { ...validHeader, issueDate: '' },
      [makeWorkItem(1000000)], // 上限超過
      [],
    );
    expect(errors.some((e) => e.field === 'header.issueDate')).toBe(true);
    expect(errors.some((e) => e.field.includes('manufacturingDays'))).toBe(true);
  });

  it('製造工数が負ならエラー', () => {
    const errors = validateForExport(validHeader, [makeWorkItem(-1)], []);
    expect(errors.some((e) => e.field.includes('manufacturingDays'))).toBe(true);
  });

  it('手動行の単価が上限超過ならエラー', () => {
    const errors = validateForExport(validHeader, [], [makeManualItem(1, 1000000000)]);
    expect(errors.some((e) => e.field.includes('unitPrice'))).toBe(true);
  });

  it('手動行の数量が負ならエラー', () => {
    const errors = validateForExport(validHeader, [], [makeManualItem(-5, 10000)]);
    expect(errors.some((e) => e.field.includes('quantity'))).toBe(true);
  });
});
