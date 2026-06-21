'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  useTasks, useCases, useClients, createTask, updateTask, deleteTask,
} from '@/lib/api';
import {
  TASK_TYPES, TASK_PRIORITIES, TASK_STATUSES,
  TASK_TYPE_LABELS, PRIORITY_LABELS, STATUS_LABELS,
  PRIORITY_COLORS, TASK_TYPE_COLORS,
  getTaskUrgency, daysRemaining, computeTaskStats,
  parseReminderOffsets, getActiveReminders,
  URGENCY_COLORS, URGENCY_LABELS,
  type TaskUrgency,
} from '@/lib/tasks';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { DateDisplay, toDateInputValue } from '@/components/ui/date-display';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  ListChecks,
  Table as TableIcon,
  Calendar as CalendarIcon,
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  Pencil,
  Trash2,
  Loader2,
  Gavel,
  Flag,
  RotateCcw,
  LayoutGrid,
} from 'lucide-react';
import { toDateOrNull } from '@/lib/date-utils';

// ============================================================================
// أنواع
// ============================================================================
interface TaskType {
  id: number;
  title: string;
  description?: string | null;
  taskType: string;
  priority: string;
  status: string;
  dueDate?: string | null;
  startDate?: string | null;
  legalDeadline?: string | null;
  reminderOffsets?: string | null;
  sourceType?: string | null;
  sourceId?: number | null;
  relatedCaseId?: number | null;
  relatedClientId?: number | null;
  assignedTo?: string | null;
  notes?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  relatedCase?: { id: number; caseNumber: string; subject: string; status?: string } | null;
  relatedClient?: { id: number; name: string; phone?: string } | null;
}

// ============================================================================
// النموذج الفارغ
// ============================================================================
function emptyForm(): Record<string, unknown> {
  return {
    title: '',
    description: '',
    taskType: 'other',
    priority: 'medium',
    status: 'pending',
    dueDate: '',
    startDate: '',
    legalDeadline: '',
    reminderOffsets: [7, 1, 0],
    relatedCaseId: null,
    relatedClientId: null,
    notes: '',
  };
}

