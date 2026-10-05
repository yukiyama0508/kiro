import { useState, type ReactNode } from 'react';
import { pdf } from '@react-pdf/renderer';
import type {
  CompanyInfo,
  EstimateHeader,
  FieldError,
  LineAmountResult,
  ManualLineItem,
  TotalsResult,
  WorkItem,
} from '../../types';
import { validateForExport } from '../../domain/validation';
import { formatDateForFilename } from '../../utils/format';
import { EstimatePdfDocument } from './EstimatePdfDocument';

interface PdfExportButtonProps {
  header: EstimateHeader;
  companyInfo: CompanyInfo;
  lineAmounts: LineAmountResult[];
  totals: TotalsResult;
  workItems: WorkItem[];
  manualItems: ManualLineItem[];
  onValidationError: (errors: FieldError[]) => void;
}

/**
 * 出力ファイル名を生成する: 見積書_{宛先会社名}_{発行日}.pdf
 * 未入力の箇所は「不明」で代替する
 */
function buildFileName(header: EstimateHeader): string {
  const client = header.clientName.trim() || '不明';
  const date = header.issueDate ? formatDateForFilename(header.issueDate) : '不明';
  return `見積書_${client}_${date}.pdf`;
}

export function PdfExportButton({
  header,
  companyInfo,
  lineAmounts,
  totals,
  workItems,
  manualItems,
  onValidationError,
}: PdfExportButtonProps): ReactNode {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const handleExport = async (): Promise<void> => {
    // バリデーション（全エラー同時収集）
    const errors = validateForExport(header, workItems, manualItems);
    onValidationError(errors);
    if (errors.length > 0) {
      return;
    }

    setIsGenerating(true);
    setGenerateError(null);

    try {
      const blob = await pdf(
        <EstimatePdfDocument
          header={header}
          companyInfo={companyInfo}
          lineAmounts={lineAmounts}
          totals={totals}
        />,
      ).toBlob();

      // ブラウザのダウンロードとして提供
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = buildFileName(header);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'PDFの生成に失敗しました。';
      setGenerateError(`PDFの生成中にエラーが発生しました: ${message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="pdf-export">
      <button
        type="button"
        className="button-primary button-export"
        disabled={isGenerating}
        aria-label="PDFで書き出す"
        onClick={() => void handleExport()}
      >
        {isGenerating ? (
          <>
            <span className="spinner" aria-hidden="true" /> 生成中…
          </>
        ) : (
          'PDF で書き出す'
        )}
      </button>
      {generateError && (
        <div className="pdf-export-error" role="alert">
          {generateError}
        </div>
      )}
    </div>
  );
}
