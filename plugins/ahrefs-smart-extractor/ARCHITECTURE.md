# عمارة المشروع 🏗️

## نظرة عامة

```
Ahrefs Smart Extractor
    │
    ├── Content Script (src/content/)
    │   └── يعمل على صفحة Ahrefs مباشرة
    │       ├── كشف الجداول
    │       ├── استخراج البيانات
    │       └── تنظيف المعلومات
    │
    ├── UI Layer (src/ui/)
    │   └── واجهة المستخدم React
    │       ├── زر عائم
    │       ├── مختار أعمدة
    │       └── نافذة معاينة
    │
    ├── Background Service (src/background/)
    │   └── معالجة الرسائل
    │
    └── Popup (src/popup.tsx)
        └── نافذة الإعدادات
```

## دورة الحياة 🔄

### 1. عند فتح صفحة Ahrefs:

```
Chrome loads page
    ↓
Manifest loads content script
    ↓
content/index.ts موجود ويستمع للرسائل
    ↓
Hotkeys وFloating Panel جاهزة
```

### 2. عند الضغط على "استخراج البيانات":

```
User clicks Extract
    ↓
Send message from UI → content script
    ↓
detectTable() - البحث عن الجدول
    ↓
extractRows() - استخراج الصفوف
    ↓
extractLinks() - استخراج الروابط
    ↓
extractTooltips() - قراءة القيم الحقيقية
    ↓
cleanData() - تنظيف البيانات
    ↓
Return data to UI
    ↓
Show ColumnSelector
```

### 3. عند الضغط على "نسخ إلى Excel":

```
User selects columns and clicks Copy
    ↓
convertToExcelFormat() - تحويل البيانات
    ↓
copyToClipboard() - نسخ إلى الحافظة
    ↓
showNotification() - رسالة تأكيد
    ↓
Show PreviewModal
    ↓
User pastes in Excel
```

## الملفات الرئيسية 📄

### `src/content/` - معالجة البيانات

#### **detectTable.ts**
الدور: اكتشاف الجداول على الصفحة

```typescript
detectTable(): TableElement | null
  ├─ البحث عن <table>
  ├─ البحث عن [role="table"]
  └─ البحث عن [role="grid"]

detectTableBySemantic(): TableElement | null
  └─ محاولة احتياطية أكثر ذكاءً
```

#### **extractRows.ts**
الدور: استخراج الصفوف والخلايا

```typescript
extractRows(table, headers, options)
  ├─ البحث عن tbody tr
  ├─ استخراج td من كل صف
  ├─ الربط بين الخلايا والرؤوس
  └─ إرجاع مصفوفة من الكائنات

extractVisibleRows(table, headers)
  └─ استخراج الصفوف المرئية فقط
```

#### **extractTooltips.ts**
الدور: قراءة القيم الحقيقية من Tooltip

```typescript
extractTooltipValue(element)
  ├─ البحث عن aria-label
  ├─ البحث عن data-tooltip
  ├─ البحث عن title
  └─ البحث عن hidden spans

getTooltipMap(element)
  └─ إرجاع خريطة بجميع Tooltips
```

**مثال عملي:**
```
الجدول يعرض: "1.2K"
Tooltip يحتوي: "1247"
الإضافة تأخذ: "1247" ✓
```

#### **extractLinks.ts**
الدور: استخراج الروابط من الجدول

```typescript
extractLinks(tableElement)
  └─ إرجاع Map من الروابط

extractUrlFromCell(cell)
  ├─ البحث عن <a href>
  ├─ البحث عن data-href
  └─ البحث عن onclick مع URL

getLinksFromRows(rows)
  └─ روابط منظمة حسب الصفوف
```

#### **cleanData.ts**
الدور: تنظيف وتطبيع البيانات

```typescript
cleanData(data)
  ├─ تنظيف المفاتيح
  ├─ تنظيف القيم
  └─ دعم النصوص العربية

removeEmpty(data)
  └─ إزالة الصفوف الفارغة

removeDuplicates(data)
  └─ إزالة الصفوف المكررة

normalizeData(data, options)
  └─ تطبيق جميع التنظيفات
```

#### **copyToClipboard.ts**
الدور: نسخ البيانات

```typescript
copyToClipboard(text)
  └─ نسخ نص إلى الحافظة

convertToExcelFormat(data, columns)
  └─ تحويل إلى TSV (Excel)

copyDataAsExcel(data, columns)
  └─ نسخ مباشر Excel

downloadAsExcel(data, filename, columns)
  └─ تنزيل ملف XLSX
```

#### **index.ts**
الدور: نقطة الدخول

```typescript
chrome.runtime.onMessage
  ├─ EXTRACT_TABLE → handleExtractTable()
  ├─ COPY_EXCEL → handleCopyExcel()
  └─ Hotkeys (Alt+C, Alt+X)

Hotkeys Handler
  ├─ Alt+C → نسخ سريع
  └─ Alt+X → فتح اللوحة
```

