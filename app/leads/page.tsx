'use client';

import { useState } from 'react';
import { Store, Mail, Phone, ExternalLink, Search, Filter, X } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { ActionButton } from '@/components/ui/ActionButton';
import { SocialIcon } from '@/components/ui/SocialIcon';

// Sample data - in real app, this would come from API
const sampleLeads = [
    {
        storeName: 'متجر الأناقة',
        domain: 'https://example.com',
        email: 'info@example.com',
        phone: '+966 50 123 4567',
        whatsapp: 'https://wa.me/966501234567',
        instagram: 'https://instagram.com/example',
        rating: '🟢 قوي',
    },
    {
        storeName: 'متجر النور',
        domain: 'https://example2.com',
        email: 'contact@example2.com',
        phone: '+966 55 987 6543',
        tiktok: 'https://tiktok.com/@example2',
        snapchat: 'https://snapchat.com/add/example2',
        rating: '🟡 متوسط',
    },
];

export default function LeadsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">المتاجر</h1>
                <p className="text-slate-500 text-sm font-medium">تصفح واستخرج بيانات المتاجر المكتشفة</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                    icon={<Store size={18} />}
                    label="إجمالي المتاجر"
                    value="2,847"
                    color="slate"
                    trend="+124 هذا الأسبوع"
                />
                <StatCard
                    icon={<Mail size={18} />}
                    label="به إيميل"
                    value="1,923"
                    color="orange"
                />
                <StatCard
                    icon={<Phone size={18} />}
                    label="به هاتف"
                    value="2,156"
                    color="emerald"
                />
                <StatCard
                    icon={<Search size={18} />}
                    label="بدون سوشيال"
                    value="421"
                    color="rose"
                />
            </div>

            {/* Search and Filter Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="ابحث عن متجر..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-5 pr-11 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all text-sm"
                        />
                        <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    </div>
                    <ActionButton
                        onClick={() => setShowFilters(!showFilters)}
                        variant="secondary"
                        icon={<Filter size={18} />}
                        label="فلاتر"
                        size="sm"
                    />
                    <ActionButton
                        variant="primary"
                        icon={<ExternalLink size={18} />}
                        label="تصدير الكل"
                        size="sm"
                    />
                </div>

                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-black focus:ring-black cursor-pointer" />
                            <span className="text-sm text-slate-600">به إيميل فقط</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-black focus:ring-black cursor-pointer" />
                            <span className="text-sm text-slate-600">به هاتف فقط</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-black focus:ring-black cursor-pointer" />
                            <span className="text-sm text-slate-600">قوي فقط</span>
                        </label>
                    </div>
                )}
            </div>

            {/* Results Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                        <thead className="bg-slate-50">
                            <tr className="text-slate-500 text-xs uppercase tracking-wider">
                                <th className="p-4 text-right font-bold">المتجر</th>
                                <th className="p-4 text-right font-bold">النطاق</th>
                                <th className="p-4 text-right font-bold">اتصال</th>
                                <th className="p-4 text-right font-bold">سوشيال</th>
                                <th className="p-4 text-right font-bold">تقييم</th>
                                <th className="p-4 text-right font-bold">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {sampleLeads.map((lead, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-black border border-zinc-200 font-bold">
                                                {lead.storeName[0]}
                                            </div>
                                            <span className="font-bold text-slate-900">{lead.storeName}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <a href={lead.domain} target="_blank" className="text-black hover:text-zinc-800 underline font-bold text-sm">
                                            {lead.domain.replace('https://', '')}
                                        </a>
                                    </td>
                                    <td className="p-4">
                                        <div className="space-y-1">
                                            {lead.email && (
                                                <div className="text-xs text-slate-600 flex items-center gap-1">
                                                    <Mail size={12} className="text-slate-400" />
                                                    {lead.email}
                                                </div>
                                            )}
                                            {lead.phone && (
                                                <div className="text-xs text-slate-600 flex items-center gap-1" dir="ltr">
                                                    <Phone size={12} className="text-slate-400" />
                                                    {lead.phone}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex gap-1.5">
                                            {lead.whatsapp && <SocialIcon href={lead.whatsapp} color="emerald" label="WA" />}
                                            {lead.instagram && <SocialIcon href={lead.instagram} color="pink" label="IG" />}
                                            {lead.tiktok && <SocialIcon href={lead.tiktok} color="slate" label="TT" />}
                                            {lead.snapchat && <SocialIcon href={lead.snapchat} color="yellow" label="SC" />}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                            lead.rating.includes('قوي') ? 'bg-emerald-50 text-emerald-600' :
                                            lead.rating.includes('متوسط') ? 'bg-yellow-50 text-yellow-600' :
                                            'bg-rose-50 text-rose-600'
                                        }`}>
                                            {lead.rating.replace(/^[🟢🟡🔴] /, '')}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <ActionButton variant="ghost" label="عرض" size="sm" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
