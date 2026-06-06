const axios = require('axios');

const apiKey = 'c9ff9788f71c356c04f78ac0a8240852738880e4';
const kw = 'اشتراك ادوبي';

function determineIntent(questionText) {
    return 'Informational';
}
function classifyTopic(questionText, keyword) {
    return 'General';
}

function getFallbackQuestionsForPlatform(platform, keyword, countNeeded) {
    const results = [];
    for (let i = 0; i < countNeeded; i++) {
        results.push({
            question: `${platform} fallback question ${i + 1} for ${keyword}؟`,
            platform,
            link: 'https://google.com',
            interactions: 50,
            intent: 'Informational',
            category: 'General',
            relevanceScore: 70
        });
    }
    return results;
}

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
        },
        timeout: 12000
    }).then(res => ({ platform: queryObj.platform, data: res.data }))
      .catch(err => {
          console.error(`Failed ${queryObj.platform}:`, err.message);
          return { platform: queryObj.platform, data: null };
      });
})).then(searchResults => {
    const finalQuestions = [];

    searchResults.forEach(({ platform, data }) => {
        const platformQuestions = [];
        
        if (data) {
            const organic = data.organic || [];
            organic.forEach((item, index) => {
                platformQuestions.push({
                    question: item.title,
                    platform,
                    link: item.link,
                    relevanceScore: 80
                });
            });
        }

        if (platformQuestions.length < 10) {
            const needed = 10 - platformQuestions.length;
            const fallbacks = getFallbackQuestionsForPlatform(platform, kw, needed);
            platformQuestions.push(...fallbacks);
        }

        finalQuestions.push(...platformQuestions.slice(0, 10));
    });

    console.log('Total extracted questions:', finalQuestions.length);
    const counts = {};
    finalQuestions.forEach(q => {
        counts[q.platform] = (counts[q.platform] || 0) + 1;
    });
    console.log('Counts per platform:', counts);
});
