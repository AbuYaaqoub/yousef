import { NextResponse } from 'next/server';
import * as ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';

export async function GET() {
    try {
        const filePath = path.join(process.cwd(), 'Google_Maps_Leads.xlsx');
        
        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ success: true, sheets: [] });
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        
        const sheetNames = workbook.worksheets.map(s => s.name);
        
        return NextResponse.json({ success: true, sheets: sheetNames });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message });
    }
}
