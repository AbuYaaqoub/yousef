'use client';

import { Download, Trash2, X, Check } from 'lucide-react';
import { ActionButton } from '../ui/ActionButton';

interface BulkActionsToolbarProps {
    selectedCount: number;
    onSelectAll: () => void;
    onDeselectAll: () => void;
    onExport: () => void;
    onDelete: () => void;
    totalItems: number;
}

export function BulkActionsToolbar({
    selectedCount,
    onSelectAll,
    onDeselectAll,
    onExport,
    onDelete,
    totalItems,
}: BulkActionsToolbarProps) {
    if (selectedCount === 0) return null;

    return (
        <div className="sticky top-4 z-40 bg-slate-900 text-white rounded-2xl px-6 py-4 shadow-xl shadow-slate-900/20 mb-6 animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center font-black text-sm">
                            {selectedCount}
                        </div>
                        <span className="font-bold text-sm">محدد</span>
                    </div>
                    <div className="h-6 w-px bg-slate-700" />
                    <button
                        onClick={onSelectAll}
                        className="text-slate-300 hover:text-white text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <Check size={16} />
                        تحديد الكل ({totalItems})
                    </button>
                    <button
                        onClick={onDeselectAll}
                        className="text-slate-300 hover:text-white text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <X size={16} />
                        إلغاء الكل
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <ActionButton
                        onClick={onExport}
                        variant="primary"
                        icon={<Download size={16} />}
                        label="تصدير المحدد"
                        size="sm"
                        className="bg-white text-black hover:bg-zinc-100 border border-zinc-200 shadow-none"
                    />
                    <ActionButton
                        onClick={onDelete}
                        variant="danger"
                        icon={<Trash2 size={16} />}
                        label="حذف المحدد"
                        size="sm"
                    />
                </div>
            </div>
        </div>
    );
}
