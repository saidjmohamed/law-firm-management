import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";

const cairo = Cairo({
  subsets: ["arabic"],
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  title: {
    default: "منظومة إدارة مكتب المحاماة",
    template: "%s - منظومة إدارة مكتب المحاماة",
  },
  description: "منظومة متكاملة لإدارة القضايا والجلسات والعملاء للمحامين – مكتب المحاماة",
  applicationName: "منظومة إدارة مكتب المحاماة",
  authors: [{ name: "مكتب المحاماة" }],
  keywords: ["محاماة", "قضايا", "جلسات", "إدارة مكتب", "محامين", "الجزائر"],
  icons: {
    icon: "/icon-192.svg",
    apple: "/icon-192.svg",
  },
  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0d9488" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${cairo.className} ${cairo.variable} antialiased bg-background text-foreground font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
