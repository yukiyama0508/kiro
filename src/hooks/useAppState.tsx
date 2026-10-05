import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react';
import {
  SESSION_DATA_VERSION,
  type DailyRateMap,
  type EstimateHeader,
  type ManualLineItem,
  type SessionData,
  type WorkItem,
} from '../types';
import { todayIso } from '../utils/format';

/** アプリ全体のステート */
export interface AppState {
  workItems: WorkItem[];
  estimateHeader: EstimateHeader;
  manualLineItems: ManualLineItem[];
  dailyRates: DailyRateMap;
}

/** アクション定義 */
export type AppAction =
  | { type: 'ADD_WORK_ITEM' }
  | { type: 'UPDATE_WORK_ITEM'; payload: { id: string; patch: Partial<WorkItem> } }
  | { type: 'DELETE_WORK_ITEM'; payload: { id: string } }
  | { type: 'MOVE_WORK_ITEM'; payload: { id: string; direction: 'up' | 'down' } }
  | { type: 'UPDATE_HEADER'; payload: Partial<EstimateHeader> }
  | { type: 'ADD_MANUAL_ITEM' }
  | { type: 'UPDATE_MANUAL_ITEM'; payload: { id: string; patch: Partial<ManualLineItem> } }
  | { type: 'DELETE_MANUAL_ITEM'; payload: { id: string } }
  | { type: 'UPDATE_DAILY_RATE'; payload: Partial<DailyRateMap> }
  | { type: 'RESTORE_SESSION'; payload: SessionData };

/** 一意なIDを生成する */
function genId(): string {
  return crypto.randomUUID();
}

/** 空のWorkItemを作成する */
function emptyWorkItem(): WorkItem {
  return {
    id: genId(),
    feature: '',
    category: 'A. 認証・ログイン',
    status: '新規',
    note: '',
    manufacturingDays: 0,
  };
}

/** 空のManualLineItemを作成する */
function emptyManualItem(): ManualLineItem {
  return {
    id: genId(),
    name: '',
    quantity: 1,
    unit: '式',
    unitPrice: 0,
  };
}

/** 初期ステートを生成する */
export function createInitialState(): AppState {
  return {
    workItems: [],
    estimateHeader: {
      issueDate: todayIso(),
      estimateNumber: '',
      clientName: '',
      subject: '',
      validUntil: '',
      notes: '',
    },
    manualLineItems: [],
    dailyRates: { default: 50000, overrides: {} },
  };
}

/** 配列内の要素を指定方向に移動する */
function moveItem<T>(arr: T[], index: number, direction: 'up' | 'down'): T[] {
  const target = direction === 'up' ? index - 1 : index + 1;
  if (target < 0 || target >= arr.length) return arr;
  const copy = [...arr];
  const [moved] = copy.splice(index, 1);
  copy.splice(target, 0, moved);
  return copy;
}

/** reducer本体 */
export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_WORK_ITEM':
      return { ...state, workItems: [...state.workItems, emptyWorkItem()] };

    case 'UPDATE_WORK_ITEM':
      return {
        ...state,
        workItems: state.workItems.map((item) =>
          item.id === action.payload.id ? { ...item, ...action.payload.patch } : item,
        ),
      };

    case 'DELETE_WORK_ITEM':
      return {
        ...state,
        workItems: state.workItems.filter((item) => item.id !== action.payload.id),
      };

    case 'MOVE_WORK_ITEM': {
      const index = state.workItems.findIndex((item) => item.id === action.payload.id);
      if (index === -1) return state;
      return { ...state, workItems: moveItem(state.workItems, index, action.payload.direction) };
    }

    case 'UPDATE_HEADER':
      return { ...state, estimateHeader: { ...state.estimateHeader, ...action.payload } };

    case 'ADD_MANUAL_ITEM':
      return { ...state, manualLineItems: [...state.manualLineItems, emptyManualItem()] };

    case 'UPDATE_MANUAL_ITEM':
      return {
        ...state,
        manualLineItems: state.manualLineItems.map((item) =>
          item.id === action.payload.id ? { ...item, ...action.payload.patch } : item,
        ),
      };

    case 'DELETE_MANUAL_ITEM':
      return {
        ...state,
        manualLineItems: state.manualLineItems.filter((item) => item.id !== action.payload.id),
      };

    case 'UPDATE_DAILY_RATE':
      return { ...state, dailyRates: { ...state.dailyRates, ...action.payload } };

    case 'RESTORE_SESSION':
      return {
        workItems: action.payload.workItems,
        estimateHeader: action.payload.estimateHeader,
        manualLineItems: action.payload.manualLineItems,
        dailyRates: action.payload.dailyRates,
      };

    default:
      return state;
  }
}

/** AppState を SessionData に変換する */
export function toSessionData(state: AppState): SessionData {
  return {
    workItems: state.workItems,
    estimateHeader: state.estimateHeader,
    manualLineItems: state.manualLineItems,
    dailyRates: state.dailyRates,
    version: SESSION_DATA_VERSION,
  };
}

// ============================================================
// Context
// ============================================================

export interface AppStateContextValue {
  state: AppState;
  dispatch: Dispatch<AppAction>;
}

export const AppStateContext = createContext<AppStateContextValue | null>(null);

interface AppStateProviderProps {
  children: ReactNode;
  initialState?: AppState;
}

export function AppStateProvider({ children, initialState }: AppStateProviderProps): ReactNode {
  const [state, dispatch] = useReducer(appReducer, initialState ?? createInitialState());
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateContextValue {
  const ctx = useContext(AppStateContext);
  if (ctx === null) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return ctx;
}
