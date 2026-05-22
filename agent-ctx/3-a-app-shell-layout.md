# Task 3-a: App Shell + Layout

## Summary
Updated the app shell, layout, Zustand store, and main page for the Algerian law firm management PWA.

## Changes Made

### 1. `/home/z/my-project/src/lib/store.ts`
- Updated `Section` type to include 9 sections: `dashboard`, `clients`, `cases`, `sessions`, `payments`, `delays`, `archives`, `backup`, `settings`
- Removed old sections (`finance`, `documents`)
- Kept `sidebarOpen` and `setSidebarOpen` state
- `setActiveSection` also closes the sidebar (mobile UX)

### 2. `/home/z/my-project/src/components/app-shell.tsx`
- Updated navigation items with correct Arabic labels and Lucide icons:
  - لوحة التحكم (LayoutDashboard), الموكلون (Users), القضايا (Briefcase), الجلسات (Calendar), المدفوعات (Banknote), التأجيلات (Clock), الأرشيف (Archive), النسخ الاحتياطي (HardDrive), الإعدادات (Settings)
- Updated sidebar header: "مكتب الاستاذ سايج محمد محمد محام لدى المجلس"
- Short name: "إدارة مكتب المحاماة"
- Version badge: الإصدار 2.0
- Mobile header shows shortened name: "مكتب الاستاذ سايج محمد محمد"
- Maintained RTL layout, dark/light toggle, responsive design

### 3. `/home/z/my-project/src/app/layout.tsx`
- Title: "مكتب الاستاذ سايج محمد محمد محام لدى المجلس"
- Description: "نظام إدارة مكتب محاماة جزائري"

### 4. `/home/z/my-project/src/components/dashboard.tsx`
- Updated to use new db schema (`db.payments` instead of `db.transactions`)
- Uses `formatCurrency` from db.ts (Algerian Dinar د.ج)
- Updated status labels to match new schema: جارية, للجدولة, مفصول فيها, مؤرشفة
- Uses `c.subject` instead of `c.title`, `c.caseNature` instead of `c.caseType`
- Uses `s.caseSubject` instead of `s.caseTitle`
- Locale changed from `ar-SA` to `ar-DZ`
- Removed recharts dependencies (simplified for now)
- Added financial summary section

### 5. Created placeholder components:
- `/home/z/my-project/src/components/payments.tsx` - PaymentsManager (Banknote icon)
- `/home/z/my-project/src/components/delays.tsx` - DelaysManager (Clock icon)
- `/home/z/my-project/src/components/archives.tsx` - ArchivesManager (Archive icon)
- `/home/z/my-project/src/components/backup.tsx` - BackupManager (HardDrive icon)
- `/home/z/my-project/src/components/settings.tsx` - SettingsManager (Settings icon)

### 6. `/home/z/my-project/src/app/page.tsx`
- Imports all section components including new placeholders
- Uses `sections` mapping with fallback to Dashboard
- Service worker registration preserved
- seedDatabase() call preserved

## Known Issues (for future tasks)
- Old `cases.tsx` and `sessions.tsx` reference old DB schema fields (`c.title`, `c.caseType`, `s.caseTitle`, `db.transactions`, `db.documents`) - these need to be rebuilt in later tasks
- Old `clients.tsx` may have minor issues with missing `updatedAt` field in add form
- Old `finance.tsx` and `documents.tsx` still exist but are not imported (can be removed later)
