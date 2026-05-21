import { chromium } from 'playwright';
import { shouldCancel } from './cancelSignal';

export async function scrapeMazeedStores(productName: string, onResult?: (store: any) => void, limit: number = 50) {
    const jobId = 'mazeed-scrape';
    
    // إعداد وتشغيل المتصفح باستخدام محرك الكروم المثبت على النظام لضمان الاستقرار
    const browser = await chromium.launch({ 
        headless: true,
        channel: 'chrome'
    });
    
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 720 },
        locale: 'ar-SA'
    });
    
    const page = await context.newPage();
    const results: any[] = [];
    const seenStores = new Set<string>();

    try {
        console.log(`🚀 Starting Mazeed scraper for: ${productName}`);
        if (onResult) onResult({ type: 'status', message: 'جاري فتح منصة مزيد...' });

        // 1. الانتقال إلى مزيد والبحث عن المنتج
        await page.goto('https://mazeed.sa/', { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        const searchInputSelector = '#search_product_input';
        await page.waitForSelector(searchInputSelector, { timeout: 10000 });
        
        if (onResult) onResult({ type: 'status', message: `جاري البحث عن "${productName}"...` });
        await page.fill(searchInputSelector, productName);
        await page.keyboard.press('Enter');
        
        // الانتظار لتحميل نتائج البحث
        await page.waitForTimeout(5000);
        
        // 2. تجميع روابط المنتجات من صفحة نتائج البحث
        const productLinks = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a[href*="/products/"]'));
            return links
                .map(a => (a as HTMLAnchorElement).href)
                .filter(href => href && href.includes('id=')); // الروابط التي تحتوي على المعرف هي صفحات منتجات حقيقية
        });

        const uniqueProductLinks = Array.from(new Set(productLinks));
        console.log(`🔎 Found ${uniqueProductLinks.length} product links to inspect.`);
        
        if (uniqueProductLinks.length === 0) {
            if (onResult) onResult({ type: 'status', message: 'لم يتم العثور على منتجات مطابقة لعملية البحث.' });
            return [];
        }

        // 3. زيارة صفحات المنتجات واستخراج معلومات المتاجر
        for (let i = 0; i < uniqueProductLinks.length; i++) {
            if (shouldCancel(jobId)) {
                if (onResult) onResult({ type: 'status', message: 'تم إيقاف عملية الاستخراج من قبل المستخدم.' });
                break;
            }
            if (results.length >= limit) break;

            const productUrl = uniqueProductLinks[i];
            const progressPercent = Math.round((i / uniqueProductLinks.length) * 100);
            
            if (onResult) {
                onResult({ 
                    type: 'status', 
                    message: `جاري فحص المنتج ${i + 1} من ${uniqueProductLinks.length} (${progressPercent}%)...` 
                });
            }

            try {
                // الانتقال لصفحة المنتج
                await page.goto(productUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
                await page.waitForTimeout(3000); // إتاحة الفرصة لتحميل المكونات الديناميكية

                // التحقق من وجود عنصر المتجر
                const storeDivSelector = '.cursor-pointer.flex.items-center.mb-2';
                const hasStoreElement = await page.locator(storeDivSelector).count() > 0;
                
                if (!hasStoreElement) {
                    continue; // تخطي في حال عدم العثور على متجر لهذا المنتج
                }

                // استخراج اسم المتجر المبدئي المتواجد في الصفحة
                const initialStoreName = await page.evaluate((selector) => {
                    const el = document.querySelector(selector) as HTMLElement;
                    return el ? el.innerText.trim() : '';
                }, storeDivSelector);

                // النقر على عنصر المتجر للانتقال لصفحة المتجر الرئيسية على مزيد
                await page.click(storeDivSelector);
                await page.waitForTimeout(4000); // انتظار التحميل الانتقالي

                const currentUrl = page.url();
                if (!currentUrl.includes('/store/')) {
                    continue; // لم ينجح الانتقال لصفحة المتجر
                }

                // استخراج اسم المتجر الكامل والنهائي من عنوان الصفحة أو المحتوى
                const title = await page.title();
                const cleanStoreName = title.split('|')[0].split('-')[0].replace('متجر', '').trim() || initialStoreName || 'متجر مزيد';

                if (!seenStores.has(currentUrl)) {
                    seenStores.add(currentUrl);

                    const finalStore = {
                        storeName: cleanStoreName,
                        storeUrl: currentUrl,
                        subText: `معرف المتجر: ${currentUrl.split('/store/')[1]?.split('?')[0] || ''}`,
                        rating: '🟢 مزيد (زد)',
                        domain: currentUrl,
                        email: 'جاري البحث عبر الإثراء...',
                        phone: 'متوفر في المتجر الرسمي'
                    };

                    results.push(finalStore);

                    // إرسال النتيجة فوراً للواجهة ليراها المستخدم
                    if (onResult) onResult({ type: 'result', store: finalStore });
                }

            } catch (err) {
                console.error(`Error processing product url ${productUrl}:`, err);
                continue;
            }
        }

        if (onResult) {
            onResult({ 
                type: 'status', 
                message: `✨ اكتملت العملية! تم استخراج ${results.length} متجر فريد بنجاح.` 
            });
        }
        return results;

    } catch (error) {
        console.error('Mazeed Scrape Error:', error);
        if (onResult) onResult({ type: 'error', message: 'حدث خطأ غير متوقع أثناء الكشط.' });
        return [];
    } finally {
        await browser.close();
    }
}
