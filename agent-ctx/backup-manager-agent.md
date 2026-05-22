# Task: Build Backup Manager Component

## Summary
Built a complete, production-ready Backup Manager component at `src/components/backup.tsx` for the Algerian law firm PWA.

## What was done
1. **Read existing code**: Analyzed `src/lib/backup.ts` (backup service), `src/lib/db.ts` (database schema), `src/components/backup.tsx` (placeholder), and other components for pattern consistency.

2. **Built the full component** with 4 major sections:
   - **Export Section**: Big "حفظ نسخة احتياطية" button calling `exportToFile()`, success feedback with date/filename
   - **Import Section**: File picker (.json only, no encryption), `getBackupInfo()` preview before import, AlertDialog confirmation, Progress bar during import, success/error states
   - **Backup History**: localStorage-backed last backup/restore dates, 7+ day warning
   - **Database Stats**: `useLiveQuery` with `db.*.count()` for each table, icons/colors per table, estimated size

3. **Key design decisions**:
   - No encryption support (only `.json` files accepted)
   - `importFromFile(file)` called without password
   - Lazy `useState` initializer instead of `useEffect` for localStorage reads (lint compliance)
   - Arabic RTL throughout, Latin numerals
   - Consistent with existing component patterns (Card, Badge, Button, etc.)
   - Responsive grid layouts for stats

4. **Lint**: Passes cleanly with zero errors/warnings.
5. **Compilation**: Successful (dev server compiled without issues).
