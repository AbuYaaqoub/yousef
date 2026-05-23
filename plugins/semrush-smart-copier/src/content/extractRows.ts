// content/extractRows.ts
// Extracts all visible rows from a detected table

import { extractTooltipValue } from './extractTooltips';
import { extractLink, extractAllLinks } from './extractLinks';
import { TableRow } from '../types/index';

export function extractRows(table: Element, headers: string[]): TableRow[] {
  const rows: TableRow[] = [];

  // Find all data rows (excluding header rows)
  let dataRows = getDataRows(table);

  for (const row of dataRows) {
    if (!isRowVisible(row)) continue;

    const cells = getCells(row);
    if (cells.length === 0) continue;

    const rowData: TableRow = {};

    cells.forEach((cell, index) => {
      const header = headers[index] || `Column${index + 1}`;
      const value = extractCellValue(cell, header);
      rowData[header] = value;
    });

    // Skip empty rows
    const values = Object.values(rowData).filter(v => v.trim() !== '');
    if (values.length > 0) {
      rows.push(rowData);
    }
  }

  return rows;
}

function getDataRows(table: Element): Element[] {
  // For standard HTML table
  const tbody = table.querySelector('tbody');
  if (tbody) {
    return Array.from(tbody.querySelectorAll('tr'));
  }

  // For role-based tables
  const allRows = Array.from(table.querySelectorAll('[role="row"]'));
  // Skip header row (first one usually)
  return allRows.filter(row => {
    const isHeader = row.querySelector('[role="columnheader"]') !== null;
    return !isHeader;
  });

  // Fallback: all tr except first
  const allTr = Array.from(table.querySelectorAll('tr'));
  return allTr.slice(1);
}

function getCells(row: Element): Element[] {
  // Standard td
  const tds = row.querySelectorAll('td');
  if (tds.length > 0) return Array.from(tds);

  // Role-based
  const gridcells = row.querySelectorAll('[role="gridcell"], [role="cell"]');
  if (gridcells.length > 0) return Array.from(gridcells);

  return [];
}

function isRowVisible(row: Element): boolean {
  const style = window.getComputedStyle(row);
  if (style.display === 'none' || style.visibility === 'hidden') return false;

  // Check aria-hidden
  if (row.getAttribute('aria-hidden') === 'true') return false;

  return true;
}

function extractCellValue(cell: Element, headerName: string): string {
  const headerLower = headerName.toLowerCase();

  // For URL/link columns, extract the href
  if (headerLower.includes('url') || headerLower.includes('link') || headerLower.includes('page')) {
    const link = extractLink(cell);
    return link.url || link.text;
  }

  // Try tooltip first for numeric columns
  if (isNumericHeader(headerLower)) {
    const tooltipValue = extractTooltipValue(cell);
    if (tooltipValue) return tooltipValue;
  }

  // Get display text
  const displayText = getCellDisplayText(cell);

  return displayText;
}

function isNumericHeader(header: string): boolean {
  const numericHeaders = ['volume', 'traffic', 'kd', 'position', 'cpc', 'density', '%', 'clicks'];
  return numericHeaders.some(h => header.includes(h));
}

function getCellDisplayText(cell: Element): string {
  // Remove button elements (sort, info icons)
  const clone = cell.cloneNode(true) as Element;
  clone.querySelectorAll('button, svg, [role="button"], .icon, [class*="icon"]').forEach(el => el.remove());

  // Get text content
  let text = (clone.textContent || '').trim();

  // Normalize whitespace
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}
