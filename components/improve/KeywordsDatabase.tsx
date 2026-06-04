'use client';

import { useState, useEffect } from 'react';
import { Database, Plus, ArrowLeftRight, Search, Trash2 } from 'lucide-react';
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
    onSwitchTab,
    isWideView = false
}: KeywordsDatabaseProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [platformFilter, setPlatformFilter] = useState('all');
    const [kdFilter, setKdFilter] = useState('all');

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
                              item.source_site.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPlatform = platformFilter === 'all' || item.platform === platformFilter;
        
        let matchesKD = true;
        if (kdFilter === 'easy') matchesKD = item.kd <= 30;
        else if (kdFilter === 'medium') matchesKD = item.kd > 30 && item.kd <= 60;
        else if (kdFilter === 'hard') matchesKD = item.kd > 60;

        return matchesSearch && matchesPlatform && matchesKD;
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
                    <div className="flex items-center gap-2">
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

                {/* البحث والتصفية المتقدمة */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-3 border-t border-slate-100">
                    <div className="md:col-span-6 relative">
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
                    <div className="md:col-span-3">
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
                                <td colSpan={10} className="p-12 text-center text-slate-400">
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
                                    <td className={cn("p-4 font-black text-slate-900 transition-all duration-300", isWideView && "border-l border-slate-100/50")}>{item.keyword}</td>
                                    
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
                                        <button
                                            onClick={() => onDeleteKeyword(item.id)}
                                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                            title="حذف من القاعدة"
                                        >
                                            <Trash2 size={14} />
                                        </button>
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
        </div>
    );
}
