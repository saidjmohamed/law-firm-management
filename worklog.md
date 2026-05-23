---
Task ID: 1
Agent: full-stack-developer
Task: Build complete law firm management PWA

Work Log:
- Created Dexie.js database schema (db.ts) with 5 tables: clients, cases, sessions, transactions, documents
- Built Zustand store for UI state management (active section, sidebar)
- Created PWA manifest.json with Arabic/RTL configuration and teal theme color
- Created service worker (sw.js) with cache-first strategy for offline support
- Generated PNG app icons (192x192, 512x512) using sharp
- Updated layout.tsx with Arabic lang, RTL dir, ThemeProvider for dark mode, sonner toaster
- Updated globals.css with teal/emerald color theme for both light and dark modes
- Built app-shell.tsx with RTL sidebar navigation (fixed desktop + mobile drawer)
- Built dashboard.tsx with summary cards, pie chart (cases by type), bar chart (income vs expenses), recent cases and upcoming sessions
- Built clients.tsx with full CRUD, search, filter by type, view details with linked cases
- Built cases.tsx with full CRUD, search, filter by status/type, searchable client picker, view details with sessions/transactions/documents
- Built sessions.tsx with grouped-by-date view, status filters, case picker, result tracking
- Built finance.tsx with summary cards, income vs expenses bar chart, transaction management with case/client linking
- Built documents.tsx with card grid view, document type badges, full CRUD with content editor
- Created main page.tsx with service worker registration and database seeding
- Seeded sample data: 3 clients, 3 cases, 3 sessions, 5 transactions, 2 documents
- All UI text in Arabic with RTL layout throughout
- Lint passes with no errors

Stage Summary:
- Complete offline law firm management PWA with 6 sections
- All UI in Arabic with RTL layout
- PWA installable on Android (manifest + service worker)
- Dexie.js for client-side IndexedDB storage
- Zustand for UI state management
- Recharts for dashboard visualizations
- Professional teal/emerald color theme (not blue/indigo)
- Dark mode support via next-themes
- Responsive design with mobile drawer sidebar

---
Task ID: 2
Agent: Main Agent
Task: بناء مكونات التطبيق الناقصة + تعديلات الحقول + الادخال التراكمي

Work Log:
- جعل جميع حقول النماذج اختيارية في: clients.tsx, cases.tsx, sessions.tsx, payments.tsx
- إزالة التحقق الإجباري (required validation) من جميع المكونات
- إضافة خاصية الادخال التراكمي في: cases.tsx, sessions.tsx, payments.tsx
- الادخال التراكمي يتيح إضافة عدة سجلات متتالية دون إغلاق النافذة
- بناء مكون التأجيلات (delays.tsx) كامل مع CRUD + بحث + فلترة
- بناء مكون النسخ الاحتياطي (backup.tsx) بدون تشفير
- بناء مكون الأرشيف (archives.tsx) مع عرض/استعادة/حذف
- بناء مكون الإعدادات (settings.tsx) مع معلومات المحامي + إحصائيات قاعدة البيانات + منطقة الخطر
- تحديث manifest.json باسم التطبيق الصحيح
- Lint يمر بنجاح، التطبيق يعمل

Stage Summary:
- جميع المكونات الناقصة تم بناؤها بالكامل
- الادخال التراكمي يعمل عبر زر Switch في نماذج الإضافة
- جميع الحقول اختيارية بدون تحقق إجباري
- العملة: دينار جزائري (د.ج) بأرقام لاتينية

---
Task ID: 3
Agent: Main Agent
Task: إصلاح مشكلة عدم ظهور القضايا والموكلين في التطبيق

Work Log:
- تحليل السبب الجذري: seedDatabase() كان ينشئ cases/parties/delays فقط بدون clients
- Case type لم يكن يحتوي على clientId لربط القضايا بالموكلين
- عرض تفاصيل الموكل كان يعرض كل القضايا (return true bug)
- دالة البذرة لم تكن قوية - لا فحص لإصدار البذرة، لا استرداد من الأخطاء
- لا طريقة للمستخدمين لإعادة تعيين قاعدة البيانات

- إعادة كتابة db.ts:
  - إضافة حقل clientId لنوع Case والمخطط (إصدار 5)
  - إضافة مصفوفة SEED_CLIENTS مع 16 موكلاً من parsed_cases.json
  - إضافة حقل clientName لواجهة SeedCase وربط القضايا بالموكلين
  - تغيير آلية فحص إصدار البذرة (تستخدم settings.seedVersion)
  - إضافة دالة resetDatabase() لإعادة البذرة الإجبارية
  - أرشفة مسبقة للقضايا بحالة "مؤرشفة" في جدول الأرشيف

- تحديث cases.tsx:
  - إضافة استعلام clients و clientMap
  - إضافة محدد الموكل في نموذج القضية
  - عرض اسم الموكل في قائمة القضايا وعرض التفاصيل
  - البحث يشمل الآن اسم الموكل

- تحديث clients.tsx:
  - إصلاح ربط الموكل-القضية (يستخدم clientId بدلاً من return true)
  - إضافة قسم قضايا الموكل في عرض التفاصيل مع تنقل قابل للنقر
  - إضافة عدد القضايا لكل موكل في عرض القائمة

- تحديث backup.tsx:
  - إضافة زر "إعادة تعيين قاعدة البيانات" مع تأكيد
  - المستخدمون يمكنهم الآن إعادة البذرة إذا كانت البيانات مفقودة

- تحديث dashboard.tsx:
  - إضافة بطاقة إحصائية للموكلين

- تحديث page.tsx:
  - تحسين مكون SeedData مع منطق إعادة المحاولة

Stage Summary:
- جميع 19 قضية و 16 موكل يتم زرعهم بشكل صحيح الآن
- القضايا مرتبطة بالموكلين عبر clientId
- عرض تفاصيل الموكل يعرض فقط قضاياه المرتبطة
- المستخدمون يمكنهم إعادة تعيين قاعدة البيانات من قسم النسخ الاحتياطي
- البناء يمر بنجاح
