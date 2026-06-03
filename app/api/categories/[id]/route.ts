import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// PUT: تعديل اسم تصنيف مخصص وتحديث كافة المتاجر التابعة له
export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const { name: newName, keywords } = await req.json();

        let updatedData: any = {};

        // 1. إذا تم توفير الاسم الجديد، نقوم بتعديله وتحديث المتاجر التابعة له تعاقبياً
        if (newName !== undefined) {
            if (!newName || !newName.trim()) {
                return NextResponse.json({ success: false, error: 'الاسم الجديد مطلوب' }, { status: 400 });
            }

            const cleanNewName = newName.trim();

            const { data: oldCategory, error: fetchError } = await supabase
                .from('custom_categories')
                .select('name')
                .eq('id', id)
                .single();

            if (fetchError || !oldCategory) {
                return NextResponse.json({ success: false, error: 'التصنيف غير موجود' }, { status: 404 });
            }

            const oldName = oldCategory.name;

            if (oldName !== cleanNewName) {
                // معالجة التعارض في جدول المتاجر
                const { data: existingNewLeads } = await supabase
                    .from('leads')
                    .select('store_url')
                    .eq('category', cleanNewName);

                if (existingNewLeads && existingNewLeads.length > 0) {
                    const urlsToConflict = existingNewLeads.map(item => item.store_url);
                    await supabase
                        .from('leads')
                        .delete()
                        .eq('category', oldName)
                        .in('store_url', urlsToConflict);
                }

                // تحديث المتاجر التابعة للتصنيف بالاسم الجديد
                const { error: updateLeadsError } = await supabase
                    .from('leads')
                    .update({ category: cleanNewName })
                    .eq('category', oldName);

                if (updateLeadsError) {
                    console.error('❌ Error updating leads category name:', updateLeadsError);
                }
                
                updatedData.name = cleanNewName;
            }
        }

        // 2. إذا تم توفير مصفوفة الكلمات المفتاحية، ندرجها في البيانات المراد تحديثها
        if (keywords !== undefined) {
            if (!Array.isArray(keywords)) {
                return NextResponse.json({ success: false, error: 'صيغة الكلمات المفتاحية غير صالحة' }, { status: 400 });
            }
            updatedData.keywords = keywords;
        }

        // 3. تحديث جدول custom_categories بالبيانات المتاحة
        if (Object.keys(updatedData).length > 0) {
            const { data: updatedCategory, error: updateCatError } = await supabase
                .from('custom_categories')
                .update(updatedData)
                .eq('id', id)
                .select()
                .single();

            if (updateCatError) {
                throw updateCatError;
            }

            return NextResponse.json({ success: true, category: updatedCategory });
        }

        return NextResponse.json({ success: true, message: 'لا توجد بيانات جديدة لحفظها' });
    } catch (error: any) {
        console.error('❌ PUT Category API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// DELETE: حذف تصنيف مخصص وحذف المتاجر التابعة له
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        // 1. جلب اسم التصنيف قبل حذفه لحذف المتاجر التابعة له
        const { data: category, error: fetchError } = await supabase
            .from('custom_categories')
            .select('name')
            .eq('id', id)
            .single();

        if (fetchError || !category) {
            return NextResponse.json({ success: false, error: 'التصنيف غير موجود بالفعل' }, { status: 404 });
        }

        // 2. حذف جميع المتاجر (leads) التابعة لهذا التصنيف
        const { error: deleteLeadsError } = await supabase
            .from('leads')
            .delete()
            .eq('category', category.name);

        if (deleteLeadsError) {
            console.error('❌ Error deleting leads for category:', deleteLeadsError);
        }

        // 3. حذف التصنيف من جدول custom_categories
        const { error: deleteCatError } = await supabase
            .from('custom_categories')
            .delete()
            .eq('id', id);

        if (deleteCatError) {
            throw deleteCatError;
        }

        return NextResponse.json({ success: true, message: 'تم حذف التصنيف وجميع المتاجر التابعة له بنجاح' });
    } catch (error: any) {
        console.error('❌ DELETE Category API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
