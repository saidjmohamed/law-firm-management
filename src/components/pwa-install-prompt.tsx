"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    setIsIos(/iphone|ipad|ipod/i.test(window.navigator.userAgent));
    if (window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone) {
      setInstalled(true);
    }

    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
      setShowHelp(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);

    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("تعذر تسجيل Service Worker:", error);
      });
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const install = async () => {
    if (!installEvent) {
      setShowHelp(true);
      return;
    }
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setInstallEvent(null);
  };

  if (installed) return null;

  return (
    <>
      <button
        type="button"
        onClick={install}
        className="fixed bottom-4 left-4 z-[60] inline-flex min-h-11 items-center gap-2 rounded-full bg-[#355c50] px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-[#29483f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#355c50] focus-visible:ring-offset-2"
        aria-label="تثبيت تطبيق الشامل على الجهاز"
      >
        <Download className="h-4 w-4" />
        تثبيت التطبيق
      </button>

      {showHelp && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-4 sm:items-center" dir="rtl">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwa-install-title"
            className="w-full max-w-sm rounded-2xl bg-background p-5 text-foreground shadow-2xl"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 id="pwa-install-title" className="text-base font-bold">تثبيت الشامل على جهازك</h2>
              <button type="button" onClick={() => setShowHelp(false)} className="rounded-lg p-2 hover:bg-muted" aria-label="إغلاق">
                <X className="h-4 w-4" />
              </button>
            </div>
            {isIos ? (
              <p className="text-sm leading-7 text-muted-foreground">
                من متصفح Safari اضغط على زر المشاركة، ثم اختر «إضافة إلى الشاشة الرئيسية»، وبعدها اضغط «إضافة».
              </p>
            ) : (
              <p className="text-sm leading-7 text-muted-foreground">
                افتح قائمة المتصفح (⋮ أو ⋯)، ثم اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية». إذا لم يظهر الخيار، حدّث الصفحة وتأكد من استعمال متصفح يدعم تثبيت التطبيقات.
              </p>
            )}
            <button type="button" onClick={() => setShowHelp(false)} className="mt-4 w-full rounded-xl bg-[#355c50] px-4 py-3 text-sm font-semibold text-white">
              فهمت
            </button>
          </section>
        </div>
      )}
    </>
  );
}
