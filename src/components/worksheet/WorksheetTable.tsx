import type { ReactNode } from 'react';
import type { WorkItem, WorksheetAggregate } from '../../types';
import { WorkItemRow } from './WorkItemRow';

interface WorksheetTableProps {
  workItems: WorkItem[];
  aggregate: WorksheetAggregate;
  phaseOrder: string[];
  onUpdate: (id: string, patch: Partial<WorkItem>) => void;
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
}

export function WorksheetTable({
  workItems,
  aggregate,
  phaseOrder,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
}: WorksheetTableProps): ReactNode {
  return (
    <div className="worksheet-table-wrapper">
      <table className="worksheet-table">
        <thead>
          <tr>
            <th>No</th>
            <th>機能・要望</th>
            <th>対応カテゴリ</th>
            <th>状態</th>
            <th>備考</th>
            <th>製造工数</th>
            {phaseOrder.map((phase) => (
              <th key={phase}>{phase}</th>
            ))}
            <th>行合計</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {workItems.length === 0 ? (
            <tr>
              <td colSpan={phaseOrder.length + 8} className="empty-row">
                明細行がありません。「行を追加」で追加してください。
              </td>
            </tr>
          ) : (
            workItems.map((item, index) => {
              const phaseResult = aggregate.perItem.find((p) => p.workItemId === item.id) ?? {
                workItemId: item.id,
                phases: {},
                rowTotal: 0,
              };
              return (
                <WorkItemRow
                  key={item.id}
                  item={item}
                  index={index}
                  phaseResult={phaseResult}
                  phaseOrder={phaseOrder}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  onMoveUp={onMoveUp}
                  onMoveDown={onMoveDown}
                  isFirst={index === 0}
                  isLast={index === workItems.length - 1}
                />
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
