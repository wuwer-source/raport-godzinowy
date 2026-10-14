import { DayInfo } from '../types';

export function uid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `r_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function todayISO(): string {
  const n = new Date();
  const local = new Date(n.getTime() - n.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function addDaysISO(dateString: string, days: number): string {
  if (!dateString) return '';
  const d = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + days);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function formatDatePL(ds: string): string {
  if (!ds) return '';
  const [y, m, d] = ds.split('-');
  return y && m && d ? `${d}.${m}.${y}` : ds;
}

export function formatDateTimePL(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('pl-PL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d);
}

function getEasterSunday(y: number): Date {
  const a = y % 19;
  const b = Math.floor(y / 100);
  const c = y % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mo = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(y, mo - 1, day);
}

function sameDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function publicHolidayName(ds: string): string {
  if (!ds) return '';
  const d = new Date(`${ds}T12:00:00`);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const md = `${d.getMonth() + 1}-${d.getDate()}`;

  const fixed: Record<string, string> = {
    '1-1': 'Nowy Rok',
    '1-6': 'Trzech Króli',
    '5-1': 'Święto Pracy',
    '5-3': 'Święto Konstytucji 3 Maja',
    '8-15': 'Wniebowzięcie NMP',
    '11-1': 'Wszystkich Świętych',
    '11-11': 'Święto Niepodległości',
    '12-24': 'Wigilia',
    '12-25': 'Boże Narodzenie',
    '12-26': 'Drugi dzień Świąt',
  };

  if (fixed[md]) return fixed[md];

  const e = getEasterSunday(y);
  if (sameDate(d, e)) return 'Wielkanoc';
  if (sameDate(d, addDays(e, 1))) return 'Poniedziałek Wielkanocny';
  if (sameDate(d, addDays(e, 49))) return 'Zesłanie Ducha Świętego';
  if (sameDate(d, addDays(e, 60))) return 'Boże Ciało';

  return '';
}

export function getDayInfo(ds: string): DayInfo {
  if (!ds) return { weekend: false, holiday: false, name: '' };
  const d = new Date(`${ds}T12:00:00`);
  if (Number.isNaN(d.getTime())) return { weekend: false, holiday: false, name: '' };

  const weekend = d.getDay() === 0 || d.getDay() === 6;
  const pName = publicHolidayName(ds);
  const weekendName = d.getDay() === 0 ? 'Niedziela' : d.getDay() === 6 ? 'Sobota' : '';

  const parts = [weekendName, pName].filter(Boolean);
  return {
    weekend,
    holiday: !!pName,
    name: parts.join(' • '),
  };
}
