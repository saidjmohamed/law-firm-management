'use client';

import React, { useState, useMemo } from 'react';
import { useSessions, createSession, updateSession, deleteSession } from '@/lib/api';
import { SESSION_STATUSES, formatDate } from '@/lib/constants';
import { useAppStore } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

  // الجلسات القادمة فقط (تاريخها في المستقبل وحالتها ليست مكتملة أو ملغاة)
  const upcomingSessions = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return sessions
      .filter((s) => {
        if (!s.date) return false;
        const sessionDate = new Date(s.date);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate >= now && s.status !== 'completed' && s.status !== 'cancelled';
      })
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  }, [sessions]);

  // كل الجلسات (عند تفعيل "عرض الكل")
  const allSessionsSorted = useMemo(() => {
    return [...sessions].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [sessions]);

  const displaySessions = showAll ? allSessionsSorted : upcomingSessions;

  // تجميع حسب التاريخ
  const groupedSessions = useMemo(() => {
    const groups: Record<string, typeof displaySessions> = {};
    for (const session of displaySessions) {
      const key = session.date || 'بدون تاريخ';
      if (!groups[key]) groups[key] = [];
      groups[key].push(session);
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
    const now = new Date();

    if (editingSession?.id) {
      await updateSession(editingSession.id, {
        ...formData,
        updatedAt: now,
      });
      toast.success('تم تحديث الجلسة بنجاح');
    } else {
      await createSession({
        ...formData,
        createdAt: now,
        updatedAt: now,
      });
      toast.success('تم إضافة الجلسة بنجاح');
    }

    setShowForm(false);
    resetForm();
  }

  async function handleDeleteSession(id: number) {
    await deleteSession(id);
    toast.success('تم حذف الجلسة');
  }

  // حساب الجلسات القادمة اليوم
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySessions = upcomingSessions.filter(s => s.date === todayStr);

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
                  className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-background cursor-pointer hover:shadow-sm transition-shadow"
                  onClick={() => {
                    if (session.caseId) {
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
          const sessionDate = new Date(date);
          const isToday = date === todayStr;
          const isPast = sessionDate < new Date(todayStr);
          return (
            <div key={date}>
              <h3 className={`text-sm font-semibold mb-2 flex items-center gap-2 ${isToday ? 'text-teal-700 dark:text-teal-400' : isPast ? 'text-muted-foreground' : 'text-foreground'}`}>
                <span>{isToday ? 'اليوم' : formatDate(date)}</span>
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
                  value={formData.date || ''}
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
                <Input
                  value={formData.court || ''}
                  onChange={(e) => setFormData({ ...formData, court: e.target.value })}
                  placeholder="اسم المحكمة"
                />
              </div>
              <div>
                <Label className="text-xs">الغرفة</Label>
                <Input
                  value={formData.chamber || ''}
                  onChange={(e) => setFormData({ ...formData, chamber: e.target.value })}
                  placeholder="الغرفة/القسم"
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
              <Select value={formData.status || ''} onValueChange={(v) => setFormData({ ...formData, status: v === '_empty' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="اختر الحالة" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_empty">—</SelectItem>
                  {SESSION_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
