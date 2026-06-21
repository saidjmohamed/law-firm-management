// ============================================================================
// ثوابت وأدوات المهام والإجراءات القانونية
// ============================================================================

// أنواع المهام
export const TASK_TYPES = [
  { value: 'session',         label: 'جلسة' },
  { value: 'memo',            label: 'مذكرة' },
  { value: 'appeal',          label: 'طعن' },
  { value: 'notification',    label: 'تبليغ' },
  { value: 'notice',          label: 'إعذار' },
  { value: 'execution',       label: 'تنفيذ' },
  { value: 'consultation',    label: 'استشارة' },
  { value: 'legal_procedure', label: 'إجراء قانوني' },
  { value: 'other',           label: 'أخرى' },
] as const;

// الأولويات
export const TASK_PRIORITIES = [
  { value: 'high',   label: 'عالية',   color: 'red' },
  { value: 'medium', label: 'متوسطة',  color: 'amber' },
  { value: 'low',    label: 'منخفضة',  color: 'gray' },
] as const;

// الحالات
export const TASK_STATUSES = [
  { value: 'pending',     label: 'قيد الإنجاز' },
  { value: 'in_progress', label: 'قيد التنفيذ' },
  { value: 'completed',   label: 'منجزة' },
] as const;

// قاموس للحصول على label من value
export const TASK_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  TASK_TYPES.map((t) => [t.value, t.label])
);

export const PRIORITY_LABELS: Record<string, string> = Object.fromEntries(
  TASK_PRIORITIES.map((p) => [p.value, p.label])
);

export const STATUS_LABELS: Record<string, string> = Object.fromEntries(
  TASK_STATUSES.map((s) => [s.value, s.label])
);

// ============================================================================
// ألوان الأولوية
// ============================================================================
export const PRIORITY_COLORS: Record<string, string> = {
  high:   'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-900/50',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-900/50',
  low:    'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400 border-gray-200 dark:border-gray-700',
};

// ============================================================================
// ألوان النوع
// ============================================================================
export const TASK_TYPE_COLORS: Record<string, string> = {
  session:         'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  memo:            'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  appeal:          'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  notification:    'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
  notice:          'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  execution:       'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
  consultation:    'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  legal_procedure: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800',
  other:           'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400',
};

// ============================================================================
// تمثيل بصري للحالة (مع المؤشرات الديناميكية)
// ============================================================================
export type TaskUrgency = 'overdue' | 'today' | 'week' | 'urgent' | 'normal' | 'completed';

export const URGENCY_COLORS: Record<TaskUrgency, string> = {
  overdue:   'border-r-4 border-red-500 bg-red-50/50 dark:bg-red-950/20',
  today:     'border-r-4 border-orange-500 bg-orange-50/50 dark:bg-orange-950/20',
  week:      'border-r-4 border-amber-400 bg-amber-50/30 dark:bg-amber-950/10',
  urgent:    'border-r-4 border-rose-500 bg-rose-50/50 dark:bg-rose-950/20',
  normal:    'border-r-4 border-transparent',
  completed: 'border-r-4 border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/10 opacity-70',
};

export const URGENCY_LABELS: Record<TaskUrgency, string> = {
  overdue:   'متأخرة',
  today:     'اليوم',
  week:      'هذا الأسبوع',
  urgent:    'مستعجلة',
  normal:    'عادية',
  completed: 'منجزة',
};

// ============================================================================
// حساب حالة الإلحاح من تاريخ الاستحقاق
// ============================================================================
export function getTaskUrgency(task: {
  status?: string | null;
  dueDate?: Date | string | null;
  legalDeadline?: Date | string | null;
  priority?: string | null;
}): TaskUrgency {
  if (task.status === 'completed') return 'completed';

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // استخدم legalDeadline إذا كان إجراءً قانونياً، وإلا dueDate
  const target = task.legalDeadline ?? task.dueDate;
  if (!target) {
    // مهمة بدون تاريخ — استعجلية فقط إذا الأولوية عالية
    return task.priority === 'high' ? 'urgent' : 'normal';
  }

  const d = new Date(target);
  if (isNaN(d.getTime())) return 'normal';
  d.setHours(0, 0, 0, 0);

  const diffDays = Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'overdue';
  if (diffDays === 0) return 'today';
  if (diffDays <= 7) return 'week';
  return 'normal';
}

// ============================================================================
// عدد الأيام المتبقية (سلبي = متأخر)
// ============================================================================
export function daysRemaining(
  dueDate: Date | string | null | undefined,
  legalDeadline?: Date | string | null | undefined
): number | null {
  const target = legalDeadline ?? dueDate;
  if (!target) return null;
  const d = new Date(target);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// ============================================================================
// مؤشرات Dashboard
// ============================================================================
export interface TaskStats {
  overdue: number;
  today: number;
  thisWeek: number;
  completed: number;
  urgent: number;
  total: number;
  pending: number;
}

export function computeTaskStats(tasks: any[]): TaskStats {
  const stats: TaskStats = {
    overdue: 0, today: 0, thisWeek: 0,
    completed: 0, urgent: 0, total: 0, pending: 0,
  };

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  weekEnd.setHours(23, 59, 59, 999);

  for (const t of tasks) {
    stats.total++;
    if (t.status === 'completed') { stats.completed++; continue; }
    stats.pending++;

    if (t.priority === 'high') stats.urgent++;

    const target = t.legalDeadline ?? t.dueDate;
    if (!target) continue;
    const d = new Date(target);
    if (isNaN(d.getTime())) continue;
    d.setHours(0, 0, 0, 0);

    if (d < now) stats.overdue++;
    else if (d.getTime() === now.getTime()) stats.today++;
    else if (d >= now && d <= weekEnd) stats.thisWeek++;
  }

  return stats;
}

// ============================================================================
// فك ترميز reminderOffsets
// ============================================================================
export function parseReminderOffsets(offsets: string | null | undefined): number[] {
  if (!offsets) return [7, 1, 0];
  try {
    const arr = JSON.parse(offsets);
    return Array.isArray(arr) ? arr.map(Number).filter((n) => !isNaN(n)) : [7, 1, 0];
  } catch {
    return [7, 1, 0];
  }
}

// ============================================================================
// حساب التذكيرات النشطة لمهمة (للعرض)
// ============================================================================
export interface ActiveReminder {
  offsetDays: number;
  date: Date;
  status: 'past' | 'today' | 'future';
}

export function getActiveReminders(
  dueDate: Date | string | null | undefined,
  legalDeadline: Date | string | null | undefined,
  reminderOffsets: string | null | undefined
): ActiveReminder[] {
  const target = legalDeadline ?? dueDate;
  if (!target) return [];
  const base = new Date(target);
  if (isNaN(base.getTime())) return [];

  const offsets = parseReminderOffsets(reminderOffsets);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return offsets.map((offsetDays) => {
    const date = new Date(base.getTime() - offsetDays * 24 * 60 * 60 * 1000);
    date.setHours(0, 0, 0, 0);
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    let status: 'past' | 'today' | 'future' = 'future';
    if (date.getTime() < today.getTime()) status = 'past';
    else if (date.getTime() === today.getTime()) status = 'today';
    return { offsetDays, date, status };
  });
}
