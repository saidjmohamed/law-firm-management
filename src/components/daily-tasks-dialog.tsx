'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTasks, useSessions, useSettings } from '@/lib/api';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  Calendar,
  Clock,
  Flag,
  CheckCircle2,
  ListChecks,
  Gavel,
} from 'lucide-react';

// ============================================================================
// DailyTasksDialog — نافذة منبثقة تظهر مرة واحدة يومياً عند تسجيل الدخول
// تعرض: المهام المتأخرة + مهام اليوم + الجلسات القادمة + المهام المستعجلة
// ============================================================================

const SETTING_KEY = 'dailyTasksDialogLastShown';

export function DailyTasksDialog() {
  const { tasks } = useTasks();
  const { sessions } = useSessions();
  const { settings } = useSettings();
  const { setActiveSection } = useAppStore();
  const [open, setOpen] = useState(false);

  // ========================================================================
  // قراءة تاريخ آخر عرض من settings
  // ========================================================================
  const today = new Date().toISOString().slice(0, 10);
  const lastShown = useMemo(() => {
    if (!settings) return '';
    // settings هو object {key: value} من API
    return (settings as any)[SETTING_KEY] || '';
  }, [settings]);

  // ========================================================================
  // فتح النافذة مرة واحدة يومياً + فقط إذا توجد مهام تستحق التنبيه
  // ========================================================================
  const stats = useMemo(() => computeTaskStats(tasks), [tasks]);
  const shouldShow = (
    lastShown !== today &&
    (stats.overdue > 0 || stats.today > 0 || stats.urgent > 0)
  );

  useEffect(() => {
    if (shouldShow) {
      // تأخير 800ms لتفادي الوميض أثناء تحميل الصفحة
      const t = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(t);
    }
  }, [shouldShow]);

  // ========================================================================
  // تسجيل تاريخ العرض عند الإغلاق
  // ========================================================================
  async function handleClose() {
    setOpen(false);
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: SETTING_KEY, value: today }),
      });
    } catch {
      // non-fatal
    }
  }

  // ========================================================================
  // تجميع البيانات للعرض
  // ========================================================================
  const overdueTasks = useMemo(() =>
    tasks
      .filter((t: any) => t.status !== 'completed' && getTaskUrgency(t) === 'overdue')
      .slice(0, 5),
    [tasks]
  );

  const todayTasks = useMemo(() =>
    tasks
      .filter((t: any) => t.status !== 'completed' && getTaskUrgency(t) === 'today')
      .slice(0, 5),
    [tasks]
  );

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const tomorrowEnd = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

  const upcomingSessions = useMemo(() =>
    sessions.filter((s: any) => {
      if (!s.date) return false;
      const d = new Date(s.date);
      if (isNaN(d.getTime())) return false;
      return d >= now && d <= tomorrowEnd && s.status !== 'cancelled';
    }),
    [sessions, now, tomorrowEnd]
  );

  // ========================================================================
  // Render
  // ========================================================================
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ListChecks className="w-6 h-6 text-primary" />
            جدول اليوم — {new Date().toLocaleDateString('en-GB')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* ملخص سريع */}
          <div className="grid grid-cols-3 gap-2">
            <SummaryBox
              label="متأخرة"
              value={stats.overdue}
              icon={AlertTriangle}
              color="red"
            />
            <SummaryBox
              label="اليوم"
              value={stats.today}
              icon={Clock}
              color="orange"
            />
            <SummaryBox
              label="مستعجلة"
              value={stats.urgent}
              icon={Flag}
              color="rose"
            />
          </div>

          {/* المهام المتأخرة */}
          {overdueTasks.length > 0 && (
            <div>
              <h3 className="font-bold text-base flex items-center gap-2 mb-2 text-red-700 dark:text-red-400">
                <AlertTriangle className="w-5 h-5" />
                مهام متأخرة ({overdueTasks.length})
              </h3>
              <div className="space-y-2">
                {overdueTasks.map((t: any) => (
                  <TaskRow key={t.id} task={t} variant="overdue" />
                ))}
              </div>
            </div>
          )}

          {/* مهام اليوم */}
          {todayTasks.length > 0 && (
            <div>
              <h3 className="font-bold text-base flex items-center gap-2 mb-2 text-orange-700 dark:text-orange-400">
                <Clock className="w-5 h-5" />
                مهام اليوم ({todayTasks.length})
              </h3>
              <div className="space-y-2">
                {todayTasks.map((t: any) => (
                  <TaskRow key={t.id} task={t} variant="today" />
                ))}
              </div>
            </div>
          )}

          {/* الجلسات القادمة (اليوم وغداً) */}
          {upcomingSessions.length > 0 && (
            <div>
              <h3 className="font-bold text-base flex items-center gap-2 mb-2 text-blue-700 dark:text-blue-400">
                <Calendar className="w-5 h-5" />
                جلسات قادمة ({upcomingSessions.length})
              </h3>
              <div className="space-y-2">
                {upcomingSessions.map((s: any) => {
                  const sd = new Date(s.date);
                  const isToday = sd.toDateString() === new Date().toDateString();
                  return (
                    <div
                      key={s.id}
                      className={`p-3 rounded-lg border ${
                        isToday
                          ? 'border-blue-300 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20'
                          : 'border-muted'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm">
                            {s.caseNumber || '—'}
                            {s.time && <span className="text-muted-foreground font-normal"> — {s.time}</span>}
                          </p>
                          {s.court && <p className="text-[13px] text-muted-foreground mt-0.5">{s.court}</p>}
                          {s.chamber && <p className="text-[12px] text-muted-foreground">{s.chamber}</p>}
                        </div>
                        <div className="text-left shrink-0">
                          <DateDisplay value={s.date} className="font-bold text-sm" />
                          <p className={`text-[12px] font-bold ${isToday ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                            {isToday ? 'اليوم' : 'غداً'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* حالة فارغة */}
          {overdueTasks.length === 0 && todayTasks.length === 0 && upcomingSessions.length === 0 && (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-2" />
              <p className="font-bold text-base">لا توجد مهام عاجلة اليوم</p>
              <p className="text-sm text-muted-foreground mt-1">يوم خالٍ من التنبيهات</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            إغلاق
          </Button>
          <Button
            onClick={() => { handleClose(); setActiveSection('tasks'); }}
            className="bg-gradient-primary"
          >
            <ListChecks className="w-4 h-4" />
            عرض كل المهام
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// بطاقة ملخص
// ============================================================================
function SummaryBox({ label, value, icon: Icon, color }: {
  label: string; value: number; icon: React.ElementType; color: string;
}) {
  const colors: Record<string, string> = {
    red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    rose: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  };
  return (
    <div className="flex items-center gap-2 p-3 rounded-lg border bg-card">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-[12px] text-muted-foreground">{label}</p>
        <p className="text-lg font-extrabold tabular-nums">{value}</p>
      </div>
    </div>
  );
}

// ============================================================================
// صف مهمة
// ============================================================================
function TaskRow({ task, variant }: { task: any; variant: 'overdue' | 'today' }) {
  const days = daysRemaining(task.dueDate, task.legalDeadline);
  const isLegal = task.taskType === 'legal_procedure';
  const bg = variant === 'overdue'
    ? 'border-red-300 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20'
    : 'border-orange-300 dark:border-orange-900/50 bg-orange-50/50 dark:bg-orange-950/20';

  return (
    <div className={`p-3 rounded-lg border ${bg}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-bold text-sm">
            {task.title}
            {isLegal && <Gavel className="inline w-3.5 h-3.5 mr-1 text-emerald-600 dark:text-emerald-400" />}
          </p>
          <div className="flex items-center gap-2 mt-1 text-[12px] text-muted-foreground">
            {task.relatedCase?.caseNumber && <span>📁 {task.relatedCase.caseNumber}</span>}
            {TASK_TYPE_LABELS[task.taskType] && <span>• {TASK_TYPE_LABELS[task.taskType]}</span>}
          </div>
        </div>
        <div className="shrink-0 text-left">
          {days !== null && (
            <span className={`text-[13px] font-bold ${
              variant === 'overdue' ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'
            }`}>
              {variant === 'overdue' ? `متأخرة ${Math.abs(days)}ي` : 'اليوم'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
