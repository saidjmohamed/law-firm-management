'use client';

import React, { useState, useMemo } from 'react';
import { useLawyers, useParties, createLawyer, updateLawyer, deleteLawyer } from '@/lib/api';
import { WILAYAS } from '@/lib/constants';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Phone,
  Mail,
  MapPin,
  ChevronLeft,
  Scale,
  UserCircle,
  Briefcase,
  Hash,
} from 'lucide-react';

interface Lawyer {
  id?: number;
  name?: string;
  phone?: string;
  phone2?: string;
  email?: string;
  address?: string;
  wilaya?: number;
  barNumber?: string;
  specialty?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
  _count?: { parties: number };
}

function LawyersSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <Skeleton className="h-11 flex-1 rounded-lg" />
        <Skeleton className="h-11 w-40 rounded-lg" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-36" />
                  <div className="flex gap-3">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <div className="flex gap-1">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function Lawyers() {
  const [showForm, setShowForm] = useState(false);
  const [editingLawyer, setEditingLawyer] = useState<Lawyer | null>(null);
  const [viewingLawyer, setViewingLawyer] = useState<Lawyer | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<Partial<Lawyer>>({});

  const { lawyers, isLoading } = useLawyers();
  const { parties } = useParties();

  const filteredLawyers = useMemo(() => {
    return lawyers.filter((l: Lawyer) =>
      !searchTerm ||
      l.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.phone?.includes(searchTerm) ||
      l.barNumber?.includes(searchTerm) ||
      l.specialty?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [lawyers, searchTerm]);

  if (isLoading) {
    return <LawyersSkeleton />;
  }

  function resetForm() {
    setFormData({});
    setEditingLawyer(null);
  }

  function openAddForm() {
    resetForm();
    setShowForm(true);
  }

  function openEditForm(lawyer: Lawyer) {
    setEditingLawyer(lawyer);
    setFormData({ ...lawyer });
    setShowForm(true);
  }

  async function saveLawyer() {
    const now = new Date();

    if (editingLawyer?.id) {
      await updateLawyer(editingLawyer.id, {
        ...formData,
        updatedAt: now,
      });
      toast.success('تم تحديث المحامي بنجاح');
    } else {
      await createLawyer({
        ...formData,
        createdAt: now,
        updatedAt: now,
      });
      toast.success('تم إضافة المحامي بنجاح');
    }

    setShowForm(false);
    resetForm();
  }

  async function handleDeleteLawyer(id: number) {
    await deleteLawyer(id);
    setDeleteConfirm(null);
    if (viewingLawyer?.id === id) setViewingLawyer(null);
    toast.success('تم حذف المحامي');
  }

  // عرض تفاصيل المحامي
  if (viewingLawyer) {
    const lawyerParties = parties.filter((p: any) => p.lawyerId === viewingLawyer.id);
    const wilayaName = WILAYAS.find((w) => w.code === viewingLawyer.wilaya)?.name;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setViewingLawyer(null)} className="touch-target">
            <ChevronLeft className="w-4 h-4 ml-1" />
            العودة
          </Button>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                  <Scale className="w-5 h-5 text-indigo-700 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold">{viewingLawyer.name || '—'}</h2>
                  {viewingLawyer.specialty && (
                    <Badge variant="secondary" className="text-xs mt-0.5">{viewingLawyer.specialty}</Badge>
                  )}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => openEditForm(viewingLawyer)} className="touch-target">
                <Pencil className="w-3 h-3 ml-1" />
                تعديل
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              {viewingLawyer.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="tabular-nums">{viewingLawyer.phone}</span>
                </div>
              )}
              {viewingLawyer.phone2 && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="tabular-nums">{viewingLawyer.phone2}</span>
                </div>
              )}
              {viewingLawyer.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{viewingLawyer.email}</span>
                </div>
              )}
              {wilayaName && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span>{wilayaName}</span>
                </div>
              )}
              {viewingLawyer.barNumber && (
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span>رقم القيد: {viewingLawyer.barNumber}</span>
                </div>
              )}
              {viewingLawyer.address && (
                <div className="col-span-2 text-muted-foreground">{viewingLawyer.address}</div>
              )}
            </div>

            {viewingLawyer.notes && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">ملاحظات</p>
                <p className="text-sm leading-relaxed">{viewingLawyer.notes}</p>
              </div>
            )}

            {/* القضايا المرتبطة */}
            {lawyerParties && lawyerParties.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground flex items-center gap-1 font-semibold">
                  <Briefcase className="w-3 h-3" />
                  القضايا المرتبطة ({lawyerParties.length.toLocaleString('en-US')})
                </p>
                {lawyerParties.map((p: any) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{p.name || '—'}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.role === 'plaintiff' ? 'مدعي' : p.role === 'defendant' ? 'مدعى عليه' : p.role}
                      </p>
                    </div>
                    {p.case && (
                      <Badge variant="outline" className="text-xs shrink-0 mr-2">
                        {p.case.caseNumber || '—'}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}

            <Button
              variant="destructive"
              size="sm"
              onClick={() => viewingLawyer.id && setDeleteConfirm(viewingLawyer.id)}
              className="touch-target"
            >
              <Trash2 className="w-3 h-3 ml-1" />
              حذف
            </Button>
          </CardContent>
        </Card>

        <AlertDialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
              <AlertDialogDescription>هل أنت متأكد من حذف هذا المحامي من دفتر المحامين؟</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteConfirm && handleDeleteLawyer(deleteConfirm)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* شريط البحث */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم، الهاتف، رقم القيد، التخصص..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-9 h-11"
          />
        </div>
        <Button onClick={openAddForm} className="bg-indigo-600 hover:bg-indigo-700 shrink-0 h-11 touch-target">
          <Plus className="w-4 h-4 ml-1" />
          إضافة محامي
        </Button>
      </div>

      {/* قائمة المحامين */}
      <div className="space-y-2">
        {filteredLawyers.length > 0 ? (
          filteredLawyers.map((lawyer: Lawyer) => {
            const wilayaName = WILAYAS.find((w) => w.code === lawyer.wilaya)?.name;
            const partiesCount = lawyer._count?.parties || 0;
            return (
              <Card
                key={lawyer.id}
                className="cursor-pointer hover:shadow-md transition-all duration-200 border-r-4 border-r-indigo-500"
                onClick={() => setViewingLawyer(lawyer)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                          <Scale className="w-4 h-4 text-indigo-700 dark:text-indigo-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-sm truncate">{lawyer.name || '—'}</p>
                            {lawyer.specialty && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">{lawyer.specialty}</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                            {lawyer.phone && <span className="tabular-nums">{lawyer.phone}</span>}
                            {wilayaName && <span>{wilayaName}</span>}
                            {lawyer.barNumber && <span>قيد: {lawyer.barNumber}</span>}
                            {partiesCount > 0 && (
                              <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                                {partiesCount.toLocaleString('en-US')} قضية
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 touch-target"
                        onClick={(e) => { e.stopPropagation(); openEditForm(lawyer); }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 touch-target text-destructive hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); if (lawyer.id) setDeleteConfirm(lawyer.id); }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
              <div className="flex flex-col items-center gap-2">
                <UserCircle className="w-10 h-10 text-muted-foreground/40" />
                <p className="text-muted-foreground">لا يوجد محامون في الدفتر</p>
                <p className="text-xs text-muted-foreground">اضغط على "إضافة محامي" لإضافة محامي جديد</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* نافذة إضافة/تعديل */}
      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold">
              {editingLawyer ? 'تعديل المحامي' : 'إضافة محامي جديد'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label className="text-xs">الاسم واللقب *</Label>
              <Input
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="الاسم واللقب"
                className="h-11"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">الهاتف</Label>
                <Input
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="رقم الهاتف"
                  className="h-11"
                />
              </div>
              <div>
                <Label className="text-xs">هاتف ثاني</Label>
                <Input
                  value={formData.phone2 || ''}
                  onChange={(e) => setFormData({ ...formData, phone2: e.target.value })}
                  placeholder="رقم هاتف ثاني"
                  className="h-11"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">البريد الإلكتروني</Label>
              <Input
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="البريد الإلكتروني"
                className="h-11"
                type="email"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">رقم القيد في النقابة</Label>
                <Input
                  value={formData.barNumber || ''}
                  onChange={(e) => setFormData({ ...formData, barNumber: e.target.value })}
                  placeholder="رقم القيد"
                  className="h-11"
                />
              </div>
              <div>
                <Label className="text-xs">التخصص</Label>
                <Select value={formData.specialty || ''} onValueChange={(v) => setFormData({ ...formData, specialty: v })}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="اختر التخصص" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="محام لدى المجلس">محام لدى المجلس</SelectItem>
                    <SelectItem value="محام معتمد">محام معتمد</SelectItem>
                    <SelectItem value="محام مسجل">محام مسجل</SelectItem>
                    <SelectItem value="محام متدرب">محام متدرب</SelectItem>
                    <SelectItem value="أخرى">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">الولاية</Label>
              <Select value={formData.wilaya?.toString() || ''} onValueChange={(v) => setFormData({ ...formData, wilaya: v ? Number(v) : undefined })}>
                <SelectTrigger className="h-11"><SelectValue placeholder="اختر الولاية" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">—</SelectItem>
                  {WILAYAS.map((w) => (
                    <SelectItem key={w.code} value={w.code.toString()}>{w.code.toLocaleString('en-US')} - {w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">العنوان</Label>
              <Input
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="العنوان"
                className="h-11"
              />
            </div>
            <div>
              <Label className="text-xs">ملاحظات</Label>
              <Textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="ملاحظات إضافية"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>إلغاء</Button>
            <Button onClick={saveLawyer} className="bg-indigo-600 hover:bg-indigo-700" disabled={!formData.name?.trim()}>
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* تأكيد الحذف */}
      <AlertDialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد من حذف هذا المحامي من دفتر المحامين؟</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirm && handleDeleteLawyer(deleteConfirm)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
