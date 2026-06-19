# مكتب الأستاذ سايج محمد — محام لدى المجلس

> نظام إدارة مكتب محاماة جزائري متكامل — مبني بـ Next.js 16 و PostgreSQL

## المميزات

- ⚖️ **إدارة القضايا** — تسجيل وتتبع كل القضايا مع تفاصيل كاملة (الأطراف، الآجال، الجلسات، الأتعاب، النتيجة)
- 👥 **إدارة الموكلين** — قاعدة بيانات شاملة للموكلين مع كشف التكرار التلقائي
- 📅 **الجلسات والتقويم** — تتبع الجلسات القادمة والتأجيلات مع تنبيه 7 أيام
- 💰 **المدفوعات** — تتبع الأتعاب لكل طرف على حدة + إيرادات/مصاريف المكتب
- 🏛️ **الهيئات القضائية** — التسلسل الهرمي للقضاء الجزائري (المحكمة العليا، المجالس القضائية، المحاكم، القضاء الإداري، التجاري)
- 👨‍⚖️ **دفتر المحامين** — قاعدة بيانات للمحامين مع رقم القيد في النقابة والتخصص
- 📄 **ملف القضية** — توليد صفحة HTML قابلة للطباعة/PDF بتفاصيل القضية الكاملة
- 📢 **إعلان تأسيس الدعوى** — توليد إعلان جاهز للنشر
- 🔍 **البحث الشامل** — بحث ذكي عبر القضايا والموكلين
- 💾 **النسخ الاحتياطي** — تصدير واستيراد البيانات بتنسيق JSON
- 🌙 **الوضع الداكن** — دعم السمة الفاتحة والداكنة
- 📱 **متجاوب** — تصميم متجاوب يعمل بشكل مثالي على الهواتف
- 🔤 **واجهة عربية** — دعم كامل للغة العربية (RTL)
- 🤖 **خادم MCP** — تكامل مع أدوات الذكاء الاصطناعي الخارجية (قراءة + كتابة آمنة عبر API Key)

## التقنيات المستخدمة

| الطبقة | التقنية |
|---|---|
| Framework | **Next.js 16** (App Router, standalone output) |
| Language | **TypeScript** (strict mode) |
| Database | **Neon Postgres** + **Prisma ORM** |
| Auth | JWT cookie (30 يوم) + middleware |
| State | Zustand |
| Data fetching | SWR |
| UI | shadcn/ui + Tailwind CSS 4 + Radix UI |
| Forms | react-hook-form + zod |
| Charts | Recharts |
| Icons | lucide-react |
| AI SDK | z-ai-web-dev-sdk |

## الإعداد المحلي

```bash
# 1. نسخ المتغيرات البيئية
cp .env.example .env
# ثم عدّل .env واملأ القيم الحقيقية:
#   DATABASE_URL, DIRECT_URL  ← من Neon Postgres
#   AUTH_SECRET               ← openssl rand -base64 32
#   APP_PASSWORD              ← كلمة مرور الدخول
#   MCP_API_KEY               ← مفتاح MCP عشوائي

# 2. تثبيت الحزم
npm install

# 3. توليد عميل Prisma وتطبيق الـ migrations
npx prisma generate
npx prisma migrate deploy

# 4. التشغيل في وضع التطوير
npm run dev
```

## النشر على Vercel

المشروع مُعد ليعمل على Vercel مع الإعدادات التالية:

1. اربط المستودع بـ Vercel
2. أضف متغيرات البيئة في إعدادات المشروع:
   - `DATABASE_URL` — رابط Neon Postgres pooler
   - `DIRECT_URL` — رابط Neon Postgres direct
   - `AUTH_SECRET` — مفتاح JWT
   - `APP_PASSWORD` — كلمة مرور الدخول
   - `MCP_API_KEY` — مفتاح MCP server
3. Build command (مُعد مسبقاً في `package.json`):
   ```
   prisma generate && prisma migrate deploy && next build && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/
   ```

## هيكل المشروع

