import { NextRequest, NextResponse } from 'next/server';
import { setCancel } from '@/lib/scraper/cancelSignal';

export async function POST(req: NextRequest) {
    const jobId = 'mahally-scrape';
    setCancel(jobId);
    console.log('🛑 Cancellation signal sent for Mahally');
    return NextResponse.json({ success: true, message: 'Stop signal sent' });
}
