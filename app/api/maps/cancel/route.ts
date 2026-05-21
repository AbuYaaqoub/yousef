import { NextRequest, NextResponse } from 'next/server';
import { setCancel } from '@/lib/scraper/cancelSignal';

export async function POST(req: NextRequest) {
    const jobId = 'maps-scrape';
    setCancel(jobId);
    console.log('🛑 Cancellation signal sent for Google Maps scraper');
    return NextResponse.json({ success: true, message: 'Stop signal sent' });
}
