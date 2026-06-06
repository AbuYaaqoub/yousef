const axios = require('axios');
const apiKey = 'c9ff9788f71c356c04f78ac0a8240852738880e4';

const testQueries = [
    'site:reddit.com ادوبي',
    'site:quora.com ادوبي',
    'site:twitter.com ادوبي',
    'site:x.com ادوبي',
    'site:linkedin.com ادوبي',
];

Promise.all(testQueries.map(q => {
    return axios.post('https://google.serper.dev/search', { q, num: 5 }, {
        headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' }
    }).then(res => {
        return { query: q, success: true, count: res.data.organic ? res.data.organic.length : 0 };
    }).catch(err => {
        return { query: q, success: false, error: err.response ? err.response.data : err.message };
    });
})).then(results => {
    console.log(JSON.stringify(results, null, 2));
});
