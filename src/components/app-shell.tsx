'use client';

import React from 'react';
import { useAppStore, type Section } from '@/lib/store';
import { useTheme } from 'next-themes';
import {
  LayoutDashboard,
  Users,
  Scale,
  CalendarDays,
  Wallet,
  FileText,
  Menu,
  Moon,
  Sun,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const navItems: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { id: 'clients', label: 'العملاء', icon: Users },
  { id: 'cases', label: 'القضايا', icon: Scale },
  { id: 'sessions', label: 'الجلسات', icon: CalendarDays },
  { id: 'finance', label: 'المالية', icon: Wallet },
  { id: 'documents', label: 'المستندات', icon: FileText },
];

function SidebarContent({ activeSection, onNavigate }: { activeSection: Section; onNavigate: (s: Section) => void }) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center">
          <Scale className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-bold text-sidebar-foreground text-sm">مكتب المحاماة</h2>
          <p className="text-xs text-sidebar-foreground/60">نظام الإدارة</p>
        </div>
      </div>
      <Separator className="bg-sidebar-border" />
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </ScrollArea>
      <Separator className="bg-sidebar-border" />
      <div className="p-4">
        <Badge variant="outline" className="text-xs border-sidebar-border text-sidebar-foreground/50">
          الإصدار 1.0
        </Badge>
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
    <div className="min-h-screen flex flex-col">
      {/* Top bar - mobile */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b lg:hidden">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 p-0 bg-sidebar" dir="rtl">
                <SheetTitle className="sr-only">القائمة الرئيسية</SheetTitle>
                <SidebarContent
                  activeSection={activeSection}
                  onNavigate={setActiveSection}
                />
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-700 flex items-center justify-center">
                <Scale className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-sm">مكتب المحاماة</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:right-0 bg-sidebar z-30">
          <div className="flex items-center justify-between h-14 px-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
                <Scale className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-sm text-sidebar-foreground">مكتب المحاماة</span>
            </div>
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
            )}
          </div>
          <Separator className="bg-sidebar-border" />
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                    )}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </ScrollArea>
          <Separator className="bg-sidebar-border" />
          <div className="p-4">
            <Badge variant="outline" className="text-xs border-sidebar-border text-sidebar-foreground/50">
              الإصدار 1.0
            </Badge>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 lg:mr-64">
          <div className="p-4 md:p-6 max-w-7xl mx-auto">
            {/* Section header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {currentNav && (
                  <>
                    <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                      <currentNav.icon className="w-5 h-5 text-teal-700 dark:text-teal-400" />
                    </div>
                    <div>
                      <h1 className="text-xl md:text-2xl font-bold">{currentNav.label}</h1>
                    </div>
                  </>
                )}
              </div>
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
