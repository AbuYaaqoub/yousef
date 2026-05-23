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
            query = query.eq('category', category);
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
