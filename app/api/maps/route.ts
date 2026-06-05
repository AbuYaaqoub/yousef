import { NextRequest, NextResponse } from 'next/server';
import { scrapeMapsLeads } from '@/lib/scraper/mapsScraper';
import { saveToMapsExcel } from '@/lib/excel/mapsExcel';
import { clearCancel } from '@/lib/scraper/cancelSignal';
import { supabase, autoDetectCategory } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    const { searchQuery, limit, category } = await req.json();
    if (!searchQuery) return NextResponse.json({ error: 'Search query is required' }, { status: 400 });

    const maxResults = limit || 50;
    
    // محاولة تصنيف المتاجر تلقائياً بناءً على الكلمة المفتاحية في حال عدم اختيار تصنيف محدد
    let searchCategory = category && category !== 'عام' ? category : 'عام';
    if (searchCategory === 'عام') {
        searchCategory = await autoDetectCategory(searchQuery, 'عام');
    }
    const jobId = 'maps-scrape';
    clearCancel(jobId);

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
                        type: 'Google Maps',
                        query: searchQuery,
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
                const results = await scrapeMapsLeads(searchQuery, (event) => {
                    send(event);
                }, maxResults);

                // 2. حفظ في Supabase
                if (results.length > 0) {
                    const leadsToInsert = results.map(item => ({
                        store_name: item.title,
                        store_url: item.website || item.mapsUrl || '',
                        sub_text: `العنوان: ${item.address || ''} | التقييم: ${item.rating || 0} (${item.reviewsCount || 0} مراجعة)`,
                        source: 'maps',
                        category: searchCategory,
                        rating: '🟡 متوسط',
                        is_enriched: false,
                        phone: item.phone || '',
                        website: item.website || '',
                        mahally_url: item.mapsUrl || ''
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
                        console.log(`✅ Supabase Leads Updated: Upserted ${results.length} stores to [${searchCategory}]`);
                    }

                    // حفظ احتياطي محلي في الإكسل الخاص بخرائط قوقل في النهاية
                    try {
                        await saveToMapsExcel(searchCategory, results);
                    } catch (excelErr: any) {
                        console.warn('⚠️ Local Excel EBUSY Lock: ', excelErr.message);
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
