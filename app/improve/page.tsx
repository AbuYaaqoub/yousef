'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useSearchParams, useRouter } from 'next/navigation';
import { Users, Plus, Database, TrendingUp, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

// استيراد المكونات الفرعية المقسمة
import { KeywordsDatabase } from '@/components/improve/KeywordsDatabase';
import { ClientKeywords } from '@/components/improve/ClientKeywords';
import { SeoAnalytics } from '@/components/improve/SeoAnalytics';
import { ImprovementLogs } from '@/components/improve/ImprovementLogs';

// === أنواع البيانات ===
interface Client {
    id: string;
    name: string;
    website: string;
    created_at?: string;
}

interface KeywordDBItem {
    id: string;
    client_id: string;
    keyword: string;
    kd: number;
    volume: number;
    platform: string;
    source_site: string;
    created_at?: string;
}

interface ClientKeyword {
    id: string;
    client_id: string;
    keyword: string;
    status: 'used' | 'changed' | 'review';
    location: string;
    review_due_at: string;
    created_at?: string;
}

interface ImprovementLog {
    id: string;
    client_id: string;
    note: string;
    created_at: string;
}

// === البيانات الافتراضية للتشغيل الأول والنسخ الاحتياطي ===
const DEFAULT_CLIENTS: Client[] = [
    { id: 'client-1', name: 'متجر بنّ وسكر للقهوة المختصة', website: 'bonsugar.com' },
    { id: 'client-2', name: 'رداء الأناقة للملابس الجاهزة', website: 'elegantrobe.com' }
];

const DEFAULT_KEYWORDS_DB: KeywordDBItem[] = [
    { id: 'kdb-1', client_id: 'client-1', keyword: 'قهوة مختصة الرياض', kd: 42, volume: 12000, platform: 'ahrefs', source_site: 'competitor-coffee.com' },
    { id: 'kdb-2', client_id: 'client-1', keyword: 'اسبريسو كولومبي فاخر', kd: 18, volume: 3400, platform: 'semrush', source_site: 'coffee-hub.sa' },
    { id: 'kdb-3', client_id: 'client-1', keyword: 'أدوات تقطير القهوة V60', kd: 55, volume: 8900, platform: 'moz', source_site: 'v60-store.com' },
    { id: 'kdb-4', client_id: 'client-1', keyword: 'سلة محاصيل قهوة للبيع', kd: 28, volume: 5600, platform: 'ahrefs', source_site: 'salla.sa/coffee' }
];

const DEFAULT_CLIENT_KEYWORDS: ClientKeyword[] = [
    { id: 'ck-1', client_id: 'client-1', keyword: 'قهوة مختصة الرياض', status: 'used', location: 'الصفحة الرئيسية', review_due_at: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'ck-2', client_id: 'client-1', keyword: 'اسبريسو كولومبي فاخر', status: 'review', location: 'تصنيف محاصيل اسبريسو', review_due_at: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'ck-3', client_id: 'client-1', keyword: 'محاصيل بن فاخرة للتقطير', status: 'changed', location: 'صفحة منتجات التصفية', review_due_at: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString() }
];

const DEFAULT_LOGS: ImprovementLog[] = [
    { id: 'log-1', client_id: 'client-1', note: 'تم تغيير الكلمة المفتاحية في ترويسة الصفحة الرئيسية وتضمين (قهوة مختصة الرياض) لتحسين مطابقة محركات البحث.', created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'log-2', client_id: 'client-1', note: 'توليد واختبار ملفات خريطة الموقع Sitemap وإرسالها بالكامل لمحرك بحث Google Search Console لضمان سرعة الفهرسة.', created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
];

export default function SEOClientManager() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const clientIdParam = searchParams.get('client');

    // --- الحالات العامة للتطبيق ---
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [usingFallback, setUsingFallback] = useState<boolean>(false);
    const [dbChecking, setDbChecking] = useState<boolean>(true);
    
    // --- التبويب النشط الداخلي ---
    const [activeSubTab, setActiveSubTab] = useState<'database' | 'client_keywords' | 'analytics'>('database');

    // --- بيانات العميل المختار ---
    const [keywordsDB, setKeywordsDB] = useState<KeywordDBItem[]>([]);
    const [clientKeywords, setClientKeywords] = useState<ClientKeyword[]>([]);
    const [logs, setLogs] = useState<ImprovementLog[]>([]);

    // --- حالة التحديث الأولي والاتصال بقاعدة البيانات ---
    useEffect(() => {
        const initDB = async () => {
            try {
                setDbChecking(true);
                // محاولة استعلام سريعة للعملاء من Supabase
                const { data, error } = await supabase
                    .from('seo_clients')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                setUsingFallback(false);
                if (data && data.length > 0) {
                    setClients(data);
                } else {
                    // إذا كان الجدول فارغاً، نملؤه افتراضياً لتجربة فورية
                    const { data: insertedClients, error: insertErr } = await supabase
                        .from('seo_clients')
                        .insert(DEFAULT_CLIENTS)
                        .select();
                    
                    if (!insertErr && insertedClients) {
                        setClients(insertedClients);
                        await populateInitialDataForClient(insertedClients[0].id);
                    }
                }
            } catch (err: any) {
                console.warn('⚠️ Supabase tables missing, switching to localStorage Fallback.', err);
                setUsingFallback(true);
                
                const savedClients = localStorage.getItem('seo_clients');
                if (savedClients) {
                    const parsed = JSON.parse(savedClients);
                    setClients(parsed);
                } else {
                    localStorage.setItem('seo_clients', JSON.stringify(DEFAULT_CLIENTS));
                    localStorage.setItem('seo_keywords_database', JSON.stringify(DEFAULT_KEYWORDS_DB));
                    localStorage.setItem('seo_client_keywords', JSON.stringify(DEFAULT_CLIENT_KEYWORDS));
                    localStorage.setItem('seo_improvement_logs', JSON.stringify(DEFAULT_LOGS));
                    setClients(DEFAULT_CLIENTS);
                }
            } finally {
                setDbChecking(false);
            }
        };

        initDB();
    }, []);

    // --- مزامنة العميل المختار مع معامل البحث في URL ---
    useEffect(() => {
        if (clients.length === 0) {
            setSelectedClient(null);
            return;
        }

        if (clientIdParam) {
            const matched = clients.find(c => c.id === clientIdParam);
            if (matched) {
                setSelectedClient(matched);
                return;
            }
        }

        // إذا لم يتم تحديد العميل بالرابط، نجعله الأول تلقائياً ونحدث الرابط
        setSelectedClient(clients[0]);
        router.replace(`/improve?client=${clients[0].id}`);
    }, [clients, clientIdParam]);

    // تهيئة سريعة للبيانات في السحابة
    const populateInitialDataForClient = async (clientId: string) => {
        try {
            const dbItems = DEFAULT_KEYWORDS_DB.map(item => ({ ...item, client_id: clientId, id: undefined }));
            const clientItems = DEFAULT_CLIENT_KEYWORDS.map(item => ({ ...item, client_id: clientId, id: undefined }));
            const logItems = DEFAULT_LOGS.map(item => ({ ...item, client_id: clientId, id: undefined }));

            await supabase.from('seo_keywords_database').insert(dbItems);
            await supabase.from('seo_client_keywords').insert(clientItems);
            await supabase.from('seo_improvement_logs').insert(logItems);
        } catch (e) {
            console.error('Failed to populate default DB items:', e);
        }
    };

    // --- تحميل بيانات العميل المختار ---
    useEffect(() => {
        if (!selectedClient) return;

        const loadClientData = async () => {
            if (usingFallback) {
                const localKDB = JSON.parse(localStorage.getItem('seo_keywords_database') || '[]');
                const localCK = JSON.parse(localStorage.getItem('seo_client_keywords') || '[]');
                const localLogs = JSON.parse(localStorage.getItem('seo_improvement_logs') || '[]');

                setKeywordsDB(localKDB.filter((item: any) => item.client_id === selectedClient.id));
                setClientKeywords(localCK.filter((item: any) => item.client_id === selectedClient.id));
                setLogs(localLogs.filter((item: any) => item.client_id === selectedClient.id).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
            } else {
                try {
                    const [resKDB, resCK, resLogs] = await Promise.all([
                        supabase.from('seo_keywords_database').select('*').eq('client_id', selectedClient.id),
                        supabase.from('seo_client_keywords').select('*').eq('client_id', selectedClient.id),
                        supabase.from('seo_improvement_logs').select('*').eq('client_id', selectedClient.id).order('created_at', { ascending: false })
                    ]);

                    setKeywordsDB(resKDB.data || []);
                    setClientKeywords(resCK.data || []);
                    setLogs(resLogs.data || []);
                } catch (e) {
                    console.error('Failed to load client items:', e);
                }
            }
        };

        loadClientData();
    }, [selectedClient, usingFallback]);

    // --- أحداث قاعدة الكلمات المفتاحية المقترحة ---
    const handleAddKeyword = async (keyword: string, kd: number, volume: number, platform: string, source: string) => {
        if (!selectedClient) return;

        const newKeyword: KeywordDBItem = {
            id: usingFallback ? `kdb-${Date.now()}` : undefined as any,
            client_id: selectedClient.id,
            keyword,
            kd,
            volume,
            platform,
            source_site: source
        };

        if (usingFallback) {
            const localKDB = JSON.parse(localStorage.getItem('seo_keywords_database') || '[]');
            const updated = [...localKDB, newKeyword];
            localStorage.setItem('seo_keywords_database', JSON.stringify(updated));
            setKeywordsDB([...keywordsDB, newKeyword]);
        } else {
            const { data, error } = await supabase.from('seo_keywords_database').insert([newKeyword]).select();
            if (error) throw error;
            if (data) setKeywordsDB([...keywordsDB, data[0]]);
        }
    };

    const handleDeleteKeyword = async (id: string) => {
        if (usingFallback) {
            const localKDB = JSON.parse(localStorage.getItem('seo_keywords_database') || '[]');
            const updated = localKDB.filter((item: any) => item.id !== id);
            localStorage.setItem('seo_keywords_database', JSON.stringify(updated));
            setKeywordsDB(keywordsDB.filter(k => k.id !== id));
        } else {
            const { error } = await supabase.from('seo_keywords_database').delete().eq('id', id);
            if (error) throw error;
            setKeywordsDB(keywordsDB.filter(k => k.id !== id));
        }
    };

    // --- أحداث كلمات العميل النشطة ---
    const handleAddClientKeyword = async (keyword: string, location: string, status: 'used' | 'changed' | 'review', reviewDays: number) => {
        if (!selectedClient) return;

        const newCK: ClientKeyword = {
            id: usingFallback ? `ck-${Date.now()}` : undefined as any,
            client_id: selectedClient.id,
            keyword,
            status,
            location,
            review_due_at: new Date(Date.now() + reviewDays * 24 * 60 * 60 * 1000).toISOString()
        };

        if (usingFallback) {
            const localCK = JSON.parse(localStorage.getItem('seo_client_keywords') || '[]');
            const updated = [...localCK, newCK];
            localStorage.setItem('seo_client_keywords', JSON.stringify(updated));
            setClientKeywords([...clientKeywords, newCK]);
        } else {
            const { data, error } = await supabase.from('seo_client_keywords').insert([newCK]).select();
            if (error) throw error;
            if (data) setClientKeywords([...clientKeywords, data[0]]);
        }
    };

    const handleUpdateStatus = async (id: string, currentStatus: 'used' | 'changed' | 'review') => {
        const nextStatusMap: Record<string, 'used' | 'changed' | 'review'> = {
            'review': 'used',
            'used': 'changed',
            'changed': 'review'
        };
        const newStatus = nextStatusMap[currentStatus];

        if (usingFallback) {
            const localCK = JSON.parse(localStorage.getItem('seo_client_keywords') || '[]');
            const updated = localCK.map((item: any) => item.id === id ? { ...item, status: newStatus } : item);
            localStorage.setItem('seo_client_keywords', JSON.stringify(updated));
            setClientKeywords(clientKeywords.map(k => k.id === id ? { ...k, status: newStatus } : k));
        } else {
            const { error } = await supabase.from('seo_client_keywords').update({ status: newStatus }).eq('id', id);
            if (error) throw error;
            setClientKeywords(clientKeywords.map(k => k.id === id ? { ...k, status: newStatus } : k));
        }
    };

    const handleResetTimer = async (id: string, days: number) => {
        const newDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

        if (usingFallback) {
            const localCK = JSON.parse(localStorage.getItem('seo_client_keywords') || '[]');
            const updated = localCK.map((item: any) => item.id === id ? { ...item, review_due_at: newDate } : item);
            localStorage.setItem('seo_client_keywords', JSON.stringify(updated));
            setClientKeywords(clientKeywords.map(k => k.id === id ? { ...k, review_due_at: newDate } : k));
        } else {
            const { error } = await supabase.from('seo_client_keywords').update({ review_due_at: newDate }).eq('id', id);
            if (error) throw error;
            setClientKeywords(clientKeywords.map(k => k.id === id ? { ...k, review_due_at: newDate } : k));
        }
    };

    const handleDeleteClientKeyword = async (id: string) => {
        if (usingFallback) {
            const localCK = JSON.parse(localStorage.getItem('seo_client_keywords') || '[]');
            const updated = localCK.filter((item: any) => item.id !== id);
            localStorage.setItem('seo_client_keywords', JSON.stringify(updated));
            setClientKeywords(clientKeywords.filter(k => k.id !== id));
        } else {
            const { error } = await supabase.from('seo_client_keywords').delete().eq('id', id);
            if (error) throw error;
            setClientKeywords(clientKeywords.filter(k => k.id !== id));
        }
    };

    // --- أحداث سجل مراحل تحسن العمل ---
    const handleAddLog = async (note: string) => {
        if (!selectedClient) return;

        const newLog: ImprovementLog = {
            id: usingFallback ? `log-${Date.now()}` : undefined as any,
            client_id: selectedClient.id,
            note,
            created_at: new Date().toISOString()
        };

        if (usingFallback) {
            const localLogs = JSON.parse(localStorage.getItem('seo_improvement_logs') || '[]');
            const updated = [newLog, ...localLogs];
            localStorage.setItem('seo_improvement_logs', JSON.stringify(updated));
            setLogs([newLog, ...logs]);
        } else {
            const { data, error } = await supabase.from('seo_improvement_logs').insert([newLog]).select();
            if (error) throw error;
            if (data) setLogs([data[0], ...logs]);
        }
    };

    const handleDeleteLog = async (id: string) => {
        if (usingFallback) {
            const localLogs = JSON.parse(localStorage.getItem('seo_improvement_logs') || '[]');
            const updated = localLogs.filter((item: any) => item.id !== id);
            localStorage.setItem('seo_improvement_logs', JSON.stringify(updated));
            setLogs(logs.filter(l => l.id !== id));
        } else {
            const { error } = await supabase.from('seo_improvement_logs').delete().eq('id', id);
            if (error) throw error;
            setLogs(logs.filter(l => l.id !== id));
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-16">
            
            {/* 1. الترويسة الرئيسية الفاخرة للعميل النشط */}
            {selectedClient ? (
                <div className="p-8 bg-black text-white rounded-[32px] shadow-lg relative overflow-hidden animate-in">
                    {/* Glowing blur effects */}
                    <div className="absolute -left-16 -top-16 w-60 h-60 rounded-full bg-zinc-800/30 blur-[70px] pointer-events-none" />
                    <div className="absolute -right-16 -bottom-16 w-60 h-60 rounded-full bg-zinc-800/10 blur-[70px] pointer-events-none" />

                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/10 backdrop-blur-md mb-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[9px] font-black text-slate-200 font-sans tracking-wide">SEO CRM ACTIVE WORKSPACE</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight flex items-center gap-2">
                                {selectedClient.name}
                            </h1>
                            <p className="text-xs text-zinc-400 font-bold mt-1.5 flex items-center gap-1">
                                <Globe size={12} className="text-zinc-500" />
                                <span>موقع العميل:</span>
                                <a 
                                    href={`https://${selectedClient.website}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-zinc-300 hover:text-white underline"
                                >
                                    {selectedClient.website}
                                </a>
                            </p>
                        </div>

                        {/* شارة حالة البيانات */}
                        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm self-start sm:self-center">
                            <span className={cn("w-2 h-2 rounded-full", usingFallback ? "bg-amber-400" : "bg-emerald-500")} />
                            <span className="text-[10px] font-black text-zinc-300">
                                {usingFallback ? 'قاعدة بيانات محلية' : 'Supabase سحابي'}
                            </span>
                        </div>
                    </div>
                </div>
            ) : !dbChecking ? (
                <div className="p-16 bg-white border border-slate-200/80 rounded-[36px] text-center max-w-xl mx-auto shadow-sm">
                    <div className="w-16 h-16 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center mx-auto mb-6 text-zinc-400">
                        <Users size={28} />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 mb-2">أهلاً بك في نظام إدارة السيو والعملاء</h3>
                    <p className="text-xs text-slate-400 leading-relaxed mb-6">
                        يرجى إضافة عميلك الأول من القائمة الجانبية (شريط عملاء السيو النشطين) للبدء في إدارة الكلمات المفتاحية ومتابعة خطط التحسين.
                    </p>
                </div>
            ) : (
                <div className="w-full h-40 bg-zinc-100 animate-pulse rounded-[32px]" />
            )}

            {/* 2. شاشة لوحة تحكم العميل المختار */}
            {selectedClient && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* الجانب الأيمن (التبويبات وجداول الكلمات والتحليلات) */}
                    <div className="lg:col-span-8 space-y-6">
                        
                        {/* أزرار اختيار التبويب */}
                        <div className="bg-white border border-slate-200/80 p-2 rounded-[24px] shadow-sm flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5 flex-1 min-w-[300px]">
                                <button
                                    onClick={() => setActiveSubTab('database')}
                                    className={cn(
                                        "flex-1 py-3 px-4 text-xs font-black rounded-2xl transition-all text-center flex items-center justify-center gap-1.5",
                                        activeSubTab === 'database'
                                            ? "bg-black text-white shadow-md shadow-black/5"
                                            : "text-zinc-500 hover:text-black hover:bg-zinc-50"
                                    )}
                                >
                                    <Database size={14} />
                                    <span>قاعدة الكلمات المقترحة</span>
                                </button>
                                <button
                                    onClick={() => setActiveSubTab('client_keywords')}
                                    className={cn(
                                        "flex-1 py-3 px-4 text-xs font-black rounded-2xl transition-all text-center flex items-center justify-center gap-1.5",
                                        activeSubTab === 'client_keywords'
                                            ? "bg-black text-white shadow-md shadow-black/5"
                                            : "text-zinc-500 hover:text-black hover:bg-zinc-50"
                                    )}
                                >
                                    <Users size={14} />
                                    <span>كلمات العميل النشطة</span>
                                </button>
                                <button
                                    onClick={() => setActiveSubTab('analytics')}
                                    className={cn(
                                        "flex-1 py-3 px-4 text-xs font-black rounded-2xl transition-all text-center flex items-center justify-center gap-1.5",
                                        activeSubTab === 'analytics'
                                            ? "bg-black text-white shadow-md shadow-black/5"
                                            : "text-zinc-500 hover:text-black hover:bg-zinc-50"
                                    )}
                                >
                                    <TrendingUp size={14} />
                                    <span>تحليلات السيو</span>
                                </button>
                            </div>
                        </div>

                        {/* التبويب الأول: قاعدة الكلمات */}
                        {activeSubTab === 'database' && (
                            <KeywordsDatabase 
                                selectedClient={selectedClient}
                                keywordsDB={keywordsDB}
                                usingFallback={usingFallback}
                                onAddKeyword={handleAddKeyword}
                                onDeleteKeyword={handleDeleteKeyword}
                                onSwitchTab={() => setActiveSubTab('client_keywords')}
                            />
                        )}

                        {/* التبويب الثاني: كلمات العميل */}
                        {activeSubTab === 'client_keywords' && (
                            <ClientKeywords 
                                selectedClient={selectedClient}
                                clientKeywords={clientKeywords}
                                usingFallback={usingFallback}
                                onAddClientKeyword={handleAddClientKeyword}
                                onUpdateStatus={handleUpdateStatus}
                                onResetTimer={handleResetTimer}
                                onDeleteClientKeyword={handleDeleteClientKeyword}
                                onSwitchTab={() => setActiveSubTab('database')}
                            />
                        )}

                        {/* التبويب الثالث: تحليلات السيو */}
                        {activeSubTab === 'analytics' && (
                            <SeoAnalytics selectedClient={selectedClient} />
                        )}

                    </div>

                    {/* الجانب الأيسر (سجل مراحل العمل وإضافة الملاحظات) */}
                    <div className="lg:col-span-4">
                        <ImprovementLogs 
                            selectedClient={selectedClient}
                            logs={logs}
                            onAddLog={handleAddLog}
                            onDeleteLog={handleDeleteLog}
                        />
                    </div>

                </div>
            )}
        </div>
    );
}
