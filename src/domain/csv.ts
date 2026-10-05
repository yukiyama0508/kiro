import type { WorkItem, WorksheetAggregate } from '../types';
import { formatEffort } from '../utils/format';

/**
 * 1つのCSVセル値を RFC 4180 に従ってエスケープする。
 * カンマ・ダブルクォート・改行（CR/LF）を含む場合はダブルクォートで囲み、
 * 内部のダブルクォートは 2 つ重ねてエスケープする。
 */
export function escapeCsvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** 1行分のセル配列を CSV の1行文字列に変換する */
function toCsvRow(cells: string[]): string {
  return cells.map(escapeCsvCell).join(',');
}

/**
 * 工数明細シートを CSV 文字列に変換する。
 * - ヘッダー行: No・機能・要望・備考・製造工数・各Phase工数・行合計
 * - 各 WorkItem 行
 * - 合計行: 工程別合計・総合計
 * 工程工数は小数第2位まで（formatEffort）で出力する。
 */
export function buildWorksheetCsv(
  items: WorkItem[],
  aggregate: WorksheetAggregate,
  phaseOrder: string[],
): string {
  const rows: string[] = [];

  // ヘッダー行
  const header = ['No', '機能・要望', '備考', '製造工数', ...phaseOrder, '行合計'];
  rows.push(toCsvRow(header));

  // 各 WorkItem 行
  items.forEach((item, index) => {
    const result = aggregate.perItem.find((p) => p.workItemId === item.id);
    const phases = result?.phases ?? {};
    const rowTotal = result?.rowTotal ?? 0;

    const cells = [
      String(index + 1),
      item.feature,
      item.note,
      formatEffort(phases['製造'] ?? 0),
      ...phaseOrder.map((phase) => formatEffort(phases[phase] ?? 0)),
      formatEffort(rowTotal),
    ];
    rows.push(toCsvRow(cells));
  });

  // 合計行
  const totalCells = [
    '合計',
    '',
    '',
    formatEffort(aggregate.phaseTotals['製造'] ?? 0),
    ...phaseOrder.map((phase) => formatEffort(aggregate.phaseTotals[phase] ?? 0)),
    formatEffort(aggregate.grandTotal),
  ];
  rows.push(toCsvRow(totalCells));

  // CRLF 区切り（RFC 4180）
  return rows.join('\r\n');
}
