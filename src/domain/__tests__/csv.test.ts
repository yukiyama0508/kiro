import { describe, expect, it } from 'vitest';
import { buildWorksheetCsv, escapeCsvCell } from '../csv';
import { aggregateWorksheet } from '../worksheet';
import { DEFAULT_PHASE_COEFFICIENTS, type WorkItem } from '../../types';

const phaseOrder = Object.keys(DEFAULT_PHASE_COEFFICIENTS);

const makeItem = (id: string, feature: string, note: string, days: number): WorkItem => ({
  id,
  feature,
  note,
  manufacturingDays: days,
});

describe('escapeCsvCell', () => {
  it('特殊文字を含まない値はそのまま返す', () => {
    expect(escapeCsvCell('機能A')).toBe('機能A');
    expect(escapeCsvCell('123')).toBe('123');
  });

  it('カンマを含む値はダブルクォートで囲む', () => {
    expect(escapeCsvCell('a,b')).toBe('"a,b"');
  });

  it('ダブルクォートを含む値は2つ重ねてエスケープする', () => {
    expect(escapeCsvCell('a"b')).toBe('"a""b"');
  });

  it('改行を含む値はダブルクォートで囲む', () => {
    expect(escapeCsvCell('a\nb')).toBe('"a\nb"');
    expect(escapeCsvCell('a\r\nb')).toBe('"a\r\nb"');
  });

  it('空文字はそのまま返す', () => {
    expect(escapeCsvCell('')).toBe('');
  });
});

describe('buildWorksheetCsv', () => {
  it('ヘッダー行に全列を出力する', () => {
    const csv = buildWorksheetCsv([], aggregateWorksheet([]), phaseOrder);
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe(
      'No,機能・要望,備考,製造工数,' + phaseOrder.join(',') + ',行合計',
    );
  });

  it('空データでもヘッダー行と合計行を出力する', () => {
    const csv = buildWorksheetCsv([], aggregateWorksheet([]), phaseOrder);
    const lines = csv.split('\r\n');
    // ヘッダー + 合計行の2行
    expect(lines).toHaveLength(2);
    expect(lines[1].startsWith('合計,')).toBe(true);
  });

  it('WorkItem 行を No 連番付きで出力する', () => {
    const items = [makeItem('1', '認証', 'メモ', 10), makeItem('2', '管理', '', 20)];
    const csv = buildWorksheetCsv(items, aggregateWorksheet(items), phaseOrder);
    const lines = csv.split('\r\n');
    expect(lines[1].startsWith('1,認証,メモ,10.00,')).toBe(true);
    expect(lines[2].startsWith('2,管理,,20.00,')).toBe(true);
  });

  it('機能名にカンマが含まれる場合はエスケープされる', () => {
    const items = [makeItem('1', 'A,B機能', '', 5)];
    const csv = buildWorksheetCsv(items, aggregateWorksheet(items), phaseOrder);
    const lines = csv.split('\r\n');
    expect(lines[1].startsWith('1,"A,B機能",')).toBe(true);
  });

  it('合計行に工程別合計と総合計を出力する', () => {
    const items = [makeItem('1', 'A', '', 10), makeItem('2', 'B', '', 20)];
    const agg = aggregateWorksheet(items);
    const csv = buildWorksheetCsv(items, agg, phaseOrder);
    const lines = csv.split('\r\n');
    const totalLine = lines[lines.length - 1];
    // 製造合計 30.00 が含まれる
    expect(totalLine).toContain('30.00');
    // 総合計（末尾）が行合計の合計と一致
    expect(totalLine.endsWith(formatEffortExpected(agg.grandTotal))).toBe(true);
  });

  it('工程工数は小数第2位で出力する', () => {
    const items = [makeItem('1', 'A', '', 10)];
    const csv = buildWorksheetCsv(items, aggregateWorksheet(items), phaseOrder);
    const lines = csv.split('\r\n');
    // 進行管理 = 10 * 0.15 = 1.5 → "1.50"
    expect(lines[1]).toContain('1.50');
  });
});

// テスト内で期待値を作るヘルパー（formatEffortと同じ小数第2位表記）
function formatEffortExpected(value: number): string {
  return value.toFixed(2);
}
