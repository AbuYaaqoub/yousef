import { NextResponse } from 'next/server';
import { mergeMahallySheets } from '@/lib/excel/mahallyExcel';

export async function POST(req: Request) {
    try {
        const { sourceSheets, targetSheet } = await req.json();

        if (!sourceSheets || !Array.isArray(sourceSheets) || sourceSheets.length === 0) {
            return NextResponse.json({ success: false, error: 'يرجى اختيار أوراق صالحة للدمج.' });
        }

        if (!targetSheet || !targetSheet.trim()) {
            return NextResponse.json({ success: false, error: 'يرجى إدخال اسم للورقة الجديدة.' });
        }

        const result = await mergeMahallySheets(sourceSheets, targetSheet);
        
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Merge Error:', error);
        return NextResponse.json({ success: false, error: error.message });
    }
}
