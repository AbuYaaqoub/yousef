import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // 1. محاولة جلب التصنيفات المخصصة من جدول custom_categories أولاً
        const { data: customCats, error: customCatsError } = await supabase
            .from('custom_categories')
            .select('name')
            .order('name', { ascending: true });

        if (!customCatsError && customCats && customCats.length > 0) {
            const categories = customCats.map(c => c.name);
            return NextResponse.json({ success: true, categories });
        }

        // 2. إذا كان الجدول فارغاً أو غير موجود، نتراجع لجلب التصنيفات الحالية الفريدة من جدول المتاجر (leads)
        const categoriesSet = new Set<string>();
        let from = 0;
        let to = 999;
        
        while (true) {
            const { data, error } = await supabase
                .from('leads')
                .select('category')
                .range(from, to);
                
            if (error) throw error;
            if (!data || data.length === 0) break;
            
            data.forEach(item => {
                if (item.category) categoriesSet.add(item.category);
            });
            
            if (data.length < 1000) break;
            from += 1000;
            to += 1000;
        }
        
        const categories = Array.from(categoriesSet).sort();
        
        return NextResponse.json({ success: true, categories });
    } catch (error: any) {
        console.error('❌ Categories API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
