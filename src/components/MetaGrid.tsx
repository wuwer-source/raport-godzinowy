import React from 'react';
import { Dictionaries, ReportHeader } from '../types';

interface MetaGridProps {
  header: ReportHeader;
  onChange: (field: keyof ReportHeader, value: string) => void;
  dictionaries: Dictionaries;
  isPreview?: boolean;
  disabled?: boolean;
}

interface MetaFieldConfig {
  id: keyof ReportHeader;
  labelPl: string;
  labelEn: string;
  dictKey?: keyof Dictionaries;
  type?: 'text' | 'number';
}

const BLOCK_1_LEFT: MetaFieldConfig[] = [
  { id: 'num_projektu', labelPl: 'Numer projektu:', labelEn: 'Project number' },
  { id: 'wykonawca', labelPl: 'Wykonawca:', labelEn: "Contractor's name", dictKey: 'wykonawca' },
  { id: 'funkcja', labelPl: 'Funkcja:', labelEn: 'Function', dictKey: 'funkcja' },
];

const BLOCK_1_RIGHT: MetaFieldConfig[] = [
  { id: 'num_zamowienia', labelPl: 'Numer zamówienia:', labelEn: 'Customer order' },
  { id: 'zlecajacy', labelPl: 'Zlecający:', labelEn: 'Employer', dictKey: 'zlecajacy' },
  { id: 'miejsce', labelPl: 'Miejsce wykonania prac:', labelEn: 'Place of works', dictKey: 'miejsce' },
];

export const MetaGrid: React.FC<MetaGridProps> = ({
  header,
  onChange,
  dictionaries,
  isPreview = false,
  disabled = false,
}) => {
  const renderStandardField = (f: MetaFieldConfig) => {
    const val = header[f.id] || '';
    const listId = f.dictKey ? `datalist_${f.dictKey}` : undefined;

    return (
      <div
        key={f.id}
        className="meta-print-row grid grid-cols-[42%_58%] min-h-[28px] border border-slate-300 rounded-lg overflow-hidden bg-white shadow-2xs"
      >
        <div className="flex flex-col justify-center px-2 py-0.5 bg-[#eef2f7] border-r border-slate-200">
          <strong className="text-[8pt] font-semibold text-slate-900 leading-tight">
            {f.labelPl}
          </strong>
          <span className="text-[6.5pt] text-slate-500 italic leading-tight">
            {f.labelEn}
          </span>
        </div>

        <div className="flex items-center px-1.5 py-0.5 bg-white">
          {isPreview ? (
            <div className="w-full text-[8.2pt] font-medium text-slate-950 truncate print:font-semibold">
              {val}
            </div>
          ) : (
            <>
              <input
                type={f.type || 'text'}
                value={val}
                onChange={(e) => onChange(f.id, e.target.value)}
                list={listId}
                disabled={disabled}
                className="w-full text-[8.2pt] font-medium text-slate-900 bg-transparent border-0 border-b border-slate-300 focus:border-[#165d9c] focus:outline-hidden py-0.5 px-1 no-print disabled:opacity-60 disabled:cursor-not-allowed"
                placeholder={disabled ? 'Generuj dokument aby edytować' : ''}
                autoComplete="off"
              />
              <div className="hidden print:block w-full text-[8pt] font-semibold text-slate-950">
                {val}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <section className="avoid-break mb-1.5">
      {/* Block 1: 3 fields on the left, 3 fields on the right */}
      <div className="grid grid-cols-2 gap-1.5">
        <div className="flex flex-col gap-1.5">
          {BLOCK_1_LEFT.map(renderStandardField)}
        </div>
        <div className="flex flex-col gap-1.5">
          {BLOCK_1_RIGHT.map(renderStandardField)}
        </div>
      </div>

      {/* Subtle separator line */}
      <div className="my-1.5 border-b border-slate-200/90 print:border-slate-300" />

      {/* Block 2: Below the line */}
      <div className="grid grid-cols-2 gap-1.5">
        {/* Left: Nr rej. pojazdu */}
        <div>
          {renderStandardField({
            id: 'pojazd',
            labelPl: 'Nr rej. pojazdu:',
            labelEn: 'Vehicle Reg. No.',
            dictKey: 'pojazd',
          })}
        </div>

        {/* Right: In one single row: Route - km & Nights */}
        <div className="grid grid-cols-2 gap-1.5">
          {/* Trasa - km */}
          <div className="meta-print-row grid grid-cols-[48%_52%] min-h-[28px] border border-slate-300 rounded-lg overflow-hidden bg-white shadow-2xs">
            <div className="flex flex-col justify-center px-1.5 py-0.5 bg-[#eef2f7] border-r border-slate-200">
              <strong className="text-[7.5pt] font-semibold text-slate-900 leading-tight">
                Trasa – km:
              </strong>
              <span className="text-[6.2pt] text-slate-500 italic leading-tight">
                Route – km
              </span>
            </div>
            <div className="flex items-center px-1.5 py-0.5 bg-white">
              {isPreview ? (
                <div className="w-full text-[8pt] font-medium text-slate-950 truncate print:font-semibold text-center">
                  {header.trasa_km}
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    value={header.trasa_km}
                    onChange={(e) => onChange('trasa_km', e.target.value)}
                    list="datalist_trasa_km"
                    disabled={disabled}
                    className="w-full text-[8pt] font-medium text-slate-900 bg-transparent border-0 border-b border-slate-300 focus:border-[#165d9c] focus:outline-hidden py-0.5 px-0.5 no-print disabled:opacity-60 disabled:cursor-not-allowed text-center"
                    autoComplete="off"
                  />
                  <div className="hidden print:block w-full text-[7.8pt] font-semibold text-slate-950 text-center">
                    {header.trasa_km}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Ilość noclegów */}
          <div className="meta-print-row grid grid-cols-[48%_52%] min-h-[28px] border border-slate-300 rounded-lg overflow-hidden bg-white shadow-2xs">
            <div className="flex flex-col justify-center px-1.5 py-0.5 bg-[#eef2f7] border-r border-slate-200">
              <strong className="text-[7.5pt] font-semibold text-slate-900 leading-tight">
                Noclegi:
              </strong>
              <span className="text-[6.2pt] text-slate-500 italic leading-tight">
                Nights
              </span>
            </div>
            <div className="flex items-center px-1.5 py-0.5 bg-white">
              {isPreview ? (
                <div className="w-full text-[8pt] font-medium text-slate-950 truncate print:font-semibold text-center">
                  {header.noclegi}
                </div>
              ) : (
                <>
                  <input
                    type="number"
                    min={0}
                    value={header.noclegi}
                    onChange={(e) => onChange('noclegi', e.target.value)}
                    list="datalist_noclegi"
                    disabled={disabled}
                    className="w-full text-[8pt] font-medium text-slate-900 bg-transparent border-0 border-b border-slate-300 focus:border-[#165d9c] focus:outline-hidden py-0.5 px-0.5 no-print disabled:opacity-60 disabled:cursor-not-allowed text-center"
                    autoComplete="off"
                  />
                  <div className="hidden print:block w-full text-[7.8pt] font-semibold text-slate-950 text-center">
                    {header.noclegi}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Autocomplete Datalists */}
      {(Object.keys(dictionaries) as (keyof Dictionaries)[]).map((key) => (
        <datalist id={`datalist_${key}`} key={key}>
          {dictionaries[key].map((item, idx) => (
            <option key={idx} value={item} />
          ))}
        </datalist>
      ))}
    </section>
  );
};
