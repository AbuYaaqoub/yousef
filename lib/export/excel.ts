import * as XLSX from 'xlsx';
import { StoreLead } from '@/types';

export function exportToExcel(leads: StoreLead[]): Buffer {
    const worksheet = XLSX.utils.json_to_sheet(leads);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
}