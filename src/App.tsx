import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dictionaries,
  NumberingSettings,
  ReportHeader,
  ReportRow,
  ReportSnapshot,
  SavedReport,
} from './types';
import {
  calculateTotals,
  createEmptyRow,
  generateCsvContent,
  safeFilePart,
  validateReport,
} from './utils/calculations';
import { addDaysISO, todayISO } from './utils/dateUtils';
import {
  DEFAULT_DICTS,
  DEFAULT_NUMBERING,
  generateNextReportNumber,
  getDictionaries,
  getNumberingSettings,
  getSavedReports,
  INITIAL_HEADER,
  loadDraftFromStorage,
  migrateOldStorage,
  saveDictionaries,
  saveDraftToStorage,
  saveNumberingSettings,
  saveReports,
  stripHistory,
  THEME_KEY,
  DRAFT_KEY,
  formatReportNumber,
} from './utils/storage';
import {
  subscribeGlobalNumbering,
  generateGlobalNextReportNumber,
  updateGlobalNumberingSettings,
} from './utils/firebase';
import { exportEditableHtmlFile } from './utils/htmlExporter';
import { computePages } from './utils/pagination';
import { DocumentPagesView } from './components/DocumentPagesView';
import { CompanyHeader } from './components/CompanyHeader';
import { MetaGrid } from './components/MetaGrid';
import { HoursTable } from './components/HoursTable';
import { SummarySection } from './components/SummarySection';
import { FooterSignatures } from './components/FooterSignatures';
import { Toolbar } from './components/Toolbar';
import { SaveModal } from './components/Modals/SaveModal';
import { ValidationModal } from './components/Modals/ValidationModal';
import { ConfirmModal } from './components/Modals/ConfirmModal';
import { RenameModal } from './components/Modals/RenameModal';
import { HistoryModal } from './components/Modals/HistoryModal';
import { ManagerModal } from './components/Modals/ManagerModal';
import { SettingsModal } from './components/Modals/SettingsModal';
import { Toast } from './components/Toast';
import { AlertCircle, ArrowLeft, FileCheck2, Lock, Printer } from 'lucide-react';

const INITIAL_ROWS_COUNT = 10;

