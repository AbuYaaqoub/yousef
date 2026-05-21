const { searchSallaStores } = require('../lib/scraper/googleSearch');
require('dotenv').config();

async function test() {
    try {
        console.log('Testing Google Search...');
        const urls = await searchSallaStores(5);
        console.log('URLs found:', urls);
    } catch (e) {
        console.error('Error:', e.message);
    }
}

test();
