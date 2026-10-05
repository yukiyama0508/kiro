import type { EstimateHeader, FieldError, ManualLineItem, WorkItem } from '../types';

/**
 * PDF書き出し前の一括バリデーション
 * すべてのエラーを同時に返却する（先頭のエラーだけ返すのではない）
 */
export function validateForExport(
  header: EstimateHeader,
  workItems: WorkItem[],
  manualItems: ManualLineItem[],
): FieldError[] {
  const errors: FieldError[] = [];

  // ---- 必須フィールドチェック ----
  if (!header.issueDate.trim()) {
    errors.push({ field: 'header.issueDate', message: '発行日は必須です。' });
  }
  if (!header.clientName.trim()) {
    errors.push({ field: 'header.clientName', message: '宛先会社名は必須です。' });
  }
  if (!header.subject.trim()) {
    errors.push({ field: 'header.subject', message: '件名は必須です。' });
  }

  // ---- 工数明細の数値チェック ----
  workItems.forEach((item, index) => {
    if (item.manufacturingDays < 0) {
      errors.push({
        field: `workItem.${index}.manufacturingDays`,
        message: `明細行 ${index + 1}: 製造工数は 0 以上の値を入力してください。`,
      });
    }
    if (item.manufacturingDays > 999999) {
      errors.push({
        field: `workItem.${index}.manufacturingDays`,
        message: `明細行 ${index + 1}: 製造工数の上限は 999,999 です。`,
      });
    }
  });

  // ---- 手動追加明細行の数値チェック ----
  manualItems.forEach((item, index) => {
    if (item.quantity < 0) {
      errors.push({
        field: `manualItem.${index}.quantity`,
        message: `手動追加行 ${index + 1}: 数量は 0 以上の値を入力してください。`,
      });
    }
    if (item.quantity > 999999) {
      errors.push({
        field: `manualItem.${index}.quantity`,
        message: `手動追加行 ${index + 1}: 数量の上限は 999,999 です。`,
      });
    }
    if (item.unitPrice < 0) {
      errors.push({
        field: `manualItem.${index}.unitPrice`,
        message: `手動追加行 ${index + 1}: 単価は 0 以上の値を入力してください。`,
      });
    }
    if (item.unitPrice > 999999999) {
      errors.push({
        field: `manualItem.${index}.unitPrice`,
        message: `手動追加行 ${index + 1}: 単価の上限は ¥999,999,999 です。`,
      });
    }
  });

  return errors;
}

/**
 * 製造工数フィールドの単体バリデーション（インライン表示用）
 */
export function validateManufacturingDays(value: number): string | null {
  if (isNaN(value)) return '数値を入力してください。';
  if (value < 0) return '0 以上の値を入力してください。';
  if (value > 999999) return '値の上限は 999,999 です。';
  return null;
}

/**
 * 単価フィールドの単体バリデーション（インライン表示用）
 */
export function validateUnitPrice(value: number): string | null {
  if (isNaN(value)) return '数値を入力してください。';
  if (value < 0) return '0 以上の値を入力してください。';
  if (value > 999999999) return '単価の上限は ¥999,999,999 です。';
  return null;
}

/**
 * 数量フィールドの単体バリデーション（インライン表示用）
 */
export function validateQuantity(value: number): string | null {
  if (isNaN(value)) return '数値を入力してください。';
  if (value < 0) return '0 以上の値を入力してください。';
  if (value > 999999) return '値の上限は 999,999 です。';
  return null;
}
