import React from 'react';
import { ReportRow } from '../types';
import { calculateHours, isRowUsed, rowErrors } from '../utils/calculations';
import { formatDatePL, getDayInfo } from '../utils/dateUtils';
import { Copy, Plus, Trash2 } from 'lucide-react';
import { TimeSelect15 } from './TimeSelect15';
import { DatePicker } from './DatePicker';

interface HoursTableProps {
  rows: ReportRow[];
  onRowChange: (id: string, field: keyof ReportRow, value: string | number) => void;
  onDuplicateRow: (id: string) => void;
  onDeleteRow: (id: string) => void;
  onAddRows: (count: number) => void;
  isPreview?: boolean;
  disabled?: boolean;
  pageBreakIndex?: number;
}

export const HoursTable: React.FC<HoursTableProps> = ({
  rows,
  onRowChange,
  onDuplicateRow,
  onDeleteRow,
  onAddRows,
  isPreview = false,
  disabled = false,
  pageBreakIndex,
}) => {
  // Real-time drag resize handler for row height with visible grip handle
  const handleStartResize = (e: React.MouseEvent, rowId: string, currentHeight: number = 38) => {
    e.preventDefault();
    e.stopPropagation();
    const startY = e.clientY;
    const initialH = currentHeight;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const newHeight = Math.max(38, Math.min(260, Math.round(initialH + deltaY)));
      onRowChange(rowId, 'rowHeight', newHeight);
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };
  return (
    <section className="mb-2.5">
      {/* Table Title - Placed cleanly above the table as requested */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 mb-1.5 avoid-break">
        <div>
          <span className="text-[10pt] font-extrabold text-[#0f2742] tracking-tight">
            Rejestr godzin pracy / podróży
          </span>
          <span className="ml-1.5 text-[8pt] text-slate-500 italic">
            Work / Travel Hours Log
          </span>
        </div>

        {!isPreview && (
          <div className="flex items-center gap-1.5 no-print">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onAddRows(1)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[8.5pt] font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 active:scale-95 transition-all shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-3.5 h-3.5 text-blue-600" />
              Dodaj wiersz
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onAddRows(5)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[8.5pt] font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 active:scale-95 transition-all shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-3.5 h-3.5 text-blue-600" />5 wierszy
            </button>
          </div>
        )}
      </div>

      {/* Main Table - Sharp corners (ostre krawędzie) */}
      <div className="w-full overflow-x-auto print:overflow-visible p-px">
        <table className="doc-table w-full border-collapse border border-slate-500 text-slate-800 text-[8.5pt] rounded-none">
          <thead>
            <tr className="bg-[#dfe8f2] text-[#0f2742] h-[30px]">
              <th className="w-[12%] print:w-[12%] py-1 px-1 text-center font-bold border border-slate-400 rounded-none">
                Tryb pracy
                <span className="block text-[6.8pt] font-medium text-slate-600 italic">Work mode</span>
              </th>
              <th className="w-[12%] print:w-[12%] py-1 px-1 text-center font-bold border border-slate-400 rounded-none">
                Data
                <span className="block text-[6.8pt] font-medium text-slate-600 italic">Date</span>
              </th>
              <th className="w-[5%] print:w-[5%] py-1 px-0.5 text-center font-bold border border-slate-400 rounded-none leading-tight">
                Week-
                <span className="block font-bold">End</span>
              </th>
              <th className="w-[9%] print:w-[9%] py-1 px-0.5 text-center font-bold border border-slate-400 rounded-none">
                Od
                <span className="block text-[6.8pt] font-medium text-slate-600 italic">From</span>
              </th>
              <th className="w-[9%] print:w-[9%] py-1 px-0.5 text-center font-bold border border-slate-400 rounded-none">
                Do
                <span className="block text-[6.8pt] font-medium text-slate-600 italic">To</span>
              </th>
              <th className="w-[8%] print:w-[8%] py-1 px-0.5 text-center font-bold border border-slate-400 rounded-none">
                Suma
                <span className="block text-[6.8pt] font-medium text-slate-600 italic">Hours</span>
              </th>
              <th className={`${isPreview ? 'w-[45%]' : 'w-[40%] print:w-[45%]'} py-1 px-1.5 text-left font-bold border border-slate-400 rounded-none`}>
                Opis wykonanych prac
                <span className="block text-[6.8pt] font-medium text-slate-600 italic">Description of work</span>
              </th>
              {!isPreview && (
                <th className="w-[5%] print:hidden py-1 px-0.5 text-center border border-slate-400 rounded-none">
                  Akcje
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, idx) => {
              const h = calculateHours(row);
              const dayInfo = getDayInfo(row.date);
              const errs = rowErrors(row, idx);
              const isInvalid = !disabled && isRowUsed(row) && errs.length > 0;
              const hasHours = h > 0;
              const showBreakHere = !isPreview && pageBreakIndex !== undefined && idx === pageBreakIndex;
              const rowH = row.rowHeight ? Math.max(row.rowHeight, 38) : 38;

              return (
                <React.Fragment key={row.id}>
                  {showBreakHere && (
                    <tr className="no-print">
                      <td
                        colSpan={8}
                        className="p-0 border-y-2 border-dashed border-[#165d9c] bg-blue-50/90 text-center py-1.5 px-3 text-[8.2pt] font-extrabold text-[#0f2742] shadow-2xs"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-sm">✂️</span>
                          <span className="tracking-wide">
                            LINIA PODZIAŁU STRONY A4: Powyższe wiersze (1–{pageBreakIndex}) zmieszczą się na Stronie 1. Kolejne wiersze znajdą się na Stronie 2.
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                  <tr
                    key={row.id}
                    data-row-id={row.id}
                    style={{ height: `${rowH}px` }}
                    className={`border-b border-slate-300 transition-colors h-[38px] min-h-[38px] ${
                      isInvalid
                        ? 'bg-amber-50/80 hover:bg-amber-100/60 print:bg-white'
                        : idx % 2 === 0
                        ? 'bg-white'
                        : 'bg-slate-50/50 hover:bg-slate-100/50 print:bg-white'
                    }`}
                  >
                  {/* Category / Tryb pracy */}
                  <td className="py-0 px-1 text-center border border-slate-300 align-middle h-[38px]">
                    {isPreview ? (
                      <span className="font-medium text-[8.5pt]">
                        {row.category === 'del' ? 'Delegacja' : row.category === 'biuro' ? 'Biuro' : '\u00A0'}
                      </span>
                    ) : (
                      <>
                        <div className="no-print">
                          <select
                            value={row.category}
                            disabled={disabled}
                            onChange={(e) => onRowChange(row.id, 'category', e.target.value)}
                            className="w-full text-[8.5pt] font-medium bg-transparent border-0 outline-hidden py-0 text-center cursor-pointer focus:bg-white focus:ring-1 focus:ring-blue-500 rounded disabled:opacity-50 disabled:cursor-not-allowed h-[32px]"
                          >
                            <option value="">—</option>
                            <option value="del">Delegacja</option>
                            <option value="biuro">Biuro</option>
                          </select>
                        </div>
                        {/* Print only: Clean text or completely empty */}
                        <div className="hidden print:block print-cell-text text-center text-[8.5pt] font-medium">
                          {row.category === 'del' ? 'Delegacja' : row.category === 'biuro' ? 'Biuro' : ''}
                        </div>
                      </>
                    )}
                  </td>

                  {/* Date */}
                  <td className="py-0 px-1 text-center border border-slate-300 align-middle h-[38px]">
                    {isPreview ? (
                      <span className="font-medium text-[8.5pt]">{row.date ? formatDatePL(row.date) : '\u00A0'}</span>
                    ) : (
                      <>
                        <div className="no-print">
                          <DatePicker
                            value={row.date}
                            disabled={disabled}
                            onChange={(val) => onRowChange(row.id, 'date', val)}
                          />
                        </div>
                        {/* Print only: Clean date or completely empty */}
                        <div className="hidden print:block print-cell-text text-center text-[8.5pt] font-medium">
                          {row.date ? formatDatePL(row.date) : ''}
                        </div>
                      </>
                    )}
                  </td>

                  {/* Weekend / Holiday */}
                  <td
                    className={`py-0 px-0.5 text-center border border-slate-300 align-middle font-bold text-[8.5pt] h-[38px] ${
                      dayInfo.holiday
                        ? 'text-amber-800'
                        : dayInfo.weekend
                        ? 'text-blue-800'
                        : 'text-slate-400'
                    }`}
                    title={dayInfo.name}
                  >
                    {row.date && dayInfo.holiday ? 'ŚW' : row.date && dayInfo.weekend ? '✓' : ''}
                  </td>

                  {/* From */}
                  <td className="py-0 px-0.5 text-center border border-slate-300 align-middle h-[38px]">
                    {isPreview ? (
                      <span className="font-mono text-[8.5pt]">{row.from || '\u00A0'}</span>
                    ) : (
                      <>
                        <div className="no-print">
                          <TimeSelect15
                            value={row.from}
                            disabled={disabled}
                            onChange={(val) => onRowChange(row.id, 'from', val)}
                          />
                        </div>
                        {/* Print only: Value or clean empty cell */}
                        <div className="hidden print:block print-cell-text font-mono text-[8.5pt] text-center">
                          {row.from || ''}
                        </div>
                      </>
                    )}
                  </td>

                  {/* To */}
                  <td className="py-0 px-0.5 text-center border border-slate-300 align-middle h-[38px]">
                    {isPreview ? (
                      <span className="font-mono text-[8.5pt]">{row.to || '\u00A0'}</span>
                    ) : (
                      <>
                        <div className="no-print">
                          <TimeSelect15
                            value={row.to}
                            disabled={disabled}
                            onChange={(val) => onRowChange(row.id, 'to', val)}
                          />
                        </div>
                        {/* Print only: Value or clean empty cell */}
                        <div className="hidden print:block print-cell-text font-mono text-[8.5pt] text-center">
                          {row.to || ''}
                        </div>
                      </>
                    )}
                  </td>

                  {/* Calculated Hours - In print: completely empty if 0 so handwriting can be used */}
                  <td className="py-1 px-0.5 text-center border border-slate-300 align-middle font-bold text-[#0f2742] text-[8.5pt] h-[38px]">
                    <span className="no-print">
                      {hasHours ? h.toFixed(2) : <span className="text-slate-300 text-[7.5pt]">—</span>}
                    </span>
                    <span className="hidden print:inline font-bold">
                      {hasHours ? h.toFixed(2) : ''}
                    </span>
                  </td>

                  {/* Description - with visible drag handle for resizing and word wrap */}
                  <td className="desc-cell py-1 px-1 border border-slate-300 align-middle text-left relative h-[38px]">
                    {isPreview ? (
                      <div
                        className="desc-print-content text-[8.5pt] whitespace-pre-wrap break-words leading-relaxed py-0.5 px-1"
                        style={{
                          wordBreak: 'break-word',
                          overflowWrap: 'anywhere',
                          minHeight: `${Math.max(rowH - 10, 28)}px`,
                        }}
                      >
                        {row.description || '\u00A0'}
                      </div>
                    ) : (
                      <>
                        <div className="no-print relative">
                          <textarea
                            value={row.description}
                            disabled={disabled}
                            onChange={(e) => onRowChange(row.id, 'description', e.target.value)}
                            onMouseUp={(e) => {
                              const el = e.currentTarget;
                              if (el && el.offsetHeight && Math.abs(el.offsetHeight - (row.rowHeight || 38)) > 2) {
                                onRowChange(row.id, 'rowHeight', el.offsetHeight);
                              }
                            }}
                            rows={1}
                            placeholder={disabled ? '' : 'Opis wykonanych prac...'}
                            style={{
                              height: row.rowHeight ? `${row.rowHeight}px` : undefined,
                              minHeight: '36px',
                              resize: 'vertical',
                            }}
                            className="desc-resize-textarea w-full text-[8.5pt] bg-white border border-slate-300 hover:border-slate-400 focus:border-[#165d9c] outline-hidden py-1.5 px-1.5 pr-5 leading-snug rounded focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-text"
                          />
                          {/* Znaczek poszerzenia / Drag Handle - Always visible to drag and resize row */}
                          <div
                            onMouseDown={(e) => handleStartResize(e, row.id, row.rowHeight || 38)}
                            title="Przeciągnij w dół, aby poszerzyć/zwiększyć wysokość wiersza"
                            className="absolute bottom-1 right-1 cursor-ns-resize p-0.5 text-slate-400 hover:text-[#165d9c] hover:bg-blue-50 rounded transition-colors select-none group/grip"
                          >
                            <svg viewBox="0 0 10 10" className="w-2.5 h-2.5" fill="currentColor">
                              <path d="M8.5 8.5H7.5V7.5H8.5V8.5ZM8.5 6H7.5V5H8.5V6ZM6 8.5H5V7.5H6V8.5ZM8.5 3.5H7.5V2.5H8.5V3.5ZM6 6H5V5H6V6ZM3.5 8.5H2.5V7.5H3.5V8.5Z" />
                            </svg>
                          </div>
                        </div>
                        {/* Print only: text or clean empty space, word wrapped */}
                        <div
                          className="hidden print:block print-cell-text desc-print-content text-[8.5pt] whitespace-pre-wrap break-words leading-relaxed py-1 px-1.5"
                          style={{
                            wordBreak: 'break-word',
                            overflowWrap: 'anywhere',
                            minHeight: `${Math.max(rowH - 10, 28)}px`,
                          }}
                        >
                          {row.description || '\u00A0'}
                        </div>
                      </>
                    )}
                  </td>

                  {/* Actions column (desktop/screen only) */}
                  {!isPreview && (
                    <td className="py-1 px-0.5 text-center border border-slate-300 align-middle print:hidden no-print h-[38px]">
                      <div className="flex items-center justify-center gap-0.5">
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => onDuplicateRow(row.id)}
                          title="Duplikuj i ustaw następny dzień"
                          className="table-action-btn p-0.5 text-slate-600 hover:text-blue-700 hover:bg-slate-200 rounded cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => onDeleteRow(row.id)}
                          title="Usuń wiersz"
                          className="table-action-btn p-0.5 text-slate-600 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};
