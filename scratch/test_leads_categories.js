const axios = require('axios');

async function testApi() {
    try {
        console.log("Hitting http://localhost:3000/api/leads/categories...");
        const res = await axios.get('http://localhost:3000/api/leads/categories');
        console.log("Response:", res.data);
    } catch (err) {
        console.error("Endpoint hit failed:", err.message);
    }
}

testApi();
