// types/index.ts

export interface TableRow {
  [columnName: string]: string;
}

export interface ExtractedTable {
  headers: string[];
  rows: TableRow[];
  sourceUrl: string;
  extractedAt: string;
  rowCount: number;
}

export interface ColumnConfig {
  key: string;
  label: string;
  enabled: boolean;
}

export interface ExtensionConfig {
  columns: ColumnConfig[];
  hotkey: string;
  darkMode: boolean;
}

export interface TooltipResult {
  text: string;
  fullValue: string | null;
}

export type ExtractionStatus = 'idle' | 'extracting' | 'success' | 'error';

export interface ExtractionResult {
  status: ExtractionStatus;
  rowCount?: number;
  error?: string;
}
