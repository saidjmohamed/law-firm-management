'use client';

import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Payment } from '@/lib/db';
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
  TrendingUp,
  TrendingDown,
  Wallet,
  ChevronDown,
  Check,
  Banknote,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

// ============================================================================
// ثوابت
// ============================================================================
const fmtCurrency = (amount: number) => `${amount.toLocaleString('en-US')} د.ج`;

const typeLabels: Record<string, string> = {
  income: 'دخل',
  expense: 'مصروف',
};

const categories = ['أتعاب', 'استشارات', 'مصاريف قضية', 'رواتب', 'إيجار', 'أخرى'];

const formatDate = (date: string) => {
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

const emptyFormData = (): Partial<Payment> => ({
  type: 'income',
  category: 'أتعاب',
  amount: 0,
  description: '',
  date: new Date().toISOString().split('T')[0],
  caseId: undefined,
  caseNumber: '',
  caseSubject: '',
  clientId: undefined,
  clientName: '',
});

// ============================================================================
// مكون المدفوعات
// ============================================================================
export function PaymentsManager() {
  const payments = useLiveQuery(() => db.payments.orderBy('date').reverse().toArray());
  const cases = useLiveQuery(() => db.cases.toArray());
  const clients = useLiveQuery(() => db.clients.toArray());

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [casePickerOpen, setCasePickerOpen] = useState(false);
  const [clientPickerOpen, setClientPickerOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Payment>>(emptyFormData());
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  // Summary calculations
  const totalIncome = useMemo(
    () => payments?.filter((p) => p.type === 'income').reduce((sum, p) => sum + p.amount, 0) ?? 0,
    [payments]
  );
  const totalExpenses = useMemo(
    () => payments?.filter((p) => p.type === 'expense').reduce((sum, p) => sum + p.amount, 0) ?? 0,
    [payments]
  );
  const netBalance = totalIncome - totalExpenses;

  // Filter payments
  const filteredPayments = useMemo(() => {
    if (!payments) return [];
    return payments.filter((p) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.caseNumber && p.caseNumber.toLowerCase().includes(q)) ||
        (p.caseSubject && p.caseSubject.toLowerCase().includes(q)) ||
        (p.clientName && p.clientName.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q));
      const matchType = filterType === 'all' || p.type === filterType;
      const matchCategory = filterCategory === 'all' || p.category === filterCategory;
      return matchSearch && matchType && matchCategory;
    });
  }, [payments, search, filterType, filterCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / PAGE_SIZE));
  const paginatedPayments = filteredPayments.slice(0, page * PAGE_SIZE);
  const hasMore = page * PAGE_SIZE < filteredPayments.length;

  // Monthly chart data
  const monthlyData = useMemo(() => {
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const data: { month: string; income: number; expenses: number }[] = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - 5 + i);
      const m = d.getMonth();
      const y = d.getFullYear();
      const income = payments?.filter((p) => {
        const td = new Date(p.date);
        return p.type === 'income' && td.getMonth() === m && td.getFullYear() === y;
      }).reduce((s, p) => s + p.amount, 0) ?? 0;
      const expenses = payments?.filter((p) => {
        const td = new Date(p.date);
        return p.type === 'expense' && td.getMonth() === m && td.getFullYear() === y;
      }).reduce((s, p) => s + p.amount, 0) ?? 0;
      data.push({ month: months[m], income, expenses });
    }
    return data;
  }, [payments]);

  // Handlers
  const openAdd = () => {
    setFormData(emptyFormData());
    setSelectedPayment(null);
    setDialogOpen(true);
  };

  const openEdit = (p: Payment) => {
    setFormData({ ...p });
    setSelectedPayment(p);
    setDialogOpen(true);
  };

  const openDelete = (p: Payment) => {
    setSelectedPayment(p);
    setDeleteOpen(true);
  };

  const handleSave = async () => {
    if (!formData.amount || formData.amount <= 0) {
      toast.error('يرجى إدخال المبلغ');
      return;
    }
    if (!formData.date) {
      toast.error('يرجى تحديد التاريخ');
      return;
    }
    try {
      const now = new Date();
      if (selectedPayment?.id) {
        await db.payments.update(selectedPayment.id, {
          type: (formData.type as 'income' | 'expense') || 'income',
          category: formData.category || 'أخرى',
          amount: formData.amount!,
          description: formData.description?.trim() || undefined,
          date: formData.date!,
          caseId: formData.caseId || undefined,
          caseNumber: formData.caseNumber || undefined,
          caseSubject: formData.caseSubject || undefined,
          clientId: formData.clientId || undefined,
          clientName: formData.clientName || undefined,
          updatedAt: now,
        } as Payment);
        toast.success('تم تحديث المعاملة بنجاح');
      } else {
        await db.payments.add({
          type: (formData.type as 'income' | 'expense') || 'income',
          category: formData.category || 'أخرى',
          amount: formData.amount!,
          description: formData.description?.trim() || undefined,
          date: formData.date!,
          caseId: formData.caseId || undefined,
          caseNumber: formData.caseNumber || undefined,
          caseSubject: formData.caseSubject || undefined,
          clientId: formData.clientId || undefined,
          clientName: formData.clientName || undefined,
          createdAt: now,
          updatedAt: now,
        });
        toast.success('تم إضافة المعاملة بنجاح');
      }
      setDialogOpen(false);
    } catch {
      toast.error('حدث خطأ أثناء الحفظ');
    }
  };

  const handleDelete = async () => {
    if (selectedPayment?.id) {
      try {
        await db.payments.delete(selectedPayment.id);
        toast.success('تم حذف المعاملة بنجاح');
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
            <div className="w-12 h-12 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">إجمالي الدخل</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 truncate">{fmtCurrency(totalIncome)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
              <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">إجمالي المصاريف</p>
              <p className="text-lg font-bold text-red-600 dark:text-red-400 truncate">{fmtCurrency(totalExpenses)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${netBalance >= 0 ? 'bg-teal-50 dark:bg-teal-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
              <Wallet className={`w-6 h-6 ${netBalance >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-red-600 dark:text-red-400'}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">الرصيد الصافي</p>
              <p className={`text-lg font-bold truncate ${netBalance >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-red-600 dark:text-red-400'}`}>
                {fmtCurrency(netBalance)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">الدخل مقابل المصاريف (آخر 6 أشهر)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value: number) => `${value.toLocaleString('en-US')} د.ج`}
                contentStyle={{ direction: 'rtl', textAlign: 'right' }}
              />
              <Bar dataKey="income" name="الدخل" fill="#059669" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="المصاريف" fill="#dc2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالوصف، القضية، الموكل..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pr-9"
          />
        </div>
        <Select value={filterType} onValueChange={(v) => { setFilterType(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="النوع" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="income">دخل</SelectItem>
            <SelectItem value="expense">مصروف</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={(v) => { setFilterCategory(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="الفئة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الفئات</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={openAdd} className="bg-teal-700 hover:bg-teal-800 shrink-0">
          <Plus className="w-4 h-4 ml-2" />
          إضافة معاملة
        </Button>
      </div>

      {/* Count */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-sm">
          <Banknote className="w-3.5 h-3.5 ml-1" />
          {filteredPayments.length} معاملة
        </Badge>
      </div>

      {/* Desktop Table */}
      <Card className="border-0 shadow-sm overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-right">النوع</TableHead>
                <TableHead className="text-right">الفئة</TableHead>
                <TableHead className="text-right">الوصف</TableHead>
                <TableHead className="text-right hidden lg:table-cell">القضية</TableHead>
                <TableHead className="text-right hidden xl:table-cell">الموكل</TableHead>
                <TableHead className="text-right">المبلغ</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPayments.length > 0 ? (
                paginatedPayments.map((p) => (
                  <TableRow key={p.id} className="hover:bg-muted/50">
                    <TableCell className="text-sm">{formatDate(p.date)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${p.type === 'income'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        {p.type === 'income' ? <TrendingUp className="w-3 h-3 ml-1" /> : <TrendingDown className="w-3 h-3 ml-1" />}
                        {typeLabels[p.type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{p.category}</TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">{p.description || '—'}</TableCell>
                    <TableCell className="text-sm hidden lg:table-cell max-w-[150px] truncate">
                      {p.caseNumber || '—'}
                    </TableCell>
                    <TableCell className="text-sm hidden xl:table-cell max-w-[120px] truncate">
                      {p.clientName || '—'}
                    </TableCell>
                    <TableCell className={`font-bold text-sm ${p.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {p.type === 'income' ? '+' : '-'}{fmtCurrency(p.amount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)} title="تعديل">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => openDelete(p)} title="حذف">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {search || filterType !== 'all' ? 'لا توجد نتائج للبحث' : 'لا توجد معاملات بعد'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Mobile Cards */}
      <div className="space-y-3 md:hidden">
        {paginatedPayments.length > 0 ? (
          paginatedPayments.map((p) => (
            <Card key={p.id} className="p-4 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{p.description || p.category}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(p.date)}</p>
                </div>
                <Badge
                  variant="secondary"
                  className={`text-xs shrink-0 ${p.type === 'income'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}
                >
                  {typeLabels[p.type]}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground space-x-3 space-x-reverse">
                  <span>{p.category}</span>
                  {p.caseNumber && <span>{p.caseNumber}</span>}
                </div>
                <span className={`font-bold ${p.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {p.type === 'income' ? '+' : '-'}{fmtCurrency(p.amount)}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => openEdit(p)}>
                  <Pencil className="w-4 h-4 ml-1" /> تعديل
                </Button>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-destructive" onClick={() => openDelete(p)}>
                  <Trash2 className="w-4 h-4 ml-1" /> حذف
                </Button>
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {search || filterType !== 'all' ? 'لا توجد نتائج للبحث' : 'لا توجد معاملات بعد'}
          </div>
        )}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => setPage((p) => p + 1)}>
            عرض المزيد
          </Button>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{selectedPayment ? 'تعديل المعاملة' : 'إضافة معاملة جديدة'}</DialogTitle>
            <DialogDescription>
              {selectedPayment ? 'قم بتعديل بيانات المعاملة' : 'أدخل بيانات المعاملة الجديدة'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Type Toggle */}
            <div className="grid gap-2">
              <Label>النوع</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={formData.type === 'income' ? 'default' : 'outline'}
                  className={formData.type === 'income' ? 'bg-emerald-600 hover:bg-emerald-700 flex-1' : 'flex-1'}
                  onClick={() => setFormData({ ...formData, type: 'income' })}
                >
                  <TrendingUp className="w-4 h-4 ml-2" />
                  دخل
                </Button>
                <Button
                  type="button"
                  variant={formData.type === 'expense' ? 'default' : 'outline'}
                  className={formData.type === 'expense' ? 'bg-red-600 hover:bg-red-700 flex-1' : 'flex-1'}
                  onClick={() => setFormData({ ...formData, type: 'expense' })}
                >
                  <TrendingDown className="w-4 h-4 ml-2" />
                  مصروف
                </Button>
              </div>
            </div>

            {/* Category + Amount */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>الفئة</Label>
                <Select
                  value={formData.category || 'أتعاب'}
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>المبلغ (د.ج) *</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  dir="ltr"
                  className="text-right"
                />
              </div>
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label>الوصف</Label>
              <Textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="وصف المعاملة"
                rows={2}
              />
            </div>

            {/* Date */}
            <div className="grid gap-2">
              <Label>التاريخ *</Label>
              <Input
                type="date"
                value={formData.date || ''}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            {/* Case Picker */}
            <div className="grid gap-2">
              <Label>القضية</Label>
              <Popover open={casePickerOpen} onOpenChange={setCasePickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-between font-normal">
                    {formData.caseNumber ? `${formData.caseNumber} - ${formData.caseSubject || ''}` : 'اختر القضية'}
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
                            <Check className={cn('w-4 h-4 ml-2', formData.caseId === c.id ? 'opacity-100' : 'opacity-0')} />
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

            {/* Client Picker */}
            <div className="grid gap-2">
              <Label>الموكل</Label>
              <Popover open={clientPickerOpen} onOpenChange={setClientPickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-between font-normal">
                    {formData.clientName || 'اختر الموكل'}
                    <ChevronDown className="w-4 h-4 mr-2 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start">
                  <Command>
                    <CommandInput placeholder="بحث عن موكل..." />
                    <CommandList>
                      <CommandEmpty>لا يوجد موكلون</CommandEmpty>
                      <CommandGroup>
                        {clients?.map((cl) => (
                          <CommandItem
                            key={cl.id}
                            onSelect={() => {
                              setFormData({
                                ...formData,
                                clientId: cl.id!,
                                clientName: cl.name,
                              });
                              setClientPickerOpen(false);
                            }}
                          >
                            <Check className={cn('w-4 h-4 ml-2', formData.clientId === cl.id ? 'opacity-100' : 'opacity-0')} />
                            {cl.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSave} className="bg-teal-700 hover:bg-teal-800">
              {selectedPayment ? 'تحديث' : 'إضافة'}
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
              هل أنت متأكد من حذف هذه المعاملة؟ لا يمكن التراجع عن هذا الإجراء.
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
