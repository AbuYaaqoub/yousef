import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// دالة لتنظيف النطاق (Domain) وإزالة البروتوكولات والمسارات الفرعية
function getCleanDomain(url: string): string {
    if (!url) return '';
    let clean = url.trim().toLowerCase();
    clean = clean.replace(/^(https?:\/\/)?(www\.)?/, '');
    return clean.split('/')[0];
}

export async function POST(req: NextRequest) {
    const apiKey = process.env.SERPER_API_KEY;

    if (!apiKey) {
        return NextResponse.json({ 
            success: false, 
            error: '⚠️ مفتاح Serper.dev API غير متوفر في ملف البيئة .env الخاص بك. يرجى إضافته أولاً لتشغيل أداة التتبع.' 
        }, { status: 400 });
    }

    try {
        const { website, keywords = [] } = await req.json();

        if (!website) {
            return NextResponse.json({ 
                success: false, 
                error: 'يرجى تقديم رابط الموقع الرسمي للعميل.' 
            }, { status: 400 });
        }

        const clientDomain = getCleanDomain(website);
        if (!clientDomain) {
            return NextResponse.json({ 
                success: false, 
                error: 'رابط الموقع المدخل غير صالح.' 
            }, { status: 400 });
        }

        console.log(`🔍 Starting Google Search SEO Crawl for domain: [${clientDomain}]`);

        // ==========================================
        // 1. فحص الفهرسة والأرشفة الفعلي (site: Search)
        // ==========================================
        let indexStats = {
            total: 0,
            pages: [] as Array<{ title: string; link: string; snippet: string }>
        };

        try {
            const siteQuery = `site:${clientDomain}`;
            const indexResponse = await axios.post('https://google.serper.dev/search', {
                q: siteQuery,
                num: 10
            }, {
                headers: {
                    'X-API-KEY': apiKey,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });

            const organic = indexResponse.data.organic || [];
            // في Serper، يمثل totalResults العدد التقريبي للصفحات المفرسة
            const totalResults = indexResponse.data.searchInformation?.totalResults ?? indexResponse.data.searchParameters?.totalResults ?? organic.length;

            indexStats = {
                total: totalResults,
                pages: organic.map((item: any) => ({
                    title: item.title || '',
                    link: item.link || '',
                    snippet: item.snippet || ''
                }))
            };
        } catch (err: any) {
            console.error('Failed to fetch google index stats:', err.message);
        }

        // ==========================================
        // 2. تتبع ترتيب الكلمات المفتاحية النشطة (Rank Tracking)
        // ==========================================
        const rankings = [];

        // نقوم بالبحث عن أول 20 نتيجة لكل كلمة
        // استخدام Promise.all لتشغيل الاستعلامات بالتوازي وسرعة استجابة فائقة
        const rankPromises = keywords.map(async (keywordItem: { id: string; keyword: string }) => {
            const kw = keywordItem.keyword;
            try {
                const searchResponse = await axios.post('https://google.serper.dev/search', {
                    q: kw,
                    num: 20 // البحث في أول صفحتين (20 نتيجة)
                }, {
                    headers: {
                        'X-API-KEY': apiKey,
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000
                });

                const organicResults = searchResponse.data.organic || [];
                let rank = -1;
                let rankingLink = '';
                let rankingTitle = '';

                // البحث عن النطاق الخاص بالعميل في النتائج
                for (let idx = 0; idx < organicResults.length; idx++) {
                    const item = organicResults[idx];
                    const itemDomain = getCleanDomain(item.link || '');
                    
                    if (itemDomain.includes(clientDomain) || clientDomain.includes(itemDomain)) {
                        rank = idx + 1;
                        rankingLink = item.link || '';
                        rankingTitle = item.title || '';
                        break;
                    }
                }

                return {
                    id: keywordItem.id,
                    keyword: kw,
                    rank: rank, // -1 يعني خارج أول 20 نتيجة
                    link: rankingLink,
                    title: rankingTitle
                };
            } catch (err: any) {
                console.error(`Failed to track rank for keyword [${kw}]:`, err.message);
                return {
                    id: keywordItem.id,
                    keyword: kw,
                    rank: -2, // -2 يعني حدوث خطأ أثناء الفحص
                    link: '',
                    title: ''
                };
            }
        });

        const trackedRankings = await Promise.all(rankPromises);

        return NextResponse.json({
            success: true,
            indexStats,
            rankings: trackedRankings
        });

    } catch (error: any) {
        console.error('Google SEO Scrape API Error:', error);
        return NextResponse.json({ 
            success: false, 
            error: error.message || 'حدث خطأ غير متوقع أثناء معالجة البيانات.' 
        }, { status: 500 });
    }
}
