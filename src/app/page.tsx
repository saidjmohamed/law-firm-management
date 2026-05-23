'use client';

import React, { useEffect, Component } from 'react';
import { useAppStore } from '@/lib/store';
import { seedDatabase } from '@/lib/db';
import { AppShell } from '@/components/app-shell';
import { Dashboard } from '@/components/dashboard';
import { Clients } from '@/components/clients';
import { Cases } from '@/components/cases';
import { Sessions } from '@/components/sessions';
import { CalendarView } from '@/components/calendar';
import { CourtsManager } from '@/components/courts';
import { PaymentsManager } from '@/components/payments';
import { DelaysManager } from '@/components/delays';
import { ArchivesManager } from '@/components/archives';
import { BackupManager } from '@/components/backup';
import { SettingsManager } from '@/components/settings';


// ============================================================================
// Error Boundary
// ============================================================================
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-foreground">حدث خطأ غير متوقع</h2>
            <p className="text-sm text-muted-foreground">
              {this.state.error?.message || 'يرجى تحديث الصفحة والمحاولة مرة أخرى'}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
              >
                إعادة المحاولة
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-sm font-medium"
              >
                تحديث الصفحة
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// Service Worker Registration
// ============================================================================
function RegisterSW() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // SW registration failed, app still works
      });
    }
  }, []);
  return null;
}

// ============================================================================
// Seed Data Component - with loading state and error handling
// ============================================================================
function SeedData({ children }: { children: React.ReactNode }) {
  const [seedState, setSeedState] = React.useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = React.useState<string>('');

  useEffect(() => {
    let cancelled = false;

    async function doSeed() {
      try {
        await seedDatabase();
        if (!cancelled) {
          setSeedState('ready');
        }
      } catch (err) {
        console.error('[App] Seed failed:', err);
        if (!cancelled) {
          setErrorMessage(err instanceof Error ? err.message : 'فشل في تحميل البيانات');
          // Retry once after a short delay
          setTimeout(async () => {
            try {
              await seedDatabase();
              if (!cancelled) {
                setSeedState('ready');
              }
            } catch {
              if (!cancelled) {
                // Even if seed fails, show the app so user can see the error
                setSeedState('error');
              }
            }
          }, 2000);
        }
      }
    }

    doSeed();

    return () => {
      cancelled = true;
    };
  }, []);

  if (seedState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 mx-auto border-4 border-teal-200 dark:border-teal-800 border-t-teal-600 dark:border-t-teal-400 rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  if (seedState === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-foreground">مشكلة في تحميل البيانات</h2>
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
          <button
            onClick={() => {
              setSeedState('loading');
              setErrorMessage('');
              seedDatabase()
                .then(() => setSeedState('ready'))
                .catch((e) => {
                  setErrorMessage(e instanceof Error ? e.message : 'فشل مرة أخرى');
                  setSeedState('error');
                });
            }}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// ============================================================================
// Main App
// ============================================================================
function AppContent() {
  const activeSection = useAppStore((s) => s.activeSection);

  const sections: Record<string, React.ReactNode> = {
    dashboard: <Dashboard />,
    clients: <Clients />,
    cases: <Cases />,
    sessions: <Sessions />,
    calendar: <CalendarView />,
    courts: <CourtsManager />,
    payments: <PaymentsManager />,
    delays: <DelaysManager />,

    archives: <ArchivesManager />,
    backup: <BackupManager />,
    settings: <SettingsManager />,
  };

  return (
    <AppShell>{sections[activeSection] ?? <Dashboard />}</AppShell>
  );
}

export default function Home() {
  return (
    <ErrorBoundary>
      <RegisterSW />
      <SeedData>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </SeedData>
    </ErrorBoundary>
  );
}
