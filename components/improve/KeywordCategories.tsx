'use client';

import { useState, useEffect } from 'react';
import { 
    Folder, 
    Plus, 
    Trash2, 
    ChevronDown, 
    ChevronUp, 
    Globe, 
    Activity, 
    BookOpen, 
    Check, 
    FileText, 
    HelpCircle,
    Save,
    X,
    FolderPlus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

interface Client {
    id: string;
    name: string;
    website: string;
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
}

interface KeywordCategory {
    id: string;
    name: string;
    description: string;
    target_page: string;
    keyword_ids: string[]; // معرّفات كلمات العميل النشطة المرتبطة
}

interface KeywordCategoriesProps {
    selectedClient: Client;
    clientKeywords: ClientKeyword[];
    usingFallback: boolean;
}

const DEFAULT_CATEGORIES = (clientId: string): KeywordCategory[] => [
    {
        id: `cat-${clientId}-brand`,
        name: 'كلمات العلامة التجارية والصفحة الرئيسية 🏠',
        description: 'استهداف الكلمات الدلالية لاسم العلامة التجارية والعبارات التعريفية الكبرى للمتجر لتعزيز الموثوقية.',
        target_page: '',
        keyword_ids: []
    },
    {
        id: `cat-${clientId}-core`,
        name: 'التصنيفات والمنتجات الأكثر مبيعاً 💼',
        description: 'تركيز الكلمات البحثية التجارية والتحويلية (Commercial & Transactional) لأقوى خدمات أو منتجات المتجر.',
        target_page: '',
        keyword_ids: []
    }
];

export function KeywordCategories({ selectedClient, clientKeywords, usingFallback }: KeywordCategoriesProps) {
    const [categories, setCategories] = useState<KeywordCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
    
    // حالات النافذة المنبثقة لإضافة تصنيف جديد
    const [showAddModal, setShowAddModal] = useState(false);
    const [newCatName, setNewCatName] = useState('');
    const [newCatDescription, setNewCatDescription] = useState('');
    const [newCatTargetPage, setNewCatTargetPage] = useState('');
    
    // اختيار كلمة لإضافتها لتصنيف معين
    const [selectedKeywordIdMap, setSelectedKeywordIdMap] = useState<Record<string, string>>({});
    const [successMsg, setSuccessMsg] = useState('');

    // تحميل التصنيفات عند تغيير العميل
    useEffect(() => {
        const loadCategories = async () => {
            setIsLoading(true);
            setExpandedCategoryId(null);
            
            const localStorageKey = `seo_keyword_categories_${selectedClient.id}`;
            
            if (usingFallback) {
                const cached = localStorage.getItem(localStorageKey);
                if (cached) {
                    try {
                        setCategories(JSON.parse(cached));
                    } catch (e) {
                        const defaults = DEFAULT_CATEGORIES(selectedClient.id);
                        setCategories(defaults);
                        localStorage.setItem(localStorageKey, JSON.stringify(defaults));
                    }
                } else {
                    const defaults = DEFAULT_CATEGORIES(selectedClient.id);
                    setCategories(defaults);
                    localStorage.setItem(localStorageKey, JSON.stringify(defaults));
                }
                setIsLoading(false);
            } else {
                try {
                    // محاولة الاستعلام من Supabase
                    const { data, error } = await supabase
                        .from('seo_keyword_categories')
                        .select('*')
                        .eq('client_id', selectedClient.id)
                        .single();

                    if (error) {
                        throw error;
                    }

                    if (data && data.categories_data) {
                        setCategories(data.categories_data);
                    } else {
                        throw new Error('Empty categories');
                    }
                } catch (err: any) {
                    console.log('Categories table query failed, falling back to localStorage:', err.message);
                    
                    const cached = localStorage.getItem(localStorageKey);
                    if (cached) {
                        try {
                            setCategories(JSON.parse(cached));
                        } catch (e) {
                            const defaults = DEFAULT_CATEGORIES(selectedClient.id);
                            setCategories(defaults);
                            localStorage.setItem(localStorageKey, JSON.stringify(defaults));
                        }
                    } else {
                        const defaults = DEFAULT_CATEGORIES(selectedClient.id);
                        setCategories(defaults);
                        localStorage.setItem(localStorageKey, JSON.stringify(defaults));
                    }
                } finally {
                    setIsLoading(false);
                }
            }
        };

        if (selectedClient) {
            loadCategories();
        }
    }, [selectedClient, usingFallback]);

    // حفظ البيانات سحابياً ومحلياً
    const saveCategories = async (updatedCategories: KeywordCategory[]) => {
        const localStorageKey = `seo_keyword_categories_${selectedClient.id}`;
        
        // 1. الحفظ المحلي كنسخة احتياطية آمنة
        localStorage.setItem(localStorageKey, JSON.stringify(updatedCategories));
        setCategories(updatedCategories);

        // 2. محاولة الحفظ في Supabase
        if (!usingFallback) {
            try {
                const { data: checkData, error: checkError } = await supabase
                    .from('seo_keyword_categories')
                    .select('id')
                    .eq('client_id', selectedClient.id);

                if (checkError) throw checkError;

                if (checkData && checkData.length > 0) {
                    const { error: updateError } = await supabase
                        .from('seo_keyword_categories')
                        .update({ categories_data: updatedCategories })
                        .eq('client_id', selectedClient.id);
                    
                    if (updateError) throw updateError;
                } else {
                    const { error: insertError } = await supabase
                        .from('seo_keyword_categories')
                        .insert([{ client_id: selectedClient.id, categories_data: updatedCategories }]);
                    
                    if (insertError) throw insertError;
                }
            } catch (err: any) {
                console.warn('⚠️ Safe Fallback: Failed to sync keyword categories in Supabase, preserved in LocalStorage.', err.message);
            }
        }
    };

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCatName.trim()) return;

        // تهيئة الرابط تلقائياً
        let formattedUrl = newCatTargetPage.trim();
        if (formattedUrl && !formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
            formattedUrl = `https://${formattedUrl}`;
        }

        const newCategory: KeywordCategory = {
            id: `cat-${Date.now()}`,
            name: newCatName,
            description: newCatDescription,
            target_page: formattedUrl,
            keyword_ids: []
        };

        const updated = [...categories, newCategory];
        await saveCategories(updated);

        setNewCatName('');
        setNewCatDescription('');
        setNewCatTargetPage('');
        setShowAddModal(false);
        
        setSuccessMsg('تم إنشاء المجموعة بنجاح! 📁✨');
        setTimeout(() => setSuccessMsg(''), 1500);
    };

    const handleDeleteCategory = async (id: string, name: string) => {
        if (!confirm(`هل أنت متأكد من رغبتك في حذف هذا التصنيف بالكامل (${name})؟\n(ملاحظة: لن يتم حذف الكلمات النشطة الأصلية، سيتم فقط إلغاء تقسيمها).`)) return;
        
        const updated = categories.filter(c => c.id !== id);
        await saveCategories(updated);
        
        setSuccessMsg('تم حذف التصنيف بنجاح! 🗑️');
        setTimeout(() => setSuccessMsg(''), 1500);
    };

    const handleAddKeywordToCategory = async (categoryId: string) => {
        const keywordId = selectedKeywordIdMap[categoryId];
        if (!keywordId) return;

        const updated = categories.map(cat => {
            if (cat.id === categoryId) {
                // منع التكرار
                if (cat.keyword_ids.includes(keywordId)) return cat;
                return {
                    ...cat,
                    keyword_ids: [...cat.keyword_ids, keywordId]
                };
            }
            return cat;
        });

        await saveCategories(updated);
        setSelectedKeywordIdMap(prev => ({ ...prev, [categoryId]: '' }));
        
        setSuccessMsg('تم ربط الكلمة بالمجموعة! 🔗🟢');
        setTimeout(() => setSuccessMsg(''), 1500);
    };

    const handleRemoveKeywordFromCategory = async (categoryId: string, keywordId: string) => {
        const updated = categories.map(cat => {
            if (cat.id === categoryId) {
                return {
                    ...cat,
                    keyword_ids: cat.keyword_ids.filter(id => id !== keywordId)
                };
            }
            return cat;
        });

        await saveCategories(updated);
    };

    // حساب الإحصاءات التجميعية الحية لكل مجموعة تصنيف
    const calculateCategoryStats = (cat: KeywordCategory) => {
        const linkedKeywords = clientKeywords.filter(k => cat.keyword_ids.includes(k.id));
        const totalKeywords = linkedKeywords.length;
        
        if (totalKeywords === 0) {
            return {
                totalKeywords: 0,
                avgKD: 0,
                totalVolume: 0,
                implementationRate: 0
            };
        }

        const avgKD = Math.round(linkedKeywords.reduce((sum, k) => sum + (k.kd || 0), 0) / totalKeywords);
        const totalVolume = linkedKeywords.reduce((sum, k) => sum + (k.volume || 0), 0);
        const usedKeywordsCount = linkedKeywords.filter(k => k.status === 'used').length;
        const implementationRate = Math.round((usedKeywordsCount / totalKeywords) * 100);

        return {
            totalKeywords,
            avgKD,
            totalVolume,
            implementationRate
        };
    };

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
        <div className="bg-white border border-slate-200/80 rounded-[32px] overflow-hidden shadow-sm p-6 sm:p-8 space-y-6 animate-in">
            {/* رسالة النجاح */}
            {successMsg && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] bg-zinc-950 border border-zinc-800 text-white font-black text-xs py-3 px-6 rounded-2xl shadow-xl animate-bounce">
                    {successMsg}
                </div>
            )}

            {/* ترويسة الصفحة */}
            <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 pb-5">
                <div className="flex items-center gap-2">
                    <div className="p-2.5 rounded-2xl bg-black text-white shadow-sm">
                        <Folder size={18} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-900">مجموعات وتصنيفات الكلمات (Clustering)</h3>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">تقسيم وهيكلة كلمات العميل المستهدفة في مجموعات موضوعية متناسقة لتعزيز سلطة المحتوى (Silo Structure)</p>
                    </div>
                </div>
                
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-1.5 px-4.5 py-2.5 rounded-2xl bg-black text-white hover:bg-zinc-800 text-xs font-black transition-all shadow-sm"
                >
                    <FolderPlus size={14} />
                    <span>إنشاء تصنيف جديد 📁</span>
                </button>
            </div>

            {/* قائمة كروت المجموعات والتصنيفات */}
            <div className="space-y-4">
                {categories.length === 0 ? (
                    <div className="p-12 text-center border border-dashed border-slate-200 rounded-[28px] text-slate-400 bg-slate-50/20">
                        <Folder className="mx-auto mb-3 text-slate-300" size={32} />
                        <p className="text-xs font-black text-slate-700">لا توجد مجموعات كلمات منشأة حالياً</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-1">اضغط على "إنشاء تصنيف جديد" لتقسيم كلماتك وتطبيق استراتيجية السيو المتقدمة</p>
                    </div>
                ) : (
                    categories.map(cat => {
                        const stats = calculateCategoryStats(cat);
                        const isExpanded = expandedCategoryId === cat.id;
                        
                        // فلترة الكلمات المتاحة للربط (التي لم تربط بهذا التصنيف بعد)
                        const availableKeywords = clientKeywords.filter(k => !cat.keyword_ids.includes(k.id));

                        return (
                            <div 
                                key={cat.id} 
                                className={cn(
                                    "border rounded-[28px] overflow-hidden transition-all duration-300",
                                    isExpanded ? "border-black bg-slate-50/20 shadow-sm" : "border-slate-100 bg-white hover:border-slate-300"
                                )}
                            >
                                {/* منطقة الكارت التفاعلية */}
                                <div 
                                    onClick={() => setExpandedCategoryId(isExpanded ? null : cat.id)}
                                    className="p-5 sm:p-6 cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                                >
                                    {/* معلومات التصنيف */}
                                    <div className="space-y-1.5 flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-800">
                                                <Folder size={15} />
                                            </span>
                                            <h4 className="font-black text-slate-900 text-sm truncate">{cat.name}</h4>
                                            
                                            {cat.target_page && (
                                                <a 
                                                    href={cat.target_page} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg hover:bg-emerald-100/70 transition-all shrink-0"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Globe size={10} />
                                                    <span>الصفحة المستهدفة</span>
                                                </a>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-bold leading-relaxed max-w-2xl">{cat.description || 'لا يوجد وصف مضاف لهذا التصنيف حالياً.'}</p>
                                    </div>

                                    {/* المؤشرات التجميعية الحية (Combined Analytics) */}
                                    <div className="flex items-center gap-4.5 flex-wrap sm:flex-nowrap shrink-0">
                                        
                                        {/* عدد الكلمات */}
                                        <div className="text-center bg-slate-50/80 border border-slate-100 rounded-2xl py-2 px-3 min-w-[70px]">
                                            <div className="text-[8px] font-black text-slate-400 uppercase">الكلمات</div>
                                            <div className="text-xs font-black text-slate-800 font-mono mt-0.5">{stats.totalKeywords}</div>
                                        </div>

                                        {/* متوسط الصعوبة */}
                                        <div className="text-center bg-slate-50/80 border border-slate-100 rounded-2xl py-2 px-3 min-w-[70px]">
                                            <div className="text-[8px] font-black text-slate-400 uppercase">متوسط الصعوبة</div>
                                            <div className="text-xs font-black text-slate-800 font-mono mt-0.5">
                                                {stats.totalKeywords > 0 ? `${stats.avgKD}%` : '--'}
                                            </div>
                                        </div>

                                        {/* حجم البحث المجمع */}
                                        <div className="text-center bg-slate-50/80 border border-slate-100 rounded-2xl py-2 px-3 min-w-[85px]">
                                            <div className="text-[8px] font-black text-slate-400 uppercase">البحث المجمع</div>
                                            <div className="text-xs font-black text-slate-800 font-mono mt-0.5">
                                                {stats.totalKeywords > 0 ? stats.totalVolume.toLocaleString('ar-EG') : '٠'}
                                            </div>
                                        </div>

                                        {/* معدل الاستخدام */}
                                        <div className="text-center bg-slate-50/80 border border-slate-100 rounded-2xl py-2 px-3 min-w-[80px]">
                                            <div className="text-[8px] font-black text-slate-400 uppercase">معدل التفعيل</div>
                                            <div className={cn(
                                                "text-xs font-black font-mono mt-0.5",
                                                stats.totalKeywords > 0 ? (stats.implementationRate >= 70 ? 'text-emerald-600' : 'text-slate-800') : 'text-slate-400'
                                            )}>
                                                {stats.totalKeywords > 0 ? `${stats.implementationRate}%` : '--'}
                                            </div>
                                        </div>

                                        {/* أيقونات التمدد والتحكم */}
                                        <div className="flex items-center gap-1 border-r border-slate-100 pr-3 mr-1.5">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteCategory(cat.id, cat.name);
                                                }}
                                                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                                title="حذف التصنيف"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                            <span className="text-slate-300">
                                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </span>
                                        </div>

                                    </div>
                                </div>

                                {/* درج الكلمات المتمدد (Keyword Drawer Table) */}
                                {isExpanded && (
                                    <div className="border-t border-slate-100 p-5 sm:p-6 bg-white animate-in space-y-5" onClick={(e) => e.stopPropagation()}>
                                        
                                        {/* أدوات ربط كلمة نشطة جديدة */}
                                        <div className="bg-slate-50/60 border border-slate-100 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div>
                                                <h5 className="text-[11px] font-black text-slate-800">➕ ربط كلمة مفتاحية نشطة بهذا التصنيف</h5>
                                                <p className="text-[9px] text-slate-400 font-bold mt-0.5">اختر من قائمة الكلمات النشطة المستهدفة للعميل لإلحاقها بهذا التصنيف</p>
                                            </div>

                                            <div className="flex items-center gap-2.5 max-w-md w-full">
                                                <select
                                                    value={selectedKeywordIdMap[cat.id] || ''}
                                                    onChange={(e) => setSelectedKeywordIdMap(prev => ({ ...prev, [cat.id]: e.target.value }))}
                                                    className="flex-1 bg-white border border-slate-200/80 rounded-xl py-2 px-3 text-[11px] font-bold outline-none focus:border-black transition-all"
                                                >
                                                    <option value="">-- اختر كلمة نشطة للربط ({availableKeywords.length}) --</option>
                                                    {availableKeywords.map(k => (
                                                        <option key={k.id} value={k.id}>
                                                            {k.keyword} (KD: {k.kd || 0}% | Vol: {k.volume || 0})
                                                        </option>
                                                    ))}
                                                </select>
                                                
                                                <button
                                                    onClick={() => handleAddKeywordToCategory(cat.id)}
                                                    disabled={!selectedKeywordIdMap[cat.id]}
                                                    className="px-4 py-2 bg-black hover:bg-zinc-800 disabled:bg-slate-200 text-white disabled:text-slate-400 text-[10.5px] font-black rounded-xl transition-all shadow-sm flex items-center gap-1"
                                                >
                                                    <span>ربط الكلمة</span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* جدول الكلمات الملحقة بالتصنيف */}
                                        <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                                            <table className="w-full text-right border-collapse">
                                                <thead>
                                                    <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-[9.5px] font-black uppercase">
                                                        <th className="p-3.5">الكلمة المستهدفة</th>
                                                        <th className="p-3.5 text-center">نية البحث</th>
                                                        <th className="p-3.5 text-center">الصعوبة KD</th>
                                                        <th className="p-3.5 text-center">حجم البحث</th>
                                                        <th className="p-3.5 text-center">الحالة</th>
                                                        <th className="p-3.5">مكان التواجد</th>
                                                        <th className="p-3.5 text-center">الإجراءات</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="text-xs font-bold text-slate-700 divide-y divide-slate-100">
                                                    {cat.keyword_ids.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={7} className="p-8 text-center text-slate-400">
                                                                لا توجد كلمات مفتاحية مرتبطة بهذه المجموعة حالياً.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        clientKeywords.filter(k => cat.keyword_ids.includes(k.id)).map(item => (
                                                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                                                <td className="p-3.5 text-slate-900 font-black">{item.keyword}</td>
                                                                
                                                                {/* نية البحث */}
                                                                <td className="p-3.5 text-center">
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

                                                                {/* الصعوبة */}
                                                                <td className="p-3.5 text-center">
                                                                    {item.kd !== undefined && item.kd > 0 ? (
                                                                        <span className={cn("px-2.5 py-0.5 rounded-full border text-[10px] font-black inline-block min-w-[55px]", getKDColorClass(item.kd))}>
                                                                            {item.kd}% ({getKDText(item.kd)})
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-slate-300 text-[10px] font-bold">-</span>
                                                                    )}
                                                                </td>

                                                                {/* حجم البحث */}
                                                                <td className="p-3.5 text-center font-mono">
                                                                    {item.volume !== undefined && item.volume > 0 ? (
                                                                        <span>{item.volume.toLocaleString('ar-EG')}</span>
                                                                    ) : (
                                                                        <span className="text-slate-300 text-[10px] font-bold">-</span>
                                                                    )}
                                                                </td>

                                                                {/* الحالة */}
                                                                <td className="p-3.5 text-center">
                                                                    <span className={cn(
                                                                        "px-2 py-0.5 rounded-full border text-[9px] font-black inline-block min-w-[85px]",
                                                                        item.status === 'used' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                                                                        item.status === 'changed' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                                                                        'bg-slate-50 border-slate-200 text-slate-600'
                                                                    )}>
                                                                        {item.status === 'used' ? 'مستخدمة بنجاح' :
                                                                         item.status === 'changed' ? 'تم استبدالها' : 'قيد المراجعة'}
                                                                    </span>
                                                                </td>

                                                                <td className="p-3.5 font-medium text-slate-500 max-w-[150px] truncate">{item.location}</td>

                                                                {/* إجراء الحذف من التصنيف */}
                                                                <td className="p-3.5 text-center">
                                                                    <button
                                                                        onClick={() => handleRemoveKeywordFromCategory(cat.id, item.id)}
                                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                                                        title="إلغاء ربط الكلمة بهذا التصنيف"
                                                                    >
                                                                        <X size={12} />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* مودال إنشاء تصنيف جديد */}
            {showAddModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4 animate-in duration-250">
                    <div className="bg-white border border-slate-100 rounded-[32px] w-full max-w-md p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="mb-6 border-b border-slate-100 pb-3">
                            <h3 className="text-lg font-black text-slate-900">إنشاء تصنيف / مجموعة كلمات جديدة</h3>
                            <p className="text-[10px] text-slate-400 font-bold mt-1">تحديد مجموعة كلمات موضوعية (Keyword Cluster) لربط كلمات العميل تحتها</p>
                        </div>

                        <form onSubmit={handleCreateCategory} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-600">اسم التصنيف / المجموعة</label>
                                <input 
                                    type="text" 
                                    required
                                    placeholder="مثال: حبوب قهوة كولومبية ☕"
                                    value={newCatName}
                                    onChange={(e) => setNewCatName(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl py-3 px-4 text-xs font-bold outline-none focus:border-black focus:bg-white text-slate-800 transition-all"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-600">رابط الصفحة المستهدفة (Landing Page URL - اختياري)</label>
                                <input 
                                    type="text" 
                                    placeholder="مثال: sutox.com/coffee/colombian"
                                    value={newCatTargetPage}
                                    onChange={(e) => setNewCatTargetPage(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl py-3 px-4 text-xs font-bold outline-none focus:border-black focus:bg-white text-slate-800 transition-all text-left direction-ltr"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-600">وصف التصنيف والهدف منه (اختياري)</label>
                                <textarea
                                    value={newCatDescription}
                                    onChange={(e) => setNewCatDescription(e.target.value)}
                                    rows={4}
                                    placeholder="اكتب وصفاً أو ملاحظات توضيحية لهذه المجموعة الموضوعية..."
                                    className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs font-bold outline-none focus:border-black focus:bg-white text-slate-800 transition-all"
                                />
                            </div>

                            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="submit"
                                    className="flex-1 py-3 px-6 rounded-2xl bg-black hover:bg-zinc-800 text-white font-bold text-xs transition-all shadow-sm"
                                >
                                    إنشاء وحفظ المجموعة
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
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
