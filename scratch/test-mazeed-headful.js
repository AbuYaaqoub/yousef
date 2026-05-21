const { chromium } = require('playwright');

async function test() {
    console.log("Launching system Google Chrome...");
    try {
        const browser = await chromium.launch({ 
            headless: true, // We can run headless with channel chrome!
            channel: 'chrome'
        });
        const page = await browser.newPage();
        console.log("Navigating to mazeed.sa...");
        await page.goto('https://mazeed.sa/', { waitUntil: 'domcontentloaded', timeout: 30000 });
        console.log("Title:", await page.title());
        await browser.close();
        console.log("Success!");
    } catch (e) {
        console.error("Error launching system chrome:", e);
    }
}

test();
