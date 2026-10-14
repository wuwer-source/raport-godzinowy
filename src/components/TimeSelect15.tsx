import React from 'react';

interface TimeSelect15Props {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}

// Generate all 30-minute intervals starting from common work hours (06:00 -> 23:30, then 00:00 -> 05:30)
const BASE_TIME_OPTIONS: string[] = [];

for (let h = 6; h <= 23; h++) {
  for (const m of ['00', '30']) {
    BASE_TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:${m}`);
  }
}
for (let h = 0; h < 6; h++) {
  for (const m of ['00', '30']) {
    BASE_TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:${m}`);
  }
}

export const TimeSelect15: React.FC<TimeSelect15Props> = ({
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="relative inline-block w-full">
      <select
        value={value || ''}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-[8.5pt] font-mono font-medium text-slate-800 bg-transparent border-0 outline-hidden py-0.5 px-0.5 text-center cursor-pointer no-print focus:bg-white focus:ring-1 focus:ring-blue-500 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <option value="">—</option>
        {value && !BASE_TIME_OPTIONS.includes(value) && (
          <option value={value} className="font-mono">
            {value} (niestandardowy)
          </option>
        )}
        {BASE_TIME_OPTIONS.map((timeStr) => (
          <option key={timeStr} value={timeStr} className="font-mono">
            {timeStr}
          </option>
        ))}
      </select>
      <div className="hidden print:block font-mono text-[8pt] text-center">
        {value || ''}
      </div>
    </div>
  );
};
