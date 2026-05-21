'use client';

import { useState, useEffect } from 'react';
import {
    Download,
    RotateCcw,
    Square,
    Play,
    Search,
    MapPin,
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
    X,
    Star,
    Map
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

interface Lead {
    title: string;
    storeName: string; // compatibility key
    mapsUrl: string;
    rating: number;
    reviewsCount: number;
    category: string;
    address: string;
    phone: string;
    website: string;
    domain?: string; // compatibility key
    email?: string;
    whatsapp?: string;
    instagram?: string;
    tiktok?: string;
    snapchat?: string;
    twitter?: string;
    facebook?: string;
    youtube?: string;
    subText?: string;
}

interface WaitingItem {
    id: string;
    query: string;
    limit: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
}

export default function GoogleMapsDashboard() {
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<Lead[]>([]);
    const [failed, setFailed] = useState<string[]>([]);
    const [mounted, setMounted] = useState(false);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [scrapeLimit, setScrapeLimit] = useState(50);
    
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
    const [leadNotes, setLeadNotes] = useState<Record<string, string>>({});

    // Filtering
    const [filters, setFilters] = useState<LeadFilter>({
        rating: [],
        hasEmail: false,
        hasPhone: false,
        hasSocial: false,
        search: '',
    });

    // Bulk selection & pagination
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
            const saved = localStorage.getItem('waitingList_maps');
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
            localStorage.setItem('waitingList_maps', JSON.stringify(waitingList));
        }
    }, [waitingList, mounted]);

    const fetchSheets = async () => {
        try {
            const res = await fetch(`${getBaseUrl()}/api/maps/sheets`);
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

    const startMapsScrape = async (overrideQuery?: string, overrideLimit?: number, itemId?: string) => {
        const query = overrideQuery || searchQuery;
        const limit = overrideLimit || scrapeLimit;

        if (!query.trim()) {
            alert('يرجى إدخال كلمة البحث الجغرافية أولاً (مثال: عيادات أسنان الرياض)');
            return;
        }
        
        setLoading(true);
        setLogs([]);
        addLog(`🚀 بدء استعلام خرائط قوقل لـ: "${query}" (الحد الأقصى: ${limit} منشأة)...`);
        
        try {
            const res = await fetch(`${getBaseUrl()}/api/maps`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    searchQuery: query,
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
                            addLog(`✨ تم استخراج: "${data.store.title}" | 📍 ${data.store.address}`);
                            setResults(prev => {
                                if (prev.some(r => r.mapsUrl === data.store.mapsUrl)) return prev;
                                return [...prev, data.store];
                            });
                        } else if (data.type === 'status') {
                            addLog(`⚙️ ${data.message}`);
                        } else if (data.type === 'done') {
                            addLog(`🎉 اكتمل استخراج قوقل ماب لـ "${query}" بنجاح! تم الحفظ في ملف الإكسل.`);
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
        if (!searchQuery.trim()) {
            alert('يرجى إدخال كلمة البحث أولاً');
            return;
        }
        const newItem: WaitingItem = {
            id: Math.random().toString(36).substr(2, 9),
            query: searchQuery,
            limit: scrapeLimit,
            status: 'pending'
        };
        setWaitingList(prev => [...prev, newItem]);
        setSearchQuery('');
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
                startMapsScrape(nextItem.query, nextItem.limit, nextItem.id);
            } else {
                setIsQueueRunning(false);
            }
        }
    }, [isQueueRunning, loading, waitingList]);

    const startEnrich = async () => {
        if (!selectedSheet && availableSheets.length > 0) {
            alert('يرجى اختيار ورقة عمل من القائمة لتطويرها');
            return;
        }
        setLoading(true);
        addLog(`🔎 بدء إثراء وتطوير اتصالات ومواقع ورقة خرائط قوقل [${selectedSheet || 'الكل'}]...`);
        try {
            const res = await fetch(`${getBaseUrl()}/api/maps/enrich`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sheetName: selectedSheet })
            });
            const data = await res.json();
            if (data.success) {
                addLog(`🎉 تم الانتهاء من الإثراء والتواصل العميق لجميع منشآت الورقة!`);
                alert(data.message);
                if (data.results) {
                    // Map incoming enriched results to our structure
                    const mapped = data.results.map((r: any) => ({
                        ...r,
                        storeName: r.title, // compatibility keys
                        domain: r.website
                    }));
                    setResults(mapped);
                }
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
            alert('يرجى إدخال اسم للورقة الجديدة الشاملة');
            return;
        }

        setIsMerging(true);
        try {
            const res = await fetch(`${getBaseUrl()}/api/maps/merge-sheets`, {
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
            alert('حدث خطأ غير متوقع أثناء عملية الدمج');
        } finally {
            setIsMerging(false);
        }
    };

    const cancelScrape = async () => {
        addLog('🛑 إرسال إشارة إيقاف الكشط لمكتبة خرائط قوقل...');
        await fetch('/api/maps/cancel', { method: 'POST' });
        setLoading(false);
    };

    const getLeadScore = (lead: Lead) => {
        let score = 0;
        if (lead.email && lead.email !== 'جاري كشط الموقع...') score++;
        if (lead.phone) score++;
        if (lead.website && lead.website !== 'غير متوفر') score++;
        if (lead.whatsapp || lead.instagram || lead.tiktok || lead.snapchat) score++;
        
        if (score >= 3) return '🟢 قوي';
        if (score >= 1) return '🟡 متوسط';
        return '🔴 ضعيف';
    };

    const filteredResults = results.filter(lead => {
        const ratingVal = getLeadScore(lead);
        if (filters.search && !lead.title.toLowerCase().includes(filters.search.toLowerCase())) {
            return false;
        }
        if (filters.rating.length > 0 && !filters.rating.includes(ratingVal)) {
            return false;
        }
        if (filters.hasEmail && (!lead.email || lead.email === 'جاري كشط الموقع...')) return false;
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
        <div className="max-w-6xl mx-auto pb-12 font-outfit" dir="rtl">
            {/* Page Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 mb-2">استخبارات خرائط قوقل (Google Maps Leads)</h1>
                    <p className="text-slate-500 text-sm font-medium">البحث الجغرافي واستخراج عملاء المنشآت المحلية وإثراء اتصالاتها تلقائياً</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 flex items-center justify-center text-indigo-600 font-bold text-xl border border-indigo-600/20">
                    <Map size={24} />
                </div>
            </div>

            {/* Search Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Search / Scraper Card */}
                <div className="bg-white p-6 rounded-[35px] border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-600/10 transition-colors"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 flex items-center justify-center text-indigo-600">
                                <MapPin size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">الكشط الأولي لخرائط قوقل (Serper Maps)</h3>
                        </div>

                        <div className="space-y-3">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="ابحث جغرافياً (مثال: عيادات أسنان الرياض، مغاسل جدة)..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-5 pr-11 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all text-sm font-bold"
                                    onKeyDown={(e) => e.key === 'Enter' && startMapsScrape()}
                                />
                                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            </div>

                            <div className="flex gap-2">
                                <div className="w-20 relative">
                                    <input
                                        type="number"
                                        value={scrapeLimit}
                                        onChange={(e) => setScrapeLimit(Number(e.target.value))}
                                        placeholder="الحد"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-3 text-center text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all text-sm font-bold"
                                        title="الحد الأقصى للعملاء"
                                    />
                                </div>
                                <ActionButton
                                    onClick={() => startMapsScrape()}
                                    disabled={loading}
                                    active={true}
                                    variant="primary"
                                    icon={loading ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
                                    label="بدء الاستخراج"
                                    className="flex-1 justify-center py-3.5 !bg-indigo-600 hover:!bg-indigo-700 text-white rounded-2xl"
                                />
                                <ActionButton
                                    onClick={addToWaitingList}
                                    disabled={!searchQuery.trim()}
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
                    <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-teal-500/10 transition-colors"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600">
                                <Globe size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">إثراء اتصالات المواقع ومحركات البحث</h3>
                        </div>

                        <div className="space-y-3">
                            <div className="relative">
                                <select
                                    value={selectedSheet}
                                    onChange={(e) => setSelectedSheet(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-5 pr-9 text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all cursor-pointer text-sm font-bold"
                                >
                                    <option value="">اختر ورقة البحث لتطويرها وتكثيف قنواتها...</option>
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
                                label="تشغيل محرك الكشط والإثراء للمواقع"
                                className="w-full justify-center py-3.5 rounded-2xl border-slate-300 hover:bg-slate-50 text-slate-800"
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
                            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 flex items-center justify-center text-indigo-600">
                                <RotateCcw size={20} className="rotate-180" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">قائمة استعلامات خرائط قوقل المنتظرة</h3>
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
                                item.status === 'processing' ? 'border-indigo-500 bg-indigo-50/30' :
                                item.status === 'completed' ? 'border-teal-200 bg-teal-50/30' :
                                item.status === 'failed' ? 'border-rose-200 bg-rose-50/30' :
                                'border-slate-100 bg-slate-50/30'
                            }`}>
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                        item.status === 'processing' ? 'bg-indigo-600 text-white animate-pulse' :
                                        item.status === 'completed' ? 'bg-teal-500 text-white' :
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
                                        <p className="text-slate-500 text-[10px]">{item.limit} عميل • {
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
                    <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-teal-500/10 transition-colors"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600">
                                <Share2 size={20} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">المجمع لبيانات خرائط قوقل (Merge Sheets)</h3>
                                <p className="text-slate-500 text-xs font-medium">ادمج أوراق العملاء المكتشفة في ورقة واحدة شاملة وخالية من التكرار</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-3">حدد أوراق العمل لدمجها:</label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border border-slate-100 rounded-xl bg-slate-50/30">
                                    {availableSheets.map(sheet => (
                                        <label key={sheet} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                                            selectedMergeSheets.includes(sheet) 
                                            ? 'bg-teal-50 border-teal-200 text-teal-700' 
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
                                                selectedMergeSheets.includes(sheet) ? 'bg-teal-500 border-teal-500 text-white' : 'border-slate-300'
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
                                        placeholder="مثال: مجمع عيادات أسنان قوقل ماب..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-sm font-bold"
                                    />
                                </div>
                                <ActionButton
                                    onClick={handleMergeSheets}
                                    disabled={isMerging || selectedMergeSheets.length < 1 || !targetMergeName.trim()}
                                    variant="success"
                                    icon={isMerging ? <Loader2 className="animate-spin" size={18} /> : <Share2 size={18} />}
                                    label={isMerging ? "جاري دمج الأوراق..." : "إتمام دمج الأوراق وحذف المكرر"}
                                    className="w-full justify-center py-4 text-base rounded-2xl text-white bg-teal-600 hover:bg-teal-700 border-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Live Logs Terminal Panel */}
            {(logs.length > 0 || loading) && (
                <div className="mb-8 bg-slate-900 rounded-[35px] border border-slate-800 p-6 shadow-2xl relative overflow-hidden font-mono text-xs text-indigo-400">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                            <Terminal size={16} className="text-indigo-500" />
                            <span className="font-bold uppercase tracking-wider text-slate-300">وحدة المراقبة الحية لكاشط خرائط قوقل (Live Logs)</span>
                        </div>
                        <div className="flex gap-1">
                            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
                            <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block"></span>
                            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                        </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-2 select-text text-right" dir="rtl">
                        {logs.length === 0 ? (
                            <p className="text-slate-500 italic">بانتظار بدء كشط قوقل لمراقبة التحركات المباشرة...</p>
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
                    icon={<MapPin size={18} />}
                    label="المنشآت المكتشفة"
                    value={results.length}
                    color="blue"
                />
                <StatCard
                    icon={<Globe size={18} />}
                    label="مواقع إلكترونية"
                    value={results.filter(r => r.website && r.website !== 'غير متوفر' && r.website !== 'جاري كشط الموقع...').length}
                    color="slate"
                />
                <StatCard
                    icon={<Phone size={18} />}
                    label="أرقام هواتف مباشرة"
                    value={results.filter(r => r.phone).length}
                    color="emerald"
                />
                <StatCard
                    icon={<Mail size={18} />}
                    label="بريد إلكتروني مكتشف"
                    value={results.filter(r => r.email && r.email !== 'جاري كشط الموقع...').length}
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
            <BulkActionsToolbarCustom
                selectedCount={selectedLeads.size}
                onSelectAll={toggleSelectAll}
                onDeselectAll={() => setSelectedLeads(new Set())}
                onExport={() => alert(`تصدير ${selectedLeads.size} منشأة محددة من خرائط قوقل...`)}
                onDelete={handleBulkDelete}
                totalItems={filteredResults.length}
            />

            {/* Main Table */}
            <div className="bg-white rounded-[35px] border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600/10 flex items-center justify-center text-indigo-600 font-bold border border-indigo-600/20">
                            <MapPin size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">سجل استخبارات منشآت خرائط قوقل</h3>
                            <p className="text-slate-500 text-xs font-medium">{filteredResults.length} نتيجة مصنفة</p>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-right min-w-[1100px]">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                                <th className="p-4 w-12 text-center">
                                    <input
                                        type="checkbox"
                                        checked={selectedLeads.size === filteredResults.length && filteredResults.length > 0}
                                        onChange={toggleSelectAll}
                                        className="w-4 h-4 rounded-lg border-2 border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                                    />
                                </th>
                                <th className="p-4 font-bold">المنشأة والنشاط</th>
                                <th className="p-4 font-bold">قوقل ماب والتقييم</th>
                                <th className="p-4 font-bold">بيانات الاتصال</th>
                                <th className="p-4 font-bold">الموقع الرسمي</th>
                                <th className="p-4 font-bold">قنوات التواصل</th>
                                <th className="p-4 font-bold">قوة العميل</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredResults.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-20 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="p-8 rounded-full bg-slate-50 border border-slate-100">
                                                <MapPin size={48} className="opacity-20 text-slate-900" />
                                            </div>
                                            <div>
                                                <p className="text-lg font-bold text-slate-900 mb-1">لا توجد نتائج لعرضها</p>
                                                <p className="text-slate-500 text-sm">ادخل الكلمة الجغرافية المفتاحية وابدأ استخبارات الأعمال</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedResults.map((lead, idx) => {
                                    const globalIdx = (currentPage - 1) * itemsPerPage + idx;
                                    const isSelected = selectedLeads.has(globalIdx);
                                    const computedScore = getLeadScore(lead);

                                    return (
                                        <tr
                                            key={globalIdx}
                                            className={`hover:bg-slate-50/50 transition-all group cursor-pointer ${
                                                isSelected ? 'bg-indigo-50/30 hover:bg-indigo-100/30' : ''
                                            }`}
                                            onClick={() => setSelectedLead(lead)}
                                        >
                                            <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleSelectLead(globalIdx)}
                                                    className="w-4 h-4 rounded-lg border-2 border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                                                />
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-indigo-600/10 flex items-center justify-center text-indigo-600 font-extrabold text-base border border-indigo-600/20 group-hover:scale-110 transition-transform">
                                                        {lead.title?.[0] || '📍'}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900 text-sm">{lead.title}</div>
                                                        <div className="text-slate-500 text-xs flex items-center gap-1 font-bold">
                                                            {lead.category}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <Star size={14} className="text-yellow-500 fill-yellow-500" />
                                                        <span className="text-xs font-bold text-slate-800">{lead.rating || 0}</span>
                                                        <span className="text-[10px] text-slate-500">({lead.reviewsCount || 0} مراجع)</span>
                                                    </div>
                                                    <a 
                                                        href={lead.mapsUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[10px] text-indigo-600 hover:underline flex items-center gap-0.5"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <MapPin size={10} />
                                                        عرض على الخريطة
                                                    </a>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="space-y-1">
                                                    {lead.email && lead.email !== 'جاري كشط الموقع...' && (
                                                        <div className="flex items-center gap-2 text-xs text-slate-600">
                                                            <Mail size={12} className="text-slate-400" />
                                                            <span className="truncate max-w-[180px] font-bold">{lead.email}</span>
                                                        </div>
                                                    )}
                                                    {lead.phone && (
                                                        <div className="flex items-center gap-2 text-xs text-slate-600">
                                                            <Phone size={12} className="text-slate-400" />
                                                            <span dir="ltr" className="font-bold">{lead.phone}</span>
                                                        </div>
                                                    )}
                                                    {!lead.phone && (!lead.email || lead.email === 'جاري كشط الموقع...') && (
                                                        <span className="text-slate-400 text-xs">-</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {lead.website && lead.website !== 'غير متوفر' ? (
                                                    <a
                                                        href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                                                        target="_blank"
                                                        className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 text-xs font-bold transition-colors"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {lead.website.replace(/^https?:\/\//, '').split('/')[0]}
                                                        <ExternalLink size={12} />
                                                    </a>
                                                ) : (
                                                    <span className="text-slate-400 text-xs">لا يوجد موقع</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-wrap gap-1.5 max-w-[140px]">
                                                    {lead.whatsapp && <SocialIcon href={`https://wa.me/${lead.whatsapp}`} color="emerald" label="WA" size="sm" />}
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
                                                    computedScore === '🟢 قوي' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                    computedScore === '🟡 متوسط' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                                                    'bg-rose-50 text-rose-600 border-rose-100'
                                                }`}>
                                                    {computedScore.replace(/^🟢|🟡|🔴 /, '')}
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

            {/* Custom Lead Detail Modal */}
            {selectedLead && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedLead(null)}>
                    <div
                        className="bg-white rounded-[32px] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex items-center justify-between rounded-t-[32px] z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-indigo-500/30">
                                    {selectedLead.title?.[0] || '📍'}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900">{selectedLead.title}</h2>
                                    <div className="text-xs font-bold text-slate-500 mt-1">{selectedLead.category}</div>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedLead(null)}
                                className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            {/* Address and Google Maps */}
                            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3">
                                <div className="flex items-center gap-3">
                                    <MapPin size={18} className="text-indigo-600" />
                                    <span className="text-sm font-bold text-slate-700">الموقع الجغرافي والعنوان</span>
                                </div>
                                <p className="text-slate-800 text-sm font-semibold">{selectedLead.address}</p>
                                <div className="flex flex-wrap gap-3 pt-2">
                                    <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                                        <Star size={14} className="text-yellow-500 fill-yellow-500" />
                                        <span className="font-bold">تقييم قوقل: {selectedLead.rating || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                                        <Star size={14} className="text-indigo-500 fill-indigo-100" />
                                        <span className="font-bold">المراجعات: {selectedLead.reviewsCount || 0} مراجع</span>
                                    </div>
                                    <a
                                        href={selectedLead.mapsUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 text-xs font-bold bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 transition-colors"
                                    >
                                        فتح خرائط قوقل
                                        <ExternalLink size={14} />
                                    </a>
                                </div>
                            </div>

                            {/* Website */}
                            {selectedLead.website && selectedLead.website !== 'غير متوفر' && (
                                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                                    <div className="flex items-center gap-3 mb-3">
                                        <Globe size={18} className="text-slate-400" />
                                        <span className="text-sm font-bold text-slate-700">الموقع الإلكتروني الرسمي</span>
                                    </div>
                                    <a
                                        href={selectedLead.website.startsWith('http') ? selectedLead.website : `https://${selectedLead.website}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-bold transition-colors"
                                    >
                                        {selectedLead.website.replace(/^https?:\/\//, '')}
                                        <ExternalLink size={16} />
                                    </a>
                                </div>
                            )}

                            {/* Contact Info */}
                            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                                <div className="flex items-center gap-3 mb-4">
                                    <Mail size={18} className="text-slate-400" />
                                    <span className="text-sm font-bold text-slate-700">بيانات الاتصال</span>
                                </div>
                                <div className="space-y-3">
                                    {selectedLead.email && selectedLead.email !== 'جاري كشط الموقع...' && (
                                        <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 group hover:border-indigo-300 transition-colors">
                                            <Mail size={16} className="text-slate-400" />
                                            <span className="text-slate-700 font-mono text-sm flex-1 truncate">{selectedLead.email}</span>
                                            <button
                                                onClick={() => copyToClipboard(selectedLead.email!, 'email')}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-slate-50 rounded-lg"
                                            >
                                                {copied === 'email' ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} className="text-slate-400" />}
                                            </button>
                                        </div>
                                    )}
                                    {selectedLead.phone && (
                                        <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 group hover:border-indigo-300 transition-colors">
                                            <Phone size={16} className="text-slate-400" />
                                            <span className="text-slate-700 font-mono text-sm" dir="ltr">{selectedLead.phone}</span>
                                            <button
                                                onClick={() => copyToClipboard(selectedLead.phone!, 'phone')}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-slate-50 rounded-lg"
                                            >
                                                {copied === 'phone' ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} className="text-slate-400" />}
                                            </button>
                                        </div>
                                    )}
                                    {!selectedLead.phone && (!selectedLead.email || selectedLead.email === 'جاري كشط الموقع...') && (
                                        <p className="text-slate-400 text-sm text-center py-4">لم يتم استخراج بيانات اتصال حتى الآن. قم بتشغيل الإثراء!</p>
                                    )}
                                </div>
                            </div>

                            {/* Social Media */}
                            {(selectedLead.whatsapp || selectedLead.instagram || selectedLead.tiktok || selectedLead.snapchat) && (
                                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Globe size={18} className="text-slate-400" />
                                        <span className="text-sm font-bold text-slate-700">قنوات التواصل الاجتماعي</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedLead.whatsapp && <SocialIcon href={`https://wa.me/${selectedLead.whatsapp}`} color="emerald" label="WhatsApp" size="md" />}
                                        {selectedLead.instagram && <SocialIcon href={selectedLead.instagram} color="pink" label="Instagram" size="md" />}
                                        {selectedLead.tiktok && <SocialIcon href={selectedLead.tiktok} color="slate" label="TikTok" size="md" />}
                                        {selectedLead.snapchat && <SocialIcon href={selectedLead.snapchat} color="yellow" label="Snapchat" size="md" />}
                                    </div>
                                </div>
                            )}

                            {/* Notes */}
                            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                                <div className="flex items-center gap-3 mb-3">
                                    <Mail size={18} className="text-slate-400" />
                                    <span className="text-sm font-bold text-slate-700">ملاحظات فريق المبيعات</span>
                                </div>
                                <textarea
                                    value={leadNotes[selectedLead.mapsUrl] || ''}
                                    onChange={(e) => setLeadNotes(prev => ({ ...prev, [selectedLead.mapsUrl]: e.target.value }))}
                                    placeholder="أضف ملاحظات تفصيلية أو إجراء تواصل حول هذه المنشأة..."
                                    className="w-full bg-white border border-slate-200 rounded-xl p-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all min-h-[100px] text-sm"
                                />
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="sticky bottom-0 bg-white border-t border-slate-100 p-6 flex items-center justify-end gap-3 rounded-b-[32px]">
                            <ActionButton onClick={() => setSelectedLead(null)} variant="ghost" label="إغلاق" />
                            {selectedLead.website && selectedLead.website !== 'غير متوفر' && (
                                <ActionButton
                                    variant="primary"
                                    icon={<ExternalLink size={18} />}
                                    label="زيارة الموقع"
                                    onClick={() => window.open(selectedLead.website.startsWith('http') ? selectedLead.website : `https://${selectedLead.website}`, '_blank')}
                                    className="!bg-indigo-600 hover:!bg-indigo-700 text-white rounded-2xl"
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

interface BulkActionsToolbarCustomProps {
    selectedCount: number;
    onSelectAll: () => void;
    onDeselectAll: () => void;
    onExport: () => void;
    onDelete: () => void;
    totalItems: number;
}

function BulkActionsToolbarCustom({
    selectedCount,
    onSelectAll,
    onDeselectAll,
    onExport,
    onDelete,
    totalItems
}: BulkActionsToolbarCustomProps) {
    if (selectedCount === 0) return null;

    return (
        <div className="mb-6 bg-slate-900 text-white p-4 rounded-[24px] border border-slate-800 shadow-xl flex items-center justify-between animate-in" dir="rtl">
            <div className="flex items-center gap-3">
                <span className="bg-indigo-600 text-white text-xs font-black px-2.5 py-1 rounded-full">{selectedCount}</span>
                <span className="text-xs font-bold text-slate-300">منشأة محددة لإجراء عملية جماعية</span>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={onExport}
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all"
                >
                    <Download size={14} />
                    تصدير المحدد
                </button>
                <button
                    onClick={onDelete}
                    className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all"
                >
                    <Trash2 size={14} />
                    حذف المحدد
                </button>
                <button
                    onClick={onDeselectAll}
                    className="text-slate-400 hover:text-white text-xs font-bold px-3 py-2 transition-colors"
                >
                    إلغاء التحديد
                </button>
            </div>
        </div>
    );
}
