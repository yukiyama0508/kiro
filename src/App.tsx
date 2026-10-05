import { useReducer, useState, type ReactNode } from 'react';
import './App.css';
import { TabBar, type TabKey } from './components/common/TabBar';
import { ConfigProvider, useConfig } from './hooks/useConfig';
import {
  appReducer,
  AppStateContext,
  createInitialState,
  type AppState,
} from './hooks/useAppState';
import { loadSession, useSessionPersistence } from './hooks/useSessionPersistence';
import { WorksheetView } from './components/worksheet/WorksheetView';
import { EstimateView } from './components/estimate/EstimateView';

/**
 * アプリ本体。ConfigProviderの内側でステートを管理する。
 */
function AppInner(): ReactNode {
  const { isLoading } = useConfig();
  const [activeTab, setActiveTab] = useState<TabKey>('worksheet');

  // 起動時にsessionStorageから復元（なければ初期状態）
  const [state, dispatch] = useReducer(
    appReducer,
    undefined,
    (): AppState => {
      const restored = loadSession();
      if (restored === null) return createInitialState();
      return {
        workItems: restored.workItems,
        estimateHeader: restored.estimateHeader,
        manualLineItems: restored.manualLineItems,
        dailyRates: restored.dailyRates,
      };
    },
  );

  // sessionStorageへの自動保存
  useSessionPersistence(state);

  if (isLoading) {
    return <div className="app-loading">設定を読み込んでいます…</div>;
  }

  return (
    <AppStateContext.Provider value={{ state, dispatch }}>
      <div className="app">
        <header className="app-header">
          <h1>見積書ジェネレーター</h1>
          <TabBar active={activeTab} onChange={setActiveTab} />
        </header>
        <main className="app-main">
          {activeTab === 'worksheet' ? <WorksheetView /> : <EstimateView />}
        </main>
      </div>
    </AppStateContext.Provider>
  );
}

function App(): ReactNode {
  return (
    <ConfigProvider>
      <AppInner />
    </ConfigProvider>
  );
}

export default App;
