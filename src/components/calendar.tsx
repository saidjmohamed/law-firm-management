'use client';

import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Session } from '@/lib/db';
import { SESSION_STATUSES, formatDate, ARABIC_DAYS, ARABIC_MONTHS } from '@/lib/constants';
import { useAppStore } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronRight,
  ChevronLeft,
  CalendarDays,
} from 'lucide-react';

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

export function CalendarView() {
  const { setSelectedCaseId, setActiveSection } = useAppStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const sessions = useLiveQuery(() => db.sessions.toArray());
  const cases = useLiveQuery(() => db.cases.toArray());
  const delays = useLiveQuery(() => db.delays.toArray());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  // يوم بداية الشهر (السبت = 0 لأن الأسبوع يبدأ بالسبت في الجزائر)
  let startDow = firstDay.getDay(); // 0=Sunday
  // تحويل لبدء الأسبوع من السبت
  startDow = startDow === 6 ? 0 : startDow + 1;

  // بناء خريطة الجلسات حسب التاريخ
  const sessionsByDate = useMemo(() => {
    const map: Record<string, Session[]> = {};
    sessions?.forEach((s) => {
      if (s.date) {
        if (!map[s.date]) map[s.date] = [];
        map[s.date].push(s);
      }
    });
    return map;
  }, [sessions]);

  // خريطة التأجيلات
  const delaysByDate = useMemo(() => {
    const map: Record<string, number> = {};
    delays?.forEach((d) => {
      if (d.delayDate) {
        map[d.delayDate] = (map[d.delayDate] || 0) + 1;
      }
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

  // الجلسات المحددة لليوم المختار
  const selectedSessions = selectedDate ? (sessionsByDate[selectedDate] || []) : [];

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
              const dayDelays = delaysByDate[ds] || 0;
              const isToday = ds === todayStr;
              const isSelected = ds === selectedDate;
              const hasEvents = daySessions.length > 0 || dayDelays > 0;

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
                  {dayDelays > 0 && (
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

      {/* تفاصيل اليوم المختار */}
      {selectedDate && (
        <div>
          <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-teal-500" />
            جلسات {formatDate(selectedDate)}
          </h3>
          {selectedSessions.length > 0 ? (
            <div className="space-y-2">
              {selectedSessions.map((session) => {
                const caseData = cases?.find((c) => c.id === session.caseId);
                return (
                  <Card
                    key={session.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      if (session.caseId) {
                        setSelectedCaseId(session.caseId);
                        setActiveSection('cases');
                      }
                    }}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">{session.caseNumber || caseData?.caseNumber || '—'}</span>
                            <Badge className={`${STATUS_BADGE_CLASSES[session.status || 'scheduled'] || ''} text-xs`}>
                              {STATUS_LABELS[session.status || 'scheduled']}
                            </Badge>
                          </div>
                          {caseData?.subject && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{caseData.subject}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                            {session.court && <span>{session.court}</span>}
                            {session.chamber && <span>• {session.chamber}</span>}
                            {session.time && <span>• {session.time}</span>}
                            {session.roomNumber && <span>• قاعة {session.roomNumber}</span>}
                          </div>
                        </div>
                        {session.time && (
                          <Badge variant="outline" className="text-xs shrink-0 mr-2 tabular-nums">
                            {session.time}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground">لا توجد جلسات في هذا اليوم</p>
              </CardContent>
            </Card>
          )}
        </div>
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
