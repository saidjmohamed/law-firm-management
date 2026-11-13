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
  ArrowLeftRight,
  Landmark,
  UserCheck,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NavItem {
  id: Section;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { id: 'cases', label: 'القضايا والملفات', icon: Briefcase },
  { id: 'clients', label: 'الموكلون والعملاء', icon: Users },
  { id: 'sessions', label: 'الجلسات والمواعيد', icon: CalendarDays },
  { id: 'courts', label: 'المحاكم والجهات', icon: Landmark },
  { id: 'lawyers', label: 'المحامون والمستشارون', icon: UserCheck },
  { id: 'payments', label: 'المالية والمدفوعات', icon: Banknote },
  { id: 'tasks', label: 'المهام والتكليفات', icon: ListChecks },
  { id: 'calendar', label: 'التقويم والروزنامة', icon: Calendar },
  { id: 'delays', label: 'الآجال والمهل القانونية', icon: Clock },
  { id: 'archives', label: 'الأرشيف والمستندات', icon: Archive },
  { id: 'converter', label: 'محول التواريخ والآجال', icon: ArrowLeftRight },
  { id: 'backup', label: 'النسخ الاحتياطي', icon: HardDrive },
  { id: 'settings', label: 'إعدادات المنظومة', icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { activeSection: activeTab, setActiveSection: setActiveTab } = useAppStore();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavClick = (id: Section) => {
    setActiveTab(id);
    setMobileOpen(false);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch {
      window.location.href = '/login';
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <header className="sticky top-0 z-40 w-full h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 md:px-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-slate-300 hover:text-white hover:bg-slate-800"
            aria-label="فتح القائمة الجانبية"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>

          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-100 tracking-tight leading-none">
                مكتب المحاماة والخدمات القانونية
              </h1>
              <p className="text-[11px] text-amber-400 font-medium mt-1">
                منظومة الإدارة المتكاملة
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-xl transition-colors"
            title={theme === 'dark' ? 'الوضع المضيء' : 'الوضع الليلي'}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

          <Button
            variant="ghost"
            onClick={handleLogout}
            className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl gap-2 text-xs font-semibold px-3 py-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">خروج</span>
          </Button>
        </div>
      </header>

      <div className="flex flex-1 relative">
        <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-l border-slate-800/80 shrink-0 sticky top-16 h-[calc(100vh-4rem)]">
          <ScrollArea className="flex-1 py-4 px-3">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 text-right',
                      isActive
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    )}
                  >
                    <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-amber-400' : 'text-slate-400')} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </ScrollArea>
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
              onClick={() => setMobileOpen(false)}
            />

            <div className="relative w-72 max-w-[80vw] bg-slate-900 border-l border-slate-800 h-full flex flex-col z-10 shadow-2xl mr-auto">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-amber-500" />
                  <span className="font-bold text-sm text-slate-100">القائمة الرئيسية</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <ScrollArea className="flex-1 p-3">
                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavClick(item.id)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-medium transition-all text-right',
                          isActive
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                        )}
                      >
                        <Icon className={cn('w-4.5 h-4.5 shrink-0', isActive ? 'text-amber-400' : 'text-slate-400')} />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </ScrollArea>
            </div>
          </div>
        )}

        <main className="flex-1 min-w-0 bg-slate-950 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
