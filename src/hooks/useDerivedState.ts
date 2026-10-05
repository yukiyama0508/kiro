import { useMemo } from 'react';
import type { AppConfig, LineAmountResult, TotalsResult, WorksheetAggregate } from '../types';
import { aggregateWorksheet } from '../domain/worksheet';
import { computeLineAmounts, computeSectionQuantities, computeTotals } from '../domain/estimate';
import type { AppState } from './useAppState';

export interface DerivedState {
  worksheetAggregate: WorksheetAggregate;
  sectionQuantities: Record<string, number>;
  lineAmounts: LineAmountResult[];
  totals: TotalsResult;
}

/**
 * AppStateとConfigから計算済みの導出値を算出する
 * useMemoで再計算を最小化する
 */
export function useDerivedState(state: AppState, config: AppConfig): DerivedState {
  return useMemo(() => {
    const worksheetAggregate = aggregateWorksheet(state.workItems, config.phaseCoefficients);
    const sectionQuantities = computeSectionQuantities(worksheetAggregate, config.sectionMappings);
    const sectionOrder = Object.keys(config.sectionMappings);

    const lineAmounts = computeLineAmounts(
      sectionQuantities,
      sectionOrder,
      state.dailyRates.default,
      state.dailyRates.overrides,
      state.manualLineItems,
    );

    const totals = computeTotals(lineAmounts.map((l) => l.amount));

    return { worksheetAggregate, sectionQuantities, lineAmounts, totals };
  }, [state.workItems, state.manualLineItems, state.dailyRates, config]);
}
