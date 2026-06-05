import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import * as ExcelJS from 'exceljs';

export const dynamic = 'force-dynamic';

function parseSubText(subText: string = '') {
    let address = '';
    let rating = 0;
    let reviewsCount = 0;

    const addressMatch = subText.match(/العنوان:\s*(.*?)(?:\s*\|\s*التقييم:|$)/);
    if (addressMatch) {
        address = addressMatch[1].trim();
    }

    const ratingMatch = subText.match(/التقييم:\s*([\d.]+)/);
    if (ratingMatch) {
        rating = parseFloat(ratingMatch[1]);
    }

    const reviewsMatch = subText.match(/\((.*?)\s*مراجعة\)/);
    if (reviewsMatch) {
        reviewsCount = parseInt(reviewsMatch[1].replace(/[^\d]/g, ''), 10) || 0;
    }

    return { address, rating, reviewsCount };
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const source = searchParams.get('source') || 'all';
        const category = searchParams.get('category');

        console.log(`📥 Export requested for source: ${source}, category: ${category || 'All'}`);

        // 1. استعلام البيانات من Supabase
        let query = supabase.from('leads').select('*');

        if (source !== 'all') {
            query = query.eq('source', source);
        }
        if (category) {
            query = query.eq('category', category);
        }

        // ترتيب النتائج حسب تاريخ الاستخراج
        query = query.order('created_at', { ascending: false });

        const { data: leads, error } = await query;

        if (error) throw error;

        if (!leads || leads.length === 0) {
            return NextResponse.json({ success: false, error: 'لا توجد بيانات لتصديرها.' }, { status: 404 });
        }

        // 2. إنشاء ملف Excel
        const workbook = new ExcelJS.Workbook();
        
        // تقسيم البيانات إلى أوراق عمل بناءً على التصنيف
        const categories = Array.from(new Set(leads.map(l => l.category)));

        for (const catName of categories) {
            const catLeads = leads.filter(l => l.category === catName);
            const sheetName = (catName || 'نتائج عامة').substring(0, 30);
            const worksheet = workbook.addWorksheet(sheetName);

            // تحديد الأعمدة بناءً على المصدر
            const currentSource = catLeads[0]?.source;
            if (currentSource === 'maps') {
                worksheet.columns = [
                    { header: 'اسم المنشأة', key: 'title', width: 25 },
                    { header: 'التصنيف', key: 'category', width: 20 },
                    { header: 'التقييم', key: 'rating', width: 12 },
                    { header: 'عدد المراجعات', key: 'reviewsCount', width: 15 },
                    { header: 'العنوان', key: 'address', width: 35 },
                    { header: 'الموقع الرسمي', key: 'website', width: 35 },
                    { header: 'البريد الإلكتروني', key: 'email', width: 30 },
                    { header: 'رقم الهاتف/واتساب', key: 'phone', width: 20 },
                    { header: 'إنستقرام', key: 'instagram', width: 20 },
                    { header: 'تيك توك', key: 'tiktok', width: 20 },
                    { header: 'سناب شات', key: 'snapchat', width: 20 },
                    { header: 'رابط خرائط قوقل', key: 'mapsUrl', width: 40 }
                ];

                worksheet.getRow(1).fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFDDE6ED' } // أزرق كوبالتي هادئ
                };

                catLeads.forEach(lead => {
                    const { address, rating, reviewsCount } = parseSubText(lead.sub_text || '');
                    worksheet.addRow({
                        title: lead.store_name,
                        category: lead.category,
                        rating: rating || 0,
                        reviewsCount: reviewsCount || 0,
                        address: address || '',
                        website: lead.website || lead.store_url || 'غير متوفر',
                        email: lead.email || '',
                        phone: lead.phone || '',
                        instagram: lead.instagram || '',
                        tiktok: lead.tiktok || '',
                        snapchat: lead.snapchat || '',
                        mapsUrl: lead.mahally_url || lead.store_url || ''
                    });
                });
            } else {
                // محلي أو مزيد أو غيرها
                worksheet.columns = [
                    { header: 'اسم المتجر', key: 'storeName', width: 25 },
                    { header: 'رابط الموقع الرسمي', key: 'website', width: 35 },
                    { header: 'البريد الإلكتروني', key: 'email', width: 30 },
                    { header: 'رقم الهاتف/واتساب', key: 'phone', width: 20 },
                    { header: 'إنستقرام', key: 'instagram', width: 20 },
                    { header: 'تيك توك', key: 'tiktok', width: 20 },
                    { header: 'سناب شات', key: 'snapchat', width: 20 },
                    { header: 'المصدر', key: 'source', width: 15 },
                    { 
                        header: currentSource === 'mazeed' ? 'رابط مزيد الأصلي' : 'رابط محلي الأصلي', 
                        key: 'originalUrl', 
                        width: 40 
                    }
                ];

                worksheet.getRow(1).fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFE8F5E9' } // أخضر هادئ مناسب للمتاجر
                };

                catLeads.forEach(lead => {
                    worksheet.addRow({
                        storeName: lead.store_name,
                        website: lead.website || 'غير متوفر',
                        email: lead.email || '',
                        phone: lead.phone || lead.whatsapp || '',
                        instagram: lead.instagram || '',
                        tiktok: lead.tiktok || '',
                        snapchat: lead.snapchat || '',
                        source: lead.source === 'mahally' ? 'سلة/محلي' : (lead.source === 'mazeed' ? 'زد/مزيد' : lead.source),
                        originalUrl: lead.mahally_url || lead.store_url || ''
                    });
                });
            }

            // تنسيق الصف الأول (الهيدر)
            worksheet.getRow(1).font = { bold: true };
        }

        // كتابة الملف في الذاكرة
        const buffer = await workbook.xlsx.writeBuffer();

        // تحديد اسم الملف المناسب
        const cleanDate = new Date().toISOString().split('T')[0];
        const fileName = `SallaHunter_Export_${source}_${category || 'all'}_${cleanDate}`;

        return new Response(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}.xlsx"`,
                'Cache-Control': 'no-cache'
            }
        });

    } catch (error: any) {
        console.error('❌ Excel Export Route Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
