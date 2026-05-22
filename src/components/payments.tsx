'use client';

import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, formatCurrency, type Payment } from '@/lib/db';
import { PAYMENT_CATEGORIES, formatDate } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Pencil,
  Trash2,
} from 'lucide-react';

export function PaymentsManager() {
  const [showForm, setShowForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [formData, setFormData] = useState<Partial<Payment>>({});
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const payments = useLiveQuery(() => db.payments.toArray());
  const cases = useLiveQuery(() => db.cases.toArray());

  const filteredPayments = useMemo(() => {
    if (!payments) return [];
    let filtered = [...payments];
    if (filterType !== 'all') {
      filtered = filtered.filter((p) => p.type === filterType);
    }
    if (filterDateFrom) {
      filtered = filtered.filter((p) => p.date && p.date >= filterDateFrom);
    }
    if (filterDateTo) {
      filtered = filtered.filter((p) => p.date && p.date <= filterDateTo);
    }
    return filtered.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [payments, filterType, filterDateFrom, filterDateTo]);

  const totalIncome = filteredPayments
    .filter((p) => p.type === 'income')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const totalExpense = filteredPayments
    .filter((p) => p.type === 'expense')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const netAmount = totalIncome - totalExpense;

  function resetForm() {
    setFormData({});
    setEditingPayment(null);
  }

  function openAddForm(type?: string) {
    resetForm();
    if (type) setFormData({ type });
    setShowForm(true);
  }

  function openEditForm(payment: Payment) {
    setEditingPayment(payment);
    setFormData({ ...payment });
    setShowForm(true);
  }

  async function savePayment() {
    const now = new Date();

    if (editingPayment?.id) {
      await db.payments.update(editingPayment.id, {
        ...formData,
        updatedAt: now,
      });
      toast.success('تم تحديث الدفعة بنجاح');
    } else {
      await db.payments.add({
        ...formData,
        createdAt: now,
        updatedAt: now,
      });
      toast.success('تم إضافة الدفعة بنجاح');
    }

    setShowForm(false);
    resetForm();
  }

  async function deletePayment(id: number) {
    await db.payments.delete(id);
    toast.success('تم حذف الدفعة');
  }

  return (
    <div className="space-y-4">
      {/* بطاقات الملخص */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">الإيرادات</p>
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(totalIncome)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">المصروفات</p>
                <p className="text-sm font-bold text-red-700 dark:text-red-400">{formatCurrency(totalExpense)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">الصافي</p>
                <p className={`text-sm font-bold ${netAmount >= 0 ? 'text-teal-700 dark:text-teal-400' : 'text-red-700 dark:text-red-400'}`}>{formatCurrency(netAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* أزرار وفلاتر */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={() => openAddForm('income')} className="bg-emerald-600 hover:bg-emerald-700 shrink-0">
          <Plus className="w-4 h-4 ml-1" />
          إيراد
        </Button>
        <Button variant="outline" onClick={() => openAddForm('expense')} className="shrink-0 border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20">
          <Plus className="w-4 h-4 ml-1" />
          مصروف
        </Button>
        <div className="flex-1" />
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="النوع" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="income">إيرادات</SelectItem>
            <SelectItem value="expense">مصروفات</SelectItem>
          </SelectContent>
        </Select>
        <Input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="w-40" />
        <Input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="w-40" />
      </div>

      {/* قائمة المدفوعات */}
      <div className="space-y-2">
        {filteredPayments.length > 0 ? (
          filteredPayments.map((payment) => (
            <Card key={payment.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={payment.type === 'income' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}>
                        {payment.type === 'income' ? 'إيراد' : 'مصروف'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">{payment.category || '—'}</Badge>
                      {payment.caseNumber && <span className="text-xs text-muted-foreground">قضية: {payment.caseNumber}</span>}
                    </div>
                    {payment.notes && <p className="text-xs text-muted-foreground mt-1">{payment.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2 mr-2">
                    <span className={`text-sm font-bold ${payment.type === 'income' ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                      {payment.type === 'income' ? '+' : '-'}{formatCurrency(payment.amount)}
                    </span>
                    <Badge variant="outline" className="text-xs">{formatDate(payment.date)}</Badge>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditForm(payment)}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => payment.id && deletePayment(payment.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <DollarSign className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">لا توجد مدفوعات مسجلة</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* نافذة إضافة/تعديل */}
      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingPayment ? 'تعديل الدفعة' : 'إضافة دفعة جديدة'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">النوع</Label>
                <Select value={formData.type || ''} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger><SelectValue placeholder="اختر النوع" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">إيراد</SelectItem>
                    <SelectItem value="expense">مصروف</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">الفئة</Label>
                <Select value={formData.category || ''} onValueChange={(v) => setFormData({ ...formData, category: v === '_empty' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="اختر الفئة" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_empty">—</SelectItem>
                    {PAYMENT_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">المبلغ (د.ج)</Label>
              <Input
                type="number"
                value={formData.amount ?? ''}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="0"
              />
            </div>
            <div>
              <Label className="text-xs">رقم القضية</Label>
              <Input
                value={formData.caseNumber || ''}
                onChange={(e) => setFormData({ ...formData, caseNumber: e.target.value })}
                placeholder="رقم القضية (اختياري)"
              />
            </div>
            <div>
              <Label className="text-xs">التاريخ</Label>
              <Input
                type="date"
                value={formData.date || ''}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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
            <Button onClick={savePayment} className="bg-teal-600 hover:bg-teal-700">حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
