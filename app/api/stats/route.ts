import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import * as ExcelJS from 'exceljs';

export const dynamic = 'force-dynamic';

export async function GET() {
    const stats = {
        sallaLeads: 0,
        mazeedLeads: 0,
        mapsLeads: 0,
        totalLeads: 0,
        sallaSheets: 0,
        mazeedSheets: 0,
        mapsSheets: 0
    };

    try {
        const sallaPath = path.join(process.cwd(), 'Mahally_Leads.xlsx');
        const mazeedPath = path.join(process.cwd(), 'Mazeed_Leads.xlsx');
        const mapsPath = path.join(process.cwd(), 'Google_Maps_Leads.xlsx');

        // Helper to count sheets and actual leads (rows minus header)
        const getFileStats = async (filePath: string) => {
            if (!fs.existsSync(filePath)) {
                return { sheets: 0, rows: 0 };
            }
            
            const workbook = new ExcelJS.Workbook();
            try {
                await workbook.xlsx.readFile(filePath);
                let rowsCount = 0;
                
                workbook.worksheets.forEach(sheet => {
                    let sheetRows = 0;
                    sheet.eachRow((row, rowNumber) => {
                        // Count rows that have actual cell values, skipping the header (row 1)
                        if (rowNumber > 1 && row.values && (row.values as any[]).length > 0) {
                            sheetRows++;
                        }
                    });
                    rowsCount += sheetRows;
                });

                return { 
                    sheets: workbook.worksheets.length, 
                    rows: rowsCount 
                };
            } catch (err) {
                console.error(`⚠️ Error reading Excel file at ${filePath}:`, err);
                return { sheets: 0, rows: 0 };
            }
        };

        const sallaFileStats = await getFileStats(sallaPath);
        stats.sallaLeads = sallaFileStats.rows;
        stats.sallaSheets = sallaFileStats.sheets;

        const mazeedFileStats = await getFileStats(mazeedPath);
        stats.mazeedLeads = mazeedFileStats.rows;
        stats.mazeedSheets = mazeedFileStats.sheets;

        const mapsFileStats = await getFileStats(mapsPath);
        stats.mapsLeads = mapsFileStats.rows;
        stats.mapsSheets = mapsFileStats.sheets;

        stats.totalLeads = stats.sallaLeads + stats.mazeedLeads + stats.mapsLeads;

        return NextResponse.json({ 
            success: true, 
            stats,
            isSerperConfigured: !!process.env.SERPER_API_KEY
        });
    } catch (error: any) {
        console.error('❌ System Stats API Error:', error);
        return NextResponse.json({ success: false, error: error.message });
    }
}
