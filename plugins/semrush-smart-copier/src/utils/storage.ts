// utils/storage.ts
// Manages column selection preferences using localStorage

import { ColumnConfig } from '../types/index';

const STORAGE_KEY = 'semrush_smart_copier_columns';

export function saveColumnConfig(columns: ColumnConfig[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(columns));
  } catch (e) {
    // ignore
  }
}

export function loadColumnConfig(): ColumnConfig[] | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    // ignore
  }
  return null;
}

export function getDefaultColumns(headers: string[]): ColumnConfig[] {
  // These are enabled by default based on PRD
  const defaultEnabled = ['keyword', 'volume', 'kd', 'traffic', 'url', 'position'];

  return headers.map(header => ({
    key: header,
    label: header,
    enabled: defaultEnabled.some(d => header.toLowerCase().includes(d)),
  }));
}
