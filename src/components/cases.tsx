'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useCases, useClients, useParties, useDelays, useSessions, useJudicialBodies, useLawyers, createCase, updateCase, deleteCase as apiDeleteCase, createParty, updateParty as apiUpdateParty, deleteParty as apiDeleteParty, createDelay, updateDelay as apiUpdateDelay, deleteDelay as apiDeleteDelay, createClient, createJudicialBody, createArchive, syncPartiesToClients } from '@/lib/api';
import { mutate } from 'swr';
import { formatCurrency, STATUS_COLORS, CASE_NATURES, CASE_STATUSES, LITIGATION_STAGES, PARTY_ROLES, JUDICIAL_CHAMBERS, WILAYAS, JUDICIARY_TYPES, ORDINARY_COURT_LEVELS, ADMIN_COURT_LEVELS, CHAMBER_NUMBERS, formatDate } from '@/lib/constants';
import { CasePrintButton } from '@/components/case-print';
import { CaseAnnouncementButton } from '@/components/case-announcement';
import { SelectWithCustom } from '@/components/ui/select-with-custom';
import { ComboboxInput } from '@/components/ui/combobox-input';
import { DuplicateAlert, findDuplicateCaseNumbers, findDuplicatePartyNames } from '@/components/ui/duplicate-alert';
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
  Building2,
  Clock,
  Wallet,
  Phone,
  Trophy,
  XCircle,
  AlertTriangle,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================
interface PartyType {
  id: number;
  caseId: number;
  role?: string;
  side?: string;
  name?: string;
  phone?: string;
  lawyerName?: string;
  lawyerPhone?: string;
  createdAt: string;
  updatedAt: string;
}

interface DelayType {
  id: number;
  caseId: number;
  delayDate?: string;
  reason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface SessionType {
  id: number;
  caseId?: number;
  caseNumber?: string;
  date?: string;
  time?: string;
  court?: string;
  chamber?: string;
  roomNumber?: string;
  notes?: string;
  status?: string;
  result?: string;
  createdAt: string;
  updatedAt: string;
}

interface CaseType {
  id: number;
  caseNumber?: string;
  subject?: string;
  caseNature?: string;
  litigationStage?: string;
  origCaseNumber?: string;
  customStage?: string;
  status?: string;
  clientId?: number;
  wilayaId?: number;
  judiciaryType?: string;
  courtLevel?: string;
  courtId?: number;
  chamber?: string;
  chamberNumber?: number;
  councilName?: string;
  courtName?: string;
  totalFees?: number;
  paidAmount?: number;
  registrationDate?: string;
  firstSessionDate?: string;
  delibDate?: string;
  barPhone?: string;
  lawyer?: string;
  notes?: string;
  judgment?: string;
  caseResult?: string; // 'won' | 'lost' | null
  createdAt: string;
  updatedAt: string;
  client?: { id: number; name?: string };
  parties?: PartyType[];
  delays?: DelayType[];
  sessions?: SessionType[];
}

interface ClientType {
  id: number;
  name?: string;
  phone?: string;
}

interface JudicialBodyType {
  id: number;
  name: string;
  type: string;
  wilayaId?: number;
  parentCouncilId?: number;
  chambers?: string;
  phones?: string;
}

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
  side?: string;
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
  const [editingCase, setEditingCase] = useState<CaseType | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [cumulativeMode, setCumulativeMode] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [archiveConfirm, setArchiveConfirm] = useState<number | null>(null);
  const [deletePartyConfirm, setDeletePartyConfirm] = useState<number | null>(null);

  // حوار إنشاء موكل جديد
  const [showNewClientDialog, setShowNewClientDialog] = useState(false);
  const [newClientData, setNewClientData] = useState<Partial<ClientType>>({});

  // حوار إنشاء هيئة قضائية جديدة
  const [showNewCourtDialog, setShowNewCourtDialog] = useState(false);
  const [newCourtData, setNewCourtData] = useState<Partial<JudicialBodyType>>({});

