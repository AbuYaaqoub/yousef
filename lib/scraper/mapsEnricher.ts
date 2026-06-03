import * as ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import { extractFromHomepage } from './extractStoreInfo';
import { supabase } from '../supabase';
import { calculateRating } from '../leadScoring';

const OUTPUT_FILE = path.join(process.cwd(), 'Final_Maps_Data.xlsx');

function parseSubText(subText: string = '') {
    // subText format: "العنوان: {address} | التقييم: {rating} ({reviewsCount} مراجعة)"
    let address = '';
    let rating = 0;
    let reviewsCount = 0;

    const addressMatch = subText.match(/العنوان:\s*(.*?)(?:\s*\|\s*التقييم:|$)/);
    if (addressMatch) {
        address = addressMatch[1].trim();
    }

    const ratingMatch = subText.match(/التقييم:\s*([\d.]+)/);
    if (ratingMatch) {
        rating = parseFloat(ratingMatch[1]);
    }

    const reviewsMatch = subText.match(/\((.*?)\s*مراجعة\)/);
    if (reviewsMatch) {
        reviewsCount = parseInt(reviewsMatch[1].replace(/[^\d]/g, ''), 10) || 0;
    }

    return { address, rating, reviewsCount };
}

export async function enrichMapsData(targetSheetName?: string) {
    console.log(`📂 Starting Google Maps enrichment process via Supabase...`);

    // 1. جلب البيانات غير المثرية من Supabase
    let dbQuery = supabase
        .from('leads')
        .select('*')
        .eq('source', 'maps')
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
        console.log('📝 No unenriched Google Maps leads found in Supabase.');
        return [];
    }

    console.log(`📝 Found ${storesToProcess.length} Google Maps leads to process for category [${targetSheetName || 'All'}].`);

    // إعداد ملف إكسل كنسخة احتياطية
    const outputWorkbook = new ExcelJS.Workbook();
    if (fs.existsSync(OUTPUT_FILE)) {
        try {
            await outputWorkbook.xlsx.readFile(OUTPUT_FILE);
        } catch (e) {
            console.warn('Could not read local final maps excel backup, starting fresh.');
        }
    }

    const finalSheetName = targetSheetName ? `خرائط - ${targetSheetName}`.substring(0, 30) : 'خرائط - نتائج عامة';
    let worksheet = outputWorkbook.getWorksheet(finalSheetName);

    if (!worksheet) {
        worksheet = outputWorkbook.addWorksheet(finalSheetName);
        worksheet.columns = [
            { header: 'اسم المنشأة', key: 'title', width: 25 },
            { header: 'التصنيف', key: 'category', width: 20 },
            { header: 'التقييم', key: 'rating', width: 12 },
            { header: 'عدد المراجعات', key: 'reviewsCount', width: 15 },
            { header: 'العنوان', key: 'address', width: 35 },
            { header: 'الموقع الرسمي', key: 'website', width: 35 },
            { header: 'البريد الإلكتروني', key: 'email', width: 30 },
            { header: 'رقم الهاتف/واتساب', key: 'phone', width: 20 },
            { header: 'إنستقرام', key: 'instagram', width: 20 },
            { header: 'تيك توك', key: 'tiktok', width: 20 },
            { header: 'سناب شات', key: 'snapchat', width: 20 },
            { header: 'رابط خرائط قوقل', key: 'mapsUrl', width: 40 }
        ];
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFDDE6ED' } // لون أزرق كوبالتي هادئ
        };
    }

    // قراءة الخرائط الموجودة حالياً لتجنب التكرار في ملف النتائج النهائية
    const existingMapsUrls = new Set<string>();
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
            const val = row.getCell('mapsUrl').value?.toString();
            if (val) existingMapsUrls.add(val);
        }
    });

    const results = [];

    for (const store of storesToProcess) {
        if (store.store_url && existingMapsUrls.has(store.store_url)) {
            console.log(`⏩ Lead already enriched in Excel: ${store.store_name}`);
            // تحديث حالة الحفظ في Supabase كـ enriched فقط
            await supabase
                .from('leads')
                .update({ is_enriched: true })
                .eq('id', store.id);
            continue;
        }

        console.log(`\n🔎 Enriching: ${store.store_name}...`);
        
        let enrichedInfo: any = {};
        const websiteUrl = store.website || '';
        
        if (websiteUrl && websiteUrl !== 'غير متوفر') {
            console.log(`✅ Crawling website: ${websiteUrl}`);
            try {
                const info = await extractFromHomepage(websiteUrl);
                enrichedInfo = {
                    email: info.email || '',
                    phone: info.phone || info.whatsapp || store.phone || '', // fallback to original phone
                    whatsapp: info.whatsapp || '',
                    instagram: info.instagram || '',
                    tiktok: info.tiktok || '',
                    snapchat: info.snapchat || '',
                    twitter: info.twitter || '',
                    facebook: info.facebook || '',
                    youtube: info.youtube || ''
                };
            } catch (e: any) {
                console.error(`❌ Extraction error for ${store.store_name}:`, e.message);
                enrichedInfo = {
                    email: '',
                    phone: store.phone || '',
                    whatsapp: '',
                    instagram: '',
                    tiktok: '',
                    snapchat: '',
                    twitter: '',
                    facebook: '',
                    youtube: ''
                };
            }
        } else {
            console.log(`⚠️ No website URL available to crawl for ${store.store_name}. Using original phone: ${store.phone}`);
            enrichedInfo = {
                email: '',
                phone: store.phone || '',
                whatsapp: '',
                instagram: '',
                tiktok: '',
                snapchat: '',
                twitter: '',
                facebook: '',
                youtube: ''
            };
        }

        const calculatedRating = calculateRating({
            email: enrichedInfo.email,
            phone: enrichedInfo.phone,
            whatsapp: enrichedInfo.whatsapp,
            instagram: enrichedInfo.instagram,
            tiktok: enrichedInfo.tiktok,
            snapchat: enrichedInfo.snapchat,
            twitter: enrichedInfo.twitter
        });

        const finalDbData = {
            email: enrichedInfo.email || '',
            phone: enrichedInfo.phone || '',
            whatsapp: enrichedInfo.whatsapp || '',
            instagram: enrichedInfo.instagram || '',
            tiktok: enrichedInfo.tiktok || '',
            snapchat: enrichedInfo.snapchat || '',
            twitter: enrichedInfo.twitter || '',
            facebook: enrichedInfo.facebook || '',
            youtube: enrichedInfo.youtube || '',
            rating: calculatedRating,
            is_enriched: true
        };

        // تحديث السجل في Supabase
        const { error: updateError } = await supabase
            .from('leads')
            .update(finalDbData)
            .eq('id', store.id);

        if (updateError) {
            console.error(`❌ Supabase update error for ${store.store_name}:`, updateError);
        } else {
            console.log(`💾 Saved ${store.store_name} to Supabase`);
        }

        const { address, rating, reviewsCount } = parseSubText(store.sub_text || '');

        const excelRow = {
            title: store.store_name,
            category: store.category,
            rating: rating || 0,
            reviewsCount: reviewsCount || 0,
            address: address || '',
            website: websiteUrl || 'غير متوفر',
            domain: websiteUrl || 'غير متوفر', // compatibility key for frontend
            email: enrichedInfo.email || '',
            phone: enrichedInfo.phone || '',
            instagram: enrichedInfo.instagram || '',
            tiktok: enrichedInfo.tiktok || '',
            snapchat: enrichedInfo.snapchat || '',
            mapsUrl: store.mahally_url || store.store_url || ''
        };

        worksheet.addRow(excelRow);
        results.push(excelRow);
        if (store.store_url) existingMapsUrls.add(store.store_url);
        
        // حفظ ملف الإكسل التراكمي
        try {
            await outputWorkbook.xlsx.writeFile(OUTPUT_FILE);
            console.log(`💾 Saved ${store.store_name} to Final Excel [${finalSheetName}]`);
        } catch (excelError: any) {
            console.error('⚠️ Failed to write excel file, possibly locked:', excelError.message);
        }

        // تأخير بسيط لمنع الضغط على خوادم الكشط
        await new Promise(resolve => setTimeout(resolve, 300));
    }

    console.log(`\n🎉 Google Maps Enrichment Complete! Total new entries: ${results.length}`);
    return results;
}
