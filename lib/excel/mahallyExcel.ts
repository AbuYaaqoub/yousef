import * as ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';

const EXCEL_FILE_PATH = path.join(process.cwd(), 'Mahally_Leads.xlsx');

export async function saveToMahallyExcel(productName: string, data: any[]) {
    let workbook = new ExcelJS.Workbook();
    
    // 1. تحميل الملف إذا كان موجوداً، أو إنشاء واحد جديد
    if (fs.existsSync(EXCEL_FILE_PATH)) {
        await workbook.xlsx.readFile(EXCEL_FILE_PATH);
    }

    // 2. التحقق من وجود ورقة العمل أو إنشاؤها
    // ملاحظة: أسماء الأوراق لا يجب أن تتجاوز 31 حرفاً ولا تحتوي على رموز خاصة
    const sheetName = productName.substring(0, 30).replace(/[:\\\?\*\[\]\/]/g, '_');
    let worksheet = workbook.getWorksheet(sheetName);

    if (!worksheet) {
        worksheet = workbook.addWorksheet(sheetName);
    }

    // إعادة تعريف الأعمدة لضمان عمل الموظف (Mapping) حتى لو كان الملف موجوداً مسبقاً
    worksheet.columns = [
        { header: 'اسم المتجر', key: 'storeName', width: 30 },
        { header: 'رابط المتجر', key: 'storeUrl', width: 40 },
        { header: 'معلومات إضافية', key: 'subText', width: 50 },
        { header: 'تاريخ الاستخراج', key: 'date', width: 20 }
    ];
    
    // تنسيق العناوين (فقط إذا كانت الورقة جديدة)
    const firstRow = worksheet.getRow(1);
    if (!firstRow.values || (firstRow.values as any[]).length === 0) {
        firstRow.font = { bold: true };
        firstRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };
    }

    // 3. منع التكرار (استخراج الروابط الموجودة حالياً في الورقة)
    const existingUrls = new Set<string>();
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) { // تخطي العنوان
            const cellValue = row.getCell('storeUrl').value;
            if (cellValue) existingUrls.add(cellValue.toString());
        }
    });

    // 4. إضافة البيانات الجديدة غير المتكررة
    let addedCount = 0;
    data.forEach(item => {
        if (!existingUrls.has(item.storeUrl)) {
            worksheet.addRow({
                storeName: item.storeName,
                storeUrl: item.storeUrl,
                subText: item.subText,
                date: new Date().toLocaleDateString('ar-SA')
            });
            existingUrls.add(item.storeUrl);
            addedCount++;
        }
    });

    // 5. حفظ الملف
    try {
        await workbook.xlsx.writeFile(EXCEL_FILE_PATH);
        console.log(`✅ Excel Updated: Added ${addedCount} new stores to sheet [${sheetName}]`);
    } catch (err: any) {
        if (err.code === 'EBUSY') {
            console.error('❌ Error: The Excel file is currently open. Please close "Mahally_Leads.xlsx" and try again.');
            throw new Error('الملف مفتوح حالياً في برنامج آخر، يرجى إغلاقه والمحاولة مجدداً.');
        }
        throw err;
    }
    
    return addedCount;
}

export async function mergeMahallySheets(sourceSheetNames: string[], targetSheetName: string) {
    if (!fs.existsSync(EXCEL_FILE_PATH)) {
        throw new Error('ملف البيانات غير موجود.');
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
        { header: 'اسم المتجر', key: 'storeName', width: 30 },
        { header: 'رابط المتجر', key: 'storeUrl', width: 40 },
        { header: 'معلومات إضافية', key: 'subText', width: 50 },
        { header: 'تاريخ الاستخراج', key: 'date', width: 20 }
    ];

    targetWorksheet.getRow(1).font = { bold: true };
    targetWorksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
    };

    // 3. جمع البيانات ومنع التكرار
    const uniqueStores = new Map<string, any>();

    for (const sheetName of validSheets) {
        const worksheet = workbook.getWorksheet(sheetName);
        if (!worksheet) continue;

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) { // تخطي العنوان
                const storeName = row.getCell(1).value?.toString() || '';
                const storeUrl = row.getCell(2).value?.toString() || '';
                const subText = row.getCell(3).value?.toString() || '';
                const date = row.getCell(4).value?.toString() || '';

                if (storeUrl && !uniqueStores.has(storeUrl)) {
                    uniqueStores.set(storeUrl, {
                        storeName,
                        storeUrl,
                        subText,
                        date
                    });
                }
            }
        });
    }

    // 4. إضافة البيانات المصفاة للورقة الجديدة
    uniqueStores.forEach(store => {
        targetWorksheet!.addRow(store);
    });

    // 5. حفظ الملف
    try {
        await workbook.xlsx.writeFile(EXCEL_FILE_PATH);
        return {
            success: true,
            count: uniqueStores.size,
            message: `تم دمج ${validSheets.length} أوراق وإضافة ${uniqueStores.size} متجر فريد إلى الورقة "${safeTargetName}"`
        };
    } catch (err: any) {
        if (err.code === 'EBUSY') {
            throw new Error('الملف مفتوح حالياً في برنامج آخر، يرجى إغلاقه والمحاولة مجدداً.');
        }
        throw err;
    }
}
