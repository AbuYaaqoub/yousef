# SEMrush Smart Copier 🚀

إضافة Chrome تتيح نسخ جداول SEMrush مباشرةً إلى Excel بضغطة واحدة.

---

## المميزات

- **نسخ فوري** بضغط `Alt + C` أو زر "نسخ الجدول"
- **استخراج الروابط** بشكل نظيف بدون tracking parameters
- **استخراج Tooltip Values** — القيم المخفية داخل tooltips وaria-labels
- **تنسيق TSV** جاهز للصق في Excel مباشرةً
- **اختيار الأعمدة** المراد نسخها
- **تنظيف البيانات** تلقائياً (إزالة التكرار والمسافات الزائدة)
- **دعم العربية والإنجليزية**
- **Dark Mode** متوافق مع تصميم SEMrush

---

## طريقة التثبيت

### الطريقة السريعة (Developer Mode)

1. افتح Google Chrome
2. اذهب إلى: `chrome://extensions/`
3. فعّل **Developer Mode** (زاوية اليمين أعلى)
4. اضغط **Load unpacked**
5. اختر مجلد `semrush-smart-copier`
6. ✅ الإضافة جاهزة!

---

## طريقة الاستخدام

1. افتح [SEMrush](https://www.semrush.com)
2. اذهب إلى أي صفحة تحتوي على جدول (Organic Research, Keywords, Competitors...)
3. اضغط `Alt + C` **أو** انقر زر **"نسخ الجدول"** في الزاوية اليمنى السفلى
4. افتح Excel
5. اضغط `Ctrl + V`
6. 🎉 الجدول جاهز!

---

## اختيار الأعمدة

- انقر أيقونة ⚙️ بجانب زر النسخ
- اختر الأعمدة التي تريد نسخها
- يتذكر الإضافة اختياراتك تلقائياً

---

## الصفحات المدعومة (MVP)

- ✅ Organic Research → Positions
- ✅ Organic Research → Organic Keywords  
- ✅ Organic Research → Competitors
- ✅ أي صفحة أخرى في SEMrush تحتوي على جدول

---

## البيانات المستخرجة

| الحقل | مثال |
|-------|-------|
| Keyword | windows 11 pro |
| Intent | I |
| Position | 3 |
| Traffic | 144 |
| Volume | 1.6K |
| KD % | 24 |
| URL | store5.com/... |

---

## ملاحظات تقنية

- الإضافة تعمل على الصفوف الظاهرة فقط (بدون pagination)
- القيم المختصرة مثل `1.6K` تُحفظ كما هي
- الروابط تُنظَّف من tracking parameters
- لا يتم إرسال أي بيانات لخوادم خارجية — كل شيء محلي 100%

---

## الهيكل التقني

```
semrush-smart-copier/
├── manifest.json          # Chrome Extension MV3
├── content/
│   ├── index.js           # Main content script
│   └── styles.css         # UI styles
├── src/
│   ├── content/           # TypeScript source files
│   ├── types/             # Type definitions
│   ├── hotkeys/           # Keyboard shortcuts
│   └── utils/             # Storage & helpers
└── icons/                 # Extension icons
```

---

## المرحلة المستقبلية

- [ ] دعم Ahrefs
- [ ] تصدير XLSX مباشر
- [ ] Google Sheets integration
- [ ] كشف الكلمات المكررة
- [ ] تحليل SEO بالذكاء الاصطناعي
