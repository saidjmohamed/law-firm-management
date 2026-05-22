'use client';

import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Delay } from '@/lib/db';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  ChevronDown,
  Check,
  ArrowRightLeft,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ============================================================================
// ثوابت
// ============================================================================
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

const formatDateShort = (date: string | undefined) => {
  if (!date) return '—';
  try {
    return new Date(date).toLocaleDateString('ar-DZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
};

const emptyFormData = (): Partial<Delay> => ({
  caseId: 0,
  caseNumber: '',
  caseSubject: '',
  delayDate: '',
  reason: '',
  newDate: '',
  notes: '',
});

// ============================================================================
// مكون التأجيلات
// ============================================================================
export function DelaysManager() {
  const delays = useLiveQuery(() => db.delays.orderBy('delayDate').reverse().toArray());
  const cases = useLiveQuery(() => db.cases.toArray());

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedDelay, setSelectedDelay] = useState<Delay | null>(null);
  const [casePickerOpen, setCasePickerOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Delay>>(emptyFormData());

  // Determine delay status
  const getDelayStatus = (delay: Delay): 'upcoming' | 'past' => {
    if (delay.newDate) {
      const newDate = new Date(delay.newDate);
      const today = new Date(new Date().toDateString());
      return newDate >= today ? 'upcoming' : 'past';
    }
    const delayDate = new Date(delay.delayDate);
    const today = new Date(new Date().toDateString());
    return delayDate >= today ? 'upcoming' : 'past';
  };

  // Filter delays
  const filteredDelays = useMemo(() => {
    if (!delays) return [];
    return delays.filter((d) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        (d.caseNumber && d.caseNumber.toLowerCase().includes(q)) ||
        (d.caseSubject && d.caseSubject.toLowerCase().includes(q)) ||
        (d.reason && d.reason.toLowerCase().includes(q)) ||
        (d.notes && d.notes.toLowerCase().includes(q));
      const matchStatus = filterStatus === 'all' || getDelayStatus(d) === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [delays, search, filterStatus]);

  // Group delays by delayDate
  const groupedDelays = useMemo(() => {
    if (!filteredDelays) return {};
    const groups: Record<string, Delay[]> = {};
    filteredDelays.forEach((d) => {
      const key = d.delayDate || 'غير محدد';
      if (!groups[key]) groups[key] = [];
      groups[key].push(d);
    });
    // Sort groups by date desc
    const sorted = Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
    return Object.fromEntries(sorted);
  }, [filteredDelays]);

  // Summary counts
  const upcomingCount = useMemo(
    () => delays?.filter((d) => getDelayStatus(d) === 'upcoming').length ?? 0,
    [delays]
  );
  const pastCount = useMemo(
    () => delays?.filter((d) => getDelayStatus(d) === 'past').length ?? 0,
    [delays]
  );

  // Get case info for view dialog
  const viewCaseInfo = useMemo(() => {
    if (!selectedDelay) return null;
    return cases?.find((c) => c.id === selectedDelay.caseId) ?? null;
  }, [selectedDelay, cases]);

  const isUpcoming = (date: string) => {
    if (!date) return false;
    return new Date(date) >= new Date(new Date().toDateString());
  };

  // Handlers
  const openAdd = () => {
    setFormData(emptyFormData());
    setSelectedDelay(null);
    setDialogOpen(true);
  };

  const openEdit = (d: Delay) => {
    setFormData({ ...d });
    setSelectedDelay(d);
    setDialogOpen(true);
  };

  const openView = (d: Delay) => {
    setSelectedDelay(d);
    setViewOpen(true);
  };

  const openDelete = (d: Delay) => {
    setSelectedDelay(d);
    setDeleteOpen(true);
  };

  const handleSave = async () => {
    try {
      const now = new Date();
      if (selectedDelay?.id) {
        await db.delays.update(selectedDelay.id, {
          caseId: formData.caseId || 0,
          caseNumber: formData.caseNumber || '',
          caseSubject: formData.caseSubject || undefined,
          delayDate: formData.delayDate || '',
          reason: formData.reason || '',
          newDate: formData.newDate || undefined,
          notes: formData.notes || undefined,
          updatedAt: now,
        } as Delay);
        toast.success('تم تحديث التأجيل بنجاح');
      } else {
        await db.delays.add({
          caseId: formData.caseId || 0,
          caseNumber: formData.caseNumber || '',
          caseSubject: formData.caseSubject || undefined,
          delayDate: formData.delayDate || '',
          reason: formData.reason || '',
          newDate: formData.newDate || undefined,
          notes: formData.notes || undefined,
          createdAt: now,
          updatedAt: now,
        });
        toast.success('تم إضافة التأجيل بنجاح');
      }
      setDialogOpen(false);
    } catch {
      toast.error('حدث خطأ أثناء الحفظ');
    }
  };

  const handleDelete = async () => {
    if (selectedDelay?.id) {
      try {
        await db.delays.delete(selectedDelay.id);
        toast.success('تم حذف التأجيل بنجاح');
      } catch {
        toast.error('حدث خطأ أثناء الحذف');
      }
      setDeleteOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">إجمالي التأجيلات</p>
              <p className="text-lg font-bold truncate">{(delays?.length ?? 0).toLocaleString('en-US')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
              <CalendarDays className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">تأجيلات قادمة</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 truncate">{upcomingCount.toLocaleString('en-US')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">تأجيلات سابقة</p>
              <p className="text-lg font-bold text-gray-600 dark:text-gray-400 truncate">{pastCount.toLocaleString('en-US')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث برقم القضية، الموضوع، السبب..."
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
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="upcoming">قادمة</SelectItem>
            <SelectItem value="past">سابقة</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={openAdd} className="bg-teal-700 hover:bg-teal-800 shrink-0">
          <Plus className="w-4 h-4 ml-2" />
          إضافة تأجيل
        </Button>
      </div>

      {/* Count */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-sm">
          <Clock className="w-3.5 h-3.5 ml-1" />
          {filteredDelays.length} تأجيل
        </Badge>
      </div>

      {/* Desktop Table */}
      <Card className="border-0 shadow-sm overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">رقم القضية</TableHead>
                <TableHead className="text-right">موضوع القضية</TableHead>
                <TableHead className="text-right">تاريخ التأجيل</TableHead>
                <TableHead className="text-right">السبب</TableHead>
                <TableHead className="text-right">التاريخ الجديد</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDelays.length > 0 ? (
                filteredDelays.map((d) => {
                  const status = getDelayStatus(d);
                  return (
                    <TableRow key={d.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-sm">{d.caseNumber || '—'}</TableCell>
                      <TableCell className="max-w-[180px] truncate">{d.caseSubject || '—'}</TableCell>
                      <TableCell className="text-sm">{formatDateShort(d.delayDate)}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm">{d.reason || '—'}</TableCell>
                      <TableCell className="text-sm">
                        {d.newDate ? (
                          <span className="flex items-center gap-1">
                            <ArrowRightLeft className="w-3 h-3 text-amber-500" />
                            {formatDateShort(d.newDate)}
                          </span>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${
                            status === 'upcoming'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                          }`}
                        >
                          {status === 'upcoming' ? 'قادمة' : 'سابقة'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openView(d)} title="عرض">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(d)} title="تعديل">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => openDelete(d)} title="حذف">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {search || filterStatus !== 'all' ? 'لا توجد نتائج للبحث' : 'لا توجد تأجيلات بعد'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Mobile: Grouped by date (like sessions) */}
      <div className="space-y-4 md:hidden max-h-[calc(100vh-380px)] overflow-y-auto">
        {Object.keys(groupedDelays).length > 0 ? (
          Object.entries(groupedDelays).map(([dateKey, dateDelays]) => {
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
                    <Badge className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">قادمة</Badge>
                  )}
                  <Badge variant="outline" className="text-xs">{dateDelays.length}</Badge>
                </div>
                <div className="grid gap-3">
                  {dateDelays.map((delay) => {
                    const status = getDelayStatus(delay);
                    return (
                      <Card key={delay.id} className="border-0 shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge
                                  variant="secondary"
                                  className={`text-xs ${
                                    status === 'upcoming'
                                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                  }`}
                                >
                                  {status === 'upcoming' ? 'قادمة' : 'سابقة'}
                                </Badge>
                                <span className="font-mono text-xs text-muted-foreground">{delay.caseNumber}</span>
                              </div>
                              <p className="font-medium text-sm mb-1">{delay.caseSubject || '—'}</p>
                              <div className="text-xs text-muted-foreground space-y-1">
                                {delay.reason && (
                                  <div>
                                    <span className="text-muted-foreground">السبب: </span>{delay.reason}
                                  </div>
                                )}
                                {delay.newDate && (
                                  <div className="flex items-center gap-1">
                                    <ArrowRightLeft className="w-3 h-3 text-amber-500" />
                                    <span>التاريخ الجديد: {formatDateShort(delay.newDate)}</span>
                                  </div>
                                )}
                                {delay.notes && (
                                  <p className="mt-1">{delay.notes}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 mr-2 shrink-0">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openView(delay)} title="عرض">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(delay)} title="تعديل">
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => openDelete(delay)} title="حذف">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })
        ) : (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-12 text-center text-muted-foreground">
              {search || filterStatus !== 'all' ? 'لا توجد نتائج للبحث' : 'لا توجد تأجيلات بعد'}
            </CardContent>
          </Card>
        )}
      </div>

      {/* View Delay Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل التأجيل</DialogTitle>
            <DialogDescription>معلومات التأجيل والقضية المرتبطة</DialogDescription>
          </DialogHeader>
          {selectedDelay && (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6 text-amber-700 dark:text-amber-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold">{selectedDelay.caseSubject || '—'}</p>
                  <p className="text-sm text-muted-foreground font-mono">{selectedDelay.caseNumber}</p>
                </div>
                <Badge
                  variant="secondary"
                  className={`text-xs shrink-0 mr-auto ${
                    getDelayStatus(selectedDelay) === 'upcoming'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  }`}
                >
                  {getDelayStatus(selectedDelay) === 'upcoming' ? 'قادمة' : 'سابقة'}
                </Badge>
              </div>

              {/* Delay Details */}
              <div className="grid gap-3">
                <div className="text-sm">
                  <span className="text-muted-foreground">تاريخ التأجيل: </span>
                  <span className="font-medium">{formatDate(selectedDelay.delayDate)}</span>
                </div>
                {selectedDelay.newDate && (
                  <div className="text-sm flex items-center gap-2">
                    <ArrowRightLeft className="w-4 h-4 text-amber-500" />
                    <span className="text-muted-foreground">التاريخ الجديد: </span>
                    <span className="font-medium text-amber-700 dark:text-amber-400">{formatDate(selectedDelay.newDate)}</span>
                  </div>
                )}
                {selectedDelay.reason && (
                  <div className="text-sm p-3 rounded-lg bg-muted/50">
                    <span className="text-muted-foreground">السبب: </span>
                    {selectedDelay.reason}
                  </div>
                )}
                {selectedDelay.notes && (
                  <div className="text-sm p-3 rounded-lg bg-muted/50">
                    <span className="text-muted-foreground">ملاحظات: </span>
                    {selectedDelay.notes}
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
                    setTimeout(() => openEdit(selectedDelay), 200);
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
                    setTimeout(() => openDelete(selectedDelay), 200);
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
            <DialogTitle>{selectedDelay ? 'تعديل التأجيل' : 'إضافة تأجيل جديد'}</DialogTitle>
            <DialogDescription>
              {selectedDelay ? 'قم بتعديل بيانات التأجيل' : 'أدخل بيانات التأجيل الجديد'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Case Picker */}
            <div className="grid gap-2">
              <Label>القضية</Label>
              <Popover open={casePickerOpen} onOpenChange={setCasePickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-between font-normal">
                    {formData.caseSubject || formData.caseNumber || 'اختر القضية'}
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

            {/* Delay Date */}
            <div className="grid gap-2">
              <Label>تاريخ التأجيل</Label>
              <Input
                type="date"
                value={formData.delayDate || ''}
                onChange={(e) => setFormData({ ...formData, delayDate: e.target.value })}
              />
            </div>

            {/* Reason */}
            <div className="grid gap-2">
              <Label>سبب التأجيل</Label>
              <Input
                value={formData.reason || ''}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="سبب التأجيل"
              />
            </div>

            {/* New Date */}
            <div className="grid gap-2">
              <Label>التاريخ الجديد</Label>
              <Input
                type="date"
                value={formData.newDate || ''}
                onChange={(e) => setFormData({ ...formData, newDate: e.target.value })}
              />
            </div>

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
              {selectedDelay ? 'تحديث' : 'إضافة'}
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
              هل أنت متأكد من حذف هذا التأجيل؟ لا يمكن التراجع عن هذا الإجراء.
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
