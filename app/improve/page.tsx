'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useSearchParams, useRouter } from 'next/navigation';
import { Users, Plus, Database, TrendingUp, Globe, ListTodo, Maximize2, Minimize2, FileText, Folder } from 'lucide-react';
import { cn } from '@/lib/utils';

// استيراد المكونات الفرعية المقسمة
import { KeywordsDatabase } from '@/components/improve/KeywordsDatabase';
import { ClientKeywords } from '@/components/improve/ClientKeywords';
import { SeoAnalytics } from '@/components/improve/SeoAnalytics';
import { ImprovementLogs } from '@/components/improve/ImprovementLogs';
import { CrmChecklist } from '@/components/improve/CrmChecklist';
import { ClientBriefAssets } from '@/components/improve/ClientBriefAssets';
import { KeywordCategories } from '@/components/improve/KeywordCategories';

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
    intent?: string;
    cpc?: number;
    sf?: string;
    created_at?: string;
}

interface ClientKeyword {
    id: string;
    client_id: string;
    keyword: string;
    status: 'used' | 'changed' | 'review';
    location: string;
    review_due_at: string;
    page_url?: string;
    kd?: number;
    volume?: number;
    platform?: string;
    source_site?: string;
    intent?: string;
    cpc?: number;
    sf?: string;
    created_at?: string;
}

interface ImprovementLog {
    id: string;
    client_id: string;
    note: string;
    created_at: string;
}

// === البيانات الافتراضية للتشغيل الأول والنسخ الاحتياطي ===
const DEFAULT_CLIENTS: Client[] = [];

const DEFAULT_KEYWORDS_DB: KeywordDBItem[] = [];

const DEFAULT_CLIENT_KEYWORDS: ClientKeyword[] = [];

