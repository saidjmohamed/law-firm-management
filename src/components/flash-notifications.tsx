'use client';

import React, { useMemo } from 'react';
import { useTasks, useSessions, useDelays, useCases } from '@/lib/api';
import {
  computeTaskStats,
  getTaskUrgency,
  daysRemaining,
  TASK_TYPE_LABELS,
  URGENCY_LABELS,
} from '@/lib/tasks';
import { useAppStore } from '@/lib/store';
import { DateDisplay } from '@/components/ui/date-display';
import {
  AlertTriangle,
  Calendar,
  Clock,
  Flag,
  X,
  Bell,
} from 'lucide-react';

// ============================================================================
// Flash Notifications — شريط تنبيهات ثابت في أعلى الصفحة الرئيسية
// يعرض:
//   - المهام المتأخرة (أحمر)
//   - المهام المستحقة خلال 7 أيام (برتقالي)
//   - عدد الجلسات القادمة (أزرق)
// ============================================================================

export function FlashNotifications() {
  const { tasks } = useTasks();
  const { sessions } = useSessions();
  const { delays } = useDelays();
  const { cases } = useCases();
  const { setActiveSection, setSelectedCaseId } = useAppStore();
  const [dismissed, setDismissed] = React.useState(false);

  // ========================================================================
  // حساب التنبيهات
  // ========================================================================
  const alerts = useMemo(() => {
    const result: {
      type: 'overdue' | 'week' | 'today' | 'sessions' | 'urgent';
      icon: React.ElementType;
      color: string;
      bg: string;
      title: string;
      details?: string;
      action?: () => void;
    }[] = [];

    const stats = computeTaskStats(tasks);

    // 1) مهام متأخرة
    if (stats.overdue > 0) {
      // اعرض تفاصيل أول 2 متأخرة
      const overdueTasks = tasks
        .filter((t: any) => t.status !== 'completed' && getTaskUrgency(t) === 'overdue')
        .slice(0, 2);

      result.push({
        type: 'overdue',
        icon: AlertTriangle,
        color: 'text-red-700 dark:text-red-300',
        bg: 'bg-red-100 dark:bg-red-950/40 border-red-300 dark:border-red-900/60',
        title: `لديك ${stats.overdue} مهمة متأخرة`,
        details: overdueTasks.map((t: any) => `• ${t.title}${t.relatedCase?.caseNumber ? ` (${t.relatedCase.caseNumber})` : ''}`).join(' — '),
        action: () => setActiveSection('tasks'),
      });
    }

    // 2) مهام اليوم
    if (stats.today > 0) {
      result.push({
        type: 'today',
        icon: Clock,
        color: 'text-orange-700 dark:text-orange-300',
        bg: 'bg-orange-100 dark:bg-orange-950/40 border-orange-300 dark:border-orange-900/60',
        title: `لديك ${stats.today} مهمة مستحقة اليوم`,
        action: () => setActiveSection('tasks'),
      });
    }

    // 3) مهام خلال 7 أيام
    if (stats.thisWeek > 0) {
      // اعرض أقرب مهمة كتفاصيل
      const upcoming = tasks
        .filter((t: any) => t.status !== 'completed' && getTaskUrgency(t) === 'week')
        .map((t: any) => ({ t, days: daysRemaining(t.dueDate, t.legalDeadline) }))
        .sort((a: any, b: any) => (a.days ?? 999) - (b.days ?? 999))
        .slice(0, 1);

      const detail = upcoming[0];
      result.push({
        type: 'week',
        icon: Calendar,
        color: 'text-amber-700 dark:text-amber-300',
        bg: 'bg-amber-100 dark:bg-amber-950/40 border-amber-300 dark:border-amber-900/60',
        title: `لديك ${stats.thisWeek} مهمة خلال الأسبوع القادم`,
        details: detail
          ? `أقربها: ${detail.t.title}${detail.days !== null ? ` — ${detail.days === 1 ? 'غداً' : `بعد ${detail.days} أيام`}` : ''}`
          : undefined,
        action: () => setActiveSection('tasks'),
      });
    }

    // 4) مهام مستعجلة (priority=high)
    if (stats.urgent > 0) {
      result.push({
        type: 'urgent',
        icon: Flag,
        color: 'text-rose-700 dark:text-rose-300',
        bg: 'bg-rose-100 dark:bg-rose-950/40 border-rose-300 dark:border-rose-900/60',
        title: `لديك ${stats.urgent} مهمة مستعجلة`,
        action: () => setActiveSection('tasks'),
      });
    }

    // 5) الجلسات القادمة (خلال 7 أيام)
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    weekEnd.setHours(23, 59, 59, 999);

    const upcomingSessions = sessions.filter((s: any) => {
      if (!s.date) return false;
      const d = new Date(s.date);
      if (isNaN(d.getTime())) return false;
      return d >= now && d <= weekEnd && s.status !== 'cancelled';
    });

    if (upcomingSessions.length > 0) {
      // اعرض جلسات الغد كتفاصيل
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      tomorrow.setHours(0, 0, 0, 0);
      const tomorrowEnd = new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000 - 1);

      const tomorrowSessions = upcomingSessions.filter((s: any) => {
        const d = new Date(s.date);
        return d >= tomorrow && d <= tomorrowEnd;
      });

      result.push({
        type: 'sessions',
        icon: Calendar,
        color: 'text-blue-700 dark:text-blue-300',
        bg: 'bg-blue-100 dark:bg-blue-950/40 border-blue-300 dark:border-blue-900/60',
        title: `لديك ${upcomingSessions.length} جلسة خلال الأسبوع القادم`,
        details: tomorrowSessions.length > 0
          ? `${tomorrowSessions.length} منها غداً`
          : undefined,
        action: () => setActiveSection('cases'),
      });
    }

    return result;
  }, [tasks, sessions, delays, cases, setActiveSection]);

  if (alerts.length === 0 || dismissed) return null;

  return (
    <div className="space-y-2">
      {/* شريط العنوان */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Bell className="w-4 h-4" />
          <span>تنبيهات اليوم — {alerts.length}</span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-accent"
          aria-label="إخفاء التنبيهات"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* بطاقات التنبيهات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {alerts.map((alert, i) => {
          const Icon = alert.icon;
          return (
            <button
              key={i}
              onClick={alert.action}
              className={`flex items-start gap-3 p-3 rounded-xl border text-right transition-all hover:shadow-md hover:-translate-y-0.5 ${alert.bg}`}
            >
              <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${alert.color}`} />
              <div className="min-w-0 flex-1">
                <p className={`font-bold text-sm ${alert.color}`}>{alert.title}</p>
                {alert.details && (
                  <p className="text-[12px] text-muted-foreground mt-0.5 line-clamp-2">{alert.details}</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
