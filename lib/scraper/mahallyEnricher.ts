import * as ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import { extractFromHomepage } from './extractStoreInfo';
import { supabase } from '../supabase';
import { calculateRating } from '../leadScoring';

const OUTPUT_FILE = path.join(process.cwd(), 'Final_Stores_Data.xlsx');

export async function enrichMahallyData(targetSheetName?: string) {
    console.log(`📂 Starting Mahally enrichment process via Supabase...`);

    const apiKey = process.env.SERPER_API_KEY;
    if (!apiKey) {
        throw new Error('⚠️ Serper.dev API key missing. Please check your .env file.');
    }

    // 1. جلب البيانات غير المثرية من Supabase
    let dbQuery = supabase
        .from('leads')
        .select('*')
        .eq('source', 'mahally')
        .eq('is_enriched', false);

    if (targetSheetName) {
        dbQuery = dbQuery.eq('category', targetSheetName);
    }

    const { data: storesToProcess, error: dbError } = await dbQuery;

    if (dbError) {
        console.error('❌ Supabase Query Error:', dbError);
        throw new Error(`تعذر جلب البيانات من Supabase: ${dbError.message}`);
    }

    if (!storesToProcess || storesToProcess.length === 0) {
        console.log('📝 No unenriched stores found in Supabase.');
        return [];
    }

    console.log(`📝 Found ${storesToProcess.length} stores to process for category [${targetSheetName || 'All'}].`);

    // إعداد ملف إكسل كنسخة احتياطية
    const outputWorkbook = new ExcelJS.Workbook();
    if (fs.existsSync(OUTPUT_FILE)) {
        try {
            await outputWorkbook.xlsx.readFile(OUTPUT_FILE);
        } catch (e) {
            console.warn('Could not read local final excel backup, starting fresh.');
        }
    }

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

    const results = [];

    for (const store of storesToProcess) {
        console.log(`\n🔎 Searching for: ${store.store_name}...`);
        
        try {
            // البحث عبر Serper API
            const cleanDesc = (store.sub_text || '').replace(/[^\w\s\u0600-\u06FF]/g, ' ').substring(0, 100);
            const searchQuery = `"${store.store_name}" ${cleanDesc} متجر سلة`;

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
                console.log(`✅ Found website: ${firstResultUrl}`);
                
                try {
                    const info = await extractFromHomepage(firstResultUrl);
                    const rating = calculateRating(info);

                    const finalData = {
                        website: firstResultUrl,
                        email: info.email || '',
                        phone: info.phone || info.whatsapp || '',
                        whatsapp: info.whatsapp || '',
                        instagram: info.instagram || '',
                        tiktok: info.tiktok || '',
                        snapchat: info.snapchat || '',
                        twitter: info.twitter || '',
                        facebook: info.facebook || '',
                        youtube: info.youtube || '',
                        rating: rating,
                        is_enriched: true
                    };

                    // تحديث السجل في Supabase
                    const { error: updateError } = await supabase
                        .from('leads')
                        .update(finalData)
                        .eq('id', store.id);

                    if (updateError) {
                        console.error(`❌ Supabase update error for ${store.store_name}:`, updateError);
                    } else {
                        console.log(`💾 Saved ${store.store_name} to Supabase`);
                    }

                    const excelRow = {
                        storeName: store.store_name,
                        website: firstResultUrl,
                        email: info.email || '',
                        phone: info.phone || info.whatsapp || '',
                        instagram: info.instagram || '',
                        tiktok: info.tiktok || '',
                        snapchat: info.snapchat || '',
                        mahallyUrl: store.mahally_url || ''
                    };

                    results.push(excelRow);
                    worksheet.addRow(excelRow);
                    
                    // محاولة تحديث النسخة الاحتياطية في إكسل بأمان
                    try {
                        await outputWorkbook.xlsx.writeFile(OUTPUT_FILE);
                    } catch (err) {
                        // ignore excel writing lock
                    }

                } catch (e: any) {
                    console.error(`❌ Extraction error:`, e.message);
                }
            } else {
                console.log(`⚠️ No website found for ${store.store_name}`);
                // تحديث المتجر في السيرفر لجعله مثرى لتجنب تكراره بلا فائدة
                await supabase
                    .from('leads')
                    .update({ is_enriched: true })
                    .eq('id', store.id);
            }

            await new Promise(resolve => setTimeout(resolve, 500));

        } catch (err: any) {
            console.error(`❌ API Error:`, err.message);
        }
    }

    console.log(`\n🎉 Enrichment Complete! Total new entries: ${results.length}`);
    return results;
}
