const { chromium } = require('playwright');

async function test() {
    console.log("Launching chrome with domcontentloaded search...");
    const browser = await chromium.launch({ 
        headless: true,
        channel: 'chrome'
    });
    const page = await browser.newPage();
    try {
        await page.goto('https://mazeed.sa/', { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        const searchInputSelector = '#search_product_input';
        // wait for the selector to be attached
        await page.waitForSelector(searchInputSelector, { timeout: 10000 });
        const hasSearch = await page.locator(searchInputSelector).count() > 0;
        console.log("Has #search_product_input:", hasSearch);
        
        if (hasSearch) {
            await page.fill(searchInputSelector, 'عطور');
            await page.keyboard.press('Enter');
            console.log("Submitted search! Waiting for results to load...");
            
            // Wait for URL to change or load
            await page.waitForTimeout(5000);
            console.log("Current URL after search:", page.url());
            
            // Dump links to products or stores
            const links = await page.$$eval('a', els => els.map(el => ({
                text: el.innerText.trim(),
                href: el.href
            })).filter(l => l.href && (l.href.includes('product') || l.href.includes('store') || l.href.includes('brand'))));
            console.log("Links found:", links.slice(0, 50));
        }
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await browser.close();
    }
}

test();
