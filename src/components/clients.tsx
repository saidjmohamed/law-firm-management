'use client';

import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Client } from '@/lib/db';
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
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  Phone,
  Mail,
  MapPin,
  Building2,
  User,
} from 'lucide-react';
import { toast } from 'sonner';

const typeLabels: Record<string, string> = {
  individual: 'فردى',
  company: 'شركة',
};

export function Clients() {
  const clients = useLiveQuery(() => db.clients.orderBy('createdAt').reverse().toArray());
  const cases = useLiveQuery(() => db.cases.toArray());
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<Partial<Client>>({
    name: '',
    phone: '',
    email: '',
    address: '',
    nationalId: '',
    type: 'individual',
    notes: '',
  });

  const filteredClients = clients?.filter((c) => {
    const matchSearch =
      !search ||
      c.name.includes(search) ||
      c.phone.includes(search) ||
      c.nationalId.includes(search);
    const matchType = filterType === 'all' || c.type === filterType;
    return matchSearch && matchType;
  });

  const openAdd = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      nationalId: '',
      type: 'individual',
      notes: '',
    });
    setSelectedClient(null);
    setDialogOpen(true);
  };

  const openEdit = (client: Client) => {
    setFormData({ ...client });
    setSelectedClient(client);
    setDialogOpen(true);
  };

  const openView = (client: Client) => {
    setSelectedClient(client);
    setViewOpen(true);
  };

  const openDelete = (client: Client) => {
    setSelectedClient(client);
    setDeleteOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      toast.error('يرجى إدخال اسم العميل');
      return;
    }
    try {
      if (selectedClient?.id) {
        await db.clients.update(selectedClient.id, {
          ...formData,
          name: formData.name!.trim(),
        } as Client);
        toast.success('تم تحديث بيانات العميل بنجاح');
      } else {
        await db.clients.add({
          name: formData.name!.trim(),
          phone: formData.phone || '',
          email: formData.email || '',
          address: formData.address || '',
          nationalId: formData.nationalId || '',
          type: (formData.type as 'individual' | 'company') || 'individual',
          notes: formData.notes || '',
          createdAt: new Date(),
        });
        toast.success('تم إضافة العميل بنجاح');
      }
      setDialogOpen(false);
    } catch {
      toast.error('حدث خطأ أثناء الحفظ');
    }
  };

  const handleDelete = async () => {
    if (selectedClient?.id) {
      try {
        await db.clients.delete(selectedClient.id);
        toast.success('تم حذف العميل بنجاح');
      } catch {
        toast.error('حدث خطأ أثناء الحذف');
      }
      setDeleteOpen(false);
    }
  };

  const clientCases = cases?.filter((c) => c.clientId === selectedClient?.id) ?? [];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم أو الهاتف أو رقم الهوية..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="النوع" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="individual">فردى</SelectItem>
            <SelectItem value="company">شركة</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={openAdd} className="bg-teal-700 hover:bg-teal-800 shrink-0">
          <Plus className="w-4 h-4 ml-2" />
          إضافة عميل
        </Button>
      </div>

      {/* Table */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الاسم</TableHead>
                <TableHead className="text-right hidden md:table-cell">الهاتف</TableHead>
                <TableHead className="text-right hidden lg:table-cell">البريد</TableHead>
                <TableHead className="text-right hidden sm:table-cell">النوع</TableHead>
                <TableHead className="text-right hidden xl:table-cell">رقم الهوية</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients && filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <TableRow key={client.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell className="hidden md:table-cell dir-ltr text-right">{client.phone}</TableCell>
                    <TableCell className="hidden lg:table-cell">{client.email}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge
                        variant="secondary"
                        className={
                          client.type === 'company'
                            ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        }
                      >
                        {client.type === 'company' ? (
                          <Building2 className="w-3 h-3 ml-1" />
                        ) : (
                          <User className="w-3 h-3 ml-1" />
                        )}
                        {typeLabels[client.type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">{client.nationalId}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openView(client)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(client)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => openDelete(client)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {search ? 'لا توجد نتائج للبحث' : 'لا يوجد عملاء بعد'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>{selectedClient ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}</DialogTitle>
            <DialogDescription>
              {selectedClient ? 'قم بتعديل بيانات العميل' : 'أدخل بيانات العميل الجديد'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">الاسم *</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="اسم العميل"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phone">الهاتف</Label>
                <Input
                  id="phone"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="05xxxxxxxx"
                  dir="ltr"
                  className="text-right"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="nationalId">رقم الهوية</Label>
                <Input
                  id="nationalId"
                  value={formData.nationalId || ''}
                  onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                  placeholder="رقم الهوية"
                  dir="ltr"
                  className="text-right"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="example@email.com"
                dir="ltr"
                className="text-right"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">النوع</Label>
              <Select
                value={formData.type || 'individual'}
                onValueChange={(v) => setFormData({ ...formData, type: v as 'individual' | 'company' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">فردى</SelectItem>
                  <SelectItem value="company">شركة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">العنوان</Label>
              <Input
                id="address"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="العنوان"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">ملاحظات</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="ملاحظات إضافية"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSave} className="bg-teal-700 hover:bg-teal-800">
              {selectedClient ? 'تحديث' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Client Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>بيانات العميل</DialogTitle>
            <DialogDescription>تفاصيل العميل والقضايا المرتبطة</DialogDescription>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-4">
              <div className="grid gap-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                    {selectedClient.type === 'company' ? (
                      <Building2 className="w-6 h-6 text-teal-700 dark:text-teal-400" />
                    ) : (
                      <User className="w-6 h-6 text-teal-700 dark:text-teal-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-lg">{selectedClient.name}</p>
                    <Badge variant="secondary" className="text-xs">
                      {typeLabels[selectedClient.type]}
                    </Badge>
                  </div>
                </div>
                {selectedClient.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span dir="ltr">{selectedClient.phone}</span>
                  </div>
                )}
                {selectedClient.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span dir="ltr">{selectedClient.email}</span>
                  </div>
                )}
                {selectedClient.address && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedClient.address}</span>
                  </div>
                )}
                {selectedClient.nationalId && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">رقم الهوية: </span>
                    <span dir="ltr">{selectedClient.nationalId}</span>
                  </div>
                )}
                {selectedClient.notes && (
                  <div className="text-sm p-3 rounded-lg bg-muted/50">
                    <span className="text-muted-foreground">ملاحظات: </span>
                    {selectedClient.notes}
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-2">القضايا المرتبطة ({clientCases.length})</h4>
                {clientCases.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {clientCases.map((c) => (
                      <div key={c.id} className="text-sm p-2 rounded bg-muted/50 flex justify-between">
                        <span>{c.title}</span>
                        <span className="text-muted-foreground">{c.caseNumber}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">لا توجد قضايا مرتبطة</p>
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
              هل أنت متأكد من حذف العميل &quot;{selectedClient?.name}&quot;؟ لا يمكن التراجع عن هذا الإجراء.
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
