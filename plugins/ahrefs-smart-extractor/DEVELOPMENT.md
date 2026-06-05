# دليل التطوير 🛠️

## متطلبات التطوير

- Node.js 16+
- npm أو yarn
- Chrome/Chromium browser
- VSCode (موصى به)

## الإعداد الأولي

```bash
# استنساخ المستودع
git clone https://github.com/yourusername/ahrefs-smart-extractor.git
cd ahrefs-smart-extractor

# تثبيت الاعتماديات
npm install

# تشغيل خادم التطوير
npm run dev
```

## بنية المشروع

### `src/content/`
الملفات التي تعمل مباشرة على صفحة Ahrefs:
- **detectTable.ts** - كشف الجداول باستخدام:
  - `<table>` العناصر التقليدية
  - `[role="table"]` و `[role="grid"]`
  - عناصر div مخصصة

- **extractRows.ts** - استخراج الصفوف من الجدول
- **extractTooltips.ts** - قراءة القيم الحقيقية من:
  - `aria-label` 
  - `data-tooltip`
  - `title` attributes
  - عناصر مخفية

- **extractLinks.ts** - استخراج الروابط من الخلايا
- **cleanData.ts** - تنظيف البيانات:
  - إزالة المسافات الزائدة
  - توحيد النصوص
  - إزالة HTML entities

- **copyToClipboard.ts** - نسخ البيانات إلى Clipboard و Excel

### `src/ui/`
واجهة المستخدم:
- **FloatingPanel.tsx** - الزر العائم واللوحة الجانبية
- **ColumnSelector.tsx** - اختيار الأعمدة
- **PreviewModal.tsx** - معاينة البيانات
- **index.tsx** - منطق UI الرئيسي

### `src/background/`
خادم الخلفية:
- **index.ts** - معالجة الرسائل بين Content Scripts و Popup

### `src/types/`
أنواع TypeScript المشتركة

### `src/utils/`
دوال مساعدة:
- **translations.ts** - الترجمات العربية والإنجليزية

## تدفق البيانات 📊

```
Content Script (page) 
    ↓
Detect Table → Extract Rows → Extract Links → Extract Tooltips
    ↓
Clean Data → Remove Duplicates → Normalize
    ↓
Send to UI/Popup
    ↓
Column Selector → Preview Modal → Copy to Clipboard
    ↓
Excel Ready ✓
```

## كيفية إضافة ميزة جديدة

### مثال: إضافة استخراج البيانات الوصفية

1. أنشئ ملف جديد في `src/content/`:
```typescript
// src/content/extractMetadata.ts
export const extractMetadata = (table: HTMLElement) => {
  // تنفيذك هنا
};
```

2. استخدمه في `src/content/index.ts`:
```typescript
import { extractMetadata } from './extractMetadata';

async function handleExtractTable(options: any) {
  // ... الكود الموجود ...
  const metadata = extractMetadata(table);
  // أضف metadata إلى النتيجة
}
```

3. مرر البيانات إلى UI إذا لزم الأمر

## اختبار الإضافة 🧪

### 1. في وضع التطوير:
```bash
npm run dev
```

ثم:
1. افتح `chrome://extensions/`
2. فعّل "وضع المطور"
3. انقر "تحميل امتداد معطّل"
4. اختر مجلد `build/`
5. تحديث تلقائي عند حفظ الملفات

### 2. الاختبار اليدوي:
1. انتقل إلى صفحة Ahrefs بها جدول
2. اضغط Alt+C للنسخ السريع
3. تحقق من البيانات في الـ Console

### 3. الاختبار عبر الـ Console:
```javascript
// في console صفحة Ahrefs
chrome.runtime.sendMessage(
  { type: 'EXTRACT_TABLE', payload: { includeLinks: true } },
  console.log
);
```

## تصحيح الأخطاء 🐛

### عرض السجلات:
1. انقر بزر الماوس الأيمن على صفحة Ahrefs
2. اختر "فحص" → "Console"
3. شاهد رسائل السجل

### تتبع الرسائل:
```typescript
// في Content Script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('وردت رسالة:', message);
  // ...
});
```

## الممارسات الجيدة 👍

### 1. البحث الذكي عن العناصر
❌ تجنب:
```typescript
document.querySelector('.ahrefs-row-123'); // قد يتغير في المستقبل
```

✅ استخدم:
```typescript
document.querySelector('[role="row"]'); // أكثر استقراراً
```

### 2. معالجة الأخطاء
```typescript
try {
  const table = detectTable();
  if (!table) throw new Error('لم يتم العثور على جدول');
  // ...
} catch (error) {
  console.error('خطأ:', error);
  sendResponse({ error: error.message });
}
```

### 3. دعم العربية
```typescript
// استخدم translations.ts دائماً
import { t } from '~utils/translations';
const message = t(language, 'copied');
```

## الأداء ⚡

### نصائح التحسين:
1. تجنب loops متداخلة عند معالجة الجداول الكبيرة
2. استخدم `Set` بدلاً من `Array` للتحقق من المكررات
3. استخدم `requestAnimationFrame` للعمليات الثقيلة

### المراقبة:
```javascript
// قياس وقت الاستخراج
console.time('extraction');
const data = extractRows(...);
console.timeEnd('extraction');
```

## الإصدار والنشر 🚀

### إنشاء build للإنتاج:
```bash
npm run build
```

### إنشاء ZIP للنشر:
```bash
npm run package
# سينتج: dist.zip
```

### قائمة التحقق قبل النشر:
- [ ] تحديث رقم الإصدار في `package.json`
- [ ] تحديث `CHANGELOG.md`
- [ ] اختبار جميع الميزات
- [ ] التحقق من عدم وجود أخطاء في Console
- [ ] اختبار على Ahrefs الحقيقية

## الموارد المفيدة 📚

- [Chrome Extensions Documentation](https://developer.chrome.com/docs/extensions/)
- [WebAPIs - DOM](https://developer.mozilla.org/en-US/docs/Web/API)
- [React Hooks Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## الأسئلة الشائعة ❓

### س: لماذا استخدام Content Script؟
ج: للوصول المباشر إلى DOM وعدم مواجهة مشاكل CORS

### س: هل تدعم Ahrefs الكلاسيكية والجديدة؟
ج: نعم! نستخدم محددات ذكية تعمل مع الإصدارات المختلفة

### س: هل تحفظ البيانات؟
ج: لا، البيانات تبقى في الذاكرة فقط ولا تُحفظ على أي خادم

---

شكراً لمساهمتك! 🙏
