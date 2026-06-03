import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET: جلب جميع التصنيفات المخصصة
export async function GET() {
    try {
        const { data, error } = await supabase
            .from('custom_categories')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            // التحقق من تعذر الوصول للجدول
            if (error.message?.includes('relation "public.custom_categories" does not exist')) {
                return NextResponse.json({
                    success: false,
                    needsSetup: true,
                    error: 'جدول التصنيفات المخصصة غير موجود. يرجى تشغيل ملف supabase_schema.sql في Supabase SQL Editor.'
                }, { status: 200 }); // إرجاع حالة 200 مع شارة إعداد لتجنب انهيار الواجهات
            }
            throw error;
        }

        return NextResponse.json({ success: true, categories: data || [] });
    } catch (error: any) {
        console.error('❌ GET Categories API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// POST: إنشاء تصنيف مخصص جديد
export async function POST(req: NextRequest) {
    try {
        const { name } = await req.json();
        if (!name || !name.trim()) {
            return NextResponse.json({ success: false, error: 'اسم التصنيف مطلوب' }, { status: 400 });
        }

        const cleanName = name.trim();

        const { data, error } = await supabase
            .from('custom_categories')
            .insert([{ name: cleanName }])
            .select()
            .single();

        if (error) {
            if (error.code === '23505') { // Duplicate key violation
                return NextResponse.json({ success: false, error: 'هذا التصنيف موجود بالفعل' }, { status: 400 });
            }
            throw error;
        }

        return NextResponse.json({ success: true, category: data });
    } catch (error: any) {
        console.error('❌ POST Categories API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
