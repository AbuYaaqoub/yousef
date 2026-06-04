import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') || '';
        const hasEmail = searchParams.get('hasEmail') === 'true';
        const hasPhone = searchParams.get('hasPhone') === 'true';
        const isStrong = searchParams.get('isStrong') === 'true';
        const source = searchParams.get('source') || '';
        const category = searchParams.get('category') || '';
        const limit = parseInt(searchParams.get('limit') || '100', 10);

        // 1. جلب الإحصاءات العامة الحقيقية في خطوة واحدة
        const [
            totalCountRes,
            emailCountRes,
            phoneCountRes,
            noSocialCountRes
        ] = await Promise.all([
            supabase.from('leads').select('*', { count: 'exact', head: true }),
            supabase.from('leads').select('*', { count: 'exact', head: true }).not('email', 'is', null).neq('email', ''),
            supabase.from('leads').select('*', { count: 'exact', head: true }).not('phone', 'is', null).neq('phone', ''),
            supabase.from('leads').select('*', { count: 'exact', head: true })
                .or('whatsapp.is.null,whatsapp.eq.,instagram.is.null,instagram.eq.,tiktok.is.null,tiktok.eq.,snapchat.is.null,snapchat.eq.')
        ]);

        const stats = {
            totalLeads: totalCountRes.count || 0,
            hasEmailCount: emailCountRes.count || 0,
            hasPhoneCount: phoneCountRes.count || 0,
            noSocialCount: noSocialCountRes.count || 0
        };

        // 2. بناء استعلام جلب البيانات المفلترة
        let query = supabase.from('leads').select('*');

        if (search) {
            query = query.or(`store_name.ilike.%${search}%,website.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
        }

        if (hasEmail) {
            query = query.not('email', 'is', null).neq('email', '');
        }

        if (hasPhone) {
            query = query.not('phone', 'is', null).neq('phone', '');
        }

        if (isStrong) {
            query = query.eq('rating', '🟢 قوي');
        }

        if (source) {
            query = query.eq('source', source);
        }

        if (category) {
            // التحقق مما إذا كان التصنيف المختار يمثل تصنيفاً مخصصاً لجلب كلماته الدلالية
            const { data: customCat } = await supabase
                .from('custom_categories')
                .select('name, keywords')
                .eq('name', category)
                .maybeSingle();

            if (customCat) {
                const keywords = customCat.keywords || [];
                // البحث بالاسم المباشر للتصنيف أو بأي من الكلمات الدلالية التابعة له
                const searchCategories = [customCat.name, ...keywords];
                query = query.in('category', searchCategories);
            } else {
                query = query.eq('category', category);
            }
        }

        // ترتيب الأحدث أولاً وحد أقصى
        query = query.order('created_at', { ascending: false }).limit(limit);

        const { data: leads, error } = await query;

        if (error) throw error;

        return NextResponse.json({
            success: true,
            leads: leads || [],
            stats
        });

    } catch (error: any) {
        console.error('❌ Leads API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const body = await req.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ success: false, error: 'يجب توفير مصفوفة معرفات صالحة' }, { status: 400 });
        }

        const { error } = await supabase
            .from('leads')
            .delete()
            .in('id', ids);

        if (error) throw error;

        return NextResponse.json({ success: true, message: 'تم حذف المتاجر بنجاح' });
    } catch (error: any) {
        console.error('❌ DELETE Leads API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        const { ids, category } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ success: false, error: 'يجب توفير مصفوفة معرفات صالحة' }, { status: 400 });
        }

        if (!category) {
            return NextResponse.json({ success: false, error: 'يجب تحديد التصنيف المستهدف للنقل' }, { status: 400 });
        }

        // 1. جلب عناوين URL للمتاجر المستهدفة
        const { data: targetLeads, error: fetchError } = await supabase
            .from('leads')
            .select('id, store_url')
            .in('id', ids);

        if (fetchError) throw fetchError;
        if (!targetLeads || targetLeads.length === 0) {
            return NextResponse.json({ success: false, error: 'لم يتم العثور على المتاجر المحددة' }, { status: 404 });
        }

        const urls = targetLeads.map(l => l.store_url);

        // 2. حذف المتاجر المكررة مسبقاً في التصنيف المستهدف لتجنب تعارض القيد الفريد (unique_store_url_category)
        // مع استثناء المعرفات الحالية التي يتم تحديثها إذا كانت تنتمي بالفعل للتصنيف المستهدف
        const { error: deleteError } = await supabase
            .from('leads')
            .delete()
            .in('store_url', urls)
            .eq('category', category)
            .not('id', 'in', `(${ids.join(',')})`);

        if (deleteError) throw deleteError;

        // 3. تحديث التصنيف للمتاجر المستهدفة
        const { error: updateError } = await supabase
            .from('leads')
            .update({ category })
            .in('id', ids);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true, message: 'تم نقل المتاجر بنجاح' });
    } catch (error: any) {
        console.error('❌ PATCH Leads API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

