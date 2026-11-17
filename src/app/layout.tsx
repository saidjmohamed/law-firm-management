import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";

const ibmPlex = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-arabic",
  display: "swap",
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
    { media: "(prefers-color-scheme: light)", color: "#355c50" },
    { media: "(prefers-color-scheme: dark)", color: "#171c19" },
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
      <body className={`${ibmPlex.className} ${ibmPlex.variable} antialiased bg-background text-foreground font-sans`}>
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
