import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// تنظيف استجابة JSON من علامات الاقتباس البرمجية الخاصة بالـ Markdown
function parseGeminiJsonResponse(rawText: string) {
    let text = rawText.trim();
    
    // إزالة البادئة واللاحقة الخاصة بالكود إن وُجدت
    if (text.startsWith('```')) {
        text = text.replace(/^```(?:json)?\n?/i, '');
        text = text.replace(/\n?```$/i, '');
    }
    
    try {
        return JSON.parse(text.trim());
    } catch (e: any) {
        console.error("Failed to parse Gemini response as JSON:", e.message);
        console.log("Raw response was:", rawText);
        throw new Error("فشل في قراءة مخرجات الذكاء الاصطناعي كبنية JSON صالحة. يرجى المحاولة مرة أخرى.");
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { keyword, contentType, lsiKeywords, customApiKey } = body;

        if (!keyword || keyword.trim() === '') {
            return NextResponse.json({
                error: "حقل الكلمة المفتاحية (keyword) مطلوب."
            }, { status: 400 });
        }

        // تحديد مفتاح الـ API: إما المرسل من العميل أو الموجود في البيئة
        const apiKey = customApiKey || process.env.GEMINI_API_KEY;

        if (!apiKey || apiKey.trim() === '') {
            return NextResponse.json({
                error: "⚠️ يرجى إدخال مفتاح Gemini API Key في الحقل المخصص أولاً للبدء."
            }, { status: 400 });
        }

        const cleanKeyword = keyword.trim();
        const cleanContentType = contentType || 'مقال مدونة (Blog Post)';
        const cleanLsi = lsiKeywords ? lsiKeywords.trim() : 'غير محددة';

        console.log(`📝 Editor Bot: Starting content automation for keyword: "${cleanKeyword}" | Type: "${cleanContentType}"`);

        // صياغة أمر Prompt متكامل ودقيق لتغطية القواعد الـ 8 للمحتوى
        const systemPrompt = `أنت خبير SEO محترف وكاتب محتوى مبدع ومحترف باللغة العربية. مهمتك هي كتابة محتوى مذهل ومحسن لمحركات البحث (SEO Optimized Content) للكلمة المفتاحية المستهدفة: "${cleanKeyword}".
نوع الصفحة/المحتوى المطلوب كتابته: "${cleanContentType}".
الكلمات الدلالية المترادفة (LSI) المطلوب دمجها في المحتوى: "${cleanLsi}".

يجب أن تلتزم تماماً بالقواعد الثمانية التالية في صياغة المحتوى:
1. إعداد وتصميم خطة المحتوى بناءً على نية الباحث: تنظيم المحتوى ليغطي مقالات المدونة التثقيفية، وصفحات الخدمات التجارية، وصفحات المنتجات التحويلية حسب الحاجة.
2. صياغة مقدمة مقال تفصيلية وجذابة (تتراوح بين 70 و100 كلمة): كتابة مقدمة قوية ومثيرة، وتضمين الكلمة المفتاحية الأساسية "${cleanKeyword}" في أول 150 حرفاً لسرعة فهم بوتات جوجل.
3. تقسيم المحتوى إلى فقرات قصيرة جداً ومريحة للقراءة: جعل الفقرات لا تتجاوز 150 كلمة كحد أقصى، واستخدام القوائم المنقطة والجداول التوضيحية لرفع تجربة القراءة وتقليل الارتداد.
4. توزيع الكلمات الدلالية ومرادفات البحث (LSI): دمج الكلمات المترادفة والأسئلة الشائعة في العناوين والفقرات بطريقة طبيعية تناسب خوارزميات الفهم الدلالي وجوجل RankBrain.
5. صياغة صفحات خدمات وموقع متكاملة ومحسنة: صياغة صفحات الخدمات وتوزيع العناوين والروابط بداخلها بشكل احترافي، وتهيئة نبرة الموثوقية والأمان للمتجر أو الموقع.
6. هيكلة صفحات المنتجات التجارية بعناية فائقة (إذا كان نوع الصفحة صفحة منتج): كتابة نصوص المنتجات متضمنة الاسم، الوصف الكامل، الميزات، المواصفات الفنية، التقييمات، الضمان، والدعوة الصريحة لاتخاذ إجراء (CTA).
7. صياغة قسم أسئلة شائعة (FAQ) تفصيلي لكل صفحة: استخراج التساؤلات وإجابتها بدقة متناهية، وتوليد كود الـ FAQ Schema بتنسيق JSON-LD لتسهيل ظهورها كـ Rich Snippets في نتائج البحث.
8. تحقيق التفرد التام والابتعاد عن النسخ أو نصوص الذكاء الاصطناعي الركيكة: صياغة محتوى حصري يبدو بشرياً وبليغاً وسلساً بنسبة 100%.

يجب أن ترجع النتيجة ككائن JSON صالح تماماً مطابق للهيكل التالي (ولا تضف أي نصوص خارج هيكل الـ JSON):
{
  "contentPlan": "خطة وتصميم هيكل المحتوى وتحديد نية الباحث واستراتيجية الاستهداف...",
  "introduction": "نص المقدمة الشامل والجذاب (70-100 كلمة، ويحتوي على الكلمة المفتاحية في أول 150 حرفاً بشكل طبيعي)...",
  "body": [
    {
      "title": "عنوان القسم الأول (H2 أو H3)",
      "content": "محتوى القسم الأول بالكامل بتنسيق Markdown. يجب أن يحتوي على فقرات قصيرة (أقل من 150 كلمة للفقرة)، وقائمة منقطة أو جدول للمقارنة لتسهيل القراءة وتوضيح المعلومات الفنية."
    },
    {
      "title": "عنوان القسم الثاني (H2 أو H3)",
      "content": "محتوى القسم الثاني بتنسيق Markdown مع دمج كلمات الـ LSI المحددة..."
    }
  ],
  "faq": [
    {
      "question": "السؤال الأول حول الموضوع؟",
      "answer": "إجابة دقيقة ومباشرة للسؤال..."
    },
    {
      "question": "السؤال الثاني؟",
      "answer": "إجابة السؤال الثاني..."
    }
  ],
  "faqSchema": "كود الـ JSON-LD الخاص بـ FAQPage Schema بالكامل كـ string صالح، بدون وضعه داخل وسم <script> وبدون أي تعليقات برمجية.",
  "checklist": [
    { "ruleId": 1, "ruleName": "نية البحث وتصميم الخطة", "passed": true, "details": "تم تحديد نية البحث وتصميم هيكل متوافق مع نوع المحتوى المختار." },
    { "ruleId": 2, "ruleName": "صياغة مقدمة جذابة (70-100 كلمة)", "passed": true, "details": "تمت صياغة مقدمة بطول كذا كلمة وتضمين الكلمة المفتاحية في البداية." },
    { "ruleId": 3, "ruleName": "فقرات قصيرة وجداول/قوائم", "passed": true, "details": "تم تقسيم المحتوى لفقرات قصيرة وإدراج قوائم وجداول توضيحية." },
    { "ruleId": 4, "ruleName": "دمج كلمات الـ LSI والترادفات", "passed": true, "details": "تم توزيع كلمات الـ LSI والأسئلة الشائعة في ثنايا النصوص." },
    { "ruleId": 5, "ruleName": "تهيئة صفحات الخدمات والموقع", "passed": true, "details": "تم استخدام نبرة احترافية تعزز ثقة العميل وتوضح قيمة الخدمات." },
    { "ruleId": 6, "ruleName": "هيكلة صفحات المنتجات التجارية", "passed": true, "details": "تم تضمين الميزات والمواصفات والضمان ودعوة الإجراء بشكل منظم." },
    { "ruleId": 7, "ruleName": "قسم الأسئلة الشائعة والـ Schema", "passed": true, "details": "تم توليد أسئلة شائعة مخصصة مع كود المخطط البنيوي JSON-LD." },
    { "ruleId": 8, "ruleName": "التفرد وجودة الصياغة البشرية", "passed": true, "details": "تم تنقيح النصوص وضمان صياغة بشرية بليغة وحصرية 100%." }
  ],
  "uniquenessReview": "تقرير موجز يؤكد مراجعة النصوص وضمان جودتها وخلوها من الركاكة."
}`;

        const payload = {
            contents: [
                {
                    parts: [
                        { text: systemPrompt }
                    ]
                }
            ],
            generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.7
            }
        };

        const modelsToTry = [
            'gemini-2.5-flash',
            'gemini-2.0-flash',
            'gemini-flash-latest',
            'gemini-3.5-flash'
        ];

        let response: any = null;
        let lastError: any = null;

        for (const model of modelsToTry) {
            try {
                console.log(`🤖 Editor Bot: Trying model "${model}"...`);
                const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
                
                response = await axios.post(geminiUrl, payload, {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 60000 // مهلة دقيقة كاملة
                });
                
                console.log(`✅ Editor Bot: Successfully generated content using "${model}"`);
                break; // نجحت العملية، نخرج من الحلقة
            } catch (err: any) {
                lastError = err;
                const status = err.response?.status;
                const message = err.response?.data?.error?.message || err.message;
                console.warn(`⚠️ Editor Bot: Model "${model}" failed with status ${status}: ${message}`);
                
                // إذا كان الخطأ 400 بسبب مشكلة في الطلب نفسه (وليس عدم العثور على النموذج)، فلا داعي للتكرار
                if (status === 400 && !message.includes('not found') && !message.includes('not supported')) {
                    throw err;
                }
                // في حال أي خطأ آخر (مثل 503 أو 429 أو 404)، ننتقل للنموذج التالي
                continue;
            }
        }

        if (!response) {
            throw lastError || new Error("فشلت جميع محاولات الاتصال بنماذج Gemini المتاحة.");
        }

        const candidates = response.data?.candidates;
        if (!candidates || candidates.length === 0) {
            return NextResponse.json({
                error: "لم يرجع خادم Gemini أي إجابة. يرجى التأكد من حالة المفتاح والاتصال."
            }, { status: 502 });
        }

        const rawText = candidates[0]?.content?.parts[0]?.text;
        if (!rawText) {
            return NextResponse.json({
                error: "محتوى إجابة Gemini فارغ."
            }, { status: 502 });
        }

        const parsedContent = parseGeminiJsonResponse(rawText);

        return NextResponse.json({
            success: true,
            data: parsedContent
        });

    } catch (error: any) {
        console.error('Editor Bot API Error:', error);
        
        let errorMessage = 'حدث خطأ غير متوقع أثناء توليد المحتوى وتدقيقه.';
        if (error.response) {
            const status = error.response.status;
            const statusText = error.response.statusText;
            const details = error.response.data?.error?.message || '';
            errorMessage = `خطأ من خادم Gemini (${status} ${statusText}): ${details || 'مفتاح الـ API غير صالح أو تم تجاوز حد الاستخدام.'}`;
        } else if (error.message) {
            errorMessage = error.message;
        }

        return NextResponse.json({
            error: errorMessage
        }, { status: 500 });
    }
}
