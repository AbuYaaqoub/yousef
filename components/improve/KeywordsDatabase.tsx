'use client';

import { useState, useEffect } from 'react';
import { Database, Plus, ArrowLeftRight, Search, Trash2, Globe, ExternalLink, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Client {
    id: string;
    name: string;
    website: string;
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
    quotation_results?: number | null;
    allinurl_results?: number | null;
}

interface KeywordsDatabaseProps {
    selectedClient: Client;
    clients: Client[];
    keywordsDB: KeywordDBItem[];
    usingFallback: boolean;
    onAddKeyword: (
        clientId: string,
        keyword: string,
        kd: number,
        volume: number,
        platform: string,
        source: string,
        intent?: string,
        cpc?: number,
        sf?: string
    ) => Promise<void>;
    onDeleteKeyword: (id: string) => Promise<void>;
    onDeleteKeywords: (ids: string[]) => Promise<void>;
    onBulkTargetKeywords: (
        clientId: string,
        location: string,
        status: 'used' | 'changed' | 'review',
        reviewDays: number,
        items: any[],
        shouldDeleteSuggestions: boolean
    ) => Promise<void>;
    onUpdateKeywordMetrics: (
        updates: { id: string; quotation_results: number | null; allinurl_results: number | null }[]
    ) => Promise<void>;
    onSwitchTab: () => void;
    isWideView?: boolean;
}

export function KeywordsDatabase({
    selectedClient,
    clients = [],
    keywordsDB,
    usingFallback,
    onAddKeyword,
    onDeleteKeyword,
    onDeleteKeywords,
    onBulkTargetKeywords,
    onUpdateKeywordMetrics,
    onSwitchTab,
    isWideView = false
}: KeywordsDatabaseProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [platformFilter, setPlatformFilter] = useState('all');
    const [kdFilter, setKdFilter] = useState('all');
    const [lengthFilter, setLengthFilter] = useState('all');
    const [testKeyword, setTestKeyword] = useState('');
    const [showClassificationStats, setShowClassificationStats] = useState(false);

    const [showAddKeywordModal, setShowAddKeywordModal] = useState(false);
    const [targetClientId, setTargetClientId] = useState(selectedClient.id);
    const [successMessage, setSuccessMessage] = useState('');
    
    const [newKeywordText, setNewKeywordText] = useState('');
    const [newKeywordKD, setNewKeywordKD] = useState(30);
    const [newKeywordVolume, setNewKeywordVolume] = useState(1500);
    const [newKeywordPlatform, setNewKeywordPlatform] = useState('ahrefs');
    const [newKeywordSource, setNewKeywordSource] = useState('');
    
    // حقول مقاييس SEMrush الجديدة الاختيارية
    const [newKeywordIntent, setNewKeywordIntent] = useState('');
    const [newKeywordCPC, setNewKeywordCPC] = useState<number>(0.0);
    const [newKeywordSF, setNewKeywordSF] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // حالات التحديد الجماعي
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [scanningIds, setScanningIds] = useState<string[]>([]);

    // حالة المسودات المؤقتة لنتائج الفحص غير المحفوظة
    const [draftMetrics, setDraftMetrics] = useState<Record<string, { quotation_results: number | null, allinurl_results: number | null }>>({});

    const handleScanMetrics = async (items: KeywordDBItem[]) => {
        if (items.length === 0) return;
        
        // إضافة المعرفات لحالة التحميل
        const idsToScan = items.map(item => item.id);
        setScanningIds(prev => [...prev, ...idsToScan]);

        try {
            const res = await fetch('/api/seo/keyword-metrics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    keywords: items.map(item => ({
                        id: item.id,
                        keyword: item.keyword
                    }))
                })
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.error || 'فشلت عملية جلب البيانات من محرك جوجل.');
            }

            if (data.results) {
                // حفظ البيانات المسترجعة كمسودات مؤقتة فقط دون حفظها في قاعدة البيانات مباشرة
                setDraftMetrics(prev => {
                    const next = { ...prev };
                    data.results.forEach((r: any) => {
                        next[r.id] = {
                            quotation_results: r.quotation_results,
                            allinurl_results: r.allinurl_results
                        };
                    });
                    return next;
                });
            }
        } catch (err: any) {
            console.error('Error scanning keyword metrics:', err);
            alert(`حدث خطأ أثناء الفحص: ${err.message || 'يرجى التحقق من اتصال الشبكة ومفتاح Serper API'}`);
        } finally {
            setScanningIds(prev => prev.filter(id => !idsToScan.includes(id)));
        }
    };

    // حفظ جميع المسودات المؤقتة في قاعدة البيانات والتخزين المحلي دفعة واحدة يدوياً
    const handleSaveDraftMetrics = async () => {
        const updates = Object.entries(draftMetrics).map(([id, val]) => ({
            id,
            quotation_results: val.quotation_results,
            allinurl_results: val.allinurl_results
        }));

        if (updates.length === 0) return;

        try {
            setIsSubmitting(true);
            await onUpdateKeywordMetrics(updates);
            setDraftMetrics({});
            alert('تم حفظ جميع نتائج الفحص بنجاح في قاعدة البيانات.');
        } catch (err: any) {
            console.error('Error saving draft metrics:', err);
            alert(`حدث خطأ أثناء الحفظ: ${err.message || 'فشلت العملية'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // إلغاء المسودات المؤقتة والتراجع عن الفحص الحالي
    const handleDiscardDraftMetrics = () => {
        if (window.confirm('هل أنت متأكد من رغبتك في إلغاء نتائج الفحص الأخيرة وعدم حفظها؟')) {
            setDraftMetrics({});
        }
    };

    const handleRemoveDuplicates = async () => {
        const seen = new Set<string>();
        const duplicateIds: string[] = [];
        
        keywordsDB.forEach(item => {
            const kwNormalized = item.keyword.trim().toLowerCase();
            if (seen.has(kwNormalized)) {
                duplicateIds.push(item.id);
            } else {
                seen.add(kwNormalized);
            }
        });
        
        if (duplicateIds.length === 0) {
            alert('لا توجد كلمات مفتاحية مكررة للعميل الحالي! ✨');
            return;
        }
        
        if (window.confirm(`تم العثور على ${duplicateIds.length} كلمة مكررة. هل تريد حذف التكرار والاحتفاظ بكلمة واحدة فريدة لكل منها؟`)) {
            try {
                setIsSubmitting(true);
                await onDeleteKeywords(duplicateIds);
                alert(`تم إزالة ${duplicateIds.length} كلمة مفتاحية مكررة بنجاح! ✅`);
            } catch (err: any) {
                console.error('Error removing duplicates:', err);
                alert('فشلت عملية إزالة الكلمات المكررة.');
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const formatResultsCount = (count: number | null | undefined) => {
        if (count === null || count === undefined) return '-';
        if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
        if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
        if (count === 10) return `${(10).toLocaleString('ar-EG')}+`;
        return count.toLocaleString('ar-EG');
    };
    
    // حالات مودال الترحيل الجماعي
    const [showBulkTargetModal, setShowBulkTargetModal] = useState(false);
    const [bulkClientId, setBulkClientId] = useState(selectedClient.id);
    const [bulkLocation, setBulkLocation] = useState('الصفحة الرئيسية');
    const [bulkStatus, setBulkStatus] = useState<'used' | 'changed' | 'review'>('review');
    const [bulkReviewDays, setBulkReviewDays] = useState(7);
    const [shouldDeleteAfterBulk, setShouldDeleteAfterBulk] = useState(true);
    const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);

    useEffect(() => {
        setTargetClientId(selectedClient.id);
        setBulkClientId(selectedClient.id);
        setSelectedIds([]); // مسح التحديد عند تغيير العميل النشط
        setDraftMetrics({}); // مسح نتائج الفحص المؤقتة للعميل السابق لضمان دقة البيانات وحمايتها
    }, [selectedClient]);

    // مسح التحديد إذا تغيرت نتائج البحث أو الفلاتر لضمان دقة الاختيار
    useEffect(() => {
        setSelectedIds([]);
    }, [searchQuery, platformFilter, kdFilter]);

    const handleSelectAllToggle = () => {
        const filteredIds = filteredKeywordsDB.map(item => item.id);
        const allFilteredSelected = filteredIds.every(id => selectedIds.includes(id));
        
        if (allFilteredSelected) {
            setSelectedIds(prev => prev.filter(id => !filteredIds.includes(id)));
        } else {
            setSelectedIds(prev => {
                const newSelection = [...prev];
                filteredIds.forEach(id => {
                    if (!newSelection.includes(id)) {
                        newSelection.push(id);
                    }
                });
                return newSelection;
            });
        }
    };

    const handleSelectToggle = (id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) 
                ? prev.filter(item => item !== id) 
                : [...prev, id]
        );
    };

    const handleBulkDeleteClick = async () => {
        if (selectedIds.length === 0) return;
        const confirmDelete = window.confirm(`هل أنت متأكد من رغبتك في حذف ${selectedIds.length} كلمة مفتاحية دفعة واحدة؟`);
        if (!confirmDelete) return;

        try {
            await onDeleteKeywords(selectedIds);
            setSelectedIds([]);
        } catch (err) {
            console.error('Error during bulk deletion:', err);
        }
    };

    const handleBulkTargetSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedIds.length === 0 || isBulkSubmitting) return;

        try {
            setIsBulkSubmitting(true);
            const selectedItems = keywordsDB.filter(item => selectedIds.includes(item.id));
            
            await onBulkTargetKeywords(
                bulkClientId,
                bulkLocation,
                bulkStatus,
                bulkReviewDays,
                selectedItems,
                shouldDeleteAfterBulk
            );

            setSelectedIds([]);
            setShowBulkTargetModal(false);
        } catch (err) {
            console.error('Error during bulk target/promotion:', err);
        } finally {
            setIsBulkSubmitting(false);
        }
    };

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newKeywordText.trim() || isSubmitting) return;

        try {
            setIsSubmitting(true);
            await onAddKeyword(
                targetClientId,
                newKeywordText,
                newKeywordKD,
                newKeywordVolume,
                newKeywordPlatform,
                newKeywordSource || 'بحث عضوي',
                newKeywordIntent,
                newKeywordCPC,
                newKeywordSF
            );

            // إذا كان العميل المختار مختلفاً عن العميل النشط الحالي
            if (targetClientId !== selectedClient.id) {
                const targetClientName = clients.find(c => c.id === targetClientId)?.name || 'العميل المختار';
                setSuccessMessage(`تمت إضافة الكلمة بنجاح للعميل (${targetClientName})! ✅`);
                setTimeout(() => {
                    setNewKeywordText('');
                    setNewKeywordKD(30);
                    setNewKeywordVolume(1500);
                    setNewKeywordSource('');
                    setNewKeywordIntent('');
                    setNewKeywordCPC(0.0);
                    setNewKeywordSF('');
                    setSuccessMessage('');
                    setShowAddKeywordModal(false);
                }, 1500);
            } else {
                setNewKeywordText('');
                setNewKeywordKD(30);
                setNewKeywordVolume(1500);
                setNewKeywordSource('');
                setNewKeywordIntent('');
                setNewKeywordCPC(0.0);
                setNewKeywordSF('');
                setShowAddKeywordModal(false);
            }
        } catch (err) {
            console.error('Error adding keyword:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    // تصفية قاعدة الكلمات المفتاحية
    const filteredKeywordsDB = keywordsDB.filter(item => {
        const matchesSearch = item.keyword.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              (item.source_site && item.source_site.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesPlatform = platformFilter === 'all' || item.platform === platformFilter;
        
        let matchesKD = true;
        if (kdFilter === 'easy') matchesKD = item.kd <= 30;
        else if (kdFilter === 'medium') matchesKD = item.kd > 30 && item.kd <= 60;
        else if (kdFilter === 'hard') matchesKD = item.kd > 60;

        let matchesLength = true;
        const words = item.keyword.trim().split(/\s+/).filter(Boolean).length;
        if (lengthFilter === 'short') matchesLength = words === 1;
        else if (lengthFilter === 'medium') matchesLength = words === 2;
        else if (lengthFilter === 'long') matchesLength = words >= 3;

        return matchesSearch && matchesPlatform && matchesKD && matchesLength;
    });

    const getKDColorClass = (kd: number) => {
        if (kd <= 30) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
        if (kd <= 60) return 'bg-amber-50 text-amber-700 border-amber-100';
        return 'bg-rose-50 text-rose-700 border-rose-100';
    };

    const getKDText = (kd: number) => {
        if (kd <= 30) return 'سهل';
        if (kd <= 60) return 'متوسط';
        return 'صعب';
    };

    return (
        <div className="bg-white border border-slate-200/80 rounded-[32px] overflow-hidden shadow-sm p-6 space-y-6 animate-in">
            {/* ترويسة وقسم البحث والفلاتر */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h3 className="text-lg font-black text-slate-900">قاعدة الكلمات المفتاحية المقترحة</h3>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">قائمة بالكلمات المفتاحية المقترحة لمتجرك من المنصات المتخصصة وعمليات المنافسين</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        <button
                            onClick={handleRemoveDuplicates}
                            className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl border border-rose-200 text-rose-600 hover:border-rose-300 hover:bg-rose-50/50 text-xs font-bold transition-all"
                            title="إزالة الكلمات المفتاحية المتكررة للعميل"
                        >
                            <Trash2 size={14} />
                            <span>إزالة التكرار</span>
                        </button>
                        <button
                            onClick={() => setShowClassificationStats(true)}
                            className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl border border-slate-200 text-slate-700 hover:border-black hover:bg-slate-50 text-xs font-bold transition-all"
                            title="تصنيف وحساب أطوال الكلمات المفتاحية"
                        >
                            <Database size={14} />
                            <span>تصنيف الأطوال</span>
                        </button>
                        <button
                            onClick={() => setShowAddKeywordModal(true)}
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-black hover:bg-zinc-800 text-white font-bold text-xs transition-all shadow-sm"
                        >
                            <Plus size={14} />
                            <span>إضافة كلمة مقترحة</span>
                        </button>
                        <button
                            onClick={onSwitchTab}
                            className="flex items-center gap-1 px-3 py-2.5 rounded-2xl border border-zinc-200 text-zinc-600 hover:border-black hover:text-black text-xs font-bold transition-all"
                            title="اختصار إلى كلمات العميل"
                        >
                            <ArrowLeftRight size={14} />
                            <span>كلمات العميل ➔</span>
                        </button>
                    </div>
                </div>

                {/* مختبر الكلمات السيو السريع بقوقل */}
                <div className="bg-slate-50/50 border border-slate-200/50 p-4 rounded-[20px] flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
                    <div className="space-y-1">
                        <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                            <span className="w-1.5 h-3 rounded-full bg-black inline-block" />
                            <span>مختبر الكلمات السريع (Google Search)</span>
                        </h4>
                        <p className="text-[10px] text-slate-400 font-bold leading-normal">
                            افحص أرشفة الكلمة بالتطابق التام أو مدى تواجدها بالروابط مباشرة في نتائج جوجل.
                        </p>
                    </div>
                    
                    <div className="flex-1 max-w-lg flex flex-col sm:flex-row items-stretch gap-2">
                        <div className="relative flex-1">
                            <input 
                                type="text"
                                placeholder="اكتب كلمة أو اخترها من الجدول..."
                                value={testKeyword}
                                onChange={(e) => setTestKeyword(e.target.value)}
                                className="w-full bg-white border border-slate-200/80 rounded-xl py-2.5 pr-3 pl-16 text-xs font-bold outline-none focus:border-black transition-all text-slate-800 placeholder-slate-400"
                            />
                            {/* تعبئة سريعة في حال وجود كلمة محددة */}
                            {selectedIds.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const selectedKeyword = keywordsDB.find(item => selectedIds.includes(item.id))?.keyword;
                                        if (selectedKeyword) setTestKeyword(selectedKeyword);
                                    }}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-black bg-zinc-950 text-white hover:bg-zinc-800 py-1.5 px-2 rounded-lg transition-all shadow-sm"
                                    title="تعبئة الكلمة المحددة الأولى"
                                >
                                    تعبئة ⚡
                                </button>
                            )}
                        </div>
                        
                        <div className="flex items-center gap-1.5 shrink-0">
                            <button
                                type="button"
                                disabled={!testKeyword.trim()}
                                onClick={() => window.open(`https://www.google.com/search?q="${encodeURIComponent(testKeyword.trim())}"`, '_blank')}
                                className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-zinc-800 hover:border-black hover:text-black hover:bg-slate-50 text-xs font-black transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="text-[10px] font-black text-slate-500">""</span>
                                <span>تطابق تام</span>
                            </button>
                            <button
                                type="button"
                                disabled={!testKeyword.trim()}
                                onClick={() => window.open(`https://www.google.com/search?q=allinurl:"${encodeURIComponent(testKeyword.trim())}"`, '_blank')}
                                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-950 text-white hover:bg-zinc-800 text-xs font-black transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Globe size={12} />
                                <span>الرابط allinurl</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* البحث والتصفية المتقدمة */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-3 border-t border-slate-100">
                    <div className="md:col-span-4 relative">
                        <input 
                            type="text" 
                            placeholder="البحث بالكلمة أو الموقع المصدر..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl py-3.5 pr-10 pl-4 text-xs font-bold outline-none focus:border-black focus:bg-white transition-all text-slate-800 placeholder-slate-400"
                        />
                        <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    </div>
                    <div className="md:col-span-3">
                        <select
                            value={platformFilter}
                            onChange={(e) => setPlatformFilter(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl py-3.5 px-4 text-xs font-bold outline-none focus:border-black focus:bg-white text-slate-800 transition-all"
                        >
                            <option value="all">كل المنصات</option>
                            <option value="ahrefs">Ahrefs (أشرف)</option>
                            <option value="semrush">Semrush (سمرش)</option>
                            <option value="moz">Moz (دز)</option>
                        </select>
                    </div>
                    <div className="md:col-span-2.5">
                        <select
                            value={kdFilter}
                            onChange={(e) => setKdFilter(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl py-3.5 px-4 text-xs font-bold outline-none focus:border-black focus:bg-white text-slate-800 transition-all"
                        >
                            <option value="all">كل درجات الصعوبة</option>
                            <option value="easy">سهل (KD ≤ 30)</option>
                            <option value="medium">متوسط (30 &lt; KD ≤ 60)</option>
                            <option value="hard">صعب (KD &gt; 60)</option>
                        </select>
                    </div>
                    <div className="md:col-span-2.5">
                        <select
                            value={lengthFilter}
                            onChange={(e) => setLengthFilter(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl py-3.5 px-4 text-xs font-bold outline-none focus:border-black focus:bg-white text-slate-800 transition-all"
                        >
                            <option value="all">كل أطوال الكلمات</option>
                            <option value="short">كلمات قصيرة (1 كلمة)</option>
                            <option value="medium">كلمات متوسطة (2 كلمة)</option>
                            <option value="long">كلمات طويلة الذيل (3+ كلمات)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* شريط الإجراءات الجماعية الفاخر */}
            {selectedIds.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-zinc-950 text-white rounded-2xl animate-in fade-in slide-in-from-top-4 duration-300 shadow-lg shadow-zinc-950/20">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-white/20 text-xs font-black text-white">
                            {selectedIds.length}
                        </span>
                        <span className="text-xs font-black">كلمات مفتاحية تم اختيارها للتعديل الجماعي</span>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                            onClick={() => {
                                const selectedItems = keywordsDB.filter(item => selectedIds.includes(item.id));
                                handleScanMetrics(selectedItems);
                            }}
                            disabled={scanningIds.length > 0}
                            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition-all border border-zinc-700/50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            🔍 فحص نتائج Google
                        </button>
                        <button
                            onClick={() => setShowBulkTargetModal(true)}
                            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white text-zinc-950 hover:bg-zinc-100 font-black text-xs transition-all"
                        >
                            🎯 ترحيل واستهداف جماعي
                        </button>
                        <button
                            onClick={handleBulkDeleteClick}
                            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-rose-950 hover:text-rose-200 text-zinc-300 font-bold text-xs transition-all border border-zinc-700/50"
                        >
                            🗑️ حذف جماعي
                        </button>
                    </div>
                </div>
            )}

            {/* شريط حفظ نتائج الفحص يدويًا */}
            {Object.keys(draftMetrics).length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-emerald-50 border border-emerald-200/80 text-emerald-900 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-300 shadow-sm mb-4">
                    <div className="flex items-center gap-3">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                        <span className="text-xs font-black">
                            يوجد {Object.keys(draftMetrics).length.toLocaleString('ar-EG')} من نتائج الفحص المؤقتة غير المحفوظة في قاعدة البيانات.
                        </span>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                            onClick={handleSaveDraftMetrics}
                            disabled={isSubmitting}
                            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition-all shadow-sm disabled:opacity-50"
                        >
                            💾 حفظ التغييرات الآن
                        </button>
                        <button
                            onClick={handleDiscardDraftMetrics}
                            disabled={isSubmitting}
                            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-all disabled:opacity-50"
                        >
                            إلغاء التغييرات
                        </button>
                    </div>
                </div>
            )}

            {/* جدول الكلمات */}
            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className={cn("w-full text-right border-collapse transition-all duration-300", isWideView ? "min-w-[1100px]" : "min-w-full")}>
                    <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                            <th className="p-4 text-center w-[45px] border-l border-slate-100/80">
                                <input 
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-slate-300 text-zinc-950 focus:ring-zinc-950 cursor-pointer"
                                    checked={filteredKeywordsDB.length > 0 && filteredKeywordsDB.every(item => selectedIds.includes(item.id))}
                                    onChange={handleSelectAllToggle}
                                />
                            </th>
                            <th className={cn("p-4 transition-all duration-300", isWideView ? "w-[18%] min-w-[180px] border-l border-slate-100/80" : "")}>الكلمة المفتاحية</th>
                            <th className={cn("p-4 text-center transition-all duration-300", isWideView ? "w-[10%] min-w-[90px] border-l border-slate-100/80" : "")}>نية البحث</th>
                            <th className={cn("p-4 text-center transition-all duration-300", isWideView ? "w-[10%] min-w-[90px] border-l border-slate-100/80" : "")}>الصعوبة KD</th>
                            <th className={cn("p-4 text-center transition-all duration-300", isWideView ? "w-[12%] min-w-[110px] border-l border-slate-100/80" : "")}>حجم البحث الشهري</th>
                            <th className={cn("p-4 text-center transition-all duration-300", isWideView ? "w-[10%] min-w-[95px] border-l border-slate-100/80" : "")}>نتائج الاقتباس ""</th>
                            <th className={cn("p-4 text-center transition-all duration-300", isWideView ? "w-[10%] min-w-[95px] border-l border-slate-100/80" : "")}>نتائج allinurl</th>
                            <th className={cn("p-4 text-center transition-all duration-300", isWideView ? "w-[10%] min-w-[90px] border-l border-slate-100/80" : "")}>CPC (نقرة)</th>
                            <th className={cn("p-4 text-center transition-all duration-300", isWideView ? "w-[12%] min-w-[110px] border-l border-slate-100/80" : "")}>ميزات البحث SF</th>
                            <th className={cn("p-4 text-center transition-all duration-300", isWideView ? "w-[10%] min-w-[90px] border-l border-slate-100/80" : "")}>المنصة المصدر</th>
                            <th className={cn("p-4 transition-all duration-300", isWideView ? "w-[12%] min-w-[110px] border-l border-slate-100/80" : "")}>الموقع المصدر</th>
                            <th className={cn("p-4 text-center transition-all duration-300", isWideView ? "w-[6%] min-w-[60px]" : "")}>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="text-xs font-bold text-slate-700 divide-y divide-slate-100">
                        {filteredKeywordsDB.length === 0 ? (
                            <tr>
                                <td colSpan={12} className="p-12 text-center text-slate-400">
                                    <Database className="mx-auto mb-3 text-slate-300" size={24} />
                                    <span>لا توجد كلمات مفتاحية تطابق خيارات التصفية الحالية</span>
                                </td>
                            </tr>
                        ) : (
                            filteredKeywordsDB.map((item) => (
                                <tr key={item.id} className={cn("transition-colors", selectedIds.includes(item.id) ? "bg-slate-50 hover:bg-slate-100/80" : "hover:bg-slate-50/50")}>
                                    <td className="p-4 text-center border-l border-slate-100/50">
                                        <input 
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-slate-300 text-zinc-950 focus:ring-zinc-950 cursor-pointer"
                                            checked={selectedIds.includes(item.id)}
                                            onChange={() => handleSelectToggle(item.id)}
                                        />
                                    </td>
                                    <td className={cn("p-4 font-black text-slate-900 transition-all duration-300", isWideView && "border-l border-slate-100/50")}>
                                        <div className="flex flex-col gap-1 text-right">
                                            <span>{item.keyword}</span>
                                            {(() => {
                                                const words = item.keyword.trim().split(/\s+/).filter(Boolean).length;
                                                let badgeText = 'قصيرة';
                                                let badgeColor = 'bg-zinc-100 text-zinc-700';
                                                if (words === 2) {
                                                    badgeText = 'متوسطة';
                                                    badgeColor = 'bg-blue-50 text-blue-700 border border-blue-100/60';
                                                } else if (words >= 3) {
                                                    badgeText = 'طويلة الذيل';
                                                    badgeColor = 'bg-purple-50 text-purple-700 border border-purple-100/60';
                                                }
                                                return (
                                                    <span className={cn("inline-block w-fit px-1.5 py-0.5 rounded text-[8.5px] font-black", badgeColor)}>
                                                        {badgeText}
                                                    </span>
                                                );
                                            })()}
                                        </div>
                                    </td>
                                    
                                    {/* نية البحث */}
                                    <td className={cn("p-4 text-center transition-all duration-300", isWideView && "border-l border-slate-100/50")}>
                                        {item.intent ? (
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-md text-[9px] font-black uppercase border",
                                                item.intent.toLowerCase().includes('info') ? 'bg-blue-50 border-blue-100 text-blue-700' :
                                                item.intent.toLowerCase().includes('comm') ? 'bg-purple-50 border-purple-100 text-purple-700' :
                                                item.intent.toLowerCase().includes('trans') ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                                                'bg-slate-50 border-slate-200 text-slate-600'
                                            )}>
                                                {item.intent}
                                            </span>
                                        ) : (
                                            <span className="text-slate-300 text-[10px] font-bold">-</span>
                                        )}
                                    </td>

                                    <td className={cn("p-4 text-center transition-all duration-300", isWideView && "border-l border-slate-100/50")}>
                                        <span className={cn("px-2.5 py-1 rounded-full border text-[10px] font-black inline-block min-w-[55px]", getKDColorClass(item.kd))}>
                                            {item.kd}% ({getKDText(item.kd)})
                                        </span>
                                    </td>
                                    <td className={cn("p-4 text-center font-mono transition-all duration-300", isWideView && "border-l border-slate-100/50")}>{item.volume.toLocaleString('ar-EG')} عملية</td>
                                    
                                    {/* نتائج الاقتباس "" */}
                                    {(() => {
                                        const draft = draftMetrics[item.id];
                                        const hasDraft = draft !== undefined;
                                        const val = hasDraft ? draft.quotation_results : item.quotation_results;
                                        const isValValid = val !== undefined && val !== null;
                                        return (
                                            <td 
                                                className={cn(
                                                    "p-4 text-center font-mono transition-all duration-300", 
                                                    isWideView && "border-l border-slate-100/50",
                                                    hasDraft && "bg-emerald-50/40 text-emerald-700 font-extrabold"
                                                )}
                                                title={hasDraft && val !== null && val !== undefined ? `${val.toLocaleString('ar-EG')} (غير محفوظ)` : val?.toLocaleString('ar-EG') || ''}
                                            >
                                                {scanningIds.includes(item.id) ? (
                                                    <RefreshCw size={12} className="animate-spin text-slate-400 mx-auto" />
                                                ) : isValValid ? (
                                                    <div className="flex items-center justify-center gap-1">
                                                        <span className="flex items-center gap-1">
                                                            {formatResultsCount(val)}
                                                            {hasDraft && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="قيمة مؤقتة غير محفوظة" />}
                                                        </span>
                                                        <button
                                                            onClick={() => handleScanMetrics([item])}
                                                            className="p-1 rounded text-slate-300 hover:text-black hover:bg-slate-100 transition-colors"
                                                            title="تحديث الفحص"
                                                        >
                                                            <RefreshCw size={10} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleScanMetrics([item])}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-black hover:bg-slate-100 transition-colors flex items-center gap-1 mx-auto"
                                                        title="فحص نتائج البحث المتقدم"
                                                    >
                                                        <Search size={12} />
                                                        <span className="text-[9px]">فحص</span>
                                                    </button>
                                                )}
                                            </td>
                                        );
                                    })()}

                                    {/* نتائج allinurl */}
                                    {(() => {
                                        const draft = draftMetrics[item.id];
                                        const hasDraft = draft !== undefined;
                                        const val = hasDraft ? draft.allinurl_results : item.allinurl_results;
                                        const isValValid = val !== undefined && val !== null;
                                        return (
                                            <td 
                                                className={cn(
                                                    "p-4 text-center font-mono transition-all duration-300", 
                                                    isWideView && "border-l border-slate-100/50",
                                                    hasDraft && "bg-emerald-50/40 text-emerald-700 font-extrabold"
                                                )}
                                                title={hasDraft && val !== null && val !== undefined ? `${val.toLocaleString('ar-EG')} (غير محفوظ)` : val?.toLocaleString('ar-EG') || ''}
                                            >
                                                {scanningIds.includes(item.id) ? (
                                                    <RefreshCw size={12} className="animate-spin text-slate-400 mx-auto" />
                                                ) : isValValid ? (
                                                    <div className="flex items-center justify-center gap-1">
                                                        <span className="flex items-center gap-1">
                                                            {formatResultsCount(val)}
                                                            {hasDraft && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="قيمة مؤقتة غير محفوظة" />}
                                                        </span>
                                                        <button
                                                            onClick={() => handleScanMetrics([item])}
                                                            className="p-1 rounded text-slate-300 hover:text-black hover:bg-slate-100 transition-colors"
                                                            title="تحديث الفحص"
                                                        >
                                                            <RefreshCw size={10} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleScanMetrics([item])}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-black hover:bg-slate-100 transition-colors flex items-center gap-1 mx-auto"
                                                        title="فحص نتائج البحث المتقدم"
                                                    >
                                                        <Search size={12} />
                                                        <span className="text-[9px]">فحص</span>
                                                    </button>
                                                )}
                                            </td>
                                        );
                                    })()}

                                    {/* سعر النقرة CPC */}
                                    <td className={cn("p-4 text-center font-mono text-slate-600 transition-all duration-300", isWideView && "border-l border-slate-100/50")}>
                                        {item.cpc !== undefined && item.cpc > 0 ? (
                                            <span className="text-zinc-700">${item.cpc.toFixed(2)}</span>
                                        ) : (
                                            <span className="text-slate-300 text-[10px] font-bold">-</span>
                                        )}
                                    </td>

                                    {/* ميزات نتائج البحث SF */}
                                    <td className={cn("p-4 text-center text-slate-500 font-medium truncate max-w-[120px] transition-all duration-300", isWideView && "border-l border-slate-100/50")} title={item.sf}>
                                        {item.sf || <span className="text-slate-300 text-[10px] font-bold">-</span>}
                                    </td>

                                    <td className={cn("p-4 text-center transition-all duration-300", isWideView && "border-l border-slate-100/50")}>
                                        <span className={cn(
                                            "px-2.5 py-1 rounded-full text-[9px] font-black uppercase border",
                                            item.platform === 'ahrefs' ? 'bg-zinc-900 text-white border-zinc-950' : 
                                            item.platform === 'semrush' ? 'bg-zinc-50 border-zinc-200 text-slate-900' : 
                                            'bg-white border-zinc-300 text-zinc-600'
                                        )}>
                                            {item.platform === 'moz' ? 'Moz (دز)' : item.platform}
                                        </span>
                                    </td>
                                    <td className={cn("p-4 text-slate-500 font-medium transition-all duration-300", isWideView && "border-l border-slate-100/50")}>{item.source_site}</td>
                                    <td className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                onClick={() => window.open(`https://www.google.com/search?q="${encodeURIComponent(item.keyword)}"`)}
                                                className="p-1.5 rounded-lg text-slate-400 hover:text-zinc-900 hover:bg-slate-100 transition-colors"
                                                title={`بحث بالتطابق التام "${item.keyword}"`}
                                            >
                                                <span className="text-[10px] font-black">""</span>
                                            </button>
                                            <button
                                                onClick={() => window.open(`https://www.google.com/search?q=allinurl:"${encodeURIComponent(item.keyword)}"`)}
                                                className="p-1.5 rounded-lg text-slate-400 hover:text-zinc-900 hover:bg-slate-100 transition-colors"
                                                title={`بحث بـ allinurl:"${item.keyword}"`}
                                            >
                                                <Globe size={12} />
                                            </button>
                                            <button
                                                onClick={() => onDeleteKeyword(item.id)}
                                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                                title="حذف من القاعدة"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* مودال منبثق لإضافة كلمة لقاعدة البيانات */}
            {showAddKeywordModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4 animate-in duration-250">
                    <div className="bg-white border border-slate-100 rounded-[32px] w-full max-w-md p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="mb-6">
                            <h3 className="text-xl font-black text-slate-900">إضافة كلمة لقاعدة المقترحات</h3>
                            <p className="text-[10px] text-slate-400 font-bold mt-1">إضافة كلمة مقترحة جديدة للعميل المختار مع تحديد مقاييسها وقناتها</p>
                        </div>

                        {successMessage && (
                            <div className="p-4 mb-4 text-xs font-black text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-2xl animate-pulse text-center">
                                {successMessage}
                            </div>
                        )}

                        <form onSubmit={handleAddSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-600">العميل المستهدف</label>
                                <select 
                                    value={targetClientId}
                                    onChange={(e) => setTargetClientId(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl py-3 px-4 text-xs font-bold outline-none focus:border-black focus:bg-white text-slate-800 transition-all"
                                >
                                    {clients.map(client => (
                                        <option key={client.id} value={client.id}>{client.name} ({client.website})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-600">الكلمة المفتاحية</label>
                                <input 
                                    type="text" 
                                    required
                                    placeholder="مثال: حبوب قهوة كولومبية"
                                    value={newKeywordText}
                                    onChange={(e) => setNewKeywordText(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl py-3 px-4 text-xs font-bold outline-none focus:border-black focus:bg-white text-slate-800 transition-all"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-600">نية البحث (Intent - اختياري)</label>
                                <input 
                                    type="text" 
                                    placeholder="مثال: Informational أو Commercial"
                                    value={newKeywordIntent}
                                    onChange={(e) => setNewKeywordIntent(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl py-3 px-4 text-xs font-bold outline-none focus:border-black focus:bg-white text-slate-800 transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-600">درجة الصعوبة KD (1-100)</label>
                                    <input 
                                        type="number" 
                                        required
                                        min="1"
                                        max="100"
                                        value={newKeywordKD}
                                        onChange={(e) => setNewKeywordKD(Number(e.target.value))}
                                        className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl py-3 px-4 text-xs font-bold outline-none focus:border-black focus:bg-white text-slate-800 transition-all font-mono"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-600">حجم البحث الشهري</label>
                                    <input 
                                        type="number" 
                                        required
                                        min="0"
                                        value={newKeywordVolume}
                                        onChange={(e) => setNewKeywordVolume(Number(e.target.value))}
                                        className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl py-3 px-4 text-xs font-bold outline-none focus:border-black focus:bg-white text-slate-800 transition-all font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-600">سعر النقرة CPC ($ - اختياري)</label>
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        min="0"
                                        value={newKeywordCPC}
                                        onChange={(e) => setNewKeywordCPC(Number(e.target.value))}
                                        className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl py-3 px-4 text-xs font-bold outline-none focus:border-black focus:bg-white text-slate-800 transition-all font-mono"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-600">ميزات البحث SF (اختياري)</label>
                                    <input 
                                        type="text" 
                                        placeholder="مثال: Featured Snippet, Images"
                                        value={newKeywordSF}
                                        onChange={(e) => setNewKeywordSF(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl py-3 px-4 text-xs font-bold outline-none focus:border-black focus:bg-white text-slate-800 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-600">المنصة المصدر</label>
                                <select 
                                    value={newKeywordPlatform}
                                    onChange={(e) => setNewKeywordPlatform(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl py-3 px-4 text-xs font-bold outline-none focus:border-black focus:bg-white text-slate-800 transition-all"
                                >
                                    <option value="ahrefs">Ahrefs (أشرف)</option>
                                    <option value="semrush">Semrush (سمرش)</option>
                                    <option value="moz">Moz (دز)</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-600">موقع المصدر (اختياري)</label>
                                <input 
                                    type="text" 
                                    placeholder="مثال: competitor-store.com"
                                    value={newKeywordSource}
                                    onChange={(e) => setNewKeywordSource(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl py-3 px-4 text-xs font-bold outline-none focus:border-black focus:bg-white text-slate-800 transition-all"
                                />
                            </div>

                            <div className="flex items-center gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !!successMessage}
                                    className="flex-1 py-3 px-6 rounded-2xl bg-black hover:bg-zinc-800 text-white font-bold text-xs transition-all shadow-sm disabled:bg-zinc-500"
                                >
                                    {isSubmitting ? 'جاري الحفظ...' : 'تأكيد وإضافة الكلمة'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowAddKeywordModal(false)}
                                    className="py-3 px-6 rounded-2xl border border-zinc-200 text-zinc-500 hover:text-black hover:bg-zinc-50 font-bold text-xs transition-all"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* مودال الترحيل والاستهداف الجماعي */}
            {showBulkTargetModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4 animate-in duration-250">
                    <div className="bg-white border border-slate-100 rounded-[32px] w-full max-w-md p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="mb-6">
                            <h3 className="text-xl font-black text-slate-900">الترحيل والاستهداف الجماعي</h3>
                            <p className="text-[10px] text-slate-400 font-bold mt-1">ترحيل {selectedIds.length} كلمات مفتاحية دفعة واحدة إلى قائمة الكلمات النشطة للعميل</p>
                        </div>

                        <form onSubmit={handleBulkTargetSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-600">العميل المستهدف بالتصدير</label>
                                <select 
                                    value={bulkClientId}
                                    onChange={(e) => setBulkClientId(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl py-3 px-4 text-xs font-bold outline-none focus:border-black focus:bg-white text-slate-800 transition-all"
                                >
                                    {clients.map(client => (
                                        <option key={client.id} value={client.id}>{client.name} ({client.website})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-600">الموقع المستهدف بالموقع (Location)</label>
                                <input 
                                    type="text" 
                                    required
                                    placeholder="مثال: الصفحة الرئيسية أو /products/coffee-beans"
                                    value={bulkLocation}
                                    onChange={(e) => setBulkLocation(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl py-3 px-4 text-xs font-bold outline-none focus:border-black focus:bg-white text-slate-800 transition-all"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-600">الحالة الأولية</label>
                                <select 
                                    value={bulkStatus}
                                    onChange={(e) => setBulkStatus(e.target.value as any)}
                                    className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl py-3 px-4 text-xs font-bold outline-none focus:border-black focus:bg-white text-slate-800 transition-all"
                                >
                                    <option value="review">قيد المراجعة (Review)</option>
                                    <option value="used">تم الاستخدام (Used)</option>
                                    <option value="changed">تم التعديل (Changed)</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-600">مؤقت المراجعة القادمة (أيام)</label>
                                <input 
                                    type="number" 
                                    required
                                    min="1"
                                    max="365"
                                    value={bulkReviewDays}
                                    onChange={(e) => setBulkReviewDays(Number(e.target.value))}
                                    className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl py-3 px-4 text-xs font-bold outline-none focus:border-black focus:bg-white text-slate-800 transition-all font-mono"
                                />
                            </div>

                            <div className="flex items-center gap-2 py-2">
                                <input 
                                    type="checkbox"
                                    id="delete-suggestions-checkbox"
                                    checked={shouldDeleteAfterBulk}
                                    onChange={(e) => setShouldDeleteAfterBulk(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 text-zinc-950 focus:ring-zinc-950 cursor-pointer"
                                />
                                <label htmlFor="delete-suggestions-checkbox" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                                    حذف الأفكار من قاعدة المقترحات بعد ترحيلها بنجاح
                                </label>
                            </div>

                            <div className="flex items-center gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={isBulkSubmitting}
                                    className="flex-1 py-3 px-6 rounded-2xl bg-black hover:bg-zinc-800 text-white font-bold text-xs transition-all shadow-sm disabled:bg-zinc-500"
                                >
                                    {isBulkSubmitting ? 'جاري ترحيل الكلمات...' : `تصدير واستهداف الكلمات (${selectedIds.length})`}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowBulkTargetModal(false)}
                                    className="py-3 px-6 rounded-2xl border border-zinc-200 text-zinc-500 hover:text-black hover:bg-zinc-50 font-bold text-xs transition-all"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* مودال تصنيف وحساب أطوال الكلمات المفتاحية */}
            {showClassificationStats && (() => {
                const total = keywordsDB.length;
                const shortCount = keywordsDB.filter(item => item.keyword.trim().split(/\s+/).filter(Boolean).length === 1).length;
                const mediumCount = keywordsDB.filter(item => item.keyword.trim().split(/\s+/).filter(Boolean).length === 2).length;
                const longCount = keywordsDB.filter(item => item.keyword.trim().split(/\s+/).filter(Boolean).length >= 3).length;

                const shortPercent = total > 0 ? Math.round((shortCount / total) * 100) : 0;
                const mediumPercent = total > 0 ? Math.round((mediumCount / total) * 100) : 0;
                const longPercent = total > 0 ? Math.round((longCount / total) * 100) : 0;

                return (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4 animate-in duration-250">
                        <div className="bg-white border border-slate-100 rounded-[32px] w-full max-w-md p-8 shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
                            <div className="mb-6 border-b border-slate-100 pb-3">
                                <h3 className="text-lg font-black text-slate-900">تقرير تصنيف أطوال الكلمات 📊</h3>
                                <p className="text-[10px] text-slate-400 font-bold mt-1">توزيع الكلمات المفتاحية في قاعدة البيانات للعميل الحالي حسب عدد الكلمات</p>
                            </div>

                            <div className="space-y-5">
                                {/* الكلمات القصيرة */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                        <span>كلمات قصيرة (Short-tail) - 1 كلمة</span>
                                        <span>{shortCount} كلمة ({shortPercent}%)</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                        <div className="h-full bg-zinc-800" style={{ width: `${shortPercent}%` }} />
                                    </div>
                                </div>

                                {/* الكلمات المتوسطة */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                        <span>كلمات متوسطة (Medium-tail) - 2 كلمة</span>
                                        <span>{mediumCount} كلمة ({mediumPercent}%)</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500" style={{ width: `${mediumPercent}%` }} />
                                    </div>
                                </div>

                                {/* الكلمات الطويلة */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                        <span>كلمات طويلة الذيل (Long-tail) - 3 كلمات أو أكثر</span>
                                        <span>{longCount} كلمة ({longPercent}%)</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                        <div className="h-full bg-purple-500" style={{ width: `${longPercent}%` }} />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100 bg-slate-50/50 p-4 rounded-2xl text-[10.5px] font-medium text-slate-500 leading-normal">
                                    💡 <strong>نصيحة سيو:</strong> استهداف <strong>الكلمات طويلة الذيل</strong> يساعد على الحصول على زيارات عالية الاستهداف ونسبة تحويل أكبر نظراً لقلة المنافسة ووضوح نية المستخدم في البحث.
                               </div>

                                <div className="flex items-center gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowClassificationStats(false)}
                                        className="flex-1 py-3 px-6 rounded-2xl bg-black hover:bg-zinc-800 text-white font-bold text-xs transition-all shadow-sm text-center"
                                    >
                                        إغلاق التقرير
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
