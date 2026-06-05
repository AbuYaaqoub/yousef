const { chromium } = require('playwright');

async function test() {
    console.log("Launching chrome to click store element...");
    const browser = await chromium.launch({ 
        headless: true,
        channel: 'chrome'
    });
    const page = await browser.newPage();
    try {
        const productUrl = 'https://mazeed.sa/products/%D8%AA%D9%88%D8%B2%D9%8A%D8%B9%D8%A7%D8%AA-%D8%A7%D9%84%D8%B9%D9%8A%D8%AF?id=593e5d3c-3526-44ea-94d4-553b52306998';
        await page.goto(productUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(5000);
        
        console.log("Before click, current URL:", page.url());
        
        const storeDivSelector = '.cursor-pointer.flex.items-center.mb-2';
        await page.click(storeDivSelector);
        console.log("Clicked! Waiting 4 seconds for navigation or modal...");
        await page.waitForTimeout(4000);
        
        console.log("After click, current URL:", page.url());
        
        // Let's dump all text or HTML on the page to see if a modal opened or if it navigated.
        const pageText = await page.evaluate(() => document.body.innerText);
        console.log("Is there a website URL in the page text?", pageText.includes('http') || pageText.includes('www'));
        
        // Dump all links on the new page/modal
        const allLinks = await page.$$eval('a', els => els.map(el => ({
            text: el.innerText.trim(),
            href: el.href
        })).filter(l => l.href && !l.href.includes('javascript') && !l.href.includes('#')));
        console.log("All Links after click:", allLinks.slice(0, 50));
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await browser.close();
    }
}

test();
