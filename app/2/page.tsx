'use client';

import { useState, useEffect } from 'react';
import {
    Download,
    RotateCcw,
    Square,
    Play,
    Search,
    Store,
    Mail,
    Phone,
    ExternalLink,
    AlertCircle,
    CheckCircle2,
    Loader2,
    Copy,
    Check,
    Globe,
    Share2,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Terminal,
    X
} from 'lucide-react';

const getBaseUrl = () => {
    if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
        return 'http://localhost:3000';
    }
    return '';
};

import { StatCard } from '@/components/ui/StatCard';
import { ActionButton } from '@/components/ui/ActionButton';
import { SocialIcon } from '@/components/ui/SocialIcon';
import { LeadFilterBar, type LeadFilter } from '@/components/ui/LeadFilterBar';
import { LeadDetailModal } from '@/components/ui/LeadDetailModal';
import { BulkActionsToolbar } from '@/components/ui/BulkActionsToolbar';

interface Lead {
    storeName: string;
    domain?: string;
    email?: string;
    phone?: string;
    whatsapp?: string;
    instagram?: string;
    tiktok?: string;
    snapchat?: string;
    twitter?: string;
    facebook?: string;
    youtube?: string;
    rating: string;
    subText?: string;
}

interface WaitingItem {
    id: string;
    query: string;
    limit: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
}

