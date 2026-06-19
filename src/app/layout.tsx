import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";

export const metadata: Metadata = {
  title: {
    default: "مكتب الأستاذ سايج محمد — محام لدى المجلس",
    template: "%s — مكتب الأستاذ سايج محمد",
  },
  description: "نظام إدارة مكتب محاماة جزائري متكامل — قضايا، موكلون، جلسات، مدفوعات وهيئات قضائية.",
  applicationName: "مكتب الأستاذ سايج محمد",
  authors: [{ name: "سايج محمد" }],
  keywords: ["محاماة", "الجزائر", "إدارة مكتب", "قضايا", "محكمة", "مجلس قضائي"],
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
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster
            position="top-center"
            dir="rtl"
            richColors
            closeButton
            duration={4000}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
