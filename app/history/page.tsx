'use client';

import { History, Clock, Calendar, Trash2, Download } from 'lucide-react';
import { ActionButton } from '@/components/ui/ActionButton';

const mockHistory = [
    {
        id: 1,
        date: '2026-04-28',
        type: 'Google Search',
        query: 'متاجر سلة - ملابس',
        resultsCount: 234,
        status: 'completed',
    },
    {
        id: 2,
        date: '2026-04-27',
        type: 'Mahally',
        query: 'بخور',
        resultsCount: 89,
        status: 'completed',
    },
    {
        id: 3,
        date: '2026-04-26',
        type: 'Google Enrich',
        query: 'تطوير بيانات',
        resultsCount: 156,
        status: 'completed',
    },
];

export default function HistoryPage() {
    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">سجل العمليات</h1>
                <p className="text-slate-500 text-sm font-medium">تابع عمليات الاستخراج السابقة</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-white p-5 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900">
                            <Calendar size={18} />
                        </div>
                        <span className="text-sm font-bold text-slate-500">هذا الأسبوع</span>
                    </div>
                    <div className="text-2xl font-black text-slate-900">12</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                            <Clock size={18} />
                        </div>
                        <span className="text-sm font-bold text-slate-500">متوسط الوقت</span>
                    </div>
                    <div className="text-2xl font-black text-slate-900">4.2</div>
                    <div className="text-xs text-slate-400 font-medium">دقيقة</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <History size={18} />
                        </div>
                        <span className="text-sm font-bold text-slate-500">الإجمالي</span>
                    </div>
                    <div className="text-2xl font-black text-slate-900">47</div>
                </div>
            </div>

            {/* History List */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">العمليات الأخيرة</h3>
                    <ActionButton variant="ghost" label="مسح السجل" size="sm" icon={<Trash2 size={16} />} />
                </div>
                <div className="divide-y divide-slate-100">
                    {mockHistory.map((item) => (
                        <div key={item.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                    item.type === 'Google Search' ? 'bg-blue-50 text-blue-600' :
                                    item.type === 'Mahally' ? 'bg-orange-50 text-orange-600' :
                                    'bg-emerald-50 text-emerald-600'
                                }`}>
                                    <History size={20} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-slate-900">{item.type}</span>
                                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full">
                                            مكتمل
                                        </span>
                                    </div>
                                    <div className="text-sm text-slate-500">{item.query}</div>
                                    <div className="text-xs text-slate-400 mt-1">{item.date}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-left">
                                    <div className="text-2xl font-black text-slate-900">{item.resultsCount}</div>
                                    <div className="text-xs text-slate-400 font-medium">نتيجة</div>
                                </div>
                                <ActionButton variant="ghost" label="تصدير" size="sm" icon={<Download size={16} />} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
