'use client';

import React, { useState } from 'react';
import { useAppStore, type Section } from '@/lib/store';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
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
  ListChecks,
  CalendarDays,
  Calendar,
  Clock,
  Archive,
  Calculator,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { GlobalSearch } from '@/components/global-search';
import { DailyTasksDialog } from '@/components/daily-tasks-dialog';

interface NavItem {
  id: Section;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { id: 'clients', label: 'الموكلين', icon: Users },
  { id: 'cases', label: 'القضايا', icon: Briefcase },
  { id: 'sessions', label: 'الجلسات', icon: CalendarDays },
  { id: 'tasks', label: 'المهام', icon: ListChecks },
  { id: 'calendar', label: 'التقويم', icon: Calendar },
  { id: 'delays', label: 'الآجال والمهل', icon: Clock },
  { id: 'courts', label: 'الجهات القضائية', icon: Scale },
  { id: 'payments', label: 'المستحقات والمدفوعات', icon: Banknote },
  { id: 'lawyers', label: 'المحامون والمساعدون', icon: Shield },
  { id: 'archives', label: 'الأرشيف', icon: Archive },
  { id: 'converter', label: 'محول التاريخ / الحسابات', icon: Calculator },
  { id: 'backup', label: 'النسخ الاحتياطي', icon: HardDrive },
  { id: 'settings', label: 'الإعدادات', icon: Settings },
];

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { activeSection, setActiveSection } = useAppStore();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // نتابع إلى صفحة الدخول حتى عند تعذر الاتصال بالخادم.
    }
    window.location.assign('/login');
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-card text-card-foreground border-border">
      <div className="flex h-16 items-center gap-3 border-b border-border px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xl shadow">
          م
        </div>
        <div>
          <h1 className="text-base font-bold text-foreground tracking-wide">نظام إدارة مكتب المحاماة</h1>
          <p className="text-xs text-muted-foreground">الإصدار الاحترافي</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveSection(item.id);
                setMobileOpen(false);
              }}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-200',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="border-t border-border p-4 space-y-2">
        <Button
          variant="outline"
          onClick={toggleTheme}
          className="w-full justify-start gap-3 border-border bg-background text-foreground hover:bg-accent font-medium"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="h-4 w-4 text-amber-500" />
              <span>الوضع الفاتح</span>
            </>
          ) : (
            <>
              <Moon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>الوضع الداكن</span>
            </>
          )}
        </Button>
        <Button
          variant="destructive"
          onClick={handleLogout}
          className="w-full justify-start gap-3 font-semibold shadow-sm"
        >
          <LogOut className="h-4 w-4" />
          <span>تسجيل الخروج</span>
        </Button>
      </div>
    </div>
  );

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground font-sans antialiased">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:top-0 lg:right-0 lg:bottom-0 lg:z-40 lg:flex lg:w-72 lg:flex-col lg:border-l lg:border-border">
        <SidebarContent />
      </aside>

      {/* Main Container */}
      <div className="flex flex-col min-h-screen lg:mr-72">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:px-8 shadow-sm">
          <div className="flex items-center gap-3">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden border-border">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">فتح القائمة</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 p-0 border-l border-border bg-card">
                <SheetHeader className="sr-only">
                  <SheetTitle>القائمة الجانبية</SheetTitle>
                </SheetHeader>
                <SidebarContent />
              </SheetContent>
            </Sheet>
            <h2 className="text-lg font-bold text-foreground hidden sm:block">
              {navItems.find((item) => item.id === activeSection)?.label || 'لوحة التحكم'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <GlobalSearch />
            <DailyTasksDialog />
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              title="تبديل المظهر"
              className="border-border text-foreground hover:bg-accent"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-amber-500" />
              ) : (
                <Moon className="h-5 w-5 text-indigo-600" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleLogout}
              title="تسجيل الخروج"
              className="border-border text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