// ============================================================================
// المكوّن الرئيسي
// ============================================================================
export function TasksManager() {
  const { tasks, isLoading } = useTasks();
  const { cases } = useCases();
  const { clients } = useClients();
  const { selectedTaskId, setSelectedTaskId, selectedCaseId } = useAppStore();

  const [view, setView] = useState<'list' | 'table' | 'kanban'>('list');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCaseId, setFilterCaseId] = useState<string>('all');
  const [filterClientId, setFilterClientId] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskType | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>(emptyForm());

  // إذا تم تعيين selectedCaseId من خارج (مثلاً من صفحة قضية) نفلتر عليه
  // نستخدم useEffect مع تبرير: تهيئة الفلتر من مصدر خارجي (prop-driven state)
  React.useEffect(() => {
    if (selectedCaseId && selectedCaseId > 0) {
      setFilterCaseId(String(selectedCaseId));
    }
  }, [selectedCaseId]);

  // ========================================================================
  // التصفية والبحث
  // ========================================================================
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((t: TaskType) =>
        (t.title || '').toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q) ||
        (t.notes || '').toLowerCase().includes(q) ||
        (t.relatedCase?.caseNumber || '').toLowerCase().includes(q) ||
        (t.relatedClient?.name || '').toLowerCase().includes(q)
      );
    }

    if (filterStatus !== 'all') result = result.filter((t: TaskType) => t.status === filterStatus);
    if (filterPriority !== 'all') result = result.filter((t: TaskType) => t.priority === filterPriority);
    if (filterType !== 'all') result = result.filter((t: TaskType) => t.taskType === filterType);
    if (filterCaseId !== 'all') result = result.filter((t: TaskType) => String(t.relatedCaseId) === filterCaseId);
    if (filterClientId !== 'all') result = result.filter((t: TaskType) => String(t.relatedClientId) === filterClientId);

    return result;
  }, [tasks, search, filterStatus, filterPriority, filterType, filterCaseId, filterClientId]);

  // ========================================================================
  // إحصائيات
  // ========================================================================
  const stats = useMemo(() => computeTaskStats(tasks), [tasks]);

  // ========================================================================
  // فتح/إغلاق النموذج
  // ========================================================================
  function openAddForm() {
    setEditingTask(null);
    setFormData({
      ...emptyForm(),
      relatedCaseId: selectedCaseId ?? null,
    });
    setShowForm(true);
  }

  function openEditForm(task: TaskType) {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      taskType: task.taskType,
      priority: task.priority,
      status: task.status,
      dueDate: toDateInputValue(task.dueDate),
      startDate: toDateInputValue(task.startDate),
      legalDeadline: toDateInputValue(task.legalDeadline),
      reminderOffsets: parseReminderOffsets(task.reminderOffsets),
      relatedCaseId: task.relatedCaseId,
      relatedClientId: task.relatedClientId,
      notes: task.notes || '',
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingTask(null);
    setFormData(emptyForm());
  }

  // ========================================================================
  // حفظ
  // ========================================================================
  async function handleSave() {
    if (!(formData.title as string)?.trim()) {
      toast.error('العنوان مطلوب');
      return;
    }

    try {
      if (editingTask) {
        await updateTask(editingTask.id, formData);
        toast.success('تم تحديث المهمة');
      } else {
        await createTask(formData);
        toast.success('تم إنشاء المهمة');
      }
      closeForm();
    } catch (e) {
      toast.error('فشل في الحفظ');
      console.error(e);
    }
  }

  // ========================================================================
  // حذف
  // ========================================================================
  async function handleDelete(id: number) {
    if (!confirm('هل أنت متأكد من حذف هذه المهمة؟')) return;
    try {
      await deleteTask(id);
      toast.success('تم حذف المهمة');
    } catch {
      toast.error('فشل في الحذف');
    }
  }

  // ========================================================================
  // تغيير الحالة السريع
  // ========================================================================
  async function quickStatusChange(task: TaskType, newStatus: string) {
    try {
      await updateTask(task.id, { status: newStatus });
      toast.success('تم تحديث حالة المهمة');
    } catch {
      toast.error('فشل التحديث');
    }
  }

  // ========================================================================
  // Loading
  // ========================================================================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatBox label="متأخرة" value={stats.overdue} icon={AlertCircle} color="red" />
        <StatBox label="اليوم" value={stats.today} icon={Clock} color="orange" />
        <StatBox label="هذا الأسبوع" value={stats.thisWeek} icon={CalendarIcon} color="amber" />
        <StatBox label="مستعجلة" value={stats.urgent} icon={Flag} color="rose" />
        <StatBox label="منجزة" value={stats.completed} icon={CheckCircle2} color="emerald" />
      </div>

      {/* شريط الأدوات */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={openAddForm} className="bg-gradient-primary hover:shadow-elevated btn-luxe">
              <Plus className="w-5 h-5" />
              مهمة جديدة
            </Button>

            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="ابحث في المهام..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>

            {/* مبدّل العرض */}
            <Tabs value={view} onValueChange={(v) => setView(v as any)}>
              <TabsList>
                <TabsTrigger value="list"><ListChecks className="w-4 h-4" /> قائمة</TabsTrigger>
                <TabsTrigger value="table"><TableIcon className="w-4 h-4" /> جدول</TabsTrigger>
                <TabsTrigger value="kanban"><LayoutGrid className="w-4 h-4" /> كانبان</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* الفلاتر */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <Label className="text-xs">الحالة</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  {TASK_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">الأولوية</Label>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  {TASK_PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">النوع</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  {TASK_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">القضية</Label>
              <Select value={filterCaseId} onValueChange={setFilterCaseId}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل القضايا</SelectItem>
                  {cases.map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.caseNumber || `قضية ${c.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">الموكل</Label>
              <Select value={filterClientId} onValueChange={setFilterClientId}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الموكلين</SelectItem>
                  {clients.map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* المحتوى حسب العرض */}
      {filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <ListChecks className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد مهام مطابقة</p>
          </CardContent>
        </Card>
      ) : view === 'list' ? (
        <TaskListView
          tasks={filteredTasks}
          onEdit={openEditForm}
          onDelete={handleDelete}
          onStatusChange={quickStatusChange}
        />
      ) : view === 'table' ? (
        <TaskTableView
          tasks={filteredTasks}
          onEdit={openEditForm}
          onDelete={handleDelete}
          onStatusChange={quickStatusChange}
        />
      ) : (
        <TaskKanbanView
          tasks={filteredTasks}
          onEdit={openEditForm}
          onDelete={handleDelete}
          onStatusChange={quickStatusChange}
        />
      )}

      {/* نافذة النموذج */}
      <TaskFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        editingTask={editingTask}
        formData={formData}
        setFormData={setFormData}
        onSave={handleSave}
        onClose={closeForm}
      />
    </div>
  );
}

// ============================================================================
// بطاقة إحصائية
// ============================================================================
function StatBox({ label, value, icon: Icon, color }: {
  label: string; value: number; icon: React.ElementType; color: string;
}) {
  const colors: Record<string, string> = {
    red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    rose: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  };
  return (
    <Card className="stat-card-hover">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${colors[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[13px] text-muted-foreground">{label}</p>
            <p className="text-2xl font-extrabold tabular-nums">{value.toLocaleString('en-US')}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// عرض قائمة
// ============================================================================
function TaskListView({ tasks, onEdit, onDelete, onStatusChange }: {
  tasks: TaskType[];
  onEdit: (t: TaskType) => void;
  onDelete: (id: number) => void;
  onStatusChange: (t: TaskType, status: string) => void;
}) {
  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onEdit={() => onEdit(task)}
          onDelete={() => onDelete(task.id)}
          onStatusChange={(s) => onStatusChange(task, s)}
        />
      ))}
    </div>
  );
}

// ============================================================================
// بطاقة مهمة واحدة
// ============================================================================
function TaskCard({ task, onEdit, onDelete, onStatusChange }: {
  task: TaskType;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: string) => void;
}) {
  const urgency = getTaskUrgency(task);
  const days = daysRemaining(task.dueDate, task.legalDeadline);
  const reminders = getActiveReminders(task.dueDate, task.legalDeadline, task.reminderOffsets);
  const isLegal = task.taskType === 'legal_procedure';

  return (
    <Card className={`${URGENCY_COLORS[urgency]} hover:shadow-md transition-shadow`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* زر إكمال سريع */}
          <button
            onClick={() => onStatusChange(task.status === 'completed' ? 'pending' : 'completed')}
            className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
              task.status === 'completed'
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : 'border-gray-300 dark:border-gray-600 hover:border-emerald-500'
            }`}
            aria-label="تبديل الإنجاز"
          >
            {task.status === 'completed' && <CheckCircle2 className="w-4 h-4" />}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="flex-1 min-w-0">
                <h3 className={`font-bold text-base ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                  {task.title}
                  {isLegal && <Gavel className="inline w-4 h-4 mr-1.5 text-emerald-600 dark:text-emerald-400" />}
                </h3>
                {task.description && (
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{task.description}</p>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* الشارات */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
              <Badge variant="outline" className={TASK_TYPE_COLORS[task.taskType] || TASK_TYPE_COLORS.other}>
                {TASK_TYPE_LABELS[task.taskType] || task.taskType}
              </Badge>
              <Badge variant="outline" className={PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium}>
                {PRIORITY_LABELS[task.priority] || task.priority}
              </Badge>
              <Badge variant="outline" className="text-[13px]">
                {STATUS_LABELS[task.status] || task.status}
              </Badge>
              {urgency !== 'normal' && urgency !== 'completed' && (
                <Badge className={`text-[13px] ${URGENCY_COLORS[urgency]}`}>
                  {URGENCY_LABELS[urgency]}
                </Badge>
              )}
            </div>

            {/* التواريخ */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm">
              {isLegal ? (
                <>
                  {task.startDate && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">البداية:</span>
                      <DateDisplay value={task.startDate} className="font-medium" />
                    </div>
                  )}
                  {task.legalDeadline && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">الأجل النهائي:</span>
                      <DateDisplay value={task.legalDeadline} className="font-bold" />
                    </div>
                  )}
                </>
              ) : (
                task.dueDate && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">الاستحقاق:</span>
                    <DateDisplay value={task.dueDate} className="font-medium" />
                  </div>
                )
              )}

              {days !== null && task.status !== 'completed' && (
                <span className={`text-[13px] font-bold ${
                  days < 0 ? 'text-red-600 dark:text-red-400'
                  : days === 0 ? 'text-orange-600 dark:text-orange-400'
                  : days <= 7 ? 'text-amber-600 dark:text-amber-400'
                  : 'text-muted-foreground'
                }`}>
                  {days < 0 ? `متأخرة بـ ${Math.abs(days)} يوم`
                   : days === 0 ? 'اليوم'
                   : days === 1 ? 'غداً'
                   : `بعد ${days} يوم`}
                </span>
              )}
            </div>

            {/* الارتباطات */}
            {(task.relatedCase || task.relatedClient) && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                {task.relatedCase && (
                  <span>📁 {task.relatedCase.caseNumber || '—'} — {task.relatedCase.subject || ''}</span>
                )}
                {task.relatedClient && (
                  <span>👤 {task.relatedClient.name}{task.relatedClient.phone ? ` (${task.relatedClient.phone})` : ''}</span>
                )}
              </div>
            )}

            {/* التذكيرات النشطة */}
            {reminders.length > 0 && task.status !== 'completed' && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[12px] text-muted-foreground">تذكيرات:</span>
                {reminders.map((r, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className={`text-[11px] ${
                      r.status === 'today' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                      : r.status === 'past' ? 'opacity-50'
                      : 'bg-muted'
                    }`}
                  >
                    {r.offsetDays === 0 ? 'يوم الاستحقاق'
                     : r.offsetDays === 1 ? 'قبل يوم'
                     : `قبل ${r.offsetDays} أيام`}
                  </Badge>
                ))}
              </div>
            )}

            {/* ملاحظات */}
            {task.notes && (
              <p className="text-[13px] text-muted-foreground mt-2 italic">📝 {task.notes}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// عرض جدولي
// ============================================================================
function TaskTableView({ tasks, onEdit, onDelete, onStatusChange }: {
  tasks: TaskType[];
  onEdit: (t: TaskType) => void;
  onDelete: (id: number) => void;
  onStatusChange: (t: TaskType, status: string) => void;
}) {
  return (
    <Card>
      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr className="text-right">
              <th className="p-3 text-[13px] font-semibold">المهمة</th>
              <th className="p-3 text-[13px] font-semibold">النوع</th>
              <th className="p-3 text-[13px] font-semibold">الأولوية</th>
              <th className="p-3 text-[13px] font-semibold">الحالة</th>
              <th className="p-3 text-[13px] font-semibold">الاستحقاق</th>
              <th className="p-3 text-[13px] font-semibold">القضية</th>
              <th className="p-3 text-[13px] font-semibold">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => {
              const urgency = getTaskUrgency(task);
              const days = daysRemaining(task.dueDate, task.legalDeadline);
              return (
                <tr key={task.id} className={`border-b hover:bg-muted/30 ${URGENCY_COLORS[urgency]}`}>
                  <td className="p-3">
                    <div className="font-medium">{task.title}</div>
                    {task.relatedClient && (
                      <div className="text-[12px] text-muted-foreground">{task.relatedClient.name}</div>
                    )}
                  </td>
                  <td className="p-3">
                    <Badge variant="outline" className={TASK_TYPE_COLORS[task.taskType] || TASK_TYPE_COLORS.other}>
                      {TASK_TYPE_LABELS[task.taskType] || task.taskType}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <Badge variant="outline" className={PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium}>
                      {PRIORITY_LABELS[task.priority]}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <Select
                      value={task.status}
                      onValueChange={(v) => onStatusChange(task, v)}
                    >
                      <SelectTrigger className="h-8 text-[13px] w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TASK_STATUSES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-3">
                    {task.legalDeadline ? <DateDisplay value={task.legalDeadline} />
                    : task.dueDate ? <DateDisplay value={task.dueDate} />
                    : <span className="text-muted-foreground">—</span>}
                    {days !== null && task.status !== 'completed' && (
                      <div className={`text-[12px] font-bold ${
                        days < 0 ? 'text-red-600 dark:text-red-400'
                        : days === 0 ? 'text-orange-600 dark:text-orange-400'
                        : days <= 7 ? 'text-amber-600 dark:text-amber-400'
                        : 'text-muted-foreground'
                      }`}>
                        {days < 0 ? `متأخرة ${Math.abs(days)} يوم` : days === 0 ? 'اليوم' : `بعد ${days} يوم`}
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-[13px]">
                    {task.relatedCase ? (
                      <span>{task.relatedCase.caseNumber}</span>
                    ) : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(task)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(task.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// عرض Kanban (3 أعمدة)
// ============================================================================
function TaskKanbanView({ tasks, onEdit, onDelete, onStatusChange }: {
  tasks: TaskType[];
  onEdit: (t: TaskType) => void;
  onDelete: (id: number) => void;
  onStatusChange: (t: TaskType, status: string) => void;
}) {
  const columns = [
    { id: 'pending', label: 'قيد الإنجاز', color: 'amber' },
    { id: 'in_progress', label: 'قيد التنفيذ', color: 'blue' },
    { id: 'completed', label: 'منجزة', color: 'emerald' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.id);
        return (
          <div key={col.id} className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <h3 className="font-bold text-base">{col.label}</h3>
              <Badge variant="outline" className="text-[13px]">{colTasks.length}</Badge>
            </div>
            <div className="space-y-2 min-h-[100px]">
              {colTasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow cursor-pointer ${
                    URGENCY_COLORS[getTaskUrgency(task)]
                  }`}
                  onClick={() => onEdit(task)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-sm flex-1">{task.title}</h4>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <Badge variant="outline" className={`text-[11px] ${TASK_TYPE_COLORS[task.taskType] || TASK_TYPE_COLORS.other}`}>
                      {TASK_TYPE_LABELS[task.taskType]}
                    </Badge>
                    <Badge variant="outline" className={`text-[11px] ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium}`}>
                      {PRIORITY_LABELS[task.priority]}
                    </Badge>
                  </div>
                  {(task.legalDeadline || task.dueDate) && (
                    <div className="mt-2 text-[12px] text-muted-foreground">
                      <DateDisplay value={task.legalDeadline || task.dueDate} />
                    </div>
                  )}
                  <div className="flex gap-1 mt-2">
                    <Button
                      variant="ghost" size="sm" className="h-7 text-[12px] flex-1"
                      onClick={(e) => { e.stopPropagation(); onEdit(task); }}
                    >
                      <Pencil className="w-3 h-3" /> تعديل
                    </Button>
                    {col.id !== 'completed' && (
                      <Button
                        variant="ghost" size="sm" className="h-7 text-[12px] text-emerald-600"
                        onClick={(e) => { e.stopPropagation(); onStatusChange(task, 'completed'); }}
                      >
                        <CheckCircle2 className="w-3 h-3" /> إنهاء
                      </Button>
                    )}
                    {col.id === 'completed' && (
                      <Button
                        variant="ghost" size="sm" className="h-7 text-[12px]"
                        onClick={(e) => { e.stopPropagation(); onStatusChange(task, 'pending'); }}
                      >
                        <RotateCcw className="w-3 h-3" /> إعادة
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {colTasks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">لا توجد مهام</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// نافذة النموذج (إضافة/تعديل)
// ============================================================================
function TaskFormDialog({
  open, onOpenChange, editingTask, formData, setFormData, onSave, onClose,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTask: TaskType | null;
  formData: Record<string, unknown>;
  setFormData: (data: Record<string, unknown>) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const { cases } = useCases();
  const { clients } = useClients();
  const isLegal = formData.taskType === 'legal_procedure';

  function update(field: string, value: unknown) {
    setFormData({ ...formData, [field]: value });
  }

  function toggleReminderOffset(offset: number) {
    const current = (formData.reminderOffsets as number[]) || [7, 1, 0];
    const next = current.includes(offset)
      ? current.filter((o) => o !== offset)
      : [...current, offset].sort((a, b) => a - b);
    update('reminderOffsets', next);
  }

  const reminderOptions = [14, 7, 3, 1, 0];

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); else onOpenChange(o); }}>
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>{editingTask ? 'تعديل المهمة' : 'مهمة جديدة'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* العنوان */}
          <div>
            <Label>العنوان *</Label>
            <Input
              value={(formData.title as string) || ''}
              onChange={(e) => update('title', e.target.value)}
              placeholder="مثال: إيداع مذكرة الاستئناف"
            />
          </div>

          {/* الوصف */}
          <div>
            <Label>الوصف</Label>
            <Textarea
              value={(formData.description as string) || ''}
              onChange={(e) => update('description', e.target.value)}
              placeholder="تفاصيل المهمة..."
              rows={2}
            />
          </div>

          {/* الصف: النوع + الأولوية + الحالة */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label>النوع</Label>
              <Select value={(formData.taskType as string) || 'other'} onValueChange={(v) => update('taskType', v)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>الأولوية</Label>
              <Select value={(formData.priority as string) || 'medium'} onValueChange={(v) => update('priority', v)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>الحالة</Label>
              <Select value={(formData.status as string) || 'pending'} onValueChange={(v) => update('status', v)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* التواريخ — تختلف حسب النوع */}
          {isLegal ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900">
              <div className="md:col-span-2 flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <Gavel className="w-4 h-4" />
                <span className="text-sm font-bold">إجراء قانوني — يتطلب تاريخ بداية وأجل نهائي</span>
              </div>
              <div>
                <Label>تاريخ البداية</Label>
                <Input
                  type="date" dir="ltr"
                  value={toDateInputValue(formData.startDate as any)}
                  onChange={(e) => update('startDate', e.target.value)}
                />
              </div>
              <div>
                <Label>الأجل القانوني النهائي *</Label>
                <Input
                  type="date" dir="ltr"
                  value={toDateInputValue(formData.legalDeadline as any)}
                  onChange={(e) => update('legalDeadline', e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div>
              <Label>تاريخ الاستحقاق</Label>
              <Input
                type="date" dir="ltr"
                value={toDateInputValue(formData.dueDate as any)}
                onChange={(e) => update('dueDate', e.target.value)}
              />
            </div>
          )}

          {/* التذكيرات */}
          <div>
            <Label>التذكيرات (تُحسب ديناميكياً من تاريخ الاستحقاق)</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {reminderOptions.map((offset) => {
                const active = ((formData.reminderOffsets as number[]) || []).includes(offset);
                return (
                  <button
                    key={offset}
                    type="button"
                    onClick={() => toggleReminderOffset(offset)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                      active
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background border-border hover:bg-accent'
                    }`}
                  >
                    {offset === 0 ? 'يوم الاستحقاق'
                     : offset === 1 ? 'قبل يوم'
                     : `قبل ${offset} أيام`}
                  </button>
                );
              })}
            </div>
            <p className="text-[12px] text-muted-foreground mt-1.5">
              لا يتم إنشاء مهام منفصلة. التذكيرات تُعرض تلقائياً في لوحة التحكم.
            </p>
          </div>

          {/* الارتباطات */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>القضية المرتبطة (اختياري)</Label>
              <Select
                value={formData.relatedCaseId ? String(formData.relatedCaseId) : 'none'}
                onValueChange={(v) => update('relatedCaseId', v === 'none' ? null : parseInt(v))}
              >
                <SelectTrigger className="w-full"><SelectValue placeholder="بدون قضية" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون قضية</SelectItem>
                  {cases.map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.caseNumber || `قضية ${c.id}`} — {c.subject?.substring(0, 30)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>الموكل المرتبط (اختياري)</Label>
              <Select
                value={formData.relatedClientId ? String(formData.relatedClientId) : 'none'}
                onValueChange={(v) => update('relatedClientId', v === 'none' ? null : parseInt(v))}
              >
                <SelectTrigger className="w-full"><SelectValue placeholder="بدون موكل" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون موكل</SelectItem>
                  {clients.map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ملاحظات */}
          <div>
            <Label>ملاحظات</Label>
            <Textarea
              value={(formData.notes as string) || ''}
              onChange={(e) => update('notes', e.target.value)}
              rows={2}
              placeholder="ملاحظات إضافية..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={onSave} className="bg-gradient-primary">
            {editingTask ? 'تحديث' : 'إنشاء'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
