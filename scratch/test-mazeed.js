const { chromium } = require('playwright');

async function test() {
    console.log("Launching browser...");
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
        console.log("Navigating to mazeed.sa...");
        await page.goto('https://mazeed.sa/', { waitUntil: 'networkidle', timeout: 30000 });
        console.log("Title:", await page.title());
        
        // Let's see if there is an input field for search
        const inputs = await page.$$eval('input', els => els.map(el => ({
            placeholder: el.placeholder,
            id: el.id,
            className: el.className,
            name: el.name,
            type: el.type
        })));
        console.log("Input fields found:", inputs);

        // Let's try to search by navigating directly to search URL if we can guess, or let's search on the page
        // Commonly search is like: https://mazeed.sa/search?q=... or similar.
        // Let's type "عطور" in the search box if found
        const searchInputSelector = 'input[type="search"], input[placeholder*="ابحث"], input[placeholder*="search"]';
        const hasSearch = await page.locator(searchInputSelector).count() > 0;
        console.log("Has search input selector:", hasSearch);
        
        if (hasSearch) {
            await page.fill(searchInputSelector, 'عطور');
            await page.keyboard.press('Enter');
            console.log("Waiting for navigation or network idle...");
            await page.waitForTimeout(5000);
            console.log("Current URL after search:", page.url());
            
            // Dump some links
            const links = await page.$$eval('a', els => els.slice(0, 50).map(el => ({
                text: el.innerText.trim(),
                href: el.href
            })).filter(l => l.href.includes('mazeed.sa')));
            console.log("Some links on search page:", links);
        } else {
            console.log("No search input found. Let's dump all links on homepage to see navigation structure:");
            const links = await page.$$eval('a', els => els.map(el => ({
                text: el.innerText.trim(),
                href: el.href
            })).filter(l => l.href && (l.href.includes('store') || l.href.includes('brand') || l.href.includes('product'))));
            console.log("Interesting links:", links.slice(0, 50));
        }
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await browser.close();
    }
}

test();
