import React, { useState, useEffect } from 'react';
import { Hash, Plus, RotateCcw, Settings, X } from 'lucide-react';
import { Dictionaries, NumberingSettings } from '../../types';
import { formatReportNumber } from '../../utils/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  dictionaries: Dictionaries;
  onUpdateDictionaries: (updated: Dictionaries) => void;
  onResetDefaults: () => void;
  numberingSettings: NumberingSettings;
  onUpdateNumberingSettings: (settings: NumberingSettings) => void;
}

const DICT_LABELS: Record<keyof Dictionaries, string> = {
  wykonawca: 'Wykonawcy',
  zlecajacy: 'Zlecający',
  funkcja: 'Funkcje / stanowiska',
  miejsce: 'Miejsca wykonania prac',
  pojazd: 'Pojazdy służbowe',
  trasa_km: 'Domyślne trasy / km',
  noclegi: 'Liczba noclegów',
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  dictionaries,
  onUpdateDictionaries,
  onResetDefaults,
  numberingSettings,
  onUpdateNumberingSettings,
}) => {
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [prefix, setPrefix] = useState<string>(numberingSettings.prefix);
  const [year, setYear] = useState<string>(numberingSettings.year);
  const [nextSeq, setNextSeq] = useState<number>(numberingSettings.nextSeq);

  useEffect(() => {
    if (isOpen) {
      setPrefix(numberingSettings.prefix);
      setYear(numberingSettings.year);
      setNextSeq(numberingSettings.nextSeq);
    }
  }, [isOpen, numberingSettings]);

  if (!isOpen) return null;

  const handleSaveNumbering = (newPrefix = prefix, newYear = year, newSeq = nextSeq) => {
    onUpdateNumberingSettings({
      prefix: newPrefix.trim() || 'KG',
      year: newYear.trim() || '26',
      nextSeq: Math.max(1, Number(newSeq) || 1),
    });
  };

  const handleAdd = (key: keyof Dictionaries) => {
    const val = (inputs[key] || '').trim();
    if (!val) return;

    if (!dictionaries[key].some((x) => x.localeCompare(val, 'pl', { sensitivity: 'accent' }) === 0)) {
      const next = {
        ...dictionaries,
        [key]: [...dictionaries[key], val],
      };
      onUpdateDictionaries(next);
    }
    setInputs((prev) => ({ ...prev, [key]: '' }));
  };

  const handleRemove = (key: keyof Dictionaries, index: number) => {
    const next = {
      ...dictionaries,
      [key]: dictionaries[key].filter((_, i) => i !== index),
    };
    onUpdateDictionaries(next);
  };

  const previewFormatted = formatReportNumber(prefix, year, nextSeq);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-[#0f2742]">
              Ustawienia numeracji i słowniki podpowiedzi
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section: Numbering Settings */}
          <div className="border border-blue-200 bg-blue-50/40 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-blue-700" />
                <h4 className="text-sm font-bold text-[#0f2742]">
                  Konfiguracja szablonu numeracji dokumentów (KG / ROK / NUMER)
                </h4>
              </div>
              <div className="text-xs font-mono bg-white px-2.5 py-1 rounded border border-blue-300 text-blue-900 font-bold shadow-2xs">
                Wzór kolejnego: <span className="text-[#165d9c]">{previewFormatted}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-3">
              Aplikacja automatycznie nadaje rok (2 ostatnie cyfry) po 1 stycznia, lecz możesz skorygować rok oraz numer startowy, od którego zacznie liczyć kolejne raporty.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Prefiks dokumentu
                </label>
                <input
                  type="text"
                  value={prefix}
                  onChange={(e) => {
                    setPrefix(e.target.value);
                    handleSaveNumbering(e.target.value, year, nextSeq);
                  }}
                  className="w-full px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-md focus:border-blue-600 focus:outline-hidden"
                  placeholder="KG"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Rok (2 cyfry)
                </label>
                <input
                  type="text"
                  maxLength={2}
                  value={year}
                  onChange={(e) => {
                    setYear(e.target.value);
                    handleSaveNumbering(prefix, e.target.value, nextSeq);
                  }}
                  className="w-full px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-md focus:border-blue-600 focus:outline-hidden"
                  placeholder="26"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Następny kolejny numer (licznik)
                </label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={nextSeq}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 1;
                    setNextSeq(val);
                    handleSaveNumbering(prefix, year, val);
                  }}
                  className="w-full px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-md focus:border-blue-600 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Section: Dictionaries */}
          <div>
            <h4 className="text-xs font-bold text-[#0f2742] uppercase tracking-wider mb-3">
              Słowniki podpowiedzi pól
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(Object.keys(DICT_LABELS) as (keyof Dictionaries)[]).map((key) => {
                const items = dictionaries[key] || [];

                return (
                  <div
                    key={key}
                    className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/50 flex flex-col justify-between"
                  >
                    <div>
                      <h5 className="text-xs font-bold text-[#0f2742] uppercase tracking-wider mb-2">
                        {DICT_LABELS[key]}
                      </h5>

                      {/* Add row */}
                      <div className="flex gap-1.5 mb-2.5">
                        <input
                          type="text"
                          value={inputs[key] || ''}
                          onChange={(e) =>
                            setInputs((prev) => ({ ...prev, [key]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAdd(key);
                            }
                          }}
                          placeholder="Wpisz i naciśnij Enter..."
                          className="flex-1 px-2.5 py-1 text-xs bg-white border border-slate-300 rounded focus:border-blue-600 focus:outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() => handleAdd(key)}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Chip list */}
                      <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto pr-1">
                        {items.length === 0 ? (
                          <span className="text-xs text-slate-400 italic">Brak pozycji</span>
                        ) : (
                          items.map((item, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs bg-white border border-slate-200 text-slate-800 rounded-full shadow-2xs"
                            >
                              <span>{item}</span>
                              <button
                                type="button"
                                onClick={() => handleRemove(key, idx)}
                                className="text-slate-400 hover:text-red-600 font-bold ml-0.5 cursor-pointer"
                              >
                                ×
                              </button>
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={onResetDefaults}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Przywróć domyślne
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-white bg-[#165d9c] hover:bg-[#0d4d86] rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            Zapisz i zamknij
          </button>
        </div>
      </div>
    </div>
  );
};
