import * as ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';

const EXCEL_FILE_PATH = path.join(process.cwd(), 'Google_Maps_Leads.xlsx');

export async function saveToMapsExcel(searchQuery: string, data: any[]) {
    let workbook = new ExcelJS.Workbook();
    
    // 1. تحميل الملف إذا كان موجوداً، أو إنشاء واحد جديد
    if (fs.existsSync(EXCEL_FILE_PATH)) {
        await workbook.xlsx.readFile(EXCEL_FILE_PATH);
    }

    // 2. التحقق من وجود ورقة العمل أو إنشاؤها
    // أسماء الأوراق لا يجب أن تتجاوز 31 حرفاً ولا تحتوي على رموز خاصة
    const sheetName = searchQuery.substring(0, 30).replace(/[:\\\?\*\[\]\/]/g, '_');
    let worksheet = workbook.getWorksheet(sheetName);

    if (!worksheet) {
        worksheet = workbook.addWorksheet(sheetName);
    }

    // إعادة تعريف الأعمدة لضمان عمل الـ Mapping
    worksheet.columns = [
        { header: 'اسم المنشأة', key: 'title', width: 30 },
        { header: 'رابط قوقل ماب', key: 'mapsUrl', width: 45 },
        { header: 'التقييم', key: 'rating', width: 12 },
        { header: 'عدد المراجعات', key: 'reviewsCount', width: 15 },
        { header: 'التصنيف', key: 'category', width: 25 },
        { header: 'العنوان', key: 'address', width: 45 },
        { header: 'الهاتف', key: 'phone', width: 20 },
        { header: 'الموقع الإلكتروني', key: 'website', width: 35 },
        { header: 'تاريخ الاستخراج', key: 'date', width: 20 }
    ];
    
    // تنسيق العناوين (فقط إذا كانت الورقة جديدة)
    const firstRow = worksheet.getRow(1);
    if (!firstRow.values || (firstRow.values as any[]).length === 0) {
        firstRow.font = { bold: true };
        firstRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFDDE6ED' } // لون أزرق كوبالتي هادئ
        };
    }

    // 3. منع التكرار (استخراج الروابط الموجودة حالياً في الورقة)
    const existingUrls = new Set<string>();
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) { // تخطي العنوان
            const cellValue = row.getCell('mapsUrl').value;
            if (cellValue) existingUrls.add(cellValue.toString());
        }
    });

    // 4. إضافة البيانات الجديدة غير المتكررة
    let addedCount = 0;
    data.forEach(item => {
        if (!existingUrls.has(item.mapsUrl)) {
            worksheet.addRow({
                title: item.title,
                mapsUrl: item.mapsUrl,
                rating: item.rating || 0,
                reviewsCount: item.reviewsCount || 0,
                category: item.category || '',
                address: item.address || '',
                phone: item.phone || '',
                website: item.website || '',
                date: new Date().toLocaleDateString('ar-SA')
            });
            existingUrls.add(item.mapsUrl);
            addedCount++;
        }
    });

    // 5. حفظ الملف
    try {
        await workbook.xlsx.writeFile(EXCEL_FILE_PATH);
        console.log(`✅ Excel Updated: Added ${addedCount} new leads to Maps sheet [${sheetName}]`);
    } catch (err: any) {
        if (err.code === 'EBUSY') {
            console.error('❌ Error: The Excel file is currently open. Please close "Google_Maps_Leads.xlsx" and try again.');
            throw new Error('الملف مفتوح حالياً في برنامج آخر، يرجى إغلاقه والمحاولة مجدداً.');
        }
        throw err;
    }
    
    return addedCount;
}

export async function mergeMapsSheets(sourceSheetNames: string[], targetSheetName: string) {
    if (!fs.existsSync(EXCEL_FILE_PATH)) {
        throw new Error('ملف بيانات خرائط قوقل غير موجود بعد.');
    }

    let workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(EXCEL_FILE_PATH);

    // 1. التحقق من وجود الأوراق المصدر
    const validSheets = sourceSheetNames.filter(name => workbook.getWorksheet(name));
    if (validSheets.length === 0) {
        throw new Error('لم يتم العثور على أي من الأوراق المختارة.');
    }

    // 2. إنشاء الورقة الجديدة (أو تنظيفها إذا كانت موجودة)
    const safeTargetName = targetSheetName.substring(0, 30).replace(/[:\\\?\*\[\]\/]/g, '_');
    let targetWorksheet = workbook.getWorksheet(safeTargetName);
    if (targetWorksheet) {
        workbook.removeWorksheet(targetWorksheet.id);
    }
    targetWorksheet = workbook.addWorksheet(safeTargetName);

    // تعريف الأعمدة
    targetWorksheet.columns = [
        { header: 'اسم المنشأة', key: 'title', width: 30 },
        { header: 'رابط قوقل ماب', key: 'mapsUrl', width: 45 },
        { header: 'التقييم', key: 'rating', width: 12 },
        { header: 'عدد المراجعات', key: 'reviewsCount', width: 15 },
        { header: 'التصنيف', key: 'category', width: 25 },
        { header: 'العنوان', key: 'address', width: 45 },
        { header: 'الهاتف', key: 'phone', width: 20 },
        { header: 'الموقع الإلكتروني', key: 'website', width: 35 },
        { header: 'تاريخ الاستخراج', key: 'date', width: 20 }
    ];

    targetWorksheet.getRow(1).font = { bold: true };
    targetWorksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFDDE6ED' }
    };

    // 3. جمع البيانات ومنع التكرار
    const uniqueLeads = new Map<string, any>();

    for (const sheetName of validSheets) {
        const worksheet = workbook.getWorksheet(sheetName);
        if (!worksheet) continue;

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) { // تخطي العنوان
                const title = row.getCell(1).value?.toString() || '';
                const mapsUrl = row.getCell(2).value?.toString() || '';
                const rating = row.getCell(3).value || 0;
                const reviewsCount = row.getCell(4).value || 0;
                const category = row.getCell(5).value?.toString() || '';
                const address = row.getCell(6).value?.toString() || '';
                const phone = row.getCell(7).value?.toString() || '';
                const website = row.getCell(8).value?.toString() || '';
                const date = row.getCell(9).value?.toString() || '';

                if (mapsUrl && !uniqueLeads.has(mapsUrl)) {
                    uniqueLeads.set(mapsUrl, {
                        title,
                        mapsUrl,
                        rating,
                        reviewsCount,
                        category,
                        address,
                        phone,
                        website,
                        date
                    });
                }
            }
        });
    }

    // 4. إضافة البيانات المصفاة للورقة الجديدة
    uniqueLeads.forEach(lead => {
        targetWorksheet!.addRow(lead);
    });

    // 5. حفظ الملف
    try {
        await workbook.xlsx.writeFile(EXCEL_FILE_PATH);
        return {
            success: true,
            count: uniqueLeads.size,
            message: `تم دمج ${validSheets.length} أوراق وإضافة ${uniqueLeads.size} منشأة فريدة في الورقة "${safeTargetName}"`
        };
    } catch (err: any) {
        if (err.code === 'EBUSY') {
            throw new Error('الملف مفتوح حالياً في برنامج آخر، يرجى إغلاقه والمحاولة مجدداً.');
        }
        throw err;
    }
}
