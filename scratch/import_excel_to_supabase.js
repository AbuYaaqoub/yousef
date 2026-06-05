const ExcelJS = require('exceljs');
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

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Supabase environment variables are missing!");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function importMahally() {
    const file = path.join(__dirname, '../Mahally_Leads.xlsx');
    if (!fs.existsSync(file)) {
        console.log("ℹ️ Mahally_Leads.xlsx not found. Skipping.");
        return;
    }
    
    console.log("📂 Reading Mahally_Leads.xlsx...");
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(file);
    
    let totalImported = 0;
    
    for (const worksheet of workbook.worksheets) {
        const category = worksheet.name;
        const leads = [];
        
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) { // Skip header
                const storeName = row.getCell(1).value?.toString() || '';
                const storeUrl = row.getCell(2).value?.toString() || '';
                const subText = row.getCell(3).value?.toString() || '';
                
                if (storeName && storeUrl) {
                    leads.push({
                        store_name: storeName,
                        store_url: storeUrl,
                        sub_text: subText,
                        source: 'mahally',
                        category: category,
                        rating: '🟢 محلي',
                        is_enriched: false
                    });
                }
            }
        });
        
        if (leads.length > 0) {
            console.log(`🚀 Uploading ${leads.length} leads for category [${category}] to Supabase...`);
            // Chunk uploads in batches of 100 to be safe
            for (let i = 0; i < leads.length; i += 100) {
                const chunk = leads.slice(i, i + 100);
                const { error } = await supabase
                    .from('leads')
                    .upsert(chunk, {
                        onConflict: 'store_url,category',
                        ignoreDuplicates: true
                    });
                if (error) {
                    console.error(`❌ Error uploading chunk for ${category}:`, error.message);
                } else {
                    totalImported += chunk.length;
                }
            }
        }
    }
    console.log(`✅ Mahally Import finished. Processed entries: ${totalImported}`);
}

async function importMazeed() {
    const file = path.join(__dirname, '../Mazeed_Leads.xlsx');
    if (!fs.existsSync(file)) {
        console.log("ℹ️ Mazeed_Leads.xlsx not found. Skipping.");
        return;
    }
    
    console.log("📂 Reading Mazeed_Leads.xlsx...");
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(file);
    
    let totalImported = 0;
    
    for (const worksheet of workbook.worksheets) {
        const category = worksheet.name;
        const leads = [];
        
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
                const storeName = row.getCell(1).value?.toString() || '';
                const storeUrl = row.getCell(2).value?.toString() || '';
                const subText = row.getCell(3).value?.toString() || '';
                
                if (storeName && storeUrl) {
                    leads.push({
                        store_name: storeName,
                        store_url: storeUrl,
                        sub_text: subText,
                        source: 'mazeed',
                        category: category,
                        rating: '🟡 متوسط',
                        is_enriched: false
                    });
                }
            }
        });
        
        if (leads.length > 0) {
            console.log(`🚀 Uploading ${leads.length} Mazeed leads for category [${category}]...`);
            for (let i = 0; i < leads.length; i += 100) {
                const chunk = leads.slice(i, i + 100);
                const { error } = await supabase
                    .from('leads')
                    .upsert(chunk, {
                        onConflict: 'store_url,category',
                        ignoreDuplicates: true
                    });
                if (error) {
                    console.error(`❌ Error uploading Mazeed chunk for ${category}:`, error.message);
                } else {
                    totalImported += chunk.length;
                }
            }
        }
    }
    console.log(`✅ Mazeed Import finished. Processed entries: ${totalImported}`);
}

async function importMaps() {
    const file = path.join(__dirname, '../Google_Maps_Leads.xlsx');
    if (!fs.existsSync(file)) {
        console.log("ℹ️ Google_Maps_Leads.xlsx not found. Skipping.");
        return;
    }
    
    console.log("📂 Reading Google_Maps_Leads.xlsx...");
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(file);
    
    let totalImported = 0;
    
    for (const worksheet of workbook.worksheets) {
        const category = worksheet.name;
        const leads = [];
        
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
                const storeName = row.getCell(1).value?.toString() || '';
                const storeUrl = row.getCell(2).value?.toString() || '';
                const categoryField = row.getCell(3).value?.toString() || '';
                const rating = row.getCell(4).value?.toString() || '';
                const reviewsCount = row.getCell(5).value?.toString() || '';
                const address = row.getCell(6).value?.toString() || '';
                const website = row.getCell(7).value?.toString() || '';
                const phone = row.getCell(8).value?.toString() || '';
                
                // Formulate subText as formatted string "العنوان: {address} | التقييم: {rating} ({reviewsCount} مراجعة)"
                const subText = `العنوان: ${address} | التقييم: ${rating} (${reviewsCount} مراجعة)`;
                
                if (storeName && storeUrl) {
                    leads.push({
                        store_name: storeName,
                        store_url: storeUrl,
                        sub_text: subText,
                        source: 'maps',
                        category: category,
                        rating: '🟡 متوسط',
                        is_enriched: false,
                        phone: phone,
                        website: website
                    });
                }
            }
        });
        
        if (leads.length > 0) {
            console.log(`🚀 Uploading ${leads.length} Google Maps leads for category [${category}]...`);
            for (let i = 0; i < leads.length; i += 100) {
                const chunk = leads.slice(i, i + 100);
                const { error } = await supabase
                    .from('leads')
                    .upsert(chunk, {
                        onConflict: 'store_url,category',
                        ignoreDuplicates: true
                    });
                if (error) {
                    console.error(`❌ Error uploading Google Maps chunk for ${category}:`, error.message);
                } else {
                    totalImported += chunk.length;
                }
            }
        }
    }
    console.log(`✅ Google Maps Import finished. Processed entries: ${totalImported}`);
}

async function run() {
    console.log("🎉 Starting migration to Supabase...");
    try {
        await importMahally();
        await importMazeed();
        await importMaps();
        console.log("🎉 All data successfully migrated to Supabase!");
    } catch (err) {
        console.error("❌ Migration failed with error:", err);
    }
}

run();
