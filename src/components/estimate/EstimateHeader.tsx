import type { ReactNode } from 'react';
import type { EstimateHeader as EstimateHeaderType } from '../../types';
import { todayIso } from '../../utils/format';

interface EstimateHeaderProps {
  header: EstimateHeaderType;
  onUpdate: (patch: Partial<EstimateHeaderType>) => void;
}

export function EstimateHeaderForm({ header, onUpdate }: EstimateHeaderProps): ReactNode {
  // 有効期限が過去日付かどうかの警告判定
  const isValidUntilPast =
    header.validUntil !== '' && header.validUntil < todayIso();

  return (
    <div className="estimate-header-form">
      <h2>見積書情報</h2>
      <div className="form-grid">
        <label>
          発行日
          <input
            type="date"
            value={header.issueDate}
            aria-label="発行日"
            onChange={(e) => onUpdate({ issueDate: e.target.value })}
          />
        </label>
        <label>
          見積番号
          <input
            type="text"
            value={header.estimateNumber}
            maxLength={50}
            aria-label="見積番号"
            onChange={(e) => onUpdate({ estimateNumber: e.target.value })}
          />
        </label>
        <label>
          宛先（会社名）
          <input
            type="text"
            value={header.clientName}
            maxLength={100}
            placeholder="○○株式会社"
            aria-label="宛先会社名"
            onChange={(e) => onUpdate({ clientName: e.target.value })}
          />
        </label>
        <label>
          件名
          <input
            type="text"
            value={header.subject}
            maxLength={200}
            aria-label="件名"
            onChange={(e) => onUpdate({ subject: e.target.value })}
          />
        </label>
        <label>
          有効期限
          <input
            type="date"
            value={header.validUntil}
            aria-label="有効期限"
            className={isValidUntilPast ? 'input-warning' : ''}
            onChange={(e) => onUpdate({ validUntil: e.target.value })}
          />
          {isValidUntilPast && (
            <span className="field-warning">有効期限が本日より前の日付です。</span>
          )}
        </label>
        <label className="form-full-width">
          備考文
          <textarea
            value={header.notes}
            maxLength={400}
            rows={3}
            aria-label="備考文"
            onChange={(e) => onUpdate({ notes: e.target.value })}
          />
        </label>
      </div>
    </div>
  );
}
