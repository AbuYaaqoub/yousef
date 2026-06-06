const axios = require('axios');
require('dotenv').config({ path: '../.env' });

const apiKey = process.env.SERPER_API_KEY || 'c9ff9788f71c356c04f78ac0a8240852738880e4';
console.log('API Key:', apiKey);

axios.post('https://google.serper.dev/search', {
    q: 'ادوبي',
    num: 10
}, {
    headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json'
    }
}).then(res => {
    console.log('Organic results count:', res.data.organic ? res.data.organic.length : 0);
    console.log('People also ask:', res.data.peopleAlsoAsk);
    if (res.data.organic && res.data.organic.length > 0) {
        console.log('First result:', res.data.organic[0].title);
    }
}).catch(err => {
    console.error('Error:', err.message);
});
