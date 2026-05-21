'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Users,
    History,
    Settings,
    Search,
    Store,
    Globe
} from 'lucide-react';

const navigation = [
    { name: 'الرئيسية (مركز الإدارة)', href: '/', icon: LayoutDashboard },
    { name: 'كاشط سلة ومحلي', href: '/1', icon: Store },
    { name: 'كاشط منصة مزيد', href: '/2', icon: Search },
    { name: 'كاشط خرائط قوقل', href: '/3', icon: Globe },
    { name: 'المتاجر المكتشفة', href: '/leads', icon: Users },
    { name: 'سجل العمليات', href: '/history', icon: History },
    { name: 'الإعدادات والربط', href: '/settings', icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const [totalLeads, setTotalLeads] = useState<number | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/stats');
                const data = await res.json();
                if (data.success && data.stats) {
                    setTotalLeads(data.stats.totalLeads);
                }
            } catch (e) {
                console.error('Failed to fetch sidebar statistics:', e);
            }
        };
        fetchStats();
        // Refresh every 30 seconds
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <aside className="fixed inset-y-0 right-0 z-50 w-72 bg-white border-l border-zinc-200 flex flex-col">
            {/* Logo */}
            <div className="flex items-center justify-between px-6 py-6 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                    <img 
                        src="/icon.png" 
                        alt="شعار نقيب" 
                        className="h-4 w-4 object-contain select-none" 
                    />
                    <img 
                        src="/logo.png" 
                        alt="نقيب" 
                        className="h-7 w-auto object-contain select-none" 
                    />
                   
                    
                </div>
                <div>
                    <span className="px-2 py-0.5 rounded bg-black text-white text-[9px] font-black uppercase tracking-wider">
                        PRO
                    </span>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="mx-6 my-6 p-5 bg-black text-white rounded-2xl border border-zinc-900 shadow-md relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-20 h-20 bg-zinc-800/10 rounded-br-full pointer-events-none" />
                <div className="flex items-center justify-between mb-2.5 relative z-10">
                    <span className="text-[11px] font-bold text-zinc-400">إجمالي العملاء المكتشفين</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="text-3xl font-black tracking-tighter relative z-10">
                    {totalLeads !== null ? totalLeads.toLocaleString('ar-EG') : '...'}
                </div>
                <div className="text-[10px] text-zinc-400 font-medium mt-2 relative z-10 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-zinc-700" />
                    تحديث حي وتلقائي للملفات
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
                {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group',
                                isActive
                                    ? 'bg-black text-white shadow-lg shadow-black/10'
                                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-black'
                            )}
                        >
                            <item.icon
                                size={20}
                                className={cn(
                                    'transition-transform duration-300',
                                    isActive ? 'scale-110' : 'group-hover:scale-110'
                                )}
                            />
                            <span className="font-bold text-sm">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* User */}
            <div className="p-4 border-t border-zinc-100">
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-100">
                    <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-white font-bold text-sm">
                        م
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-black truncate">مستخدم محترف</div>
                        <div className="text-xs text-zinc-500 font-medium">خطة احترافية</div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
