import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { data, error } = await supabase
            .from('seo_clients')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase fetch seo_clients error:', error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            clients: data || []
        });
    } catch (error: any) {
        console.error('Fetch SEO Clients API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
