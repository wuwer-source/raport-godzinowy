import { ReportHeader, ReportRow } from '../types';

export function exportEditableHtmlFile(header: ReportHeader, rows: ReportRow[]): void {
  const jsonHeader = JSON.stringify(header);
  const jsonRows = JSON.stringify(rows);

  // Generate 30-minute time options: 06:00 to 23:30, then 00:00 to 05:30
  const timeOptions: string[] = [];
  for (let h = 6; h <= 23; h++) {
    for (const m of ['00', '30']) {
      timeOptions.push(`${String(h).padStart(2, '0')}:${m}`);
    }
  }
  for (let h = 0; h < 6; h++) {
    for (const m of ['00', '30']) {
      timeOptions.push(`${String(h).padStart(2, '0')}:${m}`);
    }
  }
  const timeOptionsJson = JSON.stringify(timeOptions);

  const htmlContent = `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Raport ${escapeHtml(header.report_number || 'WUWER')} - Protokół wykonania prac</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'sans-serif'],
            mono: ['JetBrains Mono', 'monospace'],
          },
          colors: {
            wuwer: {
              navy: '#0f2742',
              blue: '#165d9c',
              blueDark: '#0d4d86',
              bgHeader: '#dfe8f2',
              bgMeta: '#eef2f7',
            }
          }
        }
      }
    }
  </script>
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm 8mm 8mm 8mm;
    }
    @media print {
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      body {
        background: #ffffff !important;
        color: #000000 !important;
        padding: 0 !important;
      }
      .no-print,
      .doc-table select,
      .doc-table input,
      .doc-table textarea,
      button,
      input::-webkit-calendar-picker-indicator {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
      }
      .print-cell-text {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        width: 100% !important;
        min-height: 20px !important;
      }
      .print-document {
        display: block !important;
        box-shadow: none !important;
        border: none !important;
        padding: 0 !important;
        max-width: 100% !important;
        min-height: auto !important;
        height: auto !important;
      }
      .avoid-break {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }
      .doc-table {
        width: 100% !important;
        table-layout: fixed !important;
        border-collapse: collapse !important;
        border: 1px solid #475569 !important;
        page-break-inside: auto !important;
        break-inside: auto !important;
      }
      .doc-table thead {
        display: table-header-group !important;
      }
      .doc-table th {
        background-color: #dfe8f2 !important;
        border: 1px solid #64748b !important;
        padding: 2.5px 2px !important;
        font-size: 7.5pt !important;
      }
      .doc-table tr {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
        break-after: auto !important;
        height: 38px !important;
        min-height: 38px !important;
      }
      .doc-table td {
        border: 1px solid #64748b !important;
        padding: 4px 4px !important;
        font-size: 8.5pt !important;
        height: 38px !important;
        min-height: 38px !important;
        vertical-align: middle !important;
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }
      .val-zero {
        visibility: hidden !important;
      }
    }
  </style>
</head>
<body class="bg-[#dce4ee] text-slate-900 min-h-screen p-2 sm:p-4 md:p-6 print:p-0 print:bg-white print:text-black">
  <div class="max-w-[210mm] mx-auto print:max-w-none">
    
    <!-- Top Toolbar -->
    <header class="sticky top-2 z-40 mb-3 px-3 py-2 bg-[#0f2742]/95 backdrop-blur-md rounded-xl shadow-lg border border-slate-700/50 text-white no-print">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-1.5 flex-wrap">
          <div class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-blue-200 bg-blue-950/60 rounded-lg border border-blue-600/40">
            <span class="text-[10px] text-slate-400 uppercase tracking-wider">Nr:</span>
            <span class="font-mono text-white tracking-wide" id="toolbar_doc_num">${escapeHtml(header.report_number || 'KG/26/001')}</span>
          </div>

          <button type="button" onclick="saveToLocalStorage()" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#165d9c] hover:bg-[#1a6db7] active:scale-95 rounded-lg shadow-xs transition-all cursor-pointer">
            💾 Zapisz raport
          </button>

          <button type="button" onclick="openReportsModal()" class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700/90 rounded-lg border border-slate-700 transition-colors cursor-pointer">
            📁 Raporty
          </button>
        </div>

        <div class="flex items-center gap-1.5 flex-wrap">
          <button type="button" onclick="exportJson()" class="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-700/80 rounded-lg border border-slate-700/70 transition-colors cursor-pointer">
            ⬇️ JSON
          </button>

          <button type="button" onclick="exportCsv()" class="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-700/80 rounded-lg border border-slate-700/70 transition-colors cursor-pointer">
            📊 CSV
          </button>

          <button type="button" onclick="document.getElementById('import_file').click()" class="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-700/80 rounded-lg border border-slate-700/70 transition-colors cursor-pointer">
            ⬆️ Import
          </button>
          <input type="file" id="import_file" accept=".json,application/json" onchange="importJson(event)" class="hidden" />

          <button type="button" onclick="clearForm()" class="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-slate-400 hover:text-red-300 bg-slate-800/60 hover:bg-slate-700/80 rounded-lg border border-slate-700/70 transition-colors cursor-pointer">
            ➕ Nowy
          </button>

          <button type="button" onclick="toggleTheme()" class="p-1.5 text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-700/80 rounded-lg border border-slate-700/70 transition-colors cursor-pointer">
            🌓
          </button>

          <button type="button" onclick="window.print()" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#0f2742] bg-white hover:bg-slate-100 active:scale-95 rounded-lg shadow-sm transition-all cursor-pointer ml-1">
            🖨️ Drukuj / PDF
          </button>
        </div>
      </div>
    </header>

    <!-- Main Printable A4 Sheet -->
    <main class="print-document w-full min-h-[268mm] flex flex-col justify-between bg-white text-slate-900 shadow-2xl rounded-xl p-4 sm:p-7 md:p-8 print:shadow-none print:rounded-none print:p-0 border border-slate-200/80 print:border-none">
      
      <!-- Company Brand Header -->
      <header class="avoid-break mb-3">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
          <div class="text-[9pt] leading-tight text-slate-800">
            <div class="text-[13pt] font-extrabold tracking-tight text-[#0f2742]">
              WUWER Sp. z o.o.
            </div>
            <div class="mt-0.5 text-slate-600">
              ul. Gen. Hallera 18a<br />
              41-709 Ruda Śląska<br />
              Telefon: (0 48 32) 244 99 70
            </div>
          </div>

          <div class="w-[190px] sm:w-[220px] shrink-0">
            <svg class="w-full h-auto block" viewBox="0 0 320 100">
              <g>
                <rect x="180" y="8" width="120" height="9" rx="4.5" fill="#f8e06c" />
                <circle cx="192" cy="24" r="5" fill="#bcbec0" />
                <circle cx="208" cy="24" r="5" fill="#bcbec0" />
                <circle cx="224" cy="24" r="5" fill="#bcbec0" />
                <circle cx="240" cy="24" r="5" fill="#bcbec0" />
                <circle cx="256" cy="24" r="5" fill="#bcbec0" />
                <circle cx="272" cy="24" r="5" fill="#bcbec0" />
                <circle cx="288" cy="24" r="5" fill="#bcbec0" />
              </g>
              <text x="160" y="72" font-family="Inter, sans-serif" font-size="48" font-weight="700" fill="#003b70" text-anchor="middle" letter-spacing="2">WUWER</text>
              <text x="298" y="86" font-family="Inter, sans-serif" font-size="12" fill="#003b70" text-anchor="end">conveying &amp; automation</text>
              <g>
                <circle cx="32" cy="80" r="5" fill="#bcbec0" />
                <circle cx="48" cy="80" r="5" fill="#bcbec0" />
                <circle cx="80" cy="80" r="5" fill="#bcbec0" />
                <circle cx="96" cy="80" r="5" fill="#bcbec0" />
                <circle cx="112" cy="80" r="5" fill="#bcbec0" />
                <circle cx="128" cy="80" r="5" fill="#bcbec0" />
                <rect x="20" y="89" width="120" height="9" rx="4.5" fill="#f8e06c" />
              </g>
            </svg>
          </div>
        </div>

        <div class="border-l-[5px] border-[#165d9c] rounded-r-md px-3 py-1.5 bg-gradient-to-r from-[#eaf2fa] to-[#f7f9fc] border-t border-r border-b border-slate-200">
          <h1 class="text-[#0f2742] text-[13pt] sm:text-[14pt] font-extrabold uppercase tracking-wide leading-snug">
            Protokół / Raport wykonania prac
          </h1>
          <p class="text-slate-500 text-[8.5pt] italic leading-tight">
            Final protocol / Work Completion Report
          </p>
        </div>
      </header>

      <!-- Metadata Grid - Rounded corners (zaokrąglone krawędzie) -->
      <section class="avoid-break mb-2.5">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 print:grid-cols-2">
          <!-- Left Column Above Line -->
          <div class="flex flex-col gap-2">
            <div class="grid grid-cols-[42%_58%] min-h-[35px] border border-slate-300 rounded-lg overflow-hidden bg-white shadow-2xs">
              <div class="flex flex-col justify-center px-2 py-0.5 bg-[#eef2f7] border-r border-slate-200">
                <strong class="text-[8.5pt] font-semibold text-slate-900 leading-tight">Numer projektu:</strong>
                <span class="text-[7pt] text-slate-500 italic leading-tight">Project number</span>
              </div>
              <div class="flex items-center px-2 py-0.5 bg-white">
                <input id="meta_num_projektu" value="${escapeHtml(header.num_projektu)}" class="no-print w-full text-[8.8pt] font-medium text-slate-900 bg-transparent border-0 border-b border-slate-300 focus:border-[#165d9c] focus:outline-hidden py-0.5 px-1" />
                <div class="hidden print:block w-full text-[8.5pt] font-semibold text-slate-950">${escapeHtml(header.num_projektu)}</div>
              </div>
            </div>

            <div class="grid grid-cols-[42%_58%] min-h-[35px] border border-slate-300 rounded-lg overflow-hidden bg-white shadow-2xs">
              <div class="flex flex-col justify-center px-2 py-0.5 bg-[#eef2f7] border-r border-slate-200">
                <strong class="text-[8.5pt] font-semibold text-slate-900 leading-tight">Wykonawca:</strong>
                <span class="text-[7pt] text-slate-500 italic leading-tight">Contractor's name</span>
              </div>
              <div class="flex items-center px-2 py-0.5 bg-white">
                <input id="meta_wykonawca" value="${escapeHtml(header.wykonawca)}" class="no-print w-full text-[8.8pt] font-medium text-slate-900 bg-transparent border-0 border-b border-slate-300 focus:border-[#165d9c] focus:outline-hidden py-0.5 px-1" />
                <div class="hidden print:block w-full text-[8.5pt] font-semibold text-slate-950">${escapeHtml(header.wykonawca)}</div>
              </div>
            </div>

            <div class="grid grid-cols-[42%_58%] min-h-[35px] border border-slate-300 rounded-lg overflow-hidden bg-white shadow-2xs">
              <div class="flex flex-col justify-center px-2 py-0.5 bg-[#eef2f7] border-r border-slate-200">
                <strong class="text-[8.5pt] font-semibold text-slate-900 leading-tight">Funkcja:</strong>
                <span class="text-[7pt] text-slate-500 italic leading-tight">Function</span>
              </div>
              <div class="flex items-center px-2 py-0.5 bg-white">
                <input id="meta_funkcja" value="${escapeHtml(header.funkcja)}" class="no-print w-full text-[8.8pt] font-medium text-slate-900 bg-transparent border-0 border-b border-slate-300 focus:border-[#165d9c] focus:outline-hidden py-0.5 px-1" />
                <div class="hidden print:block w-full text-[8.5pt] font-semibold text-slate-950">${escapeHtml(header.funkcja)}</div>
              </div>
            </div>
          </div>

          <!-- Right Column Above Line -->
          <div class="flex flex-col gap-2">
            <div class="grid grid-cols-[42%_58%] min-h-[35px] border border-slate-300 rounded-lg overflow-hidden bg-white shadow-2xs">
              <div class="flex flex-col justify-center px-2 py-0.5 bg-[#eef2f7] border-r border-slate-200">
                <strong class="text-[8.5pt] font-semibold text-slate-900 leading-tight">Numer zamówienia:</strong>
                <span class="text-[7pt] text-slate-500 italic leading-tight">Customer order</span>
              </div>
              <div class="flex items-center px-2 py-0.5 bg-white">
                <input id="meta_num_zamowienia" value="${escapeHtml(header.num_zamowienia)}" class="no-print w-full text-[8.8pt] font-medium text-slate-900 bg-transparent border-0 border-b border-slate-300 focus:border-[#165d9c] focus:outline-hidden py-0.5 px-1" />
                <div class="hidden print:block w-full text-[8.5pt] font-semibold text-slate-950">${escapeHtml(header.num_zamowienia)}</div>
              </div>
            </div>

            <div class="grid grid-cols-[42%_58%] min-h-[35px] border border-slate-300 rounded-lg overflow-hidden bg-white shadow-2xs">
              <div class="flex flex-col justify-center px-2 py-0.5 bg-[#eef2f7] border-r border-slate-200">
                <strong class="text-[8.5pt] font-semibold text-slate-900 leading-tight">Zlecający:</strong>
                <span class="text-[7pt] text-slate-500 italic leading-tight">Employer</span>
              </div>
              <div class="flex items-center px-2 py-0.5 bg-white">
                <input id="meta_zlecajacy" value="${escapeHtml(header.zlecajacy)}" class="no-print w-full text-[8.8pt] font-medium text-slate-900 bg-transparent border-0 border-b border-slate-300 focus:border-[#165d9c] focus:outline-hidden py-0.5 px-1" />
                <div class="hidden print:block w-full text-[8.5pt] font-semibold text-slate-950">${escapeHtml(header.zlecajacy)}</div>
              </div>
            </div>

            <div class="grid grid-cols-[42%_58%] min-h-[35px] border border-slate-300 rounded-lg overflow-hidden bg-white shadow-2xs">
              <div class="flex flex-col justify-center px-2 py-0.5 bg-[#eef2f7] border-r border-slate-200">
                <strong class="text-[8.5pt] font-semibold text-slate-900 leading-tight">Miejsce wykonania prac:</strong>
                <span class="text-[7pt] text-slate-500 italic leading-tight">Place of works</span>
              </div>
              <div class="flex items-center px-2 py-0.5 bg-white">
                <input id="meta_miejsce" value="${escapeHtml(header.miejsce)}" class="no-print w-full text-[8.8pt] font-medium text-slate-900 bg-transparent border-0 border-b border-slate-300 focus:border-[#165d9c] focus:outline-hidden py-0.5 px-1" />
                <div class="hidden print:block w-full text-[8.5pt] font-semibold text-slate-950">${escapeHtml(header.miejsce)}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Subtle Separator Line -->
        <div class="my-2 border-b border-slate-200/90 print:border-slate-300 print:my-1.5"></div>

        <!-- Below the Line: Left: Vehicle Reg No. Right: Route - km & Nights in one row -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 print:grid-cols-2">
          <div>
            <div class="grid grid-cols-[42%_58%] min-h-[35px] border border-slate-300 rounded-lg overflow-hidden bg-white shadow-2xs">
              <div class="flex flex-col justify-center px-2 py-0.5 bg-[#eef2f7] border-r border-slate-200">
                <strong class="text-[8.5pt] font-semibold text-slate-900 leading-tight">Nr rej. pojazdu:</strong>
                <span class="text-[7pt] text-slate-500 italic leading-tight">Vehicle Reg. No.</span>
              </div>
              <div class="flex items-center px-2 py-0.5 bg-white">
                <input id="meta_pojazd" value="${escapeHtml(header.pojazd)}" class="no-print w-full text-[8.8pt] font-medium text-slate-900 bg-transparent border-0 border-b border-slate-300 focus:border-[#165d9c] focus:outline-hidden py-0.5 px-1" />
                <div class="hidden print:block w-full text-[8.5pt] font-semibold text-slate-950">${escapeHtml(header.pojazd)}</div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-1.5">
            <div class="grid grid-cols-[48%_52%] min-h-[35px] border border-slate-300 rounded-lg overflow-hidden bg-white shadow-2xs">
              <div class="flex flex-col justify-center px-1.5 py-0.5 bg-[#eef2f7] border-r border-slate-200">
                <strong class="text-[7.8pt] font-semibold text-slate-900 leading-tight">Trasa – km:</strong>
                <span class="text-[6.6pt] text-slate-500 italic leading-tight">Route – km</span>
              </div>
              <div class="flex items-center px-1.5 py-0.5 bg-white">
                <input id="meta_trasa_km" value="${escapeHtml(header.trasa_km)}" class="no-print w-full text-[8.5pt] font-medium text-slate-900 bg-transparent border-0 border-b border-slate-300 focus:border-[#165d9c] focus:outline-hidden py-0.5 px-0.5 text-center" />
                <div class="hidden print:block w-full text-[8.2pt] font-semibold text-slate-950 text-center">${escapeHtml(header.trasa_km)}</div>
              </div>
            </div>

            <div class="grid grid-cols-[48%_52%] min-h-[35px] border border-slate-300 rounded-lg overflow-hidden bg-white shadow-2xs">
              <div class="flex flex-col justify-center px-1.5 py-0.5 bg-[#eef2f7] border-r border-slate-200">
                <strong class="text-[7.8pt] font-semibold text-slate-900 leading-tight">Noclegi:</strong>
                <span class="text-[6.6pt] text-slate-500 italic leading-tight">Nights</span>
              </div>
              <div class="flex items-center px-1.5 py-0.5 bg-white">
                <input type="number" min="0" id="meta_noclegi" value="${escapeHtml(header.noclegi)}" class="no-print w-full text-[8.5pt] font-medium text-slate-900 bg-transparent border-0 border-b border-slate-300 focus:border-[#165d9c] focus:outline-hidden py-0.5 px-0.5 text-center" />
                <div class="hidden print:block w-full text-[8.2pt] font-semibold text-slate-950 text-center">${escapeHtml(header.noclegi)}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Hours Table - Sharp corners -->
      <section class="mb-2.5">
        <div class="flex justify-between items-center mb-1.5 avoid-break">
          <div>
            <span class="text-[10pt] font-extrabold text-[#0f2742]">Rejestr godzin pracy / podróży</span>
            <span class="ml-1.5 text-[8pt] text-slate-500 italic font-normal">Work / Travel Hours Log</span>
          </div>
          <div class="flex items-center gap-1.5 no-print">
            <button type="button" onclick="addRow(1)" class="px-2.5 py-1 text-[8.5pt] font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 cursor-pointer shadow-2xs">➕ Dodaj wiersz</button>
            <button type="button" onclick="addRow(5)" class="px-2.5 py-1 text-[8.5pt] font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 cursor-pointer shadow-2xs">➕ 5 wierszy</button>
          </div>
        </div>

        <div class="w-full overflow-x-auto print:overflow-visible">
          <table class="doc-table w-full border-collapse border border-slate-500 text-slate-800 text-[8.5pt] rounded-none">
            <thead>
              <tr class="bg-[#dfe8f2] text-[#0f2742] h-[30px]">
                <th class="w-[12%] py-1.5 px-1 text-center font-bold border border-slate-400 rounded-none">Tryb pracy<span class="block text-[6.8pt] font-medium text-slate-600 italic">Work mode</span></th>
                <th class="w-[12%] py-1.5 px-1 text-center font-bold border border-slate-400 rounded-none">Data<span class="block text-[6.8pt] font-medium text-slate-600 italic">Date</span></th>
                <th class="w-[5%] py-1.5 px-0.5 text-center font-bold border border-slate-400 rounded-none leading-tight">Week-<span class="block font-bold">End</span></th>
                <th class="w-[9%] py-1.5 px-0.5 text-center font-bold border border-slate-400 rounded-none">Od<span class="block text-[6.8pt] font-medium text-slate-600 italic">From</span></th>
                <th class="w-[9%] py-1.5 px-0.5 text-center font-bold border border-slate-400 rounded-none">Do<span class="block text-[6.8pt] font-medium text-slate-600 italic">To</span></th>
                <th class="w-[8%] py-1.5 px-0.5 text-center font-bold border border-slate-400 rounded-none">Suma<span class="block text-[6.8pt] font-medium text-slate-600 italic">Hours</span></th>
                <th class="w-[40%] print:w-[45%] py-1.5 px-2 text-left font-bold border border-slate-400 rounded-none">Opis wykonanych prac<span class="block text-[6.8pt] font-medium text-slate-600 italic">Description of work</span></th>
                <th class="w-[5%] print:hidden py-1.5 px-0.5 text-center border border-slate-400 no-print rounded-none">Akcje</th>
              </tr>
            </thead>
            <tbody id="tableBody"></tbody>
          </table>
        </div>
      </section>

      <!-- Summary Section: 4 cards -->
      <section class="avoid-break mb-3">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 print:grid-cols-4 print:gap-1.5">
          <div class="border border-slate-300 rounded-lg p-1.5 text-center flex flex-col justify-between min-h-[46px] bg-slate-50/80 print:bg-white">
            <div>
              <div class="text-[7.5pt] font-bold text-slate-700 uppercase tracking-tight leading-tight">Delegacja</div>
              <div class="text-[6.2pt] font-medium text-slate-500 italic leading-tight">Delegation</div>
            </div>
            <div class="text-[12pt] font-extrabold text-[#0f2742] leading-tight mt-0.5" id="card_del">0.00 h</div>
          </div>
          <div class="border border-slate-300 rounded-lg p-1.5 text-center flex flex-col justify-between min-h-[46px] bg-slate-50/80 print:bg-white">
            <div>
              <div class="text-[7.5pt] font-bold text-slate-700 uppercase tracking-tight leading-tight">Biuro</div>
              <div class="text-[6.2pt] font-medium text-slate-500 italic leading-tight">Office</div>
            </div>
            <div class="text-[12pt] font-extrabold text-[#0f2742] leading-tight mt-0.5" id="card_biuro">0.00 h</div>
          </div>
          <div class="border border-slate-300 rounded-lg p-1.5 text-center flex flex-col justify-between min-h-[46px] bg-slate-50/80 print:bg-white">
            <div>
              <div class="text-[7.5pt] font-bold text-slate-700 uppercase tracking-tight leading-tight">Weekend / Święto</div>
              <div class="text-[6.2pt] font-medium text-slate-500 italic leading-tight">Weekend / Holiday</div>
            </div>
            <div class="text-[12pt] font-extrabold text-[#0f2742] leading-tight mt-0.5" id="card_wkd_hol">0.00 h</div>
          </div>
          <div class="border border-blue-300 rounded-lg p-1.5 text-center flex flex-col justify-between min-h-[46px] bg-blue-50/80 print:bg-slate-100">
            <div>
              <div class="text-[7.5pt] font-bold text-slate-700 uppercase tracking-tight leading-tight">Razem</div>
              <div class="text-[6.2pt] font-medium text-slate-500 italic leading-tight">Total</div>
            </div>
            <div class="text-[12pt] font-extrabold text-[#165d9c] leading-tight mt-0.5" id="card_total">0.00 h</div>
          </div>
        </div>
      </section>

      <!-- Flexible spacer pushing signatures down on screen -->
      <div class="flex-1 min-h-[15px] no-print"></div>

      <!-- Signatures Footer - Always anchored at the bottom of the page -->
      <footer class="avoid-break mt-auto pt-1 shrink-0">
        <div class="flex justify-between items-end mb-1.5 px-2">
          <!-- Date block with clear button -->
          <div class="flex flex-col items-center text-center shrink-0">
            <div class="w-[170px] min-h-[30px] print:min-h-[28px] flex items-end justify-center border-b border-slate-900 pb-0.5 relative group">
              <div class="no-print w-full flex items-center justify-center gap-1">
                <input type="date" id="doc_date" value="${header.data_stopka || ''}" onchange="recalc()" class="w-full text-center text-[9pt] font-semibold text-slate-900 bg-transparent border-0 outline-hidden cursor-pointer" />
                <button type="button" onclick="document.getElementById('doc_date').value=''; recalc();" title="Wyczyść datę" class="p-0.5 text-slate-400 hover:text-red-600 rounded cursor-pointer">✕</button>
              </div>
              <div class="hidden print:block text-center text-[9pt] font-semibold text-slate-950 min-h-[16px]" id="doc_date_print">${header.data_stopka || ''}</div>
            </div>
            <div class="mt-0.5 text-[8pt] font-extrabold text-[#0f2742] leading-tight">Data</div>
            <div class="text-[6.8pt] text-slate-500 italic leading-tight">Date</div>
          </div>

          <!-- Employer stamp & signature -->
          <div class="flex flex-col items-center text-center shrink-0">
            <div class="w-[220px] min-h-[30px] print:min-h-[28px] border-b border-slate-900"></div>
            <div class="mt-0.5 text-[8pt] font-extrabold text-[#0f2742] leading-tight">Pieczątka i podpis zlecającego</div>
            <div class="text-[6.8pt] text-slate-500 italic leading-tight">Stamp and signature of Employer</div>
          </div>
        </div>

        <!-- Document Footer: Unified across screen and print, always shows real page numbering -->
        <div class="mt-1 pt-1 border-t border-slate-300 text-slate-600 text-[7.5pt] flex justify-between items-center px-1 font-mono shrink-0">
          <div>
            <span>Nr raportu: </span>
            <strong class="text-slate-800 font-bold tracking-wider" id="footer_doc_num">${escapeHtml(header.report_number || 'KG/26/001')}</strong>
          </div>
          <div class="text-right">
            <span class="font-semibold text-slate-700" id="footer_page_num">Strona 1/1</span>
          </div>
        </div>
      </footer>
    </main>
  </div>

  <script>
    let reportHeader = ${jsonHeader};
    let reportRows = ${jsonRows};
    const timeOptions = ${timeOptionsJson};

    function renderRows() {
      const tb = document.getElementById('tableBody');
      tb.innerHTML = '';

      reportRows.forEach((r, idx) => {
        const tr = document.createElement('tr');
        tr.style.height = '38px';
        tr.className = 'border-b border-slate-300 h-[38px] min-h-[38px] ' + (idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50');
        
        let fromOptions = '<option value="">—</option>' + timeOptions.map(t => 
          '<option value="' + t + '"' + (r.from === t ? ' selected' : '') + '>' + t + '</option>'
        ).join('');

        let toOptions = '<option value="">—</option>' + timeOptions.map(t => 
          '<option value="' + t + '"' + (r.to === t ? ' selected' : '') + '>' + t + '</option>'
        ).join('');

        const catName = r.category === 'del' ? 'Delegacja' : r.category === 'biuro' ? 'Biuro' : '';

        tr.innerHTML = \`
          <td class="p-1 text-center border border-slate-300 align-middle h-[38px]">
            <div class="no-print">
              <select onchange="updateRow(\${idx}, 'category', this.value)" class="w-full text-[8.5pt] font-medium bg-transparent border-0 outline-hidden py-0.5 text-center cursor-pointer h-[32px]">
                <option value="" \${r.category === '' ? 'selected' : ''}>—</option>
                <option value="del" \${r.category === 'del' ? 'selected' : ''}>Delegacja</option>
                <option value="biuro" \${r.category === 'biuro' ? 'selected' : ''}>Biuro</option>
              </select>
            </div>
            <div class="hidden print:block print-cell-text text-center text-[8pt] font-medium">\${catName || '&nbsp;'}</div>
          </td>
          <td class="p-1 text-center border border-slate-300 align-middle h-[38px]">
            <div class="no-print">
              <input type="date" value="\${r.date || ''}" onchange="updateRow(\${idx}, 'date', this.value)" class="w-full text-[8pt] bg-transparent border-0 outline-hidden p-0.5 text-center h-[32px]" />
            </div>
            <div class="hidden print:block print-cell-text text-center text-[8pt] font-medium">\${r.date || '&nbsp;'}</div>
          </td>
          <td class="p-1 text-center border border-slate-300 align-middle font-bold text-slate-500 h-[38px]" id="wkd_\${idx}"></td>
          <td class="p-1 text-center border border-slate-300 align-middle h-[38px]">
            <div class="no-print">
              <select onchange="updateRow(\${idx}, 'from', this.value)" class="w-full text-[8.5pt] font-mono font-medium bg-transparent border-0 outline-hidden py-1 px-0.5 text-center cursor-pointer h-[32px]">
                \${fromOptions}
              </select>
            </div>
            <div class="hidden print:block print-cell-text font-mono text-[8pt] text-center">\${r.from || '&nbsp;'}</div>
          </td>
          <td class="p-1 text-center border border-slate-300 align-middle h-[38px]">
            <div class="no-print">
              <select onchange="updateRow(\${idx}, 'to', this.value)" class="w-full text-[8.5pt] font-mono font-medium bg-transparent border-0 outline-hidden py-1 px-0.5 text-center cursor-pointer h-[32px]">
                \${toOptions}
              </select>
            </div>
            <div class="hidden print:block print-cell-text font-mono text-[8pt] text-center">\${r.to || '&nbsp;'}</div>
          </td>
          <td class="p-1 text-center border border-slate-300 align-middle font-bold text-[#0f2742] h-[38px]">
            <span class="no-print" id="hrs_\${idx}"></span>
            <span class="hidden print:inline" id="hrs_print_\${idx}"></span>
          </td>
          <td class="p-1 border border-slate-300 align-middle text-left h-[38px]">
            <div class="no-print">
              <textarea onchange="updateRow(\${idx}, 'description', this.value)" placeholder="Opis wykonanych prac..." class="w-full text-[8pt] bg-transparent border-0 outline-hidden py-1.5 px-1.5 resize-y leading-snug min-h-[36px]">\${r.description || ''}</textarea>
            </div>
            <div class="hidden print:block print-cell-text text-[8.2pt] whitespace-pre-wrap break-words leading-tight py-1 px-1 min-h-[30px]">\${r.description || '&nbsp;'}</div>
          </td>
          <td class="p-1 text-center border border-slate-300 align-middle no-print h-[38px]">
            <button type="button" onclick="deleteRow(\${idx})" title="Usuń wiersz" class="p-1 text-slate-400 hover:text-red-600 cursor-pointer">🗑️</button>
          </td>
        \`;
        tb.appendChild(tr);
      });

      recalc();
    }

    function addRow(count = 1) {
      for (let i = 0; i < count; i++) {
        reportRows.push({
          id: 'r_' + Date.now() + Math.random(),
          category: '',
          date: '',
          from: '',
          to: '',
          description: ''
        });
      }
      renderRows();
    }

    function deleteRow(idx) {
      if (reportRows.length <= 1) return;
      reportRows.splice(idx, 1);
      renderRows();
    }

    function updateRow(idx, field, val) {
      reportRows[idx][field] = val;
      recalc();
    }

    function calcMinutes(f, t) {
      if (!f || !t) return 0;
      const [fh, fm] = f.split(':').map(Number);
      const [th, tm] = t.split(':').map(Number);
      let s = fh * 60 + fm;
      let e = th * 60 + tm;
      if (e < s) e += 1440;
      return Math.max(0, e - s);
    }

    function recalc() {
      let del = 0, biuro = 0, tot = 0, wkdHol = 0;

      reportRows.forEach((r, idx) => {
        const mins = calcMinutes(r.from, r.to);
        const hrs = mins / 60;
        const hrsElem = document.getElementById('hrs_' + idx);
        const hrsPrintElem = document.getElementById('hrs_print_' + idx);
        
        if (hrsElem) {
          hrsElem.textContent = hrs > 0 ? hrs.toFixed(2) : '—';
        }
        if (hrsPrintElem) {
          hrsPrintElem.textContent = hrs > 0 ? hrs.toFixed(2) : '';
        }

        const wkdElem = document.getElementById('wkd_' + idx);
        let isSpecial = false;
        if (wkdElem) {
          if (r.date) {
            const d = new Date(r.date + 'T00:00:00');
            const day = d.getDay();
            const isWeekend = day === 0 || day === 6;
            const md = (d.getMonth() + 1).toString().padStart(2, '0') + '-' + d.getDate().toString().padStart(2, '0');
            const holidays = ['01-01', '01-06', '05-01', '05-03', '08-15', '11-01', '11-11', '12-25', '12-26'];
            const isHoliday = holidays.includes(md);
            
            if (isHoliday) {
              wkdElem.textContent = 'ŚW';
              wkdElem.className = 'p-1 text-center border border-slate-300 align-middle font-bold text-amber-800';
              isSpecial = true;
            } else if (isWeekend) {
              wkdElem.textContent = '✓';
              wkdElem.className = 'p-1 text-center border border-slate-300 align-middle font-bold text-blue-800';
              isSpecial = true;
            } else {
              wkdElem.textContent = '';
            }
          } else {
            wkdElem.textContent = '';
          }
        }

        if (r.category === 'del') del += hrs;
        if (r.category === 'biuro') biuro += hrs;
        if (r.category) {
          tot += hrs;
          if (isSpecial) {
            wkdHol += hrs;
          }
        }
      });

      const setCard = (id, val) => {
        const el = document.getElementById(id);
        if (!el) return;
        if (val > 0) {
          el.textContent = val.toFixed(2) + ' h';
          el.classList.remove('val-zero');
        } else {
          el.textContent = '0.00 h';
          el.classList.add('val-zero');
        }
      };

      setCard('card_del', del);
      setCard('card_biuro', biuro);
      setCard('card_wkd_hol', wkdHol);
      setCard('card_total', tot);

      const dVal = document.getElementById('doc_date') ? document.getElementById('doc_date').value : '';
      const dPrint = document.getElementById('doc_date_print');
      if (dPrint) dPrint.textContent = dVal || '';

      const totalPages = reportRows.length <= 12 ? 1 : Math.ceil((reportRows.length - 12) / 22) + 1;
      const pageEl = document.getElementById('footer_page_num');
      if (pageEl) {
        pageEl.textContent = totalPages > 1 ? 'Strona 1/' + totalPages : 'Strona 1/1';
      }
    }

    function syncHeader() {
      reportHeader.num_projektu = document.getElementById('meta_num_projektu').value;
      reportHeader.wykonawca = document.getElementById('meta_wykonawca').value;
      reportHeader.funkcja = document.getElementById('meta_funkcja').value;
      reportHeader.num_zamowienia = document.getElementById('meta_num_zamowienia').value;
      reportHeader.zlecajacy = document.getElementById('meta_zlecajacy').value;
      reportHeader.miejsce = document.getElementById('meta_miejsce').value;
      reportHeader.pojazd = document.getElementById('meta_pojazd').value;
      reportHeader.trasa_km = document.getElementById('meta_trasa_km').value;
      reportHeader.noclegi = document.getElementById('meta_noclegi').value;
      reportHeader.data_stopka = document.getElementById('doc_date').value;
    }

    function saveToLocalStorage() {
      syncHeader();
      localStorage.setItem('wuwer_html_draft', JSON.stringify({ header: reportHeader, rows: reportRows }));
      alert('Raport został pomyślnie zapisany w pamięci przeglądarki.');
    }

    function openReportsModal() {
      saveToLocalStorage();
      alert('Raport jest bezpiecznie zapisany. Możesz go w każdej chwili wydrukować lub wyeksportować do PDF/CSV/JSON.');
    }

    function toggleTheme() {
      document.documentElement.classList.toggle('dark');
    }

    function clearForm() {
      if (confirm('Wyczyścić formularz do nowego czystego raportu?')) {
        reportRows = Array.from({ length: 10 }, () => ({
          id: 'r_' + Date.now() + Math.random(),
          category: '',
          date: '',
          from: '',
          to: '',
          description: ''
        }));
        renderRows();
      }
    }

    function exportJson() {
      syncHeader();
      const blob = new Blob([JSON.stringify({ header: reportHeader, rows: reportRows }, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = (reportHeader.report_number || 'raport').replace(/[^a-zA-Z0-9_-]/g, '_') + '.json';
      a.click();
    }

    function exportCsv() {
      syncHeader();
      let csv = '\ufeffNumer raportu;' + (reportHeader.report_number || '') + '\\r\\n';
      csv += 'Numer projektu;' + reportHeader.num_projektu + '\\r\\n';
      csv += 'Wykonawca;' + reportHeader.wykonawca + '\\r\\n\\r\\n';
      csv += 'Tryb pracy;Data;Od;Do;Opis\\r\\n';
      reportRows.forEach(r => {
        csv += [r.category === 'del' ? 'Delegacja' : r.category === 'biuro' ? 'Biuro' : '', r.date, r.from, r.to, '"' + (r.description || '').replace(/"/g, '""') + '"'].join(';') + '\\r\\n';
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = (reportHeader.report_number || 'raport').replace(/[^a-zA-Z0-9_-]/g, '_') + '.csv';
      a.click();
    }

    function importJson(e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = JSON.parse(evt.target.result);
          if (data.header) {
            reportHeader = { ...reportHeader, ...data.header };
            document.getElementById('meta_num_projektu').value = reportHeader.num_projektu || '';
            document.getElementById('meta_wykonawca').value = reportHeader.wykonawca || '';
            document.getElementById('meta_funkcja').value = reportHeader.funkcja || '';
            document.getElementById('meta_num_zamowienia').value = reportHeader.num_zamowienia || '';
            document.getElementById('meta_zlecajacy').value = reportHeader.zlecajacy || '';
            document.getElementById('meta_miejsce').value = reportHeader.miejsce || '';
            document.getElementById('meta_pojazd').value = reportHeader.pojazd || '';
            document.getElementById('meta_trasa_km').value = reportHeader.trasa_km || '';
            document.getElementById('meta_noclegi').value = reportHeader.noclegi || '';
            document.getElementById('doc_date').value = reportHeader.data_stopka || '';
            document.getElementById('toolbar_doc_num').textContent = reportHeader.report_number || 'RDL/26/001';
            document.getElementById('footer_doc_num').textContent = reportHeader.report_number || 'RDL/26/001';
          }
          if (Array.isArray(data.rows) && data.rows.length) {
            reportRows = data.rows;
            renderRows();
          }
          alert('Pomyślnie zaimportowano raport!');
        } catch (err) {
          alert('Błąd podczas importu pliku JSON.');
        }
      };
      reader.readAsText(file);
    }

    // Initial render
    renderRows();
  </script>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const fileName = `WUWER_${(header.report_number || 'Raport').replace(/[^a-zA-Z0-9_-]/g, '_')}.html`;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
