'use client';

import { cn } from '@/lib/utils';

interface SocialIconProps {
    href: string;
    color: 'emerald' | 'pink' | 'slate' | 'blue' | 'red' | 'yellow' | 'sky';
    label: string;
    size?: 'sm' | 'md';
}

export function SocialIcon({ href, color, label, size = 'sm' }: SocialIconProps) {
    const colors = {
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 hover:-translate-y-0.5',
        pink: 'bg-pink-50 text-pink-600 border-pink-100 hover:bg-pink-100 hover:-translate-y-0.5',
        slate: 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100 hover:-translate-y-0.5',
        blue: 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 hover:-translate-y-0.5',
        red: 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100 hover:-translate-y-0.5',
        yellow: 'bg-yellow-50 text-yellow-600 border-yellow-100 hover:bg-yellow-100 hover:-translate-y-0.5',
        sky: 'bg-sky-50 text-sky-600 border-sky-100 hover:bg-sky-100 hover:-translate-y-0.5',
    };

    const sizes = {
        sm: 'h-8 px-3 text-[10px]',
        md: 'h-10 px-4 text-xs',
    };

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            title={label}
            className={cn(
                'flex items-center justify-center rounded-lg border font-bold transition-all duration-300',
                colors[color],
                sizes[size]
            )}
        >
            {label.substring(0, 2).toUpperCase()}
        </a>
    );
}
