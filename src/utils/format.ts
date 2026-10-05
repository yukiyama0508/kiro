/**
 * 数値を日本円形式（¥1,234,567）にフォーマットする
 */
export function formatCurrency(value: number): string {
  return `¥${Math.floor(value).toLocaleString('ja-JP')}`;
}

/**
 * 工数（人日）を小数第2位まで表示する
 * 例: 1.5 → "1.50"、1 → "1.00"
 */
export function formatEffort(value: number): string {
  return value.toFixed(2);
}

/**
 * ISO日付文字列（YYYY-MM-DD）を日本語表示（YYYY年MM月DD日）に変換する
 */
export function formatDateJp(isoDate: string): string {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  if (!year || !month || !day) return isoDate;
  return `${year}年${parseInt(month, 10)}月${parseInt(day, 10)}日`;
}

/**
 * ISO日付文字列をファイル名用の文字列（YYYYMMDD）に変換する
 */
export function formatDateForFilename(isoDate: string): string {
  if (!isoDate) return '不明';
  return isoDate.replace(/-/g, '');
}

/**
 * 今日の日付を YYYY-MM-DD 形式で返す
 */
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
