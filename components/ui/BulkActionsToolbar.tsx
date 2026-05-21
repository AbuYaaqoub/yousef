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
                        <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center font-bold text-sm">
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
                        variant="success"
                        icon={<Download size={16} />}
                        label="تصدير المحدد"
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-500 text-white"
                    />
                    <ActionButton
                        onClick={onDelete}
                        variant="danger"
                        icon={<Trash2 size={16} />}
                        label="حذف المحدد"
                        size="sm"
                        className="bg-rose-600 hover:bg-rose-500 text-white border-0"
                    />
                </div>
            </div>
        </div>
    );
}
