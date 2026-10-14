import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface ToastProps {
  message: string | null;
  isError?: boolean;
}

export const Toast: React.FC<ToastProps> = ({ message, isError = false }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 text-xs font-semibold rounded-xl shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200 no-print border transition-all text-white bg-slate-900 border-slate-700">
      {isError ? (
        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
      ) : (
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
      )}
      <span>{message}</span>
    </div>
  );
};