export default function App() {
  const [header, setHeader] = useState<ReportHeader>(INITIAL_HEADER);
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [currentProfile, setCurrentProfile] = useState<string>('');
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [dictionaries, setDictionaries] = useState<Dictionaries>(DEFAULT_DICTS);
  const [numberingSettings, setNumberingSettings] = useState<NumberingSettings>(DEFAULT_NUMBERING);
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(false);
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(false);
  const [isGeneratingNumber, setIsGeneratingNumber] = useState<boolean>(false);

  // Modals state
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [isManagerModalOpen, setIsManagerModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationAction, setValidationAction] = useState<(() => void) | null>(null);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [confirmMessage, setConfirmMessage] = useState<string>('');
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  const [isRenameModalOpen, setIsRenameModalOpen] = useState<boolean>(false);
  const [renameTargetName, setRenameTargetName] = useState<string>('');

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [historyTargetName, setHistoryTargetName] = useState<string>('');

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastIsError, setToastIsError] = useState<boolean>(false);

  const showToast = useCallback((msg: string, isError = false) => {
    setToastMsg(msg);
    setToastIsError(isError);
    setTimeout(() => {
      setToastMsg((current) => (current === msg ? null : current));
    }, 2800);
  }, []);

  // Is document generated / unlocked for editing?
  const isDocumentGenerated = Boolean(header.report_number && header.report_number.trim());

  // Initialize data on mount - document is ALWAYS locked at the start until user clicks "Generuj dokument"
  useEffect(() => {
    migrateOldStorage();
    setDictionaries(getDictionaries());
    setNumberingSettings(getNumberingSettings());

    const savedTheme = localStorage.getItem(THEME_KEY) === 'dark';
    setIsDarkTheme(savedTheme);

    // Document is always LOCKED on start with an empty report_number
    setHeader({
      ...INITIAL_HEADER,
      report_number: '',
      data_stopka: '',
    });
    setRows(Array.from({ length: INITIAL_ROWS_COUNT }, () => createEmptyRow()));
    setIsDirty(false);
  }, []);

  // Subscribe to real-time global numbering updates from Firebase Firestore
  useEffect(() => {
    const unsubscribe = subscribeGlobalNumbering((settings, isCloud) => {
      setNumberingSettings(settings);
      setIsCloudConnected(isCloud);
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Autosave draft on change only when active/unlocked
  useEffect(() => {
    if (isDocumentGenerated && rows.length > 0) {
      saveDraftToStorage(header, rows);
    }
  }, [header, rows, isDocumentGenerated]);

  // Totals
  const totals = useMemo(() => calculateTotals(rows), [rows]);

  // Next preview document number derived from real-time numberingSettings
  const nextPreviewNumber = useMemo(() => {
    try {
      return formatReportNumber(numberingSettings.prefix, numberingSettings.year, numberingSettings.nextSeq);
    } catch {
      return 'KG/26/001';
    }
  }, [numberingSettings]);

  // Measured DOM row heights for dynamic distance-based pagination
  const [measuredRowHeights, setMeasuredRowHeights] = useState<Record<string, number>>({});

  // Dynamic measuring of DOM row heights whenever rows change, window resizes, or before print
  const measureDomHeights = useCallback(() => {
    const trs = document.querySelectorAll<HTMLTableRowElement>('tr[data-row-id]');
    if (trs.length > 0) {
      const map: Record<string, number> = {};
      let changed = false;
      trs.forEach((tr) => {
        const id = tr.getAttribute('data-row-id');
        if (id) {
          const h = tr.offsetHeight;
          map[id] = h;
          if (measuredRowHeights[id] !== h) {
            changed = true;
          }
        }
      });
      if (changed) {
        setMeasuredRowHeights(map);
      }
    }
  }, [measuredRowHeights]);

  useEffect(() => {
    measureDomHeights();
    const timer = setTimeout(measureDomHeights, 100);
    window.addEventListener('beforeprint', measureDomHeights);
    window.addEventListener('resize', measureDomHeights);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeprint', measureDomHeights);
      window.removeEventListener('resize', measureDomHeights);
    };
  }, [measureDomHeights, rows]);

  // Pages breakdown for A4 preview and print using dynamic distance-based algorithm
  const pages = useMemo(() => computePages(rows, measuredRowHeights), [rows, measuredRowHeights]);
  const totalPages = pages.length;
  const pageBreakIndex = pages.length > 1 ? pages[0].rows.length : undefined;

  // Generate document number atomically from central Firebase Firestore and unlock editing
  const handleGenerateDocNumber = useCallback(async () => {
    if (isGeneratingNumber) return;
    setIsGeneratingNumber(true);
    try {
      const res = await generateGlobalNextReportNumber(true);
      setNumberingSettings(res.settings);
      setHeader((prev) => ({
        ...prev,
        report_number: res.reportNumber,
      }));
      setIsDirty(true);
      showToast(
        `Nadano unikalny numer: ${res.reportNumber}${
          res.isCloud ? ' (zsynchronizowany w chmurze Firebase)' : ''
        }. Edycja odblokowana!`
      );
    } catch (err) {
      console.error(err);
      showToast('Wystąpił błąd podczas nadawania numeru raportu.', true);
    } finally {
      setIsGeneratingNumber(false);
    }
  }, [isGeneratingNumber, showToast]);

  // Learn values into dictionaries
  const learnValues = useCallback((h: ReportHeader) => {
    let changed = false;
    const currentDicts = getDictionaries();
    const updated = { ...currentDicts };

    const checkAndAdd = (field: keyof Dictionaries, val: string) => {
      const trimmed = (val || '').trim();
      if (!trimmed) return;
      if (!updated[field].some((x) => x.localeCompare(trimmed, 'pl', { sensitivity: 'accent' }) === 0)) {
        updated[field] = [...updated[field], trimmed];
        changed = true;
      }
    };

    checkAndAdd('wykonawca', h.wykonawca);
    checkAndAdd('zlecajacy', h.zlecajacy);
    checkAndAdd('funkcja', h.funkcja);
    checkAndAdd('miejsce', h.miejsce);
    checkAndAdd('pojazd', h.pojazd);
    checkAndAdd('trasa_km', h.trasa_km);
    checkAndAdd('noclegi', h.noclegi);

    if (changed) {
      saveDictionaries(updated);
      setDictionaries(updated);
    }
  }, []);

  // Update header
  const handleHeaderChange = useCallback((field: keyof ReportHeader, value: string) => {
    setHeader((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  }, []);

  // Update rows
  const handleRowChange = useCallback((id: string, field: keyof ReportRow, value: string | number) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
    setIsDirty(true);
  }, []);

  const handleAddRows = useCallback((count: number) => {
    setRows((prev) => {
      const last = prev.at(-1);
      const newItems: ReportRow[] = [];
      let baseDate = last?.date || '';

      for (let i = 0; i < count; i++) {
        const nextDate = baseDate ? addDaysISO(baseDate, 1) : '';
        newItems.push(createEmptyRow({ date: nextDate }));
        if (nextDate) baseDate = nextDate;
      }
      return [...prev, ...newItems];
    });
    setIsDirty(true);
  }, []);

  const handleDuplicateRow = useCallback((id: string) => {
    setRows((prev) => {
      const idx = prev.findIndex((r) => r.id === id);
      if (idx < 0) return prev;
      const src = prev[idx];
      const copy = createEmptyRow({
        ...src,
        date: src.date ? addDaysISO(src.date, 1) : '',
      });
      const copyList = [...prev];
      copyList.splice(idx + 1, 0, copy);
      return copyList;
    });
    setIsDirty(true);
    showToast('Zduplikowano wiersz z datą kolejnego dnia.');
  }, [showToast]);

  const handleDeleteRow = useCallback((id: string) => {
    setRows((prev) => {
      if (prev.length <= 1) {
        showToast('Raport musi zawierać co najmniej jeden wiersz.', true);
        return prev;
      }
      return prev.filter((r) => r.id !== id);
    });
    setIsDirty(true);
  }, [showToast]);

  // Validation wrapper
  const runWithValidation = useCallback(
    (action: () => void) => {
      const errs = validateReport(header, rows);
      if (errs.length === 0) {
        action();
      } else {
        setValidationErrors(errs);
        setValidationAction(() => action);
        setIsValidationModalOpen(true);
      }
    },
    [header, rows]
  );

  // Save report
  const handleOpenSaveModal = useCallback(() => {
    if (!isDocumentGenerated) {
      showToast('Przed zapisem wygeneruj numer dokumentu.', true);
      return;
    }
    runWithValidation(() => {
      setIsSaveModalOpen(true);
    });
  }, [isDocumentGenerated, runWithValidation, showToast]);

  const handleConfirmSave = useCallback(
    (name: string) => {
      learnValues(header);

      const all = getSavedReports();
      const prev = all[name];

      const snapshot: ReportSnapshot = {
        version: 5,
        savedAt: new Date().toISOString(),
        header,
        rows: rows.map((r) => ({ ...r })),
      };

      const history = prev
        ? [...(Array.isArray(prev.history) ? prev.history.map(stripHistory) : []), stripHistory(prev)].slice(-20)
        : [];

      const toSave: SavedReport = {
        ...snapshot,
        history,
      };

      all[name] = toSave;
      saveReports(all);

      setCurrentProfile(name);
      setIsDirty(false);
      setIsSaveModalOpen(false);
      showToast(`Zapisano raport „${name}”.`);
    },
    [header, rows, learnValues, showToast]
  );

  // Clear / New report
  const handleClearForm = useCallback(() => {
    setConfirmMessage('Wyczyścić bieżący arkusz i przygotować nowy raport? Nowy arkusz zostanie zablokowany do momentu wygenerowania nowego numeru.');
    setConfirmAction(() => () => {
      setHeader({
        ...INITIAL_HEADER,
        report_number: '',
        data_stopka: '',
      });
      setRows(Array.from({ length: INITIAL_ROWS_COUNT }, () => createEmptyRow()));
      setCurrentProfile('');
      setIsDirty(false);
      localStorage.removeItem(DRAFT_KEY);
      showToast('Przygotowano nowy raport. Kliknij „Generuj dokument”, aby nadać kolejny numer i odblokować formularz.');
    });
    setIsConfirmModalOpen(true);
  }, [showToast]);

  // Print & PDF
  const handlePerformPrint = useCallback(() => {
    const docTitle = [
      header.report_number || 'Czysty_Raport',
      header.num_projektu,
      header.miejsce,
    ]
      .filter(Boolean)
      .map(safeFilePart)
      .join('_');

    const originalTitle = document.title;
    document.title = docTitle || `Raport_WUWER_${todayISO()}`;

    window.print();

    // Restore title after print dialog
    setTimeout(() => {
      document.title = originalTitle;
    }, 1500);
  }, [header]);

  const handlePrint = useCallback(() => {
    // If user prints a blank sheet to fill by hand with a pen, allow directly!
    const usedRowsCount = rows.filter(r => r.category || r.date || r.from || r.to || r.description).length;
    if (usedRowsCount === 0 && !header.num_projektu.trim()) {
      handlePerformPrint();
    } else {
      runWithValidation(handlePerformPrint);
    }
  }, [rows, header, runWithValidation, handlePerformPrint]);

  // Export HTML
  const handleExportHtml = useCallback(() => {
    exportEditableHtmlFile(header, rows);
    showToast('Pobrano autonomiczny, edytowalny plik HTML.');
  }, [header, rows, showToast]);

  // Export / Import JSON & CSV
  const handleExportJson = useCallback(() => {
    const data: ReportSnapshot = {
      version: 5,
      savedAt: new Date().toISOString(),
      header,
      rows,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const filename = `${safeFilePart(header.report_number || 'raport')}_${safeFilePart(
      header.num_projektu || todayISO()
    )}.json`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Wyeksportowano do pliku JSON.');
  }, [header, rows, showToast]);

  const handleExportCsv = useCallback(() => {
    const csv = generateCsvContent(header, rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const filename = `${safeFilePart(header.report_number || 'raport')}_${safeFilePart(
      header.num_projektu || todayISO()
    )}.csv`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Wyeksportowano do pliku CSV (Excel).');
  }, [header, rows, showToast]);

  const handleImportJson = useCallback(
    async (file: File) => {
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (!data || typeof data !== 'object') {
          throw new Error('Nieprawidłowy format pliku JSON.');
        }

        const h = data.header || {};
        setHeader({
          ...INITIAL_HEADER,
          ...h,
          report_number: h.report_number || '',
          data_stopka: h.data_stopka || todayISO(),
        });

        const newRows = Array.isArray(data.rows) && data.rows.length
          ? data.rows.map((r: any) => createEmptyRow(r))
          : Array.from({ length: INITIAL_ROWS_COUNT }, () => createEmptyRow());

        setRows(newRows);
        setCurrentProfile('');
        setIsDirty(true);
        showToast('Pomyślnie zaimportowano raport z pliku JSON.');
      } catch (err: any) {
        showToast(`Błąd importu: ${err.message}`, true);
      }
    },
    [showToast]
  );

  // Manager actions
  const handleOpenReportFromManager = useCallback(
    (name: string) => {
      const all = getSavedReports();
      const report = all[name];
      if (report) {
        setHeader({
          ...INITIAL_HEADER,
          ...(report.header || {}),
          data_stopka: report.header?.data_stopka || todayISO(),
        });
        setRows(
          (report.rows || []).map((r) => createEmptyRow(r))
        );
        setCurrentProfile(name);
        setIsDirty(false);
        showToast(`Otworzono raport „${name}”.`);
      }
    },
    [showToast]
  );

  const handleDuplicateReportFromManager = useCallback(
    async (name: string) => {
      const all = getSavedReports();
      const src = all[name];
      if (!src) return;

      let newName = `${name} - kopia`;
      let i = 2;
      while (all[newName]) {
        newName = `${name} - kopia ${i++}`;
      }

      const res = await generateGlobalNextReportNumber(true);
      setNumberingSettings(res.settings);

      const copy: SavedReport = {
        ...structuredClone(src),
        savedAt: new Date().toISOString(),
        header: {
          ...src.header,
          report_number: res.reportNumber,
        },
        history: [],
      };

      all[newName] = copy;
      saveReports(all);
      showToast(`Utworzono kopię „${newName}” z numerem ${res.reportNumber}.`);
    },
    [showToast]
  );

  const handleDeleteReportFromManager = useCallback(
    (name: string) => {
      setConfirmMessage(`Czy na pewno trwale usunąć raport „${name}”?`);
      setConfirmAction(() => () => {
        const all = getSavedReports();
        delete all[name];
        saveReports(all);
        if (currentProfile === name) {
          setCurrentProfile('');
          setIsDirty(true);
        }
        showToast(`Usunięto raport „${name}”.`);
      });
      setIsConfirmModalOpen(true);
    },
    [currentProfile, showToast]
  );

  const handleRenameReportFromManager = useCallback((name: string) => {
    setRenameTargetName(name);
    setIsRenameModalOpen(true);
  }, []);

  const handleCommitRename = useCallback(
    (newName: string) => {
      const all = getSavedReports();
      if (!all[renameTargetName]) return;
      if (all[newName]) {
        showToast('Raport o podanej nazwie już istnieje.', true);
        return;
      }

      all[newName] = all[renameTargetName];
      delete all[renameTargetName];
      saveReports(all);

      if (currentProfile === renameTargetName) {
        setCurrentProfile(newName);
      }
      showToast(`Zmieniono nazwę na „${newName}”.`);
    },
    [renameTargetName, currentProfile, showToast]
  );

  const handleOpenHistoryFromManager = useCallback((name: string) => {
    setHistoryTargetName(name);
    setIsHistoryModalOpen(true);
  }, []);

  const handleRestoreHistory = useCallback(
    (index: number) => {
      const all = getSavedReports();
      const cur = all[historyTargetName];
      if (!cur || !Array.isArray(cur.history) || !cur.history[index]) return;

      setConfirmMessage(
        `Przywrócić wybraną wersję raportu „${historyTargetName}”? Bieżący stan zostanie dopisany do historii.`
      );
      setConfirmAction(() => () => {
        const selected = structuredClone(cur.history![index]);
        const updatedHistory = [
          ...cur.history!.map(stripHistory),
          stripHistory(cur),
        ].slice(-20);

        const restored: SavedReport = {
          ...selected,
          savedAt: new Date().toISOString(),
          history: updatedHistory,
        };

        all[historyTargetName] = restored;
        saveReports(all);

        setHeader(restored.header);
        setRows(restored.rows.map((r) => createEmptyRow(r)));
        setCurrentProfile(historyTargetName);
        setIsDirty(false);
        showToast('Przywrócono wersję z historii.');
      });
      setIsConfirmModalOpen(true);
    },
    [historyTargetName, showToast]
  );

  // Settings & Dictionaries
  const handleUpdateDictionaries = useCallback((updated: Dictionaries) => {
    setDictionaries(updated);
    saveDictionaries(updated);
  }, []);

  const handleResetDictionaries = useCallback(() => {
    setConfirmMessage('Przywrócić domyślne listy podpowiedzi i słowniki?');
    setConfirmAction(() => () => {
      setDictionaries(structuredClone(DEFAULT_DICTS));
      saveDictionaries(DEFAULT_DICTS);
      showToast('Przywrócono domyślne słowniki.');
    });
    setIsConfirmModalOpen(true);
  }, [showToast]);

  const handleUpdateNumberingSettings = useCallback(
    async (updated: NumberingSettings) => {
      setNumberingSettings(updated);
      saveNumberingSettings(updated);
      const synced = await updateGlobalNumberingSettings(updated);
      showToast(
        synced
          ? 'Zaktualizowano szablon numeracji w chmurze Firebase (dla wszystkich pracowników).'
          : 'Zaktualizowano ustawienia szablonu numeracji (lokalnie).'
      );
    },
    [showToast]
  );

  // Theme toggle
  const handleToggleTheme = useCallback(() => {
    setIsDarkTheme((prev) => {
      const next = !prev;
      localStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
      return next;
    });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        const k = e.key.toLowerCase();
        if (k === 's') {
          e.preventDefault();
          handleOpenSaveModal();
        } else if (k === 'p') {
          e.preventDefault();
          handlePrint();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (isDocumentGenerated) {
            handleAddRows(1);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleOpenSaveModal, handlePrint, handleAddRows, isDocumentGenerated]);

  // Default suggested save name
  const suggestedSaveName = useMemo(() => {
    const nr = header.report_number || 'RDL';
    const proj = header.num_projektu ? ` - ${header.num_projektu}` : '';
    const date = header.data_stopka || todayISO();
    return currentProfile || `${nr}${proj} (${date})`;
  }, [header.report_number, header.num_projektu, header.data_stopka, currentProfile]);

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        isDarkTheme ? 'bg-[#0b121e] text-slate-100' : 'bg-[#dce4ee] text-slate-900'
      } p-2 sm:p-4 md:p-6 print:p-0 print:bg-white print:text-black`}
    >
      <div className="max-w-[210mm] mx-auto print:max-w-none">
        {/* Top Navbar Toolbar */}
        <Toolbar
          onSave={handleOpenSaveModal}
          onOpenManager={() => setIsManagerModalOpen(true)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onExportJson={handleExportJson}
          onExportCsv={handleExportCsv}
          onExportHtml={handleExportHtml}
          onImportJson={handleImportJson}
          onClear={handleClearForm}
          onPrint={handlePrint}
          onGenerateDocNumber={handleGenerateDocNumber}
          isDocumentGenerated={isDocumentGenerated}
          currentReportNumber={header.report_number}
          nextPreviewNumber={nextPreviewNumber}
          isDirty={isDirty}
          currentProfileName={currentProfile}
          isPreviewMode={isPreviewMode}
          onTogglePreview={() => setIsPreviewMode((p) => !p)}
          isDarkTheme={isDarkTheme}
          onToggleTheme={handleToggleTheme}
          isCloudConnected={isCloudConnected}
        />

        {/* Locked Document Warning / Generate Button Banner */}
        {!isDocumentGenerated && !isPreviewMode && (
          <div className="no-print mb-3 p-3.5 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-2 border-amber-400 rounded-xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-amber-950 dark:text-amber-200">
              <div className="p-2.5 bg-amber-400 text-slate-950 rounded-xl shadow-xs">
                <Lock className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <strong className="block text-xs sm:text-sm font-extrabold uppercase tracking-wide">
                  Edycja dokumentu jest zablokowana — wymagane nadanie numeru
                </strong>
                <span className="text-[11px] text-amber-900/90 dark:text-amber-300">
                  Przed uzupełnianiem formularza wygeneruj oficjalny numer raportu (np. {nextPreviewNumber}) lub wydrukuj czysty arkusz do wypełnienia długopisem.
                  {isCloudConnected && (
                    <span className="ml-1 text-emerald-800 dark:text-emerald-300 font-semibold">
                      (Synchronizacja z chmurą aktywna)
                    </span>
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <button
                type="button"
                disabled={isGeneratingNumber}
                onClick={handleGenerateDocNumber}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-extrabold text-slate-950 bg-amber-400 hover:bg-amber-300 active:scale-95 rounded-xl shadow-md ring-3 ring-amber-400/50 transition-all cursor-pointer disabled:opacity-50"
              >
                <FileCheck2 className={`w-4 h-4 text-slate-950 ${isGeneratingNumber ? 'animate-spin' : ''}`} />
                {isGeneratingNumber ? 'Rezerwowanie numeru...' : `Generuj dokument (${nextPreviewNumber})`}
              </button>
            </div>
          </div>
        )}

        {/* Live A4 Print Preview Banner */}
        {isPreviewMode && (
          <div className="no-print mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-blue-900/90 via-[#0f2742] to-blue-900/90 border border-blue-500/40 rounded-xl text-white shadow-lg">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold">
              <span className="flex h-3 w-3 rounded-full bg-amber-400 animate-ping" />
              <div>
                <span className="font-bold text-amber-300">Tryb podglądu wydruku A4</span>
                <span className="text-slate-300 ml-1.5 text-xs">
                  — Dokument podzielony na {totalPages} {totalPages === 1 ? 'stronę' : totalPages < 5 ? 'strony' : 'stron'} A4 z nagłówkiem i stopką
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => setIsPreviewMode(false)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 rounded-lg cursor-pointer shadow-xs active:scale-95 transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Powrót do edycji
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm cursor-pointer active:scale-95 transition-all ring-2 ring-amber-300/40"
              >
                <Printer className="w-3.5 h-3.5 text-slate-950" />
                Drukuj teraz
              </button>
            </div>
          </div>
        )}

        {/* Warning if invalid rows are detected */}
        {isDocumentGenerated && totals.invalidRowsCount > 0 && !isPreviewMode && (
          <div className="no-print mb-3 flex items-center gap-2 px-3.5 py-2.5 bg-amber-50 border border-amber-300/80 rounded-xl text-amber-900 text-xs font-medium shadow-2xs">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Wykryto {totals.invalidRowsCount} niekompletne wiersze (zaznaczone na żółto). Sprawdź brakujące daty, godziny lub opisy.
            </span>
          </div>
        )}

        {/* PREVIEW MODE: Realistic A4 Paginated Sheets */}
        {isPreviewMode ? (
          <DocumentPagesView
            header={header}
            rows={rows}
            totals={totals}
            dictionaries={dictionaries}
            isDocumentGenerated={isDocumentGenerated}
            onGenerateDocNumber={handleGenerateDocNumber}
            onChangeHeader={handleHeaderChange}
            showScreenPageBadges={true}
          />
        ) : (
          <>
            {/* EDIT MODE (SCREEN): Interactive document form with page break indicator */}
            <div className="relative">
              {/* Interactive Lock Overlay: Clicking anywhere prompts to generate report number */}
              {!isDocumentGenerated && (
                <div
                  onClick={handleGenerateDocNumber}
                  className="no-print absolute inset-0 z-30 bg-slate-950/20 hover:bg-slate-950/25 backdrop-blur-[1px] rounded-xl flex items-center justify-center p-4 cursor-pointer transition-all group"
                  title="Kliknij, aby nadać oficjalny numer raportu i odblokować formularz"
                >
                  <div className="bg-white/98 dark:bg-slate-900/98 border-2 border-amber-400 p-6 sm:p-8 rounded-2xl shadow-2xl text-center max-w-md mx-auto group-hover:scale-[1.02] transition-transform">
                    <div className="inline-flex p-3.5 bg-amber-400 text-slate-950 rounded-2xl mb-3 shadow-md ring-4 ring-amber-400/30">
                      <Lock className="w-8 h-8 animate-pulse" />
                    </div>
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                      Dokument jest zablokowany
                    </h2>
                    <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 mt-2 mb-5 leading-relaxed">
                      Przed rozpoczęciem wprowadzania danych należy nadać oficjalny numer raportu <strong>({nextPreviewNumber})</strong>. Kliknij poniższy przycisk, aby odblokować formularz.
                    </p>
                    <button
                      type="button"
                      disabled={isGeneratingNumber}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGenerateDocNumber();
                      }}
                      className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-extrabold text-slate-950 bg-amber-400 hover:bg-amber-300 active:scale-95 rounded-xl shadow-lg ring-4 ring-amber-400/40 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <FileCheck2 className={`w-5 h-5 text-slate-950 ${isGeneratingNumber ? 'animate-spin' : ''}`} />
                      {isGeneratingNumber
                        ? 'Pobieranie kolejnego numeru z bazy...'
                        : `Generuj dokument (${nextPreviewNumber})`}
                    </button>
                  </div>
                </div>
              )}

              <main
                id="report-print-sheet"
                className="w-full min-h-[268mm] flex flex-col justify-between bg-white text-slate-900 shadow-2xl rounded-xl p-4 sm:p-7 md:p-8 border border-slate-200/80 no-print"
              >
                {/* Company Brand Header */}
                <CompanyHeader
                  reportNumber={header.report_number}
                  isGenerated={isDocumentGenerated}
                  onGenerate={handleGenerateDocNumber}
                />

                {/* Metadata Grid */}
                <MetaGrid
                  header={header}
                  onChange={handleHeaderChange}
                  dictionaries={dictionaries}
                  isPreview={false}
                  disabled={!isDocumentGenerated}
                />

                {/* Main Hours Table with page break indicator */}
                <HoursTable
                  rows={rows}
                  onRowChange={handleRowChange}
                  onDuplicateRow={handleDuplicateRow}
                  onDeleteRow={handleDeleteRow}
                  onAddRows={handleAddRows}
                  isPreview={false}
                  disabled={!isDocumentGenerated}
                  pageBreakIndex={pageBreakIndex}
                />

                {/* Calculated Totals Summary */}
                <SummarySection totals={totals} />

                {/* Flexible gap pushing signatures to the bottom of the A4 page on screen */}
                <div className="flex-1 min-h-[15px]" />

                {/* Signatures & Footer */}
                <FooterSignatures
                  reportDate={header.data_stopka}
                  onReportDateChange={(val) => handleHeaderChange('data_stopka', val)}
                  reportNumber={header.report_number}
                  isPreview={false}
                  disabled={!isDocumentGenerated}
                  totalPages={totalPages}
                  currentPage={1}
                  isLastPage={true}
                />
              </main>
            </div>

            {/* PRINT-ONLY VIEW: Always renders exact paginated A4 pages when printing from Edit mode */}
            <div className="print-only-pages">
              <DocumentPagesView
                header={header}
                rows={rows}
                totals={totals}
                dictionaries={dictionaries}
                isDocumentGenerated={isDocumentGenerated}
                onGenerateDocNumber={handleGenerateDocNumber}
                showScreenPageBadges={false}
              />
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <SaveModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleConfirmSave}
        defaultName={suggestedSaveName}
      />

      <ValidationModal
        isOpen={isValidationModalOpen}
        onClose={() => setIsValidationModalOpen(false)}
        onContinue={() => {
          setIsValidationModalOpen(false);
          if (validationAction) validationAction();
        }}
        errors={validationErrors}
      />

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={() => {
          if (confirmAction) confirmAction();
        }}
        message={confirmMessage}
      />

      <RenameModal
        isOpen={isRenameModalOpen}
        onClose={() => setIsRenameModalOpen(false)}
        onRename={handleCommitRename}
        currentName={renameTargetName}
      />

      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        reportName={historyTargetName}
        history={getSavedReports()[historyTargetName]?.history || []}
        onRestore={handleRestoreHistory}
      />

      <ManagerModal
        isOpen={isManagerModalOpen}
        onClose={() => setIsManagerModalOpen(false)}
        reports={getSavedReports()}
        onOpenReport={handleOpenReportFromManager}
        onNewReport={handleClearForm}
        onDuplicateReport={handleDuplicateReportFromManager}
        onRenameReport={handleRenameReportFromManager}
        onOpenHistory={handleOpenHistoryFromManager}
        onDeleteReport={handleDeleteReportFromManager}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        dictionaries={dictionaries}
        onUpdateDictionaries={handleUpdateDictionaries}
        onResetDefaults={handleResetDictionaries}
        numberingSettings={numberingSettings}
        onUpdateNumberingSettings={handleUpdateNumberingSettings}
      />

      {/* Toast notifications */}
      <Toast message={toastMsg} isError={toastIsError} />
    </div>
  );
}
