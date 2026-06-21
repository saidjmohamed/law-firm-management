import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // لا نتجاهل أخطاء TypeScript — يجب إصلاحها جميعاً
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,
  allowedDevOrigins: [
    ".space-z.ai",
  ],
};

export default nextConfig;
