import React from 'react';
import { Clock, RotateCcw, X } from 'lucide-react';
import { ReportSnapshot } from '../../types';
import { formatDateTimePL } from '../../utils/dateUtils';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportName: string;
  history: ReportSnapshot[];
  onRestore: (index: number) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  reportName,
  history,
  onRestore,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-[#0f2742]">
              Historia wersji: <span className="text-slate-600 font-normal">{reportName}</span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 max-h-[60vh] overflow-y-auto">
          {history.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-500 italic">
              Brak wcześniejszych wersji w historii. Historia tworzona jest automatycznie przy każdym kolejnym zapisie raportu o tej samej nazwie.
            </div>
          ) : (
            <div className="space-y-2.5">
              {history
                .slice()
                .reverse()
                .map((item, revIdx) => {
                  const actualIdx = history.length - 1 - revIdx;
                  return (
                    <div
                      key={revIdx}
                      className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
                    >
                      <div>
                        <div className="text-sm font-bold text-slate-800">
                          {formatDateTimePL(item.savedAt)}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Nr: {item.header?.report_number || '—'} · Projekt: {item.header?.num_projektu || '—'} · Wykonawca: {item.header?.wykonawca || '—'} · Wierszy: {item.rows?.length || 0}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onRestore(actualIdx);
                          onClose();
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#165d9c] bg-white border border-slate-300 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-all shadow-2xs cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Przywróć
                      </button>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        <div className="flex justify-end px-5 py-3.5 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
};
