import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        // 1. جلب العمليات التاريخية
        const { data: history, error } = await supabase
            .from('scraping_history')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const historyList = history || [];

        // 2. حساب إحصاءات السجل
        const totalCount = historyList.length;

        // حساب عمليات هذا الأسبوع (آخر 7 أيام)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const thisWeekCount = historyList.filter(item => new Date(item.created_at) >= sevenDaysAgo).length;

        // حساب متوسط عدد النتائج للعمليات المكتملة
        const completedRuns = historyList.filter(item => item.status === 'completed' && item.results_count > 0);
        const totalResultsCount = completedRuns.reduce((sum, item) => sum + (item.results_count || 0), 0);
        const averageResults = completedRuns.length > 0 
            ? Math.round((totalResultsCount / completedRuns.length) * 10) / 10 
            : 0;

        return NextResponse.json({
            success: true,
            history: historyList,
            stats: {
                thisWeekCount,
                averageResults,
                totalCount
            }
        });
    } catch (error: any) {
        console.error('❌ History API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        // مسح جميع السجلات التاريخية
        const { error } = await supabase
            .from('scraping_history')
            .delete()
            .neq('status', 'processing'); // لا نحذف العمليات قيد التشغيل

        if (error) throw error;

        return NextResponse.json({
            success: true,
            message: 'تم تفريغ سجل العمليات بنجاح.'
        });
    } catch (error: any) {
        console.error('❌ History Delete API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
