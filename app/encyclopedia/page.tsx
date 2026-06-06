'use client';

import { useState, useEffect, useRef } from 'react';
import { 
    BookOpen, 
    Sparkles, 
    Search, 
    Loader2, 
    Download, 
    ExternalLink, 
    Filter, 
    HelpCircle, 
    TrendingUp, 
    FileText, 
    Lightbulb, 
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    Cpu,
    Clock,
    Play,
    Zap
} from 'lucide-react';
import Link from 'next/link';

interface QuestionItem {
    question: string;
    platform: string;
    link: string;
    interactions: number;
    intent: 'Informational' | 'Commercial' | 'Transactional' | 'Navigational';
    category: string;
    relevanceScore: number;
}

interface ArticleIdea {
    title: string;
    description: string;
    keyword: string;
}

interface FAQIdea {
    question: string;
    intent: string;
    source: string;
}

interface CrawlerReport {
    topDemanded: string[];
    contentGaps: string[];
    articleIdeas: ArticleIdea[];
    faqIdeas: FAQIdea[];
    topicalAuthorityOpportunities: string[];
}

interface CrawlResponse {
    success: boolean;
    keyword: string;
    totalCount: number;
    questions: QuestionItem[];
    report: CrawlerReport;
    error?: string;
}

interface BotStatus {
    name: string;
    platform: string;
    status: 'idle' | 'running' | 'completed' | 'failed';
    progress: number;
    log: string;
    questionsCount: number;
}

