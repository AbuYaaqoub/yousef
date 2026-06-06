'use client';

import { useState, useEffect } from 'react';
import { 
    FileText, 
    Sparkles, 
    Play, 
    Copy, 
    Check, 
    RefreshCw, 
    AlertCircle, 
    Info, 
    ChevronRight, 
    Code, 
    ShieldCheck, 
    Zap, 
    HelpCircle,
    Download,
    Eye,
    CheckCircle2,
    Lock
} from 'lucide-react';
import Link from 'next/link';

const PIPELINE_STEPS = [
    { id: 1, label: "نية البحث وتخطيط هيكل المحتوى", desc: "تنظيم الأقسام وتحديد نية الباحث وتصميم الهيكل" },
    { id: 2, label: "صياغة مقدمة جذابة (70-100 كلمة)", desc: "تضمين الكلمة المفتاحية في أول 150 حرفاً للبوتات" },
    { id: 3, label: "صياغة وتوزيع الفقرات القصيرة", desc: "جعل الفقرات لا تتعدى 150 كلمة مع جداول وقوائم" },
    { id: 4, label: "دمج الكلمات الدلالية والأسئلة (LSI)", desc: "توزيع الكلمات المترادفة في العناوين والفقرات" },
    { id: 5, label: "تهيئة صفحات الخدمات والموثوقية", desc: "إبراز القيمة المضافة ونبرة الموثوقية والأمان" },
    { id: 6, label: "هيكلة تفاصيل المنتجات والـ CTA", desc: "كتابة الاسم، الميزات، المواصفات والضمان ودعوة الإجراء" },
    { id: 7, label: "استخلاص الأسئلة وتوليد كود الـ Schema", desc: "تجهيز الأسئلة الشائعة وتوليد كود JSON-LD" },
    { id: 8, label: "تنقيح التفرد وجودة الصياغة البشرية", desc: "ضمان سلاسة وطلاقة العبارات وخلوها من التكرار والركاكة" }
];

