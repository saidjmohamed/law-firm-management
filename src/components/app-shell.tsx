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
  { id: 'clients', label: 'الموكلون', icon: Users },
  { id: 'cases', label: 'القضايا', icon: Briefcase },
  { id: 'sessions', label: 'الجلسات', icon: CalendarDays },
  { id: 'tasks', label: 'المهام', icon: ListChecks },
  { id: 'calendar', label: 'التقويم', icon: Calendar },
  { id: 'delays', label: 'الآجال والمهل', icon: Clock },
  { id: 'courts', label: 'الجهات القضائية', icon: Scale },
  { id: 'payments', label: 'المستحقات والمدفوعات', icon: Banknote },
  { id: 'lawyers', label: 'المحامون والمساعدون', icon: Shield },
  { id: 'archives', label: 'الأرشيف', icon: Archive },
  { id: 'converter', label: 'محول التاريخ والحسابات', icon: Calculator },
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
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex min-h-[84px] items-center gap-3 border-b border-sidebar-border px-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-sidebar-primary text-sidebar-primary-foreground">
          <Scale className="h-[22px] w-[22px]" strokeWidth={1.7} />
        </div>
        <div className="min-w-0">
          <h1 className="text-[15px] font-semibold leading-6 text-foreground">إدارة مكتب المحاماة</h1>
          <p className="text-xs leading-5 text-muted-foreground">نظام تسيير المكتب والقضايا</p>
        </div>
      </div>

      <div className="px-5 pb-2 pt-5">
        <p className="text-xs font-medium text-muted-foreground">القائمة الرئيسية</p>
      </div>
      <nav aria-label="التنقل الرئيسي" className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-current={isActive ? 'page' : undefined}
              onClick={() => {
                setActiveSection(item.id);
                setMobileOpen(false);
              }}
              className={cn(
                'group flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-right text-[14px] font-medium',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'
              )}
            >
              <Icon className={cn('h-[18px] w-[18px] shrink-0', isActive ? 'text-sidebar-primary' : 'text-muted-foreground')} strokeWidth={1.8} />
              <span className="truncate">{item.label}</span>
              {isActive && <span className="ms-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary" aria-hidden="true" />}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="mb-3 flex items-center gap-2 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
            <Scale className="h-4 w-4" strokeWidth={1.7} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-foreground">مكتب المحاماة</p>
            <p className="text-[11px] text-muted-foreground">إدارة العمل اليومي</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleTheme}
            className="h-9 justify-center gap-2 border-sidebar-border bg-transparent px-2 text-xs text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span>{theme === 'dark' ? 'فاتح' : 'داكن'}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="h-9 justify-center gap-2 border-sidebar-border bg-transparent px-2 text-xs text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            <span>الخروج</span>
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground antialiased">
      <aside className="fixed inset-y-0 start-0 z-40 hidden w-[272px] flex-col border-e border-sidebar-border bg-sidebar lg:flex">
        <SidebarContent />
      </aside>

      <div className="flex min-h-screen flex-col lg:ms-[272px]">
        <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-border/80 bg-background/95 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10 border-border lg:hidden">
                  <Menu className="h-[18px] w-[18px]" />
                  <span className="sr-only">فتح القائمة</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] border-l border-sidebar-border bg-sidebar p-0">
                <SheetHeader className="sr-only">
                  <SheetTitle>القائمة الجانبية</SheetTitle>
                </SheetHeader>
                <SidebarContent />
              </SheetContent>
            </Sheet>
            <div className="min-w-0">
              <p className="hidden text-[11px] leading-4 text-muted-foreground sm:block">مكتب المحاماة</p>
              <h2 className="truncate text-[16px] font-semibold leading-6 text-foreground">
                {navItems.find((item) => item.id === activeSection)?.label || 'لوحة التحكم'}
              </h2>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <GlobalSearch />
            <DailyTasksDialog />
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              title="تبديل المظهر"
              aria-label="تبديل المظهر"
              className="h-10 w-10 border-border bg-card text-muted-foreground hover:text-foreground"
            >
              {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleLogout}
              title="تسجيل الخروج"
              aria-label="تسجيل الخروج"
              className="hidden h-10 w-10 border-border bg-card text-muted-foreground hover:border-destructive/40 hover:text-destructive sm:inline-flex"
            >
              <LogOut className="h-[18px] w-[18px]" />
            </Button>
          </div>
        </header>

        <main className="min-h-[calc(100vh-68px)] flex-1 bg-background p-4 sm:p-5 lg:p-7">
          <div className="mx-auto w-full max-w-[1600px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
