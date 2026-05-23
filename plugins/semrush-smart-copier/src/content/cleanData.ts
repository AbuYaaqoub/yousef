// content/cleanData.ts
// Cleans extracted table data: removes duplicates, extra spaces, tracking params
// Preserves abbreviated values like 1.6K as-is

import { TableRow } from '../types/index';

export function cleanData(rows: TableRow[]): TableRow[] {
  // Remove duplicates
  const seen = new Set<string>();
  const unique = rows.filter(row => {
    const key = JSON.stringify(row);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Clean each row
  return unique.map(row => {
    const cleaned: TableRow = {};
    for (const [key, value] of Object.entries(row)) {
      cleaned[cleanKey(key)] = cleanValue(value);
    }
    return cleaned;
  });
}

function cleanKey(key: string): string {
  return key.trim().replace(/\s+/g, ' ');
}

function cleanValue(value: string): string {
  if (!value) return '';

  let cleaned = value.trim();

  // Normalize whitespace (but not newlines in multi-value cells)
  cleaned = cleaned.replace(/[ \t]+/g, ' ');

  // Remove zero-width characters
  cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF]/g, '');

  // Remove leading/trailing punctuation artifacts
  cleaned = cleaned.replace(/^[,;:\s]+|[,;:\s]+$/g, '');

  return cleaned;
}

export function deduplicateRows(rows: TableRow[], keyColumn: string): TableRow[] {
  if (!keyColumn) return rows;

  const seen = new Set<string>();
  return rows.filter(row => {
    const keyValue = row[keyColumn] || '';
    if (seen.has(keyValue)) return false;
    seen.add(keyValue);
    return true;
  });
}

export function filterEmptyRows(rows: TableRow[]): TableRow[] {
  return rows.filter(row => {
    const values = Object.values(row).filter(v => v && v.trim() !== '');
    return values.length > 0;
  });
}
