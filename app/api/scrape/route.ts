import { NextRequest, NextResponse } from 'next/server';
import { searchSallaStores } from '@/lib/scraper/googleSearch';
import { extractFromHomepage } from '@/lib/scraper/extractStoreInfo';
import { calculateRating } from '@/lib/leadScoring';
import { appendToGoogleSheets } from '@/lib/sheets/googleSheets';
import { StoreLead } from '@/types';
import { supabase } from '@/lib/supabase';

let abortController: AbortController | null = null;

export async function POST(req: NextRequest) {
    const { action, failedUrls, targetUrl, searchQuery } = await req.json();

    if (action === 'cancel') {
        if (abortController) abortController.abort();
        return NextResponse.json({ message: 'Cancelled' });
    }

    abortController = new AbortController();
    const signal = abortController.signal;

    // 1. تسجيل العملية في سجل العمليات بـ Supabase
    let historyId: string | null = null;
    const currentQuery = targetUrl ? `رابط مباشر: ${targetUrl}` : searchQuery || 'البحث العام عن متاجر سلة';
    try {
        const { data: historyData, error: historyError } = await supabase
            .from('scraping_history')
            .insert({
                type: 'Google Search',
                query: currentQuery,
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

    try {
        // 1. البحث أو استخدام الرابط المباشر
        let urls: string[];
        if (targetUrl) {
            // تنظيف الرابط والتأكد من وجود البروتوكول
            let cleanUrl = targetUrl.trim();
            if (!cleanUrl.startsWith('http')) {
                cleanUrl = `https://${cleanUrl}`;
            }
            urls = [cleanUrl];
        } else if (failedUrls && failedUrls.length) {
            urls = failedUrls; 
        } else {
            // البحث عن عدد أكبر (350 نتيجة) لضمان التنوع والكمية المطلوبة
            urls = await searchSallaStores(350, searchQuery || ''); 
        }

        const results: StoreLead[] = [];
        const concurrency = 3; // زيادة التزامن قليلاً
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        // 2. الزحف
        for (let i = 0; i < urls.length; i += concurrency) {
            if (signal.aborted) break;
            const batch = urls.slice(i, i + concurrency);
            const batchPromises = batch.map(async (url) => {
                await delay(Math.random() * 2000 + 1000); 
                if (signal.aborted) return null;
                
                const data = await extractFromHomepage(url);
                const lead: StoreLead = {
                    storeName: data.storeName || 'متجر سلة',
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
            });

            const batchResults = await Promise.all(batchPromises);
            
            // فلترة: إظهار القوي والمتوسط فقط كما طلب المستخدم (تجاهل الضعيف)
            // ولكن سنسمح بالمتوسط حالياً لضمان ظهور نتائج إذا كانت البيانات شحيحة
            const filteredLeads = batchResults.filter((r): r is StoreLead => 
                r !== null && (targetUrl || r.rating === '🟢 قوي' || r.rating === '🟡 متوسط')
            );
            
            results.push(...filteredLeads);
        }

        if (signal.aborted) {
            if (historyId) {
                await supabase
                    .from('scraping_history')
                    .update({ status: 'failed', error_message: 'Cancelled by user' })
                    .eq('id', historyId);
            }
            return NextResponse.json({ success: false, message: 'Cancelled' });
        }

        // 3. حفظ في Supabase
        if (results.length) {
            const leadsToInsert = results.map(item => ({
                store_name: item.storeName,
                store_url: item.domain || '',
                sub_text: 'تم استخراجه وتصنيفه عبر البحث المباشر ومستخلص المتجر الويب',
                source: 'google_scrape',
                category: searchQuery || 'البحث العام',
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
                console.error('❌ Supabase Leads Upsert Error:', upsertError);
            } else {
                console.log(`✅ Supabase Google Scrape: Upserted ${results.length} stores to Supabase.`);
            }

            // حفظ احتياطي في Google Sheets إذا كان مفعلاً
            try {
                await appendToGoogleSheets(results);
            } catch (err: any) {
                console.warn('⚠️ Google Sheets Append Failed (Optional): ', err.message);
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

        return NextResponse.json({ success: true, results, failedUrls: [] });
    } catch (error: any) {
        if (error.name === 'AbortError') {
            if (historyId) {
                await supabase
                    .from('scraping_history')
                    .update({ status: 'failed', error_message: 'Cancelled by user' })
                    .eq('id', historyId);
            }
            return NextResponse.json({ success: false, message: 'Cancelled' });
        }
        console.error('Scrape Error:', error);

        if (historyId) {
            await supabase
                .from('scraping_history')
                .update({
                    status: 'failed',
                    error_message: error.message
                })
                .eq('id', historyId);
        }

        return NextResponse.json({ success: false, error: error.message });
    }
}