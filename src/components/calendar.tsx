'use client';

import React, { useState, useMemo } from 'react';
import { useSessions, useCases, useDelays } from '@/lib/api';
import { formatDate, ARABIC_MONTHS } from '@/lib/constants';
import { useAppStore } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sessions } from '@/components/sessions';
import { DelaysManager } from '@/components/delays';
import {
  ChevronRight,
  ChevronLeft,
  CalendarDays,
} from 'lucide-react';

interface Session {
  id?: number;
  date?: string;
  time?: string;
  caseNumber?: string;
  court?: string;
  chamber?: string;
  roomNumber?: string;
  status?: string;
  result?: string;
  notes?: string;
  caseId?: number;
}

const STATUS_BADGE_CLASSES: Record<string, string> = {
  scheduled: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  postponed: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'مجدولة',
  completed: 'مكتملة',
  postponed: 'مؤجلة',
  cancelled: 'ملغاة',
};


// استخراج مفتاح اليوم دون تحويل التاريخ إلى UTC؛ حتى لا ينتقل الحدث إلى يوم مجاور.
function getCalendarDateKey(value?: string | Date | null): string | null {
  if (!value) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  }
  const raw = String(value).trim();
  const isoDate = raw.match(/^(\\d{4}-\\d{2}-\\d{2})/);
  if (isoDate) return isoDate[1];
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
}

