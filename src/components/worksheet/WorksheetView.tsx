import { useMemo, type ReactNode } from 'react';
import { useAppState } from '../../hooks/useAppState';
import { useConfig } from '../../hooks/useConfig';
import { useDerivedState } from '../../hooks/useDerivedState';
import { WorksheetTable } from './WorksheetTable';
import { WorksheetSummary } from './WorksheetSummary';

export function WorksheetView(): ReactNode {
  const { state, dispatch } = useAppState();
  const { config } = useConfig();
  const derived = useDerivedState(state, config);

  // 工程の表示順（係数定義の順序）
  const phaseOrder = useMemo(
    () => Object.keys(config.phaseCoefficients),
    [config.phaseCoefficients],
  );

  return (
    <section className="worksheet-view" aria-label="工数明細シート">
      <div className="worksheet-toolbar">
        <button
          type="button"
          className="button-primary"
          onClick={() => dispatch({ type: 'ADD_WORK_ITEM' })}
        >
          ＋ 行を追加
        </button>
        <span className="worksheet-count">明細行数: {state.workItems.length}</span>
      </div>

      <WorksheetTable
        workItems={state.workItems}
        aggregate={derived.worksheetAggregate}
        phaseOrder={phaseOrder}
        onUpdate={(id, patch) => dispatch({ type: 'UPDATE_WORK_ITEM', payload: { id, patch } })}
        onDelete={(id) => dispatch({ type: 'DELETE_WORK_ITEM', payload: { id } })}
        onMoveUp={(id) => dispatch({ type: 'MOVE_WORK_ITEM', payload: { id, direction: 'up' } })}
        onMoveDown={(id) =>
          dispatch({ type: 'MOVE_WORK_ITEM', payload: { id, direction: 'down' } })
        }
      />

      <WorksheetSummary aggregate={derived.worksheetAggregate} phaseOrder={phaseOrder} />
    </section>
  );
}
