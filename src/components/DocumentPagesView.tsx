import React from 'react';
import { Dictionaries, ReportHeader, ReportRow, TotalsResult } from '../types';
import { computePages, PageBreakdown } from '../utils/pagination';
import { CompanyHeader } from './CompanyHeader';
import { MetaGrid } from './MetaGrid';
import { SummarySection } from './SummarySection';
import { FooterSignatures } from './FooterSignatures';
import { calculateHours } from '../utils/calculations';
import { formatDatePL, getDayInfo } from '../utils/dateUtils';

interface DocumentPagesViewProps {
  header: ReportHeader;
  rows: ReportRow[];
  totals: TotalsResult;
  dictionaries: Dictionaries;
  isDocumentGenerated: boolean;
  onGenerateDocNumber: () => void;
  onChangeHeader?: (field: keyof ReportHeader, value: string) => void;
  showScreenPageBadges?: boolean;
  measuredHeights?: Record<string, number>;
}

export const DocumentPagesView: React.FC<DocumentPagesViewProps> = ({
  header,
  rows,
  totals,
  dictionaries,
  isDocumentGenerated,
  onGenerateDocNumber,
  onChangeHeader,
  showScreenPageBadges = true,
  measuredHeights,
}) => {
  const pages: PageBreakdown[] = computePages(rows, measuredHeights);

  const renderTableRows = (pageRows: ReportRow[], startIdx: number) => {
    return (
      <div className="w-full overflow-hidden">
        <table className="doc-table w-full border-collapse border border-slate-500 text-slate-800 text-[8.2pt] rounded-none">
          <thead>
            <tr className="bg-[#dfe8f2] text-[#0f2742] h-[30px]">
              <th className="w-[12%] py-1 px-1 text-center font-bold border border-slate-400 rounded-none text-[7.8pt]">
                Tryb pracy
                <span className="block text-[6.8pt] font-medium text-slate-600 italic">Work mode</span>
              </th>
              <th className="w-[12%] py-1 px-1 text-center font-bold border border-slate-400 rounded-none text-[7.8pt]">
                Data
                <span className="block text-[6.8pt] font-medium text-slate-600 italic">Date</span>
              </th>
              <th className="w-[5%] py-1 px-0.5 text-center font-bold border border-slate-400 rounded-none text-[7.8pt] leading-tight">
                Week-
                <span className="block font-bold">End</span>
              </th>
              <th className="w-[9%] py-1 px-0.5 text-center font-bold border border-slate-400 rounded-none text-[7.8pt]">
                Od
                <span className="block text-[6.8pt] font-medium text-slate-600 italic">From</span>
              </th>
              <th className="w-[9%] py-1 px-0.5 text-center font-bold border border-slate-400 rounded-none text-[7.8pt]">
                Do
                <span className="block text-[6.8pt] font-medium text-slate-600 italic">To</span>
              </th>
              <th className="w-[8%] py-1 px-0.5 text-center font-bold border border-slate-400 rounded-none text-[7.8pt]">
                Suma
                <span className="block text-[6.8pt] font-medium text-slate-600 italic">Hours</span>
              </th>
              <th className="w-[45%] py-1 px-2 text-left font-bold border border-slate-400 rounded-none text-[7.8pt]">
                Opis wykonanych prac
                <span className="block text-[6.8pt] font-medium text-slate-600 italic">Description of work</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, idx) => {
              const h = calculateHours(row);
              const dayInfo = getDayInfo(row.date);
              const hasHours = h > 0;
              const rowH = row.rowHeight ? Math.max(row.rowHeight, 38) : 38;

              return (
                <tr
                  key={row.id}
                  style={{ height: `${rowH}px` }}
                  className={`border-b border-slate-300 h-[38px] min-h-[38px] ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50 print:bg-white'
                  }`}
                >
                  <td className="py-1 px-1 text-center border border-slate-300 align-middle font-medium text-[8.5pt] h-[38px]">
                    {row.category === 'del' ? 'Delegacja' : row.category === 'biuro' ? 'Biuro' : '\u00A0'}
                  </td>
                  <td className="py-1 px-1 text-center border border-slate-300 align-middle font-medium text-[8.5pt] h-[38px]">
                    {row.date ? formatDatePL(row.date) : '\u00A0'}
                  </td>
                  <td
                    className={`py-1 px-0.5 text-center border border-slate-300 align-middle font-bold text-[8.5pt] h-[38px] ${
                      dayInfo.holiday
                        ? 'text-amber-800'
                        : dayInfo.weekend
                        ? 'text-blue-800'
                        : 'text-slate-400'
                    }`}
                  >
                    {row.date && dayInfo.holiday ? 'ŚW' : row.date && dayInfo.weekend ? '✓' : '\u00A0'}
                  </td>
                  <td className="py-1 px-0.5 text-center border border-slate-300 align-middle font-mono text-[8.5pt] h-[38px]">
                    {row.from || '\u00A0'}
                  </td>
                  <td className="py-1 px-0.5 text-center border border-slate-300 align-middle font-mono text-[8.5pt] h-[38px]">
                    {row.to || '\u00A0'}
                  </td>
                  <td className="py-1 px-0.5 text-center border border-slate-300 align-middle font-bold font-mono text-[8.5pt] text-[#0f2742] h-[38px]">
                    {hasHours ? h.toFixed(2) : '\u00A0'}
                  </td>
                  <td
                    className="desc-cell py-1.5 px-2 border border-slate-300 align-middle text-left font-normal text-[8.5pt] leading-normal h-[38px]"
                    style={{ height: `${rowH}px` }}
                  >
                    <div
                      className="desc-print-content whitespace-pre-wrap break-words leading-relaxed"
                      style={{
                        wordBreak: 'break-word',
                        overflowWrap: 'anywhere',
                        minHeight: `${Math.max(rowH - 10, 28)}px`,
                      }}
                    >
                      {row.description || '\u00A0'}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="w-full">
      {pages.map((page, pIdx) => (
        <React.Fragment key={`page-${page.pageNumber}`}>
          {/* Visual Screen Badge placed OUTSIDE the A4 sheet so it does not take printable height */}
          {showScreenPageBadges && (
            <div className="no-print w-[210mm] max-w-[210mm] mx-auto flex justify-between items-center pb-1 mb-1.5 border-b border-dashed border-slate-300 text-[8pt] font-mono text-slate-500">
              <span className="font-semibold text-slate-600">Arkusz A4 — Podgląd wydruku / PDF</span>
              <span className="font-extrabold text-[#165d9c] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                STRONA {page.pageNumber} z {page.totalPages}
              </span>
            </div>
          )}

          {/* Individual A4 Page Sheet - Exactly 210mm x 296mm matching print 1:1 */}
          <div
            className="a4-print-page w-[210mm] max-w-[210mm] h-[296mm] min-h-[296mm] max-h-[296mm] bg-white text-slate-900 shadow-2xl rounded-xs p-[6mm_10mm_5mm_10mm] mx-auto flex flex-col justify-between mb-8 print:mb-0 print:shadow-none print:rounded-none print:border-none print:w-[210mm] print:h-[296mm] box-border relative overflow-hidden"
          >
            {/* TOP CONTENT: Header, Metadata, Table, Summary (directly under table) */}
            <div className="w-full flex flex-col">
              {page.isFirst ? (
                <>
                  {/* First page header */}
                  <CompanyHeader
                    reportNumber={header.report_number}
                    isGenerated={isDocumentGenerated}
                    onGenerate={onGenerateDocNumber}
                  />

                  {/* Project metadata */}
                  <MetaGrid
                    header={header}
                    onChange={onChangeHeader || (() => {})}
                    dictionaries={dictionaries}
                    isPreview={true}
                    disabled={!isDocumentGenerated}
                  />

                  {/* Table title */}
                  <div className="mb-1">
                    <div className="flex justify-between items-center mb-1 avoid-break">
                      <div>
                        <span className="text-[9.5pt] font-extrabold text-[#0f2742]">
                          Rejestr godzin pracy / podróży
                        </span>
                        <span className="ml-1.5 text-[7.5pt] text-slate-500 italic font-normal">
                          Work / Travel Hours Log
                        </span>
                      </div>
                    </div>

                    {renderTableRows(page.rows, page.startRowIndex)}
                  </div>
                </>
              ) : (
                <>
                  {/* Subsequent page continuation header */}
                  <div className="avoid-break mb-2 pb-1.5 border-b-2 border-[#165d9c] flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-[10pt] font-extrabold text-[#0f2742] tracking-tight">
                        WUWER Sp. z o.o.
                      </span>
                      <span className="text-slate-300">|</span>
                      <span className="text-[8.5pt] font-bold text-slate-700">
                        Rejestr godzin pracy / podróży (kontynuacja)
                      </span>
                    </div>
                    <div className="text-[8pt] font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      Nr raportu: <strong className="text-slate-900 font-bold">{header.report_number || '—'}</strong>
                    </div>
                  </div>

                  {/* Continued Table */}
                  <div className="mb-1">
                    {renderTableRows(page.rows, page.startRowIndex)}
                  </div>
                </>
              )}

              {/* Summary of hours: ALWAYS directly under the last row of the table on the final page */}
              {page.isLast && (
                <div className="avoid-break mt-1">
                  <SummarySection totals={totals} />
                </div>
              )}
            </div>

            {/* BOTTOM CONTENT: Signatures and Footer ALWAYS anchored at the bottom of the page */}
            <div className="w-full mt-auto shrink-0 avoid-break pt-1 pb-0.5">
              <FooterSignatures
                reportDate={header.data_stopka}
                onReportDateChange={(val) => onChangeHeader && onChangeHeader('data_stopka', val)}
                reportNumber={header.report_number}
                isPreview={true}
                disabled={!isDocumentGenerated}
                totalPages={page.totalPages}
                currentPage={page.pageNumber}
                isLastPage={page.isLast}
              />
            </div>
          </div>

          {/* Visual Divider between A4 Sheets (Screen Only) */}
          {pIdx < pages.length - 1 && (
            <div className="no-print my-6 flex items-center justify-center gap-3">
              <div className="h-px bg-slate-400 dark:bg-slate-700 flex-1 max-w-[120px]" />
              <div className="px-4 py-1.5 bg-white dark:bg-slate-800 border-2 border-dashed border-[#165d9c] rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 shadow-md flex items-center gap-2">
                <span className="text-sm">✂️</span>
                <span>Koniec Strony {page.pageNumber}</span>
                <span className="text-slate-400 font-normal">➔</span>
                <span className="text-[#165d9c] dark:text-blue-400 font-extrabold">
                  Początek Strony {page.pageNumber + 1}
                </span>
              </div>
              <div className="h-px bg-slate-400 dark:bg-slate-700 flex-1 max-w-[120px]" />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