### `src/ui/` - واجهة المستخدم

#### **FloatingPanel.tsx**
الدور: الزر العائم واللوحة الجانبية

```
أيقونة عائمة (أسفل الشاشة)
    ↓
عند النقر:
├─ استخراج البيانات
├─ نسخ Excel
├─ اختيار الأعمدة
└─ إعدادات
```

#### **ColumnSelector.tsx**
الدور: اختيار الأعمدة

```
قائمة checkboxes
├─ اختيار الكل
├─ إلغاء الكل
└─ اختيار منفرد

زر تأكيد عند الانتهاء
```

#### **PreviewModal.tsx**
الدور: معاينة البيانات

```
جدول بالبيانات المستخرجة
├─ تصفح الصفحات
├─ عداد الصفوف
└─ زر إغلاق
```

#### **index.tsx**
الدور: منطق UI الرئيسي

```typescript
ExtensionUI
├─ استقبال الرسائل من content script
├─ إدارة الحالة (state)
├─ عرض/إخفاء المكونات
└─ معالجة الأخطاء
```

### `src/background/` - خادم الخلفية

#### **index.ts**
الدور: معالجة الرسائل

```typescript
chrome.runtime.onMessage
├─ DATA_EXTRACTED
├─ COPY_TO_CLIPBOARD
├─ GET_STORAGE
└─ SET_STORAGE

chrome.runtime.onInstalled
└─ تعيين الإعدادات الافتراضية
```

### `src/utils/` - الدوال المساعدة

#### **translations.ts**
الدور: الترجمات

```typescript
translations = {
  ar: { ... },  // العربية
  en: { ... }   // الإنجليزية
}

t(language, key) // دالة الترجمة
```

## تدفق البيانات 🌊

### السيناريو: نسخ جدول إلى Excel

```
1. صفحة Ahrefs تحتوي على جدول
   
2. المستخدم يضغط Alt+C
   ↓
3. content/index.ts ستمع للحدث
   ↓
4. handleCopyExcel() يتم استدعاؤه
   ├─ detectTable() - البحث عن الجدول
   ├─ extractRows() - استخراج الصفوف
   ├─ extractTooltips() - قراءة القيم الحقيقية
   ├─ cleanData() - تنظيف البيانات
   └─ copyDataAsExcel() - نسخ للحافظة
   ↓
5. notification تظهر "تم النسخ"
   ↓
6. المستخدم يلصق في Excel
   ↓
7. البيانات منسقة تماماً ✓
```

### المتغيرات (State)

#### في Content Script:
```typescript
- tableElement: HTMLElement
- extractedData: ExtractedData
- tooltips: Map<string, string>
- links: Map<string, string>
```

#### في UI:
```typescript
- language: 'ar' | 'en'
- extractedData: ExtractedData | null
- selectedColumns: string[]
- loading: boolean
- showColumnSelector: boolean
- showPreview: boolean
```

#### في Storage:
```typescript
{
  language: 'ar' | 'en',
  includeLinks: boolean,
  includeTooltips: boolean,
  removeEmpty: boolean,
  removeDuplicates: boolean
}
```

## الخيوط (Threads)

```
Main Thread (صفحة Ahrefs)
    ├─ Content Script (معزول)
    │   └─ يعمل في context الصفحة
    │
    ├─ Background Service Worker (منفصل)
    │   └─ لا يوقف عند إغلاق popup
    │
    └─ Popup Process (منفصل)
        └─ الواجهة الجانبية
```

## الأمان 🔒

```
Content Script
├─ له وصول مباشر إلى DOM
├─ معزول عن الصفحة الأصلية
└─ لا يستطيع الوصول إلى window

Popup/UI
├─ له صلاحيات الإضافة
├─ يمكنه القراءة من Storage
└─ يمكنه إرسال رسائل للـ content

الصفحة الأصلية
└─ لا تعرف بوجود الإضافة
```

## التوسعات المستقبلية 🚀

### بنية ready للميزات الجديدة:

```
src/content/
├── existing files
├── exportToGoogleSheets.ts    // ستكون هنا قريباً
├── autoScrapeMultiPages.ts    // ستكون هنا قريباً
└── aiAnalyzer.ts              // ستكون هنا قريباً

src/ui/
├── existing files
├── GoogleSheetsModal.tsx       // ستكون هنا قريباً
└── AutoScrapingPanel.tsx       // ستكون هنا قريباً
```

## الملفات الإضافية 📚

```
manifest.config.ts
├─ permissions المطلوبة
├─ host_permissions (Ahrefs)
└─ icons والمعلومات

package.json
├─ المكتبات (dependencies)
├─ أوامر npm
└─ metadata

tsconfig.json
├─ إعدادات TypeScript
├─ المسارات المختصرة
└─ strict mode
```

---

**ملاحظة:** هذه العمارة مصممة للتوسع والصيانة السهلة. يمكنك إضافة ميزات جديدة بسهولة باتباع نفس النمط!
