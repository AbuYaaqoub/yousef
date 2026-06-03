import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // 1. جلب التصنيفات المخصصة الحالية لمعرفة أسمائها والكلمات المرتبطة بها
        const { data: customCats, error: catsError } = await supabase
            .from('custom_categories')
            .select('name, keywords');

        if (catsError) {
            // التحقق من تعذر الوصول للجدول
            if (catsError.message?.includes('relation "public.custom_categories" does not exist')) {
                return NextResponse.json({
                    success: false,
                    needsSetup: true,
                    error: 'جدول التصنيفات المخصصة غير موجود. يرجى تهيئة قاعدة البيانات.'
                }, { status: 200 });
            }
            throw catsError;
        }

        const customCategoryNames = new Set<string>();
        const assignedKeywords = new Set<string>();

        if (customCats) {
            customCats.forEach(cat => {
                if (cat.name) {
                    customCategoryNames.add(cat.name.trim().toLowerCase());
                }
                if (cat.keywords && Array.isArray(cat.keywords)) {
                    cat.keywords.forEach((kw: string) => {
                        assignedKeywords.add(kw.trim().toLowerCase());
                    });
                }
            });
        }

        // 2. جلب الكلمات التي تم البحث عنها من سجل الكشط
        const { data: historyData } = await supabase
            .from('scraping_history')
            .select('query');

        const rawKeywordsMap = new Map<string, number>();

        if (historyData) {
            historyData.forEach(item => {
                if (item.query) {
                    const q = item.query.trim();
                    const qLower = q.toLowerCase();
                    
                    // استبعاد كلمة "عام" والتصنيفات المخصصة والكلمات المرتبطة بالفعل
                    if (
                        qLower !== 'عام' &&
                        !customCategoryNames.has(qLower) &&
                        !assignedKeywords.has(qLower)
                    ) {
                        rawKeywordsMap.set(q, 0); // وضع قيمة أولية صفر
                    }
                }
            });
        }

        // 3. جلب تصنيفات المتاجر لحساب عدد المتاجر التابعة لكل كلمة دلالية غير مصنفة
        const { data: leadsData } = await supabase
            .from('leads')
            .select('category');

        if (leadsData) {
            leadsData.forEach(item => {
                if (item.category) {
                    const cat = item.category.trim();
                    const catLower = cat.toLowerCase();
                    
                    if (
                        catLower !== 'عام' &&
                        !customCategoryNames.has(catLower) &&
                        !assignedKeywords.has(catLower)
                    ) {
                        rawKeywordsMap.set(cat, (rawKeywordsMap.get(cat) || 0) + 1);
                    }
                }
            });
        }

        // تحويل الخريطة لمصفوفة وفرزها تنازلياً حسب التكرار (الأكثر تكراراً أولاً)
        const unassignedKeywords = Array.from(rawKeywordsMap.entries())
            .map(([text, count]) => ({ text, count }))
            .sort((a, b) => b.count - a.count);

        return NextResponse.json({ success: true, keywords: unassignedKeywords });
    } catch (error: any) {
        console.error('❌ GET Existing Keywords API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
