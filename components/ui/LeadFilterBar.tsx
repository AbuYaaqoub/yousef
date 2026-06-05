'use client';

import { useState } from 'react';
import { Filter, Search, X, Check } from 'lucide-react';
import { ActionButton } from '../ui/ActionButton';

export interface LeadFilter {
    rating: string[];
    hasEmail: boolean;
    hasPhone: boolean;
    hasSocial: boolean;
    search: string;
}

interface LeadFilterBarProps {
    onFilterChange: (filters: LeadFilter) => void;
    totalLeads: number;
}


export function LeadFilterBar({ onFilterChange, totalLeads }: LeadFilterBarProps) {
    const [filters, setFilters] = useState<LeadFilter>({
        rating: [],
        hasEmail: false,
        hasPhone: false,
        hasSocial: false,
        search: '',
    });
    const [isOpen, setIsOpen] = useState(false);

    const updateFilter = (updates: Partial<LeadFilter>) => {
        const newFilters = { ...filters, ...updates };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    const toggleRating = (rating: string) => {
        const newRatings = filters.rating.includes(rating)
            ? filters.rating.filter(r => r !== rating)
            : [...filters.rating, rating];
        updateFilter({ rating: newRatings });
    };

    const clearFilters = () => {
        const empty = { rating: [], hasEmail: false, hasPhone: false, hasSocial: false, search: '' };
        setFilters(empty);
        onFilterChange(empty);
    };

    const activeFilterCount = filters.rating.length +
        (filters.hasEmail ? 1 : 0) +
        (filters.hasPhone ? 1 : 0) +
        (filters.hasSocial ? 1 : 0) +
        (filters.search ? 1 : 0);

    return (
        <div className="bg-white rounded-[24px] border border-slate-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900/5 flex items-center justify-center text-slate-900">
                        <Filter size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">تصفية النتائج</h3>
                        <p className="text-slate-500 text-xs font-medium">
                            {activeFilterCount > 0
                                ? `${activeFilterCount} فلاتر نشطة`
                                : `${totalLeads} نتيجة متاحة`}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {activeFilterCount > 0 && (
                        <ActionButton
                            onClick={clearFilters}
                            variant="ghost"
                            icon={<X size={16} />}
                            label="مسح الكل"
                            size="sm"
                        />
                    )}
                    <ActionButton
                        onClick={() => setIsOpen(!isOpen)}
                        variant="secondary"
                        label={isOpen ? 'إخفاء الفلاتر' : 'إظهار الفلاتر'}
                        size="sm"
                    />
                </div>
            </div>

            {isOpen && (
                <div className="space-y-6 pt-4 border-t border-slate-100">
                    {/* Search */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            البحث بالاسم
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={filters.search}
                                                  placeholder="ابحث عن متجر..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-5 pr-12 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
                            />
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        </div>
                    </div>

                    {/* Rating Filter */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-3">
                            التقييم
                        </label>
                        <div className="flex gap-2">
                            {[
                                { value: '🟢 قوي', label: 'قوي', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
                                { value: '🟡 متوسط', label: 'متوسط', color: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
                                { value: '🔴 ضعيف', label: 'ضعيف', color: 'bg-rose-50 text-rose-600 border-rose-200' },
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => toggleRating(option.value)}
                                    className={`px-4 py-2.5 rounded-xl border font-bold text-sm transition-all ${
                                        filters.rating.includes(option.value)
                                            ? `${option.color} ring-2 ring-offset-1 ring-slate-900`
                                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Contact Filters */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-3">
                            بيانات الاتصال
                        </label>
                        <div className="flex gap-4">
                            {[
                                { key: 'hasEmail', label: 'به إيميل' },
                                { key: 'hasPhone', label: 'به هاتف' },
                                { key: 'hasSocial', label: 'به سوشيال' },
                            ].map((option) => (
                                <label
                                    key={option.key}
                                    className="flex items-center gap-2 cursor-pointer group"
                                >
                                    <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                                        filters[option.key as keyof LeadFilter]
                                            ? 'bg-black border-black'
                                            : 'bg-white border-slate-300 group-hover:border-slate-400'
                                    }`}>
                                        {filters[option.key as keyof LeadFilter] && (
                                            <Check size={14} className="text-white" />
                                        )}
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={filters[option.key as keyof LeadFilter] as boolean}
                                        onChange={(e) => updateFilter({ [option.key]: e.target.checked })}
                                        className="hidden"
                                    />
                                    <span className="text-sm font-medium text-slate-700">{option.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
