import { Document, Font, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import type { ReactElement } from 'react';
import type { CompanyInfo, EstimateHeader, LineAmountResult, TotalsResult } from '../../types';
import { formatCurrency, formatDateJp } from '../../utils/format';

// 日本語フォントを登録（文字化け防止）
Font.register({
  family: 'NotoSansJP',
  fonts: [
    { src: '/fonts/NotoSansJP-Regular.ttf', fontWeight: 'normal' },
    { src: '/fonts/NotoSansJP-Bold.ttf', fontWeight: 'bold' },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: 'NotoSansJP',
    fontSize: 9,
    padding: '20mm',
    color: '#1a1a1a',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  meta: {
    fontSize: 9,
    textAlign: 'right',
  },
  parties: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  clientName: {
    fontSize: 13,
    fontWeight: 'bold',
    borderBottom: '1px solid #333',
    paddingBottom: 4,
  },
  company: {
    fontSize: 8,
    textAlign: 'right',
    lineHeight: 1.4,
  },
  companyName: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  subject: {
    fontSize: 10,
    marginBottom: 10,
  },
  grandAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4f8',
    padding: 10,
    marginBottom: 14,
    borderLeft: '4px solid #2563eb',
  },
  grandLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    marginRight: 12,
  },
  grandValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  grandNote: {
    fontSize: 9,
    marginLeft: 6,
  },
  table: {
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #ddd',
  },
  cellName: { width: '55%', padding: 5 },
  cellQty: { width: '10%', padding: 5, textAlign: 'right' },
  cellPrice: { width: '17%', padding: 5, textAlign: 'right' },
  cellAmount: { width: '18%', padding: 5, textAlign: 'right' },
  totals: {
    alignSelf: 'flex-end',
    width: '40%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 4,
  },
  totalGrand: {
    borderTop: '1.5px solid #333',
    fontWeight: 'bold',
    fontSize: 11,
  },
  notes: {
    marginTop: 16,
    padding: 8,
    border: '1px solid #ddd',
  },
  notesLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    marginBottom: 4,
  },
});

interface EstimatePdfDocumentProps {
  header: EstimateHeader;
  companyInfo: CompanyInfo;
  lineAmounts: LineAmountResult[];
  totals: TotalsResult;
}

/**
 * PDF出力用のドキュメント。EstimatePreviewと同じ構造を保つ。
 */
export function EstimatePdfDocument({
  header,
  companyInfo,
  lineAmounts,
  totals,
}: EstimatePdfDocumentProps): ReactElement {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* タイトル */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>御見積書</Text>
          <View style={styles.meta}>
            <Text>見積番号: {header.estimateNumber || '—'}</Text>
            <Text>発行日: {formatDateJp(header.issueDate) || '—'}</Text>
            <Text>有効期限: {formatDateJp(header.validUntil) || '—'}</Text>
          </View>
        </View>

        {/* 宛先・自社情報 */}
        <View style={styles.parties}>
          <View>
            <Text style={styles.clientName}>
              {header.clientName ? `${header.clientName} 御中` : '（宛先未入力）御中'}
            </Text>
          </View>
          <View style={styles.company}>
            <Text style={styles.companyName}>{companyInfo.name}</Text>
            <Text>{companyInfo.address}</Text>
            <Text>TEL: {companyInfo.tel}</Text>
            <Text>{companyInfo.email}</Text>
            <Text>担当: {companyInfo.contact}</Text>
            <Text>登録番号: {companyInfo.registrationNumber}</Text>
          </View>
        </View>

        {/* 件名 */}
        <Text style={styles.subject}>件名: {header.subject || '—'}</Text>

        {/* お見積金額 */}
        <View style={styles.grandAmount}>
          <Text style={styles.grandLabel}>お見積金額</Text>
          <Text style={styles.grandValue}>{formatCurrency(totals.totalAmount)}</Text>
          <Text style={styles.grandNote}>（税込）</Text>
        </View>

        {/* 明細表 */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.cellName}>品名</Text>
            <Text style={styles.cellQty}>数量</Text>
            <Text style={styles.cellPrice}>単価</Text>
            <Text style={styles.cellAmount}>金額</Text>
          </View>
          {lineAmounts.map((line, i) => (
            <View style={styles.tableRow} key={`${line.sectionName}-${i}`}>
              <Text style={styles.cellName}>{line.sectionName}</Text>
              <Text style={styles.cellQty}>{line.quantity}</Text>
              <Text style={styles.cellPrice}>{formatCurrency(line.unitPrice)}</Text>
              <Text style={styles.cellAmount}>{formatCurrency(line.amount)}</Text>
            </View>
          ))}
        </View>

        {/* 合計 */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>小計</Text>
            <Text>{formatCurrency(totals.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>消費税（10%）</Text>
            <Text>{formatCurrency(totals.taxAmount)}</Text>
          </View>
          <View style={[styles.totalRow, styles.totalGrand]}>
            <Text>税込合計</Text>
            <Text>{formatCurrency(totals.totalAmount)}</Text>
          </View>
        </View>

        {/* 備考 */}
        {header.notes ? (
          <View style={styles.notes}>
            <Text style={styles.notesLabel}>備考</Text>
            <Text>{header.notes}</Text>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
