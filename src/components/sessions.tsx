'use client';

import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Session } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  CalendarDays,
  Clock,
  MapPin,
  ChevronDown,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const statusLabels: Record<string, string> = {
  scheduled: 'مجدولة',
  completed: 'مكتملة',
  postponed: 'مؤجلة',
  cancelled: 'ملغاة',
};

const statusColors: Record<string, string> = {
  scheduled: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  postponed: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export function Sessions() {
  const sessions = useLiveQuery(() => db.sessions.orderBy('date').reverse().toArray());
  const cases = useLiveQuery(() => db.cases.toArray());

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [casePickerOpen, setCasePickerOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Session>>({
    caseId: 0,
    caseTitle: '',
    caseNumber: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    court: '',
    hall: '',
    judgeName: '',
    notes: '',
    status: 'scheduled',
    result: '',
  });

  const filteredSessions = sessions?.filter((s) => {
    const matchSearch =
      !search ||
      s.caseTitle.includes(search) ||
      s.caseNumber.includes(search) ||
      s.court.includes(search);
    const matchStatus = filterStatus === 'all' || s.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const openAdd = () => {
    setFormData({
      caseId: 0,
      caseTitle: '',
      caseNumber: '',
      date: new Date().toISOString().split('T')[0],
      time: '09:00',
      court: '',
      hall: '',
      judgeName: '',
      notes: '',
      status: 'scheduled',
      result: '',
    });
    setSelectedSession(null);
    setDialogOpen(true);
  };

  const openEdit = (s: Session) => {
    setFormData({
      ...s,
      date: s.date ? new Date(s.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    });
    setSelectedSession(s);
    setDialogOpen(true);
  };

  const openDelete = (s: Session) => {
    setSelectedSession(s);
    setDeleteOpen(true);
  };

  const handleSave = async () => {
    if (!formData.caseId) {
      toast.error('يرجى اختيار القضية');
      return;
    }
    if (!formData.date) {
      toast.error('يرجى تحديد التاريخ');
      return;
    }
    try {
      if (selectedSession?.id) {
        await db.sessions.update(selectedSession.id, {
          ...formData,
          date: new Date(formData.date),
        } as Session);
        toast.success('تم تحديث الجلسة بنجاح');
      } else {
        await db.sessions.add({
          caseId: formData.caseId!,
          caseTitle: formData.caseTitle || '',
          caseNumber: formData.caseNumber || '',
          date: new Date(formData.date!),
          time: formData.time || '09:00',
          court: formData.court || '',
          hall: formData.hall || '',
          judgeName: formData.judgeName || '',
          notes: formData.notes || '',
          status: (formData.status as Session['status']) || 'scheduled',
          result: formData.result || undefined,
          createdAt: new Date(),
        });
        toast.success('تم إضافة الجلسة بنجاح');
      }
      setDialogOpen(false);
    } catch {
      toast.error('حدث خطأ أثناء الحفظ');
    }
  };

  const handleDelete = async () => {
    if (selectedSession?.id) {
      try {
        await db.sessions.delete(selectedSession.id);
        toast.success('تم حذف الجلسة بنجاح');
      } catch {
        toast.error('حدث خطأ أثناء الحذف');
      }
      setDeleteOpen(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDay = (date: Date) => {
    return new Date(date).toLocaleDateString('ar-SA', { weekday: 'long' });
  };

  const isUpcoming = (date: Date) => {
    return new Date(date) >= new Date(new Date().toDateString());
  };

  // Group sessions by date
  const groupedSessions = React.useMemo(() => {
    if (!filteredSessions) return {};
    const groups: Record<string, Session[]> = {};
    filteredSessions.forEach((s) => {
      const key = new Date(s.date).toISOString().split('T')[0];
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    });
    // Sort groups by date desc
    const sorted = Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
    return Object.fromEntries(sorted);
  }, [filteredSessions]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالقضية أو المحكمة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الحالات</SelectItem>
            <SelectItem value="scheduled">مجدولة</SelectItem>
            <SelectItem value="completed">مكتملة</SelectItem>
            <SelectItem value="postponed">مؤجلة</SelectItem>
            <SelectItem value="cancelled">ملغاة</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={openAdd} className="bg-teal-700 hover:bg-teal-800 shrink-0">
          <Plus className="w-4 h-4 ml-2" />
          إضافة جلسة
        </Button>
      </div>

      {/* Sessions grouped by date */}
      <div className="space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto">
        {Object.keys(groupedSessions).length > 0 ? (
          Object.entries(groupedSessions).map(([dateKey, dateSessions]) => {
            const dateObj = new Date(dateKey);
            const upcoming = isUpcoming(dateObj);
            return (
              <div key={dateKey}>
                <div className="flex items-center gap-2 mb-3">
                  <CalendarDays className={`w-4 h-4 ${upcoming ? 'text-amber-500' : 'text-muted-foreground'}`} />
                  <span className={`font-semibold text-sm ${upcoming ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                    {formatDate(dateObj)}
                  </span>
                  <span className="text-sm text-muted-foreground">({formatDay(dateObj)})</span>
                  {upcoming && (
                    <Badge className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">قادمة</Badge>
                  )}
                </div>
                <div className="grid gap-3">
                  {dateSessions.map((session) => (
                    <Card key={session.id} className="border-0 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary" className={`text-xs ${statusColors[session.status]}`}>
                                {statusLabels[session.status]}
                              </Badge>
                              <span className="font-mono text-xs text-muted-foreground">{session.caseNumber}</span>
                            </div>
                            <p className="font-medium text-sm mb-1">{session.caseTitle}</p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {session.time}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {session.court}{session.hall ? ` - ${session.hall}` : ''}
                              </span>
                              {session.judgeName && (
                                <span>القاضي: {session.judgeName}</span>
                              )}
                            </div>
                            {session.notes && (
                              <p className="text-xs text-muted-foreground mt-2">{session.notes}</p>
                            )}
                            {session.result && (
                              <p className="text-xs mt-2 p-2 rounded bg-muted/50">
                                <span className="text-muted-foreground">النتيجة: </span>{session.result}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mr-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(session)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => openDelete(session)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-12 text-center text-muted-foreground">
              {search ? 'لا توجد نتائج للبحث' : 'لا توجد جلسات بعد'}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{selectedSession ? 'تعديل الجلسة' : 'إضافة جلسة جديدة'}</DialogTitle>
            <DialogDescription>
              {selectedSession ? 'قم بتعديل بيانات الجلسة' : 'أدخل بيانات الجلسة الجديدة'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>القضية *</Label>
              <Popover open={casePickerOpen} onOpenChange={setCasePickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-between font-normal">
                    {formData.caseTitle || 'اختر القضية'}
                    <ChevronDown className="w-4 h-4 mr-2 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start">
                  <Command>
                    <CommandInput placeholder="بحث عن قضية..." />
                    <CommandList>
                      <CommandEmpty>لا توجد قضايا</CommandEmpty>
                      <CommandGroup>
                        {cases?.map((c) => (
                          <CommandItem
                            key={c.id}
                            onSelect={() => {
                              setFormData({
                                ...formData,
                                caseId: c.id!,
                                caseTitle: c.title,
                                caseNumber: c.caseNumber,
                                court: c.court || formData.court,
                              });
                              setCasePickerOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                'w-4 h-4 ml-2',
                                formData.caseId === c.id ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            <span>{c.title}</span>
                            <span className="text-xs text-muted-foreground mr-2">({c.caseNumber})</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>التاريخ *</Label>
                <Input
                  type="date"
                  value={formData.date ? (typeof formData.date === 'string' ? formData.date : new Date(formData.date).toISOString().split('T')[0]) : ''}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>الوقت</Label>
                <Input
                  type="time"
                  value={formData.time || '09:00'}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>المحكمة</Label>
                <Input
                  value={formData.court || ''}
                  onChange={(e) => setFormData({ ...formData, court: e.target.value })}
                  placeholder="اسم المحكمة"
                />
              </div>
              <div className="grid gap-2">
                <Label>القاعة</Label>
                <Input
                  value={formData.hall || ''}
                  onChange={(e) => setFormData({ ...formData, hall: e.target.value })}
                  placeholder="رقم القاعة"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>اسم القاضي</Label>
              <Input
                value={formData.judgeName || ''}
                onChange={(e) => setFormData({ ...formData, judgeName: e.target.value })}
                placeholder="اسم القاضي"
              />
            </div>
            <div className="grid gap-2">
              <Label>الحالة</Label>
              <Select
                value={formData.status || 'scheduled'}
                onValueChange={(v) => setFormData({ ...formData, status: v as Session['status'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">مجدولة</SelectItem>
                  <SelectItem value="completed">مكتملة</SelectItem>
                  <SelectItem value="postponed">مؤجلة</SelectItem>
                  <SelectItem value="cancelled">ملغاة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.status === 'completed' && (
              <div className="grid gap-2">
                <Label>النتيجة</Label>
                <Textarea
                  value={formData.result || ''}
                  onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                  placeholder="نتيجة الجلسة"
                  rows={2}
                />
              </div>
            )}
            <div className="grid gap-2">
              <Label>ملاحظات</Label>
              <Textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="ملاحظات إضافية"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSave} className="bg-teal-700 hover:bg-teal-800">
              {selectedSession ? 'تحديث' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذه الجلسة؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
