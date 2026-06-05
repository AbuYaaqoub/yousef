-- =====================================================================
-- SallaHunter Pro (Naqeeb) - Complete Database Schema Setup
-- =====================================================================
-- قم بنسخ هذا السكربت بالكامل ولصقه في Supabase SQL Editor وتشغيله (Run)
-- سيقوم بإنشاء جميع الجداول والربط والفهارس لتشغيل النظام بالكامل سحابياً.

-- تفعيل ملحق توليد معرّفات UUID تلقائياً
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. جدول استخبارات المتاجر والعملاء المكتشفين (leads)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_name TEXT NOT NULL,
    store_url TEXT NOT NULL,
    website TEXT,
    email TEXT,
    phone TEXT,
    rating TEXT DEFAULT '🟡 متوسط',
    source TEXT NOT NULL, -- 'mahally', 'mazeed', 'maps'
    category TEXT NOT NULL, -- الكلمة البحثية أو التصنيف
    sub_text TEXT DEFAULT '',
    whatsapp TEXT DEFAULT '',
    instagram TEXT DEFAULT '',
    tiktok TEXT DEFAULT '',
    snapchat TEXT DEFAULT '',
    twitter TEXT DEFAULT '',
    facebook TEXT DEFAULT '',
    youtube TEXT DEFAULT '',
    is_enriched BOOLEAN DEFAULT FALSE,
    mahally_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- قيد فريد لمنع تكرار نفس المتجر داخل نفس ورقة العمل (الفئة البحثية)
    CONSTRAINT unique_store_url_category UNIQUE (store_url, category)
);

-- ==========================================
-- 2. جدول سجل عمليات الكشط التاريخي (scraping_history)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.scraping_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL, -- 'Mahally', 'Mazeed', 'Google Maps'
    query TEXT NOT NULL, -- الكلمة التي تم البحث عنها
    results_count INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'processing', -- 'processing', 'completed', 'failed'
    error_message TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. جدول عملاء السيو النشطين (seo_clients)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.seo_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    website TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 4. جدول قاعدة الكلمات المفتاحية المقترحة (seo_keywords_database)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.seo_keywords_database (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.seo_clients(id) ON DELETE CASCADE,
    keyword TEXT NOT NULL,
    kd INTEGER DEFAULT 0,
    volume INTEGER DEFAULT 0,
    platform TEXT NOT NULL, -- 'ahrefs', 'semrush', 'moz'
    source_site TEXT,
    quotation_results INTEGER DEFAULT NULL,
    allinurl_results INTEGER DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 5. جدول الكلمات النشطة والمستهدفة للعميل (seo_client_keywords)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.seo_client_keywords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.seo_clients(id) ON DELETE CASCADE,
    keyword TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'review', -- 'used', 'changed', 'review'
    location TEXT NOT NULL, -- مكان التواجد (مثال: الصفحة الرئيسية)
    review_due_at TIMESTAMPTZ NOT NULL, -- موعد المراجعة القادمة
    page_url TEXT DEFAULT '', -- رابط الصفحة الفعلي للكلمة
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 6. جدول سجلات التعديل ومراحل تحسين العمل (seo_improvement_logs)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.seo_improvement_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.seo_clients(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- إنشاء فهارس (Indexes) لضمان سرعة فائقة في استعلام البيانات
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_leads_source ON public.leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_category ON public.leads(category);
CREATE INDEX IF NOT EXISTS idx_leads_is_enriched ON public.leads(is_enriched);
CREATE INDEX IF NOT EXISTS idx_seo_keywords_client ON public.seo_keywords_database(client_id);
CREATE INDEX IF NOT EXISTS idx_seo_client_keywords_client ON public.seo_client_keywords(client_id);
CREATE INDEX IF NOT EXISTS idx_seo_improvement_logs_client ON public.seo_improvement_logs(client_id);

-- =====================================================================
-- تفعيل سياسات الأمان والوصول العام للجداول (Row Level Security - RLS)
-- لتبسيط التطوير وتجنب مشاكل الصلاحيات، سنقوم بالسماح بالقراءة والكتابة
-- =====================================================================
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraping_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_keywords_database ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_client_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_improvement_logs ENABLE ROW LEVEL SECURITY;

-- سياسات الوصول غير المقيد (يمكنك تشديدها لاحقاً بالإنتاج)
CREATE POLICY "Allow anonymous read access" ON public.leads FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access" ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.leads FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.leads FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read access" ON public.scraping_history FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access" ON public.scraping_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.scraping_history FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.scraping_history FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read access" ON public.seo_clients FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access" ON public.seo_clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.seo_clients FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.seo_clients FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read access" ON public.seo_keywords_database FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access" ON public.seo_keywords_database FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.seo_keywords_database FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.seo_keywords_database FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read access" ON public.seo_client_keywords FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access" ON public.seo_client_keywords FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.seo_client_keywords FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.seo_client_keywords FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read access" ON public.seo_improvement_logs FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access" ON public.seo_improvement_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.seo_improvement_logs FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.seo_improvement_logs FOR DELETE USING (true);

-- ==========================================
-- 7. جدول التصنيفات المخصصة (custom_categories)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.custom_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    keywords TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- للتأكد من إضافة عمود الكلمات المفتاحية في حال كان الجدول منشأً مسبقاً
ALTER TABLE public.custom_categories ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT '{}';

-- فهارس لضمان السرعة في الاستعلام والتحقق
CREATE INDEX IF NOT EXISTS idx_custom_categories_name ON public.custom_categories(name);

-- تفعيل سياسات الوصول
ALTER TABLE public.custom_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read access" ON public.custom_categories FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access" ON public.custom_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.custom_categories FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.custom_categories FOR DELETE USING (true);

-- ==========================================
-- تعديل هيكلية الجداول القائمة مسبقاً لإضافة أعمدة نتائج البحث المتقدم
-- ==========================================
ALTER TABLE public.seo_keywords_database ADD COLUMN IF NOT EXISTS quotation_results INTEGER DEFAULT NULL;
ALTER TABLE public.seo_keywords_database ADD COLUMN IF NOT EXISTS allinurl_results INTEGER DEFAULT NULL;


