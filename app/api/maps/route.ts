import { NextRequest, NextResponse } from 'next/server';
import { scrapeMapsLeads } from '@/lib/scraper/mapsScraper';
import { saveToMapsExcel } from '@/lib/excel/mapsExcel';
import { clearCancel } from '@/lib/scraper/cancelSignal';

export async function POST(req: NextRequest) {
    const { searchQuery, limit } = await req.json();
    if (!searchQuery) return NextResponse.json({ error: 'Search query is required' }, { status: 400 });

    const maxResults = limit || 50;
    const jobId = 'maps-scrape';
    clearCancel(jobId);

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            const send = (data: any) => {
                controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'));
            };

            try {
                const results = await scrapeMapsLeads(searchQuery, (event) => {
                    send(event);
                }, maxResults);

                // حفظ النتائج في الإكسل الخاص بخرائط قوقل في النهاية
                if (results.length > 0) {
                    await saveToMapsExcel(searchQuery, results);
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
