'use client';

import React, { useMemo, useState } from 'react';
import { useSessions, useCases, useDelays, useTasks } from '@/lib/api';
import { ARABIC_MONTHS } from '@/lib/constants';
import { useAppStore } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sessions } from '@/components/sessions';
import { DelaysManager } from '@/components/delays';
import { ChevronRight, ChevronLeft, CalendarDays, Clock3, MapPin, FolderOpen, Scale, FileText } from 'lucide-react';

type CalendarSession = {
  id?: number; date?: string; time?: string; caseNumber?: string; court?: string;
  chamber?: string; roomNumber?: string; status?: string; result?: string;
  notes?: string; caseId?: number;
};
type CalendarDelay = { id?: number; delayDate?: string; reason?: string; notes?: string; caseId?: number };
type CalendarTask = { id?: number; title?: string; description?: string; dueDate?: string; legalDeadline?: string; status?: string; relatedCaseId?: number; sourceType?: string };
type CalendarCaseEvent = { id: string; caseId: number; caseNumber?: string; subject?: string; date: string; eventType: 'firstSession' | 'deliberation' | 'judgment' };

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'مجدولة', completed: 'مكتملة', postponed: 'مؤجلة', cancelled: 'ملغاة',
};
const STATUS_STYLES: Record<string, string> = {
  scheduled: 'bg-primary/10 text-primary',
  completed: 'bg-secondary text-secondary-foreground',
  postponed: 'bg-accent text-accent-foreground',
  cancelled: 'bg-muted text-muted-foreground',
};

