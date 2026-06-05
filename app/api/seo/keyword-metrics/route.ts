import { NextRequest, NextResponse } from 'next/server';
import { fetchBingMetricsForKeywords } from '@/lib/scraper/bingSearch';

export async function POST(req: NextRequest) {
    try {
        const { keywords = [] } = await req.json();

        if (!Array.isArray(keywords) || keywords.length === 0) {
            return NextResponse.json({ 
                success: false, 
                error: 'يرجى تقديم قائمة الكلمات المفتاحية للفحص.' 
            }, { status: 400 });
        }

        // تحديد الحد الأقصى للكلمات في المرة الواحدة لحماية الاستهلاك والحدود المسموحة
        // Playwright عملية ثقيلة، لذا 15 كلمة هو حد مناسب جداً للدفعة الواحدة
        const MAX_KEYWORDS = 15;
        const keywordsToProcess = keywords.slice(0, MAX_KEYWORDS);

        console.log(`🔍 Checking Bing Search advanced metrics for ${keywordsToProcess.length} keywords.`);

        // استخلاص مصفوفة الكلمات النصية لإرسالها لخدمة الكشط السريع والموفر للموارد
        const keywordStrings = keywordsToProcess.map(item => item.keyword);
        
        // استدعاء دالة الكشط الدفعة الواحدة المحسنة والمستقرة
        const scrapedMetrics = await fetchBingMetricsForKeywords(keywordStrings);

        // ربط البيانات المستخرجة بمعرفات الكلمات المفتاحية (IDs) المرسلة من الواجهة
        const results = keywordsToProcess.map(item => {
            const metric = scrapedMetrics.find(m => m.keyword === item.keyword);
            return {
                id: item.id,
                keyword: item.keyword,
                quotation_results: metric ? metric.quotation : null,
                allinurl_results: metric ? metric.allinurl : null
            };
        });

        return NextResponse.json({
            success: true,
            results
        });

    } catch (error: any) {
        console.error('Keyword advanced metrics API error:', error);
        return NextResponse.json({ 
            success: false, 
            error: error.message || 'حدث خطأ غير متوقع أثناء معالجة البيانات.' 
        }, { status: 500 });
    }
}
