'use client';

import React, { useState, useMemo } from 'react';
import { useSessions, createSession, updateSession, deleteSession } from '@/lib/api';
import { SESSION_STATUSES, formatDate } from '@/lib/constants';
import { SelectWithCustom } from '@/components/ui/select-with-custom';
import { useAppStore } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { DateDisplay, toDateInputValue } from '@/components/ui/date-display';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Plus,
  Calendar,
  Clock,
  MapPin,
  Pencil,
  Trash2,
  Filter,
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
  createdAt?: Date;
  updatedAt?: Date;
}

function getCalendarDateKey(value?: string | Date | null): string | null {
  if (!value) return null;
  if (typeof value === 'string') {
    const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'مجدولة',
  completed: 'مكتملة',
  postponed: 'مؤجلة',
  cancelled: 'ملغاة',
};

const STATUS_BADGE_CLASSES: Record<string, string> = {
  scheduled: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  postponed: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

export function Sessions() {
  const { setSelectedCaseId, setActiveSection } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [formData, setFormData] = useState<Partial<Session>>({});
  const [showAll, setShowAll] = useState(false);

  const { sessions } = useSessions();

  const todayStr = getCalendarDateKey(new Date())!;

  // لا نحوّل تاريخ YYYY-MM-DD إلى UTC؛ التاريخ القضائي يوم محلي وليس لحظة زمنية.
  const upcomingSessions = useMemo(() => {
    return [...sessions]
      .filter((session) => {
        const key = getCalendarDateKey(session.date as any);
        return Boolean(key && key >= todayStr && session.status !== 'completed' && session.status !== 'cancelled');
      })
      .sort((a, b) => {
        const dateOrder = (getCalendarDateKey(a.date as any) || '').localeCompare(getCalendarDateKey(b.date as any) || '');
        return dateOrder || (a.time || '').localeCompare(b.time || '');
      });
  }, [sessions, todayStr]);

  const allSessionsSorted = useMemo(() => {
    return [...sessions].sort((a, b) => {
      const dateOrder = (getCalendarDateKey(b.date as any) || '').localeCompare(getCalendarDateKey(a.date as any) || '');
      return dateOrder || (a.time || '').localeCompare(b.time || '');
    });
  }, [sessions]);

  const displaySessions = showAll ? allSessionsSorted : upcomingSessions;

  const groupedSessions = useMemo(() => {
    const groups: Record<string, typeof displaySessions> = {};
    for (const session of displaySessions) {
      const key = getCalendarDateKey(session.date as any) || 'بدون تاريخ';
      (groups[key] ||= []).push(session);
    }
    return groups;
  }, [displaySessions]);

  function resetForm() {
    setFormData({});
    setEditingSession(null);
  }

  function openAddForm() {
    resetForm();
    setShowForm(true);
  }

  function openEditForm(session: Session) {
    setEditingSession(session);
    setFormData({ ...session });
    setShowForm(true);
  }

  async function saveSession() {
    try {
      const now = new Date();
      if (editingSession?.id) {
        await updateSession(editingSession.id, { ...formData, updatedAt: now });
        toast.success('تم تحديث الجلسة بنجاح');
      } else {
        await createSession({ ...formData, createdAt: now, updatedAt: now });
        toast.success('تم إضافة الجلسة بنجاح');
      }
      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error('Save session error:', error);
      toast.error('فشل في حفظ الجلسة');
    }
  }

  async function handleDeleteSession(id: number) {
    try {
      await deleteSession(id);
      toast.success('تم حذف الجلسة');
    } catch (error) {
      console.error('Delete session error:', error);
      toast.error('فشل في حذف الجلسة');
    }
  }

  const todaySessions = upcomingSessions.filter(s => getCalendarDateKey(s.date as any) === todayStr);

  return (
    <div className="space-y-4">
      {/* شريط الأدوات */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex items-center gap-2">
          <Button onClick={openAddForm} className="bg-teal-600 hover:bg-teal-700 shrink-0 h-10">
            <Plus className="w-4 h-4 ml-1" />
            إضافة جلسة
          </Button>
          <Button
            variant={showAll ? "default" : "outline"}
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="h-10"
          >
            <Filter className="w-3 h-3 ml-1" />
            {showAll ? 'القادمة فقط' : 'عرض الكل'}
          </Button>
        </div>
        <div className="flex-1" />
        <div className="text-sm text-muted-foreground">
          {showAll
            ? `${sessions.length.toLocaleString('en-US')} جلسة`
            : `${upcomingSessions.length.toLocaleString('en-US')} جلسة قادمة`
          }
        </div>
      </div>

      {/* تنبيه جلسات اليوم */}
      {todaySessions.length > 0 && !showAll && (
        <Card className="border-teal-300 dark:border-teal-700 bg-teal-50/50 dark:bg-teal-900/20">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span className="text-sm font-bold text-teal-700 dark:text-teal-300">جلسات اليوم ({todaySessions.length.toLocaleString('en-US')})</span>
            </div>
            <div className="space-y-1.5">
              {todaySessions.map((session) => (
                <div
                  key={session.id}
                  role="button"
                  tabIndex={session.caseId ? 0 : -1}
                  aria-label={`فتح القضية المرتبطة بالجلسة ${session.caseNumber || ''}`}
                  className="flex items-center justify-between rounded-lg bg-white p-3 text-right transition-shadow hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:bg-background"
                  onClick={() => {
                    if (session.caseId) {
                      setSelectedCaseId(session.caseId);
                      setActiveSection('cases');
                    }
                  }}
                  onKeyDown={(event) => {
                    if (session.caseId && (event.key === 'Enter' || event.key === ' ')) {
                      event.preventDefault();
                      setSelectedCaseId(session.caseId);
                      setActiveSection('cases');
                    }
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium">{session.caseNumber || '—'}</span>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                      {session.court && <span>{session.court}</span>}
                      {session.chamber && <span>• {session.chamber}</span>}
                      {session.time && <span>• {session.time}</span>}
                    </div>
                  </div>
                  <Badge className={`${STATUS_BADGE_CLASSES[session.status || 'scheduled'] || ''} text-xs`}>
                    {STATUS_LABELS[session.status || 'scheduled']}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* الجلسات مج.grouped */}
      <div className="space-y-4">
        {Object.entries(groupedSessions).map(([date, dateSessions]) => {
          const sessionDate = date === 'بدون تاريخ' ? null : new Date(`${date}T12:00:00`);
          const isToday = date === todayStr;
          const isPast = date !== 'بدون تاريخ' && date < todayStr;
          return (
            <div key={date}>
              <h3 className={`text-sm font-semibold mb-2 flex items-center gap-2 ${isToday ? 'text-teal-700 dark:text-teal-400' : isPast ? 'text-muted-foreground' : 'text-foreground'}`}>
                <span>{isToday ? 'اليوم' : sessionDate ? <DateDisplay value={sessionDate} /> : 'بدون تاريخ'}</span>
                <Badge variant="outline" className="text-[10px]">{dateSessions.length.toLocaleString('en-US')}</Badge>
              </h3>
              <div className="space-y-2">
                {dateSessions.map((session) => (
                  <Card key={session.id} className={`hover:shadow-sm transition-shadow ${isToday ? 'border-teal-200 dark:border-teal-800' : ''}`}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">{session.caseNumber || '—'}</span>
                            <Badge className={`${STATUS_BADGE_CLASSES[session.status || 'scheduled'] || ''} text-xs`}>
                              {STATUS_LABELS[session.status || 'scheduled']}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                            {session.court && <span>{session.court}</span>}
                            {session.chamber && <span>• {session.chamber}</span>}
                            {session.time && <span>• {session.time}</span>}
                            {session.roomNumber && <span>• قاعة {(session.roomNumber).toLocaleString('en-US')}</span>}
                          </div>
                          {session.result && (
                            <p className="text-xs mt-1 text-muted-foreground">النتيجة: {session.result}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditForm(session)}>
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => session.id && handleDeleteSession(session.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}

        {displaySessions.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">
                {showAll ? 'لا توجد جلسات مسجلة' : 'لا توجد جلسات قادمة'}
              </p>
              {!showAll && (
                <Button variant="link" className="mt-2" onClick={() => setShowAll(true)}>
                  عرض كل الجلسات
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* نافذة إضافة/تعديل */}
      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingSession ? 'تعديل الجلسة' : 'إضافة جلسة جديدة'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">تاريخ الجلسة</Label>
                <Input
                  type="date"
                  dir="ltr"
                  value={toDateInputValue(formData.date as any)}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">الوقت</Label>
                <Input
                  type="time"
                  value={formData.time || ''}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">رقم القضية</Label>
              <Input
                value={formData.caseNumber || ''}
                onChange={(e) => setFormData({ ...formData, caseNumber: e.target.value })}
                placeholder="رقم القضية"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">المحكمة</Label>
                <SelectWithCustom
                  field="sessionCourt"
                  value={formData.court || ''}
                  onChange={v => setFormData({ ...formData, court: v })}
                  staticOptions={[
                    { value: 'المحكمة العليا', label: 'المحكمة العليا' },
                  ]}
                  placeholder="اسم المحكمة..."
                />
              </div>
              <div>
                <Label className="text-xs">الغرفة</Label>
                <SelectWithCustom
                  field="sessionChamber"
                  value={formData.chamber || ''}
                  onChange={v => setFormData({ ...formData, chamber: v })}
                  staticOptions={[
                    { value: 'الغرفة المدنية', label: 'الغرفة المدنية' },
                    { value: 'الغرفة العقارية', label: 'الغرفة العقارية' },
                    { value: 'الغرفة الجنائية', label: 'الغرفة الجنائية' },
                    { value: 'غرفة الجنح والمخالفات', label: 'غرفة الجنح والمخالفات' },
                    { value: 'الغرفة الجزائية', label: 'الغرفة الجزائية' },
                    { value: 'غرفة الاتهام', label: 'غرفة الاتهام' },
                    { value: 'الغرفة الاستعجالية', label: 'الغرفة الاستعجالية' },
                    { value: 'غرفة شؤون الأسرة', label: 'غرفة شؤون الأسرة' },
                    { value: 'غرفة الأحداث', label: 'غرفة الأحداث' },
                    { value: 'الغرفة الاجتماعية', label: 'الغرفة الاجتماعية' },
                    { value: 'الغرفة التجارية', label: 'الغرفة التجارية' },
                    { value: 'الغرفة البحرية', label: 'الغرفة البحرية' },
                    { value: 'القسم المدني', label: 'القسم المدني' },
                    { value: 'قسم الجنح', label: 'قسم الجنح' },
                    { value: 'القسم الاستعجالي', label: 'القسم الاستعجالي' },
                    { value: 'قسم شؤون الأسرة', label: 'قسم شؤون الأسرة' },
                    { value: 'القسم الاجتماعي', label: 'القسم الاجتماعي' },
                    { value: 'القسم العقاري', label: 'القسم العقاري' },
                    { value: 'القسم التجاري', label: 'القسم التجاري' },
                    { value: 'الإداري العادي', label: 'الإداري العادي' },
                    { value: 'الإداري الاستئنافي', label: 'الإداري الاستئنافي' },
                  ]}
                  placeholder="الغرفة/القسم..."
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">رقم القاعة</Label>
              <Input
                value={formData.roomNumber || ''}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                placeholder="رقم القاعة"
              />
            </div>
            <div>
              <Label className="text-xs">الحالة</Label>
              <SelectWithCustom
                field="sessionStatus"
                value={formData.status || 'scheduled'}
                onChange={v => setFormData({ ...formData, status: v })}
                staticOptions={SESSION_STATUSES.map(s => ({ value: s.value, label: s.label }))}
                placeholder="اختر الحالة..."
              />
            </div>
            <div>
              <Label className="text-xs">النتيجة</Label>
              <Input
                value={formData.result || ''}
                onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                placeholder="نتيجة الجلسة"
              />
            </div>
            <div>
              <Label className="text-xs">ملاحظات</Label>
              <Textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="ملاحظات"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>إلغاء</Button>
            <Button onClick={saveSession} className="bg-teal-600 hover:bg-teal-700">حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
