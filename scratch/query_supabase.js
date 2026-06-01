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

console.log("Supabase URL:", supabaseUrl);
console.log("Supabase Key configured:", !!supabaseKey);

if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase environment variables are missing!");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    try {
        console.log("Querying scraping_history...");
        const { data: history, error: historyErr } = await supabase
            .from('scraping_history')
            .select('*')
            .limit(5);
        if (historyErr) {
            console.error("History query error:", historyErr);
        } else {
            console.log("History records:", history);
        }

        console.log("Querying leads count...");
        const { count, error: countErr } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true });
        if (countErr) {
            console.error("Leads count error:", countErr);
        } else {
            console.log("Total leads count:", count);
        }

        console.log("Querying unique categories...");
        const { data: categories, error: catErr } = await supabase
            .from('leads')
            .select('category, source')
            .limit(20);
        if (catErr) {
            console.error("Categories query error:", catErr);
        } else {
            console.log("Leads sample:", categories);
        }
    } catch (err) {
        console.error("Unexpected error:", err);
    }
}

run();
