'use client';

import { useState } from 'react';
import { Users, Plus, ArrowLeftRight, Clock, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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
}

interface ClientKeywordsProps {
    selectedClient: Client;
    clientKeywords: ClientKeyword[];
    usingFallback: boolean;
    onAddClientKeyword: (keyword: string, location: string, status: 'used' | 'changed' | 'review', reviewDays: number) => Promise<void>;
    onUpdateStatus: (id: string, currentStatus: 'used' | 'changed' | 'review') => Promise<void>;
    onResetTimer: (id: string, days: number) => Promise<void>;
    onDeleteClientKeyword: (id: string) => Promise<void>;
    onSwitchTab: () => void;
}

export function ClientKeywords({
    selectedClient,
    clientKeywords,
    usingFallback,
    onAddClientKeyword,
    onUpdateStatus,
    onResetTimer,
    onDeleteClientKeyword,
    onSwitchTab
}: ClientKeywordsProps) {
    const [showAddClientKeywordModal, setShowAddClientKeywordModal] = useState(false);
    const [newClientKeywordText, setNewClientKeywordText] = useState('');
    const [newClientKeywordLocation, setNewClientKeywordLocation] = useState('الصفحة الرئيسية');
    const [newClientKeywordStatus, setNewClientKeywordStatus] = useState<'used' | 'changed' | 'review'>('review');
    const [newClientKeywordDays, setNewClientKeywordDays] = useState<number>(7);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newClientKeywordText.trim() || isSubmitting) return;

        try {
            setIsSubmitting(true);
            await onAddClientKeyword(
                newClientKeywordText,
                newClientKeywordLocation,
                newClientKeywordStatus,
                newClientKeywordDays
            );
            setNewClientKeywordText('');
            setNewClientKeywordLocation('الصفحة الرئيسية');
            setNewClientKeywordStatus('review');
            setNewClientKeywordDays(7);
            setShowAddClientKeywordModal(false);
        } catch (err) {
            console.error('Error adding client keyword:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getDaysRemaining = (dueDate: string) => {
        const remainingMs = new Date(dueDate).getTime() - Date.now();
        const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
        return remainingDays > 0 ? remainingDays : 0;
    };

    return (
        <div className="bg-white border border-slate-200/80 rounded-[32px] overflow-hidden shadow-sm p-6 space-y-6 animate-in">
            {/* ترويسة وأزرار الإجراءات */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h3 className="text-lg font-black text-slate-900">الكلمات المفتاحية النشطة للعميل</h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">مراقبة مواقع تمركز الكلمات داخل موقع العميل ومتابعة مواقيت مراجعتها الدورية</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowAddClientKeywordModal(true)}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-black hover:bg-zinc-800 text-white font-bold text-xs transition-all shadow-sm"
                    >
                        <Plus size={14} />
                        <span>إضافة كلمة مستهدفة</span>
                    </button>
                    <button
                        onClick={onSwitchTab}
                        className="flex items-center gap-1 px-3 py-2.5 rounded-2xl border border-zinc-200 text-zinc-600 hover:border-black hover:text-black text-xs font-bold transition-all"
                        title="اختصار إلى قاعدة الكلمات"
                    >
                        <ArrowLeftRight size={14} />
                        <span>قاعدة الكلمات ➔</span>
                    </button>
                </div>
            </div>

            {/* جدول الكلمات المستهدفة */}
            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className="w-full text-right border-collapse">
                    <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                            <th className="p-4">الكلمة المستهدفة</th>
                            <th className="p-4 text-center">الحالة</th>
                            <th className="p-4">مكان التواجد بالموقع</th>
                            <th className="p-4 text-center">مؤقت المراجعة القادم</th>
                            <th className="p-4 text-center">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="text-xs font-bold text-slate-700 divide-y divide-slate-100">
                        {clientKeywords.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-12 text-center text-slate-400">
                                    <Users className="mx-auto mb-3 text-slate-300" size={24} />
                                    <span>لا توجد كلمات نشطة مستهدفة لهذا العميل حالياً</span>
                                </td>
                            </tr>
                        ) : (
                            clientKeywords.map((item) => {
                                const daysLeft = getDaysRemaining(item.review_due_at);
                                return (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4 font-black text-slate-900">{item.keyword}</td>
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => onUpdateStatus(item.id, item.status)}
                                                className={cn(
                                                    "px-2.5 py-1 rounded-full border text-[9px] font-black cursor-pointer hover:scale-105 transition-all inline-block min-w-[85px]",
                                                    item.status === 'used' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                                                    item.status === 'changed' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                                                    'bg-slate-50 border-slate-200 text-slate-600'
                                                )}
                                                title="انقر لتبديل الحالة"
                                            >
                                                {item.status === 'used' ? 'مستخدمة بنجاح' :
                                                 item.status === 'changed' ? 'تم استبدالها' : 'قيد المراجعة'}
                                            </button>
                                        </td>
                                        <td className="p-4 font-medium text-slate-600">{item.location}</td>
                                        <td className="p-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className={cn(
                                                    "inline-flex items-center gap-1 font-mono font-bold text-xs mb-1.5",
                                                    daysLeft <= 1 ? "text-rose-600 animate-pulse" : 
                                                    daysLeft <= 3 ? "text-amber-500" : "text-slate-600"
                                                )}>
                                                    <Clock size={12} />
                                                    <span>{daysLeft} أيام متبقية</span>
                                                </span>
                                                
                                                <select
                                                    value=""
                                                    onChange={(e) => onResetTimer(item.id, Number(e.target.value))}
                                                    className="bg-slate-50 border border-slate-200/80 text-slate-500 hover:border-black hover:text-black text-[9px] font-black py-1 px-1.5 rounded-xl outline-none cursor-pointer focus:bg-white transition-all text-center"
                                                >
                                                    <option value="" disabled hidden>إعادة جدولة...</option>
                                                    <option value={1}>إعادة جدولة: يوم</option>
                                                    <option value={3}>إعادة جدولة: ٣ أيام</option>
                                                    <option value={5}>إعادة جدولة: ٥ أيام</option>
                                                    <option value={7}>إعادة جدولة: ٧ أيام</option>
                                                    <option value={14}>إعادة جدولة: ١٤ يوماً</option>
                                                    <option value={30}>إعادة جدولة: ٣٠ يوماً</option>
                                                </select>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => onDeleteClientKeyword(item.id)}
                                                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                                title="إلغاء الاستهداف"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* مودال منبثق لإضافة كلمة مستهدفة للعميل */}
            {showAddClientKeywordModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in duration-250">
                    <div className="bg-white border border-slate-100 rounded-[32px] w-full max-w-md p-8 shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
                        <div className="mb-6">
                            <h3 className="text-xl font-black text-slate-900">إضافة كلمة مستهدفة للعميل</h3>
                            <p className="text-[10px] text-slate-400 font-bold mt-1">تحديد كلمة جديدة مستهدفة بالفعل في موقع العميل لمتابعة مؤقت مراجعتها</p>
                        </div>

                        <form onSubmit={handleAddSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-600">الكلمة المستهدفة</label>
                                <input 
                                    type="text" 
                                    required
                                    placeholder="مثال: قهوة دبل اسبريسو"
                                    value={newClientKeywordText}
                                    onChange={(e) => setNewClientKeywordText(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl py-3 px-4 text-xs font-bold outline-none focus:border-black focus:bg-white text-slate-800 transition-all"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-600">مكان التواجد بالموقع</label>
                                <input 
                                    type="text" 
                                    required
                                    placeholder="مثال: الصفحة الرئيسية أو تصنيف المنتجات"
                                    value={newClientKeywordLocation}
                                    onChange={(e) => setNewClientKeywordLocation(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl py-3 px-4 text-xs font-bold outline-none focus:border-black focus:bg-white text-slate-800 transition-all"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-600">الحالة الأولية للكلمة</label>
                                <select 
                                    value={newClientKeywordStatus}
                                    onChange={(e) => setNewClientKeywordStatus(e.target.value as any)}
                                    className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl py-3 px-4 text-xs font-bold outline-none focus:border-black focus:bg-white text-slate-800 transition-all"
                                >
                                    <option value="review">تحتاج لمراجعة (Review)</option>
                                    <option value="used">مستخدمة بنجاح (Used)</option>
                                    <option value="changed">تم استبدالها أو تغييرها (Changed)</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-600">ميعاد المراجعة القادمة</label>
                                <select 
                                    value={newClientKeywordDays}
                                    onChange={(e) => setNewClientKeywordDays(Number(e.target.value))}
                                    className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl py-3 px-4 text-xs font-bold outline-none focus:border-black focus:bg-white text-slate-800 transition-all"
                                >
                                    <option value={1}>بعد يوم واحد (مراجعة عاجلة)</option>
                                    <option value={3}>بعد ٣ أيام</option>
                                    <option value={5}>بعد ٥ أيام</option>
                                    <option value={7}>بعد ٧ أيام (أسبوع)</option>
                                    <option value={14}>بعد ١٤ يوماً (أسبوعين)</option>
                                    <option value={30}>بعد ٣٠ يوماً (شهر كامل)</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 py-3 px-6 rounded-2xl bg-black hover:bg-zinc-800 text-white font-bold text-xs transition-all shadow-sm disabled:bg-zinc-500"
                                >
                                    {isSubmitting ? 'جاري الإضافة...' : 'تأكيد وإضافة الكلمة'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowAddClientKeywordModal(false)}
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
