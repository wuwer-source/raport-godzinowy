import React, { useRef } from 'react';
import {
  Cloud,
  CloudOff,
  Code,
  Download,
  Eye,
  EyeOff,
  FileCheck2,
  FileSpreadsheet,
  FolderOpen,
  Lock,
  Moon,
  PlusCircle,
  Printer,
  Save,
  Settings,
  Sun,
  Upload,
} from 'lucide-react';

interface ToolbarProps {
  onSave: () => void;
  onOpenManager: () => void;
  onOpenSettings: () => void;
  onExportJson: () => void;
  onExportCsv: () => void;
  onExportHtml: () => void;
  onImportJson: (file: File) => void;
  onClear: () => void;
  onPrint: () => void;
  onGenerateDocNumber: () => void;
  isDocumentGenerated: boolean;
  currentReportNumber: string;
  nextPreviewNumber?: string;
  isDirty: boolean;
  currentProfileName: string;
  isPreviewMode: boolean;
  onTogglePreview: () => void;
  isDarkTheme: boolean;
  onToggleTheme: () => void;
  isCloudConnected?: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onSave,
  onOpenManager,
  onOpenSettings,
  onExportJson,
  onExportCsv,
  onExportHtml,
  onImportJson,
  onClear,
  onPrint,
  onGenerateDocNumber,
  isDocumentGenerated,
  currentReportNumber,
  nextPreviewNumber,
  isDirty,
  currentProfileName,
  isPreviewMode,
  onTogglePreview,
  isDarkTheme,
  onToggleTheme,
  isCloudConnected = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportJson(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <header className="sticky top-2 z-40 mb-3 px-3 py-2 bg-[#0f2742]/95 backdrop-blur-md rounded-xl shadow-lg border border-slate-700/50 text-white no-print">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Left group */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Generate Document Number Button */}
          {!isDocumentGenerated ? (
            <button
              type="button"
              onClick={onGenerateDocNumber}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-extrabold text-slate-950 bg-amber-400 hover:bg-amber-300 active:scale-95 rounded-lg shadow-md transition-all cursor-pointer ring-3 ring-amber-300/70 animate-pulse"
              title="Nadaj kolejny numer raportu i odblokuj edycję"
            >
              <FileCheck2 className="w-4 h-4 text-slate-950" />
              Generuj dokument {nextPreviewNumber ? `(${nextPreviewNumber})` : ''}
            </button>
          ) : (
            <>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-blue-200 bg-blue-950/60 rounded-lg border border-blue-600/40">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Nr:</span>
                <span className="font-mono text-white tracking-wide">{currentReportNumber}</span>
              </div>
              <button
                type="button"
                onClick={onClear}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700/90 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                title="Wyczyść i przygotuj nowy raport (zablokowany do momentu wygenerowania nowego numeru)"
              >
                <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                Nowy raport
              </button>
            </>
          )}

          <button
            type="button"
            disabled={!isDocumentGenerated}
            onClick={onSave}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#165d9c] hover:bg-[#1a6db7] active:scale-95 rounded-lg shadow-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save className="w-3.5 h-3.5" />
            Zapisz raport
          </button>

          <button
            type="button"
            onClick={onOpenManager}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700/90 rounded-lg border border-slate-700 transition-colors cursor-pointer"
          >
            <FolderOpen className="w-3.5 h-3.5 text-blue-400" />
            Raporty
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700/90 rounded-lg border border-slate-700 transition-colors cursor-pointer"
            title="Słowniki i konfiguracja szablonu numeracji"
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            Ustawienia
          </button>

          {/* Cloud Firebase status badge */}
          {isCloudConnected ? (
            <span
              className="hidden lg:inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-600/40 shadow-2xs"
              title="Firebase Firestore połączony: Numeracja dokumentów jest synchronizowana w czasie rzeczywistym między wszystkimi pracownikami w chmurze"
            >
              <Cloud className="w-3.5 h-3.5 text-emerald-400" />
              <span>Chmura: aktywna</span>
            </span>
          ) : (
            <span
              className="hidden lg:inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold bg-slate-800/80 text-amber-300/90 border border-amber-600/30 shadow-2xs"
              title="Tryb offline (localStorage) - brak połączenia z Firestore"
            >
              <CloudOff className="w-3.5 h-3.5 text-amber-400" />
              <span>Pamięć lokalna</span>
            </span>
          )}

          {/* Locked / Dirty badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2 text-[11px] text-slate-300 font-medium">
            {!isDocumentGenerated ? (
              <span className="inline-flex items-center gap-1 text-amber-300 text-[11px]">
                <Lock className="w-3 h-3" /> Edycja zablokowana
              </span>
            ) : (
              <>
                <span
                  className={`w-2 h-2 rounded-full ${
                    isDirty ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                  }`}
                />
                <span className="truncate max-w-[150px]">
                  {!isDirty
                    ? currentProfileName
                      ? `Zapisano: ${currentProfileName}`
                      : 'Zapisano'
                    : 'Niezapisane zmiany'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right group */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Preview toggle */}
          <button
            type="button"
            onClick={onTogglePreview}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
              isPreviewMode
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-400 shadow-xs'
                : 'text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700/90 border-slate-700'
            }`}
            title="Przełącz podgląd A4 wydruku"
          >
            {isPreviewMode ? (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                Edycja
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                Podgląd A4
              </>
            )}
          </button>

          {/* Export HTML */}
          <button
            type="button"
            onClick={onExportHtml}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800/60 hover:bg-slate-700/80 rounded-lg border border-slate-700/70 transition-colors cursor-pointer"
            title="Pobierz edytowalny plik HTML do pracy offline"
          >
            <Code className="w-3.5 h-3.5 text-orange-400" />
            HTML
          </button>

          {/* Export JSON */}
          <button
            type="button"
            onClick={onExportJson}
            className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-700/80 rounded-lg border border-slate-700/70 transition-colors cursor-pointer"
            title="Eksportuj kopię zapasową JSON"
          >
            <Download className="w-3.5 h-3.5" />
            JSON
          </button>

          {/* Export CSV */}
          <button
            type="button"
            onClick={onExportCsv}
            className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-700/80 rounded-lg border border-slate-700/70 transition-colors cursor-pointer"
            title="Eksportuj do arkusza CSV (Excel)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            CSV
          </button>

          {/* Import JSON */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-700/80 rounded-lg border border-slate-700/70 transition-colors cursor-pointer"
            title="Zaimportuj raport z pliku JSON"
          >
            <Upload className="w-3.5 h-3.5" />
            Import
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Clear / New */}
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-slate-400 hover:text-red-300 bg-slate-800/60 hover:bg-slate-700/80 rounded-lg border border-slate-700/70 transition-colors cursor-pointer"
            title="Wyczyść i przygotuj nowy raport"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Nowy
          </button>

          {/* Theme toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-1.5 text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-700/80 rounded-lg border border-slate-700/70 transition-colors cursor-pointer"
            title="Zmień motyw tła"
          >
            {isDarkTheme ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          {/* Print / PDF button */}
          <button
            type="button"
            onClick={onPrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#0f2742] bg-white hover:bg-slate-100 active:scale-95 rounded-lg shadow-sm transition-all cursor-pointer ml-1"
            title="Drukuj lub zapisz jako PDF (czysta strona lub wypełniona)"
          >
            <Printer className="w-3.5 h-3.5 text-blue-700" />
            Drukuj / PDF
          </button>
        </div>
      </div>
    </header>
  );
};
