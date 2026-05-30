'use client';

import { BookOpen, Sparkles, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function EncyclopediaPage() {
    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center text-center p-8 animate-fade-in">
            <div className="relative overflow-hidden rounded-[36px] bg-black text-white p-12 max-w-2xl shadow-2xl shadow-black/25 border border-zinc-900">
                {/* Background decorative glowing blur */}
                <div className="absolute -left-20 -top-20 w-60 h-60 rounded-full bg-zinc-800/30 blur-[80px] pointer-events-none" />
                <div className="absolute -right-20 -bottom-20 w-60 h-60 rounded-full bg-zinc-800/20 blur-[80px] pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 shadow-inner text-white">
                        <BookOpen size={32} />
                    </div>

                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/10 backdrop-blur-md mb-6">
                        <Sparkles size={14} className="text-zinc-300" />
                        <span className="text-xs font-bold text-slate-200">القسم قيد التجهيز والتطوير</span>
                    </div>

                    <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
                        موسوعة الكلمات المفتاحية الذكية
                    </h1>
                    <p className="mt-4 text-zinc-400 font-medium text-sm leading-relaxed max-w-md">
                        نعمل على تجهيز مكتبة مرجعية شاملة ومصنفة للكلمات المفتاحية، واستراتيجيات تهيئة محركات البحث، بالإضافة إلى تحليلات قطاعية متقدمة لتكون دليلك المتكامل في رفع تصنيفات المتاجر.
                    </p>

                    <div className="mt-8 pt-8 border-t border-zinc-800 w-full flex flex-col sm:flex-row gap-4 items-center justify-center">
                        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-black text-zinc-400">
                            <span>التحديث القادم</span>
                            <span>◆</span>
                            <span>Version 1.1</span>
                        </div>
                        <Link 
                            href="/"
                            className="flex items-center gap-2 py-3 px-6 rounded-2xl bg-white text-black hover:bg-zinc-100 font-bold text-xs transition-all duration-300 shadow-lg shadow-white/5"
                        >
                            <span>العودة للرئيسية</span>
                            <ChevronLeft size={14} />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
