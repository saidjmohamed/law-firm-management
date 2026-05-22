'use client';

import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Case, type Party, type Delay, type Payment } from '@/lib/db';
import { WILAYAS } from '@/components/clients';
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
  Briefcase,
  X,
  Users,
  Clock,
  Banknote,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ============================================================================
// ثوابت
// ============================================================================
const fmtCurrency = (amount: number) => `${amount.toLocaleString('en-US')} د.ج`;

const statusLabels: Record<string, string> = {
  active: 'جارية',
  scheduling: 'للجدولة',
  decided: 'مفصول فيها',
  archived: 'مؤرشفة',
};

const statusColors: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  scheduling: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  decided: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  archived: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const caseNatures = [
  'جنحة', 'مخالفة', 'جناية', 'أحداث', 'تحقيق/غرفة الاتهام',
  'مدني', 'عقاري', 'شؤون الأسرة', 'عمالي', 'تجاري', 'بحري',
  'استعجالي', 'إداري', 'أمر على عريضة', 'أخرى',
];

const stages = [
  'ابتدائي', 'استئنافية', 'معارضة', 'استدعاء مباشر', 'تحقيق',
  'معارضة مع إدخال رقم القضية محل البراءة', 'أخرى',
];

const partyRoles = [
  'مدعي', 'مدعى عليه', 'مشتكي', 'مشتكى منه', 'ضحية',
  'طرف مدني', 'مدخل في الخصام', 'متهم', 'مستأنف', 'مستأنف عليه',
  'معارض', 'معارض ضده',
];

const courtTypeLabels: Record<string, string> = {
  ordinary: 'عادي',
  administrative: 'إداري',
  supreme: 'محكمة عليا',
};

