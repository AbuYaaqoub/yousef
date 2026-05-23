import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // الاستعلام عن الفئات لجميع المصادر في نفس الوقت
        const [
            mahallyRes,
            mazeedRes,
            mapsRes
        ] = await Promise.all([
            supabase.from('leads').select('category').eq('source', 'mahally'),
            supabase.from('leads').select('category').eq('source', 'mazeed'),
            supabase.from('leads').select('category').eq('source', 'maps')
        ]);

        if (mahallyRes.error) throw mahallyRes.error;
        if (mazeedRes.error) throw mazeedRes.error;
        if (mapsRes.error) throw mapsRes.error;

        const mahallyLeads = mahallyRes.data || [];
        const mazeedLeads = mazeedRes.data || [];
        const mapsLeads = mapsRes.data || [];

        const sallaLeads = mahallyLeads.length;
        const mazeedLeadsCount = mazeedLeads.length;
        const mapsLeadsCount = mapsLeads.length;

        const sallaSheets = Array.from(new Set(mahallyLeads.map(item => item.category).filter(Boolean))).length;
        const mazeedSheets = Array.from(new Set(mazeedLeads.map(item => item.category).filter(Boolean))).length;
        const mapsSheets = Array.from(new Set(mapsLeads.map(item => item.category).filter(Boolean))).length;

        const stats = {
            sallaLeads,
            mazeedLeads: mazeedLeadsCount,
            mapsLeads: mapsLeadsCount,
            totalLeads: sallaLeads + mazeedLeadsCount + mapsLeadsCount,
            sallaSheets,
            mazeedSheets,
            mapsSheets
        };

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
