import { useMemo, useState, type ReactNode } from 'react';
import { useAppState } from '../../hooks/useAppState';
import { useConfig } from '../../hooks/useConfig';
import { useDerivedState } from '../../hooks/useDerivedState';
import { useDebounce } from '../../hooks/useDebounce';
import type { FieldError } from '../../types';
import { EstimateHeaderForm } from './EstimateHeader';
import { DailyRateSettings } from './DailyRateSettings';
import { ManualLineItemList } from './ManualLineItemList';
import { EstimatePreview } from './EstimatePreview';
import { PdfExportButton } from './PdfExportButton';
import { ErrorMessage } from '../common/ErrorMessage';

export function EstimateView(): ReactNode {
  const { state, dispatch } = useAppState();
  const { config } = useConfig();
  const [exportErrors, setExportErrors] = useState<FieldError[]>([]);

  // プレビューは500msデバウンスで更新する
  const debouncedState = useDebounce(state, 500);
  const derived = useDerivedState(debouncedState, config);

  const sectionNames = useMemo(
    () => Object.keys(config.sectionMappings),
    [config.sectionMappings],
  );

  return (
    <section className="estimate-view" aria-label="見積書">
      <div className="estimate-editor">
        <EstimateHeaderForm
          header={state.estimateHeader}
          onUpdate={(patch) => dispatch({ type: 'UPDATE_HEADER', payload: patch })}
        />

        <DailyRateSettings
          dailyRates={state.dailyRates}
          sectionNames={sectionNames}
          onUpdate={(patch) => dispatch({ type: 'UPDATE_DAILY_RATE', payload: patch })}
        />

        <ManualLineItemList
          items={state.manualLineItems}
          onAdd={() => dispatch({ type: 'ADD_MANUAL_ITEM' })}
          onUpdate={(id, patch) =>
            dispatch({ type: 'UPDATE_MANUAL_ITEM', payload: { id, patch } })
          }
          onDelete={(id) => dispatch({ type: 'DELETE_MANUAL_ITEM', payload: { id } })}
        />

        <ErrorMessage errors={exportErrors} />

        <PdfExportButton
          header={state.estimateHeader}
          companyInfo={config.companyInfo}
          lineAmounts={derived.lineAmounts}
          totals={derived.totals}
          workItems={state.workItems}
          manualItems={state.manualLineItems}
          onValidationError={setExportErrors}
        />
      </div>

      <div className="estimate-preview-pane">
        <EstimatePreview
          header={debouncedState.estimateHeader}
          companyInfo={config.companyInfo}
          lineAmounts={derived.lineAmounts}
          totals={derived.totals}
        />
      </div>
    </section>
  );
}
