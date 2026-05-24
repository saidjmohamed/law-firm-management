'use client';

import React, { useState, useMemo } from 'react';
import { useJudicialBodies, useCases, createJudicialBody, updateJudicialBody, deleteJudicialBody } from '@/lib/api';
import { WILAYAS, SUPREME_CHAMBERS, COUNCIL_CHAMBERS, COURT_SECTIONS, CHAMBER_NUMBERS, JUDICIARY_TYPES, ORDINARY_COURT_LEVELS, ADMIN_COURT_LEVELS } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Pencil,
  Trash2,
  Building2,
  Landmark,
  Gavel,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  AlertCircle,
} from 'lucide-react';

interface JudicialBody {
  id?: number;
  name: string;
  type: string;
  wilayaId?: number;
  parentCouncilId?: number;
  chambers?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ChamberItem {
  name: string;
  number: number | null;
}

const TYPE_LABELS: Record<string, string> = {
  supreme: 'المحكمة العليا',
  council: 'مجلس قضائي',
  court: 'محكمة',
  admin_appeal: 'محكمة إدارية استئنافية',
  admin_first: 'محكمة إدارية ابتدائية',
  commercial: 'محكمة تجارية متخصصة',
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  supreme: Gavel,
  council: Landmark,
  court: Building2,
  admin_appeal: Building2,
  admin_first: Building2,
  commercial: Building2,
};

const TYPE_COLORS: Record<string, string> = {
  supreme: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
  council: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  court: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  admin_appeal: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  admin_first: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  commercial: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
};

export function CourtsManager() {
  const [showForm, setShowForm] = useState(false);
  const [editingCourt, setEditingCourt] = useState<JudicialBody | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // فلاتر
  const [filterType, setFilterType] = useState<string>('all');
  const [filterWilaya, setFilterWilaya] = useState<string>('all');

  // بيانات النموذج - خطوة بخطوة
  const [formStep, setFormStep] = useState(1);
  const [judiciaryGroup, setJudiciaryGroup] = useState<string>(''); // supreme / ordinary / admin
  const [formData, setFormData] = useState<Partial<JudicialBody>>({});
  const [chambers, setChambers] = useState<ChamberItem[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const { judicialBodies: courts, isLoading } = useJudicialBodies();
  const { cases } = useCases();

  const filteredCourts = useMemo(() => {
    if (!courts) return [];
    return courts.filter((c) => {
      const matchType = filterType === 'all' || c.type === filterType;
      const matchWilaya = filterWilaya === 'all' || String(c.wilayaId) === filterWilaya;
      return matchType && matchWilaya;
    });
  }, [courts, filterType, filterWilaya]);

  const groupedCourts = useMemo(() => {
    const groups: Record<string, typeof filteredCourts> = {
      supreme: [],
      council: [],
      court: [],
      admin_appeal: [],
      admin_first: [],
      commercial: [],
    };
    for (const court of filteredCourts) {
      if (groups[court.type]) {
        groups[court.type].push(court);
      }
    }
    return groups;
  }, [filteredCourts]);

  const councils = courts?.filter((c) => c.type === 'council') || [];

  function resetForm() {
    setFormData({});
    setChambers([]);
    setEditingCourt(null);
    setFormStep(1);
    setJudiciaryGroup('');
    setFormErrors({});
  }

  function openAddForm() {
    resetForm();
    setShowForm(true);
  }

  function openEditForm(court: JudicialBody) {
    setEditingCourt(court);
    setFormData({ ...court });

    // تحديد مجموعة القضاء
    if (court.type === 'supreme') {
      setJudiciaryGroup('supreme');
    } else if (court.type === 'council' || court.type === 'court') {
      setJudiciaryGroup('ordinary');
    } else {
      setJudiciaryGroup('admin');
    }

    // تحميل الغرف
    try {
      const parsed = court.chambers ? JSON.parse(court.chambers) : [];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setChambers(parsed);
      } else if (court.type === 'supreme') {
        setChambers(SUPREME_CHAMBERS.map(name => ({ name, number: null })));
      } else if (court.type === 'council') {
        setChambers(COUNCIL_CHAMBERS.map(name => ({ name, number: null })));
      } else if (court.type === 'court') {
        setChambers(COURT_SECTIONS.map(name => ({ name, number: null })));
      } else {
        setChambers([]);
      }
    } catch {
      setChambers([]);
    }

    setFormStep(3); // Skip to final step for editing
    setShowForm(true);
  }

  // عند اختيار مجموعة القضاء
  function handleJudiciaryGroupChange(group: string) {
    setJudiciaryGroup(group);
    setFormData({ type: undefined, wilayaId: undefined, parentCouncilId: undefined, name: '' });
    setChambers([]);
    setFormErrors({});

    if (group === 'supreme') {
      setFormData({ type: 'supreme' });
      setChambers(SUPREME_CHAMBERS.map(name => ({ name, number: null })));
    }
  }

  // عند اختيار نوع الهيئة ضمن المجموعة
  function handleCourtTypeChange(type: string) {
    setFormData(prev => ({ ...prev, type, parentCouncilId: undefined }));
    setFormErrors({});

    if (type === 'council') {
      setChambers(COUNCIL_CHAMBERS.map(name => ({ name, number: null })));
    } else if (type === 'court') {
      setChambers(COURT_SECTIONS.map(name => ({ name, number: null })));
    } else {
      setChambers([]);
    }
  }

  function validateStep2(): boolean {
    const errors: Record<string, string> = {};

    if (!formData.type) {
      errors.type = 'يرجى اختيار نوع الهيئة';
    }

    if (formData.type !== 'supreme' && !formData.wilayaId) {
      errors.wilayaId = 'الولاية مطلوبة';
    }

    if (formData.type === 'court' && !formData.parentCouncilId) {
      errors.parentCouncilId = 'المحكمة يجب أن تكون تابعة لمجلس قضائي';
    }

    if (!formData.name?.trim()) {
      errors.name = 'اسم الهيئة مطلوب';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function goToStep2() {
    if (!judiciaryGroup) {
      setFormErrors({ judiciaryGroup: 'يرجى اختيار نوع القضاء' });
      return;
    }
    setFormErrors({});
    setFormStep(2);
  }

  function goToStep3() {
    if (!validateStep2()) return;
    setFormStep(3);
  }

  async function saveCourt() {
    const now = new Date();
    const chambersJson = chambers.length > 0 ? JSON.stringify(chambers) : undefined;

    if (editingCourt?.id) {
      await updateJudicialBody(editingCourt.id, {
        ...formData,
        chambers: chambersJson,
        updatedAt: now,
      });
      toast.success('تم تحديث الهيئة القضائية بنجاح');
    } else {
      await createJudicialBody({
        name: formData.name || '',
        type: formData.type || 'council',
        wilayaId: formData.wilayaId,
        parentCouncilId: formData.parentCouncilId,
        chambers: chambersJson,
        createdAt: now,
        updatedAt: now,
      });
      toast.success('تم إضافة الهيئة القضائية بنجاح');
    }

    setShowForm(false);
    resetForm();
  }

  async function handleDeleteCourt(id: number) {
    const linkedCases = cases.filter((c) => c.courtId === id).length;
    if (linkedCases > 0) {
      toast.error(`لا يمكن حذف هذه الهيئة لأنها مرتبطة بـ ${linkedCases.toLocaleString('en-US')} قضية`);
      setDeleteConfirm(null);
      return;
    }

    await deleteJudicialBody(id);
    setDeleteConfirm(null);
    toast.success('تم حذف الهيئة القضائية');
  }

  function updateChamberNumber(index: number, number: number | null) {
    const updated = [...chambers];
    updated[index] = { ...updated[index], number };
    setChambers(updated);
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* شريط الأدوات */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-48 h-11">
            <SelectValue placeholder="نوع الهيئة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الأنواع</SelectItem>
            <SelectItem value="supreme">المحكمة العليا</SelectItem>
            <SelectItem value="council">مجالس قضائية</SelectItem>
            <SelectItem value="court">محاكم</SelectItem>
            <SelectItem value="admin_appeal">إدارية استئنافية</SelectItem>
            <SelectItem value="admin_first">إدارية ابتدائية</SelectItem>
            <SelectItem value="commercial">تجارية متخصصة</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterWilaya} onValueChange={setFilterWilaya}>
          <SelectTrigger className="w-full sm:w-48 h-11">
            <SelectValue placeholder="الولاية" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الولايات</SelectItem>
            {WILAYAS.map((w) => (
              <SelectItem key={w.code} value={w.code.toString()}>
                {w.code} - {w.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <Button onClick={openAddForm} className="bg-teal-600 hover:bg-teal-700 shrink-0 h-11 touch-target">
          <Plus className="w-4 h-4 ml-1" />
          إضافة هيئة قضائية
        </Button>
      </div>

      {/* المحكمة العليا */}
      {groupedCourts.supreme.length > 0 && (
        <div>
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-rose-700 dark:text-rose-400">
            <Gavel className="w-4 h-4" />
            المحكمة العليا
          </h3>
          <div className="space-y-2">
            {groupedCourts.supreme.map((court) => {
              const Icon = TYPE_ICONS[court.type] || Building2;
              const isExpanded = expandedId === court.id;
              const parsedChambers = court.chambers ? JSON.parse(court.chambers) as ChamberItem[] : [];
              const linkedCasesCount = cases.filter((c) => c.courtId === court.id).length;
              return (
                <Card key={court.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : court.id!)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{court.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge className={`${TYPE_COLORS[court.type]} text-xs`}>
                              {TYPE_LABELS[court.type]}
                            </Badge>
                            {linkedCasesCount > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {linkedCasesCount.toLocaleString('en-US')} قضية
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openEditForm(court); }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : court.id!); }}>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    {isExpanded && parsedChambers.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">الغرف</p>
                        <div className="flex flex-wrap gap-2">
                          {parsedChambers.map((ch, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {ch.name}
                              {ch.number && ch.number > 0 && ` رقم ${String(ch.number).padStart(2, '0')}`}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* المجالس القضائية */}
      {groupedCourts.council.length > 0 && (
        <div>
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
            <Landmark className="w-4 h-4" />
            المجالس القضائية
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {groupedCourts.council.map((court) => {
              const isExpanded = expandedId === court.id;
              const parsedChambers = court.chambers ? JSON.parse(court.chambers) as ChamberItem[] : [];
              const wilayaName = WILAYAS.find((w) => w.code === court.wilayaId)?.name;
              const linkedCasesCount = cases.filter((c) => c.courtId === court.id).length;
              return (
                <Card key={court.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : court.id!)}
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate">{court.name}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {wilayaName && (
                            <Badge variant="outline" className="text-xs">{wilayaName}</Badge>
                          )}
                          {linkedCasesCount > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {linkedCasesCount.toLocaleString('en-US')} قضية
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openEditForm(court); }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); if (court.id) setDeleteConfirm(court.id); }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    {isExpanded && parsedChambers.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">الغرف</p>
                        <div className="flex flex-wrap gap-2">
                          {parsedChambers.map((ch, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {ch.name}
                              {ch.number && ch.number > 0 && ` رقم ${String(ch.number).padStart(2, '0')}`}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* المحاكم */}
      {groupedCourts.court.length > 0 && (
        <div>
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-teal-700 dark:text-teal-400">
            <Building2 className="w-4 h-4" />
            المحاكم
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {groupedCourts.court.map((court) => {
              const isExpanded = expandedId === court.id;
              const parsedChambers = court.chambers ? JSON.parse(court.chambers) as ChamberItem[] : [];
              const wilayaName = WILAYAS.find((w) => w.code === court.wilayaId)?.name;
              const parentCouncil = courts.find((c) => c.id === court.parentCouncilId);
              const linkedCasesCount = cases.filter((c) => c.courtId === court.id).length;
              return (
                <Card key={court.id} className="overflow-hidden">
                  <CardContent className="p-3">
                    <div
                      className="cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : court.id!)}
                    >
                      <p className="font-bold text-sm truncate">{court.name}</p>
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        {wilayaName && (
                          <Badge variant="outline" className="text-[10px]">{wilayaName}</Badge>
                        )}
                        {parentCouncil && (
                          <Badge variant="outline" className="text-[10px]">تابع لـ {parentCouncil.name}</Badge>
                        )}
                        {linkedCasesCount > 0 && (
                          <Badge variant="outline" className="text-[10px]">
                            {linkedCasesCount.toLocaleString('en-US')} قضية
                          </Badge>
                        )}
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="mt-2 pt-2 border-t">
                        {parsedChambers.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {parsedChambers.map((ch, i) => (
                              <Badge key={i} variant="secondary" className="text-[10px]">
                                {ch.name}
                                {ch.number && ch.number > 0 && ` ${String(ch.number).padStart(2, '0')}`}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="h-7 text-xs touch-target" onClick={() => openEditForm(court)}>
                            <Pencil className="w-3 h-3 ml-1" /> تعديل
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive touch-target" onClick={() => court.id && setDeleteConfirm(court.id)}>
                            <Trash2 className="w-3 h-3 ml-1" /> حذف
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* المحاكم الإدارية */}
      {(groupedCourts.admin_appeal.length > 0 || groupedCourts.admin_first.length > 0 || groupedCourts.commercial.length > 0) && (
        <div>
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <Building2 className="w-4 h-4" />
            القضاء الإداري
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {[...groupedCourts.admin_appeal, ...groupedCourts.admin_first, ...groupedCourts.commercial].map((court) => {
              const wilayaName = WILAYAS.find((w) => w.code === court.wilayaId)?.name;
              return (
                <Card key={court.id} className="overflow-hidden">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm truncate">{court.name}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Badge className={`${TYPE_COLORS[court.type]} text-[10px]`}>
                            {TYPE_LABELS[court.type]}
                          </Badge>
                          {wilayaName && (
                            <Badge variant="outline" className="text-[10px]">{wilayaName}</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditForm(court)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => court.id && setDeleteConfirm(court.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {filteredCourts.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Building2 className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">لا توجد هيئات قضائية مسجلة</p>
          </CardContent>
        </Card>
      )}

      {/* نافذة إضافة/تعديل - خطوة بخطوة */}
      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto smooth-scroll" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold">
              {editingCourt ? 'تعديل الهيئة القضائية' : 'إضافة هيئة قضائية جديدة'}
            </DialogTitle>
          </DialogHeader>

          {/* مؤشر الخطوات */}
          <div className="flex items-center gap-2 mb-4">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
              formStep >= 1 ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400' : 'bg-muted text-muted-foreground'
            }`}>
              <span className="w-5 h-5 rounded-full bg-current text-white flex items-center justify-center text-[10px]">1</span>
              نوع القضاء
            </div>
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
              formStep >= 2 ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400' : 'bg-muted text-muted-foreground'
            }`}>
              <span className="w-5 h-5 rounded-full bg-current text-white flex items-center justify-center text-[10px]">2</span>
              بيانات الهيئة
            </div>
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
              formStep >= 3 ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400' : 'bg-muted text-muted-foreground'
            }`}>
              <span className="w-5 h-5 rounded-full bg-current text-white flex items-center justify-center text-[10px]">3</span>
              الغرف/الأقسام
            </div>
          </div>

          {/* الخطوة 1: اختيار نوع القضاء */}
          {formStep === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">اختر نوع القضاء الذي تنتمي إليه الهيئة</p>
              {formErrors.judiciaryGroup && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  {formErrors.judiciaryGroup}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {JUDICIARY_TYPES.map((jt) => {
                  const isActive = judiciaryGroup === jt.value;
                  let icon = Building2;
                  if (jt.value === 'supreme') icon = Gavel;
                  else if (jt.value === 'ordinary') icon = Landmark;
                  const Icon = icon;
                  return (
                    <Card
                      key={jt.value}
                      className={`cursor-pointer transition-all duration-200 ${
                        isActive ? 'border-teal-500 ring-2 ring-teal-500/20 shadow-md' : 'hover:shadow-md hover:border-teal-300'
                      }`}
                      onClick={() => handleJudiciaryGroupChange(jt.value)}
                    >
                      <CardContent className="p-4 text-center">
                        <div className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-2 ${
                          isActive ? 'bg-teal-100 dark:bg-teal-900/30' : 'bg-muted'
                        }`}>
                          <Icon className={`w-6 h-6 ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-muted-foreground'}`} />
                        </div>
                        <h3 className="font-bold text-sm">{jt.label}</h3>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* معاينة النوع المختار */}
              {judiciaryGroup && (
                <div className="p-3 bg-teal-50 dark:bg-teal-900/10 rounded-lg">
                  <p className="text-xs font-semibold text-teal-700 dark:text-teal-400 mb-2">الأنواع المتاحة:</p>
                  <div className="flex flex-wrap gap-2">
                    {judiciaryGroup === 'supreme' && (
                      <Badge className="bg-rose-100 text-rose-800 text-xs">المحكمة العليا</Badge>
                    )}
                    {judiciaryGroup === 'ordinary' && ORDINARY_COURT_LEVELS.map((cl) => (
                      <Badge key={cl.value} className="bg-indigo-100 text-indigo-800 text-xs">{cl.label}</Badge>
                    ))}
                    {judiciaryGroup === 'admin' && ADMIN_COURT_LEVELS.map((cl) => (
                      <Badge key={cl.value} className="bg-amber-100 text-amber-800 text-xs">{cl.label}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* الخطوة 2: بيانات الهيئة */}
          {formStep === 2 && (
            <div className="space-y-4">
              {/* اختيار نوع الهيئة ضمن المجموعة */}
              {judiciaryGroup !== 'supreme' && (
                <div>
                  <Label className="text-xs font-semibold">نوع الهيئة</Label>
                  <Select
                    value={formData.type || ''}
                    onValueChange={handleCourtTypeChange}
                    disabled={!!editingCourt}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="اختر نوع الهيئة" />
                    </SelectTrigger>
                    <SelectContent>
                      {judiciaryGroup === 'ordinary' && ORDINARY_COURT_LEVELS.map((cl) => (
                        <SelectItem key={cl.value} value={cl.value}>{cl.label}</SelectItem>
                      ))}
                      {judiciaryGroup === 'admin' && ADMIN_COURT_LEVELS.map((cl) => (
                        <SelectItem key={cl.value} value={cl.value}>{cl.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.type && (
                    <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {formErrors.type}
                    </p>
                  )}
                </div>
              )}

              {/* اسم الهيئة */}
              <div>
                <Label className="text-xs font-semibold">اسم الهيئة القضائية</Label>
                <Input
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="اسم الهيئة"
                  className="h-11"
                />
                {formErrors.name && (
                  <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {formErrors.name}
                  </p>
                )}
              </div>

              {/* الولاية */}
              {formData.type !== 'supreme' && (
                <div>
                  <Label className="text-xs font-semibold">الولاية</Label>
                  <Select
                    value={formData.wilayaId?.toString() || ''}
                    onValueChange={(v) => setFormData({ ...formData, wilayaId: v && v !== '0' ? Number(v) : undefined })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="اختر الولاية" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">—</SelectItem>
                      {WILAYAS.map((w) => (
                        <SelectItem key={w.code} value={w.code.toString()}>
                          {w.code} - {w.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.wilayaId && (
                    <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {formErrors.wilayaId}
                    </p>
                  )}
                </div>
              )}

              {/* المحكمة تابعة لمجلس - مطلوب */}
              {formData.type === 'court' && (
                <div>
                  <Label className="text-xs font-semibold">تابعة للمجلس القضائي <span className="text-destructive">*</span></Label>
                  <Select
                    value={formData.parentCouncilId?.toString() || ''}
                    onValueChange={(v) => setFormData({ ...formData, parentCouncilId: v && v !== '0' ? Number(v) : undefined })}
                  >
                    <SelectTrigger className={`h-11 ${formErrors.parentCouncilId ? 'border-destructive' : ''}`}>
                      <SelectValue placeholder="اختر المجلس القضائي" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">—</SelectItem>
                      {councils.map((c) => (
                        <SelectItem key={c.id} value={c.id!.toString()}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.parentCouncilId && (
                    <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {formErrors.parentCouncilId}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* الخطوة 3: الغرف/الأقسام */}
          {formStep === 3 && (
            <div className="space-y-4">
              {(formData.type === 'supreme' || formData.type === 'council' || formData.type === 'court') && chambers.length > 0 ? (
                <div>
                  <Label className="text-xs font-semibold mb-2 block">
                    {formData.type === 'court' ? 'الأقسام وأرقامها' : 'الغرف وأرقامها'}
                  </Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    حدد أرقام الغرف/الأقسام المتاحة في هذه الهيئة. اختر &quot;بدون رقم&quot; إذا لم يكن لها رقم.
                  </p>
                  <div className="space-y-2 max-h-64 overflow-y-auto smooth-scroll">
                    {chambers.map((ch, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 rounded-lg border">
                        <span className="text-sm flex-1 min-w-0 truncate">{ch.name}</span>
                        <Select
                          value={ch.number === null ? 'none' : ch.number?.toString() || 'none'}
                          onValueChange={(v) => updateChamberNumber(idx, v === 'none' ? null : Number(v))}
                        >
                          <SelectTrigger className="w-28 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">بدون رقم</SelectItem>
                            {CHAMBER_NUMBERS.filter(n => n.value > 0).map((n) => (
                              <SelectItem key={n.value} value={n.value.toString()}>
                                رقم {n.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  <p className="text-sm">لا توجد غرف/أقسام محددة لهذا النوع من الهيئات</p>
                </div>
              )}

              {/* ملخص */}
              <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                <p className="text-xs font-semibold text-muted-foreground mb-2">ملخص الهيئة:</p>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <span className="text-muted-foreground">النوع:</span>
                  <span className="font-medium">{TYPE_LABELS[formData.type || ''] || '—'}</span>
                  <span className="text-muted-foreground">الاسم:</span>
                  <span className="font-medium">{formData.name || '—'}</span>
                  {formData.wilayaId && (
                    <>
                      <span className="text-muted-foreground">الولاية:</span>
                      <span className="font-medium">{WILAYAS.find(w => w.code === formData.wilayaId)?.name || '—'}</span>
                    </>
                  )}
                  {formData.parentCouncilId && (
                    <>
                      <span className="text-muted-foreground">المجلس:</span>
                      <span className="font-medium">{councils.find(c => c.id === formData.parentCouncilId)?.name || '—'}</span>
                    </>
                  )}
                  <span className="text-muted-foreground">عدد الغرف:</span>
                  <span className="font-medium">{chambers.length.toLocaleString('en-US')}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            {formStep > 1 && (
              <Button variant="outline" onClick={() => setFormStep(formStep - 1)}>
                السابق
              </Button>
            )}
            {formStep < 3 && (
              <Button
                onClick={formStep === 1 ? goToStep2 : goToStep3}
                className="bg-teal-600 hover:bg-teal-700"
              >
                التالي
              </Button>
            )}
            {formStep === 3 && (
              <Button onClick={saveCourt} className="bg-teal-600 hover:bg-teal-700">
                حفظ
              </Button>
            )}
            <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* تأكيد الحذف */}
      <AlertDialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذه الهيئة القضائية؟ لا يمكن الحذف إذا كانت هناك قضايا مرتبطة.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDeleteCourt(deleteConfirm)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