// API dates arrive as ISO strings. Keep the stored calendar date instead of
// converting midnight UTC to the previous local day.
function calendarDateKey(value?: string | Date | null): string | null {
  if (!value) return null;
  if (typeof value === 'string') {
    const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function CalendarMonthView() {
  const { setSelectedCaseId, setActiveSection } = useAppStore();
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(() => calendarDateKey(new Date()));
  const { sessions } = useSessions();
  const { cases } = useCases();
  const { delays } = useDelays();
  const { tasks } = useTasks();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay.getDay() + 1) % 7; // Saturday-first calendar

  const sessionsByDate = useMemo(() => {
    const map: Record<string, CalendarSession[]> = {};
    (sessions || []).forEach((session: CalendarSession) => {
      const key = calendarDateKey(session.date);
      if (key) (map[key] ||= []).push(session);
    });
    Object.values(map).forEach(items => items.sort((a, b) => (a.time || '').localeCompare(b.time || '')));
    return map;
  }, [sessions]);

  const delaysByDate = useMemo(() => {
    const map: Record<string, CalendarDelay[]> = {};
    (delays || []).forEach((delay: CalendarDelay) => {
      const key = calendarDateKey(delay.delayDate);
      if (key) (map[key] ||= []).push(delay);
    });
    return map;
  }, [delays]);

  // بعض المواعيد محفوظة مباشرة داخل ملف القضية، ولا يلزم أن يكون لها سجل جلسة مستقل.
  // لا نكرر الموعد إذا كان موجوداً بالفعل في جدول الجلسات لنفس القضية والتاريخ.
  const caseEventsByDate = useMemo(() => {
    const map: Record<string, CalendarCaseEvent[]> = {};
    (cases || []).forEach((item: any) => {
      if (item.status === 'مؤرشفة') return;
      const milestones: Array<[string, CalendarCaseEvent['eventType']]> = [
        [item.firstSessionDate, 'firstSession'],
        [item.delibDate, 'deliberation'],
        [item.judgmentDate, 'judgment'],
      ];
      milestones.forEach(([rawDate, eventType]) => {
        const key = calendarDateKey(rawDate);
        if (!key) return;
        const alreadyHasSession = (sessions || []).some((session: CalendarSession) =>
          session.caseId === item.id && calendarDateKey(session.date) === key
        );
        const alreadyHasMilestone = (map[key] || []).some(event =>
          event.caseId === item.id && event.eventType === eventType
        );
        if (alreadyHasSession || alreadyHasMilestone) return;
        (map[key] ||= []).push({
          id: `case-${item.id}-${eventType}-${key}`,
          caseId: item.id,
          caseNumber: item.caseNumber,
          subject: item.subject,
          date: key,
          eventType,
        });
      });
    });
    return map;
  }, [cases, sessions]);

  const tasksByDate = useMemo(() => {
    const map: Record<string, CalendarTask[]> = {};
    (tasks || []).forEach((task: CalendarTask) => {
      if (task.status === 'completed' || task.sourceType === 'session') return;
      const key = calendarDateKey(task.legalDeadline || task.dueDate);
      if (key) (map[key] ||= []).push(task);
    });
    return map;
  }, [tasks]);

  const days = useMemo(() => [
    ...Array.from({ length: startOffset }, () => null as number | null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ], [startOffset, daysInMonth]);

  const todayKey = calendarDateKey(new Date())!;
  const dateKey = (day: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const selectedSessions = selectedDate ? (sessionsByDate[selectedDate] || []) : [];
  const selectedDelays = selectedDate ? (delaysByDate[selectedDate] || []) : [];
  const selectedTasks = selectedDate ? (tasksByDate[selectedDate] || []) : [];
  const selectedCaseEvents = selectedDate ? (caseEventsByDate[selectedDate] || []) : [];
  const selectedEventsCount = selectedSessions.length + selectedDelays.length + selectedTasks.length + selectedCaseEvents.length;

  function changeMonth(offset: number) {
    setCurrentDate(new Date(year, month + offset, 1));
    setSelectedDate(null);
  }
  function goToToday() {
    setCurrentDate(new Date());
    setSelectedDate(todayKey);
  }
  function openCase(caseId?: number) {
    if (!caseId) return;
    setSelectedCaseId(caseId);
    setActiveSection('cases');
  }

  return (
    <div className="space-y-4">
      <section className="flex flex-wrap items-center justify-between gap-3" aria-label="التنقل بين أشهر التقويم">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" aria-label="الشهر السابق" onClick={() => changeMonth(-1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="min-w-36 text-center">
            <h2 className="text-lg font-bold text-foreground">{ARABIC_MONTHS[month]} {year}</h2>
          </div>
          <Button variant="outline" size="icon" aria-label="الشهر التالي" onClick={() => changeMonth(1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="secondary" onClick={goToToday}>العودة إلى اليوم</Button>
      </section>

      <Card className="overflow-hidden border-border shadow-none">
        <CardContent className="p-2 sm:p-4">
          <div className="mb-2 grid grid-cols-7 gap-1" role="row">
            {['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map(day => (
              <div key={day} className="py-2 text-center text-xs font-semibold text-muted-foreground">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              if (day === null) return <div key={`empty-${index}`} className="min-h-24 sm:min-h-32 rounded-lg bg-muted/40" aria-hidden="true" />;
              const key = dateKey(day);
              const daySessions = sessionsByDate[key] || [];
              const dayDelays = delaysByDate[key] || [];
              const dayTasks = tasksByDate[key] || [];
              const dayCaseEvents = caseEventsByDate[key] || [];
              const isToday = key === todayKey;
              const isSelected = key === selectedDate;
              const total = daySessions.length + dayDelays.length + dayTasks.length + dayCaseEvents.length;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={isSelected}
                  aria-label={`${day} ${ARABIC_MONTHS[month]}: ${daySessions.length} جلسات، ${dayDelays.length} تأجيلات`}
                  onClick={() => setSelectedDate(isSelected ? null : key)}
                  className={`group min-h-24 sm:min-h-32 min-w-0 rounded-lg border p-1.5 text-right transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:p-2
                    ${isSelected ? 'border-primary bg-primary/8' : 'border-border bg-card hover:bg-muted/60'}
                    ${isToday ? 'ring-1 ring-inset ring-primary/60' : ''}`}
                >
                  <div className="mb-1 flex items-center justify-between gap-1">
                    <span className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full px-1 text-sm font-semibold ${isToday ? 'bg-primary text-primary-foreground' : 'text-foreground'}`}>{day}</span>
                    {total > 0 && <span className="text-[10px] font-medium text-muted-foreground">{total.toLocaleString('ar-DZ')}</span>}
                  </div>
                  <div className="space-y-1">
                    {daySessions.slice(0, 2).map((session, i) => {
                      const linkedCase = (cases || []).find((item: any) => item.id === session.caseId);
                      const number = session.caseNumber || linkedCase?.caseNumber || 'جلسة';
                      return (
                        <div key={session.id ?? `session-${i}`} className="truncate rounded-md bg-primary/10 px-1 py-1 text-[9px] leading-tight text-primary sm:text-[11px]" title={`${number} — ${session.time || 'دون توقيت'}`}>
                          <span className="font-bold">{number}</span>
                          {session.time && <span className="mr-1 opacity-80">{session.time}</span>}
                          <span className="hidden sm:inline"> · {linkedCase?.subject || session.court || 'جلسة'}</span>
                        </div>
                      );
                    })}
                    {dayDelays.slice(0, 1).map((delay, i) => {
                      const linkedCase = (cases || []).find((item: any) => item.id === delay.caseId);
                      return (
                        <div key={delay.id ?? `delay-${i}`} className="truncate rounded-md bg-amber-100 px-1 py-1 text-[9px] leading-tight text-amber-900 dark:bg-amber-900/30 dark:text-amber-200 sm:text-[11px]" title={`تأجيل: ${linkedCase?.caseNumber || ''} ${delay.reason || ''}`}>
                          <span className="font-semibold">{linkedCase?.caseNumber || 'تأجيل'}</span>
                          <span className="hidden sm:inline"> · {delay.reason || 'موعد مؤجل'}</span>
                        </div>
                      );
                    })}
                    {dayTasks.slice(0, 1).map((task, i) => <div key={task.id || ('task-' + i)} className="truncate rounded-md bg-violet-100 px-1 py-1 text-[9px] text-violet-900 dark:bg-violet-900/30 dark:text-violet-200 sm:text-[11px]">{task.title || 'مهمة قانونية'}</div>)}
                    {dayCaseEvents.slice(0, 1).map(event => <div key={event.id} className="truncate rounded-md bg-sky-100 px-1 py-1 text-[9px] text-sky-900 dark:bg-sky-900/30 dark:text-sky-200 sm:text-[11px]">{event.eventType === 'firstSession' ? 'أول جلسة' : event.eventType === 'deliberation' ? 'مداولة' : 'حكم'} · {event.caseNumber || 'قضية'}</div>)}
                    {total > 3 && <p className="truncate px-1 text-[9px] text-muted-foreground">+{(total - 3).toLocaleString('ar-DZ')} مواعيد أخرى</p>}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <section aria-live="polite" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <h3 className="text-base font-bold">{selectedDate ? `مواعيد يوم ${selectedDate.split('-').reverse().join('/')}` : 'تفاصيل المواعيد'}</h3>
            {selectedDate && <Badge variant="secondary">{selectedEventsCount.toLocaleString('ar-DZ')} موعد</Badge>}
          </div>
          {selectedDate && <Button variant="ghost" size="sm" onClick={() => setSelectedDate(null)}>إلغاء التحديد</Button>}
        </div>

        {!selectedDate ? (
          <Card className="border-dashed shadow-none"><CardContent className="p-6 text-center text-sm text-muted-foreground">اختر يوماً لعرض تفاصيل الجلسات والتأجيلات والمهام القانونية المرتبطة بالقضايا.</CardContent></Card>
        ) : selectedEventsCount === 0 ? (
          <Card className="shadow-none"><CardContent className="p-6 text-center text-sm text-muted-foreground">لا توجد جلسات أو تأجيلات أو مهام مسجلة في هذا اليوم.</CardContent></Card>
        ) : (
          <div className="grid gap-3 xl:grid-cols-2">
            {selectedSessions.map((session, index) => {
              const caseData = (cases || []).find((item: any) => item.id === session.caseId);
              const status = session.status || 'scheduled';
              return (
                <Card key={session.id ?? `session-detail-${index}`} className="border-border shadow-none">
                  <CardContent className="space-y-3 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">جلسة قضائية</p>
                        <h4 className="break-words text-base font-bold">{session.caseNumber || caseData?.caseNumber || 'قضية غير مرتبطة'}</h4>
                      </div>
                      <Badge className={STATUS_STYLES[status] || 'bg-secondary text-secondary-foreground'}>{STATUS_LABELS[status] || status}</Badge>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="flex items-start gap-2 text-sm"><FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" /><span>{caseData?.subject || 'موضوع القضية غير متوفر'}</span></div>
                      <div className="flex items-start gap-2 text-sm"><Scale className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" /><span>{caseData?.caseNature || 'طبيعة القضية غير محددة'}</span></div>
                      <div className="flex items-start gap-2 text-sm"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" /><span>{session.court || caseData?.courtName || caseData?.councilName || 'الجهة القضائية غير محددة'}</span></div>
                      <div className="flex items-start gap-2 text-sm"><Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" /><span>{session.time || 'دون توقيت محدد'}{session.roomNumber ? ` · القاعة ${session.roomNumber}` : ''}</span></div>
                    </div>
                    {(session.chamber || caseData?.chamber) && <p className="text-sm text-muted-foreground">الغرفة: {session.chamber || caseData?.chamber}</p>}
                    {Boolean(caseData?.parties?.length) && <div className="border-t border-border pt-2"><p className="mb-1 text-xs font-semibold text-muted-foreground">الأطراف</p><p className="text-sm">{caseData.parties.map((party: any) => party.name).filter(Boolean).join('، ')}</p></div>}
                    {session.result && <p className="text-sm"><span className="font-semibold">نتيجة الجلسة: </span>{session.result}</p>}
                    {session.notes && <p className="whitespace-pre-wrap text-sm text-muted-foreground">{session.notes}</p>}
                    {session.caseId && <Button variant="outline" className="w-full sm:w-auto" onClick={() => openCase(session.caseId)}><FolderOpen className="ml-2 h-4 w-4" />فتح ملف القضية</Button>}
                  </CardContent>
                </Card>
              );
            })}

            {selectedCaseEvents.map(event => (
              <Card key={event.id} className="border-sky-200 shadow-none">
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div><p className="text-xs text-muted-foreground">موعد مسجل في ملف القضية</p><h4 className="font-bold">{event.caseNumber || 'قضية'}</h4></div>
                    <Badge variant="secondary">{event.eventType === 'firstSession' ? 'أول جلسة' : event.eventType === 'deliberation' ? 'مداولة' : 'النطق بالحكم'}</Badge>
                  </div>
                  {event.subject && <p className="text-sm text-muted-foreground">{event.subject}</p>}
                  <p className="text-sm">التاريخ: {event.date.split('-').reverse().join('/')}</p>
                  <Button variant="outline" onClick={() => openCase(event.caseId)}><FolderOpen className="ml-2 h-4 w-4" />فتح ملف القضية</Button>
                </CardContent>
              </Card>
            ))}
            {selectedTasks.map((task, index) => {
              const caseData = (cases || []).find((item: any) => item.id === task.relatedCaseId);
              return <Card key={task.id || ('task-' + index)} className="border-violet-200 shadow-none"><CardContent className="space-y-3 p-4"><div className="flex items-start justify-between gap-2"><div><p className="text-xs text-muted-foreground">إجراء / مهمة قانونية</p><h4 className="font-bold">{task.title || 'مهمة دون عنوان'}</h4></div><Badge>{task.status === 'in_progress' ? 'قيد الإنجاز' : 'معلقة'}</Badge></div>{caseData && <p className="text-sm font-semibold">القضية: {caseData.caseNumber} — {caseData.subject}</p>}{task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}{task.legalDeadline && <p className="text-sm font-semibold text-destructive">الأجل القانوني: {calendarDateKey(task.legalDeadline)?.split('-').reverse().join('/')}</p>}{task.relatedCaseId && <Button variant="outline" onClick={() => openCase(task.relatedCaseId)}><FolderOpen className="ml-2 h-4 w-4" />فتح ملف القضية</Button>}</CardContent></Card>;
            })}
            {selectedDelays.map((delay, index) => {
              const caseData = (cases || []).find((item: any) => item.id === delay.caseId);
              return (
                <Card key={delay.id ?? `delay-detail-${index}`} className="border-border shadow-none">
                  <CardContent className="space-y-3 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div><p className="text-xs text-muted-foreground">تأجيل / موعد جديد</p><h4 className="text-base font-bold">{caseData?.caseNumber || 'قضية غير مرتبطة'}</h4></div>
                      <Badge variant="secondary">تأجيل</Badge>
                    </div>
                    <p className="text-sm">{caseData?.subject || 'موضوع القضية غير متوفر'}</p>
                    <p className="text-sm text-muted-foreground">{delay.reason || 'سبب التأجيل غير محدد'}</p>
                    {(caseData?.courtName || caseData?.councilName) && <p className="text-sm text-muted-foreground">{caseData.courtName || caseData.councilName}</p>}
                    {delay.notes && <p className="whitespace-pre-wrap text-sm text-muted-foreground">{delay.notes}</p>}
                    {delay.caseId && <Button variant="outline" className="w-full sm:w-auto" onClick={() => openCase(delay.caseId)}><FolderOpen className="ml-2 h-4 w-4" />فتح ملف القضية</Button>}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export function CalendarView() {
  return (
    <Tabs defaultValue="calendar" dir="rtl" className="space-y-4">
      <TabsList className="grid h-auto w-full grid-cols-3">
        <TabsTrigger value="calendar" className="py-2">التقويم العام</TabsTrigger>
        <TabsTrigger value="sessions" className="py-2">الجلسات</TabsTrigger>
        <TabsTrigger value="deadlines" className="py-2">الآجال والتأجيلات</TabsTrigger>
      </TabsList>
      <TabsContent value="calendar"><CalendarMonthView /></TabsContent>
      <TabsContent value="sessions"><Sessions /></TabsContent>
      <TabsContent value="deadlines"><DelaysManager /></TabsContent>
    </Tabs>
  );
}
