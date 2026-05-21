'use client';

import { Sidebar } from './Sidebar';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
            <Sidebar />
            <main className="pr-72">
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
