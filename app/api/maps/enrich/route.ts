import { NextRequest, NextResponse } from 'next/server';
import { enrichMapsData } from '@/lib/scraper/mapsEnricher';

export async function POST(req: NextRequest) {
    try {
        const { sheetName } = await req.json();
        
        // تشغيل معالج الإثراء
        const results = await enrichMapsData(sheetName);
        
        return NextResponse.json({
            success: true,
            message: `تم إكمال إثراء وتطوير بياناتخرائط قوقل بنجاح! تم استخراج ${results.length} منشأة مطورة.`,
            results
        });
    } catch (error: any) {
        console.error('Maps Enrichment API Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'حدث خطأ غير متوقع أثناء إثراء البيانات.'
        }, { status: 500 });
    }
}
