'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    LayoutDashboard,
    Store,
    Search,
    Globe,
    Users,
    History,
    Settings,
    ChevronLeft,
    Terminal,
    CheckCircle2,
    AlertCircle,
    ShieldCheck,
    Layers,
    Cpu,
    FileSpreadsheet
} from 'lucide-react';

export default function CentralDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [isSerperConfigured, setIsSerperConfigured] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/stats');
            const data = await res.json();
            if (data.success) {
                setStats(data.stats);
                setIsSerperConfigured(data.isSerperConfigured);
            }
        } catch (e) {
            console.error('Failed to load dashboard stats:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        // Refresh statistics every 15 seconds for hot-reloading dashboard feel
        const interval = setInterval(fetchStats, 15000);
        return () => clearInterval(interval);
    }, []);

    // Color theme helper
    const cardColorMap = {
        salla: 'from-orange-500/10 to-orange-600/5 hover:border-orange-500/40 text-orange-600 border-orange-100',
        mazeed: 'from-emerald-500/10 to-emerald-600/5 hover:border-emerald-500/40 text-emerald-600 border-emerald-100',
        maps: 'from-blue-500/10 to-blue-600/5 hover:border-blue-500/40 text-blue-600 border-blue-100',
    };

    return (
        <div className="space-y-10 animate-fade-in pb-12">
            
            {/* 1. Header & Glowing Welcome Hero Banner */}
            <div className="relative overflow-hidden rounded-[36px] bg-slate-900 p-8 md:p-12 text-white shadow-2xl shadow-slate-900/30">
                {/* Background decorative glowing circles */}
                <div className="absolute -left-20 -top-20 w-80 h-80 rounded-full bg-orange-600/15 blur-[100px] pointer-events-none" />
                <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-blue-600/15 blur-[100px] pointer-events-none" />
                <div className="absolute left-1/3 top-1/4 w-60 h-60 rounded-full bg-emerald-600/10 blur-[80px] pointer-events-none" />

                <div className="relative z-10 max-w-3xl">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/10 backdrop-blur-md mb-6">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-bold text-slate-200">مركز التحكم وإدارة العمليات الموحد</span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
                        أهلاً بك في منصة <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-blue-400 bg-clip-text text-transparent">SallaHunter Pro</span>
                    </h1>
                    <p className="mt-4 text-slate-300 font-medium text-lg leading-relaxed">
                        لوحة الإدارة المركزية الشاملة لكواشط البيانات الاستخباراتية. يمكنك الآن مراقبة إجمالي المتاجر المكتشفة، ودمج وتصفية أوراق الإكسل، وتوجيه محركات الكشط بمرونة كاملة من مكان واحد.
                    </p>
                </div>
            </div>

            {/* 2. Consolidated Live Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Card 1: Total Leads */}
                <div className="bg-white border border-slate-200/80 p-6 rounded-[28px] shadow-sm hover:shadow-md transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-slate-500/5 rounded-bl-[100px]" />
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3.5 rounded-2xl bg-slate-900 text-white group-hover:scale-110 transition-transform duration-300">
                            <Users size={22} />
                        </div>
                        <div className="text-3xl font-black text-slate-900 tracking-tighter">
                            {loading ? (
                                <span className="inline-block w-8 h-8 rounded-lg bg-slate-100 animate-pulse" />
                            ) : (
                                stats?.totalLeads?.toLocaleString('ar-EG') || 0
                            )}
                        </div>
                    </div>
                    <div className="text-slate-500 font-bold text-xs uppercase tracking-wide">إجمالي العملاء المكتشفين</div>
                    <div className="text-[10px] text-slate-400 font-medium mt-1">العدد الإجمالي لصفوف المتاجر والمنشآت المصفاة</div>
                </div>

                {/* Card 2: Salla Leads */}
                <Link href="/1" className="bg-white border border-slate-200/80 p-6 rounded-[28px] shadow-sm hover:shadow-md hover:border-orange-200 transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden block">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-bl-[100px]" />
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3.5 rounded-2xl bg-orange-50 text-orange-600 group-hover:scale-110 transition-transform duration-300">
                            <Store size={22} />
                        </div>
                        <div className="text-3xl font-black text-slate-900 tracking-tighter">
                            {loading ? (
                                <span className="inline-block w-8 h-8 rounded-lg bg-slate-100 animate-pulse" />
                            ) : (
                                stats?.sallaLeads?.toLocaleString('ar-EG') || 0
                            )}
                        </div>
                    </div>
                    <div className="text-slate-700 font-bold text-xs uppercase tracking-wide">عملاء منصة سلة</div>
                    <div className="text-[10px] text-orange-600 font-medium mt-1">
                        {stats?.sallaSheets || 0} أوراق عمل نشطة في الإكسل
                    </div>
                </Link>

                {/* Card 3: Mazeed Leads */}
                <Link href="/2" className="bg-white border border-slate-200/80 p-6 rounded-[28px] shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden block">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-[100px]" />
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform duration-300">
                            <Search size={22} />
                        </div>
                        <div className="text-3xl font-black text-slate-900 tracking-tighter">
                            {loading ? (
                                <span className="inline-block w-8 h-8 rounded-lg bg-slate-100 animate-pulse" />
                            ) : (
                                stats?.mazeedLeads?.toLocaleString('ar-EG') || 0
                            )}
                        </div>
                    </div>
                    <div className="text-slate-700 font-bold text-xs uppercase tracking-wide">عملاء منصة مزيد</div>
                    <div className="text-[10px] text-emerald-600 font-medium mt-1">
                        {stats?.mazeedSheets || 0} أوراق عمل نشطة في الإكسل
                    </div>
                </Link>

                {/* Card 4: Google Maps Leads */}
                <Link href="/3" className="bg-white border border-slate-200/80 p-6 rounded-[28px] shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden block">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-[100px]" />
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3.5 rounded-2xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform duration-300">
                            <Globe size={22} />
                        </div>
                        <div className="text-3xl font-black text-slate-900 tracking-tighter">
                            {loading ? (
                                <span className="inline-block w-8 h-8 rounded-lg bg-slate-100 animate-pulse" />
                            ) : (
                                stats?.mapsLeads?.toLocaleString('ar-EG') || 0
                            )}
                        </div>
                    </div>
                    <div className="text-slate-700 font-bold text-xs uppercase tracking-wide">عملاء خرائط قوقل</div>
                    <div className="text-[10px] text-blue-600 font-medium mt-1">
                        {stats?.mapsSheets || 0} أوراق عمل نشطة في الإكسل
                    </div>
                </Link>

            </div>

            {/* 3. Interactive Engine Launchpads Grid */}
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 rounded-full bg-slate-900" />
                    <h2 className="text-2xl font-black text-slate-900">بوابات محركات الاستخراج الذكية</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Launchpad Card 1: Salla */}
                    <div className="bg-white border border-slate-200/80 rounded-[32px] overflow-hidden shadow-sm hover:shadow-xl hover:border-orange-200 transition-all duration-500 flex flex-col group">
                        <div className="p-8 flex-1">
                            <div className="flex items-center justify-between mb-6">
                                <div className="p-4 rounded-2xl bg-orange-50 text-orange-600 shadow-inner group-hover:scale-110 transition-transform duration-300">
                                    <Store size={28} />
                                </div>
                                <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">
                                    نشط وجاهز
                                </span>
                            </div>

                            <h3 className="text-2xl font-extrabold text-slate-900 group-hover:text-orange-600 transition-colors duration-300">
                                كاشط سلة ومحلي
                            </h3>
                            <p className="mt-4 text-slate-500 font-medium text-sm leading-relaxed">
                                البوابة المخصصة للتنقيب التلقائي في متاجر **سلة** وتطبيق **محلي**. يدعم الكشط بالكلمات المفتاحية للمنتجات والتصنيفات بدقة فائقة مع إمكانية جدولة قوائم الانتظار.
                            </p>

                            <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                                <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                                    <span>المخرجات:</span>
                                    <span className="text-slate-900">إكسل مصفى وملف نهائي</span>
                                </div>
                                <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                                    <span>التخزين:</span>
                                    <span className="font-mono text-orange-600 font-medium">Mahally_Leads.xlsx</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 border-t border-slate-100">
                            <Link 
                                href="/1"
                                className="flex items-center justify-center gap-2 w-full py-4 px-6 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm transition-all duration-300 shadow-md shadow-orange-600/10 hover:shadow-lg hover:shadow-orange-600/20"
                            >
                                <span>دخول محرك الكشط</span>
                                <ChevronLeft size={16} className="transition-transform duration-300 group-hover:-translate-x-1" />
                            </Link>
                        </div>
                    </div>

                    {/* Launchpad Card 2: Mazeed */}
                    <div className="bg-white border border-slate-200/80 rounded-[32px] overflow-hidden shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all duration-500 flex flex-col group">
                        <div className="p-8 flex-1">
                            <div className="flex items-center justify-between mb-6">
                                <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-600 shadow-inner group-hover:scale-110 transition-transform duration-300">
                                    <Search size={28} />
                                </div>
                                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                                    نشط وجاهز
                                </span>
                            </div>

                            <h3 className="text-2xl font-extrabold text-slate-900 group-hover:text-emerald-600 transition-colors duration-300">
                                كاشط منصة مزيد
                            </h3>
                            <p className="mt-4 text-slate-500 font-medium text-sm leading-relaxed">
                                محرك استخراج المتاجر التابعة لمنصة **زد** و**مزيد**. يتيح لك البحث عن الأنشطة التجارية واستخلاص الروابط ومن ثم إجراء كشط عميق لقنوات التواصل الاجتماعي وهواتف المبيعات.
                            </p>

                            <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                                <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                                    <span>المخرجات:</span>
                                    <span className="text-slate-900">إكسل مصفى وملف نهائي</span>
                                </div>
                                <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                                    <span>التخزين:</span>
                                    <span className="font-mono text-emerald-600 font-medium">Mazeed_Leads.xlsx</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 border-t border-slate-100">
                            <Link 
                                href="/2"
                                className="flex items-center justify-center gap-2 w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all duration-300 shadow-md shadow-emerald-600/10 hover:shadow-lg hover:shadow-emerald-600/20"
                            >
                                <span>دخول محرك الكشط</span>
                                <ChevronLeft size={16} className="transition-transform duration-300 group-hover:-translate-x-1" />
                            </Link>
                        </div>
                    </div>

                    {/* Launchpad Card 3: Google Maps */}
                    <div className="bg-white border border-slate-200/80 rounded-[32px] overflow-hidden shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-500 flex flex-col group">
                        <div className="p-8 flex-1">
                            <div className="flex items-center justify-between mb-6">
                                <div className="p-4 rounded-2xl bg-blue-50 text-blue-600 shadow-inner group-hover:scale-110 transition-transform duration-300">
                                    <Globe size={28} />
                                </div>
                                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                                    نشط وجاهز
                                </span>
                            </div>

                            <h3 className="text-2xl font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors duration-300">
                                كاشط خرائط قوقل
                            </h3>
                            <p className="mt-4 text-slate-500 font-medium text-sm leading-relaxed">
                                محرك استخبارات الأعمال الجغرافي. يستخرج المحلات والأنشطة التجارية مباشرة من **خرائط قوقل** مع إثراء عميق وعالي الدقة للبريد الإلكتروني وحسابات التواصل والواتساب.
                            </p>

                            <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                                <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                                    <span>المخرجات:</span>
                                    <span className="text-slate-900">خرائط قوقل وإثراء ويب</span>
                                </div>
                                <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                                    <span>التخزين:</span>
                                    <span className="font-mono text-blue-600 font-medium">Google_Maps_Leads.xlsx</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 border-t border-slate-100">
                            <Link 
                                href="/3"
                                className="flex items-center justify-center gap-2 w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all duration-300 shadow-md shadow-blue-600/10 hover:shadow-lg hover:shadow-blue-600/20"
                            >
                                <span>دخول محرك الكشط</span>
                                <ChevronLeft size={16} className="transition-transform duration-300 group-hover:-translate-x-1" />
                            </Link>
                        </div>
                    </div>

                </div>
            </div>

            {/* 4. Technical specifications & System Monitor */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Tech specifications card */}
                <div className="bg-white border border-slate-200/80 p-8 rounded-[32px] shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-900">
                                <Cpu size={20} />
                            </div>
                            <h3 className="text-lg font-black text-slate-900">مواصفات وسلامة النظام</h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3">
                                <ShieldCheck className="text-emerald-600 shrink-0" size={18} />
                                <div>
                                    <div className="text-[10px] text-slate-400 font-bold">بنية الأكواد</div>
                                    <div className="text-xs font-bold text-slate-700">TypeScript 5.3.3</div>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3">
                                <Layers className="text-blue-600 shrink-0" size={18} />
                                <div>
                                    <div className="text-[10px] text-slate-400 font-bold">تقنية الويب</div>
                                    <div className="text-xs font-bold text-slate-700">Next.js 14.0.4 (App Router)</div>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3">
                                <Terminal className="text-indigo-600 shrink-0" size={18} />
                                <div>
                                    <div className="text-[10px] text-slate-400 font-bold">مستكشف الكشط</div>
                                    <div className="text-xs font-bold text-slate-700">Playwright & Axios</div>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3">
                                <FileSpreadsheet className="text-orange-600 shrink-0" size={18} />
                                <div>
                                    <div className="text-[10px] text-slate-400 font-bold">محرك الإكسل</div>
                                    <div className="text-xs font-bold text-slate-700">ExcelJS & SheetJS</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-100 text-[10px] text-slate-400 font-medium">
                        تعتمد بنية النظام على التشغيل المحلي (Local Shell) داخل بيئة Electron لتسهيل التفاعل المباشر مع ملفات Excel دون حظر الخوادم الخارجية.
                    </div>
                </div>

                {/* System Monitor & API keys status */}
                <div className="bg-white border border-slate-200/80 p-8 rounded-[32px] shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-900">
                                <Terminal size={20} />
                            </div>
                            <h3 className="text-lg font-black text-slate-900">مراقب الربط الخارجي والمفاتيح</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-xs font-bold text-slate-700">مستكشف المتاجر المحلية</span>
                                </div>
                                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                                    جاهز ومتصل
                                </span>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-xs font-bold text-slate-700">محرك إثراء قنوات الاتصال</span>
                                </div>
                                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                                    جاهز ومتصل
                                </span>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                <div className="flex items-center gap-3">
                                    {isSerperConfigured === null ? (
                                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-slate-300 animate-pulse" />
                                    ) : isSerperConfigured ? (
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                    ) : (
                                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                                    )}
                                    <span className="text-xs font-bold text-slate-700">مفتاح Serper.dev API</span>
                                </div>
                                {isSerperConfigured === null ? (
                                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold">
                                        جاري الفحص...
                                    </span>
                                ) : isSerperConfigured ? (
                                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                                        مفعل ونشط
                                    </span>
                                ) : (
                                    <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
                                        غير مكون (تنبيه)
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {isSerperConfigured === false && (
                        <div className="mt-4 p-3.5 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-2.5 text-amber-800 text-xs font-medium">
                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                            <span>
                                تنبيه: مفتاح Serper.dev غير متوفر في ملف `.env`. يرجى إعداده لتفعيل كاشط خرائط قوقل بالشكل الصحيح.
                            </span>
                        </div>
                    )}

                    {isSerperConfigured === true && (
                        <div className="mt-4 p-3.5 bg-emerald-50/50 border border-emerald-100/50 rounded-2xl flex items-start gap-2.5 text-emerald-800 text-xs font-medium">
                            <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600" />
                            <span>
                                جميع المفاتيح والربط الخارجي تعمل بكفاءة تامة. النظام جاهز تماماً للعمليات الضخمة وجدولة المهام.
                            </span>
                        </div>
                    )}
                </div>

            </div>

        </div>
    );
}
