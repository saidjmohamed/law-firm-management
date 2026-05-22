'use client';

import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Session } from '@/lib/db';
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
  ChevronLeft,
} from 'lucide-react';

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
  const [filterDate, setFilterDate] = useState('');

  const sessions = useLiveQuery(() => db.sessions.toArray());
  const cases = useLiveQuery(() => db.cases.toArray());

  const filteredSessions = useMemo(() => {
    if (!sessions) return [];
    let filtered = [...sessions];
    if (filterDate) {
      filtered = filtered.filter((s) => s.date === filterDate);
    }
    return filtered.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [sessions, filterDate]);

  // تجميع حسب التاريخ
  const groupedSessions = useMemo(() => {
    const groups: Record<string, typeof filteredSessions> = {};
    for (const session of filteredSessions) {
      const key = session.date || 'بدون تاريخ';
      if (!groups[key]) groups[key] = [];
      groups[key].push(session);
    }
    return groups;
  }, [filteredSessions]);

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
      await db.sessions.update(editingSession.id, {
        ...formData,
        updatedAt: now,
      });
      toast.success('تم تحديث الجلسة بنجاح');
    } else {
      await db.sessions.add({
        ...formData,
        createdAt: now,
        updatedAt: now,
      });
      toast.success('تم إضافة الجلسة بنجاح');
    }

    setShowForm(false);
    resetForm();
  }

  async function deleteSession(id: number) {
    await db.sessions.delete(id);
    toast.success('تم حذف الجلسة');
  }

  // الجلسات القادمة
  const now = new Date();
  const upcomingSessions = filteredSessions.filter(
    (s) => s.date && new Date(s.date) >= now && s.status !== 'completed' && s.status !== 'cancelled'
  );

  return (
    <div className="space-y-4">
      {/* شريط الأدوات */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="w-full sm:w-48"
        />
        {filterDate && (
          <Button variant="ghost" size="sm" onClick={() => setFilterDate('')}>
            مسح الفلتر
          </Button>
        )}
        <div className="flex-1" />
        <Button onClick={openAddForm} className="bg-teal-600 hover:bg-teal-700 shrink-0">
          <Plus className="w-4 h-4 ml-1" />
          إضافة جلسة
        </Button>
      </div>

      {/* الجلسات القادمة */}
      {upcomingSessions.length > 0 && !filterDate && (
        <div>
          <h3 className="text-sm font-semibold mb-2 text-teal-700 dark:text-teal-400">الجلسات القادمة</h3>
          <div className="grid gap-2">
            {upcomingSessions.slice(0, 5).map((session) => (
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
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{session.caseNumber || '—'}</span>
                        <Badge className={`${STATUS_BADGE_CLASSES[session.status || 'scheduled'] || ''} text-xs`}>
                          {STATUS_LABELS[session.status || 'scheduled']}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {session.court && <span>{session.court}</span>}
                        {session.chamber && <span>• {session.chamber}</span>}
                        {session.time && <span>• {session.time}</span>}
                      </div>
                    </div>
                    <div className="text-left">
                      <Badge variant="outline" className="text-xs">{formatDate(session.date)}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* كل الجلسات مج.grouped */}
      <div className="space-y-4">
        {Object.entries(groupedSessions).map(([date, dateSessions]) => (
          <div key={date}>
            <h3 className="text-sm font-semibold mb-2 text-muted-foreground">{date}</h3>
            <div className="space-y-2">
              {dateSessions.map((session) => (
                <Card key={session.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{session.caseNumber || '—'}</span>
                          <Badge className={`${STATUS_BADGE_CLASSES[session.status || 'scheduled'] || ''} text-xs`}>
                            {STATUS_LABELS[session.status || 'scheduled']}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                          {session.court && <span>{session.court}</span>}
                          {session.chamber && <span>• {session.chamber}</span>}
                          {session.time && <span>• {session.time}</span>}
                          {session.roomNumber && <span>• قاعة {(session.roomNumber).toLocaleString('en-US')}</span>}
                        </div>
                        {session.result && (
                          <p className="text-xs mt-1 text-muted-foreground">النتيجة: {session.result}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mr-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditForm(session)}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => session.id && deleteSession(session.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}

        {filteredSessions.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">لا توجد جلسات مسجلة</p>
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
