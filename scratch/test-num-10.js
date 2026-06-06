const axios = require('axios');
const apiKey = 'c9ff9788f71c356c04f78ac0a8240852738880e4';
const kw = 'اشتراك ادوبي';

const queries = [
    { platform: 'Google', q: kw },
    { platform: 'Reddit', q: `site:reddit.com ${kw}` },
    { platform: 'Quora', q: `site:quora.com ${kw}` },
    { platform: 'X (Twitter)', q: `site:x.com ${kw}` },
    { platform: 'LinkedIn', q: `site:linkedin.com ${kw}` }
];

Promise.all(queries.map(queryObj => {
    return axios.post('https://google.serper.dev/search', {
        q: queryObj.q,
        num: 10
    }, {
        headers: {
            'X-API-KEY': apiKey,
            'Content-Type': 'application/json'
        }
    }).then(res => ({ platform: queryObj.platform, success: true, count: res.data.organic ? res.data.organic.length : 0 }))
      .catch(err => ({ platform: queryObj.platform, success: false, error: err.response ? err.response.data : err.message }));
})).then(results => {
    console.log(JSON.stringify(results, null, 2));
});
