import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { formatDatePL, getDayInfo, publicHolidayName, todayISO } from '../utils/dateUtils';

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (val: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  align?: 'left' | 'center' | 'right';
  showClearButton?: boolean;
}

const MONTH_NAMES_PL = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień',
];

const WEEKDAY_NAMES_PL = [
  { label: 'Pn', isWeekend: false },
  { label: 'Wt', isWeekend: false },
  { label: 'Śr', isWeekend: false },
  { label: 'Czw', isWeekend: false },
  { label: 'Pt', isWeekend: false },
  { label: 'Sob', isWeekend: true },
  { label: 'Nd', isWeekend: true },
];

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  disabled = false,
  placeholder = 'RRRR-MM-DD',
  className = '',
  align = 'center',
  showClearButton = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial view year and month
  const initialDate = value ? new Date(`${value}T12:00:00`) : new Date();
  const [viewYear, setViewYear] = useState<number>(
    Number.isNaN(initialDate.getTime()) ? new Date().getFullYear() : initialDate.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState<number>(
    Number.isNaN(initialDate.getTime()) ? new Date().getMonth() : initialDate.getMonth()
  );

  // Sync view when value changes externally
  useEffect(() => {
    if (value) {
      const d = new Date(`${value}T12:00:00`);
      if (!Number.isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value]);

  // Close calendar popover on click outside or Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (year: number, month: number, day: number) => {
    const formatted = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const handleSetToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const t = todayISO();
    onChange(t);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  // Generate calendar days matrix
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
  // Monday is 0, Sunday is 6
  const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;
  const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const calendarDays: Array<{
    dayNumber: number;
    month: number;
    year: number;
    isCurrentMonth: boolean;
    dateISO: string;
    isWeekend: boolean;
    isHoliday: boolean;
    holidayName: string;
    isSelected: boolean;
    isToday: boolean;
  }> = [];

  const todayStr = todayISO();

  // Days from previous month
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const m = viewMonth === 0 ? 11 : viewMonth - 1;
    const y = viewMonth === 0 ? viewYear - 1 : viewYear;
    const dateISO = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const info = getDayInfo(dateISO);
    calendarDays.push({
      dayNumber: day,
      month: m,
      year: y,
      isCurrentMonth: false,
      dateISO,
      isWeekend: info.weekend,
      isHoliday: info.holiday,
      holidayName: info.name,
      isSelected: value === dateISO,
      isToday: todayStr === dateISO,
    });
  }

  // Days of current month
  for (let day = 1; day <= daysInCurrentMonth; day++) {
    const dateISO = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const info = getDayInfo(dateISO);
    calendarDays.push({
      dayNumber: day,
      month: viewMonth,
      year: viewYear,
      isCurrentMonth: true,
      dateISO,
      isWeekend: info.weekend,
      isHoliday: info.holiday,
      holidayName: info.name,
      isSelected: value === dateISO,
      isToday: todayStr === dateISO,
    });
  }

  // Fill remaining cells for standard 6-row or 5-row grid (total multiple of 7)
  const remaining = (7 - (calendarDays.length % 7)) % 7;
  for (let day = 1; day <= remaining; day++) {
    const m = viewMonth === 11 ? 0 : viewMonth + 1;
    const y = viewMonth === 11 ? viewYear + 1 : viewYear;
    const dateISO = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const info = getDayInfo(dateISO);
    calendarDays.push({
      dayNumber: day,
      month: m,
      year: y,
      isCurrentMonth: false,
      dateISO,
      isWeekend: info.weekend,
      isHoliday: info.holiday,
      holidayName: info.name,
      isSelected: value === dateISO,
      isToday: todayStr === dateISO,
    });
  }

  const selectedInfo = value ? getDayInfo(value) : null;

  return (
    <div ref={containerRef} className="relative inline-block w-full">
      {/* On-screen Clickable Input with Calendar Icon */}
      <div
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`no-print flex items-center justify-between gap-1 w-full px-1.5 py-1 text-[8.5pt] rounded-md transition-all cursor-pointer ${
          disabled
            ? 'opacity-50 cursor-not-allowed bg-transparent'
            : 'hover:bg-blue-50/70 focus-within:ring-1 focus-within:ring-blue-500 bg-white/40'
        } ${className}`}
        title={
          selectedInfo?.name
            ? `${formatDatePL(value)} (${selectedInfo.name}) - kliknij, aby otworzyć kalendarz`
            : value
            ? `${formatDatePL(value)} - kliknij, aby otworzyć kalendarz`
            : 'Kliknij, aby wybrać datę z kalendarza'
        }
      >
        <span
          className={`flex-1 font-mono tracking-tight ${
            align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'
          } ${
            value ? 'text-slate-900 font-medium' : 'text-slate-400'
          }`}
        >
          {value ? formatDatePL(value) : placeholder}
        </span>

        <button
          type="button"
          disabled={disabled}
          tabIndex={-1}
          className="p-0.5 rounded text-slate-400 hover:text-blue-600 transition-colors shrink-0"
        >
          <CalendarIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Print only: Clean text date */}
      <div className="hidden print:block font-mono text-[8.5pt] text-center font-medium">
        {value ? formatDatePL(value) : ''}
      </div>

      {/* Custom Interactive Calendar Popover */}
      {isOpen && !disabled && (
        <div
          className="no-print absolute left-1/2 -translate-x-1/2 top-full mt-1.5 z-50 w-[270px] sm:w-[280px] bg-white dark:bg-slate-900 border-2 border-blue-500/80 rounded-xl shadow-2xl p-3 text-slate-900 dark:text-white select-none animate-in fade-in zoom-in-95 duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header: Month and Year navigation */}
          <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Poprzedni miesiąc"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="text-center">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {MONTH_NAMES_PL[viewMonth]} {viewYear}
              </span>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Następny miesiąc"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday labels: Poniedziałek - Piątek (neutral), Sobota i Niedziela (CZERWONE) */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {WEEKDAY_NAMES_PL.map((wd, idx) => (
              <span
                key={idx}
                className={`text-[9px] font-extrabold uppercase tracking-wider py-0.5 ${
                  wd.isWeekend ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {wd.label}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {calendarDays.map((d, index) => {
              const isSelected = d.isSelected;
              const isDec24 = d.dateISO.endsWith('-12-24');
              const isRedDay = d.isWeekend || d.isHoliday || isDec24;

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelectDay(d.year, d.month, d.dayNumber)}
                  title={
                    d.holidayName
                      ? `${d.dayNumber} ${MONTH_NAMES_PL[d.month]} ${d.year} • ${d.holidayName}`
                      : `${d.dayNumber} ${MONTH_NAMES_PL[d.month]} ${d.year}`
                  }
                  className={`relative h-7 text-xs font-semibold rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                    !d.isCurrentMonth
                      ? 'text-slate-300 dark:text-slate-600 opacity-40 hover:opacity-100'
                      : isSelected
                      ? 'bg-blue-600 text-white font-extrabold shadow-md ring-2 ring-blue-400'
                      : isRedDay
                      ? 'text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60'
                      : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  } ${
                    d.isToday && !isSelected
                      ? 'ring-1 ring-blue-500 font-bold'
                      : ''
                  }`}
                >
                  <span>{d.dayNumber}</span>

                  {/* Holiday / Dec 24 indicator dot */}
                  {(d.isHoliday || isDec24) && d.isCurrentMonth && (
                    <span
                      className={`absolute bottom-0.5 w-1 h-1 rounded-full ${
                        isSelected ? 'bg-amber-300' : 'bg-red-600'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer info & quick action buttons */}
          <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={handleSetToday}
              className="font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Dzisiaj ({formatDatePL(todayStr)})
            </button>

            {showClearButton && value && (
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex items-center gap-0.5 text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
                title="Wyczyść datę"
              >
                <X className="w-3 h-3" />
                <span>Wyczyść</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
