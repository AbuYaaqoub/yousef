'use client';

import { useState, useEffect } from 'react';
import { 
    Layers, 
    Plus, 
    Edit3, 
    Trash2, 
    Users, 
    Calendar, 
    Check, 
    X, 
    AlertCircle, 
    Info, 
    Database, 
    ChevronLeft, 
    Sparkles,
    Loader2,
    Search,
    Tag,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import Link from 'next/link';

interface Category {
    id: string;
    name: string;
    keywords?: string[];
    created_at?: string;
    leads_count?: number;
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Form inputs state
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Keywords inputs state per category
    const [newKeywordInputs, setNewKeywordInputs] = useState<Record<string, string>>({});
    
    // Editing state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');

    // DB setup / fallback flags
    const [usingFallback, setUsingFallback] = useState(false);
    const [needsSetup, setNeedsSetup] = useState(false);

    // Existing / Unassigned keywords state
    interface UnassignedKeyword {
        text: string;
        count: number;
    }
    const [unassignedKeywords, setUnassignedKeywords] = useState<UnassignedKeyword[]>([]);
    const [expandedSelectors, setExpandedSelectors] = useState<Record<string, boolean>>({});
    const [keywordSearchQueries, setKeywordSearchQueries] = useState<Record<string, string>>({});

    // Fetch categories and their leads count
    const fetchCategories = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/categories');
            const data = await res.json();

            if (data.needsSetup) {
                setNeedsSetup(true);
                setUsingFallback(true);
                loadLocalCategories();
                return;
            }

            if (data.success) {
                // Fetch stats to get count per category
                const statsRes = await fetch('/api/stats');
                const statsData = await statsRes.json();
                
                let leadsCountMap: Record<string, number> = {};
                if (statsData.success && statsData.stats) {
                    // Try to get leads by category grouping
                    try {
                        const leadsRes = await fetch('/api/leads?limit=10000');
                        const leadsData = await leadsRes.json();
                        if (leadsData.success && leadsData.leads) {
                            leadsData.leads.forEach((lead: any) => {
                                if (lead.category) {
                                    leadsCountMap[lead.category] = (leadsCountMap[lead.category] || 0) + 1;
                                }
                            });
                        }
                    } catch (e) {
                        console.error('Failed to aggregate lead counts:', e);
                    }
                }

                const enrichedCats = data.categories.map((cat: Category) => ({
                    ...cat,
                    leads_count: leadsCountMap[cat.name] || 0
                }));

                setCategories(enrichedCats);
                setUsingFallback(false);
                setNeedsSetup(false);
            } else {
                throw new Error(data.error || 'فشل جلب التصنيفات');
            }
        } catch (err: any) {
            console.error('Fetch Categories Error:', err);
            setUsingFallback(true);
            loadLocalCategories();
        } finally {
            setLoading(false);
        }
    };

    // Fallback: Load from localStorage
    const loadLocalCategories = () => {
        try {
            const saved = localStorage.getItem('custom_categories');
            let localCats: Category[] = [];
            if (saved) {
                localCats = JSON.parse(saved);
            } else {
                // Default categories to prepopulate
                localCats = [
                    { id: '1', name: 'أزياء وملابس', keywords: ['ملابس', 'فساتين', 'عبايات', 'قميص', 'تيشرت'], created_at: new Date().toISOString(), leads_count: 0 },
                    { id: '2', name: 'عطور ومستحضرات تجميل', keywords: ['عطور', 'بخور', 'مكياج', 'تجميل'], created_at: new Date().toISOString(), leads_count: 0 },
                    { id: '3', name: 'قهوة ومشروبات مختصة', keywords: ['قهوة', 'بن', 'اكواب', 'مشروبات'], created_at: new Date().toISOString(), leads_count: 0 },
                    { id: '4', name: 'أثاث وديكور منزلي', keywords: ['أثاث', 'طاولات', 'ديكور', 'كنب'], created_at: new Date().toISOString(), leads_count: 0 },
                ];
                localStorage.setItem('custom_categories', JSON.stringify(localCats));
            }
            
            // Try to count leads from local clients keywords if any, or just display 0
            setCategories(localCats);
        } catch (e) {
            console.error('Failed to load local categories:', e);
        }
    };

    // جلب الكلمات الدلالية الموجودة بالنظام وغير المصنفة
    const fetchExistingKeywords = async () => {
        if (usingFallback) {
            try {
                // الكلمات الدلالية الافتراضية المقترحة للتشغيل المحلي
                let mockSuggestions = [
                    { text: 'ملابس رجالية', count: 4 },
                    { text: 'مكياج عيون', count: 7 },
                    { text: 'بن كولومبي', count: 3 },
                    { text: 'كنب مودرن', count: 5 },
                    { text: 'اكسسوارات هواتف', count: 12 },
                    { text: 'ألعاب أطفال', count: 8 },
                    { text: 'عطور مختصة', count: 9 },
                    { text: 'تمر سكري', count: 14 }
                ];
                
                // استبعاد الكلمات المربوطة بالفعل بالتصنيفات
                const assigned = new Set<string>();
                categories.forEach(cat => {
                    if (cat.keywords) {
                        cat.keywords.forEach(k => assigned.add(k.trim().toLowerCase()));
                    }
                });

                mockSuggestions = mockSuggestions.filter(item => !assigned.has(item.text.trim().toLowerCase()));
                setUnassignedKeywords(mockSuggestions);
            } catch (e) {
                console.error('Failed to load local suggested keywords:', e);
            }
        } else {
            try {
                const res = await fetch('/api/categories/existing-keywords');
                const data = await res.json();
                if (data.success) {
                    setUnassignedKeywords(data.keywords || []);
                }
            } catch (e) {
                console.error('Failed to fetch existing keywords from server:', e);
            }
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchExistingKeywords();
    }, [categories, usingFallback]);

    // Show Auto-dismiss message
    const showMessage = (msg: string, type: 'success' | 'error') => {
        if (type === 'success') {
            setSuccessMessage(msg);
            setTimeout(() => setSuccessMessage(null), 4000);
        } else {
            setError(msg);
            setTimeout(() => setError(null), 5000);
        }
    };

    // Add new Category
    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        const name = newCategoryName.trim();
        if (!name) return;

        setIsSubmitting(true);
        setError(null);

        if (usingFallback) {
            // Local storage strategy
            const isDuplicate = categories.some(cat => cat.name.toLowerCase() === name.toLowerCase());
            if (isDuplicate) {
                showMessage('هذا التصنيف موجود بالفعل', 'error');
                setIsSubmitting(false);
                return;
            }

            const newCat: Category = {
                id: `cat-${Date.now()}`,
                name: name,
                created_at: new Date().toISOString(),
                leads_count: 0
            };

            const updated = [...categories, newCat].sort((a, b) => a.name.localeCompare(b.name));
            localStorage.setItem('custom_categories', JSON.stringify(updated));
            setCategories(updated);
            setNewCategoryName('');
            showMessage('تم إضافة التصنيف محلياً بنجاح', 'success');
            setIsSubmitting(false);
        } else {
            // Database strategy
            try {
                const res = await fetch('/api/categories', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name })
                });
                const data = await res.json();
                if (data.success) {
                    setNewCategoryName('');
                    showMessage('تم إضافة التصنيف بنجاح', 'success');
                    fetchCategories();
                } else {
                    showMessage(data.error || 'خطأ في إضافة التصنيف', 'error');
                }
            } catch (err: any) {
                showMessage('تعذر الاتصال بقاعدة البيانات. تم التحويل لوضع التخزين المحلي.', 'error');
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    // Delete Category
    const handleDeleteCategory = async (id: string, name: string, count: number) => {
        const confirmMsg = count > 0 
            ? `تنبيه هام! هذا التصنيف يحتوي على عدد (${count}) من المتاجر المستخرجة. عند حذفه سيتم حذف كافة المتاجر التابعة له نهائياً.\n\nهل أنت متأكد من رغبتك في حذف تصنيف "${name}" بالكامل؟`
            : `هل أنت متأكد من رغبتك في حذف تصنيف "${name}"؟`;
        
        if (!confirm(confirmMsg)) return;

        if (usingFallback) {
            const updated = categories.filter(cat => cat.id !== id);
            localStorage.setItem('custom_categories', JSON.stringify(updated));
            setCategories(updated);
            showMessage('تم حذف التصنيف محلياً بنجاح', 'success');
        } else {
            try {
                const res = await fetch(`/api/categories/${id}`, {
                    method: 'DELETE'
                });
                const data = await res.json();
                if (data.success) {
                    showMessage('تم حذف التصنيف والمتاجر المرتبطة به بنجاح', 'success');
                    fetchCategories();
                } else {
                    showMessage(data.error || 'خطأ أثناء الحذف', 'error');
                }
            } catch (err: any) {
                showMessage('حدث خطأ أثناء الاتصال بقاعدة البيانات', 'error');
            }
        }
    };

    // Rename Category (Submit)
    const handleRenameCategory = async (id: string, oldName: string) => {
        const name = editingName.trim();
        if (!name || name === oldName) {
            setEditingId(null);
            return;
        }

        if (usingFallback) {
            const isDuplicate = categories.some(cat => cat.id !== id && cat.name.toLowerCase() === name.toLowerCase());
            if (isDuplicate) {
                showMessage('هذا التصنيف موجود بالفعل', 'error');
                return;
            }

            const updated = categories.map(cat => 
                cat.id === id ? { ...cat, name } : cat
            ).sort((a, b) => a.name.localeCompare(b.name));

            localStorage.setItem('custom_categories', JSON.stringify(updated));
            setCategories(updated);
            setEditingId(null);
            showMessage('تم تعديل اسم التصنيف محلياً بنجاح', 'success');
        } else {
            try {
                const res = await fetch(`/api/categories/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name })
                });
                const data = await res.json();
                if (data.success) {
                    showMessage('تم تعديل اسم التصنيف بنجاح وتحديث كافة المتاجر المرتبطة', 'success');
                    setEditingId(null);
                    fetchCategories();
                } else {
                    showMessage(data.error || 'خطأ أثناء التعديل', 'error');
                }
            } catch (err: any) {
                showMessage('تعذر الاتصال بالخادم لحفظ التعديلات', 'error');
            }
        }
    };

    // إضافة كلمة مفتاحية للتصنيف المخصص
    const handleAddKeyword = async (categoryId: string, categoryName: string, existingKeywords: string[] = []) => {
        const keywordText = (newKeywordInputs[categoryId] || '').trim();
        if (!keywordText) return;

        // التحقق من التكرار داخل نفس التصنيف
        if (existingKeywords.map(k => k.toLowerCase()).includes(keywordText.toLowerCase())) {
            showMessage('هذه الكلمة المفتاحية مضافة بالفعل في هذا التصنيف', 'error');
            return;
        }

        // تحذير إذا كانت الكلمة مضافة في تصنيف آخر
        const duplicateAcrossCats = categories.some(cat => 
            cat.id !== categoryId && cat.keywords?.map(k => k.toLowerCase()).includes(keywordText.toLowerCase())
        );
        if (duplicateAcrossCats) {
            if (!confirm('تنبيه: هذه الكلمة مضافة بالفعل في تصنيف آخر. هل تريد ربطها أيضاً بهذا التصنيف؟')) {
                return;
            }
        }

        const updatedKeywords = [...existingKeywords, keywordText];

        if (usingFallback) {
            const updated = categories.map(cat => 
                cat.id === categoryId ? { ...cat, keywords: updatedKeywords } : cat
            );
            localStorage.setItem('custom_categories', JSON.stringify(updated));
            setCategories(updated);
            setNewKeywordInputs(prev => ({ ...prev, [categoryId]: '' }));
            showMessage('تم إضافة الكلمة المفتاحية محلياً', 'success');
        } else {
            try {
                const res = await fetch(`/api/categories/${categoryId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ keywords: updatedKeywords })
                });
                const data = await res.json();
                if (data.success) {
                    setNewKeywordInputs(prev => ({ ...prev, [categoryId]: '' }));
                    showMessage('تم إضافة الكلمة المفتاحية بنجاح', 'success');
                    fetchCategories();
                } else {
                    showMessage(data.error || 'خطأ أثناء إضافة الكلمة', 'error');
                }
            } catch (e) {
                showMessage('تعذر الاتصال بالخادم لحفظ الكلمة', 'error');
            }
        }
    };

    // حذف كلمة مفتاحية من التصنيف المخصص
    const handleDeleteKeyword = async (categoryId: string, keywordToDelete: string, existingKeywords: string[] = []) => {
        if (!confirm(`هل أنت متأكد من رغبتك في إزالة الكلمة المفتاحية "${keywordToDelete}"؟`)) return;

        const updatedKeywords = existingKeywords.filter(k => k !== keywordToDelete);

        if (usingFallback) {
            const updated = categories.map(cat => 
                cat.id === categoryId ? { ...cat, keywords: updatedKeywords } : cat
            );
            localStorage.setItem('custom_categories', JSON.stringify(updated));
            setCategories(updated);
            showMessage('تم إزالة الكلمة المفتاحية محلياً', 'success');
        } else {
            try {
                const res = await fetch(`/api/categories/${categoryId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ keywords: updatedKeywords })
                });
                const data = await res.json();
                if (data.success) {
                    showMessage('تم إزالة الكلمة المفتاحية بنجاح', 'success');
                    fetchCategories();
                } else {
                    showMessage(data.error || 'خطأ أثناء الإزالة', 'error');
                }
            } catch (e) {
                showMessage('تعذر الاتصال بالخادم لحفظ التعديلات', 'error');
            }
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-2 animate-fade-in pb-12">
            
            {/* Header / Glowing Welcome Hero Banner */}
            <div className="relative overflow-hidden rounded-[36px] bg-black p-8 md:p-10 text-white shadow-2xl shadow-black/25 mb-8">
                <div className="absolute -left-20 -top-20 w-80 h-80 rounded-full bg-zinc-800/20 blur-[100px] pointer-events-none" />
                <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-zinc-800/10 blur-[100px] pointer-events-none" />
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="max-w-xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 backdrop-blur-md mb-4">
                            <Layers size={14} className="text-zinc-300" />
                            <span className="text-[10px] font-bold text-slate-200">إدارة تصنيفات البيانات الموحدة</span>
                        </div>
                        <h1 className="text-3xl font-black leading-tight flex items-center gap-3">
                            التصنيفات المخصصة <Sparkles className="text-amber-500 w-5 h-5 animate-pulse" />
                        </h1>
                        <p className="mt-3 text-zinc-300 font-medium text-xs md:text-sm leading-relaxed">
                            قم ببناء وتخصيص هيكل تصنيفات ثابت تعتمد عليه محركات الكشط ومستخلصات البيانات بدلاً من الكلمات المفتاحية العشوائية لتنظيم عملك وتصديره باحترافية.
                        </p>
                    </div>

                    <div className="shrink-0 flex flex-col items-start md:items-end gap-2 text-xs font-bold text-zinc-400">
                        <span className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-zinc-950 border border-zinc-800">
                            <Database size={13} className={usingFallback ? 'text-amber-500' : 'text-emerald-500'} />
                            <span>{usingFallback ? (needsSetup ? 'تخزين محلي (يتطلب إعداد)' : 'تخزين محلي احتياطي') : 'Supabase سحابي نشط'}</span>
                        </span>
                        <span className="px-3.5 py-1 text-[10px] text-zinc-500">إجمالي التصنيفات: {categories.length}</span>
                    </div>
                </div>
            </div>

            {/* Info Alerts for Setup */}
            {needsSetup && (
                <div className="bg-amber-50/70 border border-amber-200 text-amber-900 rounded-3xl p-5 mb-8 flex items-start gap-4 shadow-sm animate-fade-in">
                    <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={20} />
                    <div className="space-y-1.5">
                        <h4 className="text-xs font-black">تنبيه: قاعدة البيانات تحتاج للتهيئة</h4>
                        <p className="text-[11px] font-medium leading-relaxed text-amber-800">
                            لم يتم العثور على جدول `custom_categories` في قاعدة بيانات Supabase. قمنا بتفعيل وضع **التخزين المحلي الاحتياطي** لكي لا يتوقف عملك. للاستفادة الكاملة من حفظ وتحديث التصنيفات والمتاجر سحابياً، يرجى تشغيل محتويات ملف [supabase_schema.sql](file:///Users/user/Documents/sallahunter-pro/supabase_schema.sql) في لوحة تحكم Supabase.
                        </p>
                    </div>
                </div>
            )}

            {/* Success & Error Toasts */}
            {successMessage && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 mb-6 flex items-center gap-3 shadow-sm transition-all duration-300">
                    <Check className="text-emerald-600" size={18} />
                    <span className="text-xs font-bold">{successMessage}</span>
                </div>
            )}

            {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 mb-6 flex items-center gap-3 shadow-sm transition-all duration-300">
                    <X className="text-rose-600" size={18} />
                    <span className="text-xs font-bold">{error}</span>
                </div>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* 1. Add Category Card (Form) */}
                <div className="lg:col-span-1">
                    <div className="bg-white border border-slate-200/80 rounded-[32px] p-6 shadow-sm sticky top-6">
                        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
                            <div className="p-2 rounded-xl bg-slate-900 text-white">
                                <Plus size={18} />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-900 text-sm">إضافة تصنيف جديد</h3>
                                <p className="text-[10px] text-slate-400 font-medium">أدخل الاسم الفريد للتصنيف التجاري</p>
                            </div>
                        </div>

                        <form onSubmit={handleAddCategory} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-600">اسم التصنيف</label>
                                <input
                                    type="text"
                                    required
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    placeholder="مثال: مستلزمات الحيوانات الأليفة"
                                    className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl py-3 px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-black focus:border-black focus:bg-white text-slate-800 transition-all placeholder:text-slate-400"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting || !newCategoryName.trim()}
                                className="w-full py-3.5 px-6 rounded-2xl bg-black hover:bg-zinc-800 text-white font-bold text-xs transition-all shadow-md shadow-black/5 flex items-center justify-center gap-2 disabled:bg-zinc-300 disabled:shadow-none cursor-pointer"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="animate-spin" size={14} />
                                        <span>جاري الإضافة...</span>
                                    </>
                                ) : (
                                    <>
                                        <Plus size={14} />
                                        <span>إضافة التصنيف</span>
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-6 p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-2.5 text-[10px] text-slate-500 font-medium leading-relaxed">
                            <Info size={14} className="text-zinc-500 shrink-0 mt-0.5" />
                            <span>
                                سيتم إظهار هذا التصنيف كخيار في نماذج استخراج البيانات لمحركات سلة، مزيد، وخرائط قوقل، مما يتيح لك تصنيف البيانات مباشرة أثناء كشطها.
                            </span>
                        </div>
                    </div>
                </div>

                {/* 2. Categories List Grid */}
                <div className="lg:col-span-2 space-y-4">
                    
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h3 className="font-black text-slate-900 text-sm">التصنيفات المتاحة ({categories.length})</h3>
                            <p className="text-[10px] text-slate-400 font-medium">إدارة وحذف وتعديل التصنيفات وربط الكلمات الدلالية بها</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16 bg-white border border-slate-200/80 rounded-[32px]">
                            <Loader2 className="animate-spin text-slate-900 mb-3" size={24} />
                            <p className="text-xs text-slate-500 font-bold">جاري تحميل التصنيفات...</p>
                        </div>
                    ) : categories.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-4 bg-white border border-slate-200/80 rounded-[32px] text-center">
                            <Layers size={36} className="text-slate-300 mb-3" />
                            <p className="text-xs text-slate-500 font-bold mb-1">لا توجد تصنيفات مخصصة بعد</p>
                            <p className="text-[10px] text-slate-400 max-w-xs font-medium">ابدأ بإضافة تصنيف تجاري جديد من النموذج الجانبي لتنظيم بيانات عملائك.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {categories.map((cat) => {
                                const isEditing = editingId === cat.id;
                                return (
                                    <div 
                                        key={cat.id}
                                        className="bg-white border border-slate-200/80 p-5 rounded-3xl hover:shadow-md hover:border-zinc-400 transition-all duration-300 flex flex-col justify-between group text-right"
                                    >
                                        <div className="flex flex-col gap-4">
                                            <div className="flex items-start justify-between gap-3">
                                                
                                                {/* Icon & Details */}
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <div className="w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0">
                                                        <Layers size={18} className="text-zinc-700" />
                                                    </div>
                                                    
                                                    <div className="flex-1 min-w-0">
                                                        {isEditing ? (
                                                            <div className="flex items-center gap-1.5 w-full">
                                                                <input
                                                                    type="text"
                                                                    value={editingName}
                                                                    onChange={(e) => setEditingName(e.target.value)}
                                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-xs font-bold outline-none focus:border-black"
                                                                    autoFocus
                                                                />
                                                                <button 
                                                                    onClick={() => handleRenameCategory(cat.id, cat.name)}
                                                                    className="p-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white shrink-0"
                                                                    title="حفظ"
                                                                >
                                                                    <Check size={12} />
                                                                </button>
                                                                <button 
                                                                    onClick={() => setEditingId(null)}
                                                                    className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 shrink-0"
                                                                    title="إلغاء"
                                                                >
                                                                    <X size={12} />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <h3 className="font-extrabold text-slate-900 text-xs md:text-sm truncate">
                                                                {cat.name}
                                                            </h3>
                                                        )}
                                                        
                                                        {!isEditing && cat.created_at && (
                                                            <span className="text-[9px] text-slate-400 font-medium flex items-center gap-1 mt-1">
                                                                <Calendar size={10} />
                                                                أنشئ في: {new Date(cat.created_at).toLocaleDateString('ar-EG')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Top right stats */}
                                                {!isEditing && (
                                                    <Link 
                                                        href={`/leads?category=${encodeURIComponent(cat.name)}`}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100 text-slate-600 hover:text-black text-[10px] font-extrabold transition-colors shrink-0"
                                                        title="عرض المتاجر المرتبطة"
                                                    >
                                                        <Users size={11} />
                                                        <span>{cat.leads_count || 0}</span>
                                                    </Link>
                                                )}

                                            </div>

                                            {/* قائمة الكلمات المفتاحية التابعة */}
                                            <div className="space-y-2 border-t border-slate-50 pt-3">
                                                <div className="text-[9px] font-black text-slate-400">الكلمات الدلالية التابعة:</div>
                                                
                                                <div className="flex flex-wrap gap-1.5 min-h-[25px]">
                                                    {cat.keywords && cat.keywords.length > 0 ? (
                                                        cat.keywords.map((kw) => (
                                                            <span 
                                                                key={kw} 
                                                                className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-[10px] font-bold text-slate-700 animate-fade-in"
                                                            >
                                                                {kw}
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDeleteKeyword(cat.id, kw, cat.keywords);
                                                                    }}
                                                                    className="text-slate-400 hover:text-rose-600 transition-colors shrink-0 cursor-pointer"
                                                                    title="حذف الكلمة"
                                                                >
                                                                    <X size={9} strokeWidth={3} />
                                                                </button>
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-[9px] text-slate-400 italic">لا توجد كلمات مفتاحية مرتبطة</span>
                                                    )}
                                                </div>

                                                {/* فورم إضافة كلمة دلالية جديدة */}
                                                <div className="flex gap-1.5 pt-1">
                                                    <input
                                                        type="text"
                                                        value={newKeywordInputs[cat.id] || ''}
                                                        onChange={(e) => setNewKeywordInputs(prev => ({ ...prev, [cat.id]: e.target.value }))}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword(cat.id, cat.name, cat.keywords)}
                                                        placeholder="أضف كلمة دلالية جديدة..."
                                                        className="flex-1 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 text-[10px] font-bold outline-none focus:border-black focus:bg-white text-slate-800 transition-all placeholder:text-slate-400"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAddKeyword(cat.id, cat.name, cat.keywords)}
                                                        className="px-3 py-1.5 rounded-xl bg-black hover:bg-zinc-800 text-white text-[10px] font-bold transition-all shadow-sm shrink-0 cursor-pointer"
                                                    >
                                                        ربط
                                                    </button>
                                                </div>

                                                {/* قسم اختيار الكلمات الدلالية النشطة المتوفرة بالنظام */}
                                                <div className="pt-2 border-t border-slate-100/50">
                                                    <button
                                                        type="button"
                                                        onClick={() => setExpandedSelectors(prev => ({ ...prev, [cat.id]: !prev[cat.id] }))}
                                                        className="w-full flex items-center justify-between text-[10px] font-bold text-slate-500 hover:text-black transition-colors py-1 shrink-0"
                                                    >
                                                        <span className="flex items-center gap-1.5">
                                                            <Tag size={11} className="text-zinc-400" />
                                                            <span>ربط من الكلمات النشطة بالنظام ({unassignedKeywords.length})</span>
                                                        </span>
                                                        {expandedSelectors[cat.id] ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                                                    </button>

                                                    {expandedSelectors[cat.id] && (
                                                        <div className="mt-2 space-y-2 bg-slate-50/50 p-2.5 rounded-2xl border border-slate-100 transition-all">
                                                            {/* فلتر البحث المصغر للمقترحات */}
                                                            {unassignedKeywords.length > 5 && (
                                                                <div className="relative flex items-center">
                                                                    <Search className="absolute right-2 text-slate-400" size={10} />
                                                                    <input
                                                                        type="text"
                                                                        value={keywordSearchQueries[cat.id] || ''}
                                                                        onChange={(e) => setKeywordSearchQueries(prev => ({ ...prev, [cat.id]: e.target.value }))}
                                                                        placeholder="ابحث في الكلمات النشطة..."
                                                                        className="w-full bg-white border border-slate-200/80 rounded-lg pr-6 pl-2 py-1 text-[9px] font-bold outline-none focus:border-black placeholder:text-slate-400"
                                                                    />
                                                                </div>
                                                            )}

                                                            <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pr-1">
                                                                {(() => {
                                                                    const query = (keywordSearchQueries[cat.id] || '').trim().toLowerCase();
                                                                    const filtered = unassignedKeywords.filter(k => 
                                                                        k.text.toLowerCase().includes(query)
                                                                    );

                                                                    if (filtered.length === 0) {
                                                                        return (
                                                                            <div className="text-[9px] text-slate-400 italic py-2 text-center w-full">
                                                                                {unassignedKeywords.length === 0 ? 'لا توجد كلمات نشطة غير مصنفة حالياً' : 'لا توجد نتائج مطابقة لبحثك'}
                                                                            </div>
                                                                        );
                                                                    }

                                                                    return filtered.map((k) => (
                                                                        <button
                                                                            key={k.text}
                                                                            type="button"
                                                                            onClick={async () => {
                                                                                const updatedKeywords = [...(cat.keywords || []), k.text];
                                                                                
                                                                                if (usingFallback) {
                                                                                    const updated = categories.map(c => 
                                                                                        c.id === cat.id ? { ...c, keywords: updatedKeywords } : c
                                                                                    );
                                                                                    localStorage.setItem('custom_categories', JSON.stringify(updated));
                                                                                    setCategories(updated);
                                                                                    showMessage('تم ربط الكلمة الدلالية محلياً', 'success');
                                                                                } else {
                                                                                    try {
                                                                                        const res = await fetch(`/api/categories/${cat.id}`, {
                                                                                            method: 'PUT',
                                                                                            headers: { 'Content-Type': 'application/json' },
                                                                                            body: JSON.stringify({ keywords: updatedKeywords })
                                                                                        });
                                                                                        const data = await res.json();
                                                                                        if (data.success) {
                                                                                            showMessage('تم ربط الكلمة الدلالية بنجاح', 'success');
                                                                                            fetchCategories();
                                                                                        } else {
                                                                                            showMessage(data.error || 'خطأ أثناء الربط', 'error');
                                                                                        }
                                                                                    } catch (e) {
                                                                                        showMessage('تعذر الاتصال بالخادم لربط الكلمة', 'error');
                                                                                    }
                                                                                }
                                                                            }}
                                                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-black text-[9px] font-bold text-slate-600 hover:text-black transition-all cursor-pointer text-right"
                                                                            title={`ربط الكلمة "${k.text}" بالتصنيف`}
                                                                        >
                                                                            <span>{k.text}</span>
                                                                            {k.count > 0 && (
                                                                                <span className="bg-slate-100 text-slate-500 rounded px-1 text-[8px] font-black shrink-0">
                                                                                    {k.count}
                                                                                </span>
                                                                            )}
                                                                        </button>
                                                                    ));
                                                                })()}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action buttons footer */}
                                        {!isEditing && (
                                            <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-50">
                                                <button
                                                    onClick={() => {
                                                        setEditingId(cat.id);
                                                        setEditingName(cat.name);
                                                    }}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-black hover:bg-slate-50 text-[10px] font-bold flex items-center gap-1 transition-all"
                                                    title="تعديل اسم التصنيف"
                                                >
                                                    <Edit3 size={11} />
                                                    <span>تعديل</span>
                                                </button>
                                                
                                                <button
                                                    onClick={() => handleDeleteCategory(cat.id, cat.name, cat.leads_count || 0)}
                                                    className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 text-[10px] font-bold flex items-center gap-1 transition-all"
                                                    title="حذف التصنيف"
                                                >
                                                    <Trash2 size={11} />
                                                    <span>حذف</span>
                                                </button>
                                            </div>
                                        )}

                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

            </div>

        </div>
    );
}
