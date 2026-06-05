const { chromium } = require('playwright');

async function test() {
    console.log("Launching chrome to inspect store page...");
    const browser = await chromium.launch({ 
        headless: true,
        channel: 'chrome'
    });
    const page = await browser.newPage();
    try {
        const storeUrl = 'https://mazeed.sa/store/325102?id=325102';
        await page.goto(storeUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(5000);
        
        console.log("Store Page Title:", await page.title());
        
        // Let's dump all links on the store page to see if we link to their official website
        const allLinks = await page.$$eval('a', els => els.map(el => ({
            text: el.innerText.trim(),
            href: el.href,
            className: el.className
        })).filter(l => l.href && !l.href.includes('javascript') && !l.href.includes('#')));
        console.log("All Links on Store Page:", allLinks);
        
        // Let's dump text blocks to see if there are contact numbers or instagram handles
        const textElements = await page.$$eval('p, span, div', els => 
            els.map(el => el.innerText.trim()).filter(t => t.length > 0 && t.length < 100).slice(0, 50)
        );
        console.log("Some text elements on Store Page:", textElements);
        
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await browser.close();
    }
}

test();
