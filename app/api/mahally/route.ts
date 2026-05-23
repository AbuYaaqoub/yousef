import { NextRequest, NextResponse } from 'next/server';
import { scrapeMahallyStores } from '@/lib/scraper/mahallyScraper';
import { saveToMahallyExcel } from '@/lib/excel/mahallyExcel';
import { clearCancel } from '@/lib/scraper/cancelSignal';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    const { productName, limit } = await req.json();
    if (!productName) return NextResponse.json({ error: 'Product name is required' }, { status: 400 });

    const maxResults = limit || 50;

    const jobId = 'mahally-scrape';
    clearCancel(jobId); // التأكد من أن الإشارة نظيفة قبل البدء

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            const send = (data: any) => {
                controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'));
            };

            // 1. تسجيل العملية في سجل العمليات بـ Supabase
            let historyId: string | null = null;
            try {
                const { data: historyData, error: historyError } = await supabase
                    .from('scraping_history')
                    .insert({
                        type: 'Mahally',
                        query: productName,
                        results_count: 0,
                        status: 'processing'
                    })
                    .select()
                    .single();
                
                if (historyError) console.error('Supabase history error:', historyError);
                if (historyData) historyId = historyData.id;
            } catch (err) {
                console.error('Failed to create history record:', err);
            }

            try {
                const results = await scrapeMahallyStores(productName, (store) => {
                    send({ type: 'result', store });
                }, maxResults);

                // 2. حفظ في Supabase
                if (results.length > 0) {
                    const leadsToInsert = results.map(item => ({
                        store_name: item.storeName,
                        store_url: item.storeUrl,
                        sub_text: item.subText || '',
                        source: 'mahally',
                        category: productName,
                        rating: '🟡 متوسط',
                        is_enriched: false
                    }));

                    const { error: upsertError } = await supabase
                        .from('leads')
                        .upsert(leadsToInsert, {
                            onConflict: 'store_url,category',
                            ignoreDuplicates: true
                        });

                    if (upsertError) {
                        console.error('❌ Supabase Leads Upsert Error:', upsertError);
                    } else {
                        console.log(`✅ Supabase Leads Updated: Upserted ${results.length} stores to [${productName}]`);
                    }

                    // حفظ احتياطي محلي في الإكسل (مع تفادي الفشل إذا كان الملف مفتوحاً)
                    try {
                        await saveToMahallyExcel(productName, results);
                    } catch (excelErr: any) {
                        console.warn('⚠️ Local Excel ExcelJS EBUSY Lock: ', excelErr.message);
                    }
                }

                // 3. تحديث سجل العمليات كمكتمل
                if (historyId) {
                    await supabase
                        .from('scraping_history')
                        .update({
                            results_count: results.length,
                            status: 'completed'
                        })
                        .eq('id', historyId);
                }

                send({ type: 'done', count: results.length });
                controller.close();
            } catch (error: any) {
                // 4. تحديث سجل العمليات كفاشل
                if (historyId) {
                    await supabase
                        .from('scraping_history')
                        .update({
                            status: 'failed',
                            error_message: error.message
                        })
                        .eq('id', historyId);
                }

                send({ type: 'error', message: error.message });
                controller.close();
            }
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'application/x-ndjson',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
