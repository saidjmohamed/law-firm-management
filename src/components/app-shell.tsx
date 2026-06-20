'use client';

import React from 'react';
import { useAppStore, type Section } from '@/lib/store';
import { useTheme } from 'next-themes';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Banknote,
  HardDrive,
  Settings,
  Scale,
  Menu,
  Moon,
  Sun,
  LogOut,
  BookOpen,
  Gavel,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { GlobalSearch } from '@/components/global-search';
import { useRouter } from 'next/navigation';

const APP_NAME = 'مكتب الأستاذ سايج محمد';
const APP_SUBTITLE = 'محام لدى المجلس';

const navItems: { id: Section; label: string; icon: React.ElementType; hint?: string }[] = [
  { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard, hint: 'نظرة عامة' },
  { id: 'clients', label: 'الموكلون', icon: Users },
  { id: 'cases', label: 'القضايا', icon: Briefcase },
  { id: 'courts', label: 'الهيئات القضائية', icon: Scale },
  { id: 'payments', label: 'المدفوعات', icon: Banknote },
  { id: 'lawyers', label: 'دفتر المحامين', icon: BookOpen },
  { id: 'backup', label: 'النسخ الاحتياطي', icon: HardDrive },
  { id: 'settings', label: 'الإعدادات', icon: Settings },
];

function cn(...inputs: (string | undefined | false)[]) {
  return inputs.filter(Boolean).join(' ');
}

function SidebarContent({ activeSection, onNavigate }: { activeSection: Section; onNavigate: (s: Section) => void }) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      window.location.href = '/login';
    }
  };

  return (
    <div className="flex flex-col h-full text-right" dir="rtl">
      {/* شعار التطبيق */}
      <div className="p-4 flex items-center gap-3">
        <div className="relative shrink-0">
          <div className="w-12 h-12 rounded-xl bg-gradient-primary shadow-card flex items-center justify-center">
            <Gavel className="w-6 h-6 text-white" />
          </div>
          <div className="absolute -bottom-0.5 -left-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-background" />
        </div>
        <div className="min-w-0">
          <h2 className="font-bold text-foreground text-[15px] leading-tight truncate">{APP_NAME}</h2>
          <p className="text-[12px] text-muted-foreground mt-0.5">{APP_SUBTITLE}</p>
        </div>
      </div>

      <div className="divider-gradient mx-3" />

      {/* بحث ذكي */}
      <div className="px-3 pt-3">
        <GlobalSearch />
      </div>

      {/* قائمة التنقل */}
      <ScrollArea className="flex-1 px-3 py-3 smooth-scroll">
        <nav className="space-y-1.5">
          <p className="px-2 pb-1.5 text-[12px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
            القائمة الرئيسية
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  'group w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[15px] font-medium transition-all duration-200 text-right',
                  isActive
                    ? 'bg-gradient-primary text-white shadow-soft'
                    : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                )}
              >
                <Icon className={cn(
                  'w-5 h-5 shrink-0 transition-transform duration-200',
                  isActive
                    ? 'text-white'
                    : 'text-muted-foreground/80 group-hover:text-foreground group-hover:scale-110'
                )} />
                <span className="flex-1">{item.label}</span>
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-white/80" />
                )}
              </button>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="divider-gradient mx-3" />

      {/* تذييل */}
      <div className="p-3 flex items-center justify-between gap-2">
        <Badge
          variant="outline"
          className="text-[12px] font-mono px-2 py-0.5"
        >
          v3.0
        </Badge>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-destructive transition-colors px-2.5 py-1.5 rounded-md hover:bg-destructive/5"
        >
          <LogOut className="w-4 h-4" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { activeSection, setActiveSection, sidebarOpen, setSidebarOpen } = useAppStore();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const currentNav = navItems.find((n) => n.id === activeSection);

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden bg-background">
      {/* الشريط العلوي - الجوال */}
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl border-b border-border/60 lg:hidden">
        <div className="flex items-center justify-between h-16 px-3">
          <div className="flex items-center gap-2">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0 h-10 w-10">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-72 p-0 bg-background border-l"
              >
                <SheetTitle className="sr-only">القائمة الرئيسية</SheetTitle>
                <SidebarContent
                  activeSection={activeSection}
                  onNavigate={(s) => {
                    setActiveSection(s);
                    setSidebarOpen(false);
                  }}
                />
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-primary shadow-soft flex items-center justify-center">
                <Gavel className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-[13px] leading-tight line-clamp-1 block">{APP_NAME}</span>
                <span className="text-[11px] text-muted-foreground">{APP_SUBTITLE}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-32">
              <GlobalSearch />
            </div>
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="h-10 w-10"
                aria-label="تبديل السمة"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-x-hidden">
        {/* الشريط الجانبي - سطح المكتب */}
        <aside className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 lg:right-0 bg-sidebar border-l border-sidebar-border z-30">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-gradient-primary shadow-soft flex items-center justify-center shrink-0">
                <Gavel className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-[15px] text-foreground truncate">{APP_NAME}</span>
            </div>
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="text-muted-foreground hover:text-foreground h-10 w-10 shrink-0"
                aria-label="تبديل السمة"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
            )}
          </div>
          <Separator className="bg-sidebar-border" />
          <SidebarContent activeSection={activeSection} onNavigate={setActiveSection} />
        </aside>

        {/* المحتوى الرئيسي */}
        <main className="flex-1 lg:mr-72 min-w-0 overflow-x-hidden gradient-mesh">
          <div className="p-5 md:p-8 max-w-6xl mx-auto">
            {/* رأس القسم */}
            {currentNav && (
              <div className="mb-6 flex items-center gap-3.5 animate-fade-in">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary shadow-soft flex items-center justify-center shrink-0">
                  <currentNav.icon className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-2xl md:text-3xl font-extrabold leading-tight text-foreground">
                    {currentNav.label}
                  </h1>
                  {currentNav.hint && (
                    <p className="text-sm text-muted-foreground mt-1">{currentNav.hint}</p>
                  )}
                </div>
              </div>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
