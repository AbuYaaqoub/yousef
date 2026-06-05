const axios = require('axios');

async function test() {
    const url = 'https://oudmilano.com';
    try {
        const { data } = await axios.get(url, {
            timeout: 10000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        
        console.log("HTML Length:", data.length);
        // Look for any mention of social media strings in the whole HTML
        const socials = ['instagram', 'facebook', 'twitter', 'x.com', 'youtube', 'tiktok'];
        socials.forEach(s => {
            const index = data.indexOf(s);
            console.log(`${s}: Found at index ${index}`);
            if (index !== -1) {
                console.log(`Snippet around ${s}:`, data.substring(index - 50, index + 100));
            }
        });
        
    } catch (e) {
        console.error(`Error:`, e.message);
    }
}

test();
