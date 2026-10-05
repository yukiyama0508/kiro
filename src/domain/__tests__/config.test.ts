import { describe, expect, it } from 'vitest';
import { parseConfig, validateCoefficients } from '../config';
import { DEFAULT_COMPANY_INFO, DEFAULT_PHASE_COEFFICIENTS } from '../../types';

describe('validateCoefficients', () => {
  it('正常な係数はそのまま採用する', () => {
    const result = validateCoefficients({ 進行管理: 0.2 });
    expect(result['進行管理']).toBe(0.2);
  });

  it('0以下の係数はデフォルトにフォールバック', () => {
    const result = validateCoefficients({ 進行管理: 0 });
    expect(result['進行管理']).toBe(DEFAULT_PHASE_COEFFICIENTS['進行管理']);
  });

  it('1を超える係数はデフォルトにフォールバック', () => {
    const result = validateCoefficients({ 進行管理: 1.5 });
    expect(result['進行管理']).toBe(DEFAULT_PHASE_COEFFICIENTS['進行管理']);
  });

  it('数値以外はデフォルトにフォールバック', () => {
    const result = validateCoefficients({ 進行管理: 'abc' as unknown as number });
    expect(result['進行管理']).toBe(DEFAULT_PHASE_COEFFICIENTS['進行管理']);
  });
});

describe('parseConfig', () => {
  it('正常な設定をパースする', () => {
    const raw = {
      companyInfo: {
        name: '株式会社テスト',
        contact: '佐藤',
        address: '大阪府',
        tel: '06-0000-0000',
        email: 'test@test.com',
        registrationNumber: 'T9999',
      },
      phaseCoefficients: { 進行管理: 0.1 },
      sectionMappings: { 要件定義: ['要件定義'] },
    };
    const result = parseConfig(raw);
    expect(result.companyInfo.name).toBe('株式会社テスト');
    expect(result.phaseCoefficients['進行管理']).toBe(0.1);
    expect(result.sectionMappings['要件定義']).toEqual(['要件定義']);
  });

  it('nullのときデフォルト値を返す', () => {
    const result = parseConfig(null);
    expect(result.companyInfo).toEqual(DEFAULT_COMPANY_INFO);
    expect(result.phaseCoefficients).toEqual(DEFAULT_PHASE_COEFFICIENTS);
  });

  it('companyInfo欠損時はデフォルトを使用', () => {
    const result = parseConfig({ phaseCoefficients: { 進行管理: 0.1 } });
    expect(result.companyInfo).toEqual(DEFAULT_COMPANY_INFO);
  });

  it('不正なcompanyInfoフィールドはデフォルトで補完', () => {
    const result = parseConfig({ companyInfo: { name: '株式会社A' } });
    expect(result.companyInfo.name).toBe('株式会社A');
    expect(result.companyInfo.contact).toBe(DEFAULT_COMPANY_INFO.contact);
  });

  it('文字列など不正な型のときデフォルト値を返す', () => {
    const result = parseConfig('invalid');
    expect(result.companyInfo).toEqual(DEFAULT_COMPANY_INFO);
  });
});
