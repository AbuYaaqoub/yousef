'use client';

import { useState } from 'react';
import { 
    Sparkles, 
    Terminal, 
    Play, 
    Copy, 
    Check, 
    RefreshCw, 
    AlertCircle, 
    Info, 
    ArrowLeft,
    FileText,
    Cpu,
    BadgeAlert,
    Gauge
} from 'lucide-react';
import Link from 'next/link';

export default function DetectionBotPage() {
    const [activeTab, setActiveTab] = useState<'interactive' | 'json'>('interactive');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [copied, setCopied] = useState(false);

    // واجهة تفاعلية للبيانات
    const [interactiveInput, setInteractiveInput] = useState({
        keyword: ''
    });

    // واجهة مدخلات JSON
    const [jsonInput, setJsonInput] = useState(JSON.stringify({
        "keyword": "قهوة مختصة الرياض",
        "allintitle": 18,
        "exact_allintitle": 4
    }, null, 2));

    const [outputResult, setOutputResult] = useState<any | null>(null);
    const [isError, setIsError] = useState(false);

    // تشغيل التحليل للواجهة التفاعلية
    const handleInteractiveSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsAnalyzing(true);
        setIsError(false);
        setOutputResult(null);

        try {
            const res = await fetch('/api/seo/detection-bot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    keyword: interactiveInput.keyword
                }),
            });

            const data = await res.json();

            if (!res.ok || data.error) {
                setIsError(true);
                setOutputResult({ error: data.error || 'حدث خطأ في عملية الكشف والتحليل.' });
            } else {
                setOutputResult(data);
            }
        } catch (err: any) {
            setIsError(true);
            setOutputResult({ error: err.message || 'فشل الاتصال بالخادم للكشف التلقائي.' });
        } finally {
            setIsAnalyzing(false);
        }
    };

    // تشغيل التحليل لمدخلات JSON المباشرة
    const handleJsonSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsAnalyzing(true);
        setIsError(false);
        setOutputResult(null);

        try {
            const parsed = JSON.parse(jsonInput);
            const res = await fetch('/api/seo/detection-bot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(parsed),
            });

            const data = await res.json();

            if (!res.ok || data.error) {
                setIsError(true);
                setOutputResult({ error: data.error || 'حدث خطأ في معالجة الـ JSON.' });
            } else {
                setOutputResult(data);
            }
        } catch (err: any) {
            setIsError(true);
            setOutputResult({
                error: err.name === 'SyntaxError' 
                    ? 'صيغة JSON غير صالحة. يرجى التأكد من كتابة المدخلات بشكل صحيح ومطابق للمثال.' 
                    : (err.message || 'حدث خطأ أثناء معالجة الطلب.')
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    // نسخ مخرجات الـ JSON إلى الحافظة
    const copyToClipboard = () => {
        if (!outputResult) return;
        navigator.clipboard.writeText(JSON.stringify(outputResult, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // تعيين البيانات المدخلة من المثال
    const loadExample = () => {
        setInteractiveInput({
            keyword: "قهوة مختصة الرياض"
        });
    };

    return (
        <div className="max-w-4xl mx-auto px-6 py-8 animate-in duration-300">
            {/* رأس الصفحة */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-black text-zinc-950 flex items-center gap-2">
                        <Sparkles className="text-black" size={26} />
                        بوت الكشف والتقييم الذكي (Keyword Analyzer Bot)
                    </h1>
                    <p className="text-zinc-500 text-xs mt-1.5 font-medium">
                        محلل SEO متخصص لتقييم صعوبة الكلمات المفتاحية واكتشاف فرص الكلمات منخفضة المنافسة بالاعتماد على مؤشرات allintitle.
                    </p>
                </div>
                {outputResult && (
                    <button
                        onClick={() => {
                            setOutputResult(null);
                            setIsError(false);
                            setInteractiveInput({ keyword: '' });
                        }}
                        className="flex items-center gap-1.5 py-2 px-4 rounded-xl border border-zinc-200 text-zinc-500 hover:text-black hover:bg-zinc-50 text-xs font-bold transition-all self-start md:self-auto"
                    >
                        <RefreshCw size={14} />
                        تحليل جديد
                    </button>
                )}
            </div>

            {/* محتوى الصفحة الرئيسي */}
            <div className="grid grid-cols-1 gap-8">
                
                {/* 1. لوحة الإدخال والتحكم */}
                {!outputResult && (
                    <div className="bg-white border border-zinc-200/80 rounded-[32px] p-8 shadow-xl shadow-zinc-100 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-24 h-24 bg-zinc-50 rounded-br-full pointer-events-none" />
                        
                        {/* التبديل بين نوعي الإدخال */}
                        <div className="flex bg-zinc-100 p-1 rounded-xl border border-zinc-200/50 max-w-sm mx-auto mb-8">
                            <button
                                onClick={() => setActiveTab('interactive')}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 text-center flex items-center justify-center gap-1.5 ${
                                    activeTab === 'interactive'
                                        ? "bg-white text-black shadow-sm"
                                        : "text-zinc-500 hover:text-black"
                                }`}
                            >
                                <Cpu size={14} />
                                الواجهة التفاعلية
                            </button>
                            <button
                                onClick={() => setActiveTab('json')}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 text-center flex items-center justify-center gap-1.5 ${
                                    activeTab === 'json'
                                        ? "bg-white text-black shadow-sm"
                                        : "text-zinc-500 hover:text-black"
                                }`}
                            >
                                <Terminal size={14} />
                                منفذ JSON المباشر
                            </button>
                        </div>

                        {/* التبويب الأول: نموذج الواجهة التفاعلية */}
                        {activeTab === 'interactive' && (
                            <form onSubmit={handleInteractiveSubmit} className="space-y-5 max-w-xl mx-auto">
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] font-black text-zinc-700">الكلمة المفتاحية (Keyword)</label>
                                        <button 
                                            type="button" 
                                            onClick={loadExample}
                                            className="text-[9px] font-black text-zinc-400 hover:text-black underline transition-colors"
                                        >
                                            تعبئة مثال تجريبي
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        placeholder="أدخل الكلمة المستهدفة (مثال: قهوة مختصة الرياض)"
                                        value={interactiveInput.keyword}
                                        onChange={(e) => setInteractiveInput({ ...interactiveInput, keyword: e.target.value })}
                                        className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-3 px-4 text-xs font-bold outline-none focus:border-black focus:bg-white text-zinc-800 transition-all shadow-inner"
                                    />
                                </div>

                                {/* Metrics fields removed as requested */}

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={isAnalyzing}
                                        className="w-full py-3.5 px-6 rounded-2xl bg-black hover:bg-zinc-800 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 disabled:bg-zinc-500"
                                    >
                                        {isAnalyzing ? (
                                            <>
                                                <RefreshCw className="animate-spin" size={14} />
                                                جاري التحليل واستخلاص النتائج...
                                            </>
                                        ) : (
                                            <>
                                                <Play size={14} />
                                                تحليل الكلمة وحساب المنافسة
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* التبويب الثاني: منفذ JSON المباشر */}
                        {activeTab === 'json' && (
                            <form onSubmit={handleJsonSubmit} className="space-y-5 max-w-xl mx-auto">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-700 block">أدخل البيانات بصيغة JSON</label>
                                    <textarea
                                        rows={6}
                                        value={jsonInput}
                                        onChange={(e) => setJsonInput(e.target.value)}
                                        className="w-full bg-zinc-950 text-emerald-400 font-mono text-xs p-4 rounded-2xl border border-zinc-800 focus:outline-none focus:border-emerald-600 transition-all"
                                        placeholder={`{\n  "keyword": "الكلمة المفتاحية",\n  "allintitle": 0,\n  "exact_allintitle": 0\n}`}
                                    />
                                </div>

                                <div>
                                    <button
                                        type="submit"
                                        disabled={isAnalyzing}
                                        className="w-full py-3.5 px-6 rounded-2xl bg-black hover:bg-zinc-800 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 disabled:bg-zinc-500"
                                    >
                                        {isAnalyzing ? (
                                            <>
                                                <RefreshCw className="animate-spin" size={14} />
                                                جاري تشغيل البوت...
                                            </>
                                        ) : (
                                            <>
                                                <Play size={14} />
                                                تشغيل البوت ومعالجة الـ JSON
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                )}

                {/* 2. شاشة عرض النتائج */}
                {outputResult && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        
                        {/* حالة الخطأ */}
                        {isError ? (
                            <div className="bg-rose-50 border border-rose-200 rounded-[24px] p-6 text-rose-800">
                                <div className="flex items-center gap-3 mb-4">
                                    <AlertCircle className="text-rose-600" size={24} />
                                    <div>
                                        <h3 className="text-xs font-black">فشل التحليل - استجابة البوت</h3>
                                        <span className="text-[9px] font-bold text-rose-500">تم رفض المدخلات لعدم مطابقتها للشروط</span>
                                    </div>
                                </div>
                                <p className="text-xs font-bold leading-relaxed mb-4">{outputResult.error}</p>
                                
                                <div className="border-t border-rose-100 pt-4">
                                    <span className="text-[9px] font-black text-rose-600 uppercase tracking-wider block mb-2">مخرجات الخطأ (JSON Output):</span>
                                    <div className="bg-zinc-950 text-rose-400 font-mono text-xs p-4 rounded-xl relative">
                                        <pre className="overflow-x-auto whitespace-pre-wrap">{JSON.stringify(outputResult, null, 2)}</pre>
                                        <button 
                                            onClick={copyToClipboard}
                                            className="absolute top-3 left-3 p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:text-white transition-colors"
                                            title="نسخ JSON"
                                        >
                                            {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // حالة النجاح
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                
                                {/* الكارت المرئي التفاعلي */}
                                <div className="bg-white border border-zinc-200 rounded-[28px] p-6 shadow-md flex flex-col justify-between relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-24 h-24 bg-zinc-50 rounded-br-full pointer-events-none" />
                                    
                                    <div>
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider block mb-1">الكلمة المحللة</span>
                                                <h2 className="text-base font-black text-zinc-900">{outputResult.keyword}</h2>
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black border uppercase tracking-wider ${
                                                outputResult.difficulty === 'Very Easy' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                outputResult.difficulty === 'Easy' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                outputResult.difficulty === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                'bg-rose-50 text-rose-700 border-rose-100'
                                            }`}>
                                                {outputResult.difficulty === 'Very Easy' ? 'فرصة ممتازة (Very Easy)' :
                                                 outputResult.difficulty === 'Easy' ? 'سهلة (Easy)' :
                                                 outputResult.difficulty === 'Medium' ? 'متوسطة (Medium)' :
                                                 'صعبة (Hard)'}
                                            </span>
                                        </div>

                                        {/* دائرة النسبة والدرجة */}
                                        <div className="flex items-center gap-6 my-6 p-4 bg-zinc-50 border border-zinc-100 rounded-2xl">
                                            <div className="w-16 h-16 rounded-full border-4 border-black/5 flex items-center justify-center relative shrink-0">
                                                {/* Gauge ring wrapper */}
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <span className="text-base font-black text-zinc-950">{outputResult.score}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-black text-zinc-400 block mb-0.5">مدى قوة الكلمة</span>
                                                <p className="text-xs font-bold text-zinc-800">
                                                    {outputResult.score === 100 ? 'فرصة ممتازة وسهلة جداً للتصدر (100/100)' :
                                                     outputResult.score === 50 ? 'فرصة متوسطة الصعوبة والقوة (50/100)' :
                                                     'فرصة صعبة ومنافسة قوية جداً (0/100)'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* التفسير والتوصية */}
                                        <div className="space-y-4">
                                            <div>
                                                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider block mb-1">تفسير البوت والسبب:</span>
                                                <p className="text-xs font-bold text-zinc-700 leading-relaxed">{outputResult.reason}</p>
                                            </div>
                                            
                                            <div className="pt-2 border-t border-zinc-100">
                                                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider block mb-1">التوصية العملية (SEO Recommendation):</span>
                                                <div className="flex items-start gap-1.5 text-xs font-black text-zinc-900">
                                                    <Info size={14} className="mt-0.5 text-zinc-500 shrink-0" />
                                                    <p className="leading-relaxed">{outputResult.recommendation}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* تفاصيل المدخلات للكلمة */}
                                    <div className="mt-6 pt-4 border-t border-zinc-100 grid grid-cols-2 gap-4 text-center">
                                        <div className="bg-zinc-50 p-2 rounded-xl border border-zinc-100">
                                            <span className="text-[10px] font-black text-zinc-500 block mb-0.5">allintitle:</span>
                                            <span className="text-xs font-black text-zinc-900">{outputResult.allintitle}</span>
                                        </div>
                                        <div className="bg-zinc-50 p-2 rounded-xl border border-zinc-100">
                                            <span className="text-[10px] font-black text-zinc-500 block mb-0.5">allintitle:&quot;&quot;</span>
                                            <span className="text-xs font-black text-zinc-900">{outputResult.exact_allintitle}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* مخرجات JSON البرمجية */}
                                <div className="bg-zinc-950 border border-zinc-900 rounded-[28px] p-6 shadow-md flex flex-col justify-between text-left relative">
                                    <div className="absolute top-4 right-4 flex items-center gap-1.5 select-none direction-ltr">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest font-black">JSON Response</span>
                                    </div>
                                    
                                    <div className="flex-1 mt-6">
                                        <pre className="text-emerald-400 font-mono text-xs overflow-x-auto whitespace-pre-wrap selection:bg-zinc-800">
                                            {JSON.stringify(outputResult, null, 2)}
                                        </pre>
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-zinc-900 flex justify-between items-center direction-rtl">
                                        <span className="text-[9px] font-bold text-zinc-500">صيغة إرجاع مخرجات البوت الرسمية</span>
                                        <button 
                                            onClick={copyToClipboard}
                                            className="flex items-center gap-1.5 py-2 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-850 text-xs font-bold transition-all shadow-sm"
                                        >
                                            {copied ? (
                                                <>
                                                    <Check size={12} className="text-emerald-500" />
                                                    <span>تم النسخ!</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Copy size={12} />
                                                    <span>نسخ الـ JSON</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
