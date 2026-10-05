import type { ReactNode } from 'react';
import type { WorksheetAggregate } from '../../types';
import { formatEffort } from '../../utils/format';

interface WorksheetSummaryProps {
  aggregate: WorksheetAggregate;
  phaseOrder: string[];
}

/**
 * 工程別合計・総合計を表示する集計行
 */
export function WorksheetSummary({ aggregate, phaseOrder }: WorksheetSummaryProps): ReactNode {
  return (
    <div className="worksheet-summary-wrapper">
      <table className="worksheet-table worksheet-summary">
        <tbody>
          <tr>
            <th className="summary-label">合計</th>
            <th>製造工数</th>
            {phaseOrder.map((phase) => (
              <th key={phase}>{phase}</th>
            ))}
            <th>総合計</th>
          </tr>
          <tr>
            <td className="summary-label" />
            <td className="cell-effort">{formatEffort(aggregate.phaseTotals['製造'] ?? 0)}</td>
            {phaseOrder.map((phase) => (
              <td key={phase} className="cell-effort">
                {formatEffort(aggregate.phaseTotals[phase] ?? 0)}
              </td>
            ))}
            <td className="cell-effort cell-grand-total">{formatEffort(aggregate.grandTotal)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
