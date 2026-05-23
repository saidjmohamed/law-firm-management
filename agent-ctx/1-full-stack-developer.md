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