export default function EncyclopediaPage() {
    const [keyword, setKeyword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<CrawlResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    // فلاتر العرض
    const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
    const [selectedIntent, setSelectedIntent] = useState<string>('all');

    // إعدادات الـ 5 بوتات والوقت (5 دقائق)
    const [countdown, setCountdown] = useState(300); // 5 دقائق = 300 ثانية
    const [bots, setBots] = useState<BotStatus[]>([
        { name: 'Google Bot', platform: 'Google', status: 'idle', progress: 0, log: 'جاهز للعمل', questionsCount: 0 },
        { name: 'Reddit Bot', platform: 'Reddit', status: 'idle', progress: 0, log: 'جاهز للعمل', questionsCount: 0 },
        { name: 'Quora Bot', platform: 'Quora', status: 'idle', progress: 0, log: 'جاهز للعمل', questionsCount: 0 },
        { name: 'X Bot (Twitter)', platform: 'X (Twitter)', status: 'idle', progress: 0, log: 'جاهز للعمل', questionsCount: 0 },
        { name: 'LinkedIn Bot', platform: 'LinkedIn', status: 'idle', progress: 0, log: 'جاهز للعمل', questionsCount: 0 }
    ]);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const apiDataRef = useRef<CrawlResponse | null>(null);

    // دالة لتحديث حالات البوتات أثناء العد التنازلي
    useEffect(() => {
        if (isLoading && countdown > 0) {
            timerRef.current = setTimeout(() => {
                setCountdown(prev => {
                    const nextValue = prev - 1;
                    const elapsed = 300 - nextValue; // كم ثانية مرت
                    
                    // تحديث تقدم كل بوت بناءً على الوقت المستغرق
                    setBots(prevBots => prevBots.map((bot, idx) => {
                        let progress = 0;
                        let status: 'idle' | 'running' | 'completed' | 'failed' = 'running';
                        let log = bot.log;

                        // لكل بوت توقيت تقدم مختلف ليظهر العمل واقعياً
                        const botDelay = idx * 25; // يبدأ كل بوت بفارق زمني بسيط
                        if (elapsed > botDelay) {
                            const botElapsed = elapsed - botDelay;
                            progress = Math.min(100, Math.floor((botElapsed / 200) * 100)); // يصل لـ 100% خلال فترة
                            
                            if (progress < 25) {
                                log = '🔎 جاري إطلاق وتأمين الاتصال البروكسي...';
                            } else if (progress < 50) {
                                log = `🌐 تصفح منصة ${bot.platform} والبحث عن "${keyword}"...`;
                            } else if (progress < 80) {
                                log = '📝 استخراج المشاركات وتصنيف الأسئلة والنوايا...';
                            } else if (progress < 100) {
                                log = '⚡ جاري تنظيف البيانات وترتيب الصلة والتفاعلات...';
                            } else {
                                status = 'completed';
                                log = '✅ اكتمل استخراج البيانات بنجاح';
                            }
                        }

                        // إذا كان لدينا بيانات من الـ API، نحدث عدد الأسئلة المستخرجة للبوت
                        let questionsCount = bot.questionsCount;
                        if (apiDataRef.current && apiDataRef.current.questions) {
                            questionsCount = apiDataRef.current.questions.filter(q => q.platform === bot.platform).length;
                        }

                        return {
                            ...bot,
                            progress,
                            status,
                            log,
                            questionsCount: status === 'completed' ? questionsCount : Math.floor((progress / 100) * questionsCount)
                        };
                    }));

                    return nextValue;
                });
            }, 1000);
        } else if (countdown === 0 && isLoading) {
            // انتهاء الـ 5 دقائق بنجاح
            handleComplete();
        }

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [isLoading, countdown]);

    const handleStartCrawl = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!keyword.trim()) return;

        setIsLoading(true);
        setError(null);
        setResult(null);
        setCountdown(300); // إعادة تعيين لـ 5 دقائق
        apiDataRef.current = null;

        // إعادة ضبط البوتات للوضع النشط
        setBots([
            { name: 'Google Bot', platform: 'Google', status: 'running', progress: 0, log: '🚀 جاري الاتصال...', questionsCount: 0 },
            { name: 'Reddit Bot', platform: 'Reddit', status: 'running', progress: 0, log: '🚀 جاري الاتصال...', questionsCount: 0 },
            { name: 'Quora Bot', platform: 'Quora', status: 'running', progress: 0, log: '🚀 جاري الاتصال...', questionsCount: 0 },
            { name: 'X Bot (Twitter)', platform: 'X (Twitter)', status: 'running', progress: 0, log: '🚀 جاري الاتصال...', questionsCount: 0 },
            { name: 'LinkedIn Bot', platform: 'LinkedIn', status: 'running', progress: 0, log: '🚀 جاري الاتصال...', questionsCount: 0 }
        ]);

        // استدعاء الـ API في الخلفية فورياً لتكون البيانات جاهزة بمجرد اكتمال العداد أو تخطيه
        try {
            const res = await fetch('/api/seo/questions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ keyword: keyword.trim() }),
            });
            const data: CrawlResponse = await res.json();
            
            if (!res.ok || !data.success) {
                throw new Error(data.error || 'فشل تشغيل البوت. يرجى التحقق من الاتصال.');
            }

            apiDataRef.current = data;
        } catch (err: any) {
            console.error('API pre-fetch error:', err);
            setError(err.message || 'حدث خطأ في الاتصال بالخادم.');
            setIsLoading(false);
        }
    };

    const handleComplete = () => {
        if (apiDataRef.current) {
            setResult(apiDataRef.current);
        } else {
            setError('تعذر استرداد البيانات من الخادم، يرجى المحاولة مرة أخرى.');
        }
        setIsLoading(false);
    };

    // دالة لتخطي الانتظار وعرض النتائج المستخرجة فورياً
    const handleSkipWait = () => {
        if (apiDataRef.current) {
            // إظهار البوتات مكتملة 100% فورياً
            setBots(prevBots => prevBots.map(bot => {
                const count = apiDataRef.current ? apiDataRef.current.questions.filter(q => q.platform === bot.platform).length : 0;
                return {
                    ...bot,
                    progress: 100,
                    status: 'completed',
                    log: '✅ اكتمل استخراج البيانات بنجاح',
                    questionsCount: count
                };
            }));
            setResult(apiDataRef.current);
            setIsLoading(false);
        } else {
            alert('جاري سحب البيانات حالياً، يرجى الانتظار ثوانٍ معدودة ثم الضغط مجدداً لتخطي العداد.');
        }
    };

    // تصفية الأسئلة بناءً على خيارات الفلترة
    const filteredQuestions = result 
        ? result.questions.filter(q => {
            const matchesPlatform = selectedPlatform === 'all' || q.platform === selectedPlatform;
            const matchesIntent = selectedIntent === 'all' || q.intent === selectedIntent;
            return matchesPlatform && matchesIntent;
          })
        : [];

    // تصدير البيانات إلى CSV
    const exportToCSV = () => {
        if (!result) return;
        
        const headers = ['السؤال', 'المنصة المصدر', 'الرابط', 'عدد التفاعلات التقديري', 'نية البحث', 'التصنيف'];
        const rows = result.questions.map(q => [
            `"${q.question.replace(/"/g, '""')}"`,
            `"${q.platform}"`,
            `"${q.link}"`,
            q.interactions,
            `"${q.intent}"`,
            `"${q.category}"`
        ]);

        const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `seo_questions_${result.keyword}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // تصدير البيانات إلى JSON
    const exportToJSON = () => {
        if (!result) return;
        const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `seo_questions_${result.keyword}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // تنسيق الوقت التنازلي mm:ss
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // نصوص توضيحية لنوايا البحث باللغة العربية
    const intentLabels: Record<string, string> = {
        Informational: 'معلوماتية (تعليم واستفسار)',
        Commercial: 'تجارية (مقارنات وتقييمات)',
        Transactional: 'تحويلية (شراء وأسعار)',
        Navigational: 'توجيهية (بحث عن موقع/منصة)',
    };

    const intentColor: Record<string, string> = {
        Informational: 'bg-blue-50 text-blue-700 border-blue-100',
        Commercial: 'bg-purple-50 text-purple-700 border-purple-100',
        Transactional: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        Navigational: 'bg-amber-50 text-amber-700 border-amber-100',
    };

    const platformColor: Record<string, string> = {
        'Google': 'bg-red-50 text-red-700 border-red-100',
        'Reddit': 'bg-orange-50 text-orange-700 border-orange-100',
        'Quora': 'bg-red-100 text-red-800 border-red-200',
        'X (Twitter)': 'bg-zinc-100 text-zinc-800 border-zinc-200',
        'LinkedIn': 'bg-blue-100 text-blue-800 border-blue-200',
    };

    return (
        <div className="max-w-6xl mx-auto px-6 py-8 animate-in duration-300">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-black text-zinc-950 flex items-center gap-2">
                        <BookOpen className="text-black" size={26} />
                        أتمتة واستخراج الأسئلة الذكية (SEO)
                    </h1>
                    <p className="text-zinc-500 text-xs mt-1.5 font-medium">
                        ابحث واكشف عن الأسئلة الحقيقية التي يطرحها الجمهور على Google ومواقع التواصل لبناء سلطة موضوعية متكاملة.
                    </p>
                </div>
                {result && (
                    <button
                        onClick={() => {
                            setResult(null);
                            setKeyword('');
                        }}
                        className="flex items-center gap-1.5 py-2 px-4 rounded-xl border border-zinc-200 text-zinc-500 hover:text-black hover:bg-zinc-50 text-xs font-bold transition-all self-start md:self-auto"
                    >
                        <ArrowLeft size={14} />
                        بحث جديد
                    </button>
                )}
            </div>

            {/* Error handling */}
            {error && (
                <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-800 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
                    <AlertCircle size={16} className="text-rose-600 shrink-0" />
                    <div className="flex-1">{error}</div>
                </div>
            )}

            {/* 1. نموذج البحث والتحليل البدائي */}
            {!result && !isLoading && (
                <div className="bg-white border border-zinc-200/80 rounded-[32px] p-8 md:p-10 shadow-xl shadow-zinc-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-24 h-24 bg-zinc-50 rounded-br-full pointer-events-none" />
                    
                    <div className="max-w-xl mx-auto text-center">
                        <div className="w-14 h-14 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center mx-auto mb-6 text-zinc-900 shadow-sm">
                            <Cpu size={24} />
                        </div>
                        <h2 className="text-xl font-black text-zinc-900 mb-2">استكشف نية الجمهور الحقيقية</h2>
                        <p className="text-xs text-zinc-500 font-medium mb-8">
                            أدخل الكلمة المفتاحية المستهدفة ليقوم البوت بمسح وحشد الأسئلة والمشكلات المطروحة على المنصات الكبرى وتصنيفها فورياً.
                        </p>

                        <form onSubmit={handleStartCrawl} className="space-y-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    required
                                    placeholder="مثال: قهوة مختصة، تأسيس متجر إلكتروني، سيو للمتاجر..."
                                    value={keyword}
                                    onChange={(e) => setKeyword(e.target.value)}
                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-3.5 pr-12 pl-4 text-sm font-bold outline-none focus:border-black focus:bg-white text-zinc-800 transition-all shadow-inner"
                                />
                                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3.5 px-6 rounded-2xl bg-black hover:bg-zinc-800 text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2"
                            >
                                <Play size={16} />
                                إطلاق البوتات للبحث العميق (5 دقائق)
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* 2. شاشة تقدم وعمل البوتات الخمسة بالتفصيل */}
            {isLoading && (
                <div className="space-y-8 animate-in fade-in duration-300">
                    {/* لوحة تحكم عامة بالوقت والتقدم */}
                    <div className="bg-black text-white border border-zinc-900 rounded-[28px] p-6 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-800/15 rounded-bl-full pointer-events-none" />
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-850 flex items-center justify-center text-emerald-400 animate-pulse">
                                <Clock size={24} />
                            </div>
                            <div>
                                <span className="text-[10px] font-black text-zinc-400 block mb-0.5">الوقت المخصص للبحث والتحليل العميق</span>
                                <span className="text-3xl font-black tracking-tight">{formatTime(countdown)} دقيقة</span>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 relative z-10 w-full md:w-auto">
                            <button
                                onClick={handleSkipWait}
                                className="flex-1 py-3 px-5 rounded-xl bg-white text-black hover:bg-zinc-100 font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-white/5"
                            >
                                <Zap size={14} className="text-amber-500" />
                                تخطي الانتظار وعرض النتائج المستخرجة فوراً
                            </button>
                        </div>
                    </div>

                    {/* عرض البوتات الخمسة ومستويات تقدمها */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {bots.map((bot, idx) => (
                            <div 
                                key={idx} 
                                className={`bg-white border rounded-[24px] p-5 shadow-sm transition-all ${
                                    bot.status === 'completed' 
                                        ? 'border-emerald-200 bg-emerald-50/5' 
                                        : bot.status === 'running' 
                                            ? 'border-zinc-300' 
                                            : 'border-zinc-200'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2.5">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${
                                            bot.status === 'completed' 
                                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                                : 'bg-zinc-50 text-zinc-700 border border-zinc-150'
                                        }`}>
                                            🤖
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-black text-zinc-900">{bot.name}</h4>
                                            <span className="text-[9px] font-medium text-zinc-400">البحث في {bot.platform}</span>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                        bot.status === 'completed' 
                                            ? 'bg-emerald-100/50 text-emerald-700' 
                                            : 'bg-zinc-100 text-zinc-600'
                                    }`}>
                                        {bot.status === 'completed' ? 'اكتمل' : `${bot.progress}%`}
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full transition-all duration-1000 ${
                                                bot.status === 'completed' ? 'bg-emerald-500' : 'bg-black'
                                            }`} 
                                            style={{ width: `${bot.progress}%` }}
                                        />
                                    </div>
                                    <p className="text-[10px] font-medium text-zinc-500 leading-normal min-h-[30px]">
                                        {bot.log}
                                    </p>
                                    <div className="pt-2.5 border-t border-zinc-100 flex items-center justify-between text-[10px] font-bold">
                                        <span className="text-zinc-400">الأسئلة المكتشفة:</span>
                                        <span className="text-zinc-900">{bot.questionsCount} سؤال</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 3. شاشة لوحة البيانات والنتائج المستخرجة */}
            {result && !isLoading && (
                <div className="space-y-8 animate-in fade-in duration-550">
                    
                    {/* بطاقات الإحصاءات والأرقام السريعة */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block mb-1">الكلمة المفتاحية المستهدفة</span>
                            <span className="text-lg font-black text-zinc-900 block">{result.keyword}</span>
                        </div>
                        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block mb-1">إجمالي الأسئلة الفريدة المكتشفة</span>
                            <span className="text-2xl font-black text-zinc-900 block">{result.totalCount} سؤال</span>
                        </div>
                        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm flex items-center justify-between gap-4">
                            <div>
                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block mb-1">تصدير وحفظ التقرير</span>
                                <span className="text-xs font-bold text-zinc-500">بصيغ منسقة ومتكاملة</span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={exportToCSV}
                                    title="تصدير ملف CSV"
                                    className="p-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-700 transition-colors"
                                >
                                    <Download size={15} />
                                </button>
                                <button
                                    onClick={exportToJSON}
                                    title="تصدير ملف JSON"
                                    className="p-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-700 transition-colors font-bold text-xs"
                                >
                                    JSON
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* جدول تصفية وعرض الأسئلة التفصيلي */}
                    <div className="bg-white border border-zinc-200 rounded-[28px] overflow-hidden shadow-sm">
                        
                        {/* شريط الفلاتر والتحكم */}
                        <div className="p-5 border-b border-zinc-100 bg-zinc-50/50 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <Filter className="text-zinc-400" size={15} />
                                <span className="text-xs font-black text-zinc-700">تصفية النتائج:</span>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {/* فلتر المنصات */}
                                <select
                                    value={selectedPlatform}
                                    onChange={(e) => setSelectedPlatform(e.target.value)}
                                    className="bg-white border border-zinc-200 rounded-xl px-3 py-1.5 text-xs font-bold text-zinc-700 outline-none focus:border-zinc-400"
                                >
                                    <option value="all">كل المنصات ({result.totalCount})</option>
                                    <option value="Google">Google</option>
                                    <option value="Reddit">Reddit</option>
                                    <option value="Quora">Quora</option>
                                    <option value="X (Twitter)">X (Twitter)</option>
                                    <option value="LinkedIn">LinkedIn</option>
                                </select>

                                {/* فلتر نية البحث */}
                                <select
                                    value={selectedIntent}
                                    onChange={(e) => setSelectedIntent(e.target.value)}
                                    className="bg-white border border-zinc-200 rounded-xl px-3 py-1.5 text-xs font-bold text-zinc-700 outline-none focus:border-zinc-400"
                                >
                                    <option value="all">كل النوايا</option>
                                    <option value="Informational">معلوماتية</option>
                                    <option value="Commercial">تجارية</option>
                                    <option value="Transactional">تحويلية / شراء</option>
                                    <option value="Navigational">توجيهية</option>
                                </select>
                            </div>
                        </div>

                        {/* قائمة الأسئلة */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-right border-collapse">
                                <thead>
                                    <tr className="bg-zinc-50 text-[10px] font-black text-zinc-400 uppercase tracking-wider border-b border-zinc-100">
                                        <th className="px-6 py-4">السؤال المكتشف</th>
                                        <th className="px-6 py-4">المنصة</th>
                                        <th className="px-6 py-4">نية البحث</th>
                                        <th className="px-6 py-4">التصنيف الموضوعي</th>
                                        <th className="px-6 py-4 text-center">درجة الصلة</th>
                                        <th className="px-6 py-4 text-left">الرابط</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100 text-xs font-bold text-zinc-800">
                                    {filteredQuestions.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">
                                                لا توجد أسئلة تطابق فلاتر البحث الحالية.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredQuestions.map((q, idx) => (
                                            <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                                                <td className="px-6 py-4 text-sm font-bold text-zinc-950 max-w-sm leading-normal">
                                                    {q.question}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 rounded-full text-[9px] border font-black ${platformColor[q.platform] || 'bg-zinc-50'}`}>
                                                        {q.platform}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 rounded-full text-[9px] border font-black ${intentColor[q.intent] || 'bg-zinc-50'}`}>
                                                        {intentLabels[q.intent]}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-zinc-500">
                                                    {q.category}
                                                </td>
                                                <td className="px-6 py-4 text-center whitespace-nowrap">
                                                    <span className={`text-[10px] font-black ${q.relevanceScore >= 85 ? 'text-emerald-600' : q.relevanceScore >= 70 ? 'text-blue-600' : 'text-zinc-500'}`}>
                                                        {q.relevanceScore}%
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-left whitespace-nowrap">
                                                    {q.link && q.link !== 'https://google.com' ? (
                                                        <a 
                                                            href={q.link} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 text-zinc-400 hover:text-black transition-colors"
                                                        >
                                                            <span>زيارة المصدر</span>
                                                            <ExternalLink size={12} />
                                                        </a>
                                                    ) : (
                                                        <span className="text-zinc-300">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* التقرير الاستراتيجي وأفكار توليد المحتوى والسيو */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        
                        {/* فجوات المحتوى وفرص بناء Topical Authority */}
                        <div className="space-y-6">
                            <div className="bg-white border border-zinc-200 rounded-[28px] p-6 shadow-sm">
                                <h3 className="text-sm font-black text-zinc-950 flex items-center gap-2 mb-4">
                                    <AlertCircle className="text-black" size={18} />
                                    فجوات المحتوى المكتشفة (Content Gaps)
                                </h3>
                                <ul className="space-y-3">
                                    {result.report.contentGaps.map((gap, i) => (
                                        <li key={i} className="flex gap-2 text-xs font-medium text-zinc-600 leading-relaxed">
                                            <span className="w-1.5 h-1.5 rounded-full bg-black mt-1.5 shrink-0" />
                                            <span>{gap}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="bg-white border border-zinc-200 rounded-[28px] p-6 shadow-sm">
                                <h3 className="text-sm font-black text-zinc-950 flex items-center gap-2 mb-4">
                                    <TrendingUp className="text-black" size={18} />
                                    فرص تحسين السيو وبناء السلطة الموضوعية
                                </h3>
                                <ul className="space-y-3">
                                    {result.report.topicalAuthorityOpportunities.map((opportunity, i) => (
                                        <li key={i} className="flex gap-2 text-xs font-medium text-zinc-600 leading-relaxed">
                                            <span className="w-1.5 h-1.5 rounded-full bg-black mt-1.5 shrink-0" />
                                            <span>{opportunity}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* مقترحات المقالات الجديدة وأفكار الأسئلة الشائعة FAQ */}
                        <div className="space-y-6">
                            <div className="bg-white border border-zinc-200 rounded-[28px] p-6 shadow-sm">
                                <h3 className="text-sm font-black text-zinc-950 flex items-center gap-2 mb-4">
                                    <FileText className="text-black" size={18} />
                                    أفكار مقالات غنية مقترحة (Blog Posts)
                                </h3>
                                <div className="space-y-4">
                                    {result.report.articleIdeas.map((idea, i) => (
                                        <div key={i} className="p-4 bg-zinc-50 border border-zinc-100 rounded-2xl">
                                            <span className="text-[10px] font-black text-zinc-400 block mb-1">فكرة {i + 1}</span>
                                            <h4 className="text-xs font-black text-zinc-900 mb-1">{idea.title}</h4>
                                            <p className="text-[10px] font-medium text-zinc-500 leading-relaxed">{idea.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white border border-zinc-200 rounded-[28px] p-6 shadow-sm">
                                <h3 className="text-sm font-black text-zinc-950 flex items-center gap-2 mb-4">
                                    <HelpCircle className="text-black" size={18} />
                                    فرص إدراج الأسئلة الشائعة (FAQ Scheme)
                                </h3>
                                <div className="space-y-3">
                                    {result.report.faqIdeas.map((faq, i) => (
                                        <div key={i} className="flex items-start justify-between gap-4 py-2 border-b border-zinc-50 last:border-0">
                                            <div className="flex gap-2">
                                                <span className="text-[10px] font-bold text-zinc-400 mt-0.5">{i + 1}.</span>
                                                <span className="text-xs font-bold text-zinc-900 leading-normal">{faq.question}</span>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black border uppercase shrink-0 ${intentColor[faq.intent] || 'bg-zinc-50'}`}>
                                                {faq.intent}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>

                </div>
            )}

        </div>
    );
}