  // فلاتر
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterNature, setFilterNature] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'active' | 'archived' | 'pending'>('active');

  // بيانات النموذج
  const [formData, setFormData] = useState<Partial<CaseType>>({});
  const [parties, setParties] = useState<PartyRow[]>([emptyParty()]);
  const [delays, setDelays] = useState<DelayRow[]>([]);
  const [caseDuplicateWarning, setCaseDuplicateWarning] = useState<any[] | null>(null);
  const [forceSaveCase, setForceSaveCase] = useState(false);

  const { cases, isLoading: casesLoading } = useCases();
  const { clients, isLoading: clientsLoading } = useClients();
  const { parties: allParties } = useParties();
  const { delays: allDelays } = useDelays();
  const { judicialBodies, isLoading: bodiesLoading } = useJudicialBodies();
  const { sessions: allSessions } = useSessions();
  const { lawyers } = useLawyers();

  // مزامنة الأطراف مع الموكلين عند التحميل (مرة واحدة)
  useEffect(() => {
    if (allParties?.length && clients?.length !== undefined) {
      // تحقق هل كل الأطراف لها موكل مقابل
      const clientNameSet = new Set(clients.map((c: any) => c.name?.trim().toLowerCase()).filter(Boolean));
      const missingParties = allParties.filter((p: any) => p.name?.trim() && !clientNameSet.has(p.name.trim().toLowerCase()));
      if (missingParties.length > 0) {
        syncPartiesToClients().catch(() => {});
      }
    }
  }, [allParties, clients]);

  // قائمة أسماء المحامين للاكمال التراكمي
  const lawyerNameSuggestions = useMemo(() => {
    const names = new Set<string>();
    lawyers?.forEach((l: any) => { if (l.name?.trim()) names.add(l.name.trim()); });
    // إضافة أسماء محامي الأطراف من القضايا
    allParties?.forEach((p: any) => { if (p.lawyerName?.trim()) names.add(p.lawyerName.trim()); });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [lawyers, allParties]);

  // قائمة أسماء الموكلين لاقتراحات الأطراف
  const clientNameSuggestions = useMemo(() => {
    const names = new Set<string>();
    clients?.forEach((c: any) => { if (c.name?.trim()) names.add(c.name.trim()); });
    // إضافة أسماء الأطراف من جميع القضايا
    allParties?.forEach((p: any) => { if (p.name?.trim()) names.add(p.name.trim()); });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [clients, allParties]);

  // خريطة الموكلين حسب الاسم للبحث السريع
  const clientByNameMap = useMemo(() => {
    const map: Record<string, any> = {};
    clients?.forEach((c: any) => {
      if (c.name?.trim()) {
        map[c.name.trim().toLowerCase()] = c;
      }
    });
    return map;
  }, [clients]);

  // خريطة المحامين حسب الاسم للبحث السريع
  const lawyerByNameMap = useMemo(() => {
    const map: Record<string, any> = {};
    lawyers?.forEach((l: any) => {
      if (l.name?.trim()) {
        map[l.name.trim().toLowerCase()] = l;
      }
    });
    return map;
  }, [lawyers]);

  // خريطة أرقام هواتف محامي الأطراف من القضايا السابقة
  const partyLawyerPhoneMap = useMemo(() => {
    const map: Record<string, string> = {};
    allParties?.forEach((p: any) => {
      if (p.lawyerName?.trim() && p.lawyerPhone?.trim()) {
        map[p.lawyerName.trim().toLowerCase()] = p.lawyerPhone.trim();
      }
    });
    return map;
  }, [allParties]);

  // خريطة هواتف الأطراف من القضايا السابقة
  const partyPhoneMap = useMemo(() => {
    const map: Record<string, string> = {};
    allParties?.forEach((p: any) => {
      if (p.name?.trim() && p.phone?.trim()) {
        map[p.name.trim().toLowerCase()] = p.phone.trim();
      }
    });
    return map;
  }, [allParties]);

  // كشف تكرار رقم القضية أثناء الكتابة
  const caseNumberDuplicates = useMemo(() => {
    if (!formData.caseNumber?.trim() || editingCase?.id) return [];
    return findDuplicateCaseNumbers(formData.caseNumber || '', cases || [], editingCase?.id);
  }, [formData.caseNumber, cases, editingCase]);

  // كشف تكرار أسماء الأطراف داخل نفس القضية
  const partyNameDuplicates = useMemo(() => {
    return findDuplicatePartyNames(parties);
  }, [parties]);

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
    const map: Record<number, ClientType> = {};
    clients?.forEach((c) => { if (c.id) map[c.id] = c; });
    return map;
  }, [clients]);

  // تصفية القضايا
  const filteredCases = useMemo(() => {
    if (!cases) return [];
    return cases.filter((c) => {
      // فلتر التبويب
      let matchTab = false;
      if (activeTab === 'active')   matchTab = c.status === 'جارية';
      if (activeTab === 'archived') matchTab = c.status === 'مؤرشفة' || c.status === 'مفصول فيها';
      if (activeTab === 'pending')  matchTab = c.status === 'للجدولة' || !c.caseNumber;

      const clientName = c.clientId ? clientMap[c.clientId]?.name : '';
      const matchSearch = !searchTerm ||
        c.caseNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.courtName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.councilName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        clientName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchNature = filterNature === 'all' || c.caseNature === filterNature;
      return matchTab && matchSearch && matchNature;
    });
  }, [cases, clientMap, searchTerm, activeTab, filterNature]);

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
  const caseParties = selectedCase?.parties?.length
    ? selectedCase.parties
    : allParties?.filter((p) => p.caseId === selectedCaseId);
  const caseDelays = selectedCase?.delays?.length
    ? selectedCase.delays
    : allDelays?.filter((d) => d.caseId === selectedCaseId);
  const caseSessions = selectedCase?.sessions?.length
    ? selectedCase.sessions
    : allSessions?.filter((s) => s.caseId === selectedCaseId);

  function resetForm() {
    setFormData({});
    setParties([emptyParty()]);
    setDelays([]);
    setEditingCase(null);
    setCaseDuplicateWarning(null);
    setForceSaveCase(false);
  }

  function openAddForm() {
    resetForm();
    setShowForm(true);
    setCumulativeMode(false);
  }

  function openEditForm(c: CaseType) {
    setEditingCase(c);
    setFormData({ ...c });

    // تحميل الأطراف
    const cParties = c.parties?.length
      ? c.parties
      : allParties?.filter((p) => p.caseId === c.id) || [];
    if (cParties.length > 0) {
      setParties(cParties.map((p) => ({
        id: String(p.id),
        role: p.role,
        side: p.side,
        name: p.name,
        phone: p.phone,
        lawyerName: p.lawyerName,
        lawyerPhone: p.lawyerPhone,
      })));
    } else {
      setParties([emptyParty()]);
    }

    // تحميل التأجيلات
    const cDelays = c.delays?.length
      ? c.delays
      : allDelays?.filter((d) => d.caseId === c.id) || [];
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
    try {
    // تنظيف البيانات من الحقول العلاقية قبل الإرسال
    const { client, parties: _p, delays: _d, sessions: _s, payments: _pay, archives: _a, createdAt: _ca, updatedAt: _ua, ...cleanFormData } = formData as any;

    // كشف تكرار رقم القضية (فقط عند الإضافة)
    if (!editingCase?.id && !forceSaveCase) {
      const dupes = findDuplicateCaseNumbers(formData.caseNumber || '', cases || [], editingCase?.id);
      if (dupes.length > 0) {
        setCaseDuplicateWarning(dupes);
        return;
      }
    }

    if (editingCase?.id) {
      // تحديث قضية
      await updateCase(editingCase.id, {
        ...cleanFormData,
        updatedAt: new Date().toISOString(),
      });

      // فرق ذكي للأطراف: تحديث الموجودة، إنشاء الجديدة، حذف المحذوفة
      const existingParties = caseParties || [];
      // خريطة الأطراف القديمة: id رقمي → PartyType
      const existingById = new Map<number, PartyType>();
      existingParties.forEach((p) => { if (p.id) existingById.set(p.id, p); });

      // تحديد الأطراف المرسلة: لها id رقمي (موجودة) أو UUID فقط (جديدة)
      const isNumericId = (id: string) => /^\d+$/.test(id);

      const partiesToUpdate: { row: PartyRow; existing: PartyType }[] = [];
      const partiesToCreate: PartyRow[] = [];
      const updatedExistingIds = new Set<number>();

      for (const row of parties) {
        if (!row.name && !row.role) continue; // تجاهل الأسطر الفارغة
        if (isNumericId(row.id)) {
          const numericId = parseInt(row.id, 10);
          const existing = existingById.get(numericId);
          if (existing) {
            partiesToUpdate.push({ row, existing });
            updatedExistingIds.add(numericId);
          } else {
            // id رقمي لكن غير موجود → إنشاء جديد
            partiesToCreate.push(row);
          }
        } else {
          // UUID فقط → طرف جديد
          partiesToCreate.push(row);
        }
      }

      // الأطراف المحذوفة: موجودة قديماً ولم تُحدَّث
      const partiesToDelete = existingParties.filter(
        (p) => p.id && !updatedExistingIds.has(p.id)
      );

      // تنفيذ العمليات
      for (const { row, existing } of partiesToUpdate) {
        await apiUpdateParty(existing.id, {
          caseId: editingCase.id,
          role: row.role,
          side: row.side,
          name: row.name,
          phone: row.phone,
          lawyerName: row.lawyerName,
          lawyerPhone: row.lawyerPhone,
          updatedAt: new Date().toISOString(),
        });
      }
      for (const row of partiesToCreate) {
        await createParty({
          caseId: editingCase.id,
          role: row.role,
          side: row.side,
          name: row.name,
          phone: row.phone,
          lawyerName: row.lawyerName,
          lawyerPhone: row.lawyerPhone,
        });
        // إضافة تلقائية كموكل إذا لم يكن موجوداً
        await ensureClientForParty(row);
      }
      for (const p of partiesToDelete) {
        await apiDeleteParty(p.id);
      }

      // فرق ذكي للتأجيلات: نفس المنطق
      const existingDelays = caseDelays || [];
      const existingDelaysById = new Map<number, DelayType>();
      existingDelays.forEach((d) => { if (d.id) existingDelaysById.set(d.id, d); });

      const delaysToUpdate: { row: DelayRow; existing: DelayType }[] = [];
      const delaysToCreate: DelayRow[] = [];
      const updatedDelayIds = new Set<number>();

      for (const row of delays) {
        if (!row.delayDate && !row.reason) continue;
        if (isNumericId(row.id)) {
          const numericId = parseInt(row.id, 10);
          const existing = existingDelaysById.get(numericId);
          if (existing) {
            delaysToUpdate.push({ row, existing });
            updatedDelayIds.add(numericId);
          } else {
            delaysToCreate.push(row);
          }
        } else {
          delaysToCreate.push(row);
        }
      }

      const delaysToDelete = existingDelays.filter(
        (d) => d.id && !updatedDelayIds.has(d.id)
      );

      for (const { row, existing } of delaysToUpdate) {
        await apiUpdateDelay(existing.id, {
          caseId: editingCase.id,
          delayDate: row.delayDate,
          reason: row.reason,
          notes: row.notes,
          updatedAt: new Date().toISOString(),
        });
      }
      for (const row of delaysToCreate) {
        await createDelay({
          caseId: editingCase.id,
          delayDate: row.delayDate,
          reason: row.reason,
          notes: row.notes,
        });
      }
      for (const d of delaysToDelete) {
        await apiDeleteDelay(d.id);
      }

      // تحديث cache التأجيلات صراحة لضمان ظهورها في لوحة التحكم
      await mutate('/api/delays');

      toast.success('تم تحديث القضية بنجاح');
      setShowForm(false);
      resetForm();
    } else {
      // إضافة قضية جديدة
      const result = await createCase({
        ...cleanFormData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      const caseId = result.id;

      // إضافة الأطراف + إضافة تلقائية للموكلين
      for (const party of parties) {
        if (party.name || party.role) {
          await createParty({
            caseId,
            role: party.role,
            side: party.side,
            name: party.name,
            phone: party.phone,
            lawyerName: party.lawyerName,
            lawyerPhone: party.lawyerPhone,
          });
          // إضافة تلقائية كموكل إذا لم يكن موجوداً
          await ensureClientForParty(party);
        }
      }

      // إضافة التأجيلات
      for (const delay of delays) {
        if (delay.delayDate || delay.reason) {
          await createDelay({
            caseId,
            delayDate: delay.delayDate,
            reason: delay.reason,
            notes: delay.notes,
          });
        }
      }

      // تحديث cache التأجيلات صراحة لضمان ظهورها في لوحة التحكم
      await mutate('/api/delays');

      toast.success('تم إضافة القضية بنجاح');

      if (cumulativeMode) {
        // الادخال التراكمي - إبقاء النموذج مفتوح
        resetForm();
      } else {
        setShowForm(false);
        resetForm();
      }
    }
    } catch (error) {
      console.error('Save case error:', error);
      toast.error('فشل في حفظ القضية');
    }
  }

  async function handleDeleteParty(id: number) {
    try {
      await apiDeleteParty(id);
      setDeletePartyConfirm(null);
      toast.success('تم حذف الطرف');
    } catch (error) {
      console.error('Delete party error:', error);
      toast.error('فشل في حذف الطرف');
    }
  }

  async function saveNewClient() {
    if (!newClientData.name) {
      toast.error('اسم الموكل مطلوب');
      return;
    }
    try {
      const result = await createClient({
        name: newClientData.name,
        phone: newClientData.phone || '',
      });
      setFormData({ ...formData, clientId: result.id });
      setNewClientData({});
      setShowNewClientDialog(false);
      toast.success('تم إضافة الموكل بنجاح');
    } catch (error) {
      console.error('Save new client error:', error);
      toast.error('فشل في إضافة الموكل');
    }
  }

  // إنشاء موكل جديد من داخل نموذج الأطراف
  const [showPartyClientDialog, setShowPartyClientDialog] = useState(false);
  const [partyClientData, setPartyClientData] = useState<{ name: string; phone: string; partyIdx: number | null }>({ name: '', phone: '', partyIdx: null });

  function openPartyClientDialog(partyIdx: number) {
    const party = parties[partyIdx];
    setPartyClientData({
      name: party?.name || '',
      phone: party?.phone || '',
      partyIdx,
    });
    setShowPartyClientDialog(true);
  }

  async function savePartyClient() {
    if (!partyClientData.name?.trim()) {
      toast.error('اسم الموكل مطلوب');
      return;
    }
    try {
      const result = await createClient({
        name: partyClientData.name.trim(),
        phone: partyClientData.phone || '',
      });
      // تحديث حقل الاسم والهاتف في الطرف
      if (partyClientData.partyIdx !== null) {
        const updated = [...parties];
        updated[partyClientData.partyIdx] = {
          ...updated[partyClientData.partyIdx],
          name: partyClientData.name.trim(),
          phone: partyClientData.phone || updated[partyClientData.partyIdx]?.phone || '',
        };
        setParties(updated);
      }
      setPartyClientData({ name: '', phone: '', partyIdx: null });
      setShowPartyClientDialog(false);
      toast.success('تم إضافة الموكل بنجاح');
    } catch (error) {
      console.error('Save party client error:', error);
      toast.error('فشل في إضافة الموكل');
    }
  }

  // إضافة تلقائية للموكل عند حفظ الطرف (إذا لم يكن موجوداً)
  async function ensureClientForParty(party: PartyRow) {
    if (!party.name?.trim()) return;
    const nameLower = party.name.trim().toLowerCase();
    // تحقق هل الموكل موجود بالفعل
    if (clientByNameMap[nameLower]) return;
    try {
      await createClient({
        name: party.name.trim(),
        phone: party.phone || '',
      });
    } catch (error) {
      // لا نوقف الحفظ إذا فشلت الإضافة التلقائية
      console.error('Auto-create client error:', error);
    }
  }

  async function saveNewCourt() {
    if (!newCourtData.name) {
      toast.error('اسم الهيئة مطلوب');
      return;
    }
    try {
      const result = await createJudicialBody({
        name: newCourtData.name!,
        type: newCourtData.type || formData.courtLevel || '',
        wilayaId: newCourtData.wilayaId,
      });
      const bodyType = newCourtData.type || formData.courtLevel || '';
      setFormData({
        ...formData,
        courtId: result.id,
        courtName: newCourtData.name!,
        councilName: bodyType === 'council' ? newCourtData.name! : formData.councilName,
        chamber: '',
      });
      setNewCourtData({});
      setShowNewCourtDialog(false);
      toast.success('تم إضافة الهيئة القضائية بنجاح');
    } catch (error) {
      console.error('Save new court error:', error);
      toast.error('فشل في إضافة الهيئة القضائية');
    }
  }

  async function handleDeleteCase(id: number) {
    try {
      await apiDeleteCase(id);
      if (selectedCaseId === id) {
        setSelectedCaseId(null);
        setView('list');
      }
      setDeleteConfirm(null);
      toast.success('تم حذف القضية');
    } catch (error) {
      console.error('Delete case error:', error);
      toast.error('فشل في حذف القضية');
    }
  }

  async function archiveCase(id: number) {
    try {
      const c = cases?.find((ca) => ca.id === id);
      if (!c) return;

      const cParties = c.parties?.length
        ? c.parties
        : allParties?.filter((p) => p.caseId === id) || [];
      const cDelays = c.delays?.length
        ? c.delays
        : allDelays?.filter((d) => d.caseId === id) || [];

      await createArchive({
        caseId: id,
        caseData: JSON.stringify({ ...c, parties: cParties, delays: cDelays }),
        archiveDate: new Date().toISOString(),
        reason: 'أرشفة',
      });

      await updateCase(id, { status: 'مؤرشفة', updatedAt: new Date().toISOString() });
      setArchiveConfirm(null);
      toast.success('تم أرشفة القضية');
    } catch (error) {
      console.error('Archive case error:', error);
      toast.error('فشل في أرشفة القضية');
    }
  }

  // Loading state
  if (casesLoading || clientsLoading || bodiesLoading) {
    return <CasesSkeleton />;
  }

  const remaining = (selectedCase?.totalFees || 0) - (selectedCase?.paidAmount || 0);

  return (
    <>
      {/* ========================================================================
          عرض التفاصيل
          ======================================================================== */}
      {view === 'detail' && selectedCase ? (
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
                  courtPhones={judicialBodies?.find(b => b.id === selectedCase.courtId)?.phones}
                />
                <CaseAnnouncementButton
                  caseData={selectedCase}
                  parties={caseParties || []}
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
              {(() => {
                const courtBody = judicialBodies?.find(b => b.id === selectedCase.courtId);
                const courtPhones = courtBody?.phones ? (() => { try { const p = JSON.parse(courtBody.phones); return Array.isArray(p) ? p.filter((x: string) => x.trim()) : []; } catch { return []; } })() : [];
                return courtPhones.length > 0 ? <DetailField label="هاتف المحكمة" value={courtPhones.join(' / ')} /> : null;
              })()}
              <DetailField label="الغرفة/القسم" value={selectedCase.chamber} />
              <DetailField label="هاتف قاعة المحامين" value={selectedCase.barPhone} />
              {selectedCase.caseResult && (
                <div className="col-span-2 md:col-span-3">
                  {selectedCase.caseResult === 'won' ? (
                    <div className="flex items-center gap-2 p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                      <Trophy className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">ربحت القضية</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                      <span className="text-sm font-bold text-red-700 dark:text-red-400">خسرت القضية</span>
                    </div>
                  )}
                </div>
              )}
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
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{p.role || '—'}</Badge>
                        {p.side && (
                          <Badge className={`text-xs ${
                            p.side === 'for'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {p.side === 'for' ? 'في حقه' : 'ضده'}
                          </Badge>
                        )}
                        <span className="text-sm font-medium">{p.name || '—'}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {p.phone && <span>هاتف: {p.phone}</span>}
                        {p.lawyerName && <span>محامي: {p.lawyerName}</span>}
                        {p.lawyerPhone && <span>هاتف المحامي: {p.lawyerPhone}</span>}
                      </div>
                    </div>
                    {caseParties.length > 1 && p.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeletePartyConfirm(p.id!)}
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    )}
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

        {/* الجلسات */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              الجلسات
              {caseSessions && caseSessions.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {caseSessions.length.toLocaleString('en-US')}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {caseSessions && caseSessions.length > 0 ? (
              <div className="space-y-2">
                {[...caseSessions]
                  .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
                  .map((s) => (
                  <div key={s.id} className="p-2.5 rounded-lg border space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`text-xs ${
                          s.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          s.status === 'postponed' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                          s.status === 'cancelled' ? 'bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400' :
                          'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'
                        }`}>
                          {s.status === 'completed' ? 'مكتملة' :
                           s.status === 'postponed' ? 'مؤجلة' :
                           s.status === 'cancelled' ? 'ملغاة' : 'مجدولة'}
                        </Badge>
                        <span className="text-sm font-semibold tabular-nums">{formatDate(s.date)}</span>
                        {s.time && <span className="text-xs text-muted-foreground">{s.time}</span>}
                      </div>
                    </div>
                    {(s.chamber || s.roomNumber || s.notes) && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        {s.chamber && <span>{s.chamber}</span>}
                        {s.roomNumber && <span>• قاعة {s.roomNumber}</span>}
                        {s.notes && <span className="truncate">• {s.notes}</span>}
                      </div>
                    )}
                    {s.result && (
                      <p className="text-xs font-medium text-teal-700 dark:text-teal-400">النتيجة: {s.result}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-3">لا توجد جلسات مسجلة</p>
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

        </div>
      ) : (
        <div className="space-y-4">
      {/* شريط البحث والفلاتر */}
      {/* إحصائيات نتائج القضايا */}
      {(() => {
        const wonCases = filteredCases.filter(c => c.caseResult === 'won').length;
        const lostCases = filteredCases.filter(c => c.caseResult === 'lost').length;
        if (wonCases === 0 && lostCases === 0) return null;
        return (
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center justify-center gap-1.5">
                <Trophy className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <p className="text-xs text-muted-foreground">القضايا الرابحة</p>
              </div>
              <p className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums">{wonCases}</p>
            </div>
            <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-center justify-center gap-1.5">
                <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                <p className="text-xs text-muted-foreground">القضايا الخاسرة</p>
              </div>
              <p className="text-lg font-extrabold text-red-700 dark:text-red-400 tabular-nums">{lostCases}</p>
            </div>
          </div>
        );
      })()}
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

      {/* تبويبات الفلترة */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg">
        {[
          { id: 'active' as const,   label: 'الجارية',            filter: (c: CaseType) => c.status === 'جارية' },
          { id: 'archived' as const, label: 'مؤرشفة / مفصول فيها', filter: (c: CaseType) => c.status === 'مؤرشفة' || c.status === 'مفصول فيها' },
          { id: 'pending' as const,  label: 'للجدولة',             filter: (c: CaseType) => c.status === 'للجدولة' || !c.caseNumber },
        ].map((tab) => {
          const count = cases?.filter(tab.filter).length || 0;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-background shadow-sm text-teal-700 dark:text-teal-400'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              <Badge variant={activeTab === tab.id ? 'default' : 'secondary'} className="text-[10px] px-1.5 h-4 tabular-nums">
                {count.toLocaleString('en-US')}
              </Badge>
            </button>
          );
        })}
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
                          {c.caseResult === 'won' && (
                            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs">
                              <Trophy className="w-3 h-3 ml-0.5" /> ربحت
                            </Badge>
                          )}
                          {c.caseResult === 'lost' && (
                            <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-xs">
                              <XCircle className="w-3 h-3 ml-0.5" /> خسرت
                            </Badge>
                          )}
                          {c.caseNature && (
                            <Badge variant="outline" className="text-xs">{c.caseNature}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 truncate">{c.subject || '—'}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                          {c.clientId && clientMap[c.clientId] && <span className="text-teal-600 dark:text-teal-400 font-semibold">{clientMap[c.clientId].name}</span>}
                          {c.courtName && <span>{c.courtName}</span>}
                          {(() => {
                            const courtBody = judicialBodies?.find(b => b.id === c.courtId);
                            const courtPhones = courtBody?.phones ? (() => { try { const p = JSON.parse(courtBody.phones); return Array.isArray(p) ? p.filter((x: string) => x.trim()) : []; } catch { return []; } })() : [];
                            return courtPhones.length > 0 ? <span className="text-teal-600 dark:text-teal-400 font-mono dir-ltr"><Phone className="w-3 h-3 inline ml-0.5" />{courtPhones[0]}{courtPhones.length > 1 ? ` +${courtPhones.length - 1}` : ''}</span> : null;
                          })()}
                          {c.chamber && <span>• {c.chamber}</span>}
                          {c.registrationDate && <span>• {formatDate(c.registrationDate)}</span>}
                        </div>
                        {/* آخر تأجيل */}
                        {(() => {
                          const cDelays = allDelays?.filter((d: any) => d.caseId === c.id) || [];
                          const lastDelay = cDelays.sort((a: any, b: any) => (b.delayDate||'').localeCompare(a.delayDate||''))[0];
                          return lastDelay ? (
                            <div className="flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3 text-amber-500" />
                              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                آخر تأجيل: {formatDate(lastDelay.delayDate)}
                                {lastDelay.reason ? ` — ${lastDelay.reason}` : ''}
                              </span>
                            </div>
                          ) : null;
                        })()}
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
        </div>
      )}

      {/* نافذة إضافة/تعديل القضية */}
      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) resetForm(); }}>
        <DialogContent className="w-[calc(100%-1rem)] sm:max-w-3xl max-h-[90vh] overflow-y-auto smooth-scroll p-4 sm:p-6" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold">{editingCase ? 'تعديل القضية' : 'إضافة قضية جديدة'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* المعلومات الأساسية */}
            <div>
              <h3 className="text-sm font-bold mb-3 text-teal-700 dark:text-teal-400">المعلومات الأساسية</h3>
              {/* تنبيه تكرار رقم القضية */}
              {(caseDuplicateWarning && caseDuplicateWarning.length > 0) ? (
                <DuplicateAlert
                  duplicates={caseDuplicateWarning}
                  entityType="قضية"
                  onForceProceed={() => { setForceSaveCase(true); saveCase(); }}
                  onDismiss={() => setCaseDuplicateWarning(null)}
                />
              ) : caseNumberDuplicates.length > 0 && !editingCase?.id ? (
                <DuplicateAlert
                  duplicates={caseNumberDuplicates}
                  entityType="قضية"
                  onForceProceed={() => { setForceSaveCase(true); saveCase(); }}
                  onDismiss={() => setCaseDuplicateWarning(null)}
                  extraInfo="يوجد قضية بنفس الرقم:"
                />
              ) : null}
              {/* تنبيه تكرار أسماء الأطراف */}
              {partyNameDuplicates.length > 0 && (
                <div className="rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-2.5 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    أسماء مكررة في الأطراف: {partyNameDuplicates.map(d => d.name).join('، ')}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">رقم القضية</Label>
                  <Input
                    value={formData.caseNumber || ''}
                    onChange={(e) => { setFormData({ ...formData, caseNumber: e.target.value }); setCaseDuplicateWarning(null); setForceSaveCase(false); }}
                    placeholder="رقم القضية"
                    className={`h-11 ${caseNumberDuplicates.length > 0 && !editingCase?.id ? 'border-amber-400 focus-visible:ring-amber-400' : ''}`}
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
                  <SelectWithCustom
                    field="caseNature"
                    value={formData.caseNature || ''}
                    onChange={v => setFormData({ ...formData, caseNature: v })}
                    staticOptions={CASE_NATURES.map(n => ({ value: n, label: n }))}
                    placeholder="اختر طبيعة القضية..."
                  />
                </div>
                <div>
                  <Label className="text-xs">حالة القضية</Label>
                  <SelectWithCustom
                    field="caseStatus"
                    value={formData.status || ''}
                    onChange={v => setFormData({ ...formData, status: v })}
                    staticOptions={CASE_STATUSES.map(s => ({ value: s, label: s }))}
                    placeholder="اختر الحالة..."
                  />
                </div>
                <div>
                  <Label className="text-xs">مرحلة التقاضي</Label>
                  <SelectWithCustom
                    field="litigationStage"
                    value={formData.litigationStage || ''}
                    onChange={v => setFormData({ ...formData, litigationStage: v })}
                    staticOptions={LITIGATION_STAGES.map(s => ({ value: s, label: s }))}
                    placeholder="اختر مرحلة التقاضي..."
                  />
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
                    const newData: Partial<CaseType> = { ...formData, judiciaryType: v, courtLevel: undefined, courtId: undefined, wilayaId: undefined, chamber: '', councilName: '', courtName: '' };
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
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">الهيئة القضائية</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs text-teal-600 hover:text-teal-700 px-1"
                        onClick={() => {
                          setNewCourtData({
                            type: formData.courtLevel || '',
                            wilayaId: formData.wilayaId,
                          });
                          setShowNewCourtDialog(true);
                        }}
                      >
                        <Building2 className="w-3 h-3 ml-0.5" />
                        هيئة جديدة
                      </Button>
                    </div>
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
                    {formData.courtId && (() => {
                      const selectedBody = judicialBodies?.find(b => b.id === formData.courtId);
                      const bodyPhones = selectedBody?.phones ? (() => { try { const p = JSON.parse(selectedBody.phones); return Array.isArray(p) ? p.filter((x: string) => x.trim()) : []; } catch { return []; } })() : [];
                      return bodyPhones.length > 0 ? (
                        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                          <Phone className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                          {bodyPhones.map((ph: string, i: number) => (
                            <span key={i} className="text-xs font-mono text-teal-700 dark:text-teal-400 dir-ltr">{ph}{i < bodyPhones.length - 1 ? ' /' : ''}</span>
                          ))}
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}

                {/* الغرفة/القسم */}
                <div>
                  <Label className="text-xs">الغرفة/القسم</Label>
                  <SelectWithCustom
                    field="chamber"
                    value={formData.chamber || ''}
                    onChange={v => setFormData({ ...formData, chamber: v })}
                    staticOptions={availableChambers.map(c => ({ value: c, label: c }))}
                    placeholder="اختر الغرفة..."
                  />
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
                        <SelectWithCustom
                          field="partyRole"
                          value={party.role || ''}
                          onChange={v => {
                            const updated = [...parties];
                            updated[idx] = { ...updated[idx], role: v };
                            setParties(updated);
                          }}
                          staticOptions={PARTY_ROLES.map(r => ({ value: r, label: r }))}
                          placeholder="اختر المركز القانوني..."
                        />
                        <div className="flex gap-1 mt-1">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...parties];
                              updated[idx] = { ...updated[idx], side: 'for' };
                              setParties(updated);
                            }}
                            className={`flex-1 h-8 rounded-md border text-xs font-medium transition-colors ${
                              (party.side || 'for') === 'for'
                                ? 'bg-green-500 text-white border-green-500'
                                : 'border-border text-muted-foreground hover:border-green-400'
                            }`}
                          >
                            في حقه
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...parties];
                              updated[idx] = { ...updated[idx], side: 'against' };
                              setParties(updated);
                            }}
                            className={`flex-1 h-8 rounded-md border text-xs font-medium transition-colors ${
                              party.side === 'against'
                                ? 'bg-red-500 text-white border-red-500'
                                : 'border-border text-muted-foreground hover:border-red-400'
                            }`}
                          >
                            ضده
                          </button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">الاسم</Label>
                        <div className="flex gap-1">
                          <ComboboxInput
                            value={party.name || ''}
                            onChange={(v) => {
                              const updated = [...parties];
                              updated[idx] = { ...updated[idx], name: v };
                              // ملء الهاتف تلقائياً عند اختيار اسم من القائمة
                              if (v) {
                                const nameKey = v.trim().toLowerCase();
                                // أولاً: البحث في جدول الموكلين
                                if (clientByNameMap[nameKey]) {
                                  const existingClient = clientByNameMap[nameKey];
                                  if (existingClient.phone && !updated[idx].phone) {
                                    updated[idx] = { ...updated[idx], phone: existingClient.phone };
                                  }
                                  if (existingClient.phone2 && !updated[idx].phone) {
                                    updated[idx] = { ...updated[idx], phone: existingClient.phone2 };
                                  }
                                }
                                // ثانياً: البحث في أطراف القضايا السابقة
                                if (partyPhoneMap[nameKey] && !updated[idx].phone) {
                                  updated[idx] = { ...updated[idx], phone: partyPhoneMap[nameKey] };
                                }
                              }
                              setParties(updated);
                            }}
                            suggestions={clientNameSuggestions}
                            placeholder="ابدأ بكتابة الاسم..."
                            addLabel="كطرف"
                            className="h-10"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 shrink-0"
                            onClick={() => openPartyClientDialog(idx)}
                            title="إضافة موكل جديد"
                          >
                            <UserPlus className="w-4 h-4" />
                          </Button>
                        </div>
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
                        <ComboboxInput
                          value={party.lawyerName || ''}
                          onChange={(v) => {
                            const updated = [...parties];
                            updated[idx] = { ...updated[idx], lawyerName: v };
                            // ملء هاتف المحامي تلقائياً عند اختيار اسم من القائمة
                            if (v) {
                              const nameKey = v.trim().toLowerCase();
                              // أولاً: البحث في جدول المحامين
                              if (lawyerByNameMap[nameKey]) {
                                const existingLawyer = lawyerByNameMap[nameKey];
                                if (existingLawyer.phone && !updated[idx].lawyerPhone) {
                                  updated[idx] = { ...updated[idx], lawyerPhone: existingLawyer.phone };
                                } else if (existingLawyer.phone2 && !updated[idx].lawyerPhone) {
                                  updated[idx] = { ...updated[idx], lawyerPhone: existingLawyer.phone2 };
                                }
                              }
                              // ثانياً: البحث في أطراف القضايا السابقة
                              if (partyLawyerPhoneMap[nameKey] && !updated[idx].lawyerPhone) {
                                updated[idx] = { ...updated[idx], lawyerPhone: partyLawyerPhoneMap[nameKey] };
                              }
                            }
                            setParties(updated);
                          }}
                          suggestions={lawyerNameSuggestions}
                          placeholder="ابدأ بكتابة اسم المحامي..."
                          addLabel="كاسم محامي"
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
                {/* نتيجة القضية */}
                <div>
                  <Label className="text-xs">نتيجة القضية</Label>
                  <Select
                    value={formData.caseResult || '_none'}
                    onValueChange={(v) => setFormData({ ...formData, caseResult: v === '_none' ? null : v })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="اختر نتيجة القضية" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">— بدون تحديد —</SelectItem>
                      <SelectItem value="won">
                        <span className="flex items-center gap-2">
                          <Trophy className="w-3.5 h-3.5 text-emerald-600" />
                          ربحت القضية
                        </span>
                      </SelectItem>
                      <SelectItem value="lost">
                        <span className="flex items-center gap-2">
                          <XCircle className="w-3.5 h-3.5 text-red-600" />
                          خسرت القضية
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
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

      {/* حوار إنشاء موكل جديد */}
      <Dialog open={showNewClientDialog} onOpenChange={setShowNewClientDialog}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">موكل جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">الاسم <span className="text-destructive">*</span></Label>
              <Input
                value={newClientData.name || ''}
                onChange={(e) => setNewClientData({ ...newClientData, name: e.target.value })}
                placeholder="اسم الموكل"
                className="h-11"
              />
            </div>
            <div>
              <Label className="text-xs">الهاتف</Label>
              <Input
                value={newClientData.phone || ''}
                onChange={(e) => setNewClientData({ ...newClientData, phone: e.target.value })}
                placeholder="رقم الهاتف"
                className="h-11"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewClientDialog(false)}>إلغاء</Button>
            <Button onClick={saveNewClient} className="bg-teal-600 hover:bg-teal-700">حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* حوار إضافة موكل جديد من نموذج الأطراف */}
      <Dialog open={showPartyClientDialog} onOpenChange={setShowPartyClientDialog}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              إضافة موكل جديد
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">الاسم واللقب <span className="text-destructive">*</span></Label>
              <Input
                value={partyClientData.name}
                onChange={(e) => setPartyClientData({ ...partyClientData, name: e.target.value })}
                placeholder="الاسم واللقب"
                className="h-11"
              />
            </div>
            <div>
              <Label className="text-xs">الهاتف</Label>
              <Input
                value={partyClientData.phone}
                onChange={(e) => setPartyClientData({ ...partyClientData, phone: e.target.value })}
                placeholder="رقم الهاتف"
                className="h-11"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPartyClientDialog(false)}>إلغاء</Button>
            <Button onClick={savePartyClient} className="bg-teal-600 hover:bg-teal-700">إضافة الموكل</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* حوار إنشاء هيئة قضائية جديدة */}
      <Dialog open={showNewCourtDialog} onOpenChange={setShowNewCourtDialog}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">هيئة قضائية جديدة</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">الاسم <span className="text-destructive">*</span></Label>
              <Input
                value={newCourtData.name || ''}
                onChange={(e) => setNewCourtData({ ...newCourtData, name: e.target.value })}
                placeholder="اسم الهيئة القضائية"
                className="h-11"
              />
            </div>
            <div>
              <Label className="text-xs">النوع</Label>
              <Select value={newCourtData.type || ''} onValueChange={(v) => setNewCourtData({ ...newCourtData, type: v })}>
                <SelectTrigger className="h-11"><SelectValue placeholder="اختر النوع" /></SelectTrigger>
                <SelectContent>
                  {[...ORDINARY_COURT_LEVELS, ...ADMIN_COURT_LEVELS, { value: 'supreme', label: 'المحكمة العليا' }].map((cl) => (
                    <SelectItem key={cl.value} value={cl.value}>{cl.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">الولاية</Label>
              <Select value={newCourtData.wilayaId?.toString() || ''} onValueChange={(v) => setNewCourtData({ ...newCourtData, wilayaId: v ? Number(v) : undefined })}>
                <SelectTrigger className="h-11"><SelectValue placeholder="اختر الولاية" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_empty">—</SelectItem>
                  {WILAYAS.map((w) => (
                    <SelectItem key={w.code} value={w.code.toString()}>{w.code} - {w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewCourtDialog(false)}>إلغاء</Button>
            <Button onClick={saveNewCourt} className="bg-teal-600 hover:bg-teal-700">حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* تأكيد حذف الطرف */}
      <AlertDialog open={deletePartyConfirm !== null} onOpenChange={() => setDeletePartyConfirm(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد حذف الطرف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا الطرف من أطراف النزاع؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletePartyConfirm && handleDeleteParty(deletePartyConfirm)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* تأكيد الحذف */}
      <AlertDialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            هل أنت متأكد من حذف هذه القضية؟ لا يمكن التراجع عن هذا الإجراء.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirm && handleDeleteCase(deleteConfirm)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
    </>
  );
}

function DetailField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value || '—'}</p>
    </div>
  );
}
