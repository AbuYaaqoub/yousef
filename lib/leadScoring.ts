import { StoreLead } from '@/types';

export function calculateRating(lead: Partial<StoreLead>): StoreLead['rating'] {
    let score = 0;
    if (lead.email) score++;
    if (lead.phone) score++;
    if (lead.whatsapp) score++;
    if (lead.instagram) score++;
    if (lead.tiktok) score++;
    if (lead.snapchat) score++;
    if (lead.twitter) score++;

    if (score >= 3) return '🟢 قوي';
    if (score >= 1) return '🟡 متوسط';
    return '🔴 ضعيف';
}