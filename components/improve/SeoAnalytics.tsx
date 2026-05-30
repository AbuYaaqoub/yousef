'use client';

import { useState } from 'react';
import { Compass, BookOpen, Globe, Share2, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Client {
    id: string;
    name: string;
    website: string;
}

interface SeoAnalyticsProps {
    selectedClient: Client;
}

export function SeoAnalytics({ selectedClient }: SeoAnalyticsProps) {
    const [expandedAnalytic, setExpandedAnalytic] = useState<string | null>(null);

    return (
        <div className="space-y-6 animate-in">
            <div className="bg-white border border-slate-200/80 p-6 rounded-[32px] shadow-sm">
                <h3 className="text-lg font-black text-slate-900">مراقب تحليلات السيو المدمج</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">تقارير أداء خماسية تفاعلية لتتبع حالة الأرشفة ومؤشرات البحث والزيارات</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. تحليلات سيرش كونسول */}
                <div 
                    onClick={() => setExpandedAnalytic(expandedAnalytic === 'gsc' ? null : 'gsc')}
                    className={cn(
                        "bg-white border p-6 rounded-[28px] shadow-sm cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-0.5",
                        expandedAnalytic === 'gsc' ? "md:col-span-2 border-black" : "border-slate-200/80"
                    )}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-100 text-black">
                                <Compass size={20} />
                            </div>
                            <div>
                                <h4 className="font-black text-slate-900 text-sm">تحليلات سيرش كونسول</h4>
                                <span className="text-[9px] text-slate-400 font-medium">جوجل ويبمستر أورجانيك</span>
                            </div>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-black border border-emerald-100">نشط</span>
                    </div>

                    {expandedAnalytic === 'gsc' ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100 animate-in" onClick={(e) => e.stopPropagation()}>
                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                <div className="text-[10px] text-slate-400 font-bold">النقرات العضوية</div>
                                <div className="text-lg font-black text-slate-900 font-mono mt-1">٣.٤ ألف</div>
                                <div className="text-[9px] text-emerald-600 font-bold mt-1">▲ ١٢.٤% مقارنة بالشهر السابق</div>
                            </div>
                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                <div className="text-[10px] text-slate-400 font-bold">مرات الظهور الكلية</div>
                                <div className="text-lg font-black text-slate-900 font-mono mt-1">٤٨.٢ ألف</div>
                                <div className="text-[9px] text-emerald-600 font-bold mt-1">▲ ٨.٢% نمو متواصل</div>
                            </div>
                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                <div className="text-[10px] text-slate-400 font-bold">نسبة النقر للظهور CTR</div>
                                <div className="text-lg font-black text-slate-900 font-mono mt-1">٧.٠%</div>
                                <div className="text-[9px] text-emerald-600 font-bold mt-1">▲ ارتفاع بمقدار ٠.٥%</div>
                            </div>
                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                <div className="text-[10px] text-slate-400 font-bold">متوسط الترتيب بالبحث</div>
                                <div className="text-lg font-black text-slate-900 font-mono mt-1">١٢.٤</div>
                                <div className="text-[9px] text-emerald-600 font-bold mt-1">▲ تحسن بـ ١.٥ مراتب</div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-[11px] text-slate-400 leading-relaxed">تتبع نقرات البحث العضوي لمتجرك وموقع تمركز الكلمات في صفحات جوجل الأولى. انقر للتوسيع.</div>
                    )}
                </div>

                {/* 2. تحليلات أندكس/انتلكس */}
                <div 
                    onClick={() => setExpandedAnalytic(expandedAnalytic === 'intellect' ? null : 'intellect')}
                    className={cn(
                        "bg-white border p-6 rounded-[28px] shadow-sm cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-0.5",
                        expandedAnalytic === 'intellect' ? "md:col-span-2 border-black" : "border-slate-200/80"
                    )}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-100 text-black">
                                <BookOpen size={20} />
                            </div>
                            <div>
                                <h4 className="font-black text-slate-900 text-sm">تحليلات فهرسة انتلكس</h4>
                                <span className="text-[9px] text-slate-400 font-medium">مؤشرات الأرشفة والمشاكل التقنية</span>
                            </div>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-black border border-emerald-100">مكتمل</span>
                    </div>

                    {expandedAnalytic === 'intellect' ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100 animate-in" onClick={(e) => e.stopPropagation()}>
                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                <div className="text-[10px] text-slate-400 font-bold">الصفحات المؤرشفة</div>
                                <div className="text-lg font-black text-slate-900 font-mono mt-1">١٤٢ صفحة</div>
                                <div className="text-[9px] text-slate-400 font-medium mt-1">مكشوف في محرك جوجل</div>
                            </div>
                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                <div className="text-[10px] text-slate-400 font-bold">صفحات غير مؤرشفة</div>
                                <div className="text-lg font-black text-slate-900 font-mono mt-1">٥ صفحات</div>
                                <div className="text-[9px] text-rose-500 font-bold mt-1">تحذير: لا تحتوي نو-أندكس</div>
                            </div>
                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                <div className="text-[10px] text-slate-400 font-bold">معدل سرعة الزحف</div>
                                <div className="text-lg font-black text-slate-900 font-mono mt-1">١.٢ ثانية</div>
                                <div className="text-[9px] text-emerald-600 font-bold mt-1">ممتاز (أقل من ثانيتين)</div>
                            </div>
                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                <div className="text-[10px] text-slate-400 font-bold">سلامة ملف الـ XML</div>
                                <div className="text-lg font-black text-slate-900 font-mono mt-1">١٠٠%</div>
                                <div className="text-[9px] text-emerald-600 font-bold mt-1">تمت المعالجة والفحص</div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-[11px] text-slate-400 leading-relaxed">تحليل حالة أرشفة روابط المتجر البرمجية واكتشاف أي ثغرات أو أخطاء تعيق زحف العناكب. انقر للتوسيع.</div>
                    )}
                </div>

                {/* 3. تحليلات الموقع */}
                <div 
                    onClick={() => setExpandedAnalytic(expandedAnalytic === 'site' ? null : 'site')}
                    className={cn(
                        "bg-white border p-6 rounded-[28px] shadow-sm cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-0.5",
                        expandedAnalytic === 'site' ? "md:col-span-2 border-black" : "border-slate-200/80"
                    )}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-100 text-black">
                                <Globe size={20} />
                            </div>
                            <div>
                                <h4 className="font-black text-slate-900 text-sm">تحليلات تفاعل الموقع</h4>
                                <span className="text-[9px] text-slate-400 font-medium">سلوك المستخدمين والزيارات العضوية</span>
                            </div>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-black border border-emerald-100">نشط</span>
                    </div>

                    {expandedAnalytic === 'site' ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100 animate-in" onClick={(e) => e.stopPropagation()}>
                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                <div className="text-[10px] text-slate-400 font-bold">الزيارات العضوية</div>
                                <div className="text-lg font-black text-slate-900 font-mono mt-1">٥.٢ ألف زيارة</div>
                                <div className="text-[9px] text-emerald-600 font-bold mt-1">▲ ١٠% زيادة تدريجية</div>
                            </div>
                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                <div className="text-[10px] text-slate-400 font-bold">معدل الارتداد (Bounce)</div>
                                <div className="text-lg font-black text-slate-900 font-mono mt-1">٣٨.٤%</div>
                                <div className="text-[9px] text-emerald-600 font-bold mt-1">▼ انخفاض (ممتاز جداً)</div>
                            </div>
                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                <div className="text-[10px] text-slate-400 font-bold">متوسط مدة الجلسة</div>
                                <div className="text-lg font-black text-slate-900 font-mono mt-1">٣:١٢ دقيقة</div>
                                <div className="text-[9px] text-emerald-600 font-bold mt-1">▲ زيادة ١٢ ثانية</div>
                            </div>
                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                <div className="text-[10px] text-slate-400 font-bold">أبرز صفحات الدخول</div>
                                <div className="text-lg font-black text-slate-900 font-mono mt-1">الرئيسية</div>
                                <div className="text-[9px] text-slate-400 font-medium mt-1">بنسبة ٤٥% من الزوار</div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-[11px] text-slate-400 leading-relaxed">مراقبة الزيارات والأنشطة العضوية داخل صفحات المتجر وسلوك المستخدمين (معدل الارتداد، ومدة الجلسة). انقر للتوسيع.</div>
                    )}
                </div>

                {/* 4. تحليلات المنافسين */}
                <div 
                    onClick={() => setExpandedAnalytic(expandedAnalytic === 'competitors' ? null : 'competitors')}
                    className={cn(
                        "bg-white border p-6 rounded-[28px] shadow-sm cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-0.5",
                        expandedAnalytic === 'competitors' ? "md:col-span-2 border-black" : "border-slate-200/80"
                    )}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-100 text-black">
                                <Share2 size={20} />
                            </div>
                            <div>
                                <h4 className="font-black text-slate-900 text-sm">تحليلات المنافسين الشاملة</h4>
                                <span className="text-[9px] text-slate-400 font-medium">الترتيب السوقي ومشاركة الكلمات</span>
                            </div>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-black border border-emerald-100">نشط</span>
                    </div>

                    {expandedAnalytic === 'competitors' ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100 animate-in" onClick={(e) => e.stopPropagation()}>
                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                <div className="text-[10px] text-slate-400 font-bold">المنافس الأول (متجر أ)</div>
                                <div className="text-lg font-black text-slate-900 font-mono mt-1">تداخل ٣٤%</div>
                                <div className="text-[9px] text-slate-400 font-medium mt-1">في الكلمات المفتاحية الرئيسية</div>
                            </div>
                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                <div className="text-[10px] text-slate-400 font-bold">المنافس الثاني (متجر ب)</div>
                                <div className="text-lg font-black text-slate-900 font-mono mt-1">تداخل ١٨%</div>
                                <div className="text-[9px] text-slate-400 font-medium mt-1">في كلمات القهوة الفاخرة</div>
                            </div>
                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                <div className="text-[10px] text-slate-400 font-bold">حجم الظهور السوقي</div>
                                <div className="text-lg font-black text-slate-900 font-mono mt-1">١٢.٨%</div>
                                <div className="text-[9px] text-emerald-600 font-bold mt-1">▲ نمو بمقدار ٢% هذا الشهر</div>
                            </div>
                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                <div className="text-[10px] text-slate-400 font-bold">فرص الكلمات المكتشفة</div>
                                <div className="text-lg font-black text-slate-900 font-mono mt-1">١٤ كلمة</div>
                                <div className="text-[9px] text-emerald-600 font-bold mt-1">صعوبة منخفضة - فرصة نمو</div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-[11px] text-slate-400 leading-relaxed">مقارنة كلمات متجرك المفتاحية ومستويات ظهورها العضوي مقابل المتاجر والمنشآت المنافسة في السوق. انقر للتوسيع.</div>
                    )}
                </div>

                {/* 5. تحليلات سبرينك فروع */}
                <div 
                    onClick={() => setExpandedAnalytic(expandedAnalytic === 'sprink' ? null : 'sprink')}
                    className={cn(
                        "bg-white border p-6 rounded-[28px] shadow-sm cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 md:col-span-2",
                        expandedAnalytic === 'sprink' ? "border-black" : "border-slate-200/80"
                    )}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-100 text-black">
                                <Activity size={20} />
                            </div>
                            <div>
                                <h4 className="font-black text-slate-900 text-sm">تحليلات سبرينك فروع (Local SEO)</h4>
                                <span className="text-[9px] text-slate-400 font-medium">نتائج وتفاعل خرائط قوقل للفروع الجغرافية</span>
                            </div>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-black border border-emerald-100">نشط</span>
                    </div>

                    {expandedAnalytic === 'sprink' ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100 animate-in" onClick={(e) => e.stopPropagation()}>
                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                <div className="text-[10px] text-slate-400 font-bold">زيارات خرائط جوجل الكلية</div>
                                <div className="text-lg font-black text-slate-900 font-mono mt-1">١.٨ ألف نقرة</div>
                                <div className="text-[9px] text-emerald-600 font-bold mt-1">▲ نمو ١٥% للفرع الرئيسي</div>
                            </div>
                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                <div className="text-[10px] text-slate-400 font-bold">طلبات الاتصال والاتجاهات</div>
                                <div className="text-lg font-black text-slate-900 font-mono mt-1">٣٤٢ اتصال</div>
                                <div className="text-[9px] text-emerald-600 font-bold mt-1">▲ ارتفاع بمعدل تفاعلي ممتاز</div>
                            </div>
                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                <div className="text-[10px] text-slate-400 font-bold">مراجعات العملاء الجدد</div>
                                <div className="text-lg font-black text-slate-900 font-mono mt-1">٤.٨ / ٥.٠</div>
                                <div className="text-[9px] text-emerald-600 font-bold mt-1">▲ تم حصد ٤٥ تقييم إيجابي</div>
                            </div>
                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                <div className="text-[10px] text-slate-400 font-bold">نسبة ظهور الفرع بالبحث</div>
                                <div className="text-lg font-black text-slate-900 font-mono mt-1">٧٤%</div>
                                <div className="text-[9px] text-emerald-600 font-bold mt-1">▲ تحسن هائل في الكلمات المحلية</div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-[11px] text-slate-400 leading-relaxed">تحليلات السيو المحلي (Local SEO) للفروع ونقاط البيع الجغرافية على خرائط جوجل، ومستويات الزحف والاتصال الجغرافي. انقر للتوسيع.</div>
                    )}
                </div>

            </div>
        </div>
    );
}
