'use client';

import React, { Component } from 'react';
import { useAppStore } from '@/lib/store';
import { AppShell } from '@/components/app-shell';
import { Dashboard } from '@/components/dashboard';
import { Clients } from '@/components/clients';
import { Cases } from '@/components/cases';
import { CourtsManager } from '@/components/courts';
import { Lawyers } from '@/components/lawyers';
import { PaymentsManager } from '@/components/payments';
import { BackupManager } from '@/components/backup';
import { SettingsManager } from '@/components/settings';
import { TasksManager } from '@/components/tasks';


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
// Main App
// ============================================================================
function AppContent() {
  const activeSection = useAppStore((s) => s.activeSection);

  const sections: Record<string, React.ReactNode> = {
    dashboard: <Dashboard />,
    clients: <Clients />,
    cases: <Cases />,
    tasks: <TasksManager />,
    courts: <CourtsManager />,
    lawyers: <Lawyers />,
    payments: <PaymentsManager />,
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
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </ErrorBoundary>
  );
}
