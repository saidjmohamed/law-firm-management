'use client';

import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Case } from '@/lib/db';
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
  Scale,
  ChevronDown,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const statusLabels: Record<string, string> = {
  active: 'نشطة',
  closed: 'مغلقة',
  pending: 'معلقة',
  archived: 'مؤرشفة',
};

const statusColors: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  closed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  archived: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const caseTypes = ['مدني', 'جنائي', 'تجاري', 'أحوال شخصية', 'إداري', 'عمالي'];

export function Cases() {
  const cases = useLiveQuery(() => db.cases.orderBy('createdAt').reverse().toArray());
  const clients = useLiveQuery(() => db.clients.toArray());
  const sessions = useLiveQuery(() => db.sessions.toArray());
  const transactions = useLiveQuery(() => db.transactions.toArray());
  const documents = useLiveQuery(() => db.documents.toArray());

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [clientPickerOpen, setClientPickerOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Case>>({
    caseNumber: '',
    title: '',
    clientId: 0,
    clientName: '',
    court: '',
    caseType: 'مدني',
    status: 'active',
    description: '',
    opposingParty: '',
    opposingLawyer: '',
    startDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const filteredCases = cases?.filter((c) => {
    const matchSearch =
      !search ||
      c.title.includes(search) ||
      c.caseNumber.includes(search) ||
      c.clientName.includes(search);
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    const matchType = filterType === 'all' || c.caseType === filterType;
    return matchSearch && matchStatus && matchType;
  });

  const openAdd = () => {
    setFormData({
      caseNumber: '',
      title: '',
      clientId: 0,
      clientName: '',
      court: '',
      caseType: 'مدني',
      status: 'active',
      description: '',
      opposingParty: '',
      opposingLawyer: '',
      startDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setSelectedCase(null);
    setDialogOpen(true);
  };

  const openEdit = (c: Case) => {
    setFormData({
      ...c,
      startDate: c.startDate ? new Date(c.startDate).toISOString().split('T')[0] : '',
      endDate: c.endDate ? new Date(c.endDate).toISOString().split('T')[0] : '',
    });
    setSelectedCase(c);
    setDialogOpen(true);
  };

  const openView = (c: Case) => {
    setSelectedCase(c);
    setViewOpen(true);
  };

  const openDelete = (c: Case) => {
    setSelectedCase(c);
    setDeleteOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title?.trim()) {
      toast.error('يرجى إدخال عنوان القضية');
      return;
    }
    if (!formData.caseNumber?.trim()) {
      toast.error('يرجى إدخال رقم القضية');
      return;
    }
    try {
      if (selectedCase?.id) {
        await db.cases.update(selectedCase.id, {
          ...formData,
          title: formData.title!.trim(),
          caseNumber: formData.caseNumber!.trim(),
        } as Case);
        toast.success('تم تحديث القضية بنجاح');
      } else {
        await db.cases.add({
          caseNumber: formData.caseNumber!.trim(),
          title: formData.title!.trim(),
          clientId: formData.clientId || 0,
          clientName: formData.clientName || '',
          court: formData.court || '',
          caseType: formData.caseType || 'مدني',
          status: (formData.status as Case['status']) || 'active',
          description: formData.description || '',
          opposingParty: formData.opposingParty || '',
          opposingLawyer: formData.opposingLawyer || '',
          startDate: formData.startDate ? new Date(formData.startDate) : new Date(),
          endDate: formData.endDate ? new Date(formData.endDate) : undefined,
          notes: formData.notes || '',
          createdAt: new Date(),
        });
        toast.success('تم إضافة القضية بنجاح');
      }
      setDialogOpen(false);
    } catch {
      toast.error('حدث خطأ أثناء الحفظ');
    }
  };

  const handleDelete = async () => {
    if (selectedCase?.id) {
      try {
        await db.cases.delete(selectedCase.id);
        toast.success('تم حذف القضية بنجاح');
      } catch {
        toast.error('حدث خطأ أثناء الحذف');
      }
      setDeleteOpen(false);
    }
  };

  const caseSessions = sessions?.filter((s) => s.caseId === selectedCase?.id) ?? [];
  const caseTransactions = transactions?.filter((t) => t.caseId === selectedCase?.id) ?? [];
  const caseDocuments = documents?.filter((d) => d.caseId === selectedCase?.id) ?? [];

  const formatDate = (date: Date | undefined) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالعنوان أو الرقم أو العميل..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الحالات</SelectItem>
            <SelectItem value="active">نشطة</SelectItem>
            <SelectItem value="pending">معلقة</SelectItem>
            <SelectItem value="closed">مغلقة</SelectItem>
            <SelectItem value="archived">مؤرشفة</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="النوع" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الأنواع</SelectItem>
            {caseTypes.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={openAdd} className="bg-teal-700 hover:bg-teal-800 shrink-0">
          <Plus className="w-4 h-4 ml-2" />
          إضافة قضية
        </Button>
      </div>

      {/* Table */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">رقم القضية</TableHead>
                <TableHead className="text-right">العنوان</TableHead>
                <TableHead className="text-right hidden md:table-cell">العميل</TableHead>
                <TableHead className="text-right hidden sm:table-cell">النوع</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCases && filteredCases.length > 0 ? (
                filteredCases.map((c) => (
                  <TableRow key={c.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-sm">{c.caseNumber}</TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">{c.title}</TableCell>
                    <TableCell className="hidden md:table-cell">{c.clientName}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline" className="text-xs">{c.caseType}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`text-xs ${statusColors[c.status] || ''}`}>
                        {statusLabels[c.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openView(c)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => openDelete(c)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {search ? 'لا توجد نتائج للبحث' : 'لا توجد قضايا بعد'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{selectedCase ? 'تعديل القضية' : 'إضافة قضية جديدة'}</DialogTitle>
            <DialogDescription>
              {selectedCase ? 'قم بتعديل بيانات القضية' : 'أدخل بيانات القضية الجديدة'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>رقم القضية *</Label>
                <Input
                  value={formData.caseNumber || ''}
                  onChange={(e) => setFormData({ ...formData, caseNumber: e.target.value })}
                  placeholder="مثال: 2024-م-001"
                />
              </div>
              <div className="grid gap-2">
                <Label>العميل</Label>
                <Popover open={clientPickerOpen} onOpenChange={setClientPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-between font-normal">
                      {formData.clientName || 'اختر العميل'}
                      <ChevronDown className="w-4 h-4 mr-2 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0" align="start">
                    <Command>
                      <CommandInput placeholder="بحث عن عميل..." />
                      <CommandList>
                        <CommandEmpty>لا يوجد عملاء</CommandEmpty>
                        <CommandGroup>
                          {clients?.map((client) => (
                            <CommandItem
                              key={client.id}
                              onSelect={() => {
                                setFormData({
                                  ...formData,
                                  clientId: client.id!,
                                  clientName: client.name,
                                });
                                setClientPickerOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  'w-4 h-4 ml-2',
                                  formData.clientId === client.id ? 'opacity-100' : 'opacity-0'
                                )}
                              />
                              {client.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>عنوان القضية *</Label>
              <Input
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="عنوان القضية"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>نوع القضية</Label>
                <Select
                  value={formData.caseType || 'مدني'}
                  onValueChange={(v) => setFormData({ ...formData, caseType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {caseTypes.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>الحالة</Label>
                <Select
                  value={formData.status || 'active'}
                  onValueChange={(v) => setFormData({ ...formData, status: v as Case['status'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">نشطة</SelectItem>
                    <SelectItem value="pending">معلقة</SelectItem>
                    <SelectItem value="closed">مغلقة</SelectItem>
                    <SelectItem value="archived">مؤرشفة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>المحكمة</Label>
              <Input
                value={formData.court || ''}
                onChange={(e) => setFormData({ ...formData, court: e.target.value })}
                placeholder="اسم المحكمة"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>الخصم</Label>
                <Input
                  value={formData.opposingParty || ''}
                  onChange={(e) => setFormData({ ...formData, opposingParty: e.target.value })}
                  placeholder="اسم الخصم"
                />
              </div>
              <div className="grid gap-2">
                <Label>محامي الخصم</Label>
                <Input
                  value={formData.opposingLawyer || ''}
                  onChange={(e) => setFormData({ ...formData, opposingLawyer: e.target.value })}
                  placeholder="اسم محامي الخصم"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>تاريخ البدء</Label>
                <Input
                  type="date"
                  value={formData.startDate ? (typeof formData.startDate === 'string' ? formData.startDate : new Date(formData.startDate).toISOString().split('T')[0]) : ''}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>تاريخ الانتهاء</Label>
                <Input
                  type="date"
                  value={formData.endDate ? (typeof formData.endDate === 'string' ? formData.endDate : new Date(formData.endDate).toISOString().split('T')[0]) : ''}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value || undefined })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>الوصف</Label>
              <Textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="وصف القضية"
                rows={3}
              />
            </div>
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
              {selectedCase ? 'تحديث' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Case Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل القضية</DialogTitle>
            <DialogDescription>معلومات القضية الكاملة</DialogDescription>
          </DialogHeader>
          {selectedCase && (
            <div className="space-y-4">
              <div className="flex items-start justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <h3 className="font-bold text-lg">{selectedCase.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{selectedCase.caseNumber}</p>
                </div>
                <Badge variant="secondary" className={`text-xs ${statusColors[selectedCase.status]}`}>
                  {statusLabels[selectedCase.status]}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">العميل: </span>{selectedCase.clientName}</div>
                <div><span className="text-muted-foreground">النوع: </span>{selectedCase.caseType}</div>
                <div><span className="text-muted-foreground">المحكمة: </span>{selectedCase.court}</div>
                <div><span className="text-muted-foreground">تاريخ البدء: </span>{formatDate(selectedCase.startDate)}</div>
                <div><span className="text-muted-foreground">الخصم: </span>{selectedCase.opposingParty || '—'}</div>
                <div><span className="text-muted-foreground">محامي الخصم: </span>{selectedCase.opposingLawyer || '—'}</div>
                {selectedCase.endDate && (
                  <div><span className="text-muted-foreground">تاريخ الانتهاء: </span>{formatDate(selectedCase.endDate)}</div>
                )}
              </div>
              {selectedCase.description && (
                <div className="text-sm p-3 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">الوصف: </span>{selectedCase.description}
                </div>
              )}
              {selectedCase.notes && (
                <div className="text-sm p-3 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">ملاحظات: </span>{selectedCase.notes}
                </div>
              )}

              <div className="border-t pt-4">
                <h4 className="font-semibold text-sm mb-2">الجلسات ({caseSessions.length})</h4>
                {caseSessions.length > 0 ? (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {caseSessions.map((s) => (
                      <div key={s.id} className="text-sm p-2 rounded bg-muted/50 flex justify-between">
                        <span>{formatDate(s.date)} - {s.time}</span>
                        <span className="text-muted-foreground">{s.court}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">لا توجد جلسات</p>
                )}
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">المعاملات المالية ({caseTransactions.length})</h4>
                {caseTransactions.length > 0 ? (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {caseTransactions.map((t) => (
                      <div key={t.id} className="text-sm p-2 rounded bg-muted/50 flex justify-between">
                        <span>{t.description}</span>
                        <span className={t.type === 'income' ? 'text-emerald-600' : 'text-red-600'}>
                          {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString('ar-SA')} ر.س
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">لا توجد معاملات مالية</p>
                )}
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">المستندات ({caseDocuments.length})</h4>
                {caseDocuments.length > 0 ? (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {caseDocuments.map((d) => (
                      <div key={d.id} className="text-sm p-2 rounded bg-muted/50 flex justify-between">
                        <span>{d.title}</span>
                        <Badge variant="outline" className="text-xs">{d.docType}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">لا توجد مستندات</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف القضية &quot;{selectedCase?.title}&quot;؟ لا يمكن التراجع عن هذا الإجراء.
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
