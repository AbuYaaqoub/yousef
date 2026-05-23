import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('leads')
            .select('category')
            .eq('source', 'mazeed');
            
        if (error) throw error;
        
        const categories = Array.from(new Set((data || []).map(item => item.category).filter(Boolean)));
        
        return NextResponse.json({ success: true, sheets: categories });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message });
    }
}
