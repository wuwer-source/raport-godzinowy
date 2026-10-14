import React from 'react';
import { formatDatePL } from '../utils/dateUtils';
import { DatePicker } from './DatePicker';

interface FooterSignaturesProps {
  reportDate: string;
  onReportDateChange: (val: string) => void;
  reportNumber: string;
  isPreview?: boolean;
  disabled?: boolean;
  totalPages?: number;
  currentPage?: number;
  isLastPage?: boolean;
}

export const FooterSignatures: React.FC<FooterSignaturesProps> = ({
  reportDate,
  onReportDateChange,
  reportNumber,
  isPreview = false,
  disabled = false,
  totalPages = 1,
  currentPage = 1,
  isLastPage = true,
}) => {
  return (
    <footer className="w-full flex flex-col justify-end avoid-break shrink-0">
      {/* Signatures block - ONLY present on the LAST page */}
      {isLastPage && (
        <div className="flex justify-between items-end mb-1.5 min-h-[48px] px-2 avoid-break shrink-0">
          {/* Date block: left side of last page */}
          <div className="flex flex-col items-center text-center shrink-0">
            <div className="w-[170px] min-h-[28px] flex items-end justify-center border-b border-slate-900 pb-0.5 relative group">
              {isPreview ? (
                <span className="text-[9pt] font-semibold text-slate-900 text-center min-h-[18px]">
                  {reportDate ? formatDatePL(reportDate) : ''}
                </span>
              ) : (
                <>
                  <div className="no-print w-full flex items-center justify-center">
                    <DatePicker
                      value={reportDate || ''}
                      disabled={disabled}
                      onChange={onReportDateChange}
                      align="center"
                      placeholder="Wybierz datę..."
                    />
                  </div>

                  {/* Print only: Clean date text or completely empty for handwriting */}
                  <div className="hidden print:block text-[9pt] font-semibold text-slate-950 text-center min-h-[16px]">
                    {reportDate ? formatDatePL(reportDate) : ''}
                  </div>
                </>
              )}
            </div>
            <div className="mt-0.5 text-[8pt] font-extrabold text-[#0f2742] leading-tight">
              Data
            </div>
            <div className="text-[6.8pt] text-slate-500 italic leading-tight">
              Date
            </div>
          </div>

          {/* Employer stamp & signature: right side of last page */}
          <div className="flex flex-col items-center text-center shrink-0">
            <div className="w-[220px] min-h-[28px] border-b border-slate-900">
              {/* Stamp and signature line space */}
            </div>
            <div className="mt-0.5 text-[8pt] font-extrabold text-[#0f2742] leading-tight">
              Pieczątka i podpis zlecającego
            </div>
            <div className="text-[6.8pt] text-slate-500 italic leading-tight">
              Stamp and signature of Employer
            </div>
          </div>
        </div>
      )}

      {/* Document Footer: Visible both on screen and print, always shows real page numbering on EVERY page */}
      <div className="pt-1 border-t border-slate-400 text-slate-600 text-[7.5pt] flex justify-between items-center px-1 font-mono shrink-0">
        <div>
          <span>Nr raportu: </span>
          <strong className="text-slate-900 font-bold tracking-wider">
            {reportNumber || '—'}
          </strong>
        </div>
        <div className="text-right">
          <span className="font-semibold text-slate-700">
            {totalPages > 1 ? `Strona ${currentPage}/${totalPages}` : 'Strona 1/1'}
          </span>
        </div>
      </div>
    </footer>
  );
};
