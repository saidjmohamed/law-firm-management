'use client';

import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Client } from '@/lib/db';
import { WILAYAS, formatDate, STATUS_COLORS } from '@/lib/constants';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';

export function Clients() {
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { setActiveSection, setSelectedCaseId } = useAppStore();

  const [formData, setFormData] = useState<Partial<Client>>({});

  const clients = useLiveQuery(() => db.clients.toArray());
  const cases = useLiveQuery(() => db.cases.toArray());

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    return clients.filter((c) =>
      !searchTerm ||
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone?.includes(searchTerm) ||
      c.nationalId?.includes(searchTerm)
    );
  }, [clients, searchTerm]);

  function resetForm() {
    setFormData({});
    setEditingClient(null);
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
    const now = new Date();

    if (editingClient?.id) {
      await db.clients.update(editingClient.id, {
        ...formData,
        updatedAt: now,
      });
      toast.success('تم تحديث الموكل بنجاح');
    } else {
      await db.clients.add({
        ...formData,
        createdAt: now,
        updatedAt: now,
      });
      toast.success('تم إضافة الموكل بنجاح');
    }

    setShowForm(false);
    resetForm();
  }

  async function deleteClient(id: number) {
    await db.clients.delete(id);
    setDeleteConfirm(null);
    if (viewingClient?.id === id) setViewingClient(null);
    toast.success('تم حذف الموكل');
  }

  // عرض تفاصيل الموكل
  if (viewingClient) {
    const clientCases = cases?.filter((c) => c.clientId === viewingClient.id);

    const wilayaName = WILAYAS.find((w) => w.code === viewingClient.wilaya)?.name;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setViewingClient(null)}>
            <ChevronLeft className="w-4 h-4 ml-1" />
            العودة
          </Button>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{viewingClient.name || '—'}</h2>
              <Button variant="outline" size="sm" onClick={() => openEditForm(viewingClient)}>
                <Pencil className="w-3 h-3 ml-1" />
                تعديل
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              {viewingClient.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{viewingClient.phone}</span>
                </div>
              )}
              {viewingClient.phone2 && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{viewingClient.phone2}</span>
                </div>
              )}
              {wilayaName && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{wilayaName}</span>
                </div>
              )}
              {viewingClient.address && (
                <div className="col-span-2 text-muted-foreground">{viewingClient.address}</div>
              )}
              {viewingClient.nationalId && (
                <div>
                  <span className="text-xs text-muted-foreground">رقم الهوية: </span>
                  <span>{viewingClient.nationalId}</span>
                </div>
              )}
            </div>

            {viewingClient.notes && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">ملاحظات</p>
                <p className="text-sm">{viewingClient.notes}</p>
              </div>
            )}

            {/* قضايا الموكل */}
            {clientCases && clientCases.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
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
                        <span className="text-sm font-medium truncate">{c.caseNumber || '—'}</span>
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
              <AlertDialogAction onClick={() => deleteConfirm && deleteClient(deleteConfirm)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
            placeholder="بحث بالاسم، الهاتف، رقم الهوية..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-9"
          />
        </div>
        <Button onClick={openAddForm} className="bg-teal-600 hover:bg-teal-700 shrink-0">
          <Plus className="w-4 h-4 ml-1" />
          إضافة موكل
        </Button>
      </div>

      {/* قائمة الموكلين */}
      <div className="space-y-2">
        {filteredClients.length > 0 ? (
          filteredClients.map((client) => {
            const wilayaName = WILAYAS.find((w) => w.code === client.wilaya)?.name;
            const clientCasesCount = cases?.filter((c) => c.clientId === client.id).length ?? 0;
            return (
              <Card
                key={client.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setViewingClient(client)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{client.name || '—'}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {client.phone && <span>{client.phone}</span>}
                        {wilayaName && <span>• {wilayaName}</span>}
                        {clientCasesCount > 0 && <span>• {clientCasesCount.toLocaleString('en-US')} قضية</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => { e.stopPropagation(); openEditForm(client); }}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={(e) => { e.stopPropagation(); if (client.id) setDeleteConfirm(client.id); }}
                      >
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
              <p className="text-muted-foreground">لا يوجد موكلون</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* نافذة إضافة/تعديل */}
      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingClient ? 'تعديل الموكل' : 'إضافة موكل جديد'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label className="text-xs">الاسم واللقب</Label>
              <Input
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="الاسم واللقب"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">الهاتف</Label>
                <Input
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="رقم الهاتف"
                />
              </div>
              <div>
                <Label className="text-xs">هاتف ثاني</Label>
                <Input
                  value={formData.phone2 || ''}
                  onChange={(e) => setFormData({ ...formData, phone2: e.target.value })}
                  placeholder="رقم هاتف ثاني"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">الولاية</Label>
              <Select value={formData.wilaya?.toString() || ''} onValueChange={(v) => setFormData({ ...formData, wilaya: v ? Number(v) : undefined })}>
                <SelectTrigger><SelectValue placeholder="اختر الولاية" /></SelectTrigger>
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
              />
            </div>
            <div>
              <Label className="text-xs">رقم الهوية</Label>
              <Input
                value={formData.nationalId || ''}
                onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                placeholder="رقم بطاقة الهوية"
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
            <AlertDialogAction onClick={() => deleteConfirm && deleteClient(deleteConfirm)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
