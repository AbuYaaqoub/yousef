'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, ArrowLeftRight, Clock, Trash2, Globe } from 'lucide-react';
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
    page_url?: string;
    kd?: number;
    volume?: number;
    platform?: string;
    source_site?: string;
    intent?: string;
    cpc?: number;
    sf?: string;
}

interface ClientKeywordsProps {
    selectedClient: Client;
    clients: Client[];
    clientKeywords: ClientKeyword[];
    usingFallback: boolean;
    onAddClientKeyword: (
        clientId: string,
        keyword: string,
        location: string,
        status: 'used' | 'changed' | 'review',
        reviewDays: number,
        pageUrl?: string,
        kd?: number,
        volume?: number,
        platform?: string,
        sourceSite?: string,
        intent?: string,
        cpc?: number,
        sf?: string
    ) => Promise<void>;
    onUpdateStatus: (id: string, currentStatus: 'used' | 'changed' | 'review') => Promise<void>;
    onResetTimer: (id: string, days: number) => Promise<void>;
    onDeleteClientKeyword: (id: string) => Promise<void>;
    onSwitchTab: () => void;
    isWideView?: boolean;
}

export function ClientKeywords({
    selectedClient,
    clients = [],
    clientKeywords,
    usingFallback,
    onAddClientKeyword,
    onUpdateStatus,
    onResetTimer,
    onDeleteClientKeyword,
    onSwitchTab,
    isWideView = false
}: ClientKeywordsProps) {
    const [showAddClientKeywordModal, setShowAddClientKeywordModal] = useState(false);
    const [targetClientId, setTargetClientId] = useState(selectedClient.id);
    const [successMessage, setSuccessMessage] = useState('');

    const [newClientKeywordText, setNewClientKeywordText] = useState('');
    const [newClientKeywordLocation, setNewClientKeywordLocation] = useState('الصفحة الرئيسية');
    const [newClientKeywordUrl, setNewClientKeywordUrl] = useState('');
    const [newClientKeywordStatus, setNewClientKeywordStatus] = useState<'used' | 'changed' | 'review'>('review');
    const [newClientKeywordDays, setNewClientKeywordDays] = useState<number>(7);
    
    // مقاييس الكلمة المفتاحية الجديدة الاختيارية
    const [newClientKeywordKD, setNewClientKeywordKD] = useState<number>(30);
    const [newClientKeywordVolume, setNewClientKeywordVolume] = useState<number>(1500);
    const [newClientKeywordPlatform, setNewClientKeywordPlatform] = useState<string>('ahrefs');
    const [newClientKeywordSourceSite, setNewClientKeywordSourceSite] = useState<string>('');
    
    // الحقول الإضافية لـ SEMrush
    const [newClientKeywordIntent, setNewClientKeywordIntent] = useState('');
    const [newClientKeywordCPC, setNewClientKeywordCPC] = useState<number>(0.0);
    const [newClientKeywordSF, setNewClientKeywordSF] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setTargetClientId(selectedClient.id);
    }, [selectedClient]);

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newClientKeywordText.trim() || isSubmitting) return;

        try {
            setIsSubmitting(true);
            await onAddClientKeyword(
                targetClientId,
                newClientKeywordText,
                newClientKeywordLocation,
                newClientKeywordStatus,
                newClientKeywordDays,
                newClientKeywordUrl,
                newClientKeywordKD,
                newClientKeywordVolume,
                newClientKeywordPlatform,
                newClientKeywordSourceSite,
                newClientKeywordIntent,
                newClientKeywordCPC,
                newClientKeywordSF
            );
            
            // إذا كان العميل المختار مختلفاً عن العميل النشط الحالي
            if (targetClientId !== selectedClient.id) {
                const targetClientName = clients.find(c => c.id === targetClientId)?.name || 'العميل المختار';
                setSuccessMessage(`تمت إضافة الكلمة بنجاح للعميل (${targetClientName})! ✅`);
                setTimeout(() => {
                    setNewClientKeywordText('');
                    setNewClientKeywordLocation('الصفحة الرئيسية');
                    setNewClientKeywordUrl('');
                    setNewClientKeywordStatus('review');
                    setNewClientKeywordDays(7);
                    setNewClientKeywordKD(30);
                    setNewClientKeywordVolume(1500);
                    setNewClientKeywordSourceSite('');
                    setNewClientKeywordIntent('');
                    setNewClientKeywordCPC(0.0);
                    setNewClientKeywordSF('');
                    setSuccessMessage('');
                    setShowAddClientKeywordModal(false);
                }, 1500);
            } else {
                setNewClientKeywordText('');
                setNewClientKeywordLocation('الصفحة الرئيسية');
                setNewClientKeywordUrl('');
                setNewClientKeywordStatus('review');
                setNewClientKeywordDays(7);
                setNewClientKeywordKD(30);
                setNewClientKeywordVolume(1500);
                setNewClientKeywordSourceSite('');
                setNewClientKeywordIntent('');
                setNewClientKeywordCPC(0.0);
                setNewClientKeywordSF('');
                setShowAddClientKeywordModal(false);
            }
        } catch (err) {
            console.error('Error adding client keyword:', err);
        } finally {
            setIsSubmitting(false);
        }
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
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">مراقبة مواقع تمركز الكلمات داخل موقع العميل ومتابعة مواقيت مراجعتها الدورية بمقاييسها الكاملة</p>
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
                <table className={cn("w-full text-right border-collapse transition-all duration-300", isWideView ? "min-w-[1100px]" : "min-w-full")}>
                    <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                            <th className={cn("p-4 transition-all duration-300", isWideView ? "w-[18%] min-w-[180px] border-l border-slate-100/80" : "")}>الكلمة المستهدفة</th>
                            <th className={cn("p-4 text-center transition-all duration-300", isWideView ? "w-[8%] min-w-[80px] border-l border-slate-100/80" : "")}>نية البحث</th>
                            <th className={cn("p-4 text-center transition-all duration-300", isWideView ? "w-[10%] min-w-[90px] border-l border-slate-100/80" : "")}>الصعوبة KD</th>
                            <th className={cn("p-4 text-center transition-all duration-300", isWideView ? "w-[12%] min-w-[110px] border-l border-slate-100/80" : "")}>حجم البحث</th>
                            <th className={cn("p-4 text-center transition-all duration-300", isWideView ? "w-[10%] min-w-[90px] border-l border-slate-100/80" : "")}>CPC (نقرة)</th>
                            <th className={cn("p-4 text-center transition-all duration-300", isWideView ? "w-[12%] min-w-[110px] border-l border-slate-100/80" : "")}>ميزات البحث SF</th>
                            <th className={cn("p-4 text-center transition-all duration-300", isWideView ? "w-[10%] min-w-[90px] border-l border-slate-100/80" : "")}>المنصة</th>
                            <th className={cn("p-4 text-center transition-all duration-300", isWideView ? "w-[10%] min-w-[95px] border-l border-slate-100/80" : "")}>الحالة</th>
                            <th className={cn("p-4 transition-all duration-300", isWideView ? "w-[15%] min-w-[150px] border-l border-slate-100/80" : "")}>مكان التواجد بالموقع</th>
                            <th className={cn("p-4 text-center transition-all duration-300", isWideView ? "w-[15%] min-w-[150px] border-l border-slate-100/80" : "")}>مؤقت المراجعة القادم</th>
                            <th className={cn("p-4 text-center transition-all duration-300", isWideView ? "w-[6%] min-w-[60px]" : "")}>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="text-xs font-bold text-slate-700 divide-y divide-slate-100">
                        {clientKeywords.length === 0 ? (
                            <tr>
                                <td colSpan={11} className="p-12 text-center text-slate-400">
                                    <Users className="mx-auto mb-3 text-slate-300" size={24} />
                                    <span>لا توجد كلمات نشطة مستهدفة لهذا العميل حالياً</span>
                                </td>
                            </tr>
                        ) : (
                            clientKeywords.map((item) => {
                                const daysLeft = getDaysRemaining(item.review_due_at);
                                return (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className={cn("p-4 font-black text-slate-900 transition-all duration-300", isWideView && "border-l border-slate-100/50")}>{item.keyword}</td>
                                        
                                        {/* نية البحث */}
                                        <td className={cn("p-4 text-center transition-all duration-300", isWideView && "border-l border-slate-100/50")}>
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

                                        {/* الصعوبة KD */}
                                        <td className={cn("p-4 text-center transition-all duration-300", isWideView && "border-l border-slate-100/50")}>
                                            {item.kd !== undefined && item.kd > 0 ? (
                                                <span className={cn("px-2.5 py-1 rounded-full border text-[10px] font-black inline-block min-w-[55px]", getKDColorClass(item.kd))}>
                                                    {item.kd}% ({getKDText(item.kd)})
                                                </span>
                                            ) : (
                                                <span className="text-slate-300 text-[10px] font-bold">-</span>
                                            )}
                                        </td>

                                        {/* حجم البحث الشهري */}
                                        <td className={cn("p-4 text-center font-mono transition-all duration-300", isWideView && "border-l border-slate-100/50")}>
                                            {item.volume !== undefined && item.volume > 0 ? (
                                                <span>{item.volume.toLocaleString('ar-EG')} عملية</span>
                                            ) : (
                                                <span className="text-slate-300 text-[10px] font-bold">-</span>
                                            )}
                                        </td>

                                        {/* سعر النقرة CPC */}
                                        <td className={cn("p-4 text-center font-mono text-slate-600 transition-all duration-300", isWideView && "border-l border-slate-100/50")}>
                                            {item.cpc !== undefined && item.cpc > 0 ? (
                                                <span className="text-zinc-700">${item.cpc.toFixed(2)}</span>
                                            ) : (
                                                <span className="text-slate-300 text-[10px] font-bold">-</span>
                                            )}
                                        </td>

                                        {/* ميزات نتائج البحث SF */}
                                        <td className={cn("p-4 text-center text-slate-500 font-medium truncate max-w-[120px] transition-all duration-300", isWideView && "border-l border-slate-100/50")} title={item.sf}>
                                            {item.sf || <span className="text-slate-300 text-[10px] font-bold">-</span>}
                                        </td>

                                        {/* المنصة المصدر */}
                                        <td className={cn("p-4 text-center transition-all duration-300", isWideView && "border-l border-slate-100/50")}>
                                            {item.platform ? (
                                                <span className={cn(
                                                    "px-2.5 py-1 rounded-full text-[9px] font-black uppercase border",
                                                    item.platform === 'ahrefs' ? 'bg-zinc-900 text-white border-zinc-950' : 
                                                    item.platform === 'semrush' ? 'bg-zinc-50 border-zinc-200 text-slate-900' : 
                                                    'bg-white border-zinc-300 text-zinc-600'
                                                )}>
                                                    {item.platform === 'moz' ? 'Moz (دز)' : item.platform}
                                                </span>
                                            ) : (
                                                <span className="text-slate-300 text-[10px] font-bold">-</span>
                                            )}
                                        </td>

                                        <td className={cn("p-4 text-center transition-all duration-300", isWideView && "border-l border-slate-100/50")}>
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
                                        <td className={cn("p-4 font-medium text-slate-600 transition-all duration-300", isWideView && "border-l border-slate-100/50")}>
                                            <div>{item.location}</div>
                                            {item.page_url && (
                                                <a 
                                                    href={item.page_url.startsWith('http') ? item.page_url : `https://${item.page_url}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-[10px] text-zinc-400 hover:text-black underline mt-1 transition-colors"
                                                    title="زيارة رابط الصفحة"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Globe size={11} />
                                                    <span className="truncate max-w-[150px]">{item.page_url.replace(/^https?:\/\//, '')}</span>
                                                </a>
                                            )}
                                        </td>
                                        <td className={cn("p-4 text-center transition-all duration-300", isWideView && "border-l border-slate-100/50")}>
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
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4 animate-in duration-250">
                    <div className="bg-white border border-slate-100 rounded-[32px] w-full max-w-md p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="mb-6">
                            <h3 className="text-xl font-black text-slate-900">إضافة كلمة مستهدفة للعميل</h3>
                            <p className="text-[10px] text-slate-400 font-bold mt-1">تحديد كلمة جديدة مستهدفة بالفعل في موقع العميل لمتابعة مؤقت مراجعتها ومقاييسها</p>
                        </div>

                        {successMessage && (
                            <div className="p-4 mb-4 text-xs font-black text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-2xl animate-pulse text-center">
                                {successMessage}
                            </div>
                        )}

                        <form onSubmit={handleAddSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-600">العميل المستهدف</label>
                                <select 
                                    value={targetClientId}
                                    onChange={(e) => setTargetClientId(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl py-3 px-4 text-xs font-bold outline-none focus:border-black focus:bg-white text-slate-800 transition-all"
                                >
                                    {clients.map(client => (
                                        <option key={client.id} value={client.id}>{client.name} ({client.website})</option>
                                    ))}
                                </select>
                            </div>

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
                                <label className="text-[10px] font-black text-slate-600">نية البحث (Intent - اختياري)</label>
                                <input 
                                    type="text" 
                                    placeholder="مثال: Informational أو Commercial"
                                    value={newClientKeywordIntent}
                                    onChange={(e) => setNewClientKeywordIntent(e.target.value)}
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
                                <label className="text-[10px] font-black text-slate-600">رابط الصفحة (اختياري)</label>
                                <input 
                                    type="text" 
                                    placeholder="مثال: https://bonsugar.com/espresso"
                                    value={newClientKeywordUrl}
                                    onChange={(e) => setNewClientKeywordUrl(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl py-3 px-4 text-xs font-bold outline-none focus:border-black focus:bg-white text-slate-800 transition-all text-left"
                                    dir="ltr"
                                />
                            </div>

                            {/* المقاييس الإحصائية الإضافية */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-600">درجة الصعوبة KD (اختياري)</label>
                                    <input 
                                        type="number" 
                                        min="0"
                                        max="100"
                                        value={newClientKeywordKD}
                                        onChange={(e) => setNewClientKeywordKD(Number(e.target.value))}
                                        className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl py-3 px-4 text-xs font-bold outline-none focus:border-black focus:bg-white text-slate-800 transition-all font-mono"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-600">حجم البحث (اختياري)</label>
                                    <input 
                                        type="number" 
                                        min="0"
                                        value={newClientKeywordVolume}
                                        onChange={(e) => setNewClientKeywordVolume(Number(e.target.value))}
                                        className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl py-3 px-4 text-xs font-bold outline-none focus:border-black focus:bg-white text-slate-800 transition-all font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-600">سعر النقرة CPC ($ - اختياري)</label>
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        min="0"
                                        value={newClientKeywordCPC}
                                        onChange={(e) => setNewClientKeywordCPC(Number(e.target.value))}
                                        className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl py-3 px-4 text-xs font-bold outline-none focus:border-black focus:bg-white text-slate-800 transition-all font-mono"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-600">ميزات البحث SF (اختياري)</label>
                                    <input 
                                        type="text" 
                                        placeholder="مثال: Featured Snippet, Images"
                                        value={newClientKeywordSF}
                                        onChange={(e) => setNewClientKeywordSF(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl py-3 px-4 text-xs font-bold outline-none focus:border-black focus:bg-white text-slate-800 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-600">المنصة المصدر</label>
                                    <select 
                                        value={newClientKeywordPlatform}
                                        onChange={(e) => setNewClientKeywordPlatform(e.target.value)}
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
                                        placeholder="مثال: competitor.com"
                                        value={newClientKeywordSourceSite}
                                        onChange={(e) => setNewClientKeywordSourceSite(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl py-3 px-4 text-xs font-bold outline-none focus:border-black focus:bg-white text-slate-800 transition-all"
                                    />
                                </div>
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
                                    disabled={isSubmitting || !!successMessage}
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
