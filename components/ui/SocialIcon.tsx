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
        emerald: 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-black hover:text-white hover:border-black hover:-translate-y-0.5',
        pink: 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-black hover:text-white hover:border-black hover:-translate-y-0.5',
        slate: 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-black hover:text-white hover:border-black hover:-translate-y-0.5',
        blue: 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-black hover:text-white hover:border-black hover:-translate-y-0.5',
        red: 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-black hover:text-white hover:border-black hover:-translate-y-0.5',
        yellow: 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-black hover:text-white hover:border-black hover:-translate-y-0.5',
        sky: 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-black hover:text-white hover:border-black hover:-translate-y-0.5',
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
