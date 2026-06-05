import { NextRequest, NextResponse } from 'next/server';
import * as ExcelJS from 'exceljs';

export async function POST(req: NextRequest) {
    try {
        const { clientName, categories = [] } = await req.json();

        // 1. إنشاء كتاب العمل والورقة
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('تقرير المهام المنجزة');

        // 2. إعداد خصائص ورقة العمل لتكون من اليمين إلى اليسار (عربي)
        worksheet.views = [{ showGridLines: true, rightToLeft: true }];

        // 3. تنسيق العناوين والألوان
        // الهيدر الرئيسي للمستند
        worksheet.mergeCells('A1:G1');
        const headerRow = worksheet.getRow(1);
        headerRow.getCell(1).value = `تقرير خطة عمل وتدقيق السيو - عميل: ${clientName || 'غير محدد'}`;
        headerRow.getCell(1).font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFF' } };
        headerRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
        headerRow.getCell(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '000000' } // لون خلفية أسود فخم
        };
        headerRow.height = 45;

        // صف فرعي للتاريخ والمعادلات
        worksheet.mergeCells('A2:G2');
        const subHeaderRow = worksheet.getRow(2);
        subHeaderRow.getCell(1).value = `تاريخ التصدير: ${new Date().toLocaleDateString('ar-EG')} | تم توليده عبر منصة نقيب لإدارة السيو (SEO CRM Checklist)`;
        subHeaderRow.getCell(1).font = { name: 'Arial', size: 10, italic: true, color: { argb: '555555' } };
        subHeaderRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
        subHeaderRow.getCell(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'F4F4F5' }
        };
        subHeaderRow.height = 25;

        // 4. تعيين أسماء الأعمدة والتنسيقات
        const columns = [
            { header: 'الصفحة المستهدفة', key: 'page', width: 25 },
            { header: 'الكلمة المستهدفة', key: 'keyword', width: 22 },
            { header: 'الدولة والجهاز', key: 'target', width: 18 },
            { header: 'الترتيب (الأولي ➔ الحالي)', key: 'rank', width: 22 },
            { header: 'خطوة العمل وسيو التكتيكي', key: 'task', width: 35 },
            { header: 'حالة المهمة', key: 'status', width: 15 },
            { header: 'معدل الإنجاز التراكمي', key: 'progress', width: 18 }
        ];

        worksheet.getRow(4).values = columns.map(c => c.header);
        worksheet.getRow(4).height = 30;
        
        // تنسيق صف الهيدر للأعمدة
        worksheet.getRow(4).eachCell((cell) => {
            cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFF' } };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: '18181B' } // رمادي داكن فخم جداً
            };
            cell.border = {
                top: { style: 'thin', color: { argb: 'CCCCCC' } },
                bottom: { style: 'medium', color: { argb: '000000' } },
                left: { style: 'thin', color: { argb: 'CCCCCC' } },
                right: { style: 'thin', color: { argb: 'CCCCCC' } }
            };
        });

        // 5. تعبئة البيانات
        let currentRowIndex = 5;

        categories.forEach((cat: any) => {
            const pageName = cat.name;
            const keyword = cat.keyword || 'غير محدد';
            const countryDevice = `${cat.country || 'السعودية'} (${cat.device || 'جوال'})`;
            const ranking = `${cat.initialRank || '--'} ➔ ${cat.currentRank || '--'}`;
            
            // حساب معدل الإنجاز للقسم
            const totalTasks = cat.tasks?.length || 0;
            const completedTasks = cat.tasks?.filter((t: any) => t.completed).length || 0;
            const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            const progressString = `${progressPct}% مكتمل`;

            if (cat.tasks && cat.tasks.length > 0) {
                cat.tasks.forEach((task: any, tIdx: number) => {
                    const row = worksheet.getRow(currentRowIndex);
                    
                    // نضع البيانات في الأعمدة
                    row.getCell(1).value = pageName;
                    row.getCell(2).value = keyword;
                    row.getCell(3).value = countryDevice;
                    row.getCell(4).value = ranking;
                    row.getCell(5).value = task.title;
                    row.getCell(6).value = task.completed ? '🟢 مكتملة' : '🔴 قيد العمل';
                    row.getCell(7).value = progressString;

                    // تنسيقات المحاذاة والحدود للصف
                    row.eachCell((cell, colNumber) => {
                        cell.font = { name: 'Arial', size: 10, bold: colNumber === 1 || colNumber === 6 };
                        cell.alignment = { 
                            vertical: 'middle', 
                            horizontal: colNumber === 5 ? 'right' : 'center',
                            wrapText: colNumber === 5
                        };
                        cell.border = {
                            top: { style: 'thin', color: { argb: 'E4E4E7' } },
                            bottom: { style: 'thin', color: { argb: 'E4E4E7' } },
                            left: { style: 'thin', color: { argb: 'E4E4E7' } },
                            right: { style: 'thin', color: { argb: 'E4E4E7' } }
                        };

                        // تلوين خانة الحالة
                        if (colNumber === 6) {
                            if (task.completed) {
                                cell.fill = {
                                    type: 'pattern',
                                    pattern: 'solid',
                                    fgColor: { argb: 'ECFDF5' } // خلفية خضراء باهتة
                                };
                                cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: '047857' } };
                            } else {
                                cell.fill = {
                                    type: 'pattern',
                                    pattern: 'solid',
                                    fgColor: { argb: 'FEF2F2' } // خلفية حمراء باهتة
                                };
                                cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'B91C1C' } };
                            }
                        }
                    });

                    row.height = 24;
                    currentRowIndex++;
                });

                // دمج خلايا القسم للحقول المشتركة لترتيب بصري فائق النقاء
                const startMerge = currentRowIndex - cat.tasks.length;
                const endMerge = currentRowIndex - 1;

                if (startMerge < endMerge) {
                    worksheet.mergeCells(`A${startMerge}:A${endMerge}`);
                    worksheet.mergeCells(`B${startMerge}:B${endMerge}`);
                    worksheet.mergeCells(`C${startMerge}:C${endMerge}`);
                    worksheet.mergeCells(`D${startMerge}:D${endMerge}`);
                    worksheet.mergeCells(`G${startMerge}:G${endMerge}`);
                }
            } else {
                // قسم بدون مهام
                const row = worksheet.getRow(currentRowIndex);
                row.getCell(1).value = pageName;
                row.getCell(2).value = keyword;
                row.getCell(3).value = countryDevice;
                row.getCell(4).value = ranking;
                row.getCell(5).value = 'لا توجد خطوات عمل مسجلة لهذا القسم.';
                row.getCell(6).value = '--';
                row.getCell(7).value = '0%';
                
                row.eachCell((cell) => {
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };
                    cell.font = { name: 'Arial', size: 10 };
                    cell.border = {
                        top: { style: 'thin', color: { argb: 'E4E4E7' } },
                        bottom: { style: 'thin', color: { argb: 'E4E4E7' } },
                        left: { style: 'thin', color: { argb: 'E4E4E7' } },
                        right: { style: 'thin', color: { argb: 'E4E4E7' } }
                    };
                });
                row.height = 24;
                currentRowIndex++;
            }
        });

        // 6. تعيين اتساع الأعمدة
        worksheet.columns.forEach((col, idx) => {
            col.width = columns[idx].width;
        });

        // 7. تحويل الملف إلى بافر وإرساله
        const buffer = await workbook.xlsx.writeBuffer();

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Disposition': `attachment; filename=seo_checklist_${Date.now()}.xlsx`,
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            }
        });

    } catch (error: any) {
        console.error('Checklist Excel Export API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
