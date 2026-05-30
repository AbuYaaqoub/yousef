import { NextRequest, NextResponse } from 'next/server';
import { extractFromHomepage } from '@/lib/scraper/extractStoreInfo';
import { calculateRating } from '@/lib/leadScoring';
import { supabase } from '@/lib/supabase';
import { StoreLead } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const { urls, source, category } = body;

        if (!urls || !Array.isArray(urls) || urls.length === 0) {
            return NextResponse.json({ success: false, error: 'الروابط مطلوبة ويجب أن تكون مصفوفة صالحة' }, { status: 400 });
        }

        const pluginSource = source || 'semrush';
        const searchCategory = category || 'عام';
        const displaySource = pluginSource === 'semrush' ? 'SEMrush' : 'Ahrefs';

        // 1. تسجيل العملية في سجل العمليات بـ Supabase
        let historyId: string | null = null;
        try {
            const { data: historyData, error: historyError } = await supabase
                .from('scraping_history')
                .insert({
                    type: `${displaySource} Plugin`,
                    query: `مزامنة وإثراء من ملحق: ${displaySource} - تصنيف [${searchCategory}]`,
                    results_count: 0,
                    status: 'processing'
                })
                .select()
                .single();
            
            if (historyError) console.error('Supabase history error:', historyError);
            if (historyData) historyId = historyData.id;
        } catch (err) {
            console.error('Failed to create history record:', err);
        }

        // تنظيف الروابط وتنسيقها
        const cleanedUrls = urls.map((url: string) => {
            let clean = url.trim();
            if (!clean.startsWith('http')) {
                clean = `https://${clean}`;
            }
            return clean;
        });

        const results: StoreLead[] = [];
        const concurrency = 3;
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        // 2. معالجة الروابط وإثرائها في دفعات
        for (let i = 0; i < cleanedUrls.length; i += concurrency) {
            const batch = cleanedUrls.slice(i, i + concurrency);
            const batchPromises = batch.map(async (url) => {
                try {
                    // تأخير عشوائي صغير لمنع الحظر
                    await delay(Math.random() * 1000 + 500); 
                    const data = await extractFromHomepage(url);
                    
                    const lead: StoreLead = {
                        storeName: data.storeName || 'متجر منصة',
                        domain: data.domain || url,
                        email: data.email || '',
                        phone: data.phone || '',
                        whatsapp: data.whatsapp || '',
                        instagram: data.instagram || '',
                        tiktok: data.tiktok || '',
                        snapchat: data.snapchat || '',
                        twitter: data.twitter || '',
                        facebook: data.facebook || '',
                        youtube: data.youtube || '',
                        rating: calculateRating(data)
                    };
                    return lead;
                } catch (e) {
                    console.error(`Error scraping url ${url}:`, e);
                    return null;
                }
            });

            const batchResults = await Promise.all(batchPromises);
            const validLeads = batchResults.filter((r): r is StoreLead => r !== null);
            results.push(...validLeads);
        }

        // 3. حفظ في Supabase
        if (results.length > 0) {
            const leadsToInsert = results.map(item => ({
                store_name: item.storeName,
                store_url: item.domain || '',
                sub_text: `تم استيراده وإثراء بياناته مباشرة عبر ملحق متصفح ${displaySource}`,
                source: `${pluginSource}_plugin`,
                category: searchCategory,
                rating: item.rating || '🟡 متوسط',
                is_enriched: true,
                email: item.email || '',
                phone: item.phone || '',
                whatsapp: item.whatsapp || '',
                instagram: item.instagram || '',
                tiktok: item.tiktok || '',
                snapchat: item.snapchat || '',
                twitter: item.twitter || '',
                facebook: item.facebook || '',
                youtube: item.youtube || '',
                website: item.domain || ''
            }));

            const { error: upsertError } = await supabase
                .from('leads')
                .upsert(leadsToInsert, {
                    onConflict: 'store_url,category',
                    ignoreDuplicates: true
                });

            if (upsertError) {
                console.error('❌ Supabase Plugin Ingestion Upsert Error:', upsertError);
            } else {
                console.log(`✅ Supabase ${displaySource} Plugin: Upserted ${results.length} leads.`);
            }
        }

        // 4. تحديث سجل العمليات كمكتمل
        if (historyId) {
            await supabase
                .from('scraping_history')
                .update({
                    results_count: results.length,
                    status: 'completed'
                })
                .eq('id', historyId);
        }

        return NextResponse.json({
            success: true,
            message: `تم مزامنة وإثراء ${results.length} متاجر بنجاح!`,
            count: results.length
        });

    } catch (error: any) {
        console.error('Sync Plugin API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
