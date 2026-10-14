import { Dictionaries, NumberingSettings, ReportHeader, ReportRow, ReportSnapshot, SavedReport } from '../types';
import { todayISO } from './dateUtils';
import { createEmptyRow } from './calculations';

export const STORAGE_KEY = 'wuwer_reports_data_v6';
const PREV_V5_KEY = 'wuwer_reports_data_v5';
export const DRAFT_KEY = 'wuwer_report_draft_v6';
const PREV_DRAFT_V5_KEY = 'wuwer_report_draft_v5';
export const DICT_KEY = 'wuwer_report_dictionaries_v4';
export const THEME_KEY = 'wuwer_report_theme';
export const NUMBERING_SETTINGS_KEY = 'wuwer_numbering_settings_v2';

export const DEFAULT_DICTS: Dictionaries = {
  wykonawca: ['Marcin Stopik'],
  zlecajacy: ['Elżbieta Bolanowska'],
  funkcja: ['elektryk', 'mechanik', 'automatyk', 'projektant elektryczny'],
  miejsce: ['IKEA Zbąszynek'],
  pojazd: ['SK5H849 FIAT SCUDO'],
  trasa_km: ['120 km', '250 km', '380 km'],
  noclegi: ['0', '1', '2', '3', '4', '5'],
};

export function getDefaultYear(): string {
  return new Date().getFullYear().toString().slice(-2);
}

export const DEFAULT_NUMBERING: NumberingSettings = {
  prefix: 'KG',
  year: getDefaultYear(),
  nextSeq: 1,
};

export const INITIAL_HEADER: ReportHeader = {
  report_number: '',
  num_projektu: '',
  num_zamowienia: '',
  wykonawca: '',
  zlecajacy: '',
  funkcja: '',
  miejsce: '',
  pojazd: '',
  trasa_km: '',
  noclegi: '',
  data_stopka: '',
};

export function getNumberingSettings(): NumberingSettings {
  try {
    const raw = localStorage.getItem(NUMBERING_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const curYear = getDefaultYear();
      const rawPrefix = parsed.prefix ? String(parsed.prefix).trim() : 'KG';
      return {
        prefix: rawPrefix === 'RDL' ? 'KG' : rawPrefix || 'KG',
        year: parsed.year || curYear,
        nextSeq: typeof parsed.nextSeq === 'number' && parsed.nextSeq > 0 ? parsed.nextSeq : 1,
      };
    }
  } catch {}
  return { ...DEFAULT_NUMBERING, year: getDefaultYear() };
}

export function saveNumberingSettings(settings: NumberingSettings): void {
  localStorage.setItem(NUMBERING_SETTINGS_KEY, JSON.stringify(settings));
}

// 3-digit format: e.g. 001, 002, 003
export function formatReportNumber(prefix: string, year: string, seq: number): string {
  const padSeq = String(seq).padStart(3, '0');
  let cleanPrefix = (prefix || 'KG').trim();
  if (cleanPrefix === 'RDL') cleanPrefix = 'KG';
  const cleanYear = (year || getDefaultYear()).trim();
  return `${cleanPrefix}/${cleanYear}/${padSeq}`;
}

export function generateNextReportNumber(increment = true): string {
  const settings = getNumberingSettings();
  const formatted = formatReportNumber(settings.prefix, settings.year, settings.nextSeq);
  if (increment) {
    settings.nextSeq += 1;
    saveNumberingSettings(settings);
  }
  return formatted;
}

export function getSavedReports(): Record<string, SavedReport> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {};
  } catch {
    return {};
  }
}

export function saveReports(reports: Record<string, SavedReport>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

export function getDictionaries(): Dictionaries {
  try {
    const saved = JSON.parse(localStorage.getItem(DICT_KEY) || 'null');
    if (saved && typeof saved === 'object') {
      const merged: Dictionaries = { ...DEFAULT_DICTS };
      (Object.keys(DEFAULT_DICTS) as (keyof Dictionaries)[]).forEach((k) => {
        if (Array.isArray(saved[k])) {
          merged[k] = [...new Set([...saved[k]])];
        }
      });
      return merged;
    }
  } catch {}
  return structuredClone(DEFAULT_DICTS);
}

export function saveDictionaries(dicts: Dictionaries): void {
  localStorage.setItem(DICT_KEY, JSON.stringify(dicts));
}

export function stripHistory(p: SavedReport): ReportSnapshot {
  const { history, ...snapshot } = p;
  return snapshot;
}

export function migrateOldStorage(): void {
  if (localStorage.getItem(STORAGE_KEY)) return;

  try {
    const v5 = JSON.parse(localStorage.getItem(PREV_V5_KEY) || 'null');
    if (v5 && typeof v5 === 'object') {
      const out: Record<string, SavedReport> = {};
      Object.entries(v5).forEach(([name, d]: [string, any]) => {
        const h = d.header || {};
        out[name] = {
          version: 6,
          savedAt: d.savedAt || new Date().toISOString(),
          header: {
            report_number: h.report_number || '',
            num_projektu: h.num_projektu || '',
            num_zamowienia: h.num_zamowienia || '',
            wykonawca: h.wykonawca || '',
            zlecajacy: h.zlecajacy || '',
            funkcja: h.funkcja || '',
            miejsce: h.miejsce || '',
            pojazd: h.pojazd || '',
            trasa_km: h.trasa_km || '',
            noclegi: h.noclegi || '',
            data_stopka: h.data_stopka || todayISO(),
          },
          rows: (d.rows || []).map((r: any) =>
            createEmptyRow({
              category: r.category || '',
              date: r.date || '',
              from: r.from || '',
              to: r.to || '',
              description: r.description || '',
            })
          ),
          history: Array.isArray(d.history) ? d.history : [],
        };
      });
      saveReports(out);
    }
  } catch {}
}

export function saveDraftToStorage(header: ReportHeader, rows: ReportRow[]): void {
  try {
    const snapshot: ReportSnapshot = {
      version: 6,
      savedAt: new Date().toISOString(),
      header,
      rows,
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(snapshot));
  } catch {}
}

export function loadDraftFromStorage(): { header: ReportHeader; rows: ReportRow[] } | null {
  try {
    let d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
    if (!d) {
      d = JSON.parse(localStorage.getItem(PREV_DRAFT_V5_KEY) || 'null');
    }
    if (d && (d.header || Array.isArray(d.rows))) {
      return {
        header: { ...INITIAL_HEADER, ...(d.header || {}) },
        rows: (d.rows || []).map((r: any) =>
          createEmptyRow({
            category: r.category || '',
            date: r.date || '',
            from: r.from || '',
            to: r.to || '',
            description: r.description || '',
          })
        ),
      };
    }
  } catch {}
  return null;
}
