const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
    console.log("Querying directly from Supabase for sheets...");
    const { data, error } = await supabase
        .from('leads')
        .select('category')
        .eq('source', 'mahally');
        
    if (error) {
        console.error("Direct query error:", error);
    } else {
        console.log(`Direct query returned ${data.length} records.`);
        const categories = Array.from(new Set((data || []).map(item => item.category).filter(Boolean)));
        console.log("Unique categories found in Supabase:", categories);
    }
}

testQuery();
