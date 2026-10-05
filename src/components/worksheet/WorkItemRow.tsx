import { useState, type ReactNode } from 'react';
import type { WorkItem, WorkItemPhaseResult } from '../../types';
import { validateManufacturingDays } from '../../domain/validation';
import { formatEffort } from '../../utils/format';

interface WorkItemRowProps {
  item: WorkItem;
  index: number;
  phaseResult: WorkItemPhaseResult;
  phaseOrder: string[];
  onUpdate: (id: string, patch: Partial<WorkItem>) => void;
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  isFirst: boolean;
  isLast: boolean;
}

// 数値（整数または小数、符号なし）のみを許容する入力パターン
const NUMERIC_PATTERN = /^\d*\.?\d*$/;

export function WorkItemRow({
  item,
  index,
  phaseResult,
  phaseOrder,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: WorkItemRowProps): ReactNode {
  // 製造工数はテキスト入力。入力途中の文字列をローカルで保持する
  const [daysText, setDaysText] = useState<string>(String(item.manufacturingDays));
  const effortError = validateManufacturingDays(item.manufacturingDays);

  const handleDaysChange = (value: string): void => {
    // 数値以外の文字が含まれる入力は反映しない（テキスト入力で数値のみ許可）
    if (value !== '' && !NUMERIC_PATTERN.test(value)) {
      return;
    }
    setDaysText(value);
    const parsed = value === '' ? 0 : Number(value);
    onUpdate(item.id, { manufacturingDays: parsed });
  };

  return (
    <tr>
      <td className="cell-no">{index + 1}</td>
      <td>
        <input
          type="text"
          value={item.feature}
          maxLength={200}
          aria-label={`明細行 ${index + 1} の機能・要望`}
          onChange={(e) => onUpdate(item.id, { feature: e.target.value })}
        />
      </td>
      <td>
        <input
          type="text"
          value={item.note}
          maxLength={400}
          aria-label={`明細行 ${index + 1} の備考`}
          onChange={(e) => onUpdate(item.id, { note: e.target.value })}
        />
      </td>
      <td>
        <input
          type="text"
          inputMode="decimal"
          value={daysText}
          aria-label={`明細行 ${index + 1} の製造工数`}
          className={effortError ? 'input-error' : ''}
          onChange={(e) => handleDaysChange(e.target.value)}
        />
        {effortError && <span className="field-error">{effortError}</span>}
      </td>
      {/* 工程工数（計算結果・読み取り専用） */}
      {phaseOrder.map((phase) => (
        <td key={phase} className="cell-effort">
          {formatEffort(phaseResult.phases[phase] ?? 0)}
        </td>
      ))}
      <td className="cell-effort cell-row-total">{formatEffort(phaseResult.rowTotal)}</td>
      <td className="cell-actions">
        <button
          type="button"
          aria-label={`明細行 ${index + 1} を上に移動`}
          disabled={isFirst}
          onClick={() => onMoveUp(item.id)}
        >
          ↑
        </button>
        <button
          type="button"
          aria-label={`明細行 ${index + 1} を下に移動`}
          disabled={isLast}
          onClick={() => onMoveDown(item.id)}
        >
          ↓
        </button>
        <button
          type="button"
          aria-label={`明細行 ${index + 1} を削除`}
          className="button-delete"
          onClick={() => onDelete(item.id)}
        >
          削除
        </button>
      </td>
    </tr>
  );
}
