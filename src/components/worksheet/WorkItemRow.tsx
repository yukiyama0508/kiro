import type { ReactNode } from 'react';
import {
  WORK_ITEM_CATEGORIES,
  WORK_ITEM_STATUSES,
  type WorkItem,
  type WorkItemPhaseResult,
} from '../../types';
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
  const effortError = validateManufacturingDays(item.manufacturingDays);
  const isUnchanged = item.status === '変更なし';

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
        <select
          value={item.category}
          aria-label={`明細行 ${index + 1} の対応カテゴリ`}
          onChange={(e) => onUpdate(item.id, { category: e.target.value })}
        >
          {WORK_ITEM_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </td>
      <td>
        <select
          value={item.status}
          aria-label={`明細行 ${index + 1} の状態`}
          onChange={(e) => onUpdate(item.id, { status: e.target.value as WorkItem['status'] })}
        >
          {WORK_ITEM_STATUSES.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
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
          type="number"
          min={0}
          max={999999}
          step="0.01"
          value={item.manufacturingDays}
          aria-label={`明細行 ${index + 1} の製造工数`}
          className={effortError ? 'input-error' : ''}
          onChange={(e) => onUpdate(item.id, { manufacturingDays: Number(e.target.value) })}
        />
        {effortError && <span className="field-error">{effortError}</span>}
      </td>
      {/* 工程工数（計算結果・読み取り専用） */}
      {phaseOrder.map((phase) => (
        <td
          key={phase}
          className={`cell-effort${isUnchanged ? ' cell-effort--disabled' : ''}`}
        >
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
