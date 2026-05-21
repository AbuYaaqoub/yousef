'use client';

import { cn } from '@/lib/utils';

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: number | string;
    color: 'slate' | 'orange' | 'emerald' | 'rose' | 'blue';
    trend?: string;
}

export function StatCard({ icon, label, value, color, trend }: StatCardProps) {
    const colors = {
        slate: {
            container: 'hover:border-slate-300 bg-white shadow-sm',
            icon: 'bg-slate-100 text-slate-900',
        },
        orange: {
            container: 'hover:border-orange-300 bg-white shadow-sm',
            icon: 'bg-orange-50 text-orange-600',
        },
        emerald: {
            container: 'hover:border-emerald-300 bg-white shadow-sm',
            icon: 'bg-emerald-50 text-emerald-600',
        },
        rose: {
            container: 'hover:border-rose-300 bg-white shadow-sm',
            icon: 'bg-rose-50 text-rose-600',
        },
        blue: {
            container: 'hover:border-blue-300 bg-white shadow-sm',
            icon: 'bg-blue-50 text-blue-600',
        },
    };

    return (
        <div className={cn(
            'border border-slate-200 p-6 rounded-[28px] group transition-all duration-500 hover:-translate-y-1',
            colors[color].container
        )}>
            <div className="flex items-center justify-between mb-4">
                <div className={cn(
                    'p-3.5 rounded-2xl group-hover:scale-110 transition-transform duration-500 border border-transparent',
                    colors[color].icon
                )}>
                    {icon}
                </div>
                <div className="text-3xl font-black text-slate-900 tracking-tighter tabular-nums">
                    {value}
                </div>
            </div>
            <div className="text-slate-500 font-bold text-xs tracking-wide uppercase">{label}</div>
            {trend && (
                <div className="text-xs text-emerald-600 font-bold mt-2">{trend}</div>
            )}
        </div>
    );
}
