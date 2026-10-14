export interface ReportRow {
  id: string;
  category: 'del' | 'biuro' | '';
  date: string; // YYYY-MM-DD
  from: string; // HH:MM
  to: string;   // HH:MM
  description: string;
  rowHeight?: number; // Optional user-expanded or measured height in px
}

export interface ReportHeader {
  report_number: string;
  num_projektu: string;
  num_zamowienia: string;
  wykonawca: string;
  zlecajacy: string;
  funkcja: string;
  miejsce: string;
  pojazd: string;
  trasa_km: string;
  noclegi: string;
  data_stopka: string; // YYYY-MM-DD
}

export interface ReportSnapshot {
  version: number;
  savedAt: string;
  header: ReportHeader;
  rows: ReportRow[];
}

export interface SavedReport extends ReportSnapshot {
  history?: ReportSnapshot[];
}

export interface NumberingSettings {
  prefix: string; // e.g. "RDL" or "RW"
  year: string;   // e.g. "26"
  nextSeq: number;// e.g. 1 -> "001"
}

export type Dictionaries = {
  wykonawca: string[];
  zlecajacy: string[];
  funkcja: string[];
  miejsce: string[];
  pojazd: string[];
  trasa_km: string[];
  noclegi: string[];
};

export interface DayInfo {
  weekend: boolean;
  holiday: boolean;
  name: string;
}

export interface TotalsResult {
  del: number;
  biuro: number;
  weekendHoliday: number; // combined weekend and holidays
  total: number;
  invalidRowsCount: number;
}
