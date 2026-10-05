import type { ReactNode } from 'react';
import type { DailyRateMap } from '../../types';

interface DailyRateSettingsProps {
  dailyRates: DailyRateMap;
  sectionNames: string[];
  onUpdate: (patch: Partial<DailyRateMap>) => void;
}

/**
 * 人日単価の設定UI。共通デフォルト単価と区分別オーバーライドを編集できる。
 */
export function DailyRateSettings({
  dailyRates,
  sectionNames,
  onUpdate,
}: DailyRateSettingsProps): ReactNode {
  const updateOverride = (section: string, value: string): void => {
    const overrides = { ...dailyRates.overrides };
    if (value === '') {
      delete overrides[section];
    } else {
      overrides[section] = Number(value);
    }
    onUpdate({ overrides });
  };

  return (
    <div className="daily-rate-settings">
      <h2>人日単価設定</h2>
      <label className="rate-default">
        共通単価（人日）
        <input
          type="number"
          min={0}
          max={999999999}
          value={dailyRates.default}
          aria-label="共通人日単価"
          onChange={(e) => onUpdate({ default: Number(e.target.value) })}
        />
      </label>

      <details className="rate-overrides">
        <summary>区分別の個別単価を設定する</summary>
        <div className="rate-override-grid">
          {sectionNames.map((section) => (
            <label key={section}>
              {section}
              <input
                type="number"
                min={0}
                max={999999999}
                placeholder={`共通: ${dailyRates.default}`}
                value={dailyRates.overrides[section] ?? ''}
                aria-label={`${section} の人日単価`}
                onChange={(e) => updateOverride(section, e.target.value)}
              />
            </label>
          ))}
        </div>
      </details>
    </div>
  );
}
