'use client';

import { useState } from 'react';
import { Settings, Globe, Mail, Database, Bell, Shield, Save } from 'lucide-react';
import { ActionButton } from '@/components/ui/ActionButton';

export default function SettingsPage() {
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">الإعدادات</h1>
                <p className="text-slate-500 text-sm font-medium">إعدادات النظام والحساب</p>
            </div>

            {/* Settings Sections */}
            <div className="space-y-6">
                {/* API Keys */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900/5 flex items-center justify-center text-slate-900">
                            <Globe size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">مفاتيح API</h3>
                            <p className="text-slate-500 text-xs">إعدادات الخدمات الخارجية</p>
                        </div>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                Serper.dev API Key
                            </label>
                            <input
                                type="password"
                                defaultValue="sk_xxxxxxxxxxxxxxxxxxxx"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all text-sm font-mono"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                Google Sheets Client Email
                            </label>
                            <input
                                type="text"
                                defaultValue="your-service@project.iam.gserviceaccount.com"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all text-sm font-mono"
                            />
                        </div>
                    </div>
                </div>

                {/* Export Settings */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900/5 flex items-center justify-center text-slate-900">
                            <Database size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">التصدير</h3>
                            <p className="text-slate-500 text-xs">إعدادات ملفات Excel</p>
                        </div>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                مجلد التصدير الافتراضي
                            </label>
                            <input
                                type="text"
                                defaultValue="C:\Users\PCD\Downloads"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all text-sm"
                            />
                        </div>
                        <div className="flex items-center justify-between py-3">
                            <div>
                                <div className="text-sm font-bold text-slate-900 mb-1">حفظ تلقائي لـ Google Sheets</div>
                                <div className="text-xs text-slate-500">مزامنة النتائج تلقائياً</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-zinc-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900/5 flex items-center justify-center text-slate-900">
                            <Bell size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">الإشعارات</h3>
                            <p className="text-slate-500 text-xs">تنبيهات النظام</p>
                        </div>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between py-2">
                            <div>
                                <div className="text-sm font-bold text-slate-900">إشعارات إكمال المهمة</div>
                                <div className="text-xs text-slate-500">عند انتهاء الاستخراج</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-zinc-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                            </label>
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <div>
                                <div className="text-sm font-bold text-slate-900">تنبيهات الأخطاء</div>
                                <div className="text-xs text-slate-500">عند فشل الاستخراج</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-zinc-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="mt-8 flex items-center justify-end gap-3">
                {saved && (
                    <div className="text-emerald-600 text-sm font-bold flex items-center gap-2">
                        <span>تم الحفظ بنجاح!</span>
                    </div>
                )}
                <ActionButton
                    onClick={handleSave}
                    variant="primary"
                    icon={<Save size={18} />}
                    label="حفظ التغييرات"
                    size="md"
                />
            </div>
        </div>
    );
}
