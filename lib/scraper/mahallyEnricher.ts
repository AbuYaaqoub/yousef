import * as ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import { extractFromHomepage } from './extractStoreInfo';

const INPUT_FILE = path.join(process.cwd(), 'Mahally_Leads.xlsx');
const OUTPUT_FILE = path.join(process.cwd(), 'Final_Stores_Data.xlsx');

export async function enrichMahallyData(targetSheetName?: string) {
    console.log(`📂 Checking for input file at: ${INPUT_FILE}`);
    
    if (!fs.existsSync(INPUT_FILE)) {
        console.error('❌ Input file not found!');
        throw new Error(`لم يتم العثور على ملف Mahally_Leads.xlsx في ${INPUT_FILE}`);
    }

    const apiKey = process.env.SERPER_API_KEY;
    if (!apiKey) {
        throw new Error('⚠️ Serper.dev API key missing. Please check your .env file.');
    }

    const inputWorkbook = new ExcelJS.Workbook();
    await inputWorkbook.xlsx.readFile(INPUT_FILE);
    
    const outputWorkbook = new ExcelJS.Workbook();
    // تحميل الملف النهائي إذا كان موجوداً للحفاظ على الصفحات السابقة
    if (fs.existsSync(OUTPUT_FILE)) {
        await outputWorkbook.xlsx.readFile(OUTPUT_FILE);
    }

    // تحديد اسم الصفحة: إذا لم يتم تحديد اسم، نستخدم اسم عام أو أول صفحة
    const finalSheetName = targetSheetName || 'نتائج عامة';
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
            { header: 'رابط محلي الأصلي', key: 'mahallyUrl', width: 40 }
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
                    const desc = row.getCell(3).value?.toString(); // معلومات إضافية (الوصف)
                    if (name) storesToProcess.push({ name, mahallyUrl: url, desc: desc || '' });
                }
            });
        }
    });

    console.log(`📝 Found ${storesToProcess.length} stores to process for sheet [${finalSheetName}].`);

    // منع التكرار: قراءة الروابط الموجودة حالياً في هذه الصفحة
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
            // البحث عبر Serper API
            const cleanDesc = store.desc.replace(/[^\w\s\u0600-\u06FF]/g, ' ').substring(0, 100);
            const searchQuery = `"${store.name}" ${cleanDesc} متجر سلة`;

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
                    lowerHref.includes('mahally.com') || 
                    lowerHref.includes('youtube.com') ||
                    lowerHref.includes('twitter.com') ||
                    lowerHref.includes('facebook.com') ||
                    lowerHref.includes('instagram.com') ||
                    lowerHref.includes('salla.sa/s/') ||
                    lowerHref.includes('linkedin.com')) {
                    continue;
                }
                firstResultUrl = href;
                break;
            }

            if (firstResultUrl) {
                // تخطي إذا كان الموقع موجوداً مسبقاً في هذه الصفحة
                if (existingWebsites.has(firstResultUrl)) {
                    console.log(`⏩ Store already exists in sheet: ${store.name}`);
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
                        mahallyUrl: store.mahallyUrl
                    };

                    worksheet.addRow(finalData);
                    results.push(finalData);
                    existingWebsites.add(firstResultUrl);
                    
                    await outputWorkbook.xlsx.writeFile(OUTPUT_FILE);
                    console.log(`💾 Saved ${store.name} to [${finalSheetName}]`);
                } catch (e: any) {
                    console.error(`❌ Extraction error:`, e.message);
                }
            } else {
                console.log(`⚠️ No website found for ${store.name}`);
            }

            await new Promise(resolve => setTimeout(resolve, 500));

        } catch (err: any) {
            console.error(`❌ API Error:`, err.message);
        }
    }

    console.log(`\n🎉 Enrichment Complete! Total new entries: ${results.length}`);
    return results;
}
