import { NextRequest, NextResponse } from 'next/server';
import { enrichMazeedData } from '@/lib/scraper/mazeedEnricher';

export async function POST(req: NextRequest) {
    try {
        const { sheetName } = await req.json();
        console.log(`Starting deep enrichment process for Mazeed sheet: ${sheetName || 'All'}`);
        const results = await enrichMazeedData(sheetName);

        return NextResponse.json({ 
            success: true, 
            message: `تم الانتهاء من معالجة ${results.length} متجر وحفظهم في Final_Stores_Data.xlsx`,
            results 
        });

    } catch (error: any) {
        console.error('Mazeed Enrichment API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
