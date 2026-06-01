import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const { client_id, keywords } = body;

        if (!client_id) {
            return NextResponse.json({ success: false, error: 'معرف العميل (client_id) مطلوب.' }, { status: 400 });
        }

        if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
            return NextResponse.json({ success: false, error: 'الكلمات المفتاحية مطلوبة ويجب أن تكون مصفوفة غير فارغة.' }, { status: 400 });
        }

        // 1. جلب الكلمات الموجودة بالفعل للعميل لتفادي تكرارها
        const { data: existingKeywordsData, error: fetchError } = await supabase
            .from('seo_keywords_database')
            .select('keyword')
            .eq('client_id', client_id);

        if (fetchError) {
            console.error('Error fetching existing keywords:', fetchError);
            return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
        }

        const existingSet = new Set(
            (existingKeywordsData || []).map(item => item.keyword.trim().toLowerCase())
        );

        // 2. تصفية الكلمات الواردة من الإضافة وحذف المكرر محلياً وتجاهل الكلمات الفارغة
        const uniqueIncoming = new Map<string, any>();
        keywords.forEach(kwItem => {
            const kwText = (kwItem.keyword || '').trim();
            if (!kwText) return;
            
            const kwLower = kwText.toLowerCase();
            // تفادي التكرار في القائمة الواردة نفسها، والاحتفاظ بالقيمة الأعلى في الحجم أو الـ KD إذا وجد تكرار
            if (!uniqueIncoming.has(kwLower)) {
                uniqueIncoming.set(kwLower, kwItem);
            } else {
                const existingItem = uniqueIncoming.get(kwLower);
                if ((kwItem.volume || 0) > (existingItem.volume || 0)) {
                    uniqueIncoming.set(kwLower, kwItem);
                }
            }
        });

        // تصفية الكلمات التي لا توجد مسبقاً بقاعدة البيانات للعميل
        const newKeywords = Array.from(uniqueIncoming.values()).filter(kwItem => {
            const kwText = kwItem.keyword.trim().toLowerCase();
            return !existingSet.has(kwText);
        });

        if (newKeywords.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'كل الكلمات المفتاحية مضافة مسبقاً لهذا العميل بالفعل.',
                count: 0,
                totalIncoming: keywords.length
            });
        }

        // 3. تجهيز البيانات للإدراج
        const itemsToInsert = newKeywords.map(kwItem => ({
            client_id: client_id,
            keyword: kwItem.keyword.trim(),
            kd: parseInt(kwItem.kd) || 0,
            volume: parseInt(kwItem.volume) || 0,
            platform: kwItem.platform || 'semrush',
            source_site: kwItem.source_site || ''
        }));

        // 4. الإدراج في قاعدة البيانات
        const { error: insertError } = await supabase
            .from('seo_keywords_database')
            .insert(itemsToInsert);

        if (insertError) {
            console.error('Error inserting synced keywords:', insertError);
            return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: `تمت مزامنة وإدراج ${newKeywords.length} كلمات مفتاحية بنجاح للعميل!`,
            count: newKeywords.length,
            totalIncoming: keywords.length
        });

    } catch (error: any) {
        console.error('Sync Keywords API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
