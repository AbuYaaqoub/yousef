const { chromium } = require('playwright');

async function runTest() {
    console.log("Starting test...");
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
        console.log("Navigating to mahally...");
        await page.goto('https://mahally.com/browse/?query=%D8%A8%D8%AE%D9%88%D8%B1&page=1', { 
            waitUntil: 'domcontentloaded', 
            timeout: 10000 
        });
        
        console.log("Page loaded. Title:", await page.title());
        
        // Let's get all links containing products
        const links = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('a')).map(a => ({
                href: a.href,
                text: a.innerText,
                classes: a.className
            }));
        });
        
        console.log(`Total links: ${links.length}`);
        const productLinks = links.filter(l => l.href.includes('/products/'));
        console.log(`Product links: ${productLinks.length}`);
        console.log("First few product links:", productLinks.slice(0, 5));
        
        const storeLinks = links.filter(l => l.href.includes('/stores/'));
        console.log(`Store links: ${storeLinks.length}`);
        console.log("First few store links:", storeLinks.slice(0, 5));

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await browser.close();
    }
}

runTest();
