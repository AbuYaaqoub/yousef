'use client';

import { useState } from 'react';
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
}

interface KeywordsDatabaseProps {
    selectedClient: Client;
    keywordsDB: KeywordDBItem[];
    usingFallback: boolean;
    onAddKeyword: (keyword: string, kd: number, volume: number, platform: string, source: string) => Promise<void>;
    onDeleteKeyword: (id: string) => Promise<void>;
    onSwitchTab: () => void;
    isWideView?: boolean;
}

export function KeywordsDatabase({
    selectedClient,
    keywordsDB,
    usingFallback,
    onAddKeyword,
    onDeleteKeyword,
    onSwitchTab,
    isWideView = false
}: KeywordsDatabaseProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [platformFilter, setPlatformFilter] = useState('all');
    const [kdFilter, setKdFilter] = useState('all');

    const [showAddKeywordModal, setShowAddKeywordModal] = useState(false);
    const [newKeywordText, setNewKeywordText] = useState('');
    const [newKeywordKD, setNewKeywordKD] = useState(30);
    const [newKeywordVolume, setNewKeywordVolume] = useState(1500);
    const [newKeywordPlatform, setNewKeywordPlatform] = useState('ahrefs');
    const [newKeywordSource, setNewKeywordSource] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newKeywordText.trim() || isSubmitting) return;

        try {
            setIsSubmitting(true);
            await onAddKeyword(
                newKeywordText,
                newKeywordKD,
                newKeywordVolume,
                newKeywordPlatform,
                newKeywordSource || 'بحث عضوي'
            );
            setNewKeywordText('');
            setNewKeywordKD(30);
            setNewKeywordVolume(1500);
            setNewKeywordSource('');
            setShowAddKeywordModal(false);
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

            {/* جدول الكلمات */}
            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className={cn("w-full text-right border-collapse transition-all duration-300", isWideView ? "min-w-[1100px]" : "min-w-full")}>
                    <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                            <th className={cn("p-4 transition-all duration-300", isWideView ? "w-[25%] min-w-[250px] border-l border-slate-100/80" : "")}>الكلمة المفتاحية</th>
                            <th className={cn("p-4 text-center transition-all duration-300", isWideView ? "w-[12%] min-w-[110px] border-l border-slate-100/80" : "")}>الصعوبة KD</th>
                            <th className={cn("p-4 text-center transition-all duration-300", isWideView ? "w-[18%] min-w-[150px] border-l border-slate-100/80" : "")}>حجم البحث الشهري</th>
                            <th className={cn("p-4 text-center transition-all duration-300", isWideView ? "w-[15%] min-w-[120px] border-l border-slate-100/80" : "")}>المنصة المصدر</th>
                            <th className={cn("p-4 transition-all duration-300", isWideView ? "w-[20%] min-w-[200px] border-l border-slate-100/80" : "")}>الموقع المصدر</th>
                            <th className={cn("p-4 text-center transition-all duration-300", isWideView ? "w-[10%] min-w-[80px]" : "")}>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="text-xs font-bold text-slate-700 divide-y divide-slate-100">
                        {filteredKeywordsDB.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-12 text-center text-slate-400">
                                    <Database className="mx-auto mb-3 text-slate-300" size={24} />
                                    <span>لا توجد كلمات مفتاحية تطابق خيارات التصفية الحالية</span>
                                </td>
                            </tr>
                        ) : (
                            filteredKeywordsDB.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className={cn("p-4 font-black text-slate-900 transition-all duration-300", isWideView && "border-l border-slate-100/50")}>{item.keyword}</td>
                                    <td className={cn("p-4 text-center transition-all duration-300", isWideView && "border-l border-slate-100/50")}>
                                        <span className={cn("px-2.5 py-1 rounded-full border text-[10px] font-black inline-block min-w-[55px]", getKDColorClass(item.kd))}>
                                            {item.kd}% ({getKDText(item.kd)})
                                        </span>
                                    </td>
                                    <td className={cn("p-4 text-center font-mono transition-all duration-300", isWideView && "border-l border-slate-100/50")}>{item.volume.toLocaleString('ar-EG')} عملية</td>
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
                    <div className="bg-white border border-slate-100 rounded-[32px] w-full max-w-md p-8 shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
                        <div className="mb-6">
                            <h3 className="text-xl font-black text-slate-900">إضافة كلمة لقاعدة المقترحات</h3>
                            <p className="text-[10px] text-slate-400 font-bold mt-1">إضافة كلمة مقترحة جديدة للعميل الحالي مع تحديد مقاييسها وقناتها</p>
                        </div>

                        <form onSubmit={handleAddSubmit} className="space-y-4">
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
                                    disabled={isSubmitting}
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
        </div>
    );
}
