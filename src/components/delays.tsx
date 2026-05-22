'use client';

import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Delay } from '@/lib/db';
import { formatDate } from '@/lib/constants';
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
  Clock,
  Pencil,
  Trash2,
  AlertCircle,
} from 'lucide-react';

export function DelaysManager() {
  const { setSelectedCaseId, setActiveSection } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [editingDelay, setEditingDelay] = useState<Delay | null>(null);
  const [formData, setFormData] = useState<Partial<Delay>>({});
  const [filterUpcoming, setFilterUpcoming] = useState(false);

  const delays = useLiveQuery(() => db.delays.toArray());
  const cases = useLiveQuery(() => db.cases.toArray());

  const now = new Date();

  const filteredDelays = useMemo(() => {
    if (!delays) return [];
    let filtered = [...delays];
    if (filterUpcoming) {
      filtered = filtered.filter((d) => d.delayDate && new Date(d.delayDate) >= now);
    }
    return filtered.sort((a, b) => (a.delayDate || '').localeCompare(b.delayDate || ''));
  }, [delays, filterUpcoming]);

  function resetForm() {
    setFormData({});
    setEditingDelay(null);
  }

  function openAddForm() {
    resetForm();
    setShowForm(true);
  }

  function openEditForm(delay: Delay) {
    setEditingDelay(delay);
    setFormData({ ...delay });
    setShowForm(true);
  }

  async function saveDelay() {
    const nowDate = new Date();

    if (editingDelay?.id) {
      await db.delays.update(editingDelay.id, {
        ...formData,
        updatedAt: nowDate,
      });
      toast.success('تم تحديث التأجيل بنجاح');
    } else {
      if (!formData.caseId) {
        toast.error('يرجى اختيار القضية');
        return;
      }
      await db.delays.add({
        ...formData,
        caseId: formData.caseId,
        createdAt: nowDate,
        updatedAt: nowDate,
      });
      toast.success('تم إضافة التأجيل بنجاح');
    }

    setShowForm(false);
    resetForm();
  }

  async function deleteDelay(id: number) {
    await db.delays.delete(id);
    toast.success('تم حذف التأجيل');
  }

  const isUpcoming = (date?: string) => date && new Date(date) >= now;

  return (
    <div className="space-y-4">
      {/* شريط الأدوات */}
      <div className="flex items-center gap-3">
        <Button
          variant={filterUpcoming ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterUpcoming(!filterUpcoming)}
        >
          <Clock className="w-4 h-4 ml-1" />
          القادمة فقط
        </Button>
        <div className="flex-1" />
        <Button onClick={openAddForm} className="bg-teal-600 hover:bg-teal-700 shrink-0">
          <Plus className="w-4 h-4 ml-1" />
          إضافة تأجيل
        </Button>
      </div>

      {/* قائمة التأجيلات */}
      <div className="space-y-2">
        {filteredDelays.length > 0 ? (
          filteredDelays.map((delay) => {
            const caseData = cases?.find((c) => c.id === delay.caseId);
            const upcoming = isUpcoming(delay.delayDate);

            return (
              <Card
                key={delay.id}
                className={`cursor-pointer hover:shadow-md transition-shadow ${upcoming ? 'border-amber-300 dark:border-amber-700' : ''}`}
                onClick={() => {
                  if (delay.caseId) {
                    setSelectedCaseId(delay.caseId);
                    setActiveSection('cases');
                  }
                }}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {upcoming && (
                          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                        )}
                        <span className="text-sm font-medium">{caseData?.caseNumber || '—'}</span>
                        <Badge variant="outline" className="text-xs">{caseData?.subject?.substring(0, 40) || ''}</Badge>
                      </div>
                      <div className="mt-1">
                        <p className="text-sm">{delay.reason || '—'}</p>
                        {delay.notes && <p className="text-xs text-muted-foreground">{delay.notes}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mr-2">
                      <Badge variant={upcoming ? 'default' : 'secondary'} className={`text-xs ${upcoming ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' : ''}`}>
                        {formatDate(delay.delayDate)}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openEditForm(delay); }}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); if (delay.id) deleteDelay(delay.id); }}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Clock className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">لا توجد تأجيلات</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* نافذة إضافة/تعديل */}
      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingDelay ? 'تعديل التأجيل' : 'إضافة تأجيل جديد'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label className="text-xs">القضية</Label>
              <Select
                value={formData.caseId?.toString() || ''}
                onValueChange={(v) => setFormData({ ...formData, caseId: Number(v) })}
              >
                <SelectTrigger><SelectValue placeholder="اختر القضية" /></SelectTrigger>
                <SelectContent>
                  {cases?.map((c) => (
                    <SelectItem key={c.id} value={c.id!.toString()}>
                      {c.caseNumber || '—'} - {c.subject?.substring(0, 30)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">تاريخ التأجيل</Label>
              <Input
                type="date"
                value={formData.delayDate || ''}
                onChange={(e) => setFormData({ ...formData, delayDate: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">سبب التأجيل</Label>
              <Input
                value={formData.reason || ''}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="سبب التأجيل"
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
            <Button onClick={saveDelay} className="bg-teal-600 hover:bg-teal-700">حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
