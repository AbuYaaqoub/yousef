const axios = require('axios');

async function testApi() {
    try {
        console.log("Hitting http://localhost:3000/api/mahally/sheets...");
        const res = await axios.get('http://localhost:3000/api/mahally/sheets');
        console.log("Response:", res.data);
    } catch (err) {
        console.error("Endpoint hit failed:", err.message);
    }
}

testApi();
