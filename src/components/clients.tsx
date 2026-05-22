'use client';

import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Client, type Case as CaseType, type Payment } from '@/lib/db';
import { searchClients } from '@/lib/search';
import { Card } from '@/components/ui/card';
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
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

// ============================================================================
// الولايات الجزائرية الـ 58
// ============================================================================
export const WILAYAS = [
  { value: 1, label: '01 - أدرار' },
  { value: 2, label: '02 - الشلف' },
  { value: 3, label: '03 - الأغواط' },
  { value: 4, label: '04 - أم البواقي' },
  { value: 5, label: '05 - باتنة' },
  { value: 6, label: '06 - بجاية' },
  { value: 7, label: '07 - بسكرة' },
  { value: 8, label: '08 - بشار' },
  { value: 9, label: '09 - البليدة' },
  { value: 10, label: '10 - البويرة' },
  { value: 11, label: '11 - تمنراست' },
  { value: 12, label: '12 - تبسة' },
  { value: 13, label: '13 - تلمسان' },
  { value: 14, label: '14 - تيارت' },
  { value: 15, label: '15 - تيزي وزو' },
  { value: 16, label: '16 - الجزائر' },
  { value: 17, label: '17 - الجلفة' },
  { value: 18, label: '18 - جيجل' },
  { value: 19, label: '19 - سطيف' },
  { value: 20, label: '20 - سعيدة' },
  { value: 21, label: '21 - سكيكدة' },
  { value: 22, label: '22 - سيدي بلعباس' },
  { value: 23, label: '23 - عنابة' },
  { value: 24, label: '24 - قالمة' },
  { value: 25, label: '25 - قسنطينة' },
  { value: 26, label: '26 - المدية' },
  { value: 27, label: '27 - مستغانم' },
  { value: 28, label: '28 - المسيلة' },
  { value: 29, label: '29 - معسكر' },
  { value: 30, label: '30 - ورقلة' },
  { value: 31, label: '31 - وهران' },
  { value: 32, label: '32 - البيض' },
  { value: 33, label: '33 - إليزي' },
  { value: 34, label: '34 - برج بوعريريج' },
  { value: 35, label: '35 - بومرداس' },
  { value: 36, label: '36 - الطارف' },
  { value: 37, label: '37 - تندوف' },
  { value: 38, label: '38 - تيسمسيلت' },
  { value: 39, label: '39 - الوادي' },
  { value: 40, label: '40 - خنشلة' },
  { value: 41, label: '41 - سوق أهراس' },
  { value: 42, label: '42 - تيبازة' },
  { value: 43, label: '43 - ميلة' },
  { value: 44, label: '44 - عين الدفلى' },
  { value: 45, label: '45 - النعامة' },
  { value: 46, label: '46 - عين تموشنت' },
  { value: 47, label: '47 - غرداية' },
  { value: 48, label: '48 - غليزان' },
  { value: 49, label: '49 - تيميمون' },
  { value: 50, label: '50 - برج باجي مختار' },
  { value: 51, label: '51 - أولاد جلال' },
  { value: 52, label: '52 - بني عباس' },
  { value: 53, label: '53 - عين صالح' },
  { value: 54, label: '54 - عين قزام' },
  { value: 55, label: '55 - توقرت' },
  { value: 56, label: '56 - جانت' },
  { value: 57, label: '57 - المغير' },
  { value: 58, label: '58 - المنيعة' },
];

// ============================================================================
// دوال مساعدة
// ============================================================================
const fmtCurrency = (amount: number) => `${amount.toLocaleString('en-US')} د.ج`;

const typeLabels: Record<string, string> = {
  individual: 'فردية',
  company: 'شركة',
};

const getWilayaLabel = (value: number | undefined) => {
  if (!value) return '—';
  const w = WILAYAS.find((x) => x.value === value);
  return w ? w.label : String(value);
};

