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
import { Sessions } from '@/components/sessions';
import { CalendarView } from '@/components/calendar';
import { DelaysManager } from '@/components/delays';
import { ArchivesManager } from '@/components/archives';
import { Converter } from '@/components/converter';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';

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
    console.error('App ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div dir="rtl" className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100 p-6 font-sans">
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl shadow-2xl p-8 max-w-lg w-full text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 mb-2">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-100">حدث خطأ غير متوقع في التطبيق</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              {this.state.error?.message || 'تم اعتراض خطأ في واجهة المستخدم. نرجو المحاولة مرة أخرى أو تحديث الصفحة.'}
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-xl transition-all shadow-md flex items-center gap-2 text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>إعادة المحاولة</span>
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold rounded-xl transition-all text-sm"
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

function LoadingScreen() {
  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100 font-sans">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
        </div>
        <p className="text-sm font-medium text-slate-400 animate-pulse">
          جاري تحميل منظومة إدارة مكتب المحاماة...
        </p>
      </div>
    </div>
  );
}

function AppContent() {
  const { activeSection } = useAppStore();

  const renderactiveSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'cases':
        return <Cases />;
      case 'clients':
        return <Clients />;
      case 'sessions':
        return <SessionsManager />;
      case 'courts':
        return <CourtsManager />;
      case 'lawyers':
        return <Lawyers />;
      case 'payments':
        return <PaymentsManager />;
      case 'tasks':
        return <TasksManager />;
      case 'calendar':
        return <CalendarView />;
      case 'delays':
        return <DelaysManager />;
      case 'archives':
        return <ArchivesManager />;
      case 'converter':
        return <ConverterManager />;
      case 'backup':
        return <BackupManager />;
      case 'settings':
        return <SettingsManager />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <AppShell>
      <main className="w-full h-full min-h-[calc(100vh-4rem)] bg-slate-900">
        {renderactiveSection()}
      </main>
    </AppShell>
  );
}

export default function MainPage() {
  return (
    <ErrorBoundary>
      <React.Suspense fallback={<LoadingScreen />}>
        <AppContent />
      </React.Suspense>
    </ErrorBoundary>
  );
}
