import { NextRequest, NextResponse } from 'next/server';
import { searchSallaStores } from '@/lib/scraper/googleSearch';
import { extractFromHomepage } from '@/lib/scraper/extractStoreInfo';
import { calculateRating } from '@/lib/leadScoring';
import { appendToGoogleSheets } from '@/lib/sheets/googleSheets';
import { StoreLead } from '@/types';

let abortController: AbortController | null = null;

export async function POST(req: NextRequest) {
    const { action, failedUrls, targetUrl, searchQuery } = await req.json();

    if (action === 'cancel') {
        if (abortController) abortController.abort();
        return NextResponse.json({ message: 'Cancelled' });
    }

    abortController = new AbortController();
    const signal = abortController.signal;

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

        // 3. حفظ في Google Sheets
        if (results.length) await appendToGoogleSheets(results);

        return NextResponse.json({ success: true, results, failedUrls: [] });
    } catch (error: any) {
        if (error.name === 'AbortError') {
            return NextResponse.json({ success: false, message: 'Cancelled' });
        }
        console.error('Scrape Error:', error);
        return NextResponse.json({ success: false, error: error.message });
    }
}