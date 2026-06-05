# نقيب (Naqeeb) - نظام التنقيب واستخراج البيانات الذكي

## متطلبات التشغيل
- Node.js 18+
- حساب Google Cloud (لـ Custom Search API و Sheets API)

## الخطوات

1. **نسخ المشروع وتثبيت الحزم**
```bash
npm install
```

2. **إعداد المتغيرات البيئية**
انسخ ملف `.env.local.example` إلى `.env.local` وأضف مفاتيحك:
```env
# Google Custom Search API (مجاني 100 طلب/يوم)
GOOGLE_SEARCH_API_KEY=your_api_key
GOOGLE_SEARCH_CX=your_search_engine_id

# Google Sheets (Service Account)
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
SPREADSHEET_ID=optional_if_you_want_to_write_to_existing_sheet
```

3. **تشغيل التطبيق**
```bash
npm run dev
```
افتح [http://localhost:3000](http://localhost:3000) في المتصفح.

## كيفية العمل
1. يضغط المستخدم على "Start".
2. يبحث النظام عن آخر متاجر سلة في جوجل.
3. يزور كل متجر ويستخرج البيانات تلقائياً (الهاتف، الإيميل، السوشيال ميديا).
4. يحسب تقييم جودة المتجر (🟢 قوي / 🟡 متوسط / 🔴 ضعيف).
5. يحفظ النتائج في Google Sheets.

## الميزات
- ⚡ **بحث سريع**: استخدام Google Custom Search API.
- 🎯 **استخراج ذكي**: البحث عن بيانات الاتصال في الصفحة الرئيسية.
- 🧠 **تقييم تلقائي**: تحليل جودة الفرصة.
- 🗄️ **حفظ مباشر**: حفظ النتائج في جوجل شيتس (اختياري).
- 💾 **تصدير Excel**: تحميل النتائج كملف Excel.

## ملاحظات
- المجاني: 100 طلب/يوم في Google Search.
- مدة البحث: ~2-3 دقائق للمجموعة الكاملة.# new_yousef
