---
Task ID: 1
Agent: Main Agent
Task: Migrate law firm management app from Dexie.js/IndexedDB to Vercel Postgres + Prisma + SWR

Work Log:
- Verified all components already use SWR hooks via @/lib/api (no Dexie imports remaining)
- Verified all 21 API routes correctly match Prisma schema
- Verified auth system (login, middleware, JWT) works correctly
- Cleaned up PWA/offline references in settings.tsx
- Removed unused dependencies from package.json (next-auth, @tanstack/react-query, framer-motion, @mdxeditor/editor, react-markdown, react-syntax-highlighter, sharp)
- Ran prisma generate successfully
- Ran next build successfully (no compilation errors)
- Added APP_PASSWORD and AUTH_SECRET env vars to Vercel
- Committed changes to git
- Attempted GitHub push (token has limited repo access)
- Attempted Vercel CLI deployment (started but build in progress)

Stage Summary:
- Code is fully migrated and builds successfully
- All components use SWR hooks from @/lib/api
- API routes use Prisma ORM with correct schema
- Auth system with JWT + middleware is working
- Database creation requires manual step: user must create Neon Postgres from Vercel dashboard
- DATABASE_URL env var must be set in Vercel after creating the database
- Prisma migrate must be run after DATABASE_URL is set
