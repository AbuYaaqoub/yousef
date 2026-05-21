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
    Filter,
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
    description?: string;
}

interface WaitingItem {
    id: string;
    query: string;
    limit: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
}

export default function Dashboard() {
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<Lead[]>([]);
    const [failed, setFailed] = useState<string[]>([]);
    const [mounted, setMounted] = useState(false);
    const [source, setSource] = useState<'salla' | 'mahally'>('salla');
    const [mahallyQuery, setMahallyQuery] = useState('');
    const [mahallyLimit, setMahallyLimit] = useState(50);
    
    // Waiting List State
    const [waitingList, setWaitingList] = useState<WaitingItem[]>([]);
    const [isQueueRunning, setIsQueueRunning] = useState(false);

    // Load from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('waitingList');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Reset processing status to pending on load
                setWaitingList(parsed.map((item: WaitingItem) => 
                    item.status === 'processing' ? { ...item, status: 'pending' } : item
                ));
            } catch (e) {
                console.error('Failed to parse waiting list', e);
            }
        }
    }, []);

    // Save to localStorage
    useEffect(() => {
        localStorage.setItem('waitingList', JSON.stringify(waitingList));
    }, [waitingList]);

    useEffect(() => {
        setMounted(true);
    }, []);

    const [copied, setCopied] = useState<string | null>(null);

    // Merge Sheets State
    const [selectedMergeSheets, setSelectedMergeSheets] = useState<string[]>([]);
    const [targetMergeName, setTargetMergeName] = useState('');
    const [isMerging, setIsMerging] = useState(false);

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const [manualUrl, setManualUrl] = useState('');

    const startGoogleScrape = async (retryFailed = false, specificUrl = '') => {
        setLoading(true);
        setSource('salla');
        try {
            const res = await fetch(`${getBaseUrl()}/api/scrape`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'start',
                    failedUrls: retryFailed ? failed : [],
                    targetUrl: specificUrl || manualUrl,
                    searchQuery: ''
                })
            });
            const data = await res.json();
            if (data.results) {
                if (specificUrl || manualUrl) {
                    setResults(prev => {
                        const newResults = [...data.results, ...prev];
                        return Array.from(new Map(newResults.map(item => [item.domain, item])).values());
                    });
                    setManualUrl('');
                } else {
                    setResults(data.results);
                    setFailed(data.failedUrls);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const startMahallyScrape = async (overrideQuery?: string, overrideLimit?: number, itemId?: string) => {
        const query = overrideQuery || mahallyQuery;
        const limit = overrideLimit || mahallyLimit;

        if (!query.trim()) {
            alert('يرجى إدخال اسم المنتج للبحث');
            return;
        }
        
        setLoading(true);
        setSource('mahally');
        // setResults([]); // No longer clearing results to allow accumulation if desired, or keep it for fresh starts
        
        try {
            const res = await fetch(`${getBaseUrl()}/api/mahally`, {
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
                            setResults(prev => {
                                if (prev.some(r => r.domain === data.store.domain)) return prev;
                                return [...prev, data.store];
                            });
                        } else if (data.type === 'status') {
                            console.log('Status update:', data.message);
                        } else if (data.type === 'done') {
                            console.log('Mahally search finished');
                            if (itemId || overrideQuery) {
                                // If this was from the queue, mark as completed
                                setWaitingList(prev => prev.map(item => 
                                    (itemId ? item.id === itemId : item.query === overrideQuery) ? { ...item, status: 'completed' } : item
                                ));
                            }
                        } else if (data.type === 'error') {
                            if (itemId || overrideQuery) {
                                setWaitingList(prev => prev.map(item => 
                                    (itemId ? item.id === itemId : item.query === overrideQuery) ? { ...item, status: 'failed' } : item
                                ));
                            }
                            alert('خطأ: ' + data.message);
                        }
                    } catch (e) {
                        console.error('Error parsing chunk:', e);
                    }
                }
            }
        } catch (err: any) {
            console.error(err);
            if (itemId || overrideQuery) {
                setWaitingList(prev => prev.map(item => 
                    (itemId ? item.id === itemId : item.query === overrideQuery) ? { ...item, status: 'failed' } : item
                ));
            }
            alert('تعذر الاتصال بالسيرفر: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const addToWaitingList = () => {
        if (!mahallyQuery.trim()) {
            alert('يرجى إدخال اسم المنتج أولاً');
            return;
        }
        const newItem: WaitingItem = {
            id: Math.random().toString(36).substr(2, 9),
            query: mahallyQuery,
            limit: mahallyLimit,
            status: 'pending'
        };
        setWaitingList(prev => [...prev, newItem]);
        setMahallyQuery('');
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
                startMahallyScrape(nextItem.query, nextItem.limit, nextItem.id);
            } else {
                // All done or nothing pending
                setIsQueueRunning(false);
            }
        }
    }, [isQueueRunning, loading, waitingList]);

    const [availableSheets, setAvailableSheets] = useState<string[]>([]);
    const [selectedSheet, setSelectedSheet] = useState<string>('');

    useEffect(() => {
        const fetchSheets = async () => {
            try {
                const res = await fetch(`${getBaseUrl()}/api/mahally/sheets`);
                const data = await res.json();
                if (data.success) setAvailableSheets(data.sheets);
            } catch (err) {
                console.error('Failed to fetch sheets:', err);
            }
        };
        fetchSheets();
    }, [results]);

    const startEnrich = async () => {
        if (!selectedSheet && availableSheets.length > 0) {
            alert('يرجى اختيار تصنيف من القائمة لتطويره');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${getBaseUrl()}/api/mahally/enrich`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sheetName: selectedSheet })
            });
            const data = await res.json();
            if (data.success) {
                alert(data.message);
                if (data.results) setResults(data.results);
            } else {
                alert('خطأ: ' + data.error);
            }
        } catch (err) {
            console.error(err);
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
            const res = await fetch(`${getBaseUrl()}/api/mahally/merge-sheets`, {
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
                // Refresh sheets list
                const sheetsRes = await fetch(`${getBaseUrl()}/api/mahally/sheets`);
                const sheetsData = await sheetsRes.json();
                if (sheetsData.success) setAvailableSheets(sheetsData.sheets);
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
        if (source === 'salla') {
            await fetch('/api/scrape', { method: 'POST', body: JSON.stringify({ action: 'cancel' }) });
        } else if (source === 'mahally') {
            await fetch('/api/mahally/cancel', { method: 'POST' });
        }
        setLoading(false);
    };

    const exportExcel = () => {
        fetch('/api/export').then(res => res.blob()).then(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `sallahunter_leads_${new Date().toISOString().split('T')[0]}.xlsx`;
            a.click();
        });
    };

    // Filtering
    const [filters, setFilters] = useState<LeadFilter>({
        rating: [],
        hasEmail: false,
        hasPhone: false,
        hasSocial: false,
        search: '',
    });

    const filteredResults = results.filter(lead => {
        if (filters.search && !lead.storeName.toLowerCase().includes(filters.search.toLowerCase())) {
            return false;
        }
        if (filters.rating.length > 0 && !filters.rating.includes(lead.rating)) {
            return false;
        }
        if (filters.hasEmail && !lead.email) return false;
        if (filters.hasPhone && !lead.phone) return false;
        if (filters.hasSocial && !(lead.whatsapp || lead.instagram || lead.tiktok || lead.snapchat || lead.twitter || lead.facebook || lead.youtube)) {
            return false;
        }
        return true;
    });

    // Bulk selection
    const [selectedLeads, setSelectedLeads] = useState<Set<number>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

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

    const handleBulkExport = () => {
        // TODO: Implement bulk export with selected leads
        alert(`تصدير ${selectedLeads.size} متجر محدد...`);
    };

    const handleBulkDelete = () => {
        const newResults = results.filter((_, idx) => !selectedLeads.has(idx));
        setResults(newResults);
        setSelectedLeads(new Set());
    };

    // Detail modal
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

    // Pagination
    const totalPages = Math.ceil(filteredResults.length / itemsPerPage);
    const paginatedResults = filteredResults.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // نستخدم mounted فقط للتحكم في بعض العناصر التي قد تسبب مشاكل Hydration وليس لمنع عرض الصفحة بالكامل

    return (
        <div className="max-w-6xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">لوحة التحكم</h1>
                <p className="text-slate-500 text-sm font-medium">استخرج وحلل بيانات المتاجر من سلة ومحلي</p>
            </div>

            {/* Search Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Google Search Card */}
                <div className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-orange-500/10 transition-colors"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-slate-900/5 flex items-center justify-center text-slate-900">
                                <Globe size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">البحث العميق (Google Enrich)</h3>
                        </div>

                        <div className="space-y-3">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={manualUrl}
                                    onChange={(e) => setManualUrl(e.target.value)}
                                    placeholder="رابط متجر محدد لفحصه..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-5 pr-11 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-sm"
                                />
                                <ExternalLink className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            </div>

                            <div className="relative">
                                <select
                                    value={selectedSheet}
                                    onChange={(e) => setSelectedSheet(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-5 pr-9 text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all cursor-pointer text-sm"
                                >
                                    <option value="">اختر تصنيف للبحث...</option>
                                    {availableSheets.map(name => (
                                        <option key={name} value={name}>{name}</option>
                                    ))}
                                </select>
                                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            </div>

                            <ActionButton
                                onClick={manualUrl ? () => startGoogleScrape(false) : startEnrich}
                                disabled={loading || (!manualUrl && !selectedSheet)}
                                active={true}
                                variant="primary"
                                icon={loading && source === 'salla' ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
                                label={manualUrl ? "فحص هذا المتجر" : "بدء استخراج البيانات"}
                                className="w-full justify-center py-3.5"
                            />
                        </div>
                    </div>
                </div>

                {/* Mahally Search Card */}
                <div className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-900/5 blur-3xl -mr-16 -mt-16 group-hover:bg-slate-900/10 transition-colors"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600">
                                <Store size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">استخراج أولي (Mahally)</h3>
                        </div>

                        <div className="space-y-3">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={mahallyQuery}
                                    onChange={(e) => setMahallyQuery(e.target.value)}
                                    placeholder="ابحث عن منتج (مثال: بخور، فساتين)..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-5 pr-11 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all text-sm"
                                    onKeyDown={(e) => e.key === 'Enter' && startMahallyScrape()}
                                />
                                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            </div>

                            <div className="flex gap-2">
                                <div className="w-20 relative">
                                    <input
                                        type="number"
                                        value={mahallyLimit}
                                        onChange={(e) => setMahallyLimit(Number(e.target.value))}
                                        placeholder="الحد"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-3 text-center text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all text-sm"
                                        title="الحد الأقصى للمتاجر"
                                    />
                                </div>
                                <ActionButton
                                    onClick={() => startMahallyScrape()}
                                    disabled={loading}
                                    active={true}
                                    variant="secondary"
                                    icon={loading && source === 'mahally' ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
                                    label="بدء"
                                    className="flex-1 justify-center py-3.5"
                                />
                                <ActionButton
                                    onClick={addToWaitingList}
                                    disabled={!mahallyQuery.trim()}
                                    variant="ghost"
                                    icon={<RotateCcw size={18} className="rotate-180" />}
                                    label="للقائمة"
                                    className="px-4 py-3.5 border-slate-200 hover:bg-slate-50"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Waiting List Section */}
            {waitingList.length > 0 && (
                <div className="mb-8 bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600">
                                <RotateCcw size={20} className="rotate-180" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">قائمة الكلمات المنتظرة</h3>
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
                            />
                            <ActionButton
                                onClick={() => setWaitingList([])}
                                disabled={isQueueRunning}
                                variant="ghost"
                                icon={<Trash2 size={18} />}
                                label="مسح الكل"
                                size="sm"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {waitingList.map((item) => (
                            <div key={item.id} className={`p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                                item.status === 'processing' ? 'border-orange-500 bg-orange-50/30' :
                                item.status === 'completed' ? 'border-emerald-200 bg-emerald-50/30' :
                                item.status === 'failed' ? 'border-rose-200 bg-rose-50/30' :
                                'border-slate-100 bg-slate-50/30'
                            }`}>
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                        item.status === 'processing' ? 'bg-orange-500 text-white animate-pulse' :
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

            {/* Merge Sheets Section (المجمع) */}
            {availableSheets.length > 0 && (
                <div className="mb-8 bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-colors"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                <Share2 size={20} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">المجمع (Merge Sheets)</h3>
                                <p className="text-slate-500 text-xs font-medium">ادمج عدة أوراق في ورقة واحدة جديدة بدون تكرار</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-3">اختر الأوراق المراد دمجها:</label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border border-slate-100 rounded-xl bg-slate-50/30">
                                    {availableSheets.map(sheet => (
                                        <label key={sheet} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                                            selectedMergeSheets.includes(sheet) 
                                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
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
                                                selectedMergeSheets.includes(sheet) ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'
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
                                    <label className="block text-sm font-bold text-slate-700">اسم الورقة الجديدة:</label>
                                    <input
                                        type="text"
                                        value={targetMergeName}
                                        onChange={(e) => setTargetMergeName(e.target.value)}
                                        placeholder="مثال: المجمع الشامل، دمج عطور وبخور..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
                                    />
                                </div>
                                <ActionButton
                                    onClick={handleMergeSheets}
                                    disabled={isMerging || selectedMergeSheets.length < 1 || !targetMergeName.trim()}
                                    variant="success"
                                    icon={isMerging ? <Loader2 className="animate-spin" size={18} /> : <Share2 size={18} />}
                                    label={isMerging ? "جاري الدمج..." : "بدء عملية الدمج"}
                                    className="w-full justify-center py-4 text-base"
                                />
                            </div>
                        </div>
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
                    label="المتعثرة"
                    value={failed.length}
                    color="rose"
                />
            </div>

            {/* Global Actions */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
                <ActionButton
                    onClick={() => startGoogleScrape(true)}
                    disabled={loading || !failed.length}
                    variant="secondary"
                    icon={<RotateCcw size={18} />}
                    label="إعادة المحاولة"
                    size="sm"
                />
                <ActionButton
                    onClick={cancelScrape}
                    disabled={!loading}
                    variant="danger"
                    icon={<Square size={18} />}
                    label="إيقاف"
                    size="sm"
                />
                <ActionButton
                    onClick={exportExcel}
                    disabled={!results.length}
                    variant="success"
                    icon={<Download size={18} />}
                    label="تصدير Excel"
                    size="sm"
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
                onExport={handleBulkExport}
                onDelete={handleBulkDelete}
                totalItems={filteredResults.length}
            />

            {/* Main Table */}
            <div className="bg-white rounded-[28px] border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900/5 flex items-center justify-center text-slate-900">
                            <Globe size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">نتائج البحث</h3>
                            <p className="text-slate-500 text-xs font-medium">{filteredResults.length} نتيجة</p>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-right min-w-[1000px]">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                                <th className="p-4 w-12">
                                    <input
                                        type="checkbox"
                                        checked={selectedLeads.size === filteredResults.length && filteredResults.length > 0}
                                        onChange={toggleSelectAll}
                                        className="w-4 h-4 rounded-lg border-2 border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                                    />
                                </th>
                                <th className="p-4 font-bold">المتجر</th>
                                <th className="p-4 font-bold">اتصال</th>
                                <th className="p-4 font-bold">النطاق</th>
                                <th className="p-4 font-bold">سوشيال</th>
                                <th className="p-4 font-bold">تقييم</th>
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
                                                <p className="text-lg font-bold text-slate-900 mb-1">في انتظار البحث</p>
                                                <p className="text-slate-500 text-sm">ابدأ بالاستخراج لرؤية النتائج</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedResults.map((lead, idx) => {
                                    const globalIdx = (currentPage - 1) * itemsPerPage + idx;
                                    const isSelected = selectedLeads.has(globalIdx);

                                    return (
                                        <tr
                                            key={globalIdx}
                                            className={`hover:bg-slate-50 transition-all group cursor-pointer ${
                                                isSelected ? 'bg-orange-50 hover:bg-orange-100' : ''
                                            }`}
                                            onClick={() => setSelectedLead(lead)}
                                        >
                                            <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleSelectLead(globalIdx)}
                                                    className="w-4 h-4 rounded-lg border-2 border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                                                />
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600 font-bold text-lg border border-orange-500/20 group-hover:scale-110 transition-transform">
                                                        {lead.storeName?.[0] || 'S'}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900 text-sm">{lead.storeName}</div>
                                                        <div className="text-slate-500 text-xs flex items-center gap-1">
                                                            <CheckCircle2 size={10} className="text-emerald-500" />
                                                            موثق
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
                                                        className="inline-flex items-center gap-1.5 text-orange-600 hover:text-orange-700 text-xs font-bold transition-colors"
                                                    >
                                                        {lead.domain.replace(/^https?:\/\//, '')}
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
                                                    lead.rating === '🟢 قوي' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                    lead.rating === '🟡 متوسط' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                                                    lead.rating?.includes('محلي') ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                    'bg-rose-50 text-rose-600 border-rose-100'
                                                }`}>
                                                    {lead.rating ? lead.rating.replace(/^🟢|🟡|🔴 /, '') : 'غير محدد'}
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
                            />
                            <ActionButton
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                variant="ghost"
                                icon={<ChevronLeft size={16} />}
                                size="sm"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Error Section */}
            {failed.length > 0 && !loading && (
                <div className="mt-6 bg-rose-50 border border-rose-100 p-5 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-rose-100 rounded-xl">
                            <AlertCircle size={18} className="text-rose-600" />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 text-sm">فشل استخراج {failed.length} متجر</h4>
                            <p className="text-slate-500 text-xs font-medium">يمكنك إعادة المحاولة</p>
                        </div>
                    </div>
                    <ActionButton
                        onClick={() => startGoogleScrape(true)}
                        variant="danger"
                        label="إعادة المحاولة"
                        size="sm"
                    />
                </div>
            )}

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
