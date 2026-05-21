const axios = require('axios');

async function debugSearch() {
    const apiKey = 'AIzaSyDeTTodY9QETQBcuG_x_8pHKFWWynV9bt8';
    const cx = 'f3d92fbaaeff7422a';
    const query = 'site:salla.sa OR site:salla.store';

    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&num=10`;

    try {
        const response = await axios.get(url, {
            headers: {
                'Referer': 'http://localhost:3000'
            }
        });
        console.log('Results found:', response.data.items?.length || 0);
    } catch (error) {
        console.error('Error:', error.response?.data?.error?.message || error.message);
    }
}

debugSearch();
