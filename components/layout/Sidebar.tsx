'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Users,
    History,
    Settings,
    Search,
    Store,
    Globe,
    Sparkles,
    BookOpen,
    Plus,
    Trash2,
    Database
} from 'lucide-react';

const navigation = [
    { name: 'الرئيسية (مركز الإدارة)', href: '/', icon: LayoutDashboard },
    { name: 'كاشط سلة ومحلي', href: '/1', icon: Store },
    { name: 'كاشط منصة مزيد', href: '/2', icon: Search },
    { name: 'كاشط خرائط قوقل', href: '/3', icon: Globe },
    { name: 'المتاجر المكتشفة', href: '/leads', icon: Users },
    { name: 'سجل العمليات', href: '/history', icon: History },
    { name: 'الإعدادات والربط', href: '/settings', icon: Settings },
];

const DEFAULT_CLIENTS: any[] = [];

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const activeClientId = searchParams.get('client');

    const [totalLeads, setTotalLeads] = useState<number | null>(null);
    const [activeMainTab, setActiveMainTab] = useState<'keywords' | 'improve' | 'encyclopedia'>('keywords');

    // --- حالات إدارة العملاء بالجانب ---
    const [clients, setClients] = useState<any[]>([]);
    const [usingFallback, setUsingFallback] = useState(false);
    const [dbChecking, setDbChecking] = useState(true);
    const [showAddClientModal, setShowAddClientModal] = useState(false);
    const [newClientName, setNewClientName] = useState('');
    const [newClientWebsite, setNewClientWebsite] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- مزامنة التبويب النشط ---
    useEffect(() => {
        if (pathname.startsWith('/improve')) {
            setActiveMainTab('improve');
        } else if (pathname.startsWith('/encyclopedia')) {
            setActiveMainTab('encyclopedia');
        } else {
            setActiveMainTab('keywords');
        }
    }, [pathname]);

    // --- استدعاء إحصائيات الكاشط العامة ---
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/stats');
                const data = await res.json();
                if (data.success && data.stats) {
                    setTotalLeads(data.stats.totalLeads);
                }
            } catch (e) {
                console.error('Failed to fetch sidebar statistics:', e);
            }
        };
        fetchStats();
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, []);

    // --- استدعاء قائمة العملاء ومزامنتها ---
    const loadClients = async () => {
        try {
            setDbChecking(true);
            const { data, error } = await supabase
                .from('seo_clients')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsingFallback(false);
            if (data && data.length > 0) {
                setClients(data);
            } else {
                setClients([]);
            }
        } catch (e) {
            setUsingFallback(true);
            const saved = localStorage.getItem('seo_clients');
            if (saved) {
                setClients(JSON.parse(saved));
            } else {
                setClients([]);
                localStorage.setItem('seo_clients', JSON.stringify([]));
            }
        } finally {
            setDbChecking(false);
        }
    };

    useEffect(() => {
        loadClients();
    }, [pathname, searchParams]);

    // --- إضافة عميل جديد ---
    const handleAddClient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newClientName.trim() || isSubmitting) return;

        const generatedId = usingFallback 
            ? `client-${Date.now()}` 
            : (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID 
                ? window.crypto.randomUUID() 
                : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                    const r = Math.random() * 16 | 0;
                    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
                })
            );

        const newClient = {
            id: generatedId,
            name: newClientName,
            website: newClientWebsite || 'غير محدد'
        };

        let addedId = '';

        try {
            setIsSubmitting(true);
            if (usingFallback) {
                const saved = JSON.parse(localStorage.getItem('seo_clients') || '[]');
                const updated = [...saved, newClient];
                localStorage.setItem('seo_clients', JSON.stringify(updated));
                setClients(updated);
                addedId = newClient.id || '';
            } else {
                const { data, error } = await supabase
                    .from('seo_clients')
                    .insert([newClient])
                    .select();
                if (error) throw error;
                if (data && data.length > 0) {
                    setClients([data[0], ...clients]);
                    addedId = data[0].id;
                }
            }

            setNewClientName('');
            setNewClientWebsite('');
            setShowAddClientModal(false);
            
            if (addedId) {
                router.push(`/improve?client=${addedId}`);
            }
        } catch (err: any) {
            console.error('Failed to add client from sidebar:', err);
            const errMsg = err?.message || '';
            if (errMsg.includes('relation') && errMsg.includes('does not exist')) {
                alert('خطأ: الجداول غير موجودة في قاعدة بيانات Supabase.\n\nيرجى تشغيل ملف supabase_schema.sql داخل الـ SQL Editor في Supabase لتهيئة الجداول أولاً.');
            } else {
                alert(`خطأ في إدخال البيانات: ${errMsg || 'تعذر الاتصال بقاعدة البيانات'}`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- حذف عميل ---
    const handleDeleteClient = async (id: string) => {
        if (!confirm('هل أنت متأكد من رغبتك في حذف هذا العميل وجميع كلماته وملاحظاته نهائياً؟')) return;

        if (usingFallback) {
            const saved = JSON.parse(localStorage.getItem('seo_clients') || '[]');
            const updated = saved.filter((c: any) => c.id !== id);
            localStorage.setItem('seo_clients', JSON.stringify(updated));
            setClients(updated);
            
            const localKDB = JSON.parse(localStorage.getItem('seo_keywords_database') || '[]');
            const localCK = JSON.parse(localStorage.getItem('seo_client_keywords') || '[]');
            const localLogs = JSON.parse(localStorage.getItem('seo_improvement_logs') || '[]');

            localStorage.setItem('seo_keywords_database', JSON.stringify(localKDB.filter((item: any) => item.client_id !== id)));
            localStorage.setItem('seo_client_keywords', JSON.stringify(localCK.filter((item: any) => item.client_id !== id)));
            localStorage.setItem('seo_improvement_logs', JSON.stringify(localLogs.filter((item: any) => item.client_id !== id)));
        } else {
            try {
                const { error } = await supabase.from('seo_clients').delete().eq('id', id);
                if (error) throw error;
                setClients(clients.filter(c => c.id !== id));
            } catch (e) {
                console.error(e);
            }
        }

        if (activeClientId === id) {
            router.push('/improve');
        }
    };

    return (
        <aside className="fixed inset-y-0 right-0 z-50 w-72 bg-white border-l border-zinc-200 flex flex-col">
            {/* Logo */}
            <div className="flex items-center justify-between px-6 py-6 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                    <img 
                        src="/icon.png" 
                        alt="شعار نقيب" 
                        className="h-4 w-4 object-contain select-none" 
                    />
                    <img 
                        src="/logo.png" 
                        alt="نقيب" 
                        className="h-7 w-auto object-contain select-none" 
                    />
                </div>
                <div>
                    <span className="px-2 py-0.5 rounded bg-black text-white text-[9px] font-black uppercase tracking-wider">
                        PRO
                    </span>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="mx-6 my-6 p-5 bg-black text-white rounded-2xl border border-zinc-900 shadow-md relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-20 h-20 bg-zinc-800/10 rounded-br-full pointer-events-none" />
                <div className="flex items-center justify-between mb-2.5 relative z-10">
                    <span className="text-[11px] font-bold text-zinc-400">إجمالي العملاء المكتشفين</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="text-3xl font-black tracking-tighter relative z-10">
                    {totalLeads !== null ? totalLeads.toLocaleString('ar-EG') : '...'}
                </div>
                <div className="text-[10px] text-zinc-400 font-medium mt-2 relative z-10 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-zinc-700" />
                    تحديث حي وتلقائي للملفات
                </div>
            </div>

            {/* Main Tabs Segmented Switch */}
            <div className="px-4 mb-4">
                <div className="flex bg-zinc-100 p-1 rounded-xl border border-zinc-200/50">
                    <button
                        onClick={() => {
                            setActiveMainTab('keywords');
                            router.push('/');
                        }}
                        className={cn(
                            "flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 text-center",
                            activeMainTab === 'keywords'
                                ? "bg-white text-black shadow-sm"
                                : "text-zinc-500 hover:text-black hover:bg-zinc-50/50"
                        )}
                    >
                        بيانات
                    </button>
                    <button
                        onClick={() => {
                            setActiveMainTab('improve');
                            router.push('/improve');
                        }}
                        className={cn(
                            "flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 text-center",
                            activeMainTab === 'improve'
                                ? "bg-white text-black shadow-sm"
                                : "text-zinc-500 hover:text-black hover:bg-zinc-50/50"
                        )}
                    >
                        تحسين
                    </button>
                    <button
                        onClick={() => {
                            setActiveMainTab('encyclopedia');
                            router.push('/encyclopedia');
                        }}
                        className={cn(
                            "flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 text-center",
                            activeMainTab === 'encyclopedia'
                                ? "bg-white text-black shadow-sm"
                                : "text-zinc-500 hover:text-black hover:bg-zinc-50/50"
                        )}
                    >
                        موسوعة
                    </button>
                </div>
            </div>

            {/* Navigation & CRM List */}
            <nav className="flex-1 px-4 py-2 space-y-1.5 overflow-y-auto flex flex-col justify-start">
                
                {/* 1. قائمة التبويب الأول (أدوات الكشط) */}
                {activeMainTab === 'keywords' && (
                    <div className="space-y-1.5 animate-in">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        'flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group',
                                        isActive
                                            ? 'bg-black text-white shadow-lg shadow-black/10'
                                            : 'text-zinc-600 hover:bg-zinc-50 hover:text-black'
                                    )}
                                >
                                    <item.icon
                                        size={18}
                                        className={cn(
                                            'transition-transform duration-300',
                                            isActive ? 'scale-110' : 'group-hover:scale-110'
                                        )}
                                    />
                                    <span className="font-bold text-xs">{item.name}</span>
                                </Link>
                            );
                        })}
                    </div>
                )}

                {/* 2. قائمة التبويب الثاني (لوحة التحكم وإدارة العملاء) */}
                {activeMainTab === 'improve' && (
                    <div className="space-y-4 animate-in">
                        <div className="flex items-center justify-between px-2 mb-2">
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">عملاء السيو النشطين</span>
                            <button
                                onClick={() => setShowAddClientModal(true)}
                                className="p-1 rounded-lg bg-black text-white hover:bg-zinc-800 transition-colors"
                                title="إضافة عميل جديد"
                            >
                                <Plus size={13} />
                            </button>
                        </div>
                        
                        {dbChecking && clients.length === 0 ? (
                            <div className="space-y-2 py-4">
                                <span className="inline-block w-full h-8 bg-zinc-50 animate-pulse rounded-xl" />
                                <span className="inline-block w-full h-8 bg-zinc-50 animate-pulse rounded-xl" />
                            </div>
                        ) : clients.length === 0 ? (
                            <div className="text-center py-8 text-zinc-400">
                                <Users className="mx-auto mb-2 text-zinc-300 animate-pulse" size={20} />
                                <span className="text-[10px] font-bold">لا يوجد عملاء مضافين</span>
                            </div>
                        ) : (
                            <div className="space-y-1.5 max-h-[380px] overflow-y-auto custom-scrollbar">
                                {clients.map((c) => {
                                    const isActive = activeClientId === c.id;
                                    return (
                                        <div
                                            key={c.id}
                                            className={cn(
                                                "flex items-center justify-between px-3 py-2.5 rounded-2xl group transition-all duration-200 cursor-pointer",
                                                isActive
                                                    ? "bg-black text-white shadow-md shadow-black/10"
                                                    : "text-zinc-600 hover:bg-zinc-50 hover:text-black"
                                            )}
                                            onClick={() => router.push(`/improve?client=${c.id}`)}
                                        >
                                            <div className="flex-1 min-w-0 pr-1 text-right">
                                                <div className="text-xs font-bold truncate">{c.name}</div>
                                                <div className={cn("text-[9px] font-medium truncate mt-0.5", isActive ? "text-zinc-400" : "text-zinc-400")}>
                                                    {c.website}
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteClient(c.id);
                                                }}
                                                className={cn(
                                                    "p-1 rounded-lg transition-colors mr-2",
                                                    isActive 
                                                        ? "text-zinc-400 hover:text-white hover:bg-zinc-800" 
                                                        : "text-zinc-300 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                )}
                                                title="حذف العميل"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* شارة فنية لحالة الاتصال بنهاية القائمة */}
                        <div className="pt-2 border-t border-zinc-100 flex items-center justify-between px-2 text-[9px] font-black text-zinc-400">
                            <span className="flex items-center gap-1">
                                <Database size={10} className={cn(usingFallback ? "text-amber-500" : "text-emerald-500")} />
                                <span>{usingFallback ? 'تخزين محلي' : 'Supabase سحابي'}</span>
                            </span>
                            <span>{clients.length} عملاء</span>
                        </div>
                    </div>
                )}

                {/* 3. قائمة التبويب الثالث (موسوعة الكلمات) */}
                {activeMainTab === 'encyclopedia' && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-8 animate-in">
                        <div className="w-11 h-11 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center mb-4 text-zinc-400">
                            <BookOpen size={20} className="text-zinc-950" />
                        </div>
                        <h3 className="font-black text-zinc-900 text-sm mb-1.5">موسوعة الكلمات</h3>
                        <p className="text-[11px] text-zinc-400 leading-relaxed max-w-[200px] mb-4">
                            المكتبة المرجعية المتكاملة للمصطلحات، البيانات التحليلية، واستراتيجيات الترويج بالكلمات.
                        </p>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200/60 text-[9px] font-black text-zinc-500">
                            <span>قريباً</span>
                            <span>◆</span>
                            <span>Soon</span>
                        </div>
                    </div>
                )}
            </nav>

            {/* User */}
            <div className="p-4 border-t border-zinc-100">
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-100">
                    <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-white font-bold text-sm">
                        م
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-black truncate">مستخدم محترف</div>
                        <div className="text-xs text-zinc-500 font-medium">خطة احترافية</div>
                    </div>
                </div>
            </div>

            {/* مودال إضافة عميل جديد من شريط الجنب */}
            {showAddClientModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4 animate-in duration-250">
                    <div className="bg-white border border-slate-100 rounded-[32px] w-full max-w-sm p-7 shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
                        <div className="mb-5">
                            <h3 className="text-lg font-black text-slate-900">إضافة عميل جديد</h3>
                            <p className="text-[9px] text-slate-400 font-bold mt-1">أدخل معلومات المتجر أو المؤسسة لتهيئة السيو وإدارة كلماته</p>
                        </div>

                        <form onSubmit={handleAddClient} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-600">اسم العميل (المتجر)</label>
                                <input 
                                    type="text" 
                                    required
                                    placeholder="مثال: متجر بن وسكر للقهوة"
                                    value={newClientName}
                                    onChange={(e) => setNewClientName(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl py-2.5 px-4 text-xs font-bold outline-none focus:border-black focus:bg-white text-slate-800 transition-all"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-600">رابط الموقع (اختياري)</label>
                                <input 
                                    type="text" 
                                    placeholder="مثال: bonsugar.com"
                                    value={newClientWebsite}
                                    onChange={(e) => setNewClientWebsite(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl py-2.5 px-4 text-xs font-bold outline-none focus:border-black focus:bg-white text-slate-800 transition-all"
                                />
                            </div>

                            <div className="flex items-center gap-3 pt-3">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 py-3 px-5 rounded-2xl bg-black hover:bg-zinc-800 text-white font-bold text-xs transition-all shadow-sm disabled:bg-zinc-500"
                                >
                                    {isSubmitting ? 'جاري الإضافة...' : 'إضافة العميل'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowAddClientModal(false)}
                                    className="py-3 px-5 rounded-2xl border border-zinc-200 text-zinc-500 hover:text-black hover:bg-zinc-50 font-bold text-xs transition-all"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </aside>
    );
}
