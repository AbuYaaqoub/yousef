import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const { sourceSheets, targetSheet } = await req.json();

        if (!sourceSheets || !Array.isArray(sourceSheets) || sourceSheets.length === 0) {
            return NextResponse.json({ success: false, error: 'يرجى اختيار أوراق صالحة للدمج.' });
        }

        if (!targetSheet || !targetSheet.trim()) {
            return NextResponse.json({ success: false, error: 'يرجى إدخال اسم للورقة الجديدة.' });
        }

        // 1. جلب المتاجر من التصنيفات المحددة للدمج
        const { data: leads, error: fetchError } = await supabase
            .from('leads')
            .select('*')
            .eq('source', 'mahally')
            .in('category', sourceSheets);

        if (fetchError) throw fetchError;

        if (!leads || leads.length === 0) {
            return NextResponse.json({ success: true, message: 'لا توجد بيانات لدمجها.' });
        }

        // 2. إزالة التكرار بالاعتماد على رابط المتجر
        const uniqueLeadsMap = new Map<string, any>();
        for (const lead of leads) {
            const url = lead.store_url;
            if (!uniqueLeadsMap.has(url)) {
                uniqueLeadsMap.set(url, lead);
            } else {
                // تفضيل المتجر الذي تم إثراؤه
                const existing = uniqueLeadsMap.get(url);
                if (!existing.is_enriched && lead.is_enriched) {
                    uniqueLeadsMap.set(url, lead);
                }
            }
        }

        const uniqueLeads = Array.from(uniqueLeadsMap.values());

        // 3. حذف السجلات القديمة لتجنب تعارض المفاتيح الفريدة
        const leadIds = leads.map(l => l.id);
        const { error: deleteError } = await supabase
            .from('leads')
            .delete()
            .in('id', leadIds);

        if (deleteError) throw deleteError;

        // 4. إعداد السجلات الجديدة مع تغيير التصنيف
        const leadsToInsert = uniqueLeads.map(lead => {
            const { id, created_at, ...rest } = lead;
            return {
                ...rest,
                category: targetSheet.trim()
            };
        });

        // 5. إدخال السجلات المدمجة والمحذوفة التكرار دفعة واحدة
        const { error: insertError } = await supabase
            .from('leads')
            .insert(leadsToInsert);

        if (insertError) throw insertError;

        return NextResponse.json({ 
            success: true, 
            message: `تم دمج ${sourceSheets.length} تصنيفات بنجاح إلى "${targetSheet}" بنجاح وتصفية التكرار.` 
        });

    } catch (error: any) {
        console.error('Merge Error:', error);
        return NextResponse.json({ success: false, error: error.message });
    }
}
