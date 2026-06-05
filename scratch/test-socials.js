const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
    const url = 'https://oudmilano.com';
    try {
        console.log(`Fetching ${url}...`);
        const { data } = await axios.get(url, {
            timeout: 10000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
        });
        const $ = cheerio.load(data);
        
        console.log("Searching for social links...");
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            if (href && (href.includes('instagram') || href.includes('facebook') || href.includes('twitter') || href.includes('x.com') || href.includes('youtube') || href.includes('tiktok'))) {
                console.log(`Found Social: ${href}`);
            }
        });
        
    } catch (e) {
        console.error(`Error:`, e.message);
    }
}

test();
