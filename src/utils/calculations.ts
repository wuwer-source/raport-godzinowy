import { ReportHeader, ReportRow, TotalsResult } from '../types';
import { formatDatePL, getDayInfo, uid } from './dateUtils';

export function createEmptyRow(overrides: Partial<ReportRow> = {}): ReportRow {
  return {
    id: uid(),
    category: '',
    date: '',
    from: '',
    to: '',
    description: '',
    ...overrides,
  };
}

export function isRowUsed(r: ReportRow): boolean {
  return !!(
    r.category ||
    r.date ||
    r.from ||
    r.to ||
    r.description.trim()
  );
}

export function rawMinutes(from: string, to: string): number {
  if (!from || !to) return 0;
  const [fh, fm] = from.split(':').map(Number);
  const [th, tm] = to.split(':').map(Number);
  if ([fh, fm, th, tm].some(Number.isNaN)) return 0;

  let s = fh * 60 + fm;
  let e = th * 60 + tm;
  if (e < s) e += 1440; // Midnight wrap-around
  return Math.max(0, e - s);
}

export function calculateHours(row: ReportRow): number {
  const total = rawMinutes(row.from, row.to);
  return Math.max(0, total) / 60;
}

export function rowErrors(row: ReportRow, index: number): string[] {
  const errs: string[] = [];
  if (!isRowUsed(row)) return errs;
  const prefix = `Wiersz ${index + 1}: `;

  if (!row.category) errs.push(prefix + 'brak wyboru trybu pracy (Delegacja / Biuro).');
  if (!row.date) errs.push(prefix + 'brak daty.');
  if (!row.from) errs.push(prefix + 'brak godziny „Od”.');
  if (!row.to) errs.push(prefix + 'brak godziny „Do”.');

  if ((row.from || row.to) && rawMinutes(row.from, row.to) === 0) {
    errs.push(prefix + 'czas pracy wynosi 0 minut.');
  }

  if (!row.description.trim()) {
    errs.push(prefix + 'brak opisu wykonanych prac.');
  }

  return errs;
}

export function validateReport(header: ReportHeader, rows: ReportRow[]): string[] {
  const errs: string[] = [];
  if (!header.num_projektu.trim()) errs.push('Brak numeru projektu.');
  if (!header.wykonawca.trim()) errs.push('Brak nazwiska / nazwy wykonawcy.');

  rows.forEach((r, i) => {
    errs.push(...rowErrors(r, i));
  });

  if (!rows.some(isRowUsed)) {
    errs.push('Raport nie zawiera żadnego uzupełnionego wiersza.');
  }

  return errs;
}

export function calculateTotals(rows: ReportRow[]): TotalsResult {
  let del = 0;
  let biuro = 0;
  let total = 0;
  let weekendHoliday = 0;
  let invalidRowsCount = 0;

  rows.forEach((r, i) => {
    if (isRowUsed(r) && rowErrors(r, i).length > 0) {
      invalidRowsCount++;
    }

    const h = calculateHours(r);

    if (r.category === 'del') del += h;
    if (r.category === 'biuro') biuro += h;

    if (r.category) {
      total += h;
      const di = getDayInfo(r.date);
      if (di.weekend || di.holiday) {
        weekendHoliday += h;
      }
    }
  });

  return {
    del,
    biuro,
    weekendHoliday,
    total,
    invalidRowsCount,
  };
}

export function safeFilePart(str: string): string {
  return String(str || '')
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 80);
}

function csvEscape(val: unknown): string {
  return `"${String(val ?? '').replaceAll('"', '""')}"`;
}

export function generateCsvContent(header: ReportHeader, rows: ReportRow[]): string {
  const lines: string[] = [];

  const metaRows: [string, string][] = [
    ['Numer raportu', header.report_number],
    ['Numer projektu', header.num_projektu],
    ['Numer zamówienia', header.num_zamowienia],
    ['Wykonawca', header.wykonawca],
    ['Zlecający', header.zlecajacy],
    ['Funkcja', header.funkcja],
    ['Miejsce wykonania prac', header.miejsce],
    ['Nr rejestracyjny pojazdu', header.pojazd],
    ['Trasa - km', header.trasa_km],
    ['Ilość noclegów', header.noclegi],
    ['Data wystawienia', formatDatePL(header.data_stopka)],
  ];

  metaRows.forEach(([k, v]) => {
    lines.push([k, v].map(csvEscape).join(';'));
  });

  lines.push('');
  lines.push(
    [
      'Tryb pracy',
      'Data',
      'Weekend/Święto',
      'Od',
      'Do',
      'Godziny (h)',
      'Opis wykonanych prac',
    ]
      .map(csvEscape)
      .join(';')
  );

  rows.filter(isRowUsed).forEach((r) => {
    const di = getDayInfo(r.date);
    lines.push(
      [
        r.category === 'del' ? 'Delegacja' : r.category === 'biuro' ? 'Biuro' : '',
        formatDatePL(r.date),
        di.name,
        r.from,
        r.to,
        calculateHours(r) > 0 ? calculateHours(r).toFixed(2) : '',
        r.description,
      ]
        .map(csvEscape)
        .join(';')
    );
  });

  return '\ufeff' + lines.join('\r\n');
}