function CalendarMonthView() {
  const { setSelectedCaseId, setActiveSection } = useAppStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { sessions } = useSessions();
  const { cases } = useCases();
  const { delays } = useDelays();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  // يوم بداية الشهر (السبت = 0 لأن الأسبوع يبدأ بالسبت في الجزائر)
  let startDow = firstDay.getDay(); // 0=Sunday
  // تحويل لبدء الأسبوع من السبت
  startDow = startDow === 6 ? 0 : startDow + 1;

  // تجميع الجلسات والتأجيلات بمفتاح تاريخ موحد يحافظ على اليوم المسجل.
  const sessionsByDate = useMemo(() => {
    const map: Record<string, Session[]> = {};
    sessions.forEach((session) => {
      const key = getCalendarDateKey(session.date);
      if (!key) return;
      (map[key] ||= []).push(session);
    });
    return map;
  }, [sessions]);

  const delaysByDate = useMemo(() => {
    const map: Record<string, typeof delays> = {};
    delays.forEach((delay) => {
      const key = getCalendarDateKey(delay.delayDate);
      if (!key) return;
      (map[key] ||= []).push(delay);
    });
    return map;
  }, [delays]);

  // أيام الشهر
  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    // أيام فارغة في البداية
    for (let i = 0; i < startDow; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d);
    }
    return days;
  }, [startDow, daysInMonth]);

  // اليوم
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDate(null);
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDate(null);
  }

  function goToToday() {
    setCurrentDate(new Date());
    setSelectedDate(null);
  }

  function dateStr(day: number): string {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  // جميع الأحداث المرتبطة باليوم المختار، لا الجلسات وحدها.
  const selectedSessions = selectedDate ? (sessionsByDate[selectedDate] || []) : [];
  const selectedDelays = selectedDate ? (delaysByDate[selectedDate] || []) : [];
  const selectedEventsCount = selectedSessions.length + selectedDelays.length;

  return (
    <div className="space-y-4">
      {/* رأس التقويم */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth} className="h-9 w-9">
            <ChevronRight className="w-4 h-4" />
          </Button>
          <h3 className="text-base font-extrabold min-w-[160px] text-center">
            {ARABIC_MONTHS[month]} {year}
          </h3>
          <Button variant="outline" size="icon" onClick={nextMonth} className="h-9 w-9">
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={goToToday} className="text-xs">
          اليوم
        </Button>
      </div>

      {/* التقويم */}
      <Card>
        <CardContent className="p-3">
          {/* رؤوس الأيام */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map((day) => (
              <div key={day} className="text-center text-xs font-bold text-muted-foreground py-1">
                {day}
              </div>
            ))}
          </div>

          {/* الأيام */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="h-16 md:h-20" />;
              }
              const ds = dateStr(day);
              const daySessions = sessionsByDate[ds] || [];
              const dayDelays = delaysByDate[ds] || [];
              const isToday = ds === todayStr;
              const isSelected = ds === selectedDate;
              const hasEvents = daySessions.length > 0 || dayDelays.length > 0;

              return (
                <button
                  key={ds}
                  onClick={() => setSelectedDate(ds === selectedDate ? null : ds)}
                  className={`h-16 md:h-20 p-1 rounded-lg text-right transition-all duration-200 relative
                    ${isSelected ? 'bg-teal-100 dark:bg-teal-900/40 ring-2 ring-teal-500' : ''}
                    ${isToday && !isSelected ? 'bg-teal-50 dark:bg-teal-950/30' : ''}
                    ${!isSelected && !isToday ? 'hover:bg-muted/50' : ''}
                    ${hasEvents ? 'font-bold' : ''}
                  `}
                >
                  <span className={`text-xs md:text-sm ${isToday ? 'text-teal-700 dark:text-teal-400 font-extrabold' : ''}`}>
                    {day}
                  </span>
                  {daySessions.length > 0 && (
                    <div className="mt-0.5">
                      <div className="flex flex-wrap gap-0.5">
                        {daySessions.slice(0, 2).map((s, i) => (
                          <div
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full ${
                              s.status === 'completed' ? 'bg-emerald-500' :
                              s.status === 'postponed' ? 'bg-amber-500' :
                              s.status === 'cancelled' ? 'bg-gray-400' :
                              'bg-teal-500'
                            }`}
                          />
                        ))}
                        {daySessions.length > 2 && (
                          <span className="text-[8px] text-muted-foreground">+{(daySessions.length - 2).toLocaleString('en-US')}</span>
                        )}
                      </div>
                    </div>
                  )}
                  {dayDelays.length > 0 && (
                    <div className="absolute bottom-1 left-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* تفاصيل اليوم المختار: الجلسات والتأجيلات */}
      {selectedDate && (
        <section aria-live="polite" className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-teal-500" />
              أحداث {formatDate(selectedDate)}
            </h3>
            <Badge variant="secondary">{selectedEventsCount.toLocaleString('ar-DZ')} حدث</Badge>
          </div>

          {selectedSessions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">الجلسات ({selectedSessions.length})</p>
              {selectedSessions.map((session) => {
                const caseData = cases.find((c) => c.id === session.caseId);
                return (
                  <Card
                    key={`session-${session.id}`}
                    className={session.caseId ? "cursor-pointer hover:shadow-md transition-shadow" : ""}
                    onClick={() => {
                      if (session.caseId) {
                        setSelectedCaseId(session.caseId);
                        setActiveSection('cases');
                      }
                    }}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold">{session.caseNumber || caseData?.caseNumber || 'جلسة غير مرتبطة بقضية'}</span>
                            <Badge className={`${STATUS_BADGE_CLASSES[session.status || 'scheduled'] || ''} text-xs`}>
                              {STATUS_LABELS[session.status || 'scheduled'] || 'غير محددة'}
                            </Badge>
                          </div>
                          {caseData?.subject && <p className="text-xs text-muted-foreground mt-1">{caseData.subject}</p>}
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                            {(session.court || caseData?.courtName) && <span>{session.court || caseData?.courtName}</span>}
                            {(session.chamber || caseData?.chamber) && <span>• {session.chamber || caseData?.chamber}</span>}
                            {session.time && <span>• الساعة {session.time}</span>}
                            {session.roomNumber && <span>• قاعة {session.roomNumber}</span>}
                          </div>
                          {session.notes && <p className="text-xs mt-2 whitespace-pre-wrap">{session.notes}</p>}
                        </div>
                        {session.caseId && <span className="text-xs text-teal-700 dark:text-teal-400 shrink-0">فتح القضية ←</span>}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {selectedDelays.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">التأجيلات ({selectedDelays.length})</p>
              {selectedDelays.map((delay) => {
                const caseData = cases.find((c) => c.id === delay.caseId);
                return (
                  <Card
                    key={`delay-${delay.id}`}
                    className="border-amber-200 dark:border-amber-900/60 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      if (delay.caseId) {
                        setSelectedCaseId(delay.caseId);
                        setActiveSection('cases');
                      }
                    }}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold">{caseData?.caseNumber || 'تأجيل غير مرتبط بقضية'}</span>
                            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 text-xs">تأجيل</Badge>
                          </div>
                          {caseData?.subject && <p className="text-xs text-muted-foreground mt-1">{caseData.subject}</p>}
                          {delay.reason && <p className="text-sm mt-2">{delay.reason}</p>}
                          {delay.notes && <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{delay.notes}</p>}
                          {(caseData?.courtName || caseData?.chamber) && (
                            <p className="text-xs text-muted-foreground mt-2">{[caseData?.courtName, caseData?.chamber].filter(Boolean).join(' • ')}</p>
                          )}
                        </div>
                        {delay.caseId && <span className="text-xs text-teal-700 dark:text-teal-400 shrink-0">فتح القضية ←</span>}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {selectedEventsCount === 0 && (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground">لا توجد جلسات أو تأجيلات مسجلة في هذا اليوم</p>
              </CardContent>
            </Card>
          )}
        </section>
      )}

      {/* ملخص الشهر */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap text-sm">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-teal-500" />
              <span className="text-xs text-muted-foreground">مجدولة</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs text-muted-foreground">مكتملة</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-xs text-muted-foreground">مؤجلة</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
              <span className="text-xs text-muted-foreground">ملغاة</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 absolute bottom-1 left-1" style={{position:'relative'}} />
              <span className="text-xs text-muted-foreground">تأجيل</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


// مركز موحد: التقويم والجلسات والتأجيلات في مساحة واحدة دون نقل أو حذف السجلات.
export function CalendarView() {
  return (
    <Tabs defaultValue="calendar" dir="rtl" className="space-y-4">
      <TabsList className="grid w-full grid-cols-3 h-auto">
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
