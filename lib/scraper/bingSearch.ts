import { chromium } from 'playwright';

/**
 * دالة لجلب عدد نتائج البحث التقريبية من Bing للكلمة المفتاحية المقتبسة أو استعلام الروابط.
 * تستخدم Playwright لفتح متصفح خفي واستخراج إجمالي النتائج لتجنب قيود وحظر جوجل كابتشا.
 * 
 * @param query استعلام البحث (مثال: `"الكلمة"` أو `inurl:"الكلمة"`)
 * @returns إجمالي عدد النتائج أو null في حال حدوث خطأ
 */
export async function fetchBingResultCount(query: string): Promise<number | null> {
    console.log(`[BingScraper] Fetching result count for query: [${query}]`);
    let browser = null;

    try {
        browser = await chromium.launch({
            headless: true,
            args: [
                '--disable-blink-features=AutomationControlled',
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ]
        });

        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            locale: 'en-US'
        });

        const page = await context.newPage();

        // تحسين الأداء: حظر الصور والخطوط والوسائط لسرعة التحميل وتوفير البيانات
        await page.route('**/*', (route) => {
            const type = route.request().resourceType();
            if (['image', 'font', 'media'].includes(type)) {
                route.abort();
            } else {
                route.continue();
            }
        });

        const searchUrl = `https://www.bing.com/search?hl=en&q=${encodeURIComponent(query)}`;
        await page.goto(searchUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 15000
        });

        await page.waitForSelector('.sb_count', {
            state: 'attached',
            timeout: 6000
        });

        const countText = await page.locator('.sb_count').evaluate(el => el.textContent) || '';
        console.log(`[BingScraper] Raw count text found: "${countText.trim()}"`);

        const cleanText = countText.replace(/,/g, '');
        const match = cleanText.match(/(?:About\s+)?(\d+)\s+results/i);

        if (match) {
            const count = parseInt(match[1], 10);
            console.log(`[BingScraper] Parsed count for [${query}]: ${count}`);
            return count;
        }

        const numMatch = cleanText.match(/\d+/);
        if (numMatch) {
            const count = parseInt(numMatch[0], 10);
            console.log(`[BingScraper] Fallback parsed count for [${query}]: ${count}`);
            return count;
        }

        console.log(`[BingScraper] No count match found in text for: [${query}]`);
        return 0;

    } catch (error: any) {
        console.error(`[BingScraper] Failed to fetch count for query [${query}]:`, error.message);
        return null;
    } finally {
        if (browser) {
            await browser.close().catch(() => {});
        }
    }
}

/**
 * دالة محسنة لمعالجة مجموعة من الكلمات المفتاحية في متصفح واحد لتوفير موارد الجهاز وسرعة الاستجابة.
 * 
 * @param keywords قائمة الكلمات المفتاحية للفحص
 * @returns مصفوفة تحتوي على الكلمة والنتائج المقتبسة والروابط
 */
export async function fetchBingMetricsForKeywords(
    keywords: string[]
): Promise<Array<{ keyword: string; quotation: number | null; allinurl: number | null }>> {
    console.log(`[BingScraper] Starting bulk fetch for ${keywords.length} keywords.`);
    let browser = null;
    const results: Array<{ keyword: string; quotation: number | null; allinurl: number | null }> = [];

    try {
        browser = await chromium.launch({
            headless: true,
            args: [
                '--disable-blink-features=AutomationControlled',
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ]
        });

        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            locale: 'en-US'
        });

        const page = await context.newPage();

        // تحسين الأداء: حظر الصور والخطوط والوسائط لسرعة التحميل وتوفير البيانات
        await page.route('**/*', (route) => {
            const type = route.request().resourceType();
            if (['image', 'font', 'media'].includes(type)) {
                route.abort();
            } else {
                route.continue();
            }
        });

        for (const kw of keywords) {
            let quotationCount: number | null = null;
            let allinurlCount: number | null = null;

            // 1. فحص التطابق التام باقتباس ""
            try {
                const query = `"${kw}"`;
                const searchUrl = `https://www.bing.com/search?hl=en&q=${encodeURIComponent(query)}`;
                await page.goto(searchUrl, {
                    waitUntil: 'domcontentloaded',
                    timeout: 15000
                });

                await page.waitForSelector('.sb_count', {
                    state: 'attached',
                    timeout: 5000
                }).catch(() => {});

                const countText = await page.locator('.sb_count').evaluate(el => el.textContent).catch(() => '') || '';
                const cleanText = countText.replace(/,/g, '');
                const match = cleanText.match(/(?:About\s+)?(\d+)\s+results/i);
                if (match) {
                    quotationCount = parseInt(match[1], 10);
                } else {
                    const numMatch = cleanText.match(/\d+/);
                    if (numMatch) quotationCount = parseInt(numMatch[0], 10);
                }
            } catch (err: any) {
                console.error(`[BingScraper] Error getting quotation for [${kw}]:`, err.message);
            }

            // 2. فحص الروابط inurl:
            try {
                const query = `inurl:"${kw}"`;
                const searchUrl = `https://www.bing.com/search?hl=en&q=${encodeURIComponent(query)}`;
                await page.goto(searchUrl, {
                    waitUntil: 'domcontentloaded',
                    timeout: 15000
                });

                await page.waitForSelector('.sb_count', {
                    state: 'attached',
                    timeout: 5000
                }).catch(() => {});

                const countText = await page.locator('.sb_count').evaluate(el => el.textContent).catch(() => '') || '';
                const cleanText = countText.replace(/,/g, '');
                const match = cleanText.match(/(?:About\s+)?(\d+)\s+results/i);
                if (match) {
                    allinurlCount = parseInt(match[1], 10);
                } else {
                    const numMatch = cleanText.match(/\d+/);
                    if (numMatch) allinurlCount = parseInt(numMatch[0], 10);
                }
            } catch (err: any) {
                console.error(`[BingScraper] Error getting allinurl for [${kw}]:`, err.message);
            }

            results.push({
                keyword: kw,
                quotation: quotationCount,
                allinurl: allinurlCount
            });

            console.log(`[BingScraper] Keyword [${kw}] -> Quotation: ${quotationCount}, Allinurl: ${allinurlCount}`);

            // انتظار بسيط لعدم التسبب في ضغط على الخادم
            await page.waitForTimeout(200);
        }

    } catch (e: any) {
        console.error('[BingScraper] Bulk fetch error:', e.message);
    } finally {
        if (browser) {
            await browser.close().catch(() => {});
        }
    }

    return results;
}
