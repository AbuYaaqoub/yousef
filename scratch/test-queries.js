const axios = require('axios');

const apiKey = 'c9ff9788f71c356c04f78ac0a8240852738880e4';
const kw = 'ادوبي';

const queries = [
    { platform: 'Google', q: kw },
    { platform: 'Reddit', q: `site:reddit.com ${kw}` },
    { platform: 'Quora', q: `site:quora.com ${kw}` },
    { platform: 'X (Twitter)', q: `(site:twitter.com OR site:x.com) ${kw}` },
    { platform: 'LinkedIn', q: `site:linkedin.com ${kw}` }
];

Promise.all(queries.map(q => {
    return axios.post('https://google.serper.dev/search', { q: q.q, num: 15 }, {
        headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' }
    }).then(res => ({ platform: q.platform, data: res.data }));
})).then(results => {
    results.forEach(r => {
        console.log(`Platform: ${r.platform}, Organic count:`, r.data.organic ? r.data.organic.length : 0);
        if (r.data.peopleAlsoAsk) {
            console.log(`Platform: ${r.platform}, PAA count:`, r.data.peopleAlsoAsk.length);
        }
    });
}).catch(err => {
    console.error(err);
});
