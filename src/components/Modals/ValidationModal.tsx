import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  errors: string[];
}

export const ValidationModal: React.FC<ValidationModalProps> = ({
  isOpen,
  onClose,
  onContinue,
  errors,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-amber-100 bg-amber-50/60">
          <div className="flex items-center gap-2 text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="text-base font-bold">Weryfikacja danych raportu</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 max-h-[60vh] overflow-y-auto">
          <p className="text-sm text-slate-600 mb-3">
            Wykryto brakujące lub niekompletne informacje w formularzu:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-amber-900 bg-amber-50/50 p-3.5 rounded-lg border border-amber-200/70 font-medium">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>

        <div className="flex justify-end gap-2.5 px-5 py-3.5 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Wróć i popraw
          </button>
          <button
            type="button"
            onClick={onContinue}
            className="px-5 py-2 text-sm font-semibold text-white bg-[#165d9c] hover:bg-[#0d4d86] rounded-lg shadow-sm transition-all cursor-pointer"
          >
            Kontynuuj mimo to
          </button>
        </div>
      </div>
    </div>
  );
};
