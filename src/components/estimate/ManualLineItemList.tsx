import type { ReactNode } from 'react';
import type { ManualLineItem } from '../../types';
import { validateQuantity, validateUnitPrice } from '../../domain/validation';
import { computeLineAmount } from '../../domain/estimate';
import { formatCurrency } from '../../utils/format';

interface ManualLineItemListProps {
  items: ManualLineItem[];
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<ManualLineItem>) => void;
  onDelete: (id: string) => void;
}

/**
 * 手動追加明細行（運用保守費など）の編集UI。
 * 不正値の行は金額計算を停止するが、他行には影響しない。
 */
export function ManualLineItemList({
  items,
  onAdd,
  onUpdate,
  onDelete,
}: ManualLineItemListProps): ReactNode {
  return (
    <div className="manual-line-items">
      <div className="manual-header">
        <h2>手動追加明細</h2>
        <button type="button" className="button-primary" onClick={onAdd}>
          ＋ 行を追加
        </button>
      </div>

      {items.length === 0 ? (
        <p className="empty-note">手動追加の明細行はありません。</p>
      ) : (
        <table className="manual-table">
          <thead>
            <tr>
              <th>品名</th>
              <th>数量</th>
              <th>単位</th>
              <th>単価</th>
              <th>金額</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const qtyError = validateQuantity(item.quantity);
              const priceError = validateUnitPrice(item.unitPrice);
              const hasError = qtyError !== null || priceError !== null;
              // エラー時は金額計算を停止（直前の有効値を示すため0でなく「—」表示）
              const amount = hasError ? null : computeLineAmount(item.quantity, item.unitPrice);

              return (
                <tr key={item.id}>
                  <td>
                    <input
                      type="text"
                      value={item.name}
                      maxLength={200}
                      aria-label={`手動追加行 ${index + 1} の品名`}
                      onChange={(e) => onUpdate(item.id, { name: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min={0}
                      max={999999}
                      value={item.quantity}
                      aria-label={`手動追加行 ${index + 1} の数量`}
                      className={qtyError ? 'input-error' : ''}
                      onChange={(e) => onUpdate(item.id, { quantity: Number(e.target.value) })}
                    />
                    {qtyError && <span className="field-error">{qtyError}</span>}
                  </td>
                  <td>
                    <input
                      type="text"
                      value={item.unit}
                      maxLength={20}
                      aria-label={`手動追加行 ${index + 1} の単位`}
                      onChange={(e) => onUpdate(item.id, { unit: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min={0}
                      max={999999999}
                      value={item.unitPrice}
                      aria-label={`手動追加行 ${index + 1} の単価`}
                      className={priceError ? 'input-error' : ''}
                      onChange={(e) => onUpdate(item.id, { unitPrice: Number(e.target.value) })}
                    />
                    {priceError && <span className="field-error">{priceError}</span>}
                  </td>
                  <td className="cell-amount">{amount === null ? '—' : formatCurrency(amount)}</td>
                  <td>
                    <button
                      type="button"
                      className="button-delete"
                      aria-label={`手動追加行 ${index + 1} を削除`}
                      onClick={() => onDelete(item.id)}
                    >
                      削除
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
