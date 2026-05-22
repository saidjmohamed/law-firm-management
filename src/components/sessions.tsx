'use client';

import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Session } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
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
  Eye,
  CalendarDays,
  Clock,
  MapPin,
  ChevronDown,
  Check,
  Gavel,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ============================================================================
// ثوابت
// ============================================================================
const statusLabels: Record<string, string> = {
  scheduled: 'مجدولة',
  completed: 'منجزة',
  postponed: 'مؤجلة',
  cancelled: 'ملغاة',
};

const statusColors: Record<string, string> = {
  scheduled: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  postponed: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const formatDate = (date: string) => {
  if (!date) return '—';
  try {
    return new Date(date).toLocaleDateString('ar-DZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
};

const formatDay = (date: string) => {
  if (!date) return '';
  try {
    return new Date(date).toLocaleDateString('ar-DZ', { weekday: 'long' });
  } catch {
    return '';
  }
};

const emptyFormData = (): Partial<Session> => ({
  caseId: 0,
  caseNumber: '',
  caseSubject: '',
  date: new Date().toISOString().split('T')[0],
  time: '09:00',
  court: '',
  hall: '',
  judgeName: '',
  notes: '',
  status: 'scheduled',
  result: '',
});

// ============================================================================
// مكون الجلسات
// ============================================================================
export function Sessions() {
  const sessions = useLiveQuery(() => db.sessions.orderBy('date').reverse().toArray());
  const cases = useLiveQuery(() => db.cases.toArray());

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [casePickerOpen, setCasePickerOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Session>>(emptyFormData());

  // Filter sessions
  const filteredSessions = useMemo(() => {
    if (!sessions) return [];
    return sessions.filter((s) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        (s.caseNumber && s.caseNumber.toLowerCase().includes(q)) ||
        (s.caseSubject && s.caseSubject.toLowerCase().includes(q)) ||
        (s.court && s.court.toLowerCase().includes(q)) ||
        (s.hall && s.hall.toLowerCase().includes(q)) ||
        (s.judgeName && s.judgeName.toLowerCase().includes(q)) ||
        (s.notes && s.notes.toLowerCase().includes(q)) ||
        (s.result && s.result.toLowerCase().includes(q));
      const matchStatus = filterStatus === 'all' || s.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [sessions, search, filterStatus]);

  // Group sessions by date
  const groupedSessions = useMemo(() => {
    if (!filteredSessions) return {};
    const groups: Record<string, Session[]> = {};
    filteredSessions.forEach((s) => {
      const key = s.date || 'غير محدد';
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    });
    // Sort groups by date desc
    const sorted = Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
    return Object.fromEntries(sorted);
  }, [filteredSessions]);

  const isUpcoming = (date: string) => {
    if (!date) return false;
    return new Date(date) >= new Date(new Date().toDateString());
  };

  // Get case info for view dialog
  const viewCaseInfo = useMemo(() => {
    if (!selectedSession) return null;
    return cases?.find((c) => c.id === selectedSession.caseId) ?? null;
  }, [selectedSession, cases]);

  // Handlers
  const openAdd = () => {
    setFormData(emptyFormData());
    setSelectedSession(null);
    setDialogOpen(true);
  };

  const openEdit = (s: Session) => {
    setFormData({ ...s });
    setSelectedSession(s);
    setDialogOpen(true);
  };

  const openView = (s: Session) => {
    setSelectedSession(s);
    setViewOpen(true);
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
      const now = new Date();
      if (selectedSession?.id) {
        await db.sessions.update(selectedSession.id, {
          caseId: formData.caseId!,
          caseNumber: formData.caseNumber || '',
          caseSubject: formData.caseSubject || '',
          date: formData.date!,
          time: formData.time || undefined,
          court: formData.court || undefined,
          hall: formData.hall || undefined,
          judgeName: formData.judgeName || undefined,
          notes: formData.notes || undefined,
          status: (formData.status as Session['status']) || 'scheduled',
          result: formData.status === 'completed' ? formData.result || undefined : undefined,
          updatedAt: now,
        } as Session);
        toast.success('تم تحديث الجلسة بنجاح');
      } else {
        await db.sessions.add({
          caseId: formData.caseId!,
          caseNumber: formData.caseNumber || '',
          caseSubject: formData.caseSubject || '',
          date: formData.date!,
          time: formData.time || undefined,
          court: formData.court || undefined,
          hall: formData.hall || undefined,
          judgeName: formData.judgeName || undefined,
          notes: formData.notes || undefined,
          status: (formData.status as Session['status']) || 'scheduled',
          result: formData.status === 'completed' ? formData.result || undefined : undefined,
          createdAt: now,
          updatedAt: now,
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

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالقضية، المحكمة، القاضي..."
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
            <SelectItem value="completed">منجزة</SelectItem>
            <SelectItem value="postponed">مؤجلة</SelectItem>
            <SelectItem value="cancelled">ملغاة</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={openAdd} className="bg-teal-700 hover:bg-teal-800 shrink-0">
          <Plus className="w-4 h-4 ml-2" />
          إضافة جلسة
        </Button>
      </div>

      {/* Count */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-sm">
          <CalendarDays className="w-3.5 h-3.5 ml-1" />
          {filteredSessions.length} جلسة
        </Badge>
      </div>

      {/* Sessions grouped by date */}
      <div className="space-y-4 max-h-[calc(100vh-320px)] overflow-y-auto">
        {Object.keys(groupedSessions).length > 0 ? (
          Object.entries(groupedSessions).map(([dateKey, dateSessions]) => {
            const upcoming = isUpcoming(dateKey);
            return (
              <div key={dateKey}>
                <div className="flex items-center gap-2 mb-3 sticky top-0 bg-background/95 backdrop-blur-sm py-1 z-10">
                  <CalendarDays className={`w-4 h-4 ${upcoming ? 'text-amber-500' : 'text-muted-foreground'}`} />
                  <span className={`font-semibold text-sm ${upcoming ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                    {formatDate(dateKey)}
                  </span>
                  <span className="text-sm text-muted-foreground">({formatDay(dateKey)})</span>
                  {upcoming && (
                    <Badge className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">قادمة</Badge>
                  )}
                  <Badge variant="outline" className="text-xs">{dateSessions.length}</Badge>
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
                            <p className="font-medium text-sm mb-1">{session.caseSubject || '—'}</p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              {session.time && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {session.time}
                                </span>
                              )}
                              {session.court && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {session.court}{session.hall ? ` - ${session.hall}` : ''}
                                </span>
                              )}
                              {session.judgeName && (
                                <span className="flex items-center gap-1">
                                  <Gavel className="w-3 h-3" />
                                  {session.judgeName}
                                </span>
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
                          <div className="flex items-center gap-1 mr-2 shrink-0">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openView(session)} title="عرض">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(session)} title="تعديل">
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => openDelete(session)} title="حذف">
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
              {search || filterStatus !== 'all' ? 'لا توجد نتائج للبحث' : 'لا توجد جلسات بعد'}
            </CardContent>
          </Card>
        )}
      </div>

      {/* View Session Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل الجلسة</DialogTitle>
            <DialogDescription>معلومات الجلسة والقضية المرتبطة</DialogDescription>
          </DialogHeader>
          {selectedSession && (
            <div className="space-y-4">
              {/* Session Header */}
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                  <CalendarDays className="w-6 h-6 text-amber-700 dark:text-amber-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold">{selectedSession.caseSubject || '—'}</p>
                  <p className="text-sm text-muted-foreground font-mono">{selectedSession.caseNumber}</p>
                </div>
                <Badge variant="secondary" className={`text-xs shrink-0 mr-auto ${statusColors[selectedSession.status]}`}>
                  {statusLabels[selectedSession.status]}
                </Badge>
              </div>

              {/* Session Details */}
              <div className="grid gap-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-sm">
                    <span className="text-muted-foreground">التاريخ: </span>
                    <span className="font-medium">{formatDate(selectedSession.date)}</span>
                  </div>
                  {selectedSession.time && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">الوقت: </span>
                      <span className="font-medium" dir="ltr">{selectedSession.time}</span>
                    </div>
                  )}
                </div>
                {selectedSession.court && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">المحكمة: </span>
                    <span className="font-medium">{selectedSession.court}</span>
                  </div>
                )}
                {selectedSession.hall && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">القاعة: </span>
                    <span className="font-medium">{selectedSession.hall}</span>
                  </div>
                )}
                {selectedSession.judgeName && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">القاضي: </span>
                    <span className="font-medium">{selectedSession.judgeName}</span>
                  </div>
                )}
                {selectedSession.notes && (
                  <div className="text-sm p-3 rounded-lg bg-muted/50">
                    <span className="text-muted-foreground">ملاحظات: </span>
                    {selectedSession.notes}
                  </div>
                )}
                {selectedSession.result && (
                  <div className="text-sm p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                    <span className="text-emerald-700 dark:text-emerald-400 font-medium">النتيجة: </span>
                    {selectedSession.result}
                  </div>
                )}
              </div>

              {/* Case Info */}
              {viewCaseInfo && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-teal-600" />
                      معلومات القضية
                    </h4>
                    <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-900/10 space-y-1 text-sm">
                      <div><span className="text-muted-foreground">الموضوع: </span>{viewCaseInfo.subject}</div>
                      <div><span className="text-muted-foreground">الموكل: </span>{viewCaseInfo.clientName || '—'}</div>
                      <div><span className="text-muted-foreground">المحكمة: </span>{viewCaseInfo.courtName || '—'}</div>
                      <div><span className="text-muted-foreground">الطبيعة: </span>{viewCaseInfo.caseNature}</div>
                    </div>
                  </div>
                </>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setViewOpen(false);
                    setTimeout(() => openEdit(selectedSession), 200);
                  }}
                >
                  <Pencil className="w-4 h-4 ml-2" />
                  تعديل
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 text-destructive hover:text-destructive"
                  onClick={() => {
                    setViewOpen(false);
                    setTimeout(() => openDelete(selectedSession), 200);
                  }}
                >
                  <Trash2 className="w-4 h-4 ml-2" />
                  حذف
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
            {/* Case Picker */}
            <div className="grid gap-2">
              <Label>القضية *</Label>
              <Popover open={casePickerOpen} onOpenChange={setCasePickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-between font-normal">
                    {formData.caseSubject || 'اختر القضية'}
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
                                caseNumber: c.caseNumber,
                                caseSubject: c.subject,
                                court: c.courtName || formData.court,
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
                            <span>{c.subject}</span>
                            <span className="text-xs text-muted-foreground mr-2">({c.caseNumber})</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Date + Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>التاريخ *</Label>
                <Input
                  type="date"
                  value={formData.date || ''}
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

            {/* Court + Hall */}
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

            {/* Judge Name */}
            <div className="grid gap-2">
              <Label>اسم القاضي</Label>
              <Input
                value={formData.judgeName || ''}
                onChange={(e) => setFormData({ ...formData, judgeName: e.target.value })}
                placeholder="اسم القاضي"
              />
            </div>

            {/* Status */}
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
                  <SelectItem value="completed">منجزة</SelectItem>
                  <SelectItem value="postponed">مؤجلة</SelectItem>
                  <SelectItem value="cancelled">ملغاة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Result (shown when completed) */}
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

            {/* Notes */}
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
