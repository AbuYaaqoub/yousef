const { chromium } = require('playwright');

async function runTest() {
    console.log("Starting product test...");
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
        const productUrl = 'https://mahally.com/products/110139223/169115040/';
        console.log(`Navigating to product page: ${productUrl}`);
        await page.goto(productUrl, { 
            waitUntil: 'domcontentloaded', 
            timeout: 15000 
        });
        
        console.log("Page loaded. Title:", await page.title());
        
        // Let's get all links containing "/stores/"
        const links = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('a')).map(a => ({
                href: a.href,
                text: a.innerText,
                classes: a.className
            }));
        });
        
        const storeLinks = links.filter(l => l.href.includes('/stores/'));
        console.log(`Store links found: ${storeLinks.length}`);
        console.log("All store links:", storeLinks);

        // Let's check if the specific selector "a[href*='/stores/'].font-bold" matches anything
        const storeLinkText = await page.evaluate(() => {
            const el = document.querySelector("a[href*='/stores/'].font-bold");
            return el ? { text: el.innerText, href: el.href, className: el.className } : null;
        });
        console.log("Using selector 'a[href*=\"/stores/\"].font-bold':", storeLinkText);

        // Let's check any selector with "/stores/"
        const anyStoreLink = await page.evaluate(() => {
            const el = document.querySelector("a[href*='/stores/']");
            return el ? { text: el.innerText, href: el.href, className: el.className } : null;
        });
        console.log("Using selector 'a[href*=\"/stores/\"]':", anyStoreLink);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await browser.close();
    }
}

runTest();
