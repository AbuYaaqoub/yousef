import { NextRequest, NextResponse } from 'next/server';
import { scrapeMazeedStores } from '@/lib/scraper/mazeedScraper';
import { saveToMazeedExcel } from '@/lib/excel/mazeedExcel';
import { clearCancel } from '@/lib/scraper/cancelSignal';

export async function POST(req: NextRequest) {
    const { productName, limit } = await req.json();
    if (!productName) return NextResponse.json({ error: 'Product name is required' }, { status: 400 });

    const maxResults = limit || 50;
    const jobId = 'mazeed-scrape';
    clearCancel(jobId);

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            const send = (data: any) => {
                controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'));
            };

            try {
                const results = await scrapeMazeedStores(productName, (event) => {
                    send(event);
                }, maxResults);

                // حفظ النتائج في الإكسل الخاص بمزيد في النهاية
                if (results.length > 0) {
                    await saveToMazeedExcel(productName, results);
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
