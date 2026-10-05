import type { ReactNode } from 'react';

export type TabKey = 'worksheet' | 'estimate';

interface TabBarProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}

const TABS: { key: TabKey; label: string }[] = [
  { key: 'worksheet', label: '工数明細シート' },
  { key: 'estimate', label: '見積書' },
];

export function TabBar({ active, onChange }: TabBarProps): ReactNode {
  return (
    <div className="tab-bar" role="tablist" aria-label="ビュー切り替え">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          role="tab"
          type="button"
          aria-selected={active === tab.key}
          className={`tab-button${active === tab.key ? ' tab-button--active' : ''}`}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
