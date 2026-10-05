import type { ReactNode } from 'react';
import type {
  CompanyInfo,
  EstimateHeader,
  LineAmountResult,
  TotalsResult,
} from '../../types';
import { formatCurrency, formatDateJp } from '../../utils/format';

export interface EstimatePreviewProps {
  header: EstimateHeader;
  companyInfo: CompanyInfo;
  lineAmounts: LineAmountResult[];
  totals: TotalsResult;
}

/**
 * 見積書のプレビュー（A4縦比率）。
 * PDF生成時も同じデータ構造を使って一貫したレイアウトにする。
 */
export function EstimatePreview({
  header,
  companyInfo,
  lineAmounts,
  totals,
}: EstimatePreviewProps): ReactNode {
  return (
    <div className="estimate-preview" aria-label="見積書プレビュー">
      <div className="preview-page">
        {/* タイトル */}
        <div className="preview-title-row">
          <h1 className="preview-title">御見積書</h1>
          <div className="preview-meta">
            <div>見積番号: {header.estimateNumber || '—'}</div>
            <div>発行日: {formatDateJp(header.issueDate) || '—'}</div>
            <div>有効期限: {formatDateJp(header.validUntil) || '—'}</div>
          </div>
        </div>

        {/* 宛先・自社情報 */}
        <div className="preview-parties">
          <div className="preview-client">
            <div className="preview-client-name">
              {header.clientName ? `${header.clientName} 御中` : '（宛先未入力）御中'}
            </div>
          </div>
          <div className="preview-company">
            <div className="preview-company-name">{companyInfo.name}</div>
            <div>{companyInfo.address}</div>
            <div>TEL: {companyInfo.tel}</div>
            <div>{companyInfo.email}</div>
            <div>担当: {companyInfo.contact}</div>
            <div>登録番号: {companyInfo.registrationNumber}</div>
          </div>
        </div>

        {/* 件名 */}
        <div className="preview-subject">件名: {header.subject || '—'}</div>

        {/* お見積金額（目立つ表示） */}
        <div className="preview-grand-amount">
          <span className="preview-grand-label">お見積金額</span>
          <span className="preview-grand-value">{formatCurrency(totals.totalAmount)}</span>
          <span className="preview-grand-note">（税込）</span>
        </div>

        {/* 明細表 */}
        <table className="preview-table">
          <thead>
            <tr>
              <th className="col-name">品名</th>
              <th className="col-qty">数量</th>
              <th className="col-price">単価</th>
              <th className="col-amount">金額</th>
            </tr>
          </thead>
          <tbody>
            {lineAmounts.map((line, i) => (
              <tr key={`${line.sectionName}-${i}`}>
                <td>{line.sectionName}</td>
                <td className="col-qty">{line.quantity}</td>
                <td className="col-price">{formatCurrency(line.unitPrice)}</td>
                <td className="col-amount">{formatCurrency(line.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 合計欄 */}
        <div className="preview-totals">
          <div className="preview-total-row">
            <span>小計</span>
            <span>{formatCurrency(totals.subtotal)}</span>
          </div>
          <div className="preview-total-row">
            <span>消費税（10%）</span>
            <span>{formatCurrency(totals.taxAmount)}</span>
          </div>
          <div className="preview-total-row preview-total-row--grand">
            <span>税込合計</span>
            <span>{formatCurrency(totals.totalAmount)}</span>
          </div>
        </div>

        {/* 備考 */}
        {header.notes && (
          <div className="preview-notes">
            <div className="preview-notes-label">備考</div>
            <div className="preview-notes-body">{header.notes}</div>
          </div>
        )}
      </div>
    </div>
  );
}
