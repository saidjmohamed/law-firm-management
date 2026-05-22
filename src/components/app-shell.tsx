'use client';

import React from 'react';
import { useAppStore, type Section } from '@/lib/store';
import { useTheme } from 'next-themes';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Calendar,
  Banknote,
  Clock,
  Archive,
  HardDrive,
  Settings,
  Scale,
  Menu,
  Moon,
  Sun,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const APP_NAME = 'مكتب الاستاذ سايج محمد محام لدى المجلس';

const navItems: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { id: 'clients', label: 'الموكلون', icon: Users },
  { id: 'cases', label: 'القضايا', icon: Briefcase },
  { id: 'sessions', label: 'الجلسات', icon: Calendar },
  { id: 'payments', label: 'المدفوعات', icon: Banknote },
  { id: 'delays', label: 'التأجيلات', icon: Clock },
  { id: 'archives', label: 'الأرشيف', icon: Archive },
  { id: 'backup', label: 'النسخ الاحتياطي', icon: HardDrive },
  { id: 'settings', label: 'الإعدادات', icon: Settings },
];

function SidebarContent({ activeSection, onNavigate }: { activeSection: Section; onNavigate: (s: Section) => void }) {
  const [isOnline, setIsOnline] = React.useState(true);

  React.useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Logo area */}
      <div className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-teal-600/90 shadow-lg shadow-teal-900/30 flex items-center justify-center shrink-0">
          <Scale className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <h2 className="font-bold text-sidebar-foreground text-sm leading-snug truncate">{APP_NAME}</h2>
          <p className="text-xs text-sidebar-foreground/50 mt-0.5">إدارة مكتب المحاماة</p>
        </div>
      </div>
      <Separator className="bg-sidebar-border/50" />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-3 smooth-scroll">
        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 touch-target',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm nav-active-bar'
                    : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground'
                )}
              >
                <Icon className={cn(
                  'w-5 h-5 shrink-0 transition-colors duration-200',
                  isActive ? 'text-teal-400' : ''
                )} />
                <span className={cn(isActive && 'text-sidebar-accent-foreground')}>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator className="bg-sidebar-border/50" />

      {/* Footer with offline indicator */}
      <div className="p-4 flex items-center justify-between">
        <Badge
          variant="outline"
          className="text-xs border-sidebar-border/50 text-sidebar-foreground/40"
        >
          الإصدار 2.0
        </Badge>
        <div className="flex items-center gap-1.5 offline-pulse">
          {isOnline ? (
            <Wifi className="w-3.5 h-3.5 text-teal-400/70" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-amber-400/70" />
          )}
          <span className="text-[10px] text-sidebar-foreground/40">
            {isOnline ? 'متصل' : 'يعمل بدون إنترنت'}
          </span>
        </div>
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
                <Button variant="ghost" size="icon" className="shrink-0 touch-target">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-80 p-0 bg-sidebar sidebar-gradient border-l-0"
                dir="rtl"
              >
                <SheetTitle className="sr-only">القائمة الرئيسية</SheetTitle>
                <SidebarContent
                  activeSection={activeSection}
                  onNavigate={setActiveSection}
                />
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-700 shadow-md flex items-center justify-center">
                <Scale className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-sm leading-tight">{APP_NAME}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="touch-target"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:right-0 bg-sidebar sidebar-gradient z-30 border-l border-sidebar-border/30">
          <div className="flex items-center justify-between h-14 px-4">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-teal-600/90 shadow-md flex items-center justify-center shrink-0">
                <Scale className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-sm text-sidebar-foreground truncate">{APP_NAME}</span>
            </div>
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 shrink-0 touch-target"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
            )}
          </div>
          <Separator className="bg-sidebar-border/50" />
          <SidebarContent activeSection={activeSection} onNavigate={setActiveSection} />
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
                      <h1 className="text-xl md:text-2xl font-extrabold leading-tight">{currentNav.label}</h1>
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
