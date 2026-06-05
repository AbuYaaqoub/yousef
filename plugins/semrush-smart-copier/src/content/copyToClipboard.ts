// content/copyToClipboard.ts
// Converts extracted data to TSV format and copies to clipboard

import { TableRow } from '../types/index';

export function convertToTSV(headers: string[], rows: TableRow[], enabledColumns?: string[]): string {
  // Filter headers if column selection is active
  const activeHeaders = enabledColumns && enabledColumns.length > 0
    ? headers.filter(h => enabledColumns.includes(h))
    : headers;

  if (activeHeaders.length === 0 || rows.length === 0) return '';

  const lines: string[] = [];

  // Add header row
  lines.push(activeHeaders.map(h => escapeTSV(h)).join('\t'));

  // Add data rows
  for (const row of rows) {
    const values = activeHeaders.map(header => {
      const value = row[header] || '';
      return escapeTSV(value);
    });
    lines.push(values.join('\t'));
  }

  return lines.join('\n');
}

function escapeTSV(value: string): string {
  if (!value) return '';

  // If value contains tabs, newlines, or quotes, wrap in quotes
  if (value.includes('\t') || value.includes('\n') || value.includes('"')) {
    return '"' + value.replace(/"/g, '""') + '"';
  }

  return value;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // Modern Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback: execCommand (deprecated but still works in some contexts)
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch (err) {
    console.error('[SEMrush Smart Copier] Clipboard error:', err);
    return false;
  }
}

export function formatSummary(rowCount: number, columnCount: number): string {
  return `✅ تم النسخ: ${rowCount} صف × ${columnCount} عمود`;
}