const formatDate = (date: Date | undefined) => {
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

const emptyFormData = (): Partial<Client> => ({
  name: '',
  phone: '',
  phone2: '',
  email: '',
  address: '',
  wilaya: undefined,
  nationalId: '',
  type: 'individual',
  notes: '',
});

// ============================================================================
// مكون الموكلون
// ============================================================================
export function Clients() {
  const allClients = useLiveQuery(() => db.clients.orderBy('createdAt').reverse().toArray());
  const allCases = useLiveQuery(() => db.cases.toArray());
  const allPayments = useLiveQuery(() => db.payments.toArray());

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<Partial<Client>>(emptyFormData());
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  // Full text search
  const filteredClients = useMemo(() => {
    if (!allClients) return [];
    let result = allClients;

    // Filter by type
    if (filterType !== 'all') {
      result = result.filter((c) => c.type === filterType);
    }

    // Text search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          (c.phone2 && c.phone2.toLowerCase().includes(q)) ||
          (c.email && c.email.toLowerCase().includes(q)) ||
          (c.nationalId && c.nationalId.toLowerCase().includes(q)) ||
          (c.address && c.address.toLowerCase().includes(q)) ||
          (c.notes && c.notes.toLowerCase().includes(q))
      );
    }

    return result;
  }, [allClients, search, filterType]);

  const totalPages = Math.max(1, Math.ceil(filteredClients.length / PAGE_SIZE));
  const paginatedClients = filteredClients.slice(0, page * PAGE_SIZE);
  const hasMore = page * PAGE_SIZE < filteredClients.length;

  // Related data for view dialog
  const clientCases = useMemo(
    () => (selectedClient ? (allCases?.filter((c) => c.clientId === selectedClient.id) ?? []) : []),
    [selectedClient, allCases]
  );

  const clientPayments = useMemo(
    () =>
      selectedClient
        ? (allPayments?.filter((p) => p.clientId === selectedClient.id && p.type === 'income') ?? [])
        : [],
    [selectedClient, allPayments]
  );

  const totalPayments = useMemo(
    () => clientPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
    [clientPayments]
  );

  // Handlers
  const openAdd = () => {
    setFormData(emptyFormData());
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
      toast.error('يرجى إدخال الاسم واللقب');
      return;
    }
    if (!formData.phone?.trim()) {
      toast.error('يرجى إدخال رقم الهاتف');
      return;
    }
    try {
      const now = new Date();
      if (selectedClient?.id) {
        await db.clients.update(selectedClient.id, {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          phone2: formData.phone2?.trim() || undefined,
          email: formData.email?.trim() || undefined,
          address: formData.address?.trim() || undefined,
          wilaya: formData.wilaya || undefined,
          nationalId: formData.nationalId?.trim() || undefined,
          type: formData.type as 'individual' | 'company',
          notes: formData.notes?.trim() || undefined,
          updatedAt: now,
        });
        toast.success('تم تحديث بيانات الموكل بنجاح');
      } else {
        await db.clients.add({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          phone2: formData.phone2?.trim() || undefined,
          email: formData.email?.trim() || undefined,
          address: formData.address?.trim() || undefined,
          wilaya: formData.wilaya || undefined,
          nationalId: formData.nationalId?.trim() || undefined,
          type: (formData.type as 'individual' | 'company') || 'individual',
          notes: formData.notes?.trim() || undefined,
          createdAt: now,
          updatedAt: now,
        });
        toast.success('تم إضافة الموكل بنجاح');
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
        toast.success('تم حذف الموكل بنجاح');
      } catch {
        toast.error('حدث خطأ أثناء الحذف');
      }
      setDeleteOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم، الهاتف، رقم الهوية..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pr-9"
          />
        </div>
        <Select value={filterType} onValueChange={(v) => { setFilterType(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="النوع" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="individual">فردية</SelectItem>
            <SelectItem value="company">شركة</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={openAdd} className="bg-teal-700 hover:bg-teal-800 shrink-0">
          <Plus className="w-4 h-4 ml-2" />
          إضافة موكل
        </Button>
      </div>

      {/* Count badge */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-sm">
          <Users className="w-3.5 h-3.5 ml-1" />
          {filteredClients.length} موكل
        </Badge>
      </div>

      {/* Desktop Table */}
      <Card className="border-0 shadow-sm overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الاسم</TableHead>
                <TableHead className="text-right">الهاتف</TableHead>
                <TableHead className="text-right hidden lg:table-cell">الولاية</TableHead>
                <TableHead className="text-right hidden sm:table-cell">النوع</TableHead>
                <TableHead className="text-right hidden xl:table-cell">تاريخ الإنشاء</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedClients.length > 0 ? (
                paginatedClients.map((client) => (
                  <TableRow key={client.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell dir="ltr" className="text-right">{client.phone}</TableCell>
                    <TableCell className="hidden lg:table-cell">{getWilayaLabel(client.wilaya)}</TableCell>
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
                    <TableCell className="hidden xl:table-cell">{formatDate(client.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openView(client)} title="عرض">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(client)} title="تعديل">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => openDelete(client)} title="حذف">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {search ? 'لا توجد نتائج للبحث' : 'لا يوجد موكلون بعد'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Mobile Cards */}
      <div className="space-y-3 md:hidden">
        {paginatedClients.length > 0 ? (
          paginatedClients.map((client) => (
            <Card key={client.id} className="p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center shrink-0">
                    {client.type === 'company' ? (
                      <Building2 className="w-5 h-5 text-teal-700 dark:text-teal-400" />
                    ) : (
                      <User className="w-5 h-5 text-teal-700 dark:text-teal-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{client.name}</p>
                    <p className="text-sm text-muted-foreground" dir="ltr">{client.phone}</p>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className={
                    client.type === 'company'
                      ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 shrink-0'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 shrink-0'
                  }
                >
                  {typeLabels[client.type]}
                </Badge>
              </div>
              {client.wilaya && (
                <p className="text-sm text-muted-foreground mt-2">
                  <MapPin className="w-3.5 h-3.5 inline ml-1" />
                  {getWilayaLabel(client.wilaya)}
                </p>
              )}
              <Separator className="my-3" />
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => openView(client)}>
                  <Eye className="w-4 h-4 ml-1" /> عرض
                </Button>
                <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => openEdit(client)}>
                  <Pencil className="w-4 h-4 ml-1" /> تعديل
                </Button>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-destructive" onClick={() => openDelete(client)}>
                  <Trash2 className="w-4 h-4 ml-1" /> حذف
                </Button>
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {search ? 'لا توجد نتائج للبحث' : 'لا يوجد موكلون بعد'}
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
            <DialogTitle>{selectedClient ? 'تعديل بيانات الموكل' : 'إضافة موكل جديد'}</DialogTitle>
            <DialogDescription>
              {selectedClient ? 'قم بتعديل بيانات الموكل' : 'أدخل بيانات الموكل الجديد'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* الاسم واللقب */}
            <div className="grid gap-2">
              <Label htmlFor="client-name">الاسم واللقب *</Label>
              <Input
                id="client-name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="الاسم واللقب"
              />
            </div>

            {/* الهاتف + هاتف ثاني */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="client-phone">الهاتف *</Label>
                <Input
                  id="client-phone"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="05XXXXXXXX"
                  dir="ltr"
                  className="text-right"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="client-phone2">هاتف ثاني</Label>
                <Input
                  id="client-phone2"
                  value={formData.phone2 || ''}
                  onChange={(e) => setFormData({ ...formData, phone2: e.target.value })}
                  placeholder="اختياري"
                  dir="ltr"
                  className="text-right"
                />
              </div>
            </div>

            {/* البريد الإلكتروني */}
            <div className="grid gap-2">
              <Label htmlFor="client-email">البريد الإلكتروني</Label>
              <Input
                id="client-email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="example@email.com"
                dir="ltr"
                className="text-right"
              />
            </div>

            {/* العنوان */}
            <div className="grid gap-2">
              <Label htmlFor="client-address">العنوان</Label>
              <Input
                id="client-address"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="العنوان"
              />
            </div>

            {/* الولاية + رقم الهوية */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>الولاية</Label>
                <Select
                  value={formData.wilaya ? String(formData.wilaya) : '__none__'}
                  onValueChange={(v) => setFormData({ ...formData, wilaya: v === '__none__' ? undefined : Number(v) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الولاية" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="__none__">— بدون —</SelectItem>
                    {WILAYAS.map((w) => (
                      <SelectItem key={w.value} value={String(w.value)}>
                        {w.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="client-nationalid">رقم الهوية</Label>
                <Input
                  id="client-nationalid"
                  value={formData.nationalId || ''}
                  onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                  placeholder="رقم الهوية الوطنية"
                  dir="ltr"
                  className="text-right"
                />
              </div>
            </div>

            {/* النوع */}
            <div className="grid gap-2">
              <Label>النوع</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={formData.type === 'individual' ? 'default' : 'outline'}
                  className={formData.type === 'individual' ? 'bg-teal-700 hover:bg-teal-800 flex-1' : 'flex-1'}
                  onClick={() => setFormData({ ...formData, type: 'individual' })}
                >
                  <User className="w-4 h-4 ml-2" />
                  فردية
                </Button>
                <Button
                  type="button"
                  variant={formData.type === 'company' ? 'default' : 'outline'}
                  className={formData.type === 'company' ? 'bg-teal-700 hover:bg-teal-800 flex-1' : 'flex-1'}
                  onClick={() => setFormData({ ...formData, type: 'company' })}
                >
                  <Building2 className="w-4 h-4 ml-2" />
                  شركة
                </Button>
              </div>
            </div>

            {/* ملاحظات */}
            <div className="grid gap-2">
              <Label htmlFor="client-notes">ملاحظات</Label>
              <Textarea
                id="client-notes"
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>بيانات الموكل</DialogTitle>
            <DialogDescription>تفاصيل الموكل والقضايا المرتبطة</DialogDescription>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <div className="w-14 h-14 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center shrink-0">
                  {selectedClient.type === 'company' ? (
                    <Building2 className="w-7 h-7 text-teal-700 dark:text-teal-400" />
                  ) : (
                    <User className="w-7 h-7 text-teal-700 dark:text-teal-400" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-lg">{selectedClient.name}</p>
                  <Badge
                    variant="secondary"
                    className={
                      selectedClient.type === 'company'
                        ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    }
                  >
                    {typeLabels[selectedClient.type]}
                  </Badge>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid gap-2">
                {selectedClient.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span dir="ltr">{selectedClient.phone}</span>
                    {selectedClient.phone2 && (
                      <span className="text-muted-foreground">|</span>
                    )}
                    {selectedClient.phone2 && (
                      <span dir="ltr">{selectedClient.phone2}</span>
                    )}
                  </div>
                )}
                {selectedClient.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span dir="ltr">{selectedClient.email}</span>
                  </div>
                )}
                {(selectedClient.address || selectedClient.wilaya) && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span>
                      {selectedClient.address}
                      {selectedClient.address && selectedClient.wilaya ? ' - ' : ''}
                      {getWilayaLabel(selectedClient.wilaya)}
                    </span>
                  </div>
                )}
                {selectedClient.nationalId && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">رقم الهوية: </span>
                    <span dir="ltr">{selectedClient.nationalId}</span>
                  </div>
                )}
              </div>

              {/* Notes */}
              {selectedClient.notes && (
                <div className="text-sm p-3 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">ملاحظات: </span>
                  {selectedClient.notes}
                </div>
              )}

              <Separator />

              {/* Related Cases */}
              <div>
                <h4 className="font-semibold text-sm mb-2">القضايا المرتبطة ({clientCases.length})</h4>
                {clientCases.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {clientCases.map((c) => (
                      <div key={c.id} className="text-sm p-2 rounded bg-muted/50 flex justify-between items-center">
                        <span className="truncate ml-2">{c.subject}</span>
                        <span className="text-muted-foreground text-xs shrink-0">{c.caseNumber}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">لا توجد قضايا مرتبطة</p>
                )}
              </div>

              {/* Total Payments */}
              <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800">
                <div className="text-sm text-teal-700 dark:text-teal-400">إجمالي المدفوعات</div>
                <div className="text-lg font-bold text-teal-800 dark:text-teal-300">{fmtCurrency(totalPayments)}</div>
              </div>

              {/* Edit / Delete from view */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setViewOpen(false);
                    setTimeout(() => openEdit(selectedClient), 200);
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
                    setTimeout(() => openDelete(selectedClient), 200);
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

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف الموكل &quot;{selectedClient?.name}&quot;؟ لا يمكن التراجع عن هذا الإجراء.
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
