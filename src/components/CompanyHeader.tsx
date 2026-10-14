import React from 'react';
import { FileCheck2, Lock } from 'lucide-react';

interface CompanyHeaderProps {
  reportNumber?: string;
  isGenerated?: boolean;
  onGenerate?: () => void;
}

export const CompanyHeader: React.FC<CompanyHeaderProps> = ({
  reportNumber = '',
  isGenerated = true,
  onGenerate,
}) => {
  return (
    <header className="avoid-break mb-1.5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-1">
        <div className="text-[9pt] leading-tight text-slate-800">
          <div className="text-[13pt] font-extrabold tracking-tight text-[#0f2742]">
            WUWER Sp. z o.o.
          </div>
          <div className="mt-0.5 text-slate-600">
            ul. Gen. Hallera 18a<br />
            41-709 Ruda Śląska<br />
            Telefon: (0 48 32) 244 99 70
          </div>
        </div>

        <div className="w-[190px] sm:w-[220px] shrink-0">
          <svg
            className="w-full h-auto block"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 320 100"
            aria-label="WUWER conveying & automation"
            role="img"
          >
            <g>
              <rect x="180" y="8" width="120" height="9" rx="4.5" fill="#f8e06c" />
              <circle cx="192" cy="24" r="5" fill="#bcbec0" />
              <circle cx="208" cy="24" r="5" fill="#bcbec0" />
              <circle cx="224" cy="24" r="5" fill="#bcbec0" />
              <circle cx="240" cy="24" r="5" fill="#bcbec0" />
              <circle cx="256" cy="24" r="5" fill="#bcbec0" />
              <circle cx="272" cy="24" r="5" fill="#bcbec0" />
              <circle cx="288" cy="24" r="5" fill="#bcbec0" />
            </g>
            <text
              x="160"
              y="72"
              fontFamily="Inter, Segoe UI, Arial, sans-serif"
              fontSize="48"
              fontWeight="700"
              fill="#003b70"
              textAnchor="middle"
              letterSpacing="2"
            >
              WUWER
            </text>
            <text
              x="298"
              y="86"
              fontFamily="Inter, Segoe UI, Arial, sans-serif"
              fontSize="12"
              fill="#003b70"
              textAnchor="end"
            >
              conveying &amp; automation
            </text>
            <g>
              <circle cx="32" cy="80" r="5" fill="#bcbec0" />
              <circle cx="48" cy="80" r="5" fill="#bcbec0" />
              <circle cx="64" cy="80" r="5" fill="#bcbec0" />
              <circle cx="80" cy="80" r="5" fill="#bcbec0" />
              <circle cx="96" cy="80" r="5" fill="#bcbec0" />
              <circle cx="112" cy="80" r="5" fill="#bcbec0" />
              <circle cx="128" cy="80" r="5" fill="#bcbec0" />
              <rect x="20" y="89" width="120" height="9" rx="4.5" fill="#f8e06c" />
            </g>
          </svg>
        </div>
      </div>

      <div className="border-l-[5px] border-[#165d9c] rounded-r-md px-3 py-1.5 bg-gradient-to-r from-[#eaf2fa] to-[#f7f9fc] border-t border-r border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h1 className="text-[#0f2742] text-[13pt] sm:text-[14pt] font-extrabold uppercase tracking-wide leading-snug">
            Protokół / Raport wykonania prac
          </h1>
          <p className="text-slate-500 text-[8.5pt] italic leading-tight">
            Final protocol / Work Completion Report
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-1.5 self-end sm:self-center">
          {reportNumber ? (
            <div className="px-3 py-1 bg-white border border-slate-300 rounded-md shadow-2xs font-mono text-center">
              <span className="text-[6.8pt] text-slate-500 uppercase block font-sans font-semibold leading-tight">
                Nr raportu
              </span>
              <span className="text-[10pt] font-extrabold text-[#0f2742] tracking-wider leading-tight">
                {reportNumber}
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={onGenerate}
              className="no-print px-3 py-1.5 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-bold rounded-lg text-xs shadow-sm ring-2 ring-amber-400/50 animate-pulse cursor-pointer flex items-center gap-1.5"
              title="Nadaj oficjalny numer raportu i odblokuj dokument"
            >
              <FileCheck2 className="w-4 h-4" />
              Generuj dokument
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

