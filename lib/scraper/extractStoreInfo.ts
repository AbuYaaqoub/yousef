import axios from 'axios';
import * as cheerio from 'cheerio';
import { StoreLead } from '@/types';

export async function extractFromHomepage(url: string): Promise<Partial<StoreLead>> {
    try {
        const { data } = await axios.get(url, {
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const $ = cheerio.load(data);

        // اسم المتجر
        const storeName = $('title').first().text().trim().split('|')[0].split('-')[0].trim() || $('meta[property="og:title"]').attr('content') || new URL(url).hostname;

        // إيميل
        let email = '';
        $('a[href^="mailto:"]').each((_: number, el: any) => {
            const href = $(el).attr('href');
            if (href) email = href.replace('mailto:', '');
        });
        if (!email) {
            const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
            const match = data.match(emailRegex);
            if (match) email = match[0];
        }

        // جوال
        let phone = '';
        $('a[href^="tel:"]').each((_: number, el: any) => {
            const href = $(el).attr('href');
            if (href) phone = href.replace('tel:', '');
        });
        if (!phone) {
            // بحث فائق الدقة عن الأرقام السعودية (جوال 10 أرقام، 9200 من 9 أرقام، 800 من 10 أرقام)
            const phoneRegex = /(?:\+?966|0)?(?:5[0-9]{8}|9200[0-9]{5}|800[0-9]{7}|1[1-7][0-9]{7})/g;
            const matches = data.match(phoneRegex);
            if (matches) {
                // اختيار الرقم الأطول والأكثر اكتمالاً
                const sorted = matches.sort((a: any, b: any) => b.length - a.length);
                phone = sorted[0];
            }
        }

        // وسائل التواصل
        const social = {
            whatsapp: '',
            instagram: '',
            tiktok: '',
            snapchat: '',
            twitter: '',
            facebook: '',
            youtube: ''
        };

        // استخراج الروابط من وسوم <a>
        $('a').each((_: number, el: any) => {
            let href = $(el).attr('href');
            if (!href || href === '#' || href.startsWith('javascript:')) return;

            if (href.startsWith('/')) {
                href = new URL(href, url).href;
            }

            const lowerHref = href.toLowerCase();

            if (lowerHref.includes('wa.me') || lowerHref.includes('whatsapp.com') || lowerHref.includes('api.whatsapp')) {
                const waMatch = href.match(/(?:phone=|send\?phone=|wa\.me\/|wa\.link\/)([0-9]+)/);
                if (waMatch) {
                    social.whatsapp = waMatch[1];
                    if (!phone) phone = waMatch[1];
                } else if (!social.whatsapp) {
                    social.whatsapp = href;
                }
            }
            else if (lowerHref.includes('instagram.com')) social.instagram = href;
            else if (lowerHref.includes('tiktok.com')) social.tiktok = href;
            else if (lowerHref.includes('snapchat.com') || lowerHref.includes('snap.com')) social.snapchat = href;
            else if (lowerHref.includes('twitter.com') || lowerHref.includes('x.com')) social.twitter = href;
            else if (lowerHref.includes('facebook.com') || lowerHref.includes('fb.com')) social.facebook = href;
            else if (lowerHref.includes('youtube.com') || lowerHref.includes('youtu.be')) social.youtube = href;
        });

        // استخراج الروابط من كود الـ JSON (كثيراً ما تستخدمه منصة سلة لتخزين الإعدادات)
        const socialPatterns = {
            instagram: /"instagram"\s*:\s*"([^"]+)"/i,
            twitter: /"twitter"\s*:\s*"([^"]+)"/i,
            facebook: /"facebook"\s*:\s*"([^"]+)"/i,
            youtube: /"youtube"\s*:\s*"([^"]+)"/i,
            tiktok: /"tiktok"\s*:\s*"([^"]+)"/i,
            snapchat: /"snapchat"\s*:\s*"([^"]+)"/i,
            whatsapp: /"whatsapp"\s*:\s*"([^"]+)"/i
        };

        Object.entries(socialPatterns).forEach(([platform, pattern]) => {
            if (!(social as any)[platform]) {
                const match = data.match(pattern);
                if (match) {
                    let extracted = match[1].replace(/\\/g, ''); // تنظيف الروابط من الـ backslashes
                    (social as any)[platform] = extracted;
                }
            }
        });

        // تنظيف رقم الهاتف من أي رموز زائدة لضمان العرض الصحيح
        if (phone) {
            phone = phone.replace(/[^\d+]/g, '');
        }

        return {
            storeName,
            domain: url,
            email,
            phone,
            ...social
        };
    } catch (error) {
        console.error(`Failed to extract from ${url}:`, error);
        return { domain: url, storeName: 'فشل الاستخراج' };
    }
}