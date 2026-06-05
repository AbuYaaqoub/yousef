'use client';

import { useState, useEffect, useCallback } from 'react';
import { History, Clock, Calendar, Trash2, Download, Loader2, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ActionButton } from '@/components/ui/ActionButton';

interface HistoryItem {
    id: string;
    created_at: string;
    type: string;
    query: string;
    results_count: number;
    status: string;
    error_message?: string;
}

export default function HistoryPage() {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [stats, setStats] = useState({
        thisWeekCount: 0,
        averageResults: 0,
        totalCount: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [clearing, setClearing] = useState(false);

    // Fetch history
    const fetchHistory = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/history');
            const data = await res.json();
            if (data.success) {
                setHistory(data.history);
                setStats(data.stats);
            } else {
                setError(data.error || 'حدث خطأ أثناء تحميل السجل');
            }
        } catch (err) {
            console.error('Fetch History Error:', err);
            setError('تعذر الاتصال بالخادم. يرجى التحقق من اتصالك.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    // Clear history
    const handleClearHistory = async () => {
        if (!confirm('هل أنت متأكد من مسح جميع سجلات العمليات السابقة؟ (العمليات النشطة لن تُحذف)')) return;
        setClearing(true);
        try {
            const res = await fetch('/api/history', { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                fetchHistory();
            } else {
                alert(data.error || 'فشل مسح السجل');
            }
        } catch (err) {
            console.error('Clear History Error:', err);
            alert('تعذر الاتصال بالخادم لمسح السجل');
        } finally {
            setClearing(false);
        }
    };

    // Format Date helper
    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleString('ar-EG', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return dateStr;
        }
    };

    // Map operation type to query source for Excel export
    const mapTypeToSource = (type: string) => {
        const t = type.toLowerCase();
        if (t.includes('mahally') || t.includes('محلي')) return 'mahally';
        if (t.includes('mazeed') || t.includes('مزيد')) return 'mazeed';
        if (t.includes('maps') || t.includes('خرائط')) return 'maps';
        return 'google_scrape';
    };

    const handleExportItem = (item: HistoryItem) => {
        const source = mapTypeToSource(item.type);
        const category = encodeURIComponent(item.query);
        window.open(`/api/export?source=${source}&category=${category}`, '_blank');
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-2">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                        سجل العمليات <History className="text-slate-700 w-7 h-7" />
                    </h1>
                    <p className="text-slate-500 text-sm font-medium">تابِع واستعرض واصنع تقارير لعمليات الاستخراج والاستخلاص السابقة</p>
                </div>
                <button
                    onClick={fetchHistory}
                    disabled={loading}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-sm disabled:opacity-50"
                >
                    <RefreshCw className={`w-4.5 h-4.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Stats Dashboard Grid */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900">
                            <Calendar size={18} />
                        </div>
                        <span className="text-sm font-bold text-slate-500">عمليات الأسبوع</span>
                    </div>
                    <div className="text-3xl font-black text-slate-900">{stats.thisWeekCount.toLocaleString('ar-EG')}</div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-black border border-zinc-200">
                            <Clock size={18} />
                        </div>
                        <span className="text-sm font-bold text-slate-500">متوسط الإفراز</span>
                    </div>
                    <div>
                        <span className="text-3xl font-black text-slate-900">{stats.averageResults.toLocaleString('ar-EG')}</span>
                        <span className="text-xs text-slate-400 font-bold mr-1">نتيجة/عملية</span>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-black border border-zinc-200">
                            <History size={18} />
                        </div>
                        <span className="text-sm font-bold text-slate-500">العمليات الكلية</span>
                    </div>
                    <div className="text-3xl font-black text-slate-900">{stats.totalCount.toLocaleString('ar-EG')}</div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-4 mb-6 flex items-center gap-3">
                    <AlertCircle size={20} />
                    <span className="text-sm font-medium">{error}</span>
                </div>
            )}

            {/* History List Card */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">سجل العمليات الأخيرة</h3>
                    {history.length > 0 && (
                        <ActionButton 
                            onClick={handleClearHistory}
                            variant="ghost" 
                            label={clearing ? "جاري المسح..." : "مسح السجل"} 
                            size="sm" 
                            icon={<Trash2 size={16} />} 
                            disabled={clearing}
                        />
                    )}
                </div>
                
                <div className="divide-y divide-slate-100">
                    {loading ? (
                        <div className="p-12 text-center text-slate-400">
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 className="animate-spin text-zinc-950" size={32} />
                                <span className="text-sm font-medium text-slate-500">جاري جلب عمليات الكشط التاريخية...</span>
                            </div>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">
                            <div className="flex flex-col items-center gap-2">
                                <History className="text-slate-300" size={40} />
                                <span className="text-sm font-bold text-slate-600">سجل العمليات فارغ تماماً</span>
                                <span className="text-xs text-slate-400">أي عمليات استخراج أو كشط ستقوم بها ستظهر هنا تلقائياً</span>
                            </div>
                        </div>
                    ) : (
                        history.map((item) => (
                            <div key={item.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-100 text-black border border-slate-200 flex-shrink-0 mt-0.5">
                                        <History size={20} className="text-slate-700" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <span className="font-bold text-slate-950 text-base">{item.type}</span>
                                            
                                            {/* Status Badge */}
                                            {item.status === 'completed' && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full border border-emerald-100">
                                                    <CheckCircle2 size={10} />
                                                    مكتمل
                                                </span>
                                            )}
                                            {item.status === 'processing' && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-600 text-xs font-bold rounded-full border border-amber-100 animate-pulse">
                                                    <Loader2 className="animate-spin" size={10} />
                                                    جاري المعالجة
                                                </span>
                                            )}
                                            {item.status === 'pending' && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-50 text-slate-600 text-xs font-bold rounded-full border border-slate-200">
                                                    قيد الانتظار
                                                </span>
                                            )}
                                            {item.status === 'failed' && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-50 text-rose-600 text-xs font-bold rounded-full border border-rose-100">
                                                    فشل
                                                </span>
                                            )}
                                        </div>
                                        
                                        <div className="text-sm font-bold text-slate-700 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 inline-block mt-0.5">
                                            {item.query}
                                        </div>

                                        {item.error_message && (
                                            <div className="text-xs text-rose-500 mt-1 max-w-md bg-rose-50/50 p-2 rounded-lg border border-rose-100">
                                                {item.error_message}
                                            </div>
                                        )}

                                        <div className="text-xs text-slate-400 font-semibold mt-1.5">{formatDate(item.created_at)}</div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                                    <div className="text-right">
                                        <div className="text-2xl font-black text-slate-900">
                                            {(item.results_count || 0).toLocaleString('ar-EG')}
                                        </div>
                                        <div className="text-xs text-slate-400 font-bold">نتيجة مستخرجة</div>
                                    </div>

                                    {item.status === 'completed' && item.results_count > 0 && (
                                        <ActionButton 
                                            onClick={() => handleExportItem(item)}
                                            variant="ghost" 
                                            label="تصدير" 
                                            size="sm" 
                                            icon={<Download size={16} />} 
                                        />
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
