import axios from 'axios';
import { shouldCancel } from './cancelSignal';

export async function scrapeMapsLeads(searchQuery: string, onResult?: (event: any) => void, limit: number = 50) {
    const jobId = 'maps-scrape';
    const apiKey = process.env.SERPER_API_KEY;

    if (!apiKey) {
        throw new Error('⚠️ Serper.dev API key missing. Please check your .env file.');
    }

    const results: any[] = [];

    try {
        console.log(`🚀 Starting Google Maps scraper for: ${searchQuery}`);
        if (onResult) onResult({ type: 'status', message: 'جاري الاتصال بمحرك استخبارات خرائط قوقل...' });

        //Serper.dev Maps endpoint can take pages, each page has 10/20 results
        // Let's fetch in pages of 20 results to be safe and stay within limit.
        const pageSize = 20;
        let page = 1;
        let hasMore = true;

        while (hasMore && results.length < limit) {
            if (shouldCancel(jobId)) {
                if (onResult) onResult({ type: 'status', message: 'تم إيقاف عملية الكشط النشطة من قبل المستخدم.' });
                break;
            }

            const currentProgress = Math.round((results.length / limit) * 100);
            if (onResult) {
                onResult({ 
                    type: 'status', 
                    message: `جاري استخراج المنشآت... الصفحة ${page} (تم جلب ${results.length} من ${limit} - نسبة الإنجاز ${currentProgress}%)` 
                });
            }

            // Serper Maps endpoint: https://google.serper.dev/maps
            const response = await axios.post('https://google.serper.dev/maps', {
                q: searchQuery,
                page: page,
                num: pageSize
            }, {
                headers: {
                    'X-API-KEY': apiKey,
                    'Content-Type': 'application/json'
                },
                timeout: 20000
            });

            const places = response.data.places || [];
            if (places.length === 0) {
                if (onResult) onResult({ type: 'status', message: `انتهت نتائج البحث المتوفرة في الصفحة ${page}.` });
                break;
            }

            for (const place of places) {
                if (results.length >= limit) break;
                if (shouldCancel(jobId)) break;

                // Build a reliable Google Maps link
                const cid = place.cid;
                const mapsUrl = cid 
                    ? `https://www.google.com/maps/place/?q=place_id:${cid}`
                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.title + ' ' + (place.address || ''))}`;

                const lead = {
                    title: place.title || 'منشأة خرائط قوقل',
                    storeName: place.title || 'منشأة خرائط قوقل', // for generic UI compatibility
                    mapsUrl: mapsUrl,
                    rating: place.rating || 0,
                    reviewsCount: place.ratingCount || 0,
                    category: place.category || 'غير محدد',
                    address: place.address || 'العنوان غير متوفر',
                    phone: place.phoneNumber || '',
                    website: place.website || '',
                    domain: place.website || '', // for compatibility
                    email: 'جاري كشط الموقع...',
                    subText: `${place.category || 'خرائط قوقل'} • ${place.address || ''}`
                };

                results.push(lead);

                // Stream the newly found lead to the UI instantly
                if (onResult) {
                    onResult({ type: 'result', store: lead });
                }
            }

            page++;
            // If the returned places count is less than our requested size, we might have hit the end
            if (places.length < pageSize) {
                hasMore = false;
            }

            // Slight delay between requests to be gentle
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        if (onResult) {
            onResult({ 
                type: 'status', 
                message: `✨ اكتملت العملية! تم استخراج ${results.length} منشأة فريدة من خرائط قوقل بنجاح.` 
            });
        }

        return results;

    } catch (error: any) {
        console.error('Google Maps Scrape Error:', error);
        const errorMsg = error.response?.data?.message || error.message || 'خطأ في الاتصال بالخادم الرئيسي.';
        if (onResult) onResult({ type: 'error', message: `فشل كشط خرائط قوقل: ${errorMsg}` });
        return [];
    }
}
