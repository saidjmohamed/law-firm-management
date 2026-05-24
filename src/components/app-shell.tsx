'use client';

import React from 'react';
import { useAppStore, type Section } from '@/lib/store';
import { useTheme } from 'next-themes';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Calendar,
  CalendarDays,
  Banknote,
  Clock,
  Archive,
  HardDrive,
  Settings,
  Scale,
  Menu,
  Moon,
  Sun,
  LogOut,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { GlobalSearch } from '@/components/global-search';
import { useRouter } from 'next/navigation';

const APP_NAME = 'مكتب الاستاذ سايج محمد محام لدى المجلس';

const navItems: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { id: 'clients', label: 'الموكلون', icon: Users },
  { id: 'cases', label: 'القضايا', icon: Briefcase },
  { id: 'sessions', label: 'الجلسات', icon: Calendar },
  { id: 'calendar', label: 'التقويم', icon: CalendarDays },
  { id: 'courts', label: 'الهيئات القضائية', icon: Scale },
  { id: 'payments', label: 'المدفوعات', icon: Banknote },
  { id: 'delays', label: 'التأجيلات', icon: Clock },
  { id: 'lawyers', label: 'دفتر المحامين', icon: BookOpen },
  { id: 'archives', label: 'الأرشيف', icon: Archive },
  { id: 'backup', label: 'النسخ الاحتياطي', icon: HardDrive },
  { id: 'settings', label: 'الإعدادات', icon: Settings },
];

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
      {/* Logo area */}
      <div className="p-3 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-teal-600 shadow-md flex items-center justify-center shrink-0">
          <Scale className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <h2 className="font-bold text-foreground text-xs leading-snug truncate">{APP_NAME}</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">إدارة مكتب المحاماة</p>
        </div>
      </div>
      <Separator />

      {/* بحث ذكي */}
      <div className="px-2 pt-2">
        <GlobalSearch />
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 py-2 smooth-scroll">
        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 text-right',
                  isActive
                    ? 'bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300 font-bold'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                )}
              >
                <Icon className={cn(
                  'w-4 h-4 shrink-0 transition-colors duration-200',
                  isActive ? 'text-teal-600 dark:text-teal-400' : ''
                )} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator />

      {/* Footer */}
      <div className="p-3 flex items-center justify-between">
        <Badge variant="outline" className="text-[10px]">الإصدار 3.0</Badge>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-red-500 transition-colors"
        >
          <LogOut className="w-3 h-3" />
          خروج
        </button>
      </div>
    </div>
  );
}

function cn(...inputs: (string | undefined | false)[]) {
  return inputs.filter(Boolean).join(' ');
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
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      {/* Top bar - mobile */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b lg:hidden">
        <div className="flex items-center justify-between h-12 px-3">
          <div className="flex items-center gap-2">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-60 p-0 bg-background border-l"
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
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-md bg-teal-700 shadow flex items-center justify-center">
                <Scale className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-xs leading-tight line-clamp-1">{APP_NAME}</span>
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
                className="h-9 w-9"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-x-hidden">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex lg:w-56 lg:flex-col lg:fixed lg:inset-y-0 lg:right-0 bg-background border-l z-30">
          <div className="flex items-center justify-between h-12 px-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-md bg-teal-600 shadow flex items-center justify-center shrink-0">
                <Scale className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-xs text-foreground truncate">{APP_NAME}</span>
            </div>
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="text-muted-foreground hover:text-foreground h-8 w-8 shrink-0"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
            )}
          </div>
          <Separator />
          <SidebarContent activeSection={activeSection} onNavigate={setActiveSection} />
        </aside>

        {/* Main content */}
        <main className="flex-1 lg:mr-56 min-w-0 overflow-x-hidden">
          <div className="p-3 md:p-5 max-w-5xl mx-auto">
            {/* Section header */}
            <div className="flex items-center gap-2 mb-4">
              {currentNav && (
                <>
                  <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center shrink-0">
                    <currentNav.icon className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                  </div>
                  <div>
                    <h1 className="text-lg md:text-xl font-extrabold leading-tight">{currentNav.label}</h1>
                  </div>
                </>
              )}
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
