import { chromium } from 'playwright';

/**
 * تحويل الأرقام العربية الشرقية (٠-٩) إلى أرقام غربية (0-9)
 */
function convertArabicNumbers(str: string): string {
    const arabicNums = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return str.replace(/[٠-٩]/g, (w) => String(arabicNums.indexOf(w)));
}

/**
 * تحليل نص إحصائيات جوجل واستخراج الرقم
 * مثال: "About 1,230 results (0.42 seconds)" -> 1230
 * مثال عربي: "حوالي ١٬٢٣٠ من النتائج (في ٠٫٤٢ ثانية)" -> 1230
 */
export function parseGoogleResultCount(text: string): number {
    if (!text) return 0;
    
    console.log(`[GooglePlaywright] Parsing raw result text: "${text}"`);
    let clean = convertArabicNumbers(text);
    
    // إزالة الفواصل والرموز الخاصة بالآلاف لجعل الرقم متصلاً
    clean = clean.replace(/[,٬\s]/g, '');
    
    // البحث عن أول رقم متصل في النص
    const match = clean.match(/\d+/);
    if (match) {
        const count = parseInt(match[0], 10);
        console.log(`[GooglePlaywright] Parsed count: ${count}`);
        return count;
    }
    
    return 0;
}

/**
 * دالة لجلب عدد نتائج البحث من جوجل باستخدام Playwright
 * تحاكي تصفح المستخدم بالذهاب للصفحة الرئيسية، كتابة الاستعلام، والبحث.
 * 
 * @param query الاستعلام للبحث عنه (مثال: allintitle:keyword)
 */
export async function fetchGoogleResultCountViaPlaywright(query: string): Promise<number> {
    console.log(`[GooglePlaywright] Launching browser to search for: [${query}]`);
    
    const browser = await chromium.launch({
        headless: true, // تشغيل خفي في الخلفية لسرعة الأداء وعدم مضايقة المستخدم
        args: [
            '--disable-blink-features=AutomationControlled',
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    });

    try {
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            locale: 'ar-SA', // استخدام الواجهة العربية لتجنب شك جوجل
            viewport: { width: 1280, height: 800 }
        });

        const page = await context.newPage();

        // حظر الصور والوسائط لتسريع التصفح وتوفير استهلاك الإنترنت
        await page.route('**/*', (route) => {
            const type = route.request().resourceType();
            if (['image', 'font', 'media'].includes(type)) {
                route.abort();
            } else {
                route.continue();
            }
        });

        // 1. الذهاب إلى صفحة جوجل الرئيسية
        await page.goto('https://www.google.com/?hl=ar', {
            waitUntil: 'domcontentloaded',
            timeout: 20000
        });

        // 2. البحث عن خانة البحث (يدعم textarea[name="q"] أو input[name="q"])
        const searchInputSelector = 'textarea[name="q"], input[name="q"]';
        await page.waitForSelector(searchInputSelector, { timeout: 10000 });
        
        // 3. كتابة الكلمة في خانة البحث وضغط Enter
        await page.fill(searchInputSelector, query);
        await page.waitForTimeout(300); // انتظار جزء من الثانية للمحاكاة الطبيعية
        await page.keyboard.press('Enter');

        // 4. انتظار ظهور نتائج البحث أو إحصائيات النتائج
        await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
        
        // التحقق من وجود كابتشا
        const content = await page.content();
        if (content.includes('captcha') || content.includes('recaptcha') || content.includes('robot')) {
            console.warn('[GooglePlaywright] CAPTCHA detected on Google!');
            throw new Error('حظر كابتشا من جوجل (CAPTCHA block detected). يرجى المحاولة لاحقاً.');
        }

        // 5. استخراج نص إحصائيات البحث (result-stats)
        const statsSelector = '#result-stats';
        const statsExists = await page.locator(statsSelector).count() > 0;

        if (statsExists) {
            const rawText = await page.locator(statsSelector).textContent() || '';
            return parseGoogleResultCount(rawText);
        } else {
            // في حال عدم وجود إحصائيات النتائج (قد تكون النتائج 0 أو صفحة نتائج بتنسيق مختلف)
            console.log('[GooglePlaywright] #result-stats not found. Checking if no results are found.');
            
            // التحقق من ظهور رسالة "لم ينجح بحثك عن"
            const pageText = await page.innerText('body');
            if (pageText.includes('لم ينجح بحثك') || pageText.includes('did not match any documents') || pageText.includes('لا توجد نتائج')) {
                console.log('[GooglePlaywright] Google returned 0 results.');
                return 0;
            }
            
            // محاولة جلب عدد العناوين المعروضة كبديل تقريبي
            const searchResultsCount = await page.locator('#search h3').count();
            console.log(`[GooglePlaywright] Fallback: Found ${searchResultsCount} search result items.`);
            return searchResultsCount;
        }

    } catch (error: any) {
        console.error('[GooglePlaywright] Error during search scraping:', error.message);
        throw error;
    } finally {
        await browser.close().catch(() => {});
    }
}
