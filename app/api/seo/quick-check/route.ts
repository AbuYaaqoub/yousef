import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const clientId = searchParams.get('client_id');

        if (!clientId) {
            return NextResponse.json({ success: false, error: 'معرف العميل (client_id) مطلوب.' }, { status: 400 });
        }

        // 1. جلب الكلمات المستهدفة النشطة للعميل
        const { data: targetedData, error: targetedError } = await supabase
            .from('seo_client_keywords')
            .select('keyword')
            .eq('client_id', clientId);

        if (targetedError) {
            console.error('Error fetching client targeted keywords:', targetedError);
            return NextResponse.json({ success: false, error: targetedError.message }, { status: 500 });
        }

        // 2. جلب الكلمات المقترحة من قاعدة الكلمات للعميل
        const { data: suggestedData, error: suggestedError } = await supabase
            .from('seo_keywords_database')
            .select('keyword')
            .eq('client_id', clientId);

        if (suggestedError) {
            console.error('Error fetching client suggested keywords:', suggestedError);
            return NextResponse.json({ success: false, error: suggestedError.message }, { status: 500 });
        }

        // 3. بناء خريطة الكلمات الموحدة (مفتاح وقيمة)
        // إذا تكررت الكلمة في الجدولين، تُعطى الأولوية للحالة النشطة 'targeted'
        const keywordsMap: Record<string, 'targeted' | 'suggested'> = {};

        (suggestedData || []).forEach(item => {
            const kw = (item.keyword || '').trim().toLowerCase();
            if (kw) {
                keywordsMap[kw] = 'suggested';
            }
        });

        (targetedData || []).forEach(item => {
            const kw = (item.keyword || '').trim().toLowerCase();
            if (kw) {
                keywordsMap[kw] = 'targeted';
            }
        });

        return NextResponse.json({
            success: true,
            keywords: keywordsMap
        });

    } catch (error: any) {
        console.error('Quick Check SEO Keywords API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
