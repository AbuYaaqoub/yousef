import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { fetchGoogleResultCountViaPlaywright } from '@/lib/scraper/googleSearchPlaywright';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { keyword } = body;
        let { allintitle, exact_allintitle } = body;

        if (!keyword || keyword.trim() === '') {
            return NextResponse.json({
                error: "حقل الكلمة المفتاحية (keyword) مطلوب."
            }, { status: 400 });
        }

        const apiKey = process.env.SERPER_API_KEY;

        // حالة 1: إذا لم يتم توفير قيم المنافسة، نقوم بجلبها تلقائياً من جوجل (الوضع التلقائي)
        const isAutoCheck = allintitle === undefined || allintitle === null || allintitle === '' ||
                            exact_allintitle === undefined || exact_allintitle === null || exact_allintitle === '';

        if (isAutoCheck) {
            console.log(`🤖 Detection Bot: Automatically fetching allintitle via Playwright for "${keyword}"`);

            const cleanKeyword = keyword.trim();
            const queryAll = `allintitle:${cleanKeyword}`;
            const queryExact = `allintitle:"${cleanKeyword}"`;

            try {
                // البحث مباشرة في جوجل ومحاكاة الكتابة في مربع البحث وقراءة النتائج
                const totalAll = await fetchGoogleResultCountViaPlaywright(queryAll);
                const totalExact = await fetchGoogleResultCountViaPlaywright(queryExact);

                allintitle = totalAll;
                exact_allintitle = totalExact;

            } catch (err: any) {
                console.error('Failed to fetch via Playwright browser, trying Serper fallback:', err.message);
                
                if (apiKey) {
                    try {
                        console.log('🤖 Detection Bot: Falling back to Serper API...');
                        const [responseAll, responseExact] = await Promise.all([
                            axios.post('https://google.serper.dev/search', { q: queryAll }, {
                                headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
                                timeout: 10000
                            }),
                            axios.post('https://google.serper.dev/search', { q: queryExact }, {
                                headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
                                timeout: 10000
                            })
                        ]);

                        const organicAll = responseAll.data.organic || [];
                        const totalAll = responseAll.data.searchInformation?.totalResults ?? responseAll.data.searchParameters?.totalResults ?? organicAll.length;

                        const organicExact = responseExact.data.organic || [];
                        const totalExact = responseExact.data.searchInformation?.totalResults ?? responseExact.data.searchParameters?.totalResults ?? organicExact.length;

                        allintitle = totalAll;
                        exact_allintitle = totalExact;
                    } catch (serperErr: any) {
                        return NextResponse.json({
                            error: `فشل التحليل: تعذر جلب البيانات تلقائياً أو عبر Serper: ${serperErr.message}`
                        }, { status: 500 });
                    }
                } else {
                    return NextResponse.json({
                        error: `تعذر الاتصال بـ Google للحصول على قيم المنافسة: ${err.message}`
                    }, { status: 500 });
                }
            }
        }

        // تحويل القيم إلى أرقام والتأكد من أنها أرقام صحيحة موجبة
        const allintitleNum = Number(allintitle);
        const exactAllintitleNum = Number(exact_allintitle);

        if (isNaN(allintitleNum) || !Number.isInteger(allintitleNum) || allintitleNum < 0) {
            return NextResponse.json({
                error: "قيمة allintitle يجب أن تكون رقماً صحيحاً وموجباً."
            }, { status: 400 });
        }

        if (isNaN(exactAllintitleNum) || !Number.isInteger(exactAllintitleNum) || exactAllintitleNum < 0) {
            return NextResponse.json({
                error: "قيمة exact_allintitle يجب أن تكون رقماً صحيحاً وموجباً."
            }, { status: 400 });
        }

        // حساب درجة المنافسة وفق القواعد المحددة
        let score = 0;

        // القاعدة 1: إذا كانت قيمة allintitle <= 30 تحصل على 50 نقطة
        if (allintitleNum <= 30) {
            score += 50;
        }

        // القاعدة 2: إذا كانت قيمة allintitle:"keyword" (exact_allintitle) <= 10 تحصل على 50 نقطة
        if (exactAllintitleNum <= 10) {
            score += 50;
        }

        // التصنيف النهائي بناءً على النقاط
        let difficulty: 'Very Easy' | 'Easy' | 'Medium' | 'Hard';
        let recommendation = '';
        let reason = '';

        if (score >= 90) {
            difficulty = 'Very Easy';
            recommendation = "فرصة ممتازة للاستهداف";
            reason = "عدد نتائج allintitle أقل من أو يساوي 30 وعدد نتائج allintitle المطابق أقل من أو يساوي 10، مما يشير إلى منافسة منخفضة جداً.";
        } else if (score >= 70) {
            difficulty = 'Easy';
            recommendation = "فرصة سهلة للاستهداف";
            reason = "مؤشرات المنافسة تظهر مستوى صعوبة سهل ومناسب للاستهداف المباشر.";
        } else if (score >= 40) {
            difficulty = 'Medium';
            recommendation = "فرصة متوسطة الصعوبة";
            if (allintitleNum <= 30) {
                reason = `حجم نتائج allintitle (${allintitleNum}) ممتاز وأقل من 30 (+50 نقطة)، ولكن النتائج المطابقة (${exactAllintitleNum}) تزيد عن 10، مما يجعل الكلمة متوسطة الصعوبة.`;
            } else {
                reason = `حجم النتائج المطابقة exact_allintitle (${exactAllintitleNum}) ممتاز وأقل من 10 (+50 نقطة)، ولكن نتائج allintitle العامة (${allintitleNum}) تزيد عن 30، مما يجعل الكلمة متوسطة الصعوبة.`;
            }
        } else {
            difficulty = 'Hard';
            recommendation = "الكلمة صعبة المنافسة حالياً";
            reason = `كلا المؤشرين تفوقا على الحدود السهلة (allintitle: ${allintitleNum} > 30، exact_allintitle: ${exactAllintitleNum} > 10)، مما يجعل المنافسة قوية (0 نقاط).`;
        }

        let strength_level = '';
        if (score === 100) strength_level = 'فرصة ممتازة (Very Easy)';
        else if (score === 50) strength_level = 'فرصة متوسطة (Medium)';
        else strength_level = 'صعبة المنافسة (Hard)';

        return NextResponse.json({
            keyword: keyword.trim(),
            allintitle: allintitleNum,
            exact_allintitle: exactAllintitleNum,
            score: score,
            difficulty: difficulty,
            keyword_strength: `${score}%`,
            strength_level: strength_level,
            recommendation: recommendation,
            reason: reason
        });

    } catch (error: any) {
        console.error('Detection Bot API Error:', error);
        return NextResponse.json({
            error: error.message || 'حدث خطأ غير متوقع أثناء معالجة البيانات.'
        }, { status: 500 });
    }
}
