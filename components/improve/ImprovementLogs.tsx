'use client';

import { useState } from 'react';
import { Plus, FileText, Trash2 } from 'lucide-react';

interface Client {
    id: string;
    name: string;
    website: string;
}

interface ImprovementLog {
    id: string;
    client_id: string;
    note: string;
    created_at: string;
}

interface ImprovementLogsProps {
    selectedClient: Client;
    logs: ImprovementLog[];
    onAddLog: (note: string) => Promise<void>;
    onDeleteLog: (id: string) => Promise<void>;
}

export function ImprovementLogs({
    selectedClient,
    logs,
    onAddLog,
    onDeleteLog
}: ImprovementLogsProps) {
    const [newNoteText, setNewNoteText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNoteText.trim() || isSubmitting) return;

        try {
            setIsSubmitting(true);
            await onAddLog(newNoteText);
            setNewNoteText('');
        } catch (err) {
            console.error('Error adding log:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* بطاقة إضافة ملاحظة عمل جديدة */}
            <div className="bg-white border border-slate-200/80 p-6 rounded-[28px] shadow-sm space-y-4">
                <div>
                    <h3 className="font-black text-slate-900 text-sm">توثيق مراحل العمل على التحسن</h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">سجل الملاحظات والإجراءات الفنية التي قمت باتخاذها لتحسين سيو متجر العميل</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                    <textarea 
                        rows={3}
                        required
                        placeholder="اكتب ملاحظة العمل أو التعديل الفني الذي قمت به..."
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs font-bold outline-none focus:border-black focus:bg-white text-slate-800 placeholder-slate-400 resize-none animate-in"
                    />
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex items-center justify-center gap-1.5 py-3 px-6 rounded-2xl bg-black hover:bg-zinc-800 text-white font-bold text-xs transition-all shadow-sm disabled:bg-zinc-500"
                    >
                        <Plus size={14} />
                        <span>{isSubmitting ? 'جاري التسجيل...' : 'تسجيل وتوثيق الملاحظة'}</span>
                    </button>
                </form>
            </div>

            {/* الخط الزمني وسجل مراحل العمل */}
            <div className="bg-white border border-slate-200/80 p-6 rounded-[28px] shadow-sm space-y-6 max-h-[500px] overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-black text-slate-900 text-sm">سجل الإجراءات ومراحل العمل</h3>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[9px] font-black">{logs.length} ملاحظات</span>
                </div>

                <div className="space-y-6 relative border-r-2 border-slate-100 pr-4 mr-2">
                    {logs.length === 0 ? (
                        <div className="text-center py-6 text-slate-400 text-xs">
                            <FileText className="mx-auto mb-2 text-slate-300" size={20} />
                            <span>لا يوجد إجراءات أو ملاحظات مسجلة لهذا العميل حتى الآن</span>
                        </div>
                    ) : (
                        logs.map((log) => (
                            <div key={log.id} className="relative space-y-1.5 animate-in">
                                {/* نقطة الخط الزمني الأنيقة */}
                                <div className="absolute -right-[23px] top-1 w-2.5 h-2.5 rounded-full bg-black border border-white" />
                                
                                <div className="flex items-start justify-between gap-2">
                                    <span className="text-[9px] font-black text-slate-400 font-mono">
                                        {new Date(log.created_at).toLocaleString('ar-EG', { 
                                            year: 'numeric', 
                                            month: 'short', 
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                    <button
                                        onClick={() => onDeleteLog(log.id)}
                                        className="text-slate-300 hover:text-rose-600 transition-colors"
                                        title="حذف الملاحظة"
                                    >
                                        <Trash2 size={11} />
                                    </button>
                                </div>
                                <p className="text-xs font-bold text-slate-700 leading-relaxed pl-2">
                                    {log.note}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
