import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-dont-crash-on-build.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key-to-prevent-build-crash';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
  console.warn(
    '⚠️ Supabase environment variables are missing! ' +
    'Please add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) to your .env file.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// دالة الكشف التلقائي عن التصنيف بناءً على الكلمة المفتاحية المستعملة في البحث
export async function autoDetectCategory(query: string, defaultCategory: string): Promise<string> {
  try {
    if (!query) return defaultCategory;
    const cleanQuery = query.trim().toLowerCase();
    
    const { data: customCats, error } = await supabase
      .from('custom_categories')
      .select('name, keywords');

    if (!error && customCats && customCats.length > 0) {
      for (const cat of customCats) {
        if (cat.keywords && Array.isArray(cat.keywords)) {
          const hasMatch = cat.keywords.some((kw: string) => 
            kw.trim().toLowerCase() === cleanQuery
          );
          if (hasMatch) {
            return cat.name; // العثور على تصنيف يحتوي الكلمة الدلالية
          }
        }
      }
    }
  } catch (e) {
    console.error('Failed to auto-detect category:', e);
  }
  return defaultCategory;
}
