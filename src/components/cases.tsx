'use client';

import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, formatCurrency, type Case, type Client, type JudicialBody } from '@/lib/db';
import { STATUS_COLORS, CASE_NATURES, CASE_STATUSES, LITIGATION_STAGES, PARTY_ROLES, JUDICIAL_CHAMBERS, WILAYAS, JUDICIARY_TYPES, ORDINARY_COURT_LEVELS, ADMIN_COURT_LEVELS, CHAMBER_NUMBERS, formatDate } from '@/lib/constants';
import { CasePrintButton } from '@/components/case-print';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  Archive,
  ChevronRight,
  X,
  UserPlus,
  Clock,
  Wallet,
} from 'lucide-react';

// Status border colors for case cards
const STATUS_BORDER_COLORS: Record<string, string> = {
  'جارية': 'border-r-emerald-500',
  'مؤرشفة': 'border-r-gray-400',
  'للجدولة': 'border-r-amber-500',
  'مفصول فيها': 'border-r-sky-500',
};

interface PartyRow {
  id: string;
  role?: string;
  name?: string;
  phone?: string;
  lawyerName?: string;
  lawyerPhone?: string;
}

interface DelayRow {
  id: string;
  delayDate?: string;
  reason?: string;
  notes?: string;
}

const emptyParty = (): PartyRow => ({
  id: crypto.randomUUID(),
});

const emptyDelay = (): DelayRow => ({
  id: crypto.randomUUID(),
});

function CasesSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-10 w-full sm:w-40 rounded-lg" />
        <Skeleton className="h-10 w-full sm:w-40 rounded-lg" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-14 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-3/4" />
                  <div className="flex gap-3">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="space-y-2 shrink-0">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function Cases() {
  const { selectedCaseId, setSelectedCaseId } = useAppStore();
  const [view, setView] = useState<'list' | 'detail' | 'form'>('list');
  const [editingCase, setEditingCase] = useState<Case | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [cumulativeMode, setCumulativeMode] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [archiveConfirm, setArchiveConfirm] = useState<number | null>(null);

  // فلاتر
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterNature, setFilterNature] = useState<string>('all');

  // بيانات النموذج
  const [formData, setFormData] = useState<Partial<Case>>({});
  const [parties, setParties] = useState<PartyRow[]>([emptyParty()]);
  const [delays, setDelays] = useState<DelayRow[]>([]);

  const cases = useLiveQuery(() => db.cases.toArray());
  const clients = useLiveQuery(() => db.clients.toArray());
  const allParties = useLiveQuery(() => db.parties.toArray());
  const allDelays = useLiveQuery(() => db.delays.toArray());
  const judicialBodies = useLiveQuery(() => db.judicialBodies.toArray());
  const allSessions = useLiveQuery(() => db.sessions.toArray());

  // الهيئات القضائية المفلترة حسب النوع والولاية
  const filteredBodies = useMemo(() => {
    if (!judicialBodies) return [];
    let bodies = [...judicialBodies];
    if (formData.judiciaryType === 'supreme') {
      bodies = bodies.filter(b => b.type === 'supreme');
    } else if (formData.judiciaryType === 'ordinary') {
      if (formData.courtLevel === 'council') {
        bodies = bodies.filter(b => b.type === 'council');
      } else if (formData.courtLevel === 'court') {
        bodies = bodies.filter(b => b.type === 'court');
      } else {
        bodies = bodies.filter(b => b.type === 'council' || b.type === 'court');
      }
    } else if (formData.judiciaryType === 'admin') {
      if (formData.courtLevel === 'admin_appeal') {
        bodies = bodies.filter(b => b.type === 'admin_appeal');
      } else if (formData.courtLevel === 'admin_first') {
        bodies = bodies.filter(b => b.type === 'admin_first');
      } else if (formData.courtLevel === 'commercial') {
        bodies = bodies.filter(b => b.type === 'commercial');
      } else {
        bodies = bodies.filter(b => ['admin_appeal', 'admin_first', 'commercial'].includes(b.type));
      }
    }
    if (formData.wilayaId) {
      bodies = bodies.filter(b => b.wilayaId === formData.wilayaId);
    }
    return bodies;
  }, [judicialBodies, formData.judiciaryType, formData.courtLevel, formData.wilayaId]);

  // الغرف المتاحة من الهيئة المختارة
  const availableChambers = useMemo(() => {
    if (!formData.courtId || !judicialBodies) return JUDICIAL_CHAMBERS;
    const body = judicialBodies.find(b => b.id === formData.courtId);
    if (!body || !body.chambers) return JUDICIAL_CHAMBERS;
    try {
      const parsed = JSON.parse(body.chambers) as { name: string; number: number | null }[];
      if (parsed.length > 0) {
        return parsed.map(ch => ch.number && ch.number > 0 ? `${ch.name} رقم ${String(ch.number).padStart(2, '0')}` : ch.name);
      }
    } catch { /* fallback */ }
    return JUDICIAL_CHAMBERS;
  }, [formData.courtId, judicialBodies]);

  // عند اختيار قضية من المتجر
  React.useEffect(() => {
    if (selectedCaseId) {
      setView('detail');
    }
  }, [selectedCaseId]);

  // خريطة الموكلين
  const clientMap = useMemo(() => {
    const map: Record<number, Client> = {};
    clients?.forEach((c) => { if (c.id) map[c.id] = c; });
    return map;
  }, [clients]);

  // تصفية القضايا
  const filteredCases = useMemo(() => {
    if (!cases) return [];
    return cases.filter((c) => {
      const clientName = c.clientId ? clientMap[c.clientId]?.name : '';
      const matchSearch = !searchTerm ||
        c.caseNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.courtName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.councilName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        clientName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = filterStatus === 'all' || c.status === filterStatus;
      const matchNature = filterNature === 'all' || c.caseNature === filterNature;
      return matchSearch && matchStatus && matchNature;
    });
  }, [cases, clientMap, searchTerm, filterStatus, filterNature]);

  // عدد القضايا لكل حالة (للفلاتر)
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    cases?.forEach((c) => {
      if (c.status) {
        counts[c.status] = (counts[c.status] || 0) + 1;
      }
    });
    return counts;
  }, [cases]);

  const selectedCase = cases?.find((c) => c.id === selectedCaseId);
  const caseParties = allParties?.filter((p) => p.caseId === selectedCaseId);
  const caseDelays = allDelays?.filter((d) => d.caseId === selectedCaseId);
  const caseSessions = allSessions?.filter((s) => s.caseId === selectedCaseId);

  function resetForm() {
    setFormData({});
    setParties([emptyParty()]);
    setDelays([]);
    setEditingCase(null);
  }

  function openAddForm() {
    resetForm();
    setShowForm(true);
    setCumulativeMode(false);
  }

  function openEditForm(c: Case) {
    setEditingCase(c);
    setFormData({ ...c });

    // تحميل الأطراف
    const cParties = allParties?.filter((p) => p.caseId === c.id) || [];
    if (cParties.length > 0) {
      setParties(cParties.map((p) => ({
        id: String(p.id),
        role: p.role,
        name: p.name,
        phone: p.phone,
        lawyerName: p.lawyerName,
        lawyerPhone: p.lawyerPhone,
      })));
    } else {
      setParties([emptyParty()]);
    }

    // تحميل التأجيلات
    const cDelays = allDelays?.filter((d) => d.caseId === c.id) || [];
    if (cDelays.length > 0) {
      setDelays(cDelays.map((d) => ({
        id: String(d.id),
        delayDate: d.delayDate,
        reason: d.reason,
        notes: d.notes,
      })));
    } else {
      setDelays([]);
    }

    setShowForm(true);
    setCumulativeMode(false);
  }

  async function saveCase() {
    const now = new Date();

    if (editingCase?.id) {
      // تحديث قضية
      await db.cases.update(editingCase.id, {
        ...formData,
        updatedAt: now,
      });

      // حذف الأطراف القديمة وإضافة الجديدة
      await db.parties.where('caseId').equals(editingCase.id).delete();
      for (const party of parties) {
        if (party.name || party.role) {
          await db.parties.add({
            caseId: editingCase.id,
            role: party.role,
            name: party.name,
            phone: party.phone,
            lawyerName: party.lawyerName,
            lawyerPhone: party.lawyerPhone,
            createdAt: now,
            updatedAt: now,
          });
        }
      }

      // حذف التأجيلات القديمة وإضافة الجديدة
      await db.delays.where('caseId').equals(editingCase.id).delete();
      for (const delay of delays) {
        if (delay.delayDate || delay.reason) {
          await db.delays.add({
            caseId: editingCase.id,
            delayDate: delay.delayDate,
            reason: delay.reason,
            notes: delay.notes,
            createdAt: now,
            updatedAt: now,
          });
        }
      }

      toast.success('تم تحديث القضية بنجاح');
    } else {
      // إضافة قضية جديدة
      const caseId = await db.cases.add({
        ...formData,
        createdAt: now,
        updatedAt: now,
      });

      // إضافة الأطراف
      for (const party of parties) {
        if (party.name || party.role) {
          await db.parties.add({
            caseId: caseId as number,
            role: party.role,
            name: party.name,
            phone: party.phone,
            lawyerName: party.lawyerName,
            lawyerPhone: party.lawyerPhone,
            createdAt: now,
            updatedAt: now,
          });
        }
      }

      // إضافة التأجيلات
      for (const delay of delays) {
        if (delay.delayDate || delay.reason) {
          await db.delays.add({
            caseId: caseId as number,
            delayDate: delay.delayDate,
            reason: delay.reason,
            notes: delay.notes,
            createdAt: now,
            updatedAt: now,
          });
        }
      }

      toast.success('تم إضافة القضية بنجاح');

      if (cumulativeMode) {
        // الادخال التراكمي - إبقاء النموذج مفتوح
        resetForm();
      } else {
        setShowForm(false);
        resetForm();
      }
    }
  }

  async function deleteCase(id: number) {
    await db.parties.where('caseId').equals(id).delete();
    await db.delays.where('caseId').equals(id).delete();
    await db.cases.delete(id);
    if (selectedCaseId === id) {
      setSelectedCaseId(null);
      setView('list');
    }
    setDeleteConfirm(null);
    toast.success('تم حذف القضية');
  }

  async function archiveCase(id: number) {
    const c = await db.cases.get(id);
    if (!c) return;

    const cParties = await db.parties.where('caseId').equals(id).toArray();
    const cDelays = await db.delays.where('caseId').equals(id).toArray();

    await db.archives.add({
      caseId: id,
      caseData: JSON.stringify({ ...c, parties: cParties, delays: cDelays }),
      archiveDate: new Date().toISOString(),
      reason: 'أرشفة',
      createdAt: new Date(),
    });

    await db.cases.update(id, { status: 'مؤرشفة', updatedAt: new Date() });
    setArchiveConfirm(null);
    toast.success('تم أرشفة القضية');
  }

  // Loading state
  if (!cases || !clients || !judicialBodies) {
    return <CasesSkeleton />;
  }

  // ========================================================================
  // عرض التفاصيل
  // ========================================================================
  if (view === 'detail' && selectedCase) {
    const remaining = (selectedCase.totalFees || 0) - (selectedCase.paidAmount || 0);

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="sm" onClick={() => { setView('list'); setSelectedCaseId(null); }} className="touch-target">
            <ChevronRight className="w-4 h-4 ml-1" />
            العودة للقائمة
          </Button>
        </div>

        {/* المعلومات الأساسية */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-lg font-extrabold">{selectedCase.caseNumber || '—'}</CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={`${STATUS_COLORS[selectedCase.status || ''] || ''}`}>
                  {selectedCase.status}
                </Badge>
                <CasePrintButton
                  caseData={selectedCase}
                  parties={caseParties || []}
                  delays={caseDelays || []}
                  sessions={caseSessions || []}
                />
                <Button variant="outline" size="sm" onClick={() => openEditForm(selectedCase)} className="touch-target">
                  <Pencil className="w-3 h-3 ml-1" />
                  تعديل
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm font-semibold">{selectedCase.subject || '—'}</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              {selectedCase.clientId && clientMap[selectedCase.clientId] && (
                <DetailField label="الموكل" value={clientMap[selectedCase.clientId].name} />
              )}
              <DetailField label="طبيعة القضية" value={selectedCase.caseNature} />
              <DetailField label="مرحلة التقاضي" value={selectedCase.litigationStage} />
              <DetailField label="رقم القضية الأصلية" value={selectedCase.origCaseNumber} />
              <DetailField label="المجلس" value={selectedCase.councilName} />
              <DetailField label="المحكمة" value={selectedCase.courtName} />
              <DetailField label="الغرفة/القسم" value={selectedCase.chamber} />
              <DetailField label="هاتف قاعة المحامين" value={selectedCase.barPhone} />
              <DetailField label="تاريخ التسجيل" value={formatDate(selectedCase.registrationDate)} />
              <DetailField label="أول جلسة" value={formatDate(selectedCase.firstSessionDate)} />
              <DetailField label="تاريخ المداولة" value={formatDate(selectedCase.delibDate)} />
            </div>

            {/* المالية */}
            <Separator />
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
                <p className="text-xs text-muted-foreground">الأتعاب</p>
                <p className="text-sm font-extrabold text-teal-700 dark:text-teal-400 tabular-nums">{formatCurrency(selectedCase.totalFees)}</p>
              </div>
              <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <p className="text-xs text-muted-foreground">المدفوع</p>
                <p className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums">{formatCurrency(selectedCase.paidAmount)}</p>
              </div>
              <div className={`text-center p-3 rounded-lg ${remaining > 0 ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20'}`}>
                <p className="text-xs text-muted-foreground">المتبقي</p>
                <p className={`text-sm font-extrabold tabular-nums ${remaining > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>{formatCurrency(remaining)}</p>
              </div>
            </div>

            {/* منطوق الحكم */}
            {selectedCase.judgment && (
              <>
                <Separator />
                <div>
                  <Label className="text-xs text-muted-foreground">منطوق الحكم</Label>
                  <p className="text-sm mt-1 p-3 bg-muted/50 rounded-lg whitespace-pre-wrap leading-relaxed">{selectedCase.judgment}</p>
                </div>
              </>
            )}

            {/* ملاحظات */}
            {selectedCase.notes && (
              <div>
                <Label className="text-xs text-muted-foreground">ملاحظات</Label>
                <p className="text-sm mt-1 p-3 bg-muted/50 rounded-lg whitespace-pre-wrap leading-relaxed">{selectedCase.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* أطراف النزاع */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              أطراف النزاع
            </CardTitle>
          </CardHeader>
          <CardContent>
            {caseParties && caseParties.length > 0 ? (
              <div className="space-y-2">
                {caseParties.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg border">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{p.role || '—'}</Badge>
                        <span className="text-sm font-medium">{p.name || '—'}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {p.phone && <span>هاتف: {p.phone}</span>}
                        {p.lawyerName && <span>محامي: {p.lawyerName}</span>}
                        {p.lawyerPhone && <span>هاتف المحامي: {p.lawyerPhone}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-3">لا توجد أطراف مسجلة</p>
            )}
          </CardContent>
        </Card>

        {/* التأجيلات */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Clock className="w-4 h-4" />
              التأجيلات
            </CardTitle>
          </CardHeader>
          <CardContent>
            {caseDelays && caseDelays.length > 0 ? (
              <div className="space-y-2">
                {caseDelays.map((d) => (
                  <div key={d.id} className="flex items-center justify-between p-2.5 rounded-lg border">
                    <div>
                      <p className="text-sm font-medium">{d.reason || '—'}</p>
                      {d.notes && <p className="text-xs text-muted-foreground">{d.notes}</p>}
                    </div>
                    <Badge variant="outline" className="text-xs">{formatDate(d.delayDate)}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-3">لا توجد تأجيلات</p>
            )}
          </CardContent>
        </Card>

        {/* أزرار الإجراءات */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => selectedCase.id && setDeleteConfirm(selectedCase.id)}
            className="touch-target"
          >
            <Trash2 className="w-3 h-3 ml-1" />
            حذف
          </Button>
          {selectedCase.status !== 'مؤرشفة' && selectedCase.id && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setArchiveConfirm(selectedCase.id!)}
              className="touch-target"
            >
              <Archive className="w-3 h-3 ml-1" />
              أرشفة
            </Button>
          )}
        </div>

        {/* تأكيد الحذف */}
        <AlertDialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت متأكد من حذف هذه القضية؟ لا يمكن التراجع عن هذا الإجراء.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteConfirm && deleteCase(deleteConfirm)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* تأكيد الأرشفة */}
        <AlertDialog open={archiveConfirm !== null} onOpenChange={() => setArchiveConfirm(null)}>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>تأكيد الأرشفة</AlertDialogTitle>
              <AlertDialogDescription>
                سيتم أرشفة هذه القضية ويمكن استرجاعها من قسم الأرشيف.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction onClick={() => archiveConfirm && archiveCase(archiveConfirm)}>
                أرشفة
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // ========================================================================
  // عرض القائمة
  // ========================================================================
  return (
    <div className="space-y-4">
      {/* شريط البحث والفلاتر */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث برقم القضية، الموضوع، المحكمة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-9 h-11"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-auto h-11 min-w-[140px]">
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              كل الحالات ({(cases?.length ?? 0).toLocaleString('en-US')})
            </SelectItem>
            {CASE_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                <div className="flex items-center gap-2">
                  <span>{s}</span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 tabular-nums">
                    {(statusCounts[s] || 0).toLocaleString('en-US')}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterNature} onValueChange={setFilterNature}>
          <SelectTrigger className="w-full sm:w-auto h-11 min-w-[140px]">
            <SelectValue placeholder="الطبيعة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الأنواع</SelectItem>
            {CASE_NATURES.map((n) => (
              <SelectItem key={n} value={n}>{n}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={openAddForm} className="bg-teal-600 hover:bg-teal-700 shrink-0 h-11 touch-target">
          <Plus className="w-4 h-4 ml-1" />
          إضافة قضية
        </Button>
      </div>

      {/* قائمة القضايا */}
      <div className="space-y-2">
        {filteredCases.length > 0 ? (
          filteredCases
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((c) => {
              const remaining = (c.totalFees || 0) - (c.paidAmount || 0);
              const borderColor = STATUS_BORDER_COLORS[c.status || ''] || 'border-r-gray-300';
              return (
                <Card
                  key={c.id}
                  className={`cursor-pointer hover:shadow-md transition-all duration-200 border-r-4 ${borderColor}`}
                  onClick={() => {
                    setSelectedCaseId(c.id ?? null);
                    setView('detail');
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-extrabold">{c.caseNumber || '—'}</span>
                          <Badge className={`${STATUS_COLORS[c.status || ''] || ''} text-xs`}>
                            {c.status}
                          </Badge>
                          {c.caseNature && (
                            <Badge variant="outline" className="text-xs">{c.caseNature}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 truncate">{c.subject || '—'}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                          {c.clientId && clientMap[c.clientId] && <span className="text-teal-600 dark:text-teal-400 font-semibold">{clientMap[c.clientId].name}</span>}
                          {c.courtName && <span>{c.courtName}</span>}
                          {c.chamber && <span>• {c.chamber}</span>}
                          {c.registrationDate && <span>• {formatDate(c.registrationDate)}</span>}
                        </div>
                      </div>
                      <div className="text-left shrink-0 space-y-1">
                        {c.totalFees ? (
                          <>
                            <p className="text-xs text-muted-foreground">الأتعاب</p>
                            <p className="text-sm font-extrabold tabular-nums">{formatCurrency(c.totalFees)}</p>
                            {remaining > 0 && (
                              <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-md">
                                <Wallet className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                <p className="text-xs font-bold text-amber-700 dark:text-amber-400 tabular-nums">{formatCurrency(remaining)}</p>
                              </div>
                            )}
                          </>
                        ) : null}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">لا توجد قضايا مطابقة</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* نافذة إضافة/تعديل القضية */}
      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto smooth-scroll" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold">{editingCase ? 'تعديل القضية' : 'إضافة قضية جديدة'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* المعلومات الأساسية */}
            <div>
              <h3 className="text-sm font-bold mb-3 text-teal-700 dark:text-teal-400">المعلومات الأساسية</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">رقم القضية</Label>
                  <Input
                    value={formData.caseNumber || ''}
                    onChange={(e) => setFormData({ ...formData, caseNumber: e.target.value })}
                    placeholder="رقم القضية"
                    className="h-11"
                  />
                </div>
                <div>
                  <Label className="text-xs">الموضوع</Label>
                  <Input
                    value={formData.subject || ''}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="موضوع القضية"
                    className="h-11"
                  />
                </div>
                <div>
                  <Label className="text-xs">طبيعة القضية</Label>
                  <Select value={formData.caseNature || ''} onValueChange={(v) => setFormData({ ...formData, caseNature: v === '_empty' ? '' : v })}>
                    <SelectTrigger className="h-11"><SelectValue placeholder="اختر الطبيعة" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_empty">—</SelectItem>
                      {CASE_NATURES.map((n) => (
                        <SelectItem key={n} value={n}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">حالة القضية</Label>
                  <Select value={formData.status || ''} onValueChange={(v) => setFormData({ ...formData, status: v === '_empty' ? '' : v })}>
                    <SelectTrigger className="h-11"><SelectValue placeholder="اختر الحالة" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_empty">—</SelectItem>
                      {CASE_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">مرحلة التقاضي</Label>
                  <Select value={formData.litigationStage || ''} onValueChange={(v) => setFormData({ ...formData, litigationStage: v === '_empty' ? '' : v })}>
                    <SelectTrigger className="h-11"><SelectValue placeholder="اختر المرحلة" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_empty">—</SelectItem>
                      {LITIGATION_STAGES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">رقم القضية الأصلية</Label>
                  <Input
                    value={formData.origCaseNumber || ''}
                    onChange={(e) => setFormData({ ...formData, origCaseNumber: e.target.value })}
                    placeholder="للاستئناف/المعارضة"
                    className="h-11"
                  />
                </div>
                <div>
                  <Label className="text-xs">الموكل</Label>
                  <Select value={formData.clientId?.toString() || '_empty'} onValueChange={(v) => setFormData({ ...formData, clientId: v === '_empty' ? undefined : Number(v) })}>
                    <SelectTrigger className="h-11"><SelectValue placeholder="اختر الموكل" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_empty">— بدون موكل —</SelectItem>
                      {clients?.sort((a, b) => (a.name || '').localeCompare(b.name || '')).map((cl) => (
                        <SelectItem key={cl.id} value={cl.id!.toString()}>{cl.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* التسلسل القضائي */}
            <div>
              <h3 className="text-sm font-bold mb-3 text-teal-700 dark:text-teal-400">التسلسل القضائي</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* نوع القضاء */}
                <div>
                  <Label className="text-xs">نوع القضاء</Label>
                  <Select value={formData.judiciaryType || ''} onValueChange={(v) => {
                    const newData = { ...formData, judiciaryType: v, courtLevel: undefined, courtId: undefined, wilayaId: undefined, chamber: '', councilName: '', courtName: '' };
                    if (v === 'supreme') {
                      newData.courtLevel = 'supreme';
                      newData.councilName = 'المحكمة العليا';
                      newData.courtName = 'المحكمة العليا';
                      const supreme = judicialBodies?.find(b => b.type === 'supreme');
                      if (supreme?.id) newData.courtId = supreme.id;
                    }
                    setFormData(newData);
                  }}>
                    <SelectTrigger className="h-11"><SelectValue placeholder="اختر نوع القضاء" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_empty">—</SelectItem>
                      {JUDICIARY_TYPES.map((jt) => (
                        <SelectItem key={jt.value} value={jt.value}>{jt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* مستوى المحكمة - يظهر فقط للقضاء العادي أو الإداري */}
                {formData.judiciaryType === 'ordinary' && (
                  <div>
                    <Label className="text-xs">مستوى المحكمة</Label>
                    <Select value={formData.courtLevel || ''} onValueChange={(v) => {
                      setFormData({ ...formData, courtLevel: v, courtId: undefined, chamber: '', councilName: '', courtName: '' });
                    }}>
                      <SelectTrigger className="h-11"><SelectValue placeholder="اختر المستوى" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_empty">—</SelectItem>
                        {ORDINARY_COURT_LEVELS.map((cl) => (
                          <SelectItem key={cl.value} value={cl.value}>{cl.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {formData.judiciaryType === 'admin' && (
                  <div>
                    <Label className="text-xs">نوع المحكمة الإدارية</Label>
                    <Select value={formData.courtLevel || ''} onValueChange={(v) => {
                      setFormData({ ...formData, courtLevel: v, courtId: undefined, chamber: '', councilName: '', courtName: '' });
                    }}>
                      <SelectTrigger className="h-11"><SelectValue placeholder="اختر النوع" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_empty">—</SelectItem>
                        {ADMIN_COURT_LEVELS.map((cl) => (
                          <SelectItem key={cl.value} value={cl.value}>{cl.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* الولاية */}
                {formData.judiciaryType && formData.judiciaryType !== 'supreme' && (
                  <div>
                    <Label className="text-xs">الولاية</Label>
                    <Select value={formData.wilayaId?.toString() || ''} onValueChange={(v) => {
                      setFormData({ ...formData, wilayaId: v ? Number(v) : undefined, courtId: undefined, chamber: '', councilName: '', courtName: '' });
                    }}>
                      <SelectTrigger className="h-11"><SelectValue placeholder="اختر الولاية" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_empty">—</SelectItem>
                        {WILAYAS.map((w) => (
                          <SelectItem key={w.code} value={w.code.toString()}>{w.code} - {w.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* الهيئة القضائية */}
                {filteredBodies.length > 0 && formData.judiciaryType !== 'supreme' && (
                  <div>
                    <Label className="text-xs">الهيئة القضائية</Label>
                    <Select value={formData.courtId?.toString() || ''} onValueChange={(v) => {
                      const body = judicialBodies?.find(b => b.id === Number(v));
                      setFormData({
                        ...formData,
                        courtId: Number(v),
                        courtName: body?.name || '',
                        councilName: body?.type === 'council' ? body.name : formData.councilName,
                        chamber: '',
                      });
                    }}>
                      <SelectTrigger className="h-11"><SelectValue placeholder="اختر الهيئة" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_empty">—</SelectItem>
                        {filteredBodies.map((b) => (
                          <SelectItem key={b.id} value={b.id!.toString()}>{b.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* الغرفة/القسم */}
                <div>
                  <Label className="text-xs">الغرفة/القسم</Label>
                  <Select value={formData.chamber || ''} onValueChange={(v) => setFormData({ ...formData, chamber: v === '_empty' ? '' : v })}>
                    <SelectTrigger className="h-11"><SelectValue placeholder="اختر الغرفة" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_empty">—</SelectItem>
                      {availableChambers.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* المجلس - يدوياً أو من الهيئة */}
                <div>
                  <Label className="text-xs">المجلس</Label>
                  <Input
                    value={formData.councilName || ''}
                    onChange={(e) => setFormData({ ...formData, councilName: e.target.value })}
                    placeholder="اسم المجلس"
                    className="h-11"
                  />
                </div>

                {/* المحكمة - يدوياً أو من الهيئة */}
                <div>
                  <Label className="text-xs">المحكمة</Label>
                  <Input
                    value={formData.courtName || ''}
                    onChange={(e) => setFormData({ ...formData, courtName: e.target.value })}
                    placeholder="اسم المحكمة"
                    className="h-11"
                  />
                </div>

                <div>
                  <Label className="text-xs">هاتف قاعة المحامين</Label>
                  <Input
                    value={formData.barPhone || ''}
                    onChange={(e) => setFormData({ ...formData, barPhone: e.target.value })}
                    placeholder="رقم الهاتف"
                    className="h-11"
                  />
                </div>
              </div>
            </div>

            {/* المالية */}
            <div>
              <h3 className="text-sm font-bold mb-3 text-teal-700 dark:text-teal-400">المالية</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">الأتعاب (د.ج)</Label>
                  <Input
                    type="number"
                    value={formData.totalFees ?? ''}
                    onChange={(e) => setFormData({ ...formData, totalFees: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="0"
                    className="h-11"
                  />
                </div>
                <div>
                  <Label className="text-xs">المدفوع (د.ج)</Label>
                  <Input
                    type="number"
                    value={formData.paidAmount ?? ''}
                    onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="0"
                    className="h-11"
                  />
                </div>
                <div>
                  <Label className="text-xs">المتبقي (د.ج)</Label>
                  <Input
                    type="number"
                    value={((formData.totalFees || 0) - (formData.paidAmount || 0)).toLocaleString('en-US')}
                    disabled
                    className="bg-muted h-11"
                  />
                </div>
              </div>
            </div>

            {/* التواريخ */}
            <div>
              <h3 className="text-sm font-bold mb-3 text-teal-700 dark:text-teal-400">التواريخ</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">تاريخ التسجيل</Label>
                  <Input
                    type="date"
                    value={formData.registrationDate || ''}
                    onChange={(e) => setFormData({ ...formData, registrationDate: e.target.value })}
                    className="h-11"
                  />
                </div>
                <div>
                  <Label className="text-xs">أول جلسة</Label>
                  <Input
                    type="date"
                    value={formData.firstSessionDate || ''}
                    onChange={(e) => setFormData({ ...formData, firstSessionDate: e.target.value })}
                    className="h-11"
                  />
                </div>
                <div>
                  <Label className="text-xs">تاريخ المداولة</Label>
                  <Input
                    type="date"
                    value={formData.delibDate || ''}
                    onChange={(e) => setFormData({ ...formData, delibDate: e.target.value })}
                    className="h-11"
                  />
                </div>
              </div>
            </div>

            {/* أطراف النزاع */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-teal-700 dark:text-teal-400">أطراف النزاع</h3>
                <Button variant="outline" size="sm" onClick={() => setParties([...parties, emptyParty()])} className="touch-target">
                  <Plus className="w-3 h-3 ml-1" />
                  إضافة طرف
                </Button>
              </div>
              <div className="space-y-3">
                {parties.map((party, idx) => (
                  <div key={party.id} className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-muted-foreground">الطرف {(idx + 1).toLocaleString('en-US')}</span>
                      {parties.length > 1 && (
                        <Button variant="ghost" size="sm" onClick={() => setParties(parties.filter((p) => p.id !== party.id))} className="touch-target">
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs">المركز القانوني</Label>
                        <Select value={party.role || ''} onValueChange={(v) => {
                          const updated = [...parties];
                          updated[idx] = { ...updated[idx], role: v === '_empty' ? '' : v };
                          setParties(updated);
                        }}>
                          <SelectTrigger className="h-10"><SelectValue placeholder="الدور" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="_empty">—</SelectItem>
                            {PARTY_ROLES.map((r) => (
                              <SelectItem key={r} value={r}>{r}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">الاسم</Label>
                        <Input
                          value={party.name || ''}
                          onChange={(e) => {
                            const updated = [...parties];
                            updated[idx] = { ...updated[idx], name: e.target.value };
                            setParties(updated);
                          }}
                          placeholder="الاسم واللقب"
                          className="h-10"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">الهاتف</Label>
                        <Input
                          value={party.phone || ''}
                          onChange={(e) => {
                            const updated = [...parties];
                            updated[idx] = { ...updated[idx], phone: e.target.value };
                            setParties(updated);
                          }}
                          placeholder="رقم الهاتف"
                          className="h-10"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">اسم المحامي</Label>
                        <Input
                          value={party.lawyerName || ''}
                          onChange={(e) => {
                            const updated = [...parties];
                            updated[idx] = { ...updated[idx], lawyerName: e.target.value };
                            setParties(updated);
                          }}
                          placeholder="اسم المحامي"
                          className="h-10"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">هاتف المحامي</Label>
                        <Input
                          value={party.lawyerPhone || ''}
                          onChange={(e) => {
                            const updated = [...parties];
                            updated[idx] = { ...updated[idx], lawyerPhone: e.target.value };
                            setParties(updated);
                          }}
                          placeholder="هاتف المحامي"
                          className="h-10"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* التأجيلات */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-teal-700 dark:text-teal-400">التأجيلات</h3>
                <Button variant="outline" size="sm" onClick={() => setDelays([...delays, emptyDelay()])} className="touch-target">
                  <Plus className="w-3 h-3 ml-1" />
                  إضافة تأجيل
                </Button>
              </div>
              {delays.length > 0 && (
                <div className="space-y-2">
                  {delays.map((delay, idx) => (
                    <div key={delay.id} className="flex items-end gap-2 p-2 border rounded-lg">
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">تاريخ التأجيل</Label>
                          <Input
                            type="date"
                            value={delay.delayDate || ''}
                            onChange={(e) => {
                              const updated = [...delays];
                              updated[idx] = { ...updated[idx], delayDate: e.target.value };
                              setDelays(updated);
                            }}
                            className="h-10"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">السبب</Label>
                          <Input
                            value={delay.reason || ''}
                            onChange={(e) => {
                              const updated = [...delays];
                              updated[idx] = { ...updated[idx], reason: e.target.value };
                              setDelays(updated);
                            }}
                            placeholder="سبب التأجيل"
                            className="h-10"
                          />
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setDelays(delays.filter((d) => d.id !== delay.id))} className="shrink-0 touch-target">
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* منطوق الحكم وملاحظات */}
            <div>
              <h3 className="text-sm font-bold mb-3 text-teal-700 dark:text-teal-400">معلومات إضافية</h3>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">منطوق الحكم</Label>
                  <Textarea
                    value={formData.judgment || ''}
                    onChange={(e) => setFormData({ ...formData, judgment: e.target.value })}
                    placeholder="منطوق الحكم"
                    rows={3}
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
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            {!editingCase && (
              <Button
                variant="outline"
                onClick={() => setCumulativeMode(!cumulativeMode)}
                className={cumulativeMode ? 'border-teal-500 text-teal-700' : ''}
              >
                {cumulativeMode ? '✓ الادخال التراكمي مفعل' : 'الادخال التراكمي'}
              </Button>
            )}
            <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>
              إلغاء
            </Button>
            <Button onClick={saveCase} className="bg-teal-600 hover:bg-teal-700">
              {editingCase ? 'تحديث' : 'حفظ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}
