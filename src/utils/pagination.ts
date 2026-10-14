import { ReportRow } from '../types';

export interface PageBreakdown {
  pageNumber: number;
  totalPages: number;
  isFirst: boolean;
  isLast: boolean;
  rows: ReportRow[];
  startRowIndex: number;
}

// Geometry constants for A4 sheet at 96 DPI:
// Printable page height inside padding (297mm - 11mm padding = 286mm) = ~1080px.
// We set a conservative safe limit of 1030px to guarantee the bottom footer is never cut off.
export const PAGE_CONTENT_HEIGHT = 1030;

// Static top block heights:
// Page 1: CompanyHeader (~126px) + MetaGrid (~148px) + Title (~24px) + TableHeader (~34px) = ~332px
export const PAGE_1_TOP_HEIGHT = 332;

// Continuation Page: Header banner (~34px) + TableHeader (~34px) = 68px
export const CONTINUATION_TOP_HEIGHT = 68;

// Bottom elements:
// Last page footer: Signatures (Data + Employer stamp ~68px) + bottom footer line (~22px) + margins (~8px) = ~98px
export const FOOTER_LAST_PAGE_HEIGHT = 98;

// Non-last page footer: ONLY bottom footer line ("Nr raportu... Strona X/Y"), NO signatures! = 26px
export const FOOTER_MIDDLE_PAGE_HEIGHT = 26;

// SummarySection (DELEGACJA, BIURO, WEEKEND / ŚWIĘTO, RAZEM cards) = ~52px
export const SUMMARY_HEIGHT = 52;

// Minimum safe distance 'X' between last row / SummarySection and FooterSignatures
export const MIN_DISTANCE_X = 20;

// Base compact row height (+30% increased for comfortable handwriting with a pen, ~38px / 10mm)
export const BASE_ROW_HEIGHT = 38;

export function getEstimatedRowHeight(
  row: ReportRow,
  measuredHeights?: Record<string, number>
): number {
  if (measuredHeights && measuredHeights[row.id] && measuredHeights[row.id] >= BASE_ROW_HEIGHT) {
    return measuredHeights[row.id];
  }
  if (row.rowHeight && row.rowHeight >= BASE_ROW_HEIGHT) {
    return row.rowHeight;
  }
  // Calculate based on line breaks and text length
  const text = row.description || '';
  if (!text) return BASE_ROW_HEIGHT;

  const lines = text.split('\n');
  let visualLines = 0;
  for (const line of lines) {
    visualLines += Math.max(1, Math.ceil(line.length / 42));
  }
  return Math.max(BASE_ROW_HEIGHT, BASE_ROW_HEIGHT + (visualLines - 1) * 18);
}

export function computePages(
  rows: ReportRow[],
  measuredHeights?: Record<string, number>
): PageBreakdown[] {
  if (rows.length === 0) {
    return [
      {
        pageNumber: 1,
        totalPages: 1,
        isFirst: true,
        isLast: true,
        rows: [],
        startRowIndex: 0,
      },
    ];
  }

  // Calculate each row's height
  const rowHeights = rows.map((r) => getEstimatedRowHeight(r, measuredHeights));
  const totalRowsHeight = rowHeights.reduce((sum, h) => sum + h, 0);

  // Check if ALL rows fit on Page 1 (with SummarySection + MIN_DISTANCE_X + FooterSignatures):
  const distanceOnSinglePage =
    PAGE_CONTENT_HEIGHT - PAGE_1_TOP_HEIGHT - totalRowsHeight - SUMMARY_HEIGHT - FOOTER_LAST_PAGE_HEIGHT;

  if (distanceOnSinglePage >= MIN_DISTANCE_X) {
    // Fits comfortably on exactly 1 single page!
    return [
      {
        pageNumber: 1,
        totalPages: 1,
        isFirst: true,
        isLast: true,
        rows,
        startRowIndex: 0,
      },
    ];
  }

  // Otherwise, rows don't fit on 1 page with Summary and Signatures. We split across pages.
  // Rebalance rows to prevent leaving the final page with an empty field ("puste pole").
  const chunks: { rows: ReportRow[]; startRowIndex: number }[] = [];
  let remainingRows = [...rows];
  let remainingHeights = [...rowHeights];
  let currentIndex = 0;
  let isFirstPage = true;

  while (remainingRows.length > 0) {
    const topHeight = isFirstPage ? PAGE_1_TOP_HEIGHT : CONTINUATION_TOP_HEIGHT;

    // Check if ALL remaining rows could fit on this page as the LAST page:
    const remainingTotalHeight = remainingHeights.reduce((sum, h) => sum + h, 0);
    const distanceIfLast =
      PAGE_CONTENT_HEIGHT - topHeight - remainingTotalHeight - SUMMARY_HEIGHT - FOOTER_LAST_PAGE_HEIGHT;

    if (distanceIfLast >= MIN_DISTANCE_X) {
      // All remaining rows fit on this final page!
      chunks.push({
        rows: remainingRows,
        startRowIndex: currentIndex,
      });
      break;
    }

    // Otherwise, this page cannot be the last page. Fill it with rows without SummarySection,
    // and without signatures (only the thin footer line is at the bottom).
    const maxAllowedRowsHeight =
      PAGE_CONTENT_HEIGHT - topHeight - FOOTER_MIDDLE_PAGE_HEIGHT - 10;

    let accumulatedHeight = 0;
    let countForThisPage = 0;

    for (let i = 0; i < remainingRows.length; i++) {
      if (accumulatedHeight + remainingHeights[i] <= maxAllowedRowsHeight) {
        accumulatedHeight += remainingHeights[i];
        countForThisPage++;
      } else {
        break;
      }
    }

    // Rebalancing: avoid leaving the next page with only 1-4 rows which creates large empty space
    const remainingAfter = remainingRows.length - countForThisPage;
    if (remainingAfter > 0 && remainingAfter < 5) {
      const minDesiredOnNextPage = Math.min(5, Math.floor(remainingRows.length / 2));
      const adjustedCount = remainingRows.length - minDesiredOnNextPage;
      if (adjustedCount > 0) {
        countForThisPage = adjustedCount;
      }
    } else if (remainingAfter === 0) {
      // If countForThisPage would take all rows, but distanceIfLast was < MIN_DISTANCE_X,
      // split roughly in half so both pages look filled and balanced
      const half = Math.max(1, Math.floor(remainingRows.length / 2));
      countForThisPage = half;
    }

    // Safety: ensure at least 1 row moves forward
    if (countForThisPage <= 0) {
      countForThisPage = 1;
    }

    chunks.push({
      rows: remainingRows.slice(0, countForThisPage),
      startRowIndex: currentIndex,
    });

    remainingRows = remainingRows.slice(countForThisPage);
    remainingHeights = remainingHeights.slice(countForThisPage);
    currentIndex += countForThisPage;
    isFirstPage = false;
  }

  const totalPages = chunks.length;
  return chunks.map((c, idx) => ({
    pageNumber: idx + 1,
    totalPages,
    isFirst: idx === 0,
    isLast: idx === totalPages - 1,
    rows: c.rows,
    startRowIndex: c.startRowIndex,
  }));
}
