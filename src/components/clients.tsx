'use client';

import React, { useState, useMemo } from 'react';
import { useClients, useCases, createClient, updateClient, deleteClient } from '@/lib/api';
import { WILAYAS, formatDate, STATUS_COLORS } from '@/lib/constants';
import { DuplicateAlert, findDuplicateClients } from '@/components/ui/duplicate-alert';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  MapPin,
  ChevronLeft,
  Briefcase,
  User,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';

interface Client {
  id?: number;
  name?: string;
  phone?: string;
  phone2?: string;
  address?: string;
  wilaya?: number | null;
  nationalId?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

function ClientsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <Skeleton className="h-11 flex-1 rounded-lg" />
        <Skeleton className="h-11 w-32 rounded-lg" />
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

export function Clients() {
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { setActiveSection, setSelectedCaseId, selectedClientId, setSelectedClientId } = useAppStore();

  const [formData, setFormData] = useState<Partial<Client>>({});
  const [duplicateWarning, setDuplicateWarning] = useState<any[] | null>(null);
  const [forceSave, setForceSave] = useState(false);

  const { clients, isLoading: clientsLoading } = useClients();
  const { cases, isLoading: casesLoading } = useCases();

  const filteredClients = useMemo(() => {
    return clients.filter((c) =>
      !searchTerm ||
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone?.includes(searchTerm) ||
      c.nationalId?.includes(searchTerm)
    );
  }, [clients, searchTerm]);

  // عند اختيار موكل من البحث الشامل
  React.useEffect(() => {
    if (selectedClientId) {
      const client = clients.find(c => c.id === selectedClientId);
      if (client) {
        setViewingClient(client);
        setSelectedClientId(null);
      }
    }
  }, [selectedClientId, clients, setSelectedClientId]);

  // كشف التكرارات أثناء الكتابة — يجب أن يُستدعى قبل أي return
  const liveDuplicates = useMemo(() => {
    if (!formData.name?.trim() || editingClient?.id) return [];
    return findDuplicateClients(formData.name || '', formData.phone || '', clients, editingClient?.id);
  }, [formData.name, formData.phone, clients, editingClient]);

  // Loading state
  if (clientsLoading || casesLoading) {
    return <ClientsSkeleton />;
  }

  function resetForm() {
    setFormData({});
    setEditingClient(null);
    setDuplicateWarning(null);
    setForceSave(false);
  }

  function openAddForm() {
    resetForm();
    setShowForm(true);
  }

  function openEditForm(client: Client) {
    setEditingClient(client);
    setFormData({ ...client });
    setShowForm(true);
  }

  async function saveClient() {
    try {
      const now = new Date();

      // كشف التكرارات قبل الحفظ (فقط عند الإضافة)
      if (!editingClient?.id && !forceSave) {
        const dupes = findDuplicateClients(formData.name || '', formData.phone || '', clients);
        if (dupes.length > 0) {
          setDuplicateWarning(dupes);
          return;
        }
      }

      if (editingClient?.id) {
        await updateClient(editingClient.id, { ...formData, updatedAt: now });
        toast.success('تم تحديث الموكل بنجاح');
      } else {
        await createClient({ ...formData, createdAt: now, updatedAt: now });
        toast.success('تم إضافة الموكل بنجاح');
      }
      setForceSave(false);
      setDuplicateWarning(null);
      setShowForm(false);
      resetForm();
    } catch (error: any) {
      // التعامل مع خطأ 409 من الخادم (تكرار)
      if (error?.message?.includes('موكل بنفس')) {
        toast.error('موكل بنفس الاسم أو الهاتف موجود بالفعل!');
        return;
      }
      console.error('Save client error:', error);
      toast.error('فشل في حفظ الموكل');
    }
  }

  async function handleDeleteClient(id: number) {
    try {
      await deleteClient(id);
      setDeleteConfirm(null);
      if (viewingClient?.id === id) setViewingClient(null);
      toast.success('تم حذف الموكل');
    } catch (error) {
      console.error('Delete client error:', error);
      toast.error('فشل في حذف الموكل');
    }
  }

  // عرض تفاصيل الموكل
  if (viewingClient) {
    const clientCases = cases.filter((c) => c.clientId === viewingClient.id);

    const wilayaName = WILAYAS.find((w) => w.code === viewingClient.wilaya)?.name;

    return (
      <>
      {/* نافذة إضافة/تعديل — موجودة دائماً */}
      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold">{editingClient ? 'تعديل الموكل' : 'إضافة موكل جديد'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {/* تنبيه التكرارات */}
            {(duplicateWarning && duplicateWarning.length > 0) ? (
              <DuplicateAlert
                duplicates={duplicateWarning}
                entityType="موكل"
                onForceProceed={() => { setForceSave(true); saveClient(); }}
                onDismiss={() => setDuplicateWarning(null)}
              />
            ) : liveDuplicates.length > 0 && !editingClient?.id ? (
              <DuplicateAlert
                duplicates={liveDuplicates}
                entityType="موكل"
                onForceProceed={() => { setForceSave(true); saveClient(); }}
                onDismiss={() => setDuplicateWarning(null)}
                extraInfo="يوجد موكل بنفس البيانات، قد يكون تكراراً:"
              />
            ) : null}
            <div>
              <Label className="text-xs">الاسم واللقب</Label>
              <Input
                value={formData.name || ''}
                onChange={(e) => { setFormData({ ...formData, name: e.target.value }); setDuplicateWarning(null); setForceSave(false); }}
                placeholder="الاسم واللقب"
                className={`h-11 ${liveDuplicates.length > 0 && !editingClient?.id ? 'border-amber-400 focus-visible:ring-amber-400' : ''}`}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">الهاتف</Label>
                <Input
                  value={formData.phone || ''}
                  onChange={(e) => { setFormData({ ...formData, phone: e.target.value }); setDuplicateWarning(null); setForceSave(false); }}
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
              <Label className="text-xs">الولاية</Label>
              <Select value={formData.wilaya ? String(formData.wilaya) : '0'} onValueChange={(v) => setFormData({ ...formData, wilaya: v === '0' ? null : Number(v) })}>
                <SelectTrigger className="h-11"><SelectValue placeholder="اختر الولاية" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">—</SelectItem>
                  {WILAYAS.map((w) => (
                    <SelectItem key={w.code} value={w.code.toString()}>{(w.code).toLocaleString('en-US')} - {w.name}</SelectItem>
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
              <Label className="text-xs">رقم الهوية</Label>
              <Input
                value={formData.nationalId || ''}
                onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                placeholder="رقم بطاقة الهوية"
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
            <Button onClick={saveClient} className="bg-teal-600 hover:bg-teal-700">حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setViewingClient(null)} className="touch-target">
            <ChevronLeft className="w-4 h-4 ml-1" />
            العودة
          </Button>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-teal-700 dark:text-teal-400" />
                </div>
                <h2 className="text-lg font-extrabold">{viewingClient.name || '—'}</h2>
              </div>
              <Button variant="outline" size="sm" onClick={() => openEditForm(viewingClient)} className="touch-target">
                <Pencil className="w-3 h-3 ml-1" />
                تعديل
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              {viewingClient.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="tabular-nums">{viewingClient.phone}</span>
                </div>
              )}
              {viewingClient.phone2 && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="tabular-nums">{viewingClient.phone2}</span>
                </div>
              )}
              {wilayaName && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span>{wilayaName}</span>
                </div>
              )}
              {viewingClient.address && (
                <div className="col-span-2 text-muted-foreground">{viewingClient.address}</div>
              )}
              {viewingClient.nationalId && (
                <div>
                  <span className="text-xs text-muted-foreground">رقم الهوية: </span>
                  <span className="tabular-nums">{viewingClient.nationalId}</span>
                </div>
              )}
            </div>

            {viewingClient.notes && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">ملاحظات</p>
                <p className="text-sm leading-relaxed">{viewingClient.notes}</p>
              </div>
            )}

            {/* قضايا الموكل */}
            {clientCases && clientCases.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground flex items-center gap-1 font-semibold">
                  <Briefcase className="w-3 h-3" />
                  قضايا الموكل ({(clientCases.length).toLocaleString('en-US')})
                </p>
                {clientCases.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      if (c.id) {
                        setSelectedCaseId(c.id);
                        setActiveSection('cases');
                      }
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold truncate">{c.caseNumber || '—'}</span>
                        <Badge variant="secondary" className={`${STATUS_COLORS[c.status || ''] || ''} text-xs`}>
                          {c.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{c.subject || '—'}</p>
                    </div>
                    <div className="text-left mr-3 shrink-0">
                      <p className="text-xs text-muted-foreground">{c.courtName || ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button
              variant="destructive"
              size="sm"
              onClick={() => viewingClient.id && setDeleteConfirm(viewingClient.id)}
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
              <AlertDialogDescription>هل أنت متأكد من حذف هذا الموكل؟</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteConfirm && handleDeleteClient(deleteConfirm)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      </>
    );
  }

  return (
    <div className="space-y-4">
      {/* شريط البحث */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم، الهاتف، رقم الهوية..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-9 h-11"
          />
        </div>
        <Button onClick={openAddForm} className="bg-teal-600 hover:bg-teal-700 shrink-0 h-11 touch-target">
          <Plus className="w-4 h-4 ml-1" />
          إضافة موكل
        </Button>
      </div>

      {/* قائمة الموكلين */}
      <div className="space-y-2">
        {filteredClients.length > 0 ? (
          filteredClients.map((client) => {
            const wilayaName = WILAYAS.find((w) => w.code === client.wilaya)?.name;
            const clientCasesCount = cases.filter((c) => c.clientId === client.id).length;
            return (
              <Card
                key={client.id}
                className="cursor-pointer hover:shadow-md transition-all duration-200 border-r-4 border-r-teal-500"
                onClick={() => setViewingClient(client)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm truncate">{client.name || '—'}</p>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                            {client.phone && <span className="tabular-nums">{client.phone}</span>}
                            {wilayaName && <span>• {wilayaName}</span>}
                            {clientCasesCount > 0 && <span className="text-teal-600 dark:text-teal-400 font-semibold">• {clientCasesCount.toLocaleString('en-US')} قضية</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 touch-target"
                        onClick={(e) => { e.stopPropagation(); openEditForm(client); }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 touch-target text-destructive hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); if (client.id) setDeleteConfirm(client.id); }}
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
              <p className="text-muted-foreground">لا يوجد موكلون</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* نافذة إضافة/تعديل */}
      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold">{editingClient ? 'تعديل الموكل' : 'إضافة موكل جديد'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {/* تنبيه التكرارات */}
            {(duplicateWarning && duplicateWarning.length > 0) ? (
              <DuplicateAlert
                duplicates={duplicateWarning}
                entityType="موكل"
                onForceProceed={() => { setForceSave(true); saveClient(); }}
                onDismiss={() => setDuplicateWarning(null)}
              />
            ) : liveDuplicates.length > 0 && !editingClient?.id ? (
              <DuplicateAlert
                duplicates={liveDuplicates}
                entityType="موكل"
                onForceProceed={() => { setForceSave(true); saveClient(); }}
                onDismiss={() => setDuplicateWarning(null)}
                extraInfo="يوجد موكل بنفس البيانات، قد يكون تكراراً:"
              />
            ) : null}
            <div>
              <Label className="text-xs">الاسم واللقب</Label>
              <Input
                value={formData.name || ''}
                onChange={(e) => { setFormData({ ...formData, name: e.target.value }); setDuplicateWarning(null); setForceSave(false); }}
                placeholder="الاسم واللقب"
                className={`h-11 ${liveDuplicates.length > 0 && !editingClient?.id ? 'border-amber-400 focus-visible:ring-amber-400' : ''}`}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">الهاتف</Label>
                <Input
                  value={formData.phone || ''}
                  onChange={(e) => { setFormData({ ...formData, phone: e.target.value }); setDuplicateWarning(null); setForceSave(false); }}
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
              <Label className="text-xs">الولاية</Label>
              <Select value={formData.wilaya ? String(formData.wilaya) : '0'} onValueChange={(v) => setFormData({ ...formData, wilaya: v === '0' ? null : Number(v) })}>
                <SelectTrigger className="h-11"><SelectValue placeholder="اختر الولاية" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">—</SelectItem>
                  {WILAYAS.map((w) => (
                    <SelectItem key={w.code} value={w.code.toString()}>{(w.code).toLocaleString('en-US')} - {w.name}</SelectItem>
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
              <Label className="text-xs">رقم الهوية</Label>
              <Input
                value={formData.nationalId || ''}
                onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                placeholder="رقم بطاقة الهوية"
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
            <Button onClick={saveClient} className="bg-teal-600 hover:bg-teal-700">حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* تأكيد الحذف */}
      <AlertDialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد من حذف هذا الموكل؟</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirm && handleDeleteClient(deleteConfirm)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
