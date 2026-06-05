import { NextRequest, NextResponse } from 'next/server';
import { setCancel } from '@/lib/scraper/cancelSignal';

export async function POST(req: NextRequest) {
    const jobId = 'mazeed-scrape';
    setCancel(jobId);
    console.log('🛑 Cancellation signal sent for Mazeed scraper');
    return NextResponse.json({ success: true, message: 'Stop signal sent' });
}