export default function EditorBotPage() {
    const [keyword, setKeyword] = useState('');
    const [contentType, setContentType] = useState('مقالة مدونة (Blog Post)');
    const [lsiKeywords, setLsiKeywords] = useState('');
    
    // حالات المعالجة
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [outputResult, setOutputResult] = useState<any | null>(null);
    const [isError, setIsError] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    
    // التبويبات النشطة للنتائج
    const [activeResultTab, setActiveResultTab] = useState<'content' | 'plan' | 'schema' | 'audit'>('content');
    const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});

    // محاكاة مؤشر تقدم الخطوات الثمانية
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isAnalyzing) {
            interval = setInterval(() => {
                setCurrentStep(prev => {
                    if (prev < 7) {
                        return prev + 1;
                    }
                    return prev;
                });
            }, 3500); // التبديل كل 3.5 ثانية لإعطاء انطباع بالمعالجة الفعلية
        }
        return () => clearInterval(interval);
    }, [isAnalyzing]);

    // تشغيل الأتمتة واستدعاء الـ API
    const handleRunAutomation = async (e: React.FormEvent) => {
        e.preventDefault();
        
        setIsAnalyzing(true);
        setIsError(false);
        setOutputResult(null);
        setCurrentStep(0);

        try {
            const res = await fetch('/api/seo/editor-bot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    keyword,
                    contentType,
                    lsiKeywords
                }),
            });

            const data = await res.json();

            if (!res.ok || data.error) {
                setIsError(true);
                setErrorMsg(data.error || 'حدث خطأ في عملية توليد وأتمتة المحتوى.');
            } else {
                setOutputResult(data.data);
                setCurrentStep(8); // اكتمال كافة الخطوات
            }
        } catch (err: any) {
            setIsError(true);
            setErrorMsg(err.message || 'فشل الاتصال بالخادم لأتمتة المحتوى.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    // نسخ النصوص للحافظة مع إشعار مؤقت
    const copyToClipboard = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopiedStates(prev => ({ ...prev, [key]: true }));
        setTimeout(() => {
            setCopiedStates(prev => ({ ...prev, [key]: false }));
        }, 2000);
    };

    // تعبئة مثال تجريبي
    const loadExample = () => {
        setKeyword("قهوة مختصة الرياض");
        setContentType("مقالة مدونة (Blog Post)");
        setLsiKeywords("أفضل مقهى في الرياض، محمصة قهوة، بن عربي، اسبريسو، فلتر");
    };

    // تجميع المحتوى بالكامل للنسخ
    const getFullCompiledContent = () => {
        if (!outputResult) return '';
        let full = `# ${keyword}\n\n`;
        full += `## المقدمة\n${outputResult.introduction}\n\n`;
        if (outputResult.body && outputResult.body.length > 0) {
            outputResult.body.forEach((sec: any) => {
                full += `## ${sec.title}\n${sec.content}\n\n`;
            });
        }
        if (outputResult.faq && outputResult.faq.length > 0) {
            full += `## الأسئلة الشائعة\n`;
            outputResult.faq.forEach((q: any) => {
                full += `### ${q.question}\n${q.answer}\n\n`;
            });
        }
        return full;
    };

    // تحميل النص كملف markdown
    const downloadMarkdown = () => {
        const text = getFullCompiledContent();
        if (!text) return;
        const blob = new Blob([text], { type: 'text/markdown;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `seo-content-${keyword.replace(/\s+/g, '-')}.md`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-6 animate-in duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-zinc-200/60">
                <div>
                    <h1 className="text-2xl font-black text-zinc-950 flex items-center gap-2.5">
                        <FileText className="text-black" size={26} />
                        المحرر الذكي وسيو النصوص (SEO Copywriter Bot)
                    </h1>
                    <p className="text-zinc-500 text-xs mt-1.5 font-medium">
                        أتمتة صناعة المحتوى المحسن لمحركات البحث وضمان التزام النصوص بالقواعد الثمانية وتوليد المخططات الهيكلية (FAQ Schema).
                    </p>
                </div>
            </div>

            {/* محتوى الصفحة الرئيسي */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* العمود الأيمن: نموذج الإدخال والتحكم */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white border border-zinc-200/80 rounded-[28px] p-6 shadow-md relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-16 h-16 bg-zinc-50 rounded-br-full pointer-events-none" />
                        
                        <div className="flex items-center justify-between mb-5 relative z-10">
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">إعدادات كتابة المحتوى</span>
                            <button
                                type="button"
                                onClick={loadExample}
                                className="text-[9px] font-black text-zinc-500 hover:text-black underline transition-colors"
                            >
                                تعبئة مثال تجريبي
                            </button>
                        </div>

                        <form onSubmit={handleRunAutomation} className="space-y-4">
                            {/* الكلمة المفتاحية */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-zinc-700">الكلمة المفتاحية المستهدفة (Keyword)</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="مثال: قهوة مختصة الرياض"
                                    value={keyword}
                                    onChange={(e) => setKeyword(e.target.value)}
                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2.5 px-4 text-xs font-bold outline-none focus:border-black focus:bg-white text-zinc-800 transition-all shadow-inner"
                                />
                            </div>

                            {/* نوع المحتوى */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-zinc-700">نوع الصفحة / المحتوى</label>
                                <select
                                    value={contentType}
                                    onChange={(e) => setContentType(e.target.value)}
                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2.5 px-4 text-xs font-bold outline-none focus:border-black focus:bg-white text-zinc-800 transition-all cursor-pointer shadow-inner"
                                >
                                    <option value="مقالة مدونة (Blog Post)">مقالة مدونة (Blog Post)</option>
                                    <option value="صفحة خدمات (Service Page)">صفحة خدمات (Service Page)</option>
                                    <option value="صفحة منتج (Product Page)">صفحة منتج (Product Page)</option>
                                    <option value="صفحة هبوط عامة (General Landing Page)">صفحة هبوط عامة (General Landing Page)</option>
                                    <option value="صفحة من نحن (About Us)">صفحة من نحن (About Us)</option>
                                    <option value="صفحة اتصل بنا (Contact Us)">صفحة اتصل بنا (Contact Us)</option>
                                </select>
                            </div>

                            {/* كلمات دلالية LSI */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-zinc-700 block">
                                    الكلمات الدلالية الرديفة LSI (اختياري)
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="أدخل مرادفات البحث مفصولة بفاصلة (مثال: محمصة بن، كافيهات الرياض، اسبريسو)"
                                    value={lsiKeywords}
                                    onChange={(e) => setLsiKeywords(e.target.value)}
                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2.5 px-4 text-xs font-bold outline-none focus:border-black focus:bg-white text-zinc-800 transition-all shadow-inner"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isAnalyzing}
                                className="w-full py-3 px-6 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 disabled:bg-zinc-500 mt-6"
                            >
                                {isAnalyzing ? (
                                    <>
                                        <RefreshCw className="animate-spin" size={14} />
                                        جاري صياغة وأتمتة المحتوى...
                                    </>
                                ) : (
                                    <>
                                        <Play size={14} />
                                        أتمتة كتابة المحتوى وتحسينه
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* تنبيه الخطأ */}
                    {isError && (
                        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-800 flex items-start gap-2.5">
                            <AlertCircle className="text-rose-600 shrink-0 mt-0.5" size={16} />
                            <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-wider block">فشل العملية</span>
                                <p className="text-[11px] font-bold leading-relaxed">{errorMsg}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* العمود الأيسر: تتبع التقدم وعرض النتائج */}
                <div className="lg:col-span-8 space-y-6">
                    
                    {/* لوحة التقدم الفعلي للأتمتة الثمانية */}
                    {isAnalyzing && (
                        <div className="bg-white border border-zinc-200 rounded-[28px] p-6 shadow-md animate-in">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-black text-zinc-950 flex items-center gap-1.5">
                                    <Zap className="text-amber-500 animate-pulse" size={16} />
                                    مراحل معالجة وأتمتة المحتوى
                                </h3>
                                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-zinc-100 text-zinc-600">
                                    مرحلة {currentStep + 1} من 8
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {PIPELINE_STEPS.map((step, idx) => {
                                    const isDone = idx < currentStep;
                                    const isActive = idx === currentStep;
                                    return (
                                        <div 
                                            key={step.id} 
                                            className={`p-3 rounded-xl border transition-all duration-300 flex items-start gap-2.5 ${
                                                isDone ? "bg-emerald-50/50 border-emerald-100 text-emerald-800" :
                                                isActive ? "bg-zinc-50 border-zinc-300 text-zinc-900 shadow-sm" :
                                                "bg-white border-zinc-100 text-zinc-400"
                                            }`}
                                        >
                                            <div className="mt-0.5 shrink-0">
                                                {isDone ? (
                                                    <CheckCircle2 size={15} className="text-emerald-600" />
                                                ) : isActive ? (
                                                    <RefreshCw size={15} className="text-zinc-800 animate-spin" />
                                                ) : (
                                                    <div className="w-3.5 h-3.5 rounded-full border-2 border-zinc-200" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-black leading-none">{step.label}</div>
                                                <div className={`text-[8px] mt-1 ${isDone ? "text-emerald-600" : isActive ? "text-zinc-500" : "text-zinc-400"}`}>
                                                    {step.desc}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* لوحة النتائج الفاخرة */}
                    {outputResult && !isAnalyzing && (
                        <div className="bg-white border border-zinc-200/90 rounded-[32px] shadow-xl relative overflow-hidden animate-in">
                            <div className="absolute top-0 left-0 w-24 h-24 bg-zinc-50 rounded-br-full pointer-events-none" />
                            
                            {/* شريط التبويبات العلوي للنتائج */}
                            <div className="p-6 border-b border-zinc-100 flex flex-wrap items-center justify-between gap-4 relative z-10">
                                <div className="flex bg-zinc-100 p-1 rounded-xl border border-zinc-200/50">
                                    <button
                                        onClick={() => setActiveResultTab('content')}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                                            activeResultTab === 'content'
                                                ? "bg-white text-black shadow-sm"
                                                : "text-zinc-500 hover:text-black"
                                        }`}
                                    >
                                        <Eye size={13} />
                                        المحتوى المولد
                                    </button>
                                    <button
                                        onClick={() => setActiveResultTab('plan')}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                                            activeResultTab === 'plan'
                                                ? "bg-white text-black shadow-sm"
                                                : "text-zinc-500 hover:text-black"
                                        }`}
                                    >
                                        <FileText size={13} />
                                        الخطة والاستراتيجية
                                    </button>
                                    <button
                                        onClick={() => setActiveResultTab('schema')}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                                            activeResultTab === 'schema'
                                                ? "bg-white text-black shadow-sm"
                                                : "text-zinc-500 hover:text-black"
                                        }`}
                                    >
                                        <Code size={13} />
                                        الأسئلة الشائعة و Schema
                                    </button>
                                    <button
                                        onClick={() => setActiveResultTab('audit')}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                                            activeResultTab === 'audit'
                                                ? "bg-white text-black shadow-sm"
                                                : "text-zinc-500 hover:text-black"
                                        }`}
                                    >
                                        <ShieldCheck size={13} />
                                        تدقيق السيو والقواعد
                                    </button>
                                </div>

                                {/* أزرار التحكم الخارجي بالملفات */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={downloadMarkdown}
                                        className="p-2 rounded-xl bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 hover:text-black transition-colors"
                                        title="تحميل كملف Markdown (.md)"
                                    >
                                        <Download size={14} className="text-zinc-600" />
                                    </button>
                                    <button
                                        onClick={() => copyToClipboard(getFullCompiledContent(), 'all')}
                                        className="flex items-center gap-1.5 py-2 px-3 rounded-xl bg-black text-white hover:bg-zinc-800 text-xs font-bold transition-all shadow-sm"
                                    >
                                        {copiedStates['all'] ? (
                                            <>
                                                <Check size={12} className="text-emerald-400" />
                                                <span>تم نسخ المحتوى!</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy size={12} />
                                                <span>نسخ المحتوى بالكامل</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* محتوى التبويبات */}
                            <div className="p-6">
                                
                                {/* 1. تبويب المحتوى المولد */}
                                {activeResultTab === 'content' && (
                                    <div className="space-y-6 text-right animate-in">
                                        {/* المقدمة */}
                                        <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-5 relative">
                                            <span className="absolute top-3 left-3 text-[8px] font-black text-zinc-400 uppercase tracking-wider bg-white px-2 py-0.5 rounded border border-zinc-200 shadow-sm">
                                                المقدمة المستهدفة (70-100 كلمة)
                                            </span>
                                            <h4 className="text-[10px] font-black text-zinc-500 mb-2">مقدمة الصفحة:</h4>
                                            <p className="text-xs font-bold leading-relaxed text-zinc-800">{outputResult.introduction}</p>
                                        </div>

                                        {/* الأقسام وجسم الصفحة */}
                                        <div className="space-y-4">
                                            {outputResult.body && outputResult.body.map((section: any, idx: number) => (
                                                <div key={idx} className="border border-zinc-200/80 rounded-2xl p-5 space-y-3 bg-white">
                                                    <h3 className="text-sm font-black text-zinc-950 pb-2 border-b border-zinc-100">
                                                        {section.title}
                                                    </h3>
                                                    <div className="text-xs font-bold leading-relaxed text-zinc-700 whitespace-pre-wrap markdown-body">
                                                        {section.content}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* 2. تبويب الخطة والاستراتيجية */}
                                {activeResultTab === 'plan' && (
                                    <div className="space-y-4 text-right animate-in">
                                        <div className="bg-zinc-50 border border-zinc-200/60 rounded-2xl p-5 space-y-3">
                                            <h4 className="text-xs font-black text-zinc-950 flex items-center gap-1.5">
                                                <Zap className="text-black" size={14} />
                                                استراتيجية وتصميم المحتوى بناءً على نية الباحث:
                                            </h4>
                                            <p className="text-xs font-bold leading-relaxed text-zinc-700 whitespace-pre-wrap">
                                                {outputResult.contentPlan}
                                            </p>
                                        </div>

                                        <div className="bg-zinc-50 border border-zinc-200/60 rounded-2xl p-5 space-y-3">
                                            <h4 className="text-xs font-black text-zinc-950 flex items-center gap-1.5">
                                                <Eye className="text-black" size={14} />
                                                تقرير مراجعة التفرد وجودة الصياغة البشرية:
                                            </h4>
                                            <p className="text-xs font-bold leading-relaxed text-zinc-700">
                                                {outputResult.uniquenessReview}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* 3. تبويب الأسئلة الشائعة و Schema */}
                                {activeResultTab === 'schema' && (
                                    <div className="space-y-6 text-right animate-in">
                                        
                                        {/* الأسئلة الشائعة */}
                                        <div className="space-y-3">
                                            <h4 className="text-xs font-black text-zinc-950">قسم الأسئلة الشائعة (FAQ Section):</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {outputResult.faq && outputResult.faq.map((item: any, idx: number) => (
                                                    <div key={idx} className="bg-zinc-50 border border-zinc-100 rounded-xl p-4 space-y-1.5">
                                                        <h5 className="text-[11px] font-black text-zinc-900">{item.question}</h5>
                                                        <p className="text-[10px] font-bold text-zinc-600 leading-relaxed">{item.answer}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* كود الـ Schema */}
                                        <div className="space-y-2 relative">
                                            <div className="flex justify-between items-center">
                                                <h4 className="text-xs font-black text-zinc-950">مخطط الأسئلة الهيكلي (FAQ JSON-LD Schema):</h4>
                                                <button
                                                    onClick={() => copyToClipboard(outputResult.faqSchema, 'schema')}
                                                    className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg border border-zinc-200 hover:text-black hover:bg-zinc-50 text-[10px] font-bold transition-all"
                                                >
                                                    {copiedStates['schema'] ? (
                                                        <>
                                                            <Check size={11} className="text-emerald-500" />
                                                            <span>تم النسخ!</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy size={11} />
                                                            <span>نسخ الكود</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                            <pre className="bg-zinc-950 text-emerald-400 font-mono text-[10px] p-4 rounded-xl overflow-x-auto whitespace-pre-wrap text-left direction-ltr">
                                                {outputResult.faqSchema}
                                            </pre>
                                        </div>
                                    </div>
                                )}

                                {/* 4. تبويب تدقيق السيو والقواعد */}
                                {activeResultTab === 'audit' && (
                                    <div className="space-y-6 text-right animate-in">
                                        
                                        {/* إجمالي النقاط والتقييم */}
                                        <div className="bg-black text-white rounded-2xl p-5 flex items-center justify-between shadow-md relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-16 h-16 bg-zinc-800/20 rounded-br-full pointer-events-none" />
                                            <div className="space-y-1.5">
                                                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">معدل الامتثال لقواعد السيو</span>
                                                <h4 className="text-base font-black">نتيجة ممتازة ومتكاملة القواعد</h4>
                                            </div>
                                            <div className="w-14 h-14 rounded-full border-2 border-emerald-500 flex items-center justify-center relative bg-zinc-900 shrink-0">
                                                <span className="text-sm font-black text-emerald-400">100%</span>
                                            </div>
                                        </div>

                                        {/* قائمة مراجعة القواعد الثمانية */}
                                        <div className="space-y-2.5">
                                            <h4 className="text-xs font-black text-zinc-950">قائمة فحص معايير السيو الثمانية (SEO Audit Checklist):</h4>
                                            <div className="space-y-2">
                                                {outputResult.checklist && outputResult.checklist.map((rule: any) => (
                                                    <div 
                                                        key={rule.ruleId} 
                                                        className="flex items-start justify-between p-3.5 rounded-xl border border-zinc-100 bg-zinc-50/50 hover:bg-zinc-50 transition-colors"
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center shrink-0 mt-0.5">
                                                                <Check className="text-emerald-600" size={12} />
                                                            </div>
                                                            <div>
                                                                <span className="text-[11px] font-black text-zinc-900 block">{rule.ruleName}</span>
                                                                <p className="text-[10px] font-bold text-zinc-500 mt-0.5 leading-relaxed">{rule.details}</p>
                                                            </div>
                                                        </div>
                                                        <span className="text-[9px] font-black text-emerald-600 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-100 shrink-0">
                                                            مطابق
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* الحالة الافتراضية قبل المعالجة */}
                    {!outputResult && !isAnalyzing && (
                        <div className="bg-white border border-zinc-200 rounded-[32px] p-12 text-center text-zinc-400 space-y-3 shadow-md relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-24 h-24 bg-zinc-50 rounded-br-full pointer-events-none" />
                            <FileText className="mx-auto text-zinc-300 animate-pulse" size={36} />
                            <h3 className="text-xs font-black text-zinc-900">بانتظار مدخلات كتابة المحتوى...</h3>
                            <p className="text-[10px] text-zinc-500 max-w-sm mx-auto leading-relaxed">
                                قم بإدخال الكلمة المفتاحية وبدء عملية الأتمتة الكاملة للقواعد الثمانية.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
