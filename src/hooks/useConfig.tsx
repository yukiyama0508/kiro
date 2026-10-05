import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  DEFAULT_COMPANY_INFO,
  DEFAULT_PHASE_COEFFICIENTS,
  DEFAULT_SECTION_MAPPINGS,
  type AppConfig,
} from '../types';
import { parseConfig } from '../domain/config';

interface ConfigContextValue {
  config: AppConfig;
  isLoading: boolean;
  error: string | null;
}

const ConfigContext = createContext<ConfigContextValue | null>(null);

/** ハードコードされたデフォルト設定 */
const DEFAULT_CONFIG: AppConfig = {
  companyInfo: { ...DEFAULT_COMPANY_INFO },
  phaseCoefficients: { ...DEFAULT_PHASE_COEFFICIENTS },
  sectionMappings: { ...DEFAULT_SECTION_MAPPINGS },
};

/**
 * config.json → config.sample.json → デフォルト値の順でフォールバック読み込みする
 */
async function loadConfig(): Promise<{ config: AppConfig; error: string | null }> {
  const candidates = ['/config.json', '/config.sample.json'];

  for (const path of candidates) {
    try {
      const res = await fetch(path);
      if (!res.ok) continue;
      const raw: unknown = await res.json();
      return { config: parseConfig(raw), error: null };
    } catch {
      // 次の候補を試す
      continue;
    }
  }

  // すべて失敗 → デフォルト値で起動継続
  const message = 'config.json / config.sample.json の読み込みに失敗しました。デフォルト値で起動します。';
  console.error(message);
  return { config: DEFAULT_CONFIG, error: message };
}

export function ConfigProvider({ children }: { children: ReactNode }): ReactNode {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadConfig().then((result) => {
      if (cancelled) return;
      setConfig(result.config);
      setError(result.error);
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ConfigContext.Provider value={{ config, isLoading, error }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig(): ConfigContextValue {
  const ctx = useContext(ConfigContext);
  if (ctx === null) {
    throw new Error('useConfig must be used within ConfigProvider');
  }
  return ctx;
}
