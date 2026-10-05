import { useEffect, useRef } from 'react';
import { SESSION_DATA_VERSION, SESSION_STORAGE_KEY, type SessionData } from '../types';
import { toSessionData, type AppState } from './useAppState';

/**
 * sessionStorageから保存データを読み込んで復元する
 * - キーが存在しない、またはパース失敗・バージョン不一致の場合は null を返す
 */
export function loadSession(): SessionData | null {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (raw === null) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!isValidSessionData(parsed)) {
      console.error('sessionStorage のデータ形式が不正です。破棄して初期状態で起動します。');
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }

    if (parsed.version !== SESSION_DATA_VERSION) {
      console.error('sessionStorage のスキーマバージョンが不一致です。破棄して初期状態で起動します。');
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch {
    console.error('sessionStorage の読み込みに失敗しました。初期状態で起動します。');
    return null;
  }
}

/** unknown が SessionData の形をしているか検証する型ガード */
function isValidSessionData(value: unknown): value is SessionData {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    Array.isArray(obj['workItems']) &&
    typeof obj['estimateHeader'] === 'object' &&
    obj['estimateHeader'] !== null &&
    Array.isArray(obj['manualLineItems']) &&
    typeof obj['dailyRates'] === 'object' &&
    obj['dailyRates'] !== null &&
    typeof obj['version'] === 'string'
  );
}

/**
 * AppStateの変更を監視してdebounce(3000ms)でsessionStorageに自動保存する
 */
export function useSessionPersistence(state: AppState): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      try {
        const data = toSessionData(state);
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data));
      } catch {
        console.error('sessionStorage への保存に失敗しました。');
      }
    }, 3000);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, [state]);
}

