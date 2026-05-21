'use client';

import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ActionButtonProps {
    onClick?: () => void;
    disabled?: boolean;
    loading?: boolean;
    variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
    icon?: React.ReactNode;
    label?: string;
    className?: string;
    title?: string;
    size?: 'sm' | 'md' | 'lg';
    active?: boolean;
}

export function ActionButton({
    onClick,
    disabled,
    loading,
    variant = 'primary',
    icon,
    label,
    className = '',
    title,
    size = 'md',
    active,
}: ActionButtonProps) {
    const variants = {
        primary: 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-600/20',
        secondary: 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/10',
        danger: 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200',
        success: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20',
        ghost: 'bg-transparent hover:bg-slate-100 text-slate-600',
    };

    const sizes = {
        sm: 'gap-2 px-4 py-2.5 rounded-xl text-xs',
        md: 'gap-3 px-5 py-3 rounded-2xl text-sm',
        lg: 'gap-4 px-7 py-4 rounded-2xl text-base',
    };

    return (
        <button
            type="button"
            onClick={(e) => {
                console.log('ActionButton clicked');
                if (onClick) {
                    onClick();
                } else {
                    alert('المكون لا يحتوي على وظيفة onClick!');
                }
            }}
            disabled={disabled || loading}
            title={title}
            className={cn(
                'flex items-center justify-center font-bold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 shadow-md',
                variants[variant],
                sizes[size],
                className
            )}
        >
            {loading ? (
                <Loader2 className="animate-spin" size={size === 'sm' ? 14 : 18} />
            ) : (
                icon
            )}
            {label && <span>{label}</span>}
        </button>
    );
}
