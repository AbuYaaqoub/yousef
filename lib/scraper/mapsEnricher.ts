import * as ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import { extractFromHomepage } from './extractStoreInfo';

const INPUT_FILE = path.join(process.cwd(), 'Google_Maps_Leads.xlsx');
const OUTPUT_FILE = path.join(process.cwd(), 'Final_Maps_Data.xlsx');

export async function enrichMapsData(targetSheetName?: string) {
    console.log(`📂 Checking for Google Maps input file at: ${INPUT_FILE}`);
    
    if (!fs.existsSync(INPUT_FILE)) {
        console.error('❌ Google Maps Input file not found!');
        throw new Error(`لم يتم العثور على ملف Google_Maps_Leads.xlsx في ${INPUT_FILE}`);
    }

    const inputWorkbook = new ExcelJS.Workbook();
    await inputWorkbook.xlsx.readFile(INPUT_FILE);
    
    const outputWorkbook = new ExcelJS.Workbook();
    if (fs.existsSync(OUTPUT_FILE)) {
        await outputWorkbook.xlsx.readFile(OUTPUT_FILE);
    }

    // اسم ورقة العمل النهائية
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

    const leadsToProcess: any[] = [];
    inputWorkbook.eachSheet(sheet => {
        if (!targetSheetName || sheet.name === targetSheetName) {
            sheet.eachRow((row, rowNumber) => {
                if (rowNumber > 1) {
                    const title = row.getCell(1).value?.toString();
                    const mapsUrl = row.getCell(2).value?.toString();
                    const rating = row.getCell(3).value || 0;
                    const reviewsCount = row.getCell(4).value || 0;
                    const category = row.getCell(5).value?.toString();
                    const address = row.getCell(6).value?.toString();
                    const phone = row.getCell(7).value?.toString();
                    const website = row.getCell(8).value?.toString();

                    if (title) {
                        leadsToProcess.push({
                            title,
                            mapsUrl,
                            rating,
                            reviewsCount,
                            category: category || '',
                            address: address || '',
                            phone: phone || '',
                            website: website || ''
                        });
                    }
                }
            });
        }
    });

    console.log(`📝 Found ${leadsToProcess.length} Google Maps leads to process for sheet [${finalSheetName}].`);

    // قراءة الروابط أو الخرائط الموجودة حالياً لتجنب التكرار في ملف النتائج النهائية
    const existingMapsUrls = new Set<string>();
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
            const val = row.getCell('mapsUrl').value?.toString();
            if (val) existingMapsUrls.add(val);
        }
    });

    const results = [];

    for (const lead of leadsToProcess) {
        if (existingMapsUrls.has(lead.mapsUrl)) {
            console.log(`⏩ Lead already enriched: ${lead.title}`);
            continue;
        }

        console.log(`\n🔎 Enriching: ${lead.title}...`);
        
        let enrichedInfo: any = {};
        
        if (lead.website) {
            console.log(`✅ Crawling website: ${lead.website}`);
            try {
                const info = await extractFromHomepage(lead.website);
                enrichedInfo = {
                    email: info.email || '',
                    phone: info.phone || info.whatsapp || lead.phone || '', // fallback to original phone
                    instagram: info.instagram || '',
                    tiktok: info.tiktok || '',
                    snapchat: info.snapchat || ''
                };
            } catch (e: any) {
                console.error(`❌ Extraction error for ${lead.title}:`, e.message);
                // Fallback to original phone if extraction fails
                enrichedInfo = {
                    email: '',
                    phone: lead.phone || '',
                    instagram: '',
                    tiktok: '',
                    snapchat: ''
                };
            }
        } else {
            console.log(`⚠️ No website URL available to crawl for ${lead.title}. Using GMap phone: ${lead.phone}`);
            enrichedInfo = {
                email: '',
                phone: lead.phone || '',
                instagram: '',
                tiktok: '',
                snapchat: ''
            };
        }

        const finalData = {
            title: lead.title,
            category: lead.category,
            rating: lead.rating,
            reviewsCount: lead.reviewsCount,
            address: lead.address,
            website: lead.website || 'غير متوفر',
            email: enrichedInfo.email || '',
            phone: enrichedInfo.phone || '',
            instagram: enrichedInfo.instagram || '',
            tiktok: enrichedInfo.tiktok || '',
            snapchat: enrichedInfo.snapchat || '',
            mapsUrl: lead.mapsUrl
        };

        worksheet.addRow(finalData);
        results.push(finalData);
        existingMapsUrls.add(lead.mapsUrl);
        
        // حفظ ملف الإكسل التراكمي
        try {
            await outputWorkbook.xlsx.writeFile(OUTPUT_FILE);
            console.log(`💾 Saved ${lead.title} to Final Excel [${finalSheetName}]`);
        } catch (excelError: any) {
            console.error('⚠️ Failed to write excel file, possibly locked:', excelError.message);
        }

        // تأخير بسيط لمنع الضغط على خوادم الكشط
        await new Promise(resolve => setTimeout(resolve, 300));
    }

    console.log(`\n🎉 Google Maps Enrichment Complete! Total new entries: ${results.length}`);
    return results;
}
