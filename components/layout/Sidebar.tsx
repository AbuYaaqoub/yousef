'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Users,
    History,
    Settings,
    Search,
    Store
} from 'lucide-react';

const navigation = [
    { name: 'لوحة التحكم', href: '/1', icon: LayoutDashboard },
    { name: 'المتاجر', href: '/leads', icon: Users },
    { name: 'السجل', href: '/history', icon: History },
    { name: 'الإعدادات', href: '/settings', icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed inset-y-0 right-0 z-50 w-72 bg-white border-l border-slate-200 flex flex-col">
            {/* Logo */}
            <div className="flex items-center gap-4 px-6 py-6 border-b border-slate-100">
                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/10">
                    <Search className="text-white" size={22} />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-slate-900">
                        SallaHunter <span className="text-orange-600">Pro</span>
                    </h1>
                    <p className="text-slate-400 text-xs font-medium mt-0.5">نظام استخراج البيانات</p>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="mx-6 my-6 p-4 bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-2xl border border-orange-100">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-orange-700">إجمالي المتاجر</span>
                    <Store className="text-orange-600" size={16} />
                </div>
                <div className="text-3xl font-black text-slate-900 tracking-tighter">2,847</div>
                <div className="text-xs text-orange-600 font-medium mt-1">+124 هذا الأسبوع</div>
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
                                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
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
            <div className="p-4 border-t border-slate-100">
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-sm">
                        م
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-slate-900 truncate">مستخدم محترف</div>
                        <div className="text-xs text-slate-500 font-medium">خطة احترافية</div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
