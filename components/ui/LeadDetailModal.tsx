'use client';

import { useState } from 'react';
import { X, Mail, Phone, ExternalLink, Copy, Check, Globe } from 'lucide-react';
import { ActionButton } from '../ui/ActionButton';
import { SocialIcon } from '../ui/SocialIcon';
import { cn } from '@/lib/utils';

interface LeadDetail {
    storeName: string;
    domain?: string;
    email?: string;
    phone?: string;
    whatsapp?: string;
    instagram?: string;
    tiktok?: string;
    snapchat?: string;
    twitter?: string;
    facebook?: string;
    youtube?: string;
    rating: string;
    description?: string;
}

interface LeadDetailModalProps {
    lead: LeadDetail | null;
    onClose: () => void;
}

export function LeadDetailModal({ lead, onClose }: LeadDetailModalProps) {
    const [copied, setCopied] = useState<string | null>(null);
    const [notes, setNotes] = useState(lead?.description || '');

    if (!lead) return null;

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const socialPlatforms = [
        { key: 'whatsapp', label: 'WhatsApp', color: 'emerald' as const },
        { key: 'instagram', label: 'Instagram', color: 'pink' as const },
        { key: 'tiktok', label: 'TikTok', color: 'slate' as const },
        { key: 'snapchat', label: 'Snapchat', color: 'yellow' as const },
        { key: 'twitter', label: 'Twitter', color: 'sky' as const },
        { key: 'facebook', label: 'Facebook', color: 'blue' as const },
        { key: 'youtube', label: 'YouTube', color: 'red' as const },
    ].filter(p => lead[p.key as keyof LeadDetail]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white rounded-[32px] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex items-center justify-between rounded-t-[32px]">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center text-white font-bold text-2xl border border-zinc-900">
                            {lead.storeName?.[0] || 'S'}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">{lead.storeName}</h2>
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mt-1 ${
                                lead.rating === '🟢 قوي' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                lead.rating === '🟡 متوسط' ? 'bg-yellow-50 text-yellow-600 border border-yellow-100' :
                                'bg-rose-50 text-rose-600 border border-rose-100'
                            }`}>
                                {lead.rating}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Website */}
                    {lead.domain && (
                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                            <div className="flex items-center gap-3 mb-3">
                                <Globe size={18} className="text-slate-400" />
                                <span className="text-sm font-bold text-slate-700">الموقع الإلكتروني</span>
                            </div>
                            <a
                                href={lead.domain.startsWith('http') ? lead.domain : `https://${lead.domain}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-black hover:text-zinc-800 underline font-bold transition-colors"
                            >
                                {lead.domain.replace(/^https?:\/\//, '')}
                                <ExternalLink size={16} />
                            </a>
                        </div>
                    )}

                    {/* Contact Info */}
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                        <div className="flex items-center gap-3 mb-4">
                            <Mail size={18} className="text-slate-400" />
                            <span className="text-sm font-bold text-slate-700">بيانات الاتصال</span>
                        </div>
                        <div className="space-y-3">
                            {lead.email && (
                                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 group hover:border-black transition-colors">
                                    <Mail size={16} className="text-slate-400" />
                                    <span className="text-slate-700 font-mono text-sm flex-1 truncate">{lead.email}</span>
                                    <button
                                        onClick={() => copyToClipboard(lead.email!, 'email')}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-slate-50 rounded-lg"
                                    >
                                        {copied === 'email' ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} className="text-slate-400" />}
                                    </button>
                                </div>
                            )}
                            {lead.phone && (
                                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 group hover:border-black transition-colors">
                                    <Phone size={16} className="text-slate-400" />
                                    <span className="text-slate-700 font-mono text-sm" dir="ltr">{lead.phone}</span>
                                    <button
                                        onClick={() => copyToClipboard(lead.phone!, 'phone')}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-slate-50 rounded-lg"
                                    >
                                        {copied === 'phone' ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} className="text-slate-400" />}
                                    </button>
                                </div>
                            )}
                            {!lead.email && !lead.phone && (
                                <p className="text-slate-400 text-sm text-center py-4">لا توجد بيانات اتصال</p>
                            )}
                        </div>
                    </div>

                    {/* Social Media */}
                    {socialPlatforms.length > 0 && (
                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                            <div className="flex items-center gap-3 mb-4">
                                <Globe size={18} className="text-slate-400" />
                                <span className="text-sm font-bold text-slate-700">التواصل الاجتماعي</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {socialPlatforms.map((platform) => (
                                    <SocialIcon
                                        key={platform.key}
                                        href={lead[platform.key as keyof LeadDetail] as string}
                                        color={platform.color}
                                        label={platform.label}
                                        size="md"
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                        <div className="flex items-center gap-3 mb-3">
                            <Mail size={18} className="text-slate-400" />
                            <span className="text-sm font-bold text-slate-700">ملاحظات</span>
                        </div>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="أضف ملاحظات حول هذا المتجر..."
                            className="w-full bg-white border border-slate-200 rounded-xl p-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all min-h-[100px] text-sm"
                        />
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="sticky bottom-0 bg-white border-t border-slate-100 p-6 flex items-center justify-end gap-3 rounded-b-[32px]">
                    <ActionButton onClick={onClose} variant="ghost" label="إغلاق" />
                    <ActionButton
                        variant="primary"
                        icon={<ExternalLink size={18} />}
                        label="زيارة الموقع"
                        onClick={() => window.open(lead.domain?.startsWith('http') ? lead.domain : `https://${lead.domain}`, '_blank')}
                        disabled={!lead.domain}
                    />
                </div>
            </div>
        </div>
    );
}
