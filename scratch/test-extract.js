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
        const storeName = $('title').text();
        console.log(`Store Name: ${storeName}`);
        
        const emails = data.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
        console.log(`Emails:`, emails);
        
        const phones = data.match(/(\+?966|0)?5\d{8}/g);
        console.log(`Phones:`, phones);
    } catch (e) {
        console.error(`Error:`, e.message);
    }
}

test();