const formatDate = (date: string | undefined) => {
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

const emptyCaseForm = (): Partial<Case> => ({
  caseNumber: '',
  subject: '',
  clientId: undefined,
  clientName: '',
  courtType: 'ordinary',
  councilName: '',
  courtName: '',
  sectionName: '',
  sectionNumber: '',
  caseNature: '',
  stage: 'ابتدائي',
  origCaseNumber: '',
  customStage: '',
  status: 'active',
  fees: undefined,
  paid: undefined,
  opposingParty: '',
  opposingLawyer: '',
  registrationDate: '',
  firstSessionDate: '',
  delibDate: '',
  barPhone: '',
  notes: '',
  judgment: '',
});

const emptyPartyForm = (): Partial<Party> => ({
  role: '',
  name: '',
  phone: '',
  lawyerName: '',
  lawyerPhone: '',
});

const emptyDelayForm = (): Partial<Delay> => ({
  delayDate: '',
  reason: '',
  newDate: '',
  notes: '',
});

// ============================================================================
// مكون القضايا
// ============================================================================
export function Cases() {
  const allCases = useLiveQuery(() => db.cases.orderBy('createdAt').reverse().toArray());
  const allClients = useLiveQuery(() => db.clients.toArray());
  const allParties = useLiveQuery(() => db.parties.toArray());
  const allDelays = useLiveQuery(() => db.delays.toArray());
  const allPayments = useLiveQuery(() => db.payments.toArray());
  const allSessions = useLiveQuery(() => db.sessions.toArray());

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterNature, setFilterNature] = useState<string>('all');
  const [filterCourtType, setFilterCourtType] = useState<string>('all');
  const [filterStage, setFilterStage] = useState<string>('all');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [formData, setFormData] = useState<Partial<Case>>(emptyCaseForm());
  const [clientPickerOpen, setClientPickerOpen] = useState(false);

  // Inline party management
  const [partyForm, setPartyForm] = useState<Partial<Party>>(emptyPartyForm());
  const [showPartyForm, setShowPartyForm] = useState(false);

  // Inline delay management
  const [delayForm, setDelayForm] = useState<Partial<Delay>>(emptyDelayForm());
  const [showDelayForm, setShowDelayForm] = useState(false);

  // Filter cases
  const filteredCases = useMemo(() => {
    if (!allCases) return [];
    let result = allCases;

    if (filterStatus !== 'all') {
      result = result.filter((c) => c.status === filterStatus);
    }
    if (filterNature !== 'all') {
      result = result.filter((c) => c.caseNature === filterNature);
    }
    if (filterCourtType !== 'all') {
      result = result.filter((c) => c.courtType === filterCourtType);
    }
    if (filterStage !== 'all') {
      result = result.filter((c) => c.stage === filterStage);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (c) =>
          c.caseNumber.toLowerCase().includes(q) ||
          c.subject.toLowerCase().includes(q) ||
          (c.clientName && c.clientName.toLowerCase().includes(q)) ||
          (c.courtName && c.courtName.toLowerCase().includes(q)) ||
          (c.councilName && c.councilName.toLowerCase().includes(q)) ||
          (c.opposingParty && c.opposingParty.toLowerCase().includes(q)) ||
          (c.notes && c.notes.toLowerCase().includes(q))
      );
    }

    return result;
  }, [allCases, search, filterStatus, filterNature, filterCourtType, filterStage]);

  const totalPages = Math.max(1, Math.ceil(filteredCases.length / PAGE_SIZE));
  const paginatedCases = filteredCases.slice(0, page * PAGE_SIZE);
  const hasMore = page * PAGE_SIZE < filteredCases.length;

  // Related data for view dialog
  const caseParties = useMemo(
    () => (selectedCase ? (allParties?.filter((p) => p.caseId === selectedCase.id) ?? []) : []),
    [selectedCase, allParties]
  );
  const caseDelays = useMemo(
    () => (selectedCase ? (allDelays?.filter((d) => d.caseId === selectedCase.id) ?? []) : []),
    [selectedCase, allDelays]
  );
  const casePayments = useMemo(
    () => (selectedCase ? (allPayments?.filter((p) => p.caseId === selectedCase.id) ?? []) : []),
    [selectedCase, allPayments]
  );
  const caseSessions = useMemo(
    () => (selectedCase ? (allSessions?.filter((s) => s.caseId === selectedCase.id) ?? []) : []),
    [selectedCase, allSessions]
  );

  const remaining = useMemo(() => {
    const fees = selectedCase?.fees || 0;
    const paid = selectedCase?.paid || 0;
    return fees - paid;
  }, [selectedCase]);

  // Handlers
  const openAdd = () => {
    setFormData(emptyCaseForm());
    setSelectedCase(null);
    setDialogOpen(true);
  };

  const openEdit = (c: Case) => {
    setFormData({ ...c });
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
    if (!formData.caseNumber?.trim()) {
      toast.error('يرجى إدخال رقم القضية');
      return;
    }
    if (!formData.subject?.trim()) {
      toast.error('يرجى إدخال موضوع القضية');
      return;
    }
    try {
      const now = new Date();
      const data: Partial<Case> = {
        caseNumber: formData.caseNumber.trim(),
        subject: formData.subject.trim(),
        clientId: formData.clientId || undefined,
        clientName: formData.clientName?.trim() || undefined,
        courtType: formData.courtType as Case['courtType'] || 'ordinary',
        councilName: formData.councilName?.trim() || undefined,
        courtName: formData.courtName?.trim() || undefined,
        sectionName: formData.sectionName?.trim() || undefined,
        sectionNumber: formData.sectionNumber?.trim() || undefined,
        caseNature: formData.caseNature || '',
        stage: formData.stage || 'ابتدائي',
        origCaseNumber: formData.origCaseNumber?.trim() || undefined,
        customStage: formData.customStage?.trim() || undefined,
        status: (formData.status as Case['status']) || 'active',
        fees: formData.fees || undefined,
        paid: formData.paid || undefined,
        opposingParty: formData.opposingParty?.trim() || undefined,
        opposingLawyer: formData.opposingLawyer?.trim() || undefined,
        registrationDate: formData.registrationDate || undefined,
        firstSessionDate: formData.firstSessionDate || undefined,
        delibDate: formData.delibDate || undefined,
        barPhone: formData.barPhone?.trim() || undefined,
        notes: formData.notes?.trim() || undefined,
        judgment: formData.judgment?.trim() || undefined,
        updatedAt: now,
      };

      if (selectedCase?.id) {
        await db.cases.update(selectedCase.id, data as Case);
        toast.success('تم تحديث القضية بنجاح');
      } else {
        await db.cases.add({
          ...data,
          createdAt: now,
          updatedAt: now,
        } as Case);
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
        // Also delete related parties, delays, sessions, payments
        await db.parties.where('caseId').equals(selectedCase.id).delete();
        await db.delays.where('caseId').equals(selectedCase.id).delete();
        await db.sessions.where('caseId').equals(selectedCase.id).delete();
        await db.cases.delete(selectedCase.id);
        toast.success('تم حذف القضية بنجاح');
      } catch {
        toast.error('حدث خطأ أثناء الحذف');
      }
      setDeleteOpen(false);
    }
  };

  // Inline Party Management
  const handleAddParty = async () => {
    if (!selectedCase?.id || !partyForm.role || !partyForm.name?.trim()) {
      toast.error('يرجى إدخال المركز القانوني والاسم');
      return;
    }
    try {
      const now = new Date();
      await db.parties.add({
        caseId: selectedCase.id,
        role: partyForm.role,
        name: partyForm.name.trim(),
        phone: partyForm.phone?.trim() || undefined,
        lawyerName: partyForm.lawyerName?.trim() || undefined,
        lawyerPhone: partyForm.lawyerPhone?.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      });
      toast.success('تم إضافة الطرف بنجاح');
      setPartyForm(emptyPartyForm());
      setShowPartyForm(false);
    } catch {
      toast.error('حدث خطأ أثناء إضافة الطرف');
    }
  };

  const handleDeleteParty = async (partyId: number) => {
    try {
      await db.parties.delete(partyId);
      toast.success('تم حذف الطرف بنجاح');
    } catch {
      toast.error('حدث خطأ أثناء حذف الطرف');
    }
  };

  // Inline Delay Management
  const handleAddDelay = async () => {
    if (!selectedCase?.id || !delayForm.delayDate || !delayForm.reason?.trim()) {
      toast.error('يرجى إدخال تاريخ التأجيل والسبب');
      return;
    }
    try {
      const now = new Date();
      await db.delays.add({
        caseId: selectedCase.id,
        caseNumber: selectedCase.caseNumber,
        caseSubject: selectedCase.subject,
        delayDate: delayForm.delayDate,
        reason: delayForm.reason.trim(),
        newDate: delayForm.newDate || undefined,
        notes: delayForm.notes?.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      });
      toast.success('تم إضافة التأجيل بنجاح');
      setDelayForm(emptyDelayForm());
      setShowDelayForm(false);
    } catch {
      toast.error('حدث خطأ أثناء إضافة التأجيل');
    }
  };

  const handleDeleteDelay = async (delayId: number) => {
    try {
      await db.delays.delete(delayId);
      toast.success('تم حذف التأجيل بنجاح');
    } catch {
      toast.error('حدث خطأ أثناء حذف التأجيل');
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="بحث برقم القضية، الموضوع، الموكل..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pr-9"
            />
          </div>
          <Button onClick={openAdd} className="bg-teal-700 hover:bg-teal-800 shrink-0">
            <Plus className="w-4 h-4 ml-2" />
            إضافة قضية
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الحالات</SelectItem>
              <SelectItem value="active">جارية</SelectItem>
              <SelectItem value="scheduling">للجدولة</SelectItem>
              <SelectItem value="decided">مفصول فيها</SelectItem>
              <SelectItem value="archived">مؤرشفة</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterNature} onValueChange={(v) => { setFilterNature(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="الطبيعة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الطبائع</SelectItem>
              {caseNatures.map((n) => (
                <SelectItem key={n} value={n}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterCourtType} onValueChange={(v) => { setFilterCourtType(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="نوع القضاء" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="ordinary">عادي</SelectItem>
              <SelectItem value="administrative">إداري</SelectItem>
              <SelectItem value="supreme">محكمة عليا</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStage} onValueChange={(v) => { setFilterStage(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="المرحلة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل المراحل</SelectItem>
              {stages.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Count badge */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-sm">
          <Briefcase className="w-3.5 h-3.5 ml-1" />
          {filteredCases.length} قضية
        </Badge>
      </div>

      {/* Desktop Table */}
      <Card className="border-0 shadow-sm overflow-hidden hidden lg:block">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">رقم القضية</TableHead>
                <TableHead className="text-right">الموضوع</TableHead>
                <TableHead className="text-right">الموكل</TableHead>
                <TableHead className="text-right">المحكمة</TableHead>
                <TableHead className="text-right">الطبيعة</TableHead>
                <TableHead className="text-right">المرحلة</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">الأتعاب</TableHead>
                <TableHead className="text-right">المدفوع</TableHead>
                <TableHead className="text-right">المتبقي</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCases.length > 0 ? (
                paginatedCases.map((c) => {
                  const rem = (c.fees || 0) - (c.paid || 0);
                  return (
                    <TableRow key={c.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-sm">{c.caseNumber}</TableCell>
                      <TableCell className="font-medium max-w-[180px] truncate">{c.subject}</TableCell>
                      <TableCell className="max-w-[120px] truncate">{c.clientName || '—'}</TableCell>
                      <TableCell className="max-w-[130px] truncate">{c.courtName || '—'}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{c.caseNature}</Badge></TableCell>
                      <TableCell className="text-sm">{c.stage === 'أخرى' ? c.customStage : c.stage}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`text-xs ${statusColors[c.status] || ''}`}>
                          {statusLabels[c.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{c.fees ? fmtCurrency(c.fees) : '—'}</TableCell>
                      <TableCell className="text-sm">{c.paid ? fmtCurrency(c.paid) : '—'}</TableCell>
                      <TableCell className="text-sm">
                        {c.fees ? (
                          <span className={rem > 0 ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-emerald-600 dark:text-emerald-400'}>
                            {fmtCurrency(rem)}
                          </span>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openView(c)} title="عرض">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)} title="تعديل">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => openDelete(c)} title="حذف">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                    {search || filterStatus !== 'all' ? 'لا توجد نتائج للبحث' : 'لا توجد قضايا بعد'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Mobile/Tablet Cards */}
      <div className="space-y-3 lg:hidden">
        {paginatedCases.length > 0 ? (
          paginatedCases.map((c) => {
            const rem = (c.fees || 0) - (c.paid || 0);
            return (
              <Card key={c.id} className="p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{c.subject}</p>
                    <p className="text-sm text-muted-foreground font-mono">{c.caseNumber}</p>
                  </div>
                  <Badge variant="secondary" className={`text-xs shrink-0 ${statusColors[c.status] || ''}`}>
                    {statusLabels[c.status]}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-1 text-sm mb-3">
                  {c.clientName && <div><span className="text-muted-foreground">الموكل: </span>{c.clientName}</div>}
                  {c.courtName && <div><span className="text-muted-foreground">المحكمة: </span>{c.courtName}</div>}
                  <div><span className="text-muted-foreground">الطبيعة: </span>{c.caseNature}</div>
                  <div><span className="text-muted-foreground">المرحلة: </span>{c.stage === 'أخرى' ? c.customStage : c.stage}</div>
                </div>
                {c.fees ? (
                  <div className="flex gap-3 text-sm p-2 rounded bg-muted/50 mb-3">
                    <div>الأتعاب: {fmtCurrency(c.fees)}</div>
                    <div>المدفوع: {fmtCurrency(c.paid || 0)}</div>
                    <div className={rem > 0 ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-emerald-600 dark:text-emerald-400'}>
                      المتبقي: {fmtCurrency(rem)}
                    </div>
                  </div>
                ) : null}
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => openView(c)}>
                    <Eye className="w-4 h-4 ml-1" /> عرض
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => openEdit(c)}>
                    <Pencil className="w-4 h-4 ml-1" /> تعديل
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-destructive" onClick={() => openDelete(c)}>
                    <Trash2 className="w-4 h-4 ml-1" /> حذف
                  </Button>
                </div>
              </Card>
            );
          })
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {search || filterStatus !== 'all' ? 'لا توجد نتائج للبحث' : 'لا توجد قضايا بعد'}
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

      {/* ================================================================== */}
      {/* Add/Edit Dialog - 7 Sections */}
      {/* ================================================================== */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{selectedCase ? 'تعديل القضية' : 'إضافة قضية جديدة'}</DialogTitle>
            <DialogDescription>
              {selectedCase ? 'قم بتعديل بيانات القضية' : 'أدخل بيانات القضية الجديدة'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {/* Section 1 - معلومات أساسية */}
            <div>
              <h3 className="font-bold text-sm text-teal-700 dark:text-teal-400 mb-3 flex items-center gap-2">
                <Scale className="w-4 h-4" />
                معلومات أساسية
              </h3>
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>رقم القضية *</Label>
                    <Input
                      value={formData.caseNumber || ''}
                      onChange={(e) => setFormData({ ...formData, caseNumber: e.target.value })}
                      placeholder="2024/م/001"
                    />
                  </div>
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
                              {allClients?.map((client) => (
                                <CommandItem
                                  key={client.id}
                                  onSelect={() => {
                                    setFormData({
                                      ...formData,
                                      clientId: client.id,
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
                  <Label>الموضوع *</Label>
                  <Input
                    value={formData.subject || ''}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="موضوع القضية"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>طبيعة القضية</Label>
                  <Select
                    value={formData.caseNature || '__none__'}
                    onValueChange={(v) => setFormData({ ...formData, caseNature: v === '__none__' ? '' : v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر طبيعة القضية" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— بدون —</SelectItem>
                      {caseNatures.map((n) => (
                        <SelectItem key={n} value={n}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Section 2 - الجهة القضائية */}
            <div>
              <h3 className="font-bold text-sm text-teal-700 dark:text-teal-400 mb-3 flex items-center gap-2">
                <Scale className="w-4 h-4" />
                الجهة القضائية
              </h3>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>نوع القضاء</Label>
                  <div className="flex gap-2">
                    {(['ordinary', 'administrative', 'supreme'] as const).map((ct) => (
                      <Button
                        key={ct}
                        type="button"
                        variant={formData.courtType === ct ? 'default' : 'outline'}
                        className={formData.courtType === ct ? 'bg-teal-700 hover:bg-teal-800 flex-1' : 'flex-1'}
                        onClick={() => setFormData({ ...formData, courtType: ct })}
                      >
                        {courtTypeLabels[ct]}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>المجلس القضائي</Label>
                    <Input
                      value={formData.councilName || ''}
                      onChange={(e) => setFormData({ ...formData, councilName: e.target.value })}
                      placeholder="مجلس قضاء..."
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>المحكمة</Label>
                    <Input
                      value={formData.courtName || ''}
                      onChange={(e) => setFormData({ ...formData, courtName: e.target.value })}
                      placeholder="اسم المحكمة"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>القسم/الغرفة</Label>
                    <Input
                      value={formData.sectionName || ''}
                      onChange={(e) => setFormData({ ...formData, sectionName: e.target.value })}
                      placeholder="الغرفة المدنية..."
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>رقم القسم</Label>
                    <Input
                      value={formData.sectionNumber || ''}
                      onChange={(e) => setFormData({ ...formData, sectionNumber: e.target.value })}
                      placeholder="01"
                      dir="ltr"
                      className="text-right"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Section 3 - مرحلة التقاضي */}
            <div>
              <h3 className="font-bold text-sm text-teal-700 dark:text-teal-400 mb-3 flex items-center gap-2">
                <Scale className="w-4 h-4" />
                مرحلة التقاضي
              </h3>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>المرحلة</Label>
                  <Select
                    value={formData.stage || 'ابتدائي'}
                    onValueChange={(v) => setFormData({ ...formData, stage: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {(formData.stage === 'استئنافية' || formData.stage === 'معارضة') && (
                  <div className="grid gap-2">
                    <Label>رقم القضية الأصلية</Label>
                    <Input
                      value={formData.origCaseNumber || ''}
                      onChange={(e) => setFormData({ ...formData, origCaseNumber: e.target.value })}
                      placeholder="رقم القضية في المرحلة السابقة"
                    />
                  </div>
                )}
                {formData.stage === 'أخرى' && (
                  <div className="grid gap-2">
                    <Label>مرحلة مخصصة</Label>
                    <Input
                      value={formData.customStage || ''}
                      onChange={(e) => setFormData({ ...formData, customStage: e.target.value })}
                      placeholder="أدخل اسم المرحلة"
                    />
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Section 4 - الأتعاب والمدفوعات */}
            <div>
              <h3 className="font-bold text-sm text-teal-700 dark:text-teal-400 mb-3 flex items-center gap-2">
                <Banknote className="w-4 h-4" />
                الأتعاب والمدفوعات
              </h3>
              <div className="grid gap-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label>الأتعاب (د.ج)</Label>
                    <Input
                      type="number"
                      value={formData.fees ?? ''}
                      onChange={(e) => setFormData({ ...formData, fees: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="0"
                      dir="ltr"
                      className="text-right"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>المدفوع (د.ج)</Label>
                    <Input
                      type="number"
                      value={formData.paid ?? ''}
                      onChange={(e) => setFormData({ ...formData, paid: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="0"
                      dir="ltr"
                      className="text-right"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>المتبقي (د.ج)</Label>
                    <div className="h-9 px-3 rounded-md border bg-muted/50 flex items-center">
                      <span className={
                        ((formData.fees || 0) - (formData.paid || 0)) > 0
                          ? 'text-red-600 dark:text-red-400 font-semibold'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }>
                        {((formData.fees || 0) - (formData.paid || 0)).toLocaleString('en-US')}
                      </span>
                    </div>
                  </div>
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
                      <SelectItem value="active">جارية</SelectItem>
                      <SelectItem value="scheduling">للجدولة</SelectItem>
                      <SelectItem value="decided">مفصول فيها</SelectItem>
                      <SelectItem value="archived">مؤرشفة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Section 5 - الخصم */}
            <div>
              <h3 className="font-bold text-sm text-teal-700 dark:text-teal-400 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                الخصم
              </h3>
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
            </div>

            <Separator />

            {/* Section 6 - التواريخ */}
            <div>
              <h3 className="font-bold text-sm text-teal-700 dark:text-teal-400 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                التواريخ
              </h3>
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>تاريخ التسجيل</Label>
                    <Input
                      type="date"
                      value={formData.registrationDate || ''}
                      onChange={(e) => setFormData({ ...formData, registrationDate: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>أول جلسة</Label>
                    <Input
                      type="date"
                      value={formData.firstSessionDate || ''}
                      onChange={(e) => setFormData({ ...formData, firstSessionDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>تاريخ المداولة</Label>
                    <Input
                      type="date"
                      value={formData.delibDate || ''}
                      onChange={(e) => setFormData({ ...formData, delibDate: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>هاتف قاعة المحامين</Label>
                    <Input
                      value={formData.barPhone || ''}
                      onChange={(e) => setFormData({ ...formData, barPhone: e.target.value })}
                      placeholder="05XXXXXXXX"
                      dir="ltr"
                      className="text-right"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Section 7 - إضافي */}
            <div>
              <h3 className="font-bold text-sm text-teal-700 dark:text-teal-400 mb-3 flex items-center gap-2">
                ملاحظات ومنطوق الحكم
              </h3>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>ملاحظات</Label>
                  <Textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="ملاحظات إضافية"
                    rows={3}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>منطوق الحكم</Label>
                  <Textarea
                    value={formData.judgment || ''}
                    onChange={(e) => setFormData({ ...formData, judgment: e.target.value })}
                    placeholder="منطوق الحكم"
                    rows={3}
                  />
                </div>
              </div>
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

      {/* ================================================================== */}
      {/* View Case Dialog */}
      {/* ================================================================== */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل القضية</DialogTitle>
            <DialogDescription>معلومات القضية الكاملة</DialogDescription>
          </DialogHeader>
          {selectedCase && (
            <div className="space-y-5">
              {/* Header */}
              <div className="flex items-start justify-between p-4 rounded-lg bg-muted/50">
                <div className="min-w-0">
                  <h3 className="font-bold text-lg">{selectedCase.subject}</h3>
                  <p className="text-sm text-muted-foreground mt-1 font-mono">{selectedCase.caseNumber}</p>
                </div>
                <Badge variant="secondary" className={`text-xs shrink-0 ${statusColors[selectedCase.status]}`}>
                  {statusLabels[selectedCase.status]}
                </Badge>
              </div>

              {/* Remaining amount prominent */}
              {selectedCase.fees ? (
                <div className={`p-4 rounded-lg border ${remaining > 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'}`}>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">الأتعاب</div>
                      <div className="font-bold">{fmtCurrency(selectedCase.fees)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">المدفوع</div>
                      <div className="font-bold">{fmtCurrency(selectedCase.paid || 0)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">المتبقي</div>
                      <div className={`font-bold text-lg ${remaining > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {fmtCurrency(remaining)}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Basic Info */}
              <div>
                <h4 className="font-semibold text-sm mb-2 text-teal-700 dark:text-teal-400">معلومات أساسية</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {selectedCase.clientName && <div><span className="text-muted-foreground">الموكل: </span><span className="font-medium">{selectedCase.clientName}</span></div>}
                  <div><span className="text-muted-foreground">طبيعة القضية: </span>{selectedCase.caseNature}</div>
                  <div><span className="text-muted-foreground">المرحلة: </span>{selectedCase.stage === 'أخرى' ? selectedCase.customStage : selectedCase.stage}</div>
                  {selectedCase.origCaseNumber && <div><span className="text-muted-foreground">رقم القضية الأصلية: </span><span className="font-mono">{selectedCase.origCaseNumber}</span></div>}
                </div>
              </div>

              {/* Court Info */}
              <div>
                <h4 className="font-semibold text-sm mb-2 text-teal-700 dark:text-teal-400">الجهة القضائية</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">نوع القضاء: </span>{courtTypeLabels[selectedCase.courtType]}</div>
                  {selectedCase.councilName && <div><span className="text-muted-foreground">المجلس القضائي: </span>{selectedCase.councilName}</div>}
                  {selectedCase.courtName && <div><span className="text-muted-foreground">المحكمة: </span>{selectedCase.courtName}</div>}
                  {selectedCase.sectionName && <div><span className="text-muted-foreground">القسم/الغرفة: </span>{selectedCase.sectionName}</div>}
                  {selectedCase.sectionNumber && <div><span className="text-muted-foreground">رقم القسم: </span>{selectedCase.sectionNumber}</div>}
                </div>
              </div>

              {/* Opposing Party */}
              {(selectedCase.opposingParty || selectedCase.opposingLawyer) && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-teal-700 dark:text-teal-400">الخصم</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {selectedCase.opposingParty && <div><span className="text-muted-foreground">الخصم: </span>{selectedCase.opposingParty}</div>}
                    {selectedCase.opposingLawyer && <div><span className="text-muted-foreground">محامي الخصم: </span>{selectedCase.opposingLawyer}</div>}
                  </div>
                </div>
              )}

              {/* Dates */}
              <div>
                <h4 className="font-semibold text-sm mb-2 text-teal-700 dark:text-teal-400">التواريخ</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {selectedCase.registrationDate && <div><span className="text-muted-foreground">تاريخ التسجيل: </span>{formatDate(selectedCase.registrationDate)}</div>}
                  {selectedCase.firstSessionDate && <div><span className="text-muted-foreground">أول جلسة: </span>{formatDate(selectedCase.firstSessionDate)}</div>}
                  {selectedCase.delibDate && <div><span className="text-muted-foreground">تاريخ المداولة: </span>{formatDate(selectedCase.delibDate)}</div>}
                  {selectedCase.barPhone && <div><span className="text-muted-foreground">هاتف قاعة المحامين: </span><span dir="ltr">{selectedCase.barPhone}</span></div>}
                </div>
              </div>

              {/* Notes & Judgment */}
              {selectedCase.notes && (
                <div className="text-sm p-3 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">ملاحظات: </span>{selectedCase.notes}
                </div>
              )}
              {selectedCase.judgment && (
                <div className="text-sm p-3 rounded-lg bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800">
                  <span className="text-muted-foreground">منطوق الحكم: </span>{selectedCase.judgment}
                </div>
              )}

              <Separator />

              {/* ===== أطراف النزاع (Inline Management) ===== */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm text-teal-700 dark:text-teal-400 flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    أطراف النزاع ({caseParties.length})
                  </h4>
                  {!showPartyForm && (
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setShowPartyForm(true)}>
                      <Plus className="w-3 h-3 ml-1" /> إضافة طرف
                    </Button>
                  )}
                </div>

                {caseParties.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {caseParties.map((p) => (
                      <div key={p.id} className="flex items-start justify-between p-3 rounded-lg bg-muted/50 text-sm">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 flex-1">
                          <div><Badge variant="outline" className="text-xs">{p.role}</Badge> {p.name}</div>
                          {p.phone && <div><span className="text-muted-foreground">هاتف: </span><span dir="ltr">{p.phone}</span></div>}
                          {p.lawyerName && <div><span className="text-muted-foreground">محاميه: </span>{p.lawyerName}</div>}
                          {p.lawyerPhone && <div><span className="text-muted-foreground">هاتف المحامي: </span><span dir="ltr">{p.lawyerPhone}</span></div>}
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0" onClick={() => p.id && handleDeleteParty(p.id)}>
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {showPartyForm && (
                  <div className="p-3 rounded-lg border border-dashed space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-1.5">
                        <Label className="text-xs">المركز القانوني *</Label>
                        <Select value={partyForm.role || '__none__'} onValueChange={(v) => setPartyForm({ ...partyForm, role: v === '__none__' ? '' : v })}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="اختر" /></SelectTrigger>
                          <SelectContent>
                            {partyRoles.map((r) => (
                              <SelectItem key={r} value={r}>{r}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-1.5">
                        <Label className="text-xs">الاسم واللقب *</Label>
                        <Input className="h-8 text-sm" value={partyForm.name || ''} onChange={(e) => setPartyForm({ ...partyForm, name: e.target.value })} placeholder="الاسم" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="grid gap-1.5">
                        <Label className="text-xs">الهاتف</Label>
                        <Input className="h-8 text-sm" dir="ltr" value={partyForm.phone || ''} onChange={(e) => setPartyForm({ ...partyForm, phone: e.target.value })} placeholder="05XX" />
                      </div>
                      <div className="grid gap-1.5">
                        <Label className="text-xs">اسم محاميه</Label>
                        <Input className="h-8 text-sm" value={partyForm.lawyerName || ''} onChange={(e) => setPartyForm({ ...partyForm, lawyerName: e.target.value })} placeholder="المحامي" />
                      </div>
                      <div className="grid gap-1.5">
                        <Label className="text-xs">هاتف المحامي</Label>
                        <Input className="h-8 text-sm" dir="ltr" value={partyForm.lawyerPhone || ''} onChange={(e) => setPartyForm({ ...partyForm, lawyerPhone: e.target.value })} placeholder="05XX" />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setShowPartyForm(false); setPartyForm(emptyPartyForm()); }}>إلغاء</Button>
                      <Button size="sm" className="h-7 text-xs bg-teal-700 hover:bg-teal-800" onClick={handleAddParty}>إضافة</Button>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* ===== التأجيلات (Inline Management) ===== */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm text-teal-700 dark:text-teal-400 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    التأجيلات ({caseDelays.length})
                  </h4>
                  {!showDelayForm && (
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setShowDelayForm(true)}>
                      <Plus className="w-3 h-3 ml-1" /> إضافة تأجيل
                    </Button>
                  )}
                </div>

                {caseDelays.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {caseDelays.map((d) => (
                      <div key={d.id} className="flex items-start justify-between p-3 rounded-lg bg-muted/50 text-sm">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 flex-1">
                          <div><span className="text-muted-foreground">تاريخ التأجيل: </span>{formatDate(d.delayDate)}</div>
                          <div><span className="text-muted-foreground">السبب: </span>{d.reason}</div>
                          {d.newDate && <div><span className="text-muted-foreground">التاريخ الجديد: </span>{formatDate(d.newDate)}</div>}
                          {d.notes && <div><span className="text-muted-foreground">ملاحظات: </span>{d.notes}</div>}
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0" onClick={() => d.id && handleDeleteDelay(d.id)}>
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {showDelayForm && (
                  <div className="p-3 rounded-lg border border-dashed space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-1.5">
                        <Label className="text-xs">تاريخ التأجيل *</Label>
                        <Input type="date" className="h-8 text-sm" value={delayForm.delayDate || ''} onChange={(e) => setDelayForm({ ...delayForm, delayDate: e.target.value })} />
                      </div>
                      <div className="grid gap-1.5">
                        <Label className="text-xs">السبب *</Label>
                        <Input className="h-8 text-sm" value={delayForm.reason || ''} onChange={(e) => setDelayForm({ ...delayForm, reason: e.target.value })} placeholder="سبب التأجيل" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-1.5">
                        <Label className="text-xs">التاريخ الجديد</Label>
                        <Input type="date" className="h-8 text-sm" value={delayForm.newDate || ''} onChange={(e) => setDelayForm({ ...delayForm, newDate: e.target.value })} />
                      </div>
                      <div className="grid gap-1.5">
                        <Label className="text-xs">ملاحظات</Label>
                        <Input className="h-8 text-sm" value={delayForm.notes || ''} onChange={(e) => setDelayForm({ ...delayForm, notes: e.target.value })} placeholder="ملاحظات" />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setShowDelayForm(false); setDelayForm(emptyDelayForm()); }}>إلغاء</Button>
                      <Button size="sm" className="h-7 text-xs bg-teal-700 hover:bg-teal-800" onClick={handleAddDelay}>إضافة</Button>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* الجلسات */}
              <div>
                <h4 className="font-semibold text-sm mb-2 text-teal-700 dark:text-teal-400 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  الجلسات ({caseSessions.length})
                </h4>
                {caseSessions.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {caseSessions.map((s) => (
                      <div key={s.id} className="text-sm p-2 rounded bg-muted/50 flex justify-between items-center">
                        <span>{formatDate(s.date)} {s.time && <span dir="ltr">({s.time})</span>}</span>
                        <span className="text-muted-foreground">{s.court || ''}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">لا توجد جلسات</p>
                )}
              </div>

              {/* سجل المدفوعات */}
              <div>
                <h4 className="font-semibold text-sm mb-2 text-teal-700 dark:text-teal-400 flex items-center gap-1">
                  <Banknote className="w-4 h-4" />
                  سجل المدفوعات ({casePayments.length})
                </h4>
                {casePayments.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {casePayments.map((p) => (
                      <div key={p.id} className="text-sm p-2 rounded bg-muted/50 flex justify-between items-center">
                        <span className="truncate ml-2">{p.description || p.category}</span>
                        <span className={p.type === 'income' ? 'text-emerald-600 dark:text-emerald-400 shrink-0' : 'text-red-600 dark:text-red-400 shrink-0'}>
                          {p.type === 'income' ? '+' : '-'}{fmtCurrency(p.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">لا توجد مدفوعات</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setViewOpen(false);
                    setTimeout(() => openEdit(selectedCase), 200);
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
                    setTimeout(() => openDelete(selectedCase), 200);
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
              هل أنت متأكد من حذف القضية &quot;{selectedCase?.subject}&quot;؟ سيتم حذف جميع الأطراف والتأجيلات المرتبطة أيضاً. لا يمكن التراجع عن هذا الإجراء.
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
