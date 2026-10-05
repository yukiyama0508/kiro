import { useMemo, type ReactNode } from 'react';
import { useAppState } from '../../hooks/useAppState';
import { useConfig } from '../../hooks/useConfig';
import { useDerivedState } from '../../hooks/useDerivedState';
import { buildWorksheetCsv } from '../../domain/csv';
import { formatDateForFilename, todayIso } from '../../utils/format';
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

  const handleCsvDownload = (): void => {
    const csv = buildWorksheetCsv(state.workItems, derived.worksheetAggregate, phaseOrder);
    // Excel での文字化けを防ぐため UTF-8 BOM を先頭に付与する
    const bom = '\uFEFF';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = state.estimateHeader.issueDate
      ? formatDateForFilename(state.estimateHeader.issueDate)
      : formatDateForFilename(todayIso());
    link.download = `工数明細_${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
        <button
          type="button"
          className="button-secondary"
          aria-label="工数明細をCSVダウンロード"
          onClick={handleCsvDownload}
        >
          CSV ダウンロード
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
