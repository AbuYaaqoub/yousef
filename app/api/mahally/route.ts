import { NextRequest, NextResponse } from 'next/server';
import { scrapeMahallyStores } from '@/lib/scraper/mahallyScraper';
import { saveToMahallyExcel } from '@/lib/excel/mahallyExcel';
import { clearCancel } from '@/lib/scraper/cancelSignal';

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

            try {
                const results = await scrapeMahallyStores(productName, (store) => {
                    send({ type: 'result', store });
                }, maxResults);

                // حفظ في الإكسل في النهاية
                if (results.length > 0) {
                    await saveToMahallyExcel(productName, results);
                }

                send({ type: 'done', count: results.length });
                controller.close();
            } catch (error: any) {
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
