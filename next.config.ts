import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: "standalone", // معطّل لVercel — Vercel لا يحتاج standalone
  // لا نتجاهل أخطاء TypeScript — يجب إصلاحها جميعاً
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,
  allowedDevOrigins: [
    ".space-z.ai",
  ],
  // ترويسات أمان أساسية — التطبيق يحتوي بيانات قضايا وموكلين حساسة
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
