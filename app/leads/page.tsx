'use client';

import { useState, useEffect, useCallback } from 'react';
import { Store, Mail, Phone, ExternalLink, Search, Filter, Loader2, Sparkles, AlertCircle } from 'lucide-react';
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

    // Fetch leads function
    const fetchLeads = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.append('search', searchQuery);
            if (hasEmail) params.append('hasEmail', 'true');
            if (hasPhone) params.append('hasPhone', 'true');
            if (isStrong) params.append('isStrong', 'true');
            if (selectedSource) params.append('source', selectedSource);
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
    }, [searchQuery, hasEmail, hasPhone, isStrong, selectedSource]);

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
                                <th className="p-4 text-right">المتجر / المنشأة</th>
                                <th className="p-4 text-right">الموقع الرسمي</th>
                                <th className="p-4 text-right">التصنيف والكلمة المفتاحية</th>
                                <th className="p-4 text-right">معلومات الاتصال</th>
                                <th className="p-4 text-right">سوشيال ميديا</th>
                                <th className="p-4 text-right">قوة الرصاصة</th>
                                <th className="p-4 text-center">المنصة</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 className="animate-spin text-zinc-950" size={32} />
                                            <span className="text-sm font-medium text-slate-500">جاري تحميل البيانات الحية من Supabase...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : leads.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <Store className="text-slate-300" size={40} />
                                            <span className="text-sm font-bold text-slate-600">لا توجد سجلات مطابقة للبحث</span>
                                            <span className="text-xs text-slate-400">ابدأ عملية استخراج جديدة لجمع المزيد من البيانات</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                leads.map((lead) => (
                                    <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
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
                                                'bg-zinc-50 text-zinc-700 border border-zinc-200'
                                            }`}>
                                                {lead.source === 'mahally' ? 'سلة' :
                                                 lead.source === 'mazeed' ? 'زد' :
                                                 lead.source === 'maps' ? 'خرائط' : 'ويب/جوجل'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