```
src/
├── app/
│   ├── api/                  # 27 مسار API (REST + MCP)
│   │   ├── auth/             # login, logout, check
│   │   ├── cases/            # CRUD قضايا + أطراف + آجال
│   │   ├── clients/          # CRUD موكلين
│   │   ├── sessions/         # CRUD جلسات
│   │   ├── delays/           # CRUD تأجيلات
│   │   ├── payments/         # CRUD مدفوعات
│   │   ├── lawyers/          # CRUD محامين + نقابات
│   │   ├── judicial-bodies/  # CRUD هيئات قضائية
│   │   ├── archives/         # CRUD أرشيف
│   │   ├── parties/          # CRUD أطراف
│   │   ├── custom-options/   # خيارات مخصصة
│   │   ├── settings/         # إعدادات
│   │   ├── seed/             # بيانات أولية
│   │   └── mcp/              # خادم MCP (StreamableHTTP)
│   ├── login/page.tsx        # صفحة الدخول
│   ├── page.tsx              # الصفحة الرئيسية
│   ├── layout.tsx            # التخطيط العام
│   └── globals.css           # الأنماط العامة
│
├── components/               # مكونات التطبيق
│   ├── app-shell.tsx         # الهيكل (شريط جانبي + محتوى)
│   ├── dashboard.tsx         # لوحة التحكم
│   ├── cases.tsx             # إدارة القضايا
│   ├── clients.tsx           # إدارة الموكلين
│   ├── sessions.tsx          # إدارة الجلسات
│   ├── courts.tsx            # الهيئات القضائية
│   ├── lawyers.tsx           # دفتر المحامين
│   ├── payments.tsx          # المدفوعات
│   ├── delays.tsx            # التأجيلات
│   ├── archives.tsx          # الأرشيف
│   ├── backup.tsx            # النسخ الاحتياطي
│   ├── settings.tsx          # الإعدادات
│   ├── calendar.tsx          # التقويم
│   ├── case-print.tsx        # طباعة ملف القضية
│   ├── case-announcement.tsx # إعلان تأسيس الدعوى
│   ├── duplicate-scanner.tsx # كشف التكرار
│   ├── global-search.tsx     # البحث الشامل
│   ├── converter.tsx         # محول العملات
│   └── ui/                   # مكونات shadcn/ui
│
├── hooks/                    # React Hooks
└── lib/                      # المكتبات والثوابت
    ├── prisma.ts             # عميل Prisma
    ├── auth.ts               # المصادقة JWT
    ├── api.ts                # طبقة SWR
    ├── store.ts              # Zustand store
    ├── constants.ts          # الثوابت (الولايات، أنواع القضايا...)
    └── utils.ts              # أدوات مساعدة
```

## التسلسل الهرمي للقضاء الجزائري

1. **المحكمة العليا** — 7 غرف، بدون مجلس
2. **المجالس القضائية** — 10 غرف
3. **المحاكم** — تابعة لمجلس قضائي، 10 أقسام
4. **القضاء الإداري** — استئنافي، ابتدائي، تجاري متخصص

## خادم MCP (لتكامل الذكاء الاصطناعي)

نقطة النهاية: `POST /api/mcp`

المصادقة: ترويسة `x-api-key: <MCP_API_KEY>`

البروتوكول: JSON-RPC 2.0 (StreamableHTTP) — إصدار 2024-11-05

الأدوات المتوفرة:
- **قراءة**: `search_cases`, `get_case`, `get_upcoming`, `search_clients`, `get_client`, `get_parties`, `get_payments`, `get_delays`, `search_lawyers`, `list_courts`
- **كتابة آمنة**: `add_delay`, `add_session`, `add_payment`, `add_client`, `add_party`, `add_case`
- **تحديث آمن**: `update_case_status`, `update_delib_date`, `update_bar_phone`, `update_case_result`, `update_phone`, `update_note`

## الأمان

- 🔐 المصادقة عبر JWT cookie (30 يوم)
- 🛡️ middleware يحمي كل المسارات ما عدا `/login` و `/api/auth` و `/api/mcp`
- 🔑 خادم MCP محمي بـ API Key مستقل
- 🚫 لا توجد قيم افتراضية للأسرار في الكود (يجب تعريفها في البيئة)

## الرخصة

هذا المشروع خاص بمكتب الأستاذ سايج محمد — محام لدى المجلس.
