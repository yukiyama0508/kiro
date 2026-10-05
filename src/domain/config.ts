import {
  DEFAULT_COMPANY_INFO,
  DEFAULT_PHASE_COEFFICIENTS,
  DEFAULT_SECTION_MAPPINGS,
  type AppConfig,
  type CompanyInfo,
  type PhaseCoefficientMap,
} from '../types';

/**
 * 係数値を検証し、範囲外（0以下または1超）ならデフォルト値にフォールバックする
 */
export function validateCoefficients(
  input: Record<string, unknown>,
  defaults: PhaseCoefficientMap = DEFAULT_PHASE_COEFFICIENTS,
): PhaseCoefficientMap {
  const result: PhaseCoefficientMap = { ...defaults };

  for (const [phase, value] of Object.entries(input)) {
    if (typeof value === 'number' && value > 0 && value <= 1) {
      result[phase] = value;
    }
    // 範囲外の値はデフォルト係数を使用（上書きしない）
  }

  return result;
}

/**
 * unknown な raw データを AppConfig に変換・バリデーションする
 * パース失敗した項目はデフォルト値にフォールバックする
 */
export function parseConfig(raw: unknown): AppConfig {
  if (typeof raw !== 'object' || raw === null) {
    return {
      companyInfo: { ...DEFAULT_COMPANY_INFO },
      phaseCoefficients: { ...DEFAULT_PHASE_COEFFICIENTS },
      sectionMappings: { ...DEFAULT_SECTION_MAPPINGS },
    };
  }

  const obj = raw as Record<string, unknown>;

  // companyInfo のパース
  const companyInfo = parseCompanyInfo(obj['companyInfo']);

  // phaseCoefficients のパース
  const rawCoeffs = obj['phaseCoefficients'];
  const phaseCoefficients =
    typeof rawCoeffs === 'object' && rawCoeffs !== null
      ? validateCoefficients(rawCoeffs as Record<string, unknown>)
      : { ...DEFAULT_PHASE_COEFFICIENTS };

  // sectionMappings のパース
  const sectionMappings = parseSectionMappings(obj['sectionMappings']);

  return { companyInfo, phaseCoefficients, sectionMappings };
}

/** companyInfo フィールドをパースする */
function parseCompanyInfo(raw: unknown): CompanyInfo {
  if (typeof raw !== 'object' || raw === null) {
    return { ...DEFAULT_COMPANY_INFO };
  }

  const obj = raw as Record<string, unknown>;
  return {
    name: typeof obj['name'] === 'string' ? obj['name'] : DEFAULT_COMPANY_INFO.name,
    contact: typeof obj['contact'] === 'string' ? obj['contact'] : DEFAULT_COMPANY_INFO.contact,
    address: typeof obj['address'] === 'string' ? obj['address'] : DEFAULT_COMPANY_INFO.address,
    tel: typeof obj['tel'] === 'string' ? obj['tel'] : DEFAULT_COMPANY_INFO.tel,
    email: typeof obj['email'] === 'string' ? obj['email'] : DEFAULT_COMPANY_INFO.email,
    registrationNumber:
      typeof obj['registrationNumber'] === 'string'
        ? obj['registrationNumber']
        : DEFAULT_COMPANY_INFO.registrationNumber,
  };
}

/** sectionMappings フィールドをパースする */
function parseSectionMappings(raw: unknown): Record<string, string[]> {
  if (typeof raw !== 'object' || raw === null) {
    return { ...DEFAULT_SECTION_MAPPINGS };
  }

  const obj = raw as Record<string, unknown>;
  const result: Record<string, string[]> = {};

  for (const [section, phases] of Object.entries(obj)) {
    if (
      Array.isArray(phases) &&
      phases.every((p): p is string => typeof p === 'string')
    ) {
      result[section] = phases;
    }
  }

  // 空なら全デフォルトを使用
  if (Object.keys(result).length === 0) {
    return { ...DEFAULT_SECTION_MAPPINGS };
  }

  return result;
}