export default function MazeedDashboard() {
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<Lead[]>([]);
    const [failed, setFailed] = useState<string[]>([]);
    const [mounted, setMounted] = useState(false);
    
    const [mazeedQuery, setMazeedQuery] = useState('');
    const [mazeedLimit, setMazeedLimit] = useState(50);
    
    // Live Terminal Logs State
    const [logs, setLogs] = useState<string[]>([]);
    
    // Waiting List State
    const [waitingList, setWaitingList] = useState<WaitingItem[]>([]);
    const [isQueueRunning, setIsQueueRunning] = useState(false);

    // Available sheets
    const [availableSheets, setAvailableSheets] = useState<string[]>([]);
    const [selectedSheet, setSelectedSheet] = useState<string>('');

    // Merge Sheets State
    const [selectedMergeSheets, setSelectedMergeSheets] = useState<string[]>([]);
    const [targetMergeName, setTargetMergeName] = useState('');
    const [isMerging, setIsMerging] = useState(false);

    // Detail modal
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [copied, setCopied] = useState<string | null>(null);

    // Filtering
    const [filters, setFilters] = useState<LeadFilter>({
        rating: [],
        hasEmail: false,
        hasPhone: false,
        hasSocial: false,
        search: '',
    });

    // Bulk selection
    const [selectedLeads, setSelectedLeads] = useState<Set<number>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        setMounted(true);
        fetchSheets();
    }, []);

    // Load / Save Waiting List
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('waitingList_mazeed');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    setWaitingList(parsed.map((item: WaitingItem) => 
                        item.status === 'processing' ? { ...item, status: 'pending' } : item
                    ));
                } catch (e) {
                    console.error('Failed to parse waiting list', e);
                }
            }
        }
    }, []);

    useEffect(() => {
        if (mounted) {
            localStorage.setItem('waitingList_mazeed', JSON.stringify(waitingList));
        }
    }, [waitingList, mounted]);

    const fetchSheets = async () => {
        try {
            const res = await fetch(`${getBaseUrl()}/api/mazeed/sheets`);
            const data = await res.json();
            if (data.success) setAvailableSheets(data.sheets);
        } catch (err) {
            console.error('Failed to fetch sheets:', err);
        }
    };

    const addLog = (msg: string) => {
        setLogs(prev => [...prev.slice(-49), `[${new Date().toLocaleTimeString('ar-SA')}] ${msg}`]);
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const startMazeedScrape = async (overrideQuery?: string, overrideLimit?: number, itemId?: string) => {
        const query = overrideQuery || mazeedQuery;
        const limit = overrideLimit || mazeedLimit;

        if (!query.trim()) {
            alert('يرجى إدخال اسم المنتج للبحث');
            return;
        }
        
        setLoading(true);
        setLogs([]);
        addLog(`🚀 بدء البحث عن المنتج: "${query}" في منصة مزيد (حد أقصى: ${limit} متجر)...`);
        
        try {
            const res = await fetch(`${getBaseUrl()}/api/mazeed`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    productName: query,
                    limit: limit 
                })
            });

            if (!res.body) return;
            const reader = res.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n').filter(line => line.trim());

                for (const line of lines) {
                    try {
                        const data = JSON.parse(line);
                        if (data.type === 'result') {
                            addLog(`✨ تم العثور على متجر: "${data.store.storeName}"`);
                            setResults(prev => {
                                if (prev.some(r => r.domain === data.store.domain)) return prev;
                                return [...prev, data.store];
                            });
                        } else if (data.type === 'status') {
                            addLog(`⚙️ ${data.message}`);
                        } else if (data.type === 'done') {
                            addLog(`🎉 اكتمل كشط المتاجر لـ "${query}" بنجاح! تم حفظ المتاجر في الإكسل.`);
                            fetchSheets();
                            if (itemId) {
                                setWaitingList(prev => prev.map(item => 
                                    item.id === itemId ? { ...item, status: 'completed' } : item
                                ));
                            }
                        } else if (data.type === 'error') {
                            addLog(`❌ خطأ: ${data.message}`);
                            if (itemId) {
                                setWaitingList(prev => prev.map(item => 
                                    item.id === itemId ? { ...item, status: 'failed' } : item
                                ));
                            }
                        }
                    } catch (e) {
                        console.error('Error parsing chunk:', e);
                    }
                }
            }
        } catch (err: any) {
            addLog(`❌ خطأ في الاتصال بالخادم: ${err.message}`);
            if (itemId) {
                setWaitingList(prev => prev.map(item => 
                    item.id === itemId ? { ...item, status: 'failed' } : item
                ));
            }
        } finally {
            setLoading(false);
        }
    };

    const addToWaitingList = () => {
        if (!mazeedQuery.trim()) {
            alert('يرجى إدخال اسم المنتج أولاً');
            return;
        }
        const newItem: WaitingItem = {
            id: Math.random().toString(36).substr(2, 9),
            query: mazeedQuery,
            limit: mazeedLimit,
            status: 'pending'
        };
        setWaitingList(prev => [...prev, newItem]);
        setMazeedQuery('');
    };

    const removeFromWaitingList = (id: string) => {
        setWaitingList(prev => prev.filter(item => item.id !== id));
    };

    const toggleQueue = () => {
        setIsQueueRunning(!isQueueRunning);
    };

    useEffect(() => {
        if (isQueueRunning && !loading) {
            const nextItem = waitingList.find(item => item.status === 'pending');
            if (nextItem) {
                setWaitingList(prev => prev.map(item => 
                    item.id === nextItem.id ? { ...item, status: 'processing' } : item
                ));
                startMazeedScrape(nextItem.query, nextItem.limit, nextItem.id);
            } else {
                setIsQueueRunning(false);
            }
        }
    }, [isQueueRunning, loading, waitingList]);

    const startEnrich = async () => {
        if (!selectedSheet && availableSheets.length > 0) {
            alert('يرجى اختيار تصنيف من القائمة لتطويره');
            return;
        }
        setLoading(true);
        addLog(`🔎 بدء إثراء وتطوير بيانات أوراق التصنيف [${selectedSheet || 'الكل'}] عبر Serper API وكشط الصفحات الرسمية...`);
        try {
            const res = await fetch(`${getBaseUrl()}/api/mazeed/enrich`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sheetName: selectedSheet })
            });
            const data = await res.json();
            if (data.success) {
                addLog(`🎉 تم الانتهاء من الإثراء العميق! تم استيراد وحفظ البيانات المحدثة.`);
                alert(data.message);
                if (data.results) setResults(data.results);
            } else {
                addLog(`❌ خطأ أثناء الإثراء: ${data.error}`);
                alert('خطأ: ' + data.error);
            }
        } catch (err: any) {
            addLog(`❌ فشل الاتصال بخدمة الإثراء: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleMergeSheets = async () => {
        if (selectedMergeSheets.length < 1) {
            alert('يرجى اختيار ورقة واحدة على الأقل للدمج');
            return;
        }
        if (!targetMergeName.trim()) {
            alert('يرجى إدخال اسم للورقة الجديدة');
            return;
        }

        setIsMerging(true);
        try {
            const res = await fetch(`${getBaseUrl()}/api/mazeed/merge-sheets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sourceSheets: selectedMergeSheets,
                    targetSheet: targetMergeName
                })
            });
            const data = await res.json();
            if (data.success) {
                alert(data.message);
                setSelectedMergeSheets([]);
                setTargetMergeName('');
                fetchSheets();
            } else {
                alert('خطأ: ' + data.error);
            }
        } catch (err) {
            console.error(err);
            alert('حدث خطأ أثناء الدمج');
        } finally {
            setIsMerging(false);
        }
    };

    const cancelScrape = async () => {
        addLog('🛑 إرسال إشارة إيقاف الكشط لمزيد...');
        await fetch('/api/mazeed/cancel', { method: 'POST' });
        setLoading(false);
    };

    const getRating = (lead: Lead) => {
        if (lead.rating && lead.rating.includes('مزيد')) return lead.rating;
        
        // Calculate dynamically if enriched details are present but rating isn't scored yet
        let score = 0;
        if (lead.email) score++;
        if (lead.phone) score++;
        if (lead.whatsapp) score++;
        if (lead.instagram) score++;
        if (lead.tiktok) score++;
        if (lead.snapchat) score++;
        if (lead.twitter) score++;
        
        if (score >= 3) return '🟢 قوي';
        if (score >= 1) return '🟡 متوسط';
        return '🔴 ضعيف';
    };

    const filteredResults = results.filter(lead => {
        const ratingVal = getRating(lead);
        if (filters.search && !lead.storeName.toLowerCase().includes(filters.search.toLowerCase())) {
            return false;
        }
        if (filters.rating.length > 0 && !filters.rating.includes(ratingVal)) {
            return false;
        }
        if (filters.hasEmail && !lead.email) return false;
        if (filters.hasPhone && !lead.phone) return false;
        if (filters.hasSocial && !(lead.whatsapp || lead.instagram || lead.tiktok || lead.snapchat || lead.twitter || lead.facebook || lead.youtube)) {
            return false;
        }
        return true;
    });

    const toggleSelectLead = (idx: number) => {
        const newSelected = new Set(selectedLeads);
        if (newSelected.has(idx)) {
            newSelected.delete(idx);
        } else {
            newSelected.add(idx);
        }
        setSelectedLeads(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedLeads.size === filteredResults.length) {
            setSelectedLeads(new Set());
        } else {
            setSelectedLeads(new Set(filteredResults.map((_, i) => i)));
        }
    };

    const handleBulkDelete = () => {
        const newResults = results.filter((_, idx) => !selectedLeads.has(idx));
        setResults(newResults);
        setSelectedLeads(new Set());
    };

    const totalPages = Math.ceil(filteredResults.length / itemsPerPage);
    const paginatedResults = filteredResults.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="max-w-6xl mx-auto pb-12" dir="rtl">
            {/* Page Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 mb-2 font-outfit">استخبارات المتاجر (مزيد Zid)</h1>
                    <p className="text-slate-500 text-sm font-medium">كشط تجار منصة مزيد التابعة لـ Zid وإثراء بيانات الاتصال بالكامل</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-zinc-50 text-black border border-zinc-200 font-extrabold flex items-center justify-center text-xl shadow-sm">
                    Z
                </div>
            </div>

            {/* Search Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Search / Scraper Card */}
                <div className="bg-white p-6 rounded-[35px] border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-zinc-500/10 transition-colors"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-zinc-500/10 flex items-center justify-center text-zinc-800">
                                <Store size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">الكشط الأولي في مزيد (Playwright)</h3>
                        </div>

                        <div className="space-y-3">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={mazeedQuery}
                                    onChange={(e) => setMazeedQuery(e.target.value)}
                                    placeholder="ابحث عن منتج (مثال: عطور، توزيعات، قهوة)..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-5 pr-11 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all text-sm font-medium"
                                    onKeyDown={(e) => e.key === 'Enter' && startMazeedScrape()}
                                />
                                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            </div>

                            <div className="flex gap-2">
                                <div className="w-20 relative">
                                    <input
                                        type="number"
                                        value={mazeedLimit}
                                        onChange={(e) => setMazeedLimit(Number(e.target.value))}
                                        placeholder="الحد"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-3 text-center text-slate-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all text-sm font-bold"
                                        title="الحد الأقصى للمتاجر"
                                    />
                                </div>
                                <ActionButton
                                    onClick={() => startMazeedScrape()}
                                    disabled={loading}
                                    active={true}
                                    variant="primary"
                                    icon={loading ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
                                    label="بدء الاستخراج"
                                    className="flex-1 justify-center py-3.5 !bg-black hover:!bg-zinc-800 text-white rounded-2xl"
                                />
                                <ActionButton
                                    onClick={addToWaitingList}
                                    disabled={!mazeedQuery.trim()}
                                    variant="ghost"
                                    icon={<RotateCcw size={18} className="rotate-180" />}
                                    label="للقائمة"
                                    className="px-4 py-3.5 border-slate-200 hover:bg-slate-50 rounded-2xl"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Enrichment Card */}
                <div className="bg-white p-6 rounded-[35px] border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-900/5 blur-3xl -mr-16 -mt-16 group-hover:bg-slate-900/10 transition-colors"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-slate-900/5 flex items-center justify-center text-slate-900">
                                <Globe size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">الإثراء العميق والتصنيف (Zid Official Domains)</h3>
                        </div>

                        <div className="space-y-3">
                            <div className="relative">
                                <select
                                    value={selectedSheet}
                                    onChange={(e) => setSelectedSheet(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-5 pr-9 text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all cursor-pointer text-sm font-semibold"
                                >
                                    <option value="">اختر ورقة البحث لتطويرها...</option>
                                    {availableSheets.map(name => (
                                        <option key={name} value={name}>{name}</option>
                                    ))}
                                </select>
                                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            </div>

                            <ActionButton
                                onClick={startEnrich}
                                disabled={loading || (!selectedSheet && availableSheets.length > 0)}
                                active={true}
                                variant="secondary"
                                icon={loading ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
                                label="تشغيل محرك الإثراء والاتصالات"
                                className="w-full justify-center py-3.5 rounded-2xl border-slate-300 hover:bg-slate-50"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Waiting List Section */}
            {waitingList.length > 0 && (
                <div className="mb-8 bg-white p-6 rounded-[35px] border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-zinc-500/10 flex items-center justify-center text-zinc-800">
                                <RotateCcw size={20} className="rotate-180" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">قائمة الكلمات المنتظرة في مزيد</h3>
                                <p className="text-slate-500 text-xs font-medium">{waitingList.filter(i => i.status === 'completed').length} من أصل {waitingList.length} مكتملة</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <ActionButton
                                onClick={toggleQueue}
                                disabled={loading && !isQueueRunning}
                                variant={isQueueRunning ? "danger" : "primary"}
                                icon={isQueueRunning ? <Square size={18} /> : <Play size={18} />}
                                label={isQueueRunning ? "إيقاف مؤقت" : "تشغيل القائمة"}
                                size="sm"
                                className="rounded-xl"
                            />
                            <ActionButton
                                onClick={() => setWaitingList([])}
                                disabled={isQueueRunning}
                                variant="ghost"
                                icon={<Trash2 size={18} />}
                                label="مسح الكل"
                                size="sm"
                                className="rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {waitingList.map((item) => (
                            <div key={item.id} className={`p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                                item.status === 'processing' ? 'border-black bg-zinc-50' :
                                item.status === 'completed' ? 'border-emerald-200 bg-emerald-50/30' :
                                item.status === 'failed' ? 'border-rose-200 bg-rose-50/30' :
                                'border-slate-100 bg-slate-50/30'
                            }`}>
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                        item.status === 'processing' ? 'bg-black text-white animate-pulse' :
                                        item.status === 'completed' ? 'bg-emerald-500 text-white' :
                                        item.status === 'failed' ? 'bg-rose-500 text-white' :
                                        'bg-slate-200 text-slate-500'
                                    }`}>
                                        {item.status === 'processing' ? <Loader2 size={14} className="animate-spin" /> : 
                                         item.status === 'completed' ? <Check size={14} /> :
                                         item.status === 'failed' ? <X size={14} /> :
                                         <Square size={14} />}
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="font-bold text-slate-900 text-sm truncate">{item.query}</p>
                                        <p className="text-slate-500 text-[10px]">{item.limit} متجر • {
                                            item.status === 'pending' ? 'بانتظار البدء' :
                                            item.status === 'processing' ? 'جاري الاستخراج...' :
                                            item.status === 'completed' ? 'تم الاكتمال' : 'فشلت العملية'
                                        }</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => removeFromWaitingList(item.id)}
                                    disabled={item.status === 'processing'}
                                    className="p-2 text-slate-400 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 disabled:hidden"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Merge Sheets Section */}
            {availableSheets.length > 0 && (
                <div className="mb-8 bg-white p-6 rounded-[35px] border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-zinc-500/10 transition-colors"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-zinc-500/10 flex items-center justify-center text-zinc-800">
                                <Share2 size={20} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">المجمع لبيانات مزيد (Merge Sheets)</h3>
                                <p className="text-slate-500 text-xs font-medium">ادمج الفئات المكتشفة في ورقة واحدة شاملة وخالية من التكرار</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-3">حدد أوراق العمل لدمجها:</label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border border-slate-100 rounded-xl bg-slate-50/30">
                                    {availableSheets.map(sheet => (
                                        <label key={sheet} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                                            selectedMergeSheets.includes(sheet) 
                                            ? 'bg-zinc-100 border-zinc-300 text-zinc-900 font-extrabold' 
                                            : 'bg-white border-slate-100 text-slate-600 hover:border-slate-300'
                                        }`}>
                                            <input 
                                                type="checkbox" 
                                                className="hidden"
                                                checked={selectedMergeSheets.includes(sheet)}
                                                onChange={(e) => {
                                                    if (e.target.checked) setSelectedMergeSheets(prev => [...prev, sheet]);
                                                    else setSelectedMergeSheets(prev => prev.filter(s => s !== sheet));
                                                }}
                                            />
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                                                selectedMergeSheets.includes(sheet) ? 'bg-black border-black text-white' : 'border-slate-300'
                                            }`}>
                                                {selectedMergeSheets.includes(sheet) && <Check size={12} strokeWidth={3} />}
                                            </div>
                                            <span className="text-xs font-bold truncate">{sheet}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col justify-end gap-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-slate-700">اسم الورقة الشاملة الجديدة:</label>
                                    <input
                                        type="text"
                                        value={targetMergeName}
                                        onChange={(e) => setTargetMergeName(e.target.value)}
                                        placeholder="مثال: مجمع عطور وتجميل مزيد..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all text-sm font-medium"
                                    />
                                </div>
                                <ActionButton
                                    onClick={handleMergeSheets}
                                    disabled={isMerging || selectedMergeSheets.length < 1 || !targetMergeName.trim()}
                                    variant="primary"
                                    icon={isMerging ? <Loader2 className="animate-spin" size={18} /> : <Share2 size={18} />}
                                    label={isMerging ? "جاري دمج الأوراق..." : "إتمام دمج أوراق مزيد"}
                                    className="w-full justify-center py-4 text-base rounded-2xl"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Live Logs Terminal Panel */}
            {(logs.length > 0 || loading) && (
                <div className="mb-8 bg-slate-900 rounded-[35px] border border-slate-800 p-6 shadow-2xl relative overflow-hidden font-mono text-xs text-zinc-300">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                            <Terminal size={16} className="text-zinc-400" />
                            <span className="font-bold uppercase tracking-wider text-slate-300">وحدة المراقبة الحية لكاشط مزيد (Scraper Logs)</span>
                        </div>
                        <div className="flex gap-1">
                            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
                            <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block"></span>
                            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                        </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-2 select-text text-right" dir="rtl">
                        {logs.length === 0 ? (
                            <p className="text-slate-500 italic">بانتظار بدء الكشط لمراقبة التحركات المباشرة...</p>
                        ) : (
                            logs.map((log, idx) => (
                                <p key={idx} className="leading-relaxed">{log}</p>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                    icon={<Store size={18} />}
                    label="المتاجر المكتشفة"
                    value={results.length}
                    color="slate"
                />
                <StatCard
                    icon={<Mail size={18} />}
                    label="رسائل البريد"
                    value={results.filter(r => r.email).length}
                    color="orange"
                />
                <StatCard
                    icon={<Phone size={18} />}
                    label="أرقام الهواتف"
                    value={results.filter(r => r.phone || r.whatsapp).length}
                    color="emerald"
                />
                <StatCard
                    icon={<AlertCircle size={18} />}
                    label="إيقاف / تعثر"
                    value={failed.length}
                    color="rose"
                />
            </div>

            {/* Global Actions */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
                <ActionButton
                    onClick={cancelScrape}
                    disabled={!loading}
                    variant="danger"
                    icon={<Square size={18} />}
                    label="إيقاف الكشط النشط"
                    size="sm"
                    className="rounded-xl"
                />
            </div>

            {/* Filter Bar */}
            <LeadFilterBar
                onFilterChange={setFilters}
                totalLeads={results.length}
            />

            {/* Bulk Actions Toolbar */}
            <BulkActionsToolbar
                selectedCount={selectedLeads.size}
                onSelectAll={toggleSelectAll}
                onDeselectAll={() => setSelectedLeads(new Set())}
                onExport={() => alert(`تصدير ${selectedLeads.size} متجر محدد من مزيد...`)}
                onDelete={handleBulkDelete}
                totalItems={filteredResults.length}
            />

            {/* Main Table */}
            <div className="bg-white rounded-[35px] border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-zinc-50 text-black border border-zinc-200 font-extrabold flex items-center justify-center">
                            Z
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">سجل متاجر مزيد المستهدفة</h3>
                            <p className="text-slate-500 text-xs font-medium">{filteredResults.length} نتيجة مصنفة</p>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-right min-w-[1000px]">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                                <th className="p-4 w-12 text-center">
                                    <input
                                        type="checkbox"
                                        checked={selectedLeads.size === filteredResults.length && filteredResults.length > 0}
                                        onChange={toggleSelectAll}
                                        className="w-4 h-4 rounded-lg border-2 border-slate-300 text-black focus:ring-black cursor-pointer"
                                    />
                                </th>
                                <th className="p-4 font-bold">اسم متجر التاجر</th>
                                <th className="p-4 font-bold">بيانات الاتصال</th>
                                <th className="p-4 font-bold">الموقع الرسمي</th>
                                <th className="p-4 font-bold">شبكات التواصل</th>
                                <th className="p-4 font-bold">تقييم الجودة</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredResults.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-20 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="p-8 rounded-full bg-slate-50 border border-slate-100">
                                                <Store size={48} className="opacity-20 text-slate-900" />
                                            </div>
                                            <div>
                                                <p className="text-lg font-bold text-slate-900 mb-1">لا توجد نتائج لعرضها</p>
                                                <p className="text-slate-500 text-sm">ادخل كلمة بحث وابدأ في جلب تجار مزيد الجدد</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedResults.map((lead, idx) => {
                                    const globalIdx = (currentPage - 1) * itemsPerPage + idx;
                                    const isSelected = selectedLeads.has(globalIdx);
                                    const computedRating = getRating(lead);

                                    return (
                                        <tr
                                            key={globalIdx}
                                            className={`hover:bg-slate-50/50 transition-all group cursor-pointer ${
                                                isSelected ? 'bg-zinc-100/60 hover:bg-zinc-200/60' : ''
                                            }`}
                                            onClick={() => setSelectedLead(lead)}
                                        >
                                            <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleSelectLead(globalIdx)}
                                                    className="w-4 h-4 rounded-lg border-2 border-slate-300 text-black focus:ring-black cursor-pointer"
                                                />
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-zinc-50 text-black border border-zinc-200 font-extrabold text-base flex items-center justify-center group-hover:scale-110 transition-transform">
                                                        {lead.storeName?.[0] || 'Z'}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900 text-sm">{lead.storeName}</div>
                                                        <div className="text-slate-500 text-xs flex items-center gap-1">
                                                            <CheckCircle2 size={10} className="text-emerald-500" />
                                                            زد (Zid)
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="space-y-1.5">
                                                    {lead.email && (
                                                        <div className="flex items-center gap-2 text-xs text-slate-600">
                                                            <Mail size={12} className="text-slate-400" />
                                                            <span className="truncate max-w-[150px]">{lead.email}</span>
                                                        </div>
                                                    )}
                                                    {lead.phone && (
                                                        <div className="flex items-center gap-2 text-xs text-slate-600">
                                                            <Phone size={12} className="text-slate-400" />
                                                            <span dir="ltr">{lead.phone}</span>
                                                        </div>
                                                    )}
                                                    {!lead.email && !lead.phone && (
                                                        <span className="text-slate-400 text-xs">-</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {lead.domain ? (
                                                    <a
                                                        href={lead.domain.startsWith('http') ? lead.domain : `https://${lead.domain}`}
                                                        target="_blank"
                                                        className="inline-flex items-center gap-1.5 text-zinc-900 hover:text-black text-xs font-extrabold transition-colors underline decoration-zinc-300 hover:decoration-black"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {lead.domain.replace(/^https?:\/\//, '').split('/store/')[0] || lead.domain}
                                                        <ExternalLink size={12} />
                                                    </a>
                                                ) : (
                                                    <span className="text-slate-400 text-xs">-</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-wrap gap-1.5 max-w-[140px]">
                                                    {lead.whatsapp && <SocialIcon href={lead.whatsapp} color="emerald" label="WA" size="sm" />}
                                                    {lead.instagram && <SocialIcon href={lead.instagram} color="pink" label="IG" size="sm" />}
                                                    {lead.tiktok && <SocialIcon href={lead.tiktok} color="slate" label="TT" size="sm" />}
                                                    {lead.snapchat && <SocialIcon href={lead.snapchat} color="yellow" label="SC" size="sm" />}
                                                    {!lead.whatsapp && !lead.instagram && !lead.tiktok && !lead.snapchat && (
                                                        <span className="text-slate-400 text-xs">-</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex px-3 py-1.5 rounded-full text-xs font-bold border ${
                                                    computedRating === '🟢 قوي' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                    computedRating === '🟡 متوسط' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                                                    computedRating?.includes('مزيد') ? 'bg-zinc-100 text-zinc-800 border-zinc-200' :
                                                    'bg-rose-50 text-rose-600 border-rose-100'
                                                }`}>
                                                    {computedRating ? computedRating.replace(/^🟢|🟡|🔴 /, '') : 'غير محدد'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="text-xs text-slate-500 font-medium">
                            صفحة {currentPage} من {totalPages}
                        </div>
                        <div className="flex items-center gap-2">
                            <ActionButton
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                variant="ghost"
                                icon={<ChevronRight size={16} />}
                                size="sm"
                                className="rounded-lg"
                            />
                            <ActionButton
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                variant="ghost"
                                icon={<ChevronLeft size={16} />}
                                size="sm"
                                className="rounded-lg"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Lead Detail Modal */}
            {selectedLead && (
                <LeadDetailModal
                    lead={selectedLead}
                    onClose={() => setSelectedLead(null)}
                />
            )}
        </div>
    );
}
