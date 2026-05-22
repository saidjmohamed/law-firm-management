# Task 3-b: Clients + Cases Managers

## Agent: Senior Frontend Engineer
## Status: COMPLETED

## Summary
Built the full CRUD management components for Clients (الموكلون) and Cases (القضايا) for the Algerian law firm PWA.

## Files Modified/Created

### `/home/z/my-project/src/components/clients.tsx` (Replaced)
- Full CRUD for clients with all specified fields
- **List View**: Search bar (full text search), filter by type (فردية/شركة), table with columns (الاسم, الهاتف, الولاية, النوع, تاريخ الإنشاء, إجراءات), pagination with "load more", count badge
- **Add/Edit Dialog**: All fields - الاسم واللقب (required), الهاتف (required), هاتف ثاني, البريد الإلكتروني, العنوان, الولاية (58 Algerian wilayas dropdown), رقم الهوية, النوع (toggle فردية/شركة), ملاحظات
- **View Dialog**: Client details with icon badges, related cases list, total payments calculation, edit/delete buttons
- **Delete Confirmation**: AlertDialog before deleting
- **WILAYAS array**: Exported for use by other components
- **Responsive**: Mobile cards + desktop table
- **All text in Arabic, numbers in Latin numerals (en-US locale)**

### `/home/z/my-project/src/components/cases.tsx` (Replaced)
- Full CRUD for cases with comprehensive 7-section form matching the Python reference app
- **List View**: Search bar, filters (status/nature/courtType/stage), table with 11 columns (رقم القضية, الموضوع, الموكل, المحكمة, الطبيعة, المرحلة, الحالة, الأتعاب, المدفوع, المتبقي, إجراءات), status badges with colors, count badge, pagination
- **Add/Edit Dialog - 7 Sections**:
  1. معلومات أساسية: رقم القضية (required), الموضوع (required), الموكل (searchable dropdown), طبيعة القضية (15 options dropdown)
  2. الجهة القضائية: نوع القضاء (toggle عادي/إداري/محكمة عليا), المجلس القضائي, المحكمة, القسم/الغرفة, رقم القسم
  3. مرحلة التقاضي: المرحلة dropdown, رقم القضية الأصلية (shown for استئنافية/معارضة), مرحلة مخصصة (shown for أخرى)
  4. الأتعاب والمدفوعات: الأتعاب, المدفوع, المتبقي (auto-calculated, red if > 0), الحالة
  5. الخصم: الخصم, محامي الخصم
  6. التواريخ: تاريخ التسجيل, أول جلسة, تاريخ المداولة, هاتف قاعة المحامين
  7. إضافي: ملاحظات, منطوق الحكم
- **View Dialog**: All case details in organized sections, remaining amount prominently displayed, inline party management (add/remove), inline delay management (add/remove), sessions list, payment history
- **Inline Party Management**: Add parties with role dropdown (12 roles), name, phone, lawyer name, lawyer phone; delete inline
- **Inline Delay Management**: Add delays with date, reason, new date, notes; delete inline
- **Delete cascading**: Removes related parties, delays, sessions when deleting a case
- **Status badges**: جارية=green, للجدولة=yellow, مفصول فيها=blue, مؤرشفة=gray

### `/home/z/my-project/src/lib/db.ts` (Fixed)
- Fixed `formatCurrency` to use `en-US` locale instead of `ar-DZ` for Latin numerals only (1,2,3 NOT ١,٢,٣)

## Technical Notes
- Uses `useLiveQuery` from `dexie-react-hooks` for reactive data
- Uses `useMemo` for filtered/searched data performance
- Currency formatting: `toLocaleString('en-US')` + "د.ج"
- Client picker uses Command/Popover (combobox pattern)
- All components are 'use client'
- Lint passes cleanly
