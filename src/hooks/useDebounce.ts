import { useEffect, useState } from 'react';

/**
 * 値の変更をdebounceするフック
 * @param value 対象の値
 * @param delayMs 遅延ミリ秒
 * @returns debounceされた値
 */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(value);
    }, delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
