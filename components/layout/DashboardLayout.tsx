import { Suspense } from 'react';
import { Sidebar } from './Sidebar';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
            <Suspense fallback={<div className="fixed inset-y-0 right-0 z-50 w-72 bg-white border-l border-zinc-200" />}>
                <Sidebar />
            </Suspense>
            <main className="pr-72">
                <div className="p-8">
                    <Suspense fallback={<div className="flex items-center justify-center p-12 text-zinc-400 font-bold text-xs">جاري التحميل...</div>}>
                        {children}
                    </Suspense>
                </div>
            </main>
        </div>
    );
}
