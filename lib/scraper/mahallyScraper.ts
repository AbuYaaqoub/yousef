import { chromium } from 'playwright';
import { shouldCancel } from './cancelSignal';

export async function scrapeMahallyStores(productName: string, onResult?: (store: any) => void, limit: number = 50) {
    const jobId = 'mahally-scrape'; // نستخدم معرف ثابت للتجربة
    
    // فتح المتصفح بشكل مرئي لتتمكن من مراقبة ما يحدث
    const browser = await chromium.launch({ 
        headless: false, 
        slowMo: 50 // إبطاء الحركات قليلاً لتكون مرئية
    });
    
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 720 },
        locale: 'ar-SA'
    });
    
    const page = await context.newPage();

    try {
        const seenStores = new Set<string>();
        const results = [];
        const maxPages = 10;
        
        console.log(`🚀 Starting live-extraction for: ${productName}`);

        for (let p = 1; p <= maxPages; p++) {
            if (shouldCancel(jobId)) break;
            
            // إرسال حالة التقدم للواجهة
            if (onResult) onResult({ type: 'status', message: `جاري فحص الصفحة ${p}...` });
            
            const searchUrl = `https://mahally.com/browse/?query=${encodeURIComponent(productName)}&page=${p}`;
            
            try {
                await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
                await page.waitForSelector('a[href*="/products/"]', { timeout: 10000 });
            } catch (e) {
                break;
            }

            const pageLinks = await page.evaluate(() => {
                const links = Array.from(document.querySelectorAll('a[href*="/products/"]'));
                return links.map(a => (a as HTMLAnchorElement).href);
            });

            if (pageLinks.length === 0) break;

            // معالجة روابط هذه الصفحة فوراً
            for (const link of pageLinks) {
                if (shouldCancel(jobId)) break;
                if (results.length >= limit) break;

                try {
                    await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 20000 });
                    
                    // الانتظار للتأكد من تحميل بيانات المتجر
                    await page.waitForSelector('a[href*="/stores/"]', { timeout: 5000 }).catch(() => {});
                    
                    const storeData = await page.evaluate(() => {
                        // المحدد الأكثر دقة الذي تم اكتشافه
                        const storeLink = document.querySelector('a[href*="/stores/"].font-bold') as HTMLAnchorElement;
                        const descriptionEl = document.querySelector('.text-grayer-500, p.text-sm.font-bold') as HTMLElement;
                        
                        if (!storeLink) return null;

                        return {
                            storeName: storeLink.innerText.trim(),
                            storeUrl: storeLink.href,
                            subText: descriptionEl ? descriptionEl.innerText.trim() : ''
                        };
                    });

                    if (storeData && !seenStores.has(storeData.storeUrl)) {
                        seenStores.add(storeData.storeUrl);
                        const finalStore = {
                            ...storeData,
                            storeName: storeData.storeName || 'متجر محلي',
                            rating: '🟢 محلي',
                            domain: storeData.storeUrl,
                            email: 'تم الحفظ في Excel',
                            phone: storeData.subText || 'متوفر في المتجر'
                        };
                        results.push(finalStore);
                        
                        // إرسال النتيجة فوراً للواجهة
                        if (onResult) onResult({ type: 'result', store: finalStore });
                    }
                } catch (err) {
                    continue;
                }
            }

            if (results.length >= limit) break;
        }

        return results;

        console.log(`\n✨ Extraction Finished! Found ${results.length} unique stores.`);
        return results;
    } catch (error) {
        console.error('Mahally Scrape Error:', error);
        return [];
    } finally {
        await browser.close();
    }
}
