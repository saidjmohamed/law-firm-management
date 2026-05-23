# Task: Build 3 Missing Components for Law Firm Management PWA

## Status: COMPLETED

## Summary
Built 3 production-ready components for the Algerian law firm management PWA, plus integrated an archive button into the existing cases component.

## Components Built

### 1. Delays Manager (`src/components/delays.tsx`)
- Summary cards: total delays, upcoming, past
- Search by case number, subject, reason, notes
- Filter by status: all, upcoming, past
- Desktop: table view with all details
- Mobile: grouped-by-date card view (like sessions component)
- Add/edit delay dialog with case picker (popover + command)
- View delay details dialog with case info
- Delete with confirmation
- ALL form fields optional (no required validation)
- Uses Latin numerals via `toLocaleString('en-US')`

### 2. Archives Manager (`src/components/archives.tsx`)
- Summary card showing total archived cases count
- Search archives by case data fields (number, subject, client, etc.)
- Desktop: table view with parsed caseData fields
- Mobile: card view
- View archived case details dialog - parses caseData JSON and shows all fields (basic info, court info, financial, opposing party, dates, judgment, notes)
- Restore archived case back to active cases (with confirmation)
- Delete archive permanently (with confirmation)
- Responsive design

### 3. Settings Manager (`src/components/settings.tsx`)
- Lawyer Info Section: name, title, address, phone (stored/retrieved via getSetting/setSetting)
- Database Info: total records count for each table (8 tables with icons)
- Danger Zone with red border:
  - Clear all data button (double confirmation - first alert, then text input requiring "حذف")
  - Reset to defaults button (single confirmation, re-seeds database)
- Loading state while settings are fetched
- All settings loaded/saved from settings table

### 4. Archive Integration in Cases (`src/components/cases.tsx`)
- Added `Archive` type import and `ArchiveIcon` import
- Added `handleArchive` function that:
  - Creates an Archive record with JSON snapshot of the case
  - Marks the case as 'archived' status
- Added archive confirmation dialog (AlertDialog)
- Added "أرشفة" button in the view dialog (only shown for non-archived cases)
- Button styled with gray color to differentiate from edit/delete

## Key Patterns Followed
- Same shadcn/ui components as existing codebase
- RTL layout with `dir="rtl"` on dialogs
- Arabic labels and text
- Latin numerals via `toLocaleString('en-US')`
- Algerian Dinar (د.ج) currency formatting
- Mobile-first responsive design
- All form fields optional (no validation errors)
- Toast notifications for success/error feedback

## Verification
- `bun run lint` - Passed with no errors
- Dev server compiling successfully
