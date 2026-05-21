export interface StoreLead {
    storeName: string;
    domain: string;
    email: string;
    phone: string;
    whatsapp: string;
    instagram: string;
    tiktok: string;
    snapchat: string;
    twitter: string;
    facebook: string;
    youtube: string;
    rating: '🟢 قوي' | '🟡 متوسط' | '🔴 ضعيف';
}

export interface ScrapeJob {
    id: string;
    status: 'pending' | 'running' | 'completed' | 'cancelled';
    results: StoreLead[];
    failedUrls: string[];
    startTime: number;
}