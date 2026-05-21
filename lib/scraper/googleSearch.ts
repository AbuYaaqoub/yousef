import axios from 'axios';

// استخدام Google Custom Search API المجاني
export async function searchSallaStores(maxResults: number = 10, userQuery: string = ''): Promise<string[]> {
    const apiKey = process.env.SERPER_API_KEY;

    if (!apiKey) {
        throw new Error('⚠️ Serper.dev API key missing. Please check your .env file.');
    }

    const resultsPerRequest = 10;
    const pages = Math.ceil(maxResults / resultsPerRequest);
    const allDomains: string[] = [];

    let queries = [
        'منصة سلة',
        'متاجر سلة',
        'Powered by Salla',
        'salla.sa',
        'salla.store'
    ];

    if (userQuery) {
        queries = queries.map(q => `${userQuery} ${q}`);
    }

    try {
        for (let p = 0; p < pages; p++) {
            const queryIndex = p % queries.length;
            const queryPage = Math.floor(p / queries.length);
            const currentQuery = queries[queryIndex];

            // Serper.dev API call
            const response = await axios.post('https://google.serper.dev/search', {
                q: currentQuery,
                num: resultsPerRequest,
                page: queryPage + 1
            }, {
                headers: {
                    'X-API-KEY': apiKey,
                    'Content-Type': 'application/json'
                }
            });

            const items = response.data.organic || [];
            if (items.length === 0) continue;

            const domains = items.map((item: any) => item.link)
                .filter((link: string) => {
                    if (!link || link.includes('google')) return false;
                    const lowerLink = link.toLowerCase();
                    return !(lowerLink.includes('salla.network') || 
                             lowerLink.includes('salla.cloud') || 
                             lowerLink.includes('assets.salla') ||
                             lowerLink.includes('help.salla') ||
                             lowerLink.includes('salla.dev'));
                });
            allDomains.push(...domains);
            
            if (pages > 5) await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        return Array.from(new Set(allDomains)).slice(0, maxResults);
    } catch (error: any) {
        console.error('⚠️ Serper.dev API Error:', error.response?.data?.message || error.message);
        return [];
    }
}
