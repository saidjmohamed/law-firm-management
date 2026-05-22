'use client';

import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Transaction } from '@/lib/db';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const typeLabels: Record<string, string> = {
  income: 'إيراد',
  expense: 'مصروف',
};

const categories = ['أتعاب', 'استشارات', 'مصاريف قضية', 'رواتب', 'إيجار', 'أخرى'];

export function Finance() {
  const transactions = useLiveQuery(() => db.transactions.orderBy('date').reverse().toArray());
  const cases = useLiveQuery(() => db.cases.toArray());
  const clients = useLiveQuery(() => db.clients.toArray());

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [casePickerOpen, setCasePickerOpen] = useState(false);
  const [clientPickerOpen, setClientPickerOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Transaction>>({
    type: 'income',
    category: 'أتعاب',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
    caseId: undefined,
    caseTitle: '',
    clientId: undefined,
    clientName: '',
  });

  const totalIncome = transactions?.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) ?? 0;
  const totalExpenses = transactions?.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) ?? 0;
  const netBalance = totalIncome - totalExpenses;

  const filteredTransactions = transactions?.filter((t) => {
    const matchSearch =
      !search ||
      t.description.includes(search) ||
      (t.caseTitle && t.caseTitle.includes(search)) ||
      (t.clientName && t.clientName.includes(search));
    const matchType = filterType === 'all' || t.type === filterType;
    const matchCategory = filterCategory === 'all' || t.category === filterCategory;
    return matchSearch && matchType && matchCategory;
  });

  // Monthly chart data
  const monthlyData = React.useMemo(() => {
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const data: { month: string; income: number; expenses: number }[] = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - 5 + i);
      const m = d.getMonth();
      const y = d.getFullYear();
      const income = transactions?.filter((t) => {
        const td = new Date(t.date);
        return t.type === 'income' && td.getMonth() === m && td.getFullYear() === y;
      }).reduce((s, t) => s + t.amount, 0) ?? 0;
      const expenses = transactions?.filter((t) => {
        const td = new Date(t.date);
        return t.type === 'expense' && td.getMonth() === m && td.getFullYear() === y;
      }).reduce((s, t) => s + t.amount, 0) ?? 0;
      data.push({ month: months[m], income, expenses });
    }
    return data;
  }, [transactions]);

  const openAdd = () => {
    setFormData({
      type: 'income',
      category: 'أتعاب',
      amount: 0,
      description: '',
      date: new Date().toISOString().split('T')[0],
      caseId: undefined,
      caseTitle: '',
      clientId: undefined,
      clientName: '',
    });
    setSelectedTransaction(null);
    setDialogOpen(true);
  };

  const openEdit = (t: Transaction) => {
    setFormData({
      ...t,
      date: t.date ? new Date(t.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    });
    setSelectedTransaction(t);
    setDialogOpen(true);
  };

  const openDelete = (t: Transaction) => {
    setSelectedTransaction(t);
    setDeleteOpen(true);
  };

  const handleSave = async () => {
    if (!formData.amount || formData.amount <= 0) {
      toast.error('يرجى إدخال المبلغ');
      return;
    }
    if (!formData.description?.trim()) {
      toast.error('يرجى إدخال الوصف');
      return;
    }
    try {
      if (selectedTransaction?.id) {
        await db.transactions.update(selectedTransaction.id, {
          ...formData,
          description: formData.description!.trim(),
          date: new Date(formData.date!),
        } as Transaction);
        toast.success('تم تحديث المعاملة بنجاح');
      } else {
        await db.transactions.add({
          type: (formData.type as 'income' | 'expense') || 'income',
          category: formData.category || 'أخرى',
          amount: formData.amount!,
          description: formData.description!.trim(),
          date: new Date(formData.date!),
          caseId: formData.caseId || undefined,
          caseTitle: formData.caseTitle || undefined,
          clientId: formData.clientId || undefined,
          clientName: formData.clientName || undefined,
          createdAt: new Date(),
        });
        toast.success('تم إضافة المعاملة بنجاح');
      }
      setDialogOpen(false);
    } catch {
      toast.error('حدث خطأ أثناء الحفظ');
    }
  };

  const handleDelete = async () => {
    if (selectedTransaction?.id) {
      try {
        await db.transactions.delete(selectedTransaction.id);
        toast.success('تم حذف المعاملة بنجاح');
      } catch {
        toast.error('حدث خطأ أثناء الحذف');
      }
      setDeleteOpen(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('ar-SA') + ' ر.س';
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">إجمالي الإيرادات</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalIncome)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">إجمالي المصروفات</p>
              <p className="text-lg font-bold text-red-600 dark:text-red-400">{formatCurrency(totalExpenses)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${netBalance >= 0 ? 'bg-teal-50 dark:bg-teal-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
              <Wallet className={`w-6 h-6 ${netBalance >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-red-600 dark:text-red-400'}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">صافي الرصيد</p>
              <p className={`text-lg font-bold ${netBalance >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatCurrency(netBalance)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">الإيرادات مقابل المصروفات</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value: number) => value.toLocaleString('ar-SA') + ' ر.س'}
                contentStyle={{ direction: 'rtl', textAlign: 'right' }}
              />
              <Bar dataKey="income" name="الإيرادات" fill="#059669" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="المصروفات" fill="#dc2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالوصف أو القضية أو العميل..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="النوع" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="income">إيراد</SelectItem>
            <SelectItem value="expense">مصروف</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
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

      {/* Table */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-right">النوع</TableHead>
                <TableHead className="text-right">الفئة</TableHead>
                <TableHead className="text-right">الوصف</TableHead>
                <TableHead className="text-right hidden md:table-cell">القضية</TableHead>
                <TableHead className="text-right">المبلغ</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions && filteredTransactions.length > 0 ? (
                filteredTransactions.map((t) => (
                  <TableRow key={t.id} className="hover:bg-muted/50">
                    <TableCell className="text-sm">{formatDate(t.date)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${t.type === 'income'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        {t.type === 'income' ? <TrendingUp className="w-3 h-3 ml-1" /> : <TrendingDown className="w-3 h-3 ml-1" />}
                        {typeLabels[t.type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{t.category}</TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">{t.description}</TableCell>
                    <TableCell className="text-sm hidden md:table-cell">{t.caseTitle || '—'}</TableCell>
                    <TableCell className={`font-bold text-sm ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString('ar-SA')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => openDelete(t)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {search ? 'لا توجد نتائج للبحث' : 'لا توجد معاملات بعد'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{selectedTransaction ? 'تعديل المعاملة' : 'إضافة معاملة جديدة'}</DialogTitle>
            <DialogDescription>
              {selectedTransaction ? 'قم بتعديل بيانات المعاملة' : 'أدخل بيانات المعاملة الجديدة'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>النوع</Label>
                <Select
                  value={formData.type || 'income'}
                  onValueChange={(v) => setFormData({ ...formData, type: v as 'income' | 'expense' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">إيراد</SelectItem>
                    <SelectItem value="expense">مصروف</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
            </div>
            <div className="grid gap-2">
              <Label>المبلغ *</Label>
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
            <div className="grid gap-2">
              <Label>الوصف *</Label>
              <Textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="وصف المعاملة"
                rows={2}
              />
            </div>
            <div className="grid gap-2">
              <Label>التاريخ</Label>
              <Input
                type="date"
                value={formData.date ? (typeof formData.date === 'string' ? formData.date : new Date(formData.date).toISOString().split('T')[0]) : ''}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>القضية</Label>
                <Popover open={casePickerOpen} onOpenChange={setCasePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-between font-normal text-sm">
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
                                setFormData({ ...formData, caseId: c.id, caseTitle: c.title });
                                setCasePickerOpen(false);
                              }}
                            >
                              <Check className={cn('w-4 h-4 ml-2', formData.caseId === c.id ? 'opacity-100' : 'opacity-0')} />
                              {c.title}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label>العميل</Label>
                <Popover open={clientPickerOpen} onOpenChange={setClientPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-between font-normal text-sm">
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
                          {clients?.map((cl) => (
                            <CommandItem
                              key={cl.id}
                              onSelect={() => {
                                setFormData({ ...formData, clientId: cl.id, clientName: cl.name });
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
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSave} className="bg-teal-700 hover:bg-teal-800">
              {selectedTransaction ? 'تحديث' : 'إضافة'}
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
