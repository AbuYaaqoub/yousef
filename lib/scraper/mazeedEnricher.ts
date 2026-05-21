import * as ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import { extractFromHomepage } from './extractStoreInfo';

const INPUT_FILE = path.join(process.cwd(), 'Mazeed_Leads.xlsx');
const OUTPUT_FILE = path.join(process.cwd(), 'Final_Stores_Data.xlsx');

export async function enrichMazeedData(targetSheetName?: string) {
    console.log(`📂 Checking for Mazeed input file at: ${INPUT_FILE}`);
    
    if (!fs.existsSync(INPUT_FILE)) {
        console.error('❌ Mazeed Input file not found!');
        throw new Error(`لم يتم العثور على ملف Mazeed_Leads.xlsx في ${INPUT_FILE}`);
    }

    const apiKey = process.env.SERPER_API_KEY;
    if (!apiKey) {
        throw new Error('⚠️ Serper.dev API key missing. Please check your .env file.');
    }

    const inputWorkbook = new ExcelJS.Workbook();
    await inputWorkbook.xlsx.readFile(INPUT_FILE);
    
    const outputWorkbook = new ExcelJS.Workbook();
    if (fs.existsSync(OUTPUT_FILE)) {
        await outputWorkbook.xlsx.readFile(OUTPUT_FILE);
    }

    // اسم ورقة العمل النهائية
    const finalSheetName = targetSheetName ? `مزيد - ${targetSheetName}`.substring(0, 30) : 'مزيد - نتائج عامة';
    let worksheet = outputWorkbook.getWorksheet(finalSheetName);

    if (!worksheet) {
        worksheet = outputWorkbook.addWorksheet(finalSheetName);
        worksheet.columns = [
            { header: 'اسم المتجر', key: 'storeName', width: 25 },
            { header: 'رابط الموقع الرسمي', key: 'website', width: 35 },
            { header: 'البريد الإلكتروني', key: 'email', width: 30 },
            { header: 'رقم الهاتف/واتساب', key: 'phone', width: 20 },
            { header: 'إنستقرام', key: 'instagram', width: 20 },
            { header: 'تيك توك', key: 'tiktok', width: 20 },
            { header: 'سناب شات', key: 'snapchat', width: 20 },
            { header: 'رابط مزيد الأصلي', key: 'mazeedUrl', width: 40 }
        ];
        worksheet.getRow(1).font = { bold: true };
    }

    const storesToProcess: any[] = [];
    inputWorkbook.eachSheet(sheet => {
        if (!targetSheetName || sheet.name === targetSheetName) {
            sheet.eachRow((row, rowNumber) => {
                if (rowNumber > 1) {
                    const name = row.getCell(1).value?.toString();
                    const url = row.getCell(2).value?.toString();
                    const desc = row.getCell(3).value?.toString();
                    if (name) storesToProcess.push({ name, mazeedUrl: url, desc: desc || '' });
                }
            });
        }
    });

    console.log(`📝 Found ${storesToProcess.length} Mazeed stores to process for sheet [${finalSheetName}].`);

    // قراءة الروابط الموجودة حالياً لتجنب التكرار
    const existingWebsites = new Set<string>();
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
            const val = row.getCell('website').value?.toString();
            if (val) existingWebsites.add(val);
        }
    });

    const results = [];

    for (const store of storesToProcess) {
        console.log(`\n🔎 Searching for: ${store.name}...`);
        
        try {
            // البحث عن المتجر المدعوم من زد
            const searchQuery = `"${store.name}" متجر زد OR site:zid.store OR site:zid.sa`;

            const response = await axios.post('https://google.serper.dev/search', {
                q: searchQuery,
                num: 10
            }, {
                headers: {
                    'X-API-KEY': apiKey,
                    'Content-Type': 'application/json'
                }
            });

            const items = response.data.organic || [];
            let firstResultUrl = null;

            for (const item of items) {
                const href = item.link;
                if (!href) continue;
                
                const lowerHref = href.toLowerCase();
                if (lowerHref.includes('google.com') || 
                    lowerHref.includes('mazeed.sa') || 
                    lowerHref.includes('youtube.com') ||
                    lowerHref.includes('twitter.com') ||
                    lowerHref.includes('facebook.com') ||
                    lowerHref.includes('instagram.com') ||
                    lowerHref.includes('zid.sa/mazeed') ||
                    lowerHref.includes('linkedin.com')) {
                    continue;
                }
                firstResultUrl = href;
                break;
            }

            if (firstResultUrl) {
                if (existingWebsites.has(firstResultUrl)) {
                    console.log(`⏩ Store already enriched: ${store.name}`);
                    continue;
                }

                console.log(`✅ Found website: ${firstResultUrl}`);
                
                try {
                    const info = await extractFromHomepage(firstResultUrl);
                    const finalData = {
                        storeName: store.name,
                        website: firstResultUrl,
                        email: info.email || '',
                        phone: info.phone || info.whatsapp || '',
                        instagram: info.instagram || '',
                        tiktok: info.tiktok || '',
                        snapchat: info.snapchat || '',
                        mazeedUrl: store.mazeedUrl
                    };

                    worksheet.addRow(finalData);
                    results.push(finalData);
                    existingWebsites.add(firstResultUrl);
                    
                    await outputWorkbook.xlsx.writeFile(OUTPUT_FILE);
                    console.log(`💾 Saved ${store.name} to Final Excel [${finalSheetName}]`);
                } catch (e: any) {
                    console.error(`❌ Extraction error for ${store.name}:`, e.message);
                }
            } else {
                console.log(`⚠️ No website found for ${store.name}`);
            }

            await new Promise(resolve => setTimeout(resolve, 500));

        } catch (err: any) {
            console.error(`❌ API Search Error for ${store.name}:`, err.message);
        }
    }

    console.log(`\n🎉 Mazeed Enrichment Complete! Total new entries: ${results.length}`);
    return results;
}
