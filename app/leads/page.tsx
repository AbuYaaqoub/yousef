'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Store, Mail, Phone, ExternalLink, Search, Filter, Loader2, Sparkles, AlertCircle, Layers, Trash2, FolderInput, FolderX, ChevronDown, X } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { ActionButton } from '@/components/ui/ActionButton';
import { SocialIcon } from '@/components/ui/SocialIcon';

interface Lead {
    id: string;
    store_name: string;
    store_url: string;
    sub_text?: string;
    source: string;
    category: string;
    website?: string;
    email?: string;
    phone?: string;
    whatsapp?: string;
    instagram?: string;
    tiktok?: string;
    snapchat?: string;
    twitter?: string;
    rating: string;
}

export default function LeadsPage() {
    // Search and filters state
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [hasEmail, setHasEmail] = useState(false);
    const [hasPhone, setHasPhone] = useState(false);
    const [isStrong, setIsStrong] = useState(false);
    const [selectedSource, setSelectedSource] = useState<string>(''); // empty means all
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('');

    // Data state
    const [leads, setLeads] = useState<Lead[]>([]);
    const [stats, setStats] = useState({
        totalLeads: 0,
        hasEmailCount: 0,
        hasPhoneCount: 0,
        noSocialCount: 0
    });
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [showBulkMoveDropdown, setShowBulkMoveDropdown] = useState(false);
    const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
    const [deleteConfirmIds, setDeleteConfirmIds] = useState<string[] | null>(null);

    // Fetch categories on mount
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch('/api/leads/categories');
                const data = await res.json();
                if (data.success) {
                    setCategories(data.categories);
                }
            } catch (err) {
                console.error('Failed to fetch categories:', err);
            }
        };
        fetchCategories();
    }, []);

    // Fetch leads function
    const fetchLeads = useCallback(async () => {
        setLoading(true);
        setError(null);
        setSelectedIds([]);
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.append('search', searchQuery);
            if (hasEmail) params.append('hasEmail', 'true');
            if (hasPhone) params.append('hasPhone', 'true');
            if (isStrong) params.append('isStrong', 'true');
            if (selectedSource) params.append('source', selectedSource);
            if (selectedCategory) params.append('category', selectedCategory);
            params.append('limit', '100');

            const res = await fetch(`/api/leads?${params.toString()}`);
            const data = await res.json();

            if (data.success) {
                setLeads(data.leads);
                setStats(data.stats);
            } else {
                setError(data.error || 'حدث خطأ أثناء تحميل البيانات');
            }
        } catch (err: any) {
            console.error('Fetch Leads Error:', err);
            setError('تعذر الاتصال بالخادم. يرجى التحقق من الاتصال.');
        } finally {
            setLoading(false);
        }
    }, [searchQuery, hasEmail, hasPhone, isStrong, selectedSource, selectedCategory]);

    // Fetch on filter change
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchLeads();
        }, 300); // debounce search query slightly

        return () => clearTimeout(delayDebounceFn);
    }, [fetchLeads]);

    // Handle export
    const handleExport = async () => {
        setExporting(true);
        try {
            const params = new URLSearchParams();
            if (selectedSource) params.append('source', selectedSource);

            window.open(`/api/export?${params.toString()}`, '_blank');
        } catch (err) {
            console.error('Export Error:', err);
        } finally {
            setExporting(false);
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(leads.map(l => l.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectLead = (leadId: string, checked: boolean) => {
        if (checked) {
            setSelectedIds(prev => [...prev, leadId]);
        } else {
            setSelectedIds(prev => prev.filter(id => id !== leadId));
        }
    };

    const handleDeleteLeads = async (idsToDelete: string[]) => {
        try {
            setError(null);
            const res = await fetch('/api/leads', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ids: idsToDelete }),
            });
            const data = await res.json();
            if (data.success) {
                setLeads(prevLeads => prevLeads.filter(lead => !idsToDelete.includes(lead.id)));
                setSelectedIds(prevSelected => prevSelected.filter(id => !idsToDelete.includes(id)));
                fetchLeads();
            } else {
                setError(data.error || 'حدث خطأ أثناء حذف المتاجر');
            }
        } catch (err) {
            console.error('Delete Leads Error:', err);
            setError('فشل في الاتصال بالخادم لحذف البيانات');
        }
    };

    const handleMoveLeads = async (idsToMove: string[], targetCategory: string) => {
        try {
            setError(null);
            const res = await fetch('/api/leads', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ids: idsToMove, category: targetCategory }),
            });
            const data = await res.json();
            if (data.success) {
                setLeads(prevLeads =>
                    prevLeads.map(lead =>
                        idsToMove.includes(lead.id)
                            ? { ...lead, category: targetCategory }
                            : lead
                    )
                );
                setSelectedIds(prevSelected => prevSelected.filter(id => !idsToMove.includes(id)));
                fetchLeads();
            } else {
                setError(data.error || 'حدث خطأ أثناء نقل المتاجر');
            }
        } catch (err) {
            console.error('Move Leads Error:', err);
            setError('فشل في الاتصال بالخادم لنقل البيانات');
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-2">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                        المتاجر والمنشآت المستخرجة <Sparkles className="text-amber-500 w-6 h-6 animate-pulse" />
                    </h1>
                    <p className="text-slate-500 text-sm font-medium">تصفح وفلتر واستخرج بيانات المتاجر المكتشفة حياً من قاعدة البيانات السحابية</p>
                </div>
                <div className="shrink-0">
                    <Link
                        href="/categories"
                        className="inline-flex items-center gap-2 py-3 px-5 rounded-2xl bg-black hover:bg-zinc-800 text-white font-bold text-xs transition-all shadow-sm cursor-pointer"
                    >
                        <Layers size={14} />
                        <span>إدارة التصنيفات المخصصة</span>
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                    icon={<Store size={18} />}
                    label="إجمالي المتاجر"
                    value={stats.totalLeads.toLocaleString('ar-EG')}
                    color="slate"
                    trend="مخزنة سحابياً"
                />
                <StatCard
                    icon={<Mail size={18} />}
                    label="به بريد إلكتروني"
                    value={stats.hasEmailCount.toLocaleString('ar-EG')}
                    color="orange"
                />
                <StatCard
                    icon={<Phone size={18} />}
                    label="به رقم هاتف"
                    value={stats.hasPhoneCount.toLocaleString('ar-EG')}
                    color="emerald"
                />
                <StatCard
                    icon={<Search size={18} />}
                    label="بدون قنوات تواصل"
                    value={stats.noSocialCount.toLocaleString('ar-EG')}
                    color="rose"
                />
            </div>

            {/* Search, Filter & Actions Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 shadow-sm">
                <div className="flex flex-col md:flex-row items-center gap-3">
                    <div className="w-full md:flex-1 relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="ابحث بالاسم، الموقع، البريد، أو الهاتف..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-5 pr-11 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all text-sm"
                        />
                        <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <select
                            value={selectedSource}
                            onChange={(e) => setSelectedSource(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                        >
                            <option value="">كل المنصات</option>
                            <option value="mahally">سلة (محلي)</option>
                            <option value="mazeed">زد (مزيد)</option>
                            <option value="maps">خرائط جوجل</option>
                            <option value="google_scrape">بحث جوجل والويب</option>
                            <option value="semrush_plugin">ملحق SEMrush</option>
                            <option value="ahrefs_plugin">ملحق Ahrefs</option>
                        </select>

                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-black max-w-[180px]"
                        >
                            <option value="">كل التصنيفات</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>

                        <ActionButton
                            onClick={() => setShowFilters(!showFilters)}
                            variant={showFilters ? 'primary' : 'secondary'}
                            icon={<Filter size={18} />}
                            label="تصفية متقدمة"
                            size="sm"
                        />

                        <ActionButton
                            onClick={handleExport}
                            variant="primary"
                            icon={exporting ? <Loader2 className="animate-spin" size={18} /> : <ExternalLink size={18} />}
                            label={exporting ? "جاري التصدير..." : "تصدير Excel"}
                            size="sm"
                            disabled={exporting}
                        />
                    </div>
                </div>

                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-6 animate-fadeIn">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={hasEmail}
                                onChange={(e) => setHasEmail(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300 text-black focus:ring-black cursor-pointer"
                            />
                            <span className="text-sm font-medium text-slate-600">به بريد إلكتروني فقط</span>
                        </label>
                        
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={hasPhone}
                                onChange={(e) => setHasPhone(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300 text-black focus:ring-black cursor-pointer"
                            />
                            <span className="text-sm font-medium text-slate-600">به رقم هاتف فقط</span>
                        </label>
                        
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={isStrong}
                                onChange={(e) => setIsStrong(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300 text-black focus:ring-black cursor-pointer"
                            />
                            <span className="text-sm font-medium text-slate-600">تقييم قوي فقط (🟢)</span>
                        </label>
                    </div>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-4 mb-6 flex items-center gap-3">
                    <AlertCircle size={20} />
                    <span className="text-sm font-medium">{error}</span>
                </div>
            )}

            {/* Leads Table Card */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px] text-right">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                                <th className="p-4 w-12 text-center">
                                    <input
                                        type="checkbox"
                                        checked={leads.length > 0 && selectedIds.length === leads.length}
                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                        className="w-4 h-4 rounded border-slate-300 text-black focus:ring-black cursor-pointer"
                                    />
                                </th>
                                <th className="p-4 text-right">المتجر / المنشأة</th>
                                <th className="p-4 text-right">الموقع الرسمي</th>
                                <th className="p-4 text-right">التصنيف والكلمة المفتاحية</th>
                                <th className="p-4 text-right">معلومات الاتصال</th>
                                <th className="p-4 text-right">سوشيال ميديا</th>
                                <th className="p-4 text-right">قوة الرصاصة</th>
                                <th className="p-4 text-center">المنصة</th>
                                <th className="p-4 text-center w-28">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={9} className="p-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 className="animate-spin text-zinc-950" size={32} />
                                            <span className="text-sm font-medium text-slate-500">جاري تحميل البيانات الحية من Supabase...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : leads.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="p-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <Store className="text-slate-300" size={40} />
                                            <span className="text-sm font-bold text-slate-600">لا توجد سجلات مطابقة للبحث</span>
                                            <span className="text-xs text-slate-400">ابدأ عملية استخراج جديدة لجمع المزيد من البيانات</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                leads.map((lead) => (
                                    <tr 
                                        key={lead.id} 
                                        className={`hover:bg-slate-50 transition-colors ${selectedIds.includes(lead.id) ? 'bg-indigo-50/40 hover:bg-indigo-50/60' : ''}`}
                                    >
                                        <td className="p-4 text-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(lead.id)}
                                                onChange={(e) => handleSelectLead(lead.id, e.target.checked)}
                                                className="w-4 h-4 rounded border-slate-300 text-black focus:ring-black cursor-pointer"
                                            />
                                        </td>
                                        {/* Store Name */}
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-black border border-slate-200 font-bold text-base">
                                                    {lead.store_name?.[0] || '🏢'}
                                                </div>
                                                <div>
                                                    <span className="font-bold text-slate-900 block text-sm">{lead.store_name}</span>
                                                    {lead.sub_text && (
                                                        <span className="text-xs text-slate-400 block max-w-xs truncate" dir="rtl">
                                                            {lead.sub_text}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Website URL */}
                                        <td className="p-4">
                                            {lead.website || lead.store_url ? (
                                                <a 
                                                    href={lead.website || lead.store_url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-zinc-900 hover:text-black font-semibold text-sm underline decoration-slate-300 hover:decoration-black"
                                                >
                                                    {(lead.website || lead.store_url).replace(/^https?:\/\/(www\.)?/, '').substring(0, 25)}
                                                    <ExternalLink size={12} className="text-slate-400" />
                                                </a>
                                            ) : (
                                                <span className="text-xs text-slate-400">غير متوفر</span>
                                            )}
                                        </td>

                                        {/* Category */}
                                        <td className="p-4">
                                            <span className="inline-block bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-lg font-bold border border-slate-200">
                                                {lead.category || 'عام'}
                                            </span>
                                        </td>

                                        {/* Contact Info */}
                                        <td className="p-4">
                                            <div className="space-y-1">
                                                {lead.email ? (
                                                    <div className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                                                        <Mail size={12} className="text-slate-400" />
                                                        {lead.email}
                                                    </div>
                                                ) : null}
                                                {lead.phone ? (
                                                    <div className="text-xs text-slate-600 flex items-center gap-1.5 font-medium" dir="ltr">
                                                        <Phone size={12} className="text-slate-400" />
                                                        {lead.phone}
                                                    </div>
                                                ) : null}
                                                {!lead.email && !lead.phone && (
                                                    <span className="text-xs text-slate-400">لا يوجد اتصال</span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Social Icons */}
                                        <td className="p-4">
                                            <div className="flex gap-1.5">
                                                {lead.whatsapp && <SocialIcon href={lead.whatsapp.startsWith('http') ? lead.whatsapp : `https://wa.me/${lead.whatsapp.replace(/[^\d]/g, '')}`} color="emerald" label="WA" />}
                                                {lead.instagram && <SocialIcon href={lead.instagram} color="pink" label="IG" />}
                                                {lead.tiktok && <SocialIcon href={lead.tiktok} color="slate" label="TT" />}
                                                {lead.snapchat && <SocialIcon href={lead.snapchat} color="yellow" label="SC" />}
                                                {lead.twitter && <SocialIcon href={lead.twitter} color="blue" label="TW" />}
                                            </div>
                                        </td>

                                        {/* Score / Rating */}
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                                                lead.rating?.includes('قوي') ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                lead.rating?.includes('متوسط') ? 'bg-yellow-50 text-yellow-600 border border-yellow-100' :
                                                'bg-rose-50 text-rose-600 border border-rose-100'
                                            }`}>
                                                {lead.rating ? lead.rating.replace(/^[🟢🟡🔴] /, '') : 'متوسط'}
                                            </span>
                                        </td>

                                        {/* Source Platform Badge */}
                                        <td className="p-4 text-center">
                                            <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-extrabold ${
                                                lead.source === 'mahally' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                                                lead.source === 'mazeed' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                                                lead.source === 'maps' ? 'bg-cyan-50 text-cyan-700 border border-cyan-100' :
                                                lead.source === 'semrush_plugin' ? 'bg-orange-50 text-orange-700 border border-orange-100' :
                                                lead.source === 'ahrefs_plugin' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                                'bg-zinc-50 text-zinc-700 border border-zinc-200'
                                            }`}>
                                                {lead.source === 'mahally' ? 'سلة' :
                                                 lead.source === 'mazeed' ? 'زد' :
                                                 lead.source === 'maps' ? 'خرائط' :
                                                 lead.source === 'semrush_plugin' ? 'SEMrush' :
                                                 lead.source === 'ahrefs_plugin' ? 'Ahrefs' : 'ويب/جوجل'}
                                            </span>
                                        </td>
                                        
                                        {/* Actions Column */}
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                {/* Move Button Dropdown */}
                                                <div className="relative inline-block text-right">
                                                    <button
                                                        onClick={() => setActiveDropdownId(activeDropdownId === lead.id ? null : lead.id)}
                                                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                                        title="نقل إلى تصنيف آخر"
                                                    >
                                                        <FolderInput size={15} />
                                                    </button>
                                                    {activeDropdownId === lead.id && (
                                                        <>
                                                            <div className="fixed inset-0 z-10" onClick={() => setActiveDropdownId(null)} />
                                                            <div className="absolute left-0 mt-2 w-48 rounded-xl bg-white border border-slate-200 shadow-xl z-20 py-1 text-right">
                                                                <div className="px-3 py-1.5 text-xs font-bold text-slate-400 border-b border-slate-100">
                                                                    نقل إلى تصنيف:
                                                                </div>
                                                                {categories.map((cat) => (
                                                                    <button
                                                                        key={cat}
                                                                        onClick={() => {
                                                                            handleMoveLeads([lead.id], cat);
                                                                            setActiveDropdownId(null);
                                                                        }}
                                                                        className="w-full text-right px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-black transition-colors block cursor-pointer"
                                                                    >
                                                                        {cat}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>

                                                {/* Remove from Category Button */}
                                                {lead.category && lead.category !== 'عام' && (
                                                    <button
                                                        onClick={() => handleMoveLeads([lead.id], 'عام')}
                                                        className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                                        title="إزالة من التصنيف"
                                                    >
                                                        <FolderX size={15} />
                                                    </button>
                                                )}

                                                {/* Delete Button */}
                                                <button
                                                    onClick={() => setDeleteConfirmIds([lead.id])}
                                                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                                    title="حذف"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Bulk Actions Floating Bar */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-950 text-white rounded-2xl border border-slate-800 shadow-2xl py-3 px-5 flex items-center gap-4 animate-slideUp max-w-[90vw] md:max-w-2xl">
                    <div className="flex items-center gap-2 pr-2 border-l border-slate-800 ml-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold">
                            {selectedIds.length}
                        </span>
                        <span className="text-xs font-semibold text-slate-300 whitespace-nowrap">
                            متاجر محددة
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {/* Move Button Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowBulkMoveDropdown(!showBulkMoveDropdown)}
                                className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
                            >
                                <FolderInput size={14} />
                                <span>نقل إلى...</span>
                                <ChevronDown size={12} className={`transition-transform ${showBulkMoveDropdown ? 'rotate-180' : ''}`} />
                            </button>
                            
                            {showBulkMoveDropdown && (
                                <>
                                    <div className="fixed inset-0 z-30" onClick={() => setShowBulkMoveDropdown(false)} />
                                    <div className="absolute bottom-full mb-2 right-0 w-48 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl z-40 py-1 text-right">
                                        <div className="px-3 py-1.5 text-xs font-bold text-slate-500 border-b border-slate-800">
                                            نقل المحدد إلى تصنيف:
                                        </div>
                                        {categories.map((cat) => (
                                            <button
                                                key={cat}
                                                onClick={() => {
                                                    handleMoveLeads(selectedIds, cat);
                                                    setShowBulkMoveDropdown(false);
                                                }}
                                                className="w-full text-right px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors block cursor-pointer"
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Bulk Remove from Category Button */}
                        <button
                            onClick={() => handleMoveLeads(selectedIds, 'عام')}
                            className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
                        >
                            <FolderX size={14} />
                            <span>إزالة من التصنيف</span>
                        </button>

                        {/* Delete Button */}
                        <button
                            onClick={() => setDeleteConfirmIds(selectedIds)}
                            className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-sm"
                        >
                            <Trash2 size={14} />
                            <span>حذف المحدد</span>
                        </button>
                    </div>

                    {/* Clear Selection Button */}
                    <button
                        onClick={() => setSelectedIds([])}
                        className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                        title="إلغاء التحديد"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Confirm Delete Modal */}
            {deleteConfirmIds && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-scaleIn">
                        <h3 className="text-lg font-bold text-slate-900 mb-2 text-right">تأكيد الحذف</h3>
                        <p className="text-slate-500 text-sm mb-6 text-right">
                            هل أنت متأكد من رغبتك في حذف {deleteConfirmIds.length === 1 ? 'هذا المتجر' : `${deleteConfirmIds.length} متاجر`}؟ لا يمكن التراجع عن هذا الإجراء.
                        </p>
                        <div className="flex items-center gap-3 justify-end">
                            <button
                                onClick={() => setDeleteConfirmIds(null)}
                                className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={async () => {
                                    await handleDeleteLeads(deleteConfirmIds);
                                    setDeleteConfirmIds(null);
                                }}
                                className="px-4 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm cursor-pointer"
                            >
                                نعم، حذف
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