const DEFAULT_LOGS: ImprovementLog[] = [];

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
    const [activeSubTab, setActiveSubTab] = useState<'database' | 'client_keywords' | 'analytics' | 'checklist' | 'brief_assets' | 'categories'>('database');
    
    // --- وضع اتساع الأعمدة والعرض الكامل للجدول ---
    const [isWideView, setIsWideView] = useState<boolean>(false);

    // --- بيانات العميل المختار ---
    const [keywordsDB, setKeywordsDB] = useState<KeywordDBItem[]>([]);
    const [clientKeywords, setClientKeywords] = useState<ClientKeyword[]>([]);
    const [logs, setLogs] = useState<ImprovementLog[]>([]);

    // --- دالة جلب العملاء وتهيئة قاعدة البيانات بشكل آمن ---
    const fetchClients = async () => {
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
                return data;
            } else {
                // إذا كان الجدول فارغاً، لا نقوم بإضافة عملاء وهميين بل نتركه فارغاً للبدء الفعلي
                setClients([]);
                return [];
            }
        } catch (err: any) {
            console.warn('⚠️ Supabase tables missing, switching to localStorage Fallback.', err);
            setUsingFallback(true);
            
            const savedClients = localStorage.getItem('seo_clients');
            if (savedClients) {
                const parsed = JSON.parse(savedClients);
                setClients(parsed);
                return parsed;
            } else {
                localStorage.setItem('seo_clients', JSON.stringify([]));
                localStorage.setItem('seo_keywords_database', JSON.stringify([]));
                localStorage.setItem('seo_client_keywords', JSON.stringify([]));
                localStorage.setItem('seo_improvement_logs', JSON.stringify([]));
                setClients([]);
                return [];
            }
        } finally {
            setDbChecking(false);
        }
        return [];
    };

    // --- جلب البيانات الأولي عند تحميل الصفحة ---
    useEffect(() => {
        fetchClients();
    }, []);

    // --- مزامنة العميل المختار مع معامل البحث في URL وتحديث البيانات تفاعلياً ---
    useEffect(() => {
        const syncSelectedClient = async () => {
            if (clientIdParam) {
                let matched = clients.find((c: Client) => c.id === clientIdParam);
                if (matched) {
                    setSelectedClient(matched);
                    return;
                }

                // إذا لم نجد العميل بالذاكرة المحلية لـ state، فإنه قد أُضيف حديثاً من شريط الجنب.
                // نقوم بإعادة جلب البيانات فوراً لضمان التزامن التفاعلي التام بدون إعادة تحميل الصفحة.
                const updatedClients = await fetchClients();
                matched = updatedClients.find((c: Client) => c.id === clientIdParam);
                if (matched) {
                    setSelectedClient(matched);
                    return;
                }
            }

            if (clients.length > 0) {
                setSelectedClient(clients[0]);
                router.replace(`/improve?client=${clients[0].id}`);
            } else if (!dbChecking) {
                setSelectedClient(null);
            }
        };

        syncSelectedClient();
    }, [clients, clientIdParam]);

    // تهيئة سريعة للبيانات في السحابة
    const populateInitialDataForClient = async (clientId: string) => {
        try {
            if (DEFAULT_KEYWORDS_DB.length > 0) {
                const dbItems = DEFAULT_KEYWORDS_DB.map(item => ({ ...item, client_id: clientId, id: undefined }));
                await supabase.from('seo_keywords_database').insert(dbItems);
            }
            if (DEFAULT_CLIENT_KEYWORDS.length > 0) {
                const clientItems = DEFAULT_CLIENT_KEYWORDS.map(item => ({ ...item, client_id: clientId, id: undefined }));
                await supabase.from('seo_client_keywords').insert(clientItems);
            }
            if (DEFAULT_LOGS.length > 0) {
                const logItems = DEFAULT_LOGS.map(item => ({ ...item, client_id: clientId, id: undefined }));
                await supabase.from('seo_improvement_logs').insert(logItems);
            }
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
    const handleAddKeyword = async (
        clientId: string,
        keyword: string,
        kd: number,
        volume: number,
        platform: string,
        source: string,
        intent?: string,
        cpc?: number,
        sf?: string
    ) => {
        const generatedId = usingFallback 
            ? `kdb-${Date.now()}` 
            : (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID 
                ? window.crypto.randomUUID() 
                : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                    const r = Math.random() * 16 | 0;
                    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
                })
            );

        const newKeyword: KeywordDBItem = {
            id: generatedId,
            client_id: clientId,
            keyword,
            kd,
            volume,
            platform,
            source_site: source,
            intent: intent || '',
            cpc: cpc || 0.0,
            sf: sf || ''
        };

        if (usingFallback) {
            const localKDB = JSON.parse(localStorage.getItem('seo_keywords_database') || '[]');
            const updated = [...localKDB, newKeyword];
            localStorage.setItem('seo_keywords_database', JSON.stringify(updated));
            if (selectedClient && clientId === selectedClient.id) {
                setKeywordsDB([...keywordsDB, newKeyword]);
            }
        } else {
            try {
                const { data, error } = await supabase.from('seo_keywords_database').insert([newKeyword]).select();
                if (error) {
                    if (error.code === '42703') {
                        const fallbackKeyword = { ...newKeyword };
                        delete fallbackKeyword.intent;
                        delete fallbackKeyword.cpc;
                        delete fallbackKeyword.sf;
                        
                        const { data: retryData, error: retryError } = await supabase.from('seo_keywords_database').insert([fallbackKeyword]).select();
                        if (retryError) throw retryError;
                        if (retryData && selectedClient && clientId === selectedClient.id) {
                            setKeywordsDB([...keywordsDB, { 
                                ...retryData[0],
                                intent: intent,
                                cpc: cpc,
                                sf: sf
                            }]);
                        }
                    } else {
                        throw error;
                    }
                } else if (data && selectedClient && clientId === selectedClient.id) {
                    setKeywordsDB([...keywordsDB, data[0]]);
                }
            } catch (err) {
                console.error('Database insert failed, falling back to local state:', err);
                if (selectedClient && clientId === selectedClient.id) {
                    setKeywordsDB([...keywordsDB, newKeyword]);
                }
            }
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
    const handleAddClientKeyword = async (
        clientId: string,
        keyword: string,
        location: string,
        status: 'used' | 'changed' | 'review',
        reviewDays: number,
        pageUrl?: string,
        kd?: number,
        volume?: number,
        platform?: string,
        sourceSite?: string,
        intent?: string,
        cpc?: number,
        sf?: string
    ) => {
        const generatedId = usingFallback 
            ? `ck-${Date.now()}` 
            : (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID 
                ? window.crypto.randomUUID() 
                : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                    const r = Math.random() * 16 | 0;
                    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
                })
            );

        const newCK: ClientKeyword = {
            id: generatedId,
            client_id: clientId,
            keyword,
            status,
            location,
            page_url: pageUrl || '',
            kd: kd || 0,
            volume: volume || 0,
            platform: platform || 'semrush',
            source_site: sourceSite || '',
            intent: intent || '',
            cpc: cpc || 0.0,
            sf: sf || '',
            review_due_at: new Date(Date.now() + reviewDays * 24 * 60 * 60 * 1000).toISOString()
        };

        if (usingFallback) {
            const localCK = JSON.parse(localStorage.getItem('seo_client_keywords') || '[]');
            const updated = [...localCK, newCK];
            localStorage.setItem('seo_client_keywords', JSON.stringify(updated));
            if (selectedClient && clientId === selectedClient.id) {
                setClientKeywords([...clientKeywords, newCK]);
            }
        } else {
            try {
                const { data, error } = await supabase.from('seo_client_keywords').insert([newCK]).select();
                if (error) {
                    // إذا كانت الأعمدة الجديدة غير موجودة بعد في قاعدة بيانات العميل (خطأ 42703)
                    if (error.code === '42703') {
                        const fallbackCK = { ...newCK };
                        delete fallbackCK.page_url;
                        delete fallbackCK.kd;
                        delete fallbackCK.volume;
                        delete fallbackCK.platform;
                        delete fallbackCK.source_site;
                        delete fallbackCK.intent;
                        delete fallbackCK.cpc;
                        delete fallbackCK.sf;
                        
                        const { data: retryData, error: retryError } = await supabase.from('seo_client_keywords').insert([fallbackCK]).select();
                        if (retryError) throw retryError;
                        if (retryData && selectedClient && clientId === selectedClient.id) {
                            setClientKeywords([...clientKeywords, { 
                                ...retryData[0], 
                                page_url: pageUrl,
                                kd: kd,
                                volume: volume,
                                platform: platform,
                                source_site: sourceSite,
                                intent: intent,
                                cpc: cpc,
                                sf: sf
                            }]);
                        }
                    } else {
                        throw error;
                    }
                } else if (data && selectedClient && clientId === selectedClient.id) {
                    setClientKeywords([...clientKeywords, data[0]]);
                }
            } catch (err) {
                console.error('Database insert failed, falling back to local state:', err);
                if (selectedClient && clientId === selectedClient.id) {
                    setClientKeywords([...clientKeywords, newCK]);
                }
            }
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

        const generatedId = usingFallback 
            ? `log-${Date.now()}` 
            : (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID 
                ? window.crypto.randomUUID() 
                : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                    const r = Math.random() * 16 | 0;
                    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
                })
            );

        const newLog: ImprovementLog = {
            id: generatedId,
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
            
            {/* حالة عدم وجود أي عميل مضاف أو مختار */}
            {!selectedClient && !dbChecking && (
                <div className="flex flex-col items-center justify-center min-h-[450px] p-10 bg-white border border-slate-200/80 rounded-[32px] text-center shadow-sm max-w-2xl mx-auto my-12 animate-in duration-300">
                    <div className="w-20 h-20 rounded-3xl bg-zinc-50 border border-zinc-100 flex items-center justify-center mb-6 text-zinc-400 shadow-inner">
                        <Users size={36} className="text-zinc-950" />
                    </div>
                    <h2 className="text-xl font-black text-slate-900 mb-2">مرحباً بك في نظام إدارة السيو والعملاء (CRM)</h2>
                    <p className="text-xs text-zinc-500 max-w-md leading-relaxed mb-6 font-medium">
                        لم يتم اختيار أو إضافة أي عميل نشط حتى الآن. يمكنك إضافة عميلك الأول بسهولة من شريط الجانب الأيمن (عملاء السيو النشطين +) لإعداد الكلمات المفتاحية وخارطة الطريق ومتابعة سجلات التحسن.
                    </p>
                </div>
            )}

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
                        </div>
                    </div>
                </div>
            ) : null}
            
            {/* 2. شاشة لوحة تحكم العميل المختار */}
            {selectedClient && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* الجانب الأيمن (التبويبات وجداول الكلمات والتحليلات) */}
                    <div className={cn(isWideView ? "lg:col-span-12" : "lg:col-span-8", "space-y-6 transition-all duration-500")}>
                        
                        {/* أزرار اختيار التبويب */}
                        <div className="bg-white border border-slate-200/80 p-2 rounded-[24px] shadow-sm flex items-center justify-between gap-3 flex-wrap">
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
                                    onClick={() => setActiveSubTab('categories')}
                                    className={cn(
                                        "flex-1 py-3 px-4 text-xs font-black rounded-2xl transition-all text-center flex items-center justify-center gap-1.5",
                                        activeSubTab === 'categories'
                                            ? "bg-black text-white shadow-md shadow-black/5"
                                            : "text-zinc-500 hover:text-black hover:bg-zinc-50"
                                    )}
                                >
                                    <Folder size={14} />
                                    <span>تصنيف الكلمات</span>
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
                                <button
                                    onClick={() => setActiveSubTab('checklist')}
                                    className={cn(
                                        "flex-1 py-3 px-4 text-xs font-black rounded-2xl transition-all text-center flex items-center justify-center gap-1.5",
                                        activeSubTab === 'checklist'
                                            ? "bg-black text-white shadow-md shadow-black/5"
                                             : "text-zinc-500 hover:text-black hover:bg-zinc-50"
                                    )}
                                >
                                    <ListTodo size={14} />
                                    <span>خارطة طريق السيو</span>
                                </button>
                                <button
                                    onClick={() => setActiveSubTab('brief_assets')}
                                    className={cn(
                                        "flex-1 py-3 px-4 text-xs font-black rounded-2xl transition-all text-center flex items-center justify-center gap-1.5",
                                        activeSubTab === 'brief_assets'
                                            ? "bg-black text-white shadow-md shadow-black/5"
                                             : "text-zinc-500 hover:text-black hover:bg-zinc-50"
                                    )}
                                >
                                    <FileText size={14} />
                                    <span>ملف البريف والأسس</span>
                                </button>
                            </div>

                            {/* زر تفعيل العرض الكامل واتساع الأعمدة */}
                            {(activeSubTab === 'database' || activeSubTab === 'client_keywords' || activeSubTab === 'brief_assets' || activeSubTab === 'categories') && (
                                <button
                                    onClick={() => setIsWideView(!isWideView)}
                                    className={cn(
                                        "flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border text-[11px] font-black transition-all shadow-sm duration-300",
                                        isWideView 
                                            ? "bg-zinc-950 border-zinc-950 text-white hover:bg-zinc-800" 
                                            : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                                    )}
                                    title={isWideView ? "العودة للتقسيم الافتراضي وتضييق الأعمدة" : "توسيع الأعمدة وعرض الجدول على كامل الشاشة"}
                                >
                                    {isWideView ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                                    <span>{isWideView ? "العرض المدمج" : "اتساع الأعمدة (عرض كامل)"}</span>
                                </button>
                            )}
                        </div>

                        {/* التبويب الأول: قاعدة الكلمات */}
                        {activeSubTab === 'database' && (
                            <KeywordsDatabase 
                                selectedClient={selectedClient}
                                clients={clients}
                                keywordsDB={keywordsDB}
                                usingFallback={usingFallback}
                                onAddKeyword={handleAddKeyword}
                                onDeleteKeyword={handleDeleteKeyword}
                                onSwitchTab={() => setActiveSubTab('client_keywords')}
                                isWideView={isWideView}
                            />
                        )}

                        {/* التبويب الثاني: كلمات العميل */}
                        {activeSubTab === 'client_keywords' && (
                            <ClientKeywords 
                                selectedClient={selectedClient}
                                clients={clients}
                                clientKeywords={clientKeywords}
                                usingFallback={usingFallback}
                                onAddClientKeyword={handleAddClientKeyword}
                                onUpdateStatus={handleUpdateStatus}
                                onResetTimer={handleResetTimer}
                                onDeleteClientKeyword={handleDeleteClientKeyword}
                                onSwitchTab={() => setActiveSubTab('database')}
                                isWideView={isWideView}
                            />
                        )}

                        {/* التبويب الثالث: تحليلات السيو */}
                        {activeSubTab === 'analytics' && (
                            <SeoAnalytics 
                                selectedClient={selectedClient} 
                                keywordsDB={keywordsDB}
                                clientKeywords={clientKeywords}
                                logs={logs}
                            />
                        )}

                        {/* التبويب الرابع: خارطة طريق السيو CRM */}
                        {activeSubTab === 'checklist' && selectedClient && (
                            <CrmChecklist 
                                selectedClient={selectedClient}
                                onAddLog={handleAddLog}
                            />
                        )}

                        {/* التبويب الخامس: ملف البريف وأسس الهوية البصرية */}
                        {activeSubTab === 'brief_assets' && selectedClient && (
                            <ClientBriefAssets 
                                selectedClient={selectedClient}
                                usingFallback={usingFallback}
                            />
                        )}

                        {/* التبويب السادس: تصنيف ومجموعات الكلمات المفتاحية */}
                        {activeSubTab === 'categories' && selectedClient && (
                            <KeywordCategories 
                                selectedClient={selectedClient}
                                clientKeywords={clientKeywords}
                                usingFallback={usingFallback}
                            />
                        )}

                    </div>

                    {/* الجانب الأيسر (سجل مراحل العمل وإضافة الملاحظات) */}
                    <div className={cn(isWideView ? "lg:col-span-12 mt-4" : "lg:col-span-4", "transition-all duration-500")}>
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
