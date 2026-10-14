import React, { useState, useMemo } from 'react';
import { Copy, Edit3, FolderOpen, History, Plus, Search, Trash2, X } from 'lucide-react';
import { SavedReport } from '../../types';
import { formatDatePL } from '../../utils/dateUtils';

interface ManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  reports: Record<string, SavedReport>;
  onOpenReport: (name: string) => void;
  onNewReport: () => void;
  onDuplicateReport: (name: string) => void;
  onRenameReport: (name: string) => void;
  onOpenHistory: (name: string) => void;
  onDeleteReport: (name: string) => void;
}

export const ManagerModal: React.FC<ManagerModalProps> = ({
  isOpen,
  onClose,
  reports,
  onOpenReport,
  onNewReport,
  onDuplicateReport,
  onRenameReport,
  onOpenHistory,
  onDeleteReport,
}) => {
  const [query, setQuery] = useState('');

  const reportList = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('pl');
    return Object.entries(reports)
      .map(([name, data]) => ({ name, data }))
      .filter(({ name, data }) => {
        const h = data.header || {};
        const haystack = [
          name,
          h.report_number,
          h.num_projektu,
          h.wykonawca,
          h.miejsce,
          h.data_stopka,
        ]
          .join(' ')
          .toLocaleLowerCase('pl');
        return haystack.includes(q);
      })
      .sort((a, b) => (b.data.savedAt || '').localeCompare(a.data.savedAt || ''));
  }, [reports, query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-[#0f2742]">
              Menedżer raportów
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar in modal */}
        <div className="flex flex-col sm:flex-row gap-3 px-6 py-3.5 bg-slate-50 border-b border-slate-200">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Szukaj po nazwie, nr projektu, wykonawcy, miejscu..."
              className="w-full pl-9 pr-3.5 py-1.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              onNewReport();
              onClose();
            }}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs sm:text-sm font-semibold text-white bg-[#165d9c] hover:bg-[#0d4d86] rounded-lg shadow-2xs transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            Nowy raport
          </button>
        </div>

        {/* Table list */}
        <div className="flex-1 overflow-y-auto p-6">
          {reportList.length === 0 ? (
            <div className="text-center py-12 text-sm text-slate-500 italic">
              {query ? 'Brak raportów spełniających kryteria wyszukiwania.' : 'Brak zapisanych raportów w pamięci.'}
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                    <th className="py-2.5 px-3 font-bold">Nazwa raportu</th>
                    <th className="py-2.5 px-3 font-bold">Nr projektu</th>
                    <th className="py-2.5 px-3 font-bold">Wykonawca</th>
                    <th className="py-2.5 px-3 font-bold">Data</th>
                    <th className="py-2.5 px-3 font-bold">Miejsce</th>
                    <th className="py-2.5 px-3 font-bold text-right">Akcje</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportList.map(({ name, data }) => {
                    const h = data.header || {};
                    const historyCount = Array.isArray(data.history) ? data.history.length : 0;

                    return (
                      <tr key={name} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {h.report_number || 'brak numeru'}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">{h.num_projektu || '—'}</td>
                        <td className="py-2.5 px-3 text-slate-700">{h.wykonawca || '—'}</td>
                        <td className="py-2.5 px-3 text-slate-700">{formatDatePL(h.data_stopka) || '—'}</td>
                        <td className="py-2.5 px-3 text-slate-700 max-w-[140px] truncate">{h.miejsce || '—'}</td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1 flex-wrap">
                            <button
                              type="button"
                              onClick={() => {
                                onOpenReport(name);
                                onClose();
                              }}
                              className="px-2.5 py-1 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors cursor-pointer"
                            >
                              Otwórz
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenHistory(name)}
                              className="inline-flex items-center gap-0.5 px-2 py-1 text-[11px] text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Historia wersji"
                            >
                              <History className="w-3 h-3" />
                              <span>({historyCount})</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onDuplicateReport(name)}
                              className="p-1 text-slate-600 hover:text-blue-700 hover:bg-slate-100 rounded cursor-pointer"
                              title="Duplikuj"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onRenameReport(name)}
                              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer"
                              title="Zmień nazwę"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteReport(name)}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"
                              title="Usuń"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-3.5 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
};
