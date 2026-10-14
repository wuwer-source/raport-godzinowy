import React from 'react';
import { TotalsResult } from '../types';

interface SummarySectionProps {
  totals: TotalsResult;
}

export const SummarySection: React.FC<SummarySectionProps> = ({ totals }) => {
  const cards = [
    { labelPl: 'Delegacja', labelEn: 'Delegation', val: totals.del, desc: 'Godziny w delegacji' },
    { labelPl: 'Biuro', labelEn: 'Office', val: totals.biuro, desc: 'Godziny w biurze' },
    { labelPl: 'Weekend / Święto', labelEn: 'Weekend / Holiday', val: totals.weekendHoliday, desc: 'Łączne godziny w soboty, niedziele oraz święta' },
    { labelPl: 'Razem', labelEn: 'Total', val: totals.total, desc: 'Łączny czas rozliczeniowy', highlight: true },
  ];

  return (
    <section className="avoid-break mb-1">
      <div className="grid grid-cols-4 gap-1.5">
        {cards.map((c) => {
          const hasVal = c.val > 0;
          return (
            <div
              key={c.labelPl}
              className={`border rounded-md p-1 sm:p-1.5 text-center flex flex-col justify-between min-h-[44px] transition-colors ${
                c.highlight
                  ? 'bg-blue-50/80 border-blue-300 print:bg-slate-100 print:border-slate-400'
                  : 'bg-slate-50/80 border-slate-300 print:bg-white print:border-slate-300'
              }`}
              title={c.desc}
            >
              <div>
                <div className="text-[7.2pt] font-bold text-slate-700 uppercase tracking-tight leading-tight">
                  {c.labelPl}
                </div>
                <div className="text-[6pt] font-medium text-slate-500 italic leading-tight">
                  {c.labelEn}
                </div>
              </div>
              <div
                className={`text-[10.5pt] font-extrabold tracking-tight leading-tight mt-0.5 ${
                  c.highlight ? 'text-[#165d9c]' : 'text-[#0f2742]'
                }`}
              >
                {/* On screen */}
                <span className="print:hidden">
                  {c.val.toFixed(2)}{' '}
                  <span className="text-[7.5pt] font-normal text-slate-500">h</span>
                </span>
                {/* In print: if 0, print COMPLETELY EMPTY so it can be filled by pen! */}
                <span className="hidden print:inline">
                  {hasVal ? `${c.val.toFixed(2)} h` : ''}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
