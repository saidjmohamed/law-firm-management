'use client';

import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type JudicialBody } from '@/lib/db';
import { WILAYAS, SUPREME_CHAMBERS, COUNCIL_CHAMBERS, COURT_SECTIONS, CHAMBER_NUMBERS } from '@/lib/constants';
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
import { Separator } from '@/components/ui/separator';
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
  X,
} from 'lucide-react';

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

  // بيانات النموذج
  const [formData, setFormData] = useState<Partial<JudicialBody>>({});
  const [chambers, setChambers] = useState<ChamberItem[]>([]);

  const courts = useLiveQuery(() => db.judicialBodies.toArray());
  const cases = useLiveQuery(() => db.cases.toArray());

  const filteredCourts = useMemo(() => {
    if (!courts) return [];
    return courts.filter((c) => {
      const matchType = filterType === 'all' || c.type === filterType;
      const matchWilaya = filterWilaya === 'all' || String(c.wilayaId) === filterWilaya;
      return matchType && matchWilaya;
    });
  }, [courts, filterType, filterWilaya]);

  // تجميع الهيئات حسب النوع
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

  function resetForm() {
    setFormData({});
    setChambers([]);
    setEditingCourt(null);
  }

  function openAddForm(type?: string) {
    resetForm();
    if (type) {
      setFormData({ type });
      if (type === 'supreme') {
        setChambers(SUPREME_CHAMBERS.map(name => ({ name, number: null })));
      } else if (type === 'council') {
        setChambers(COUNCIL_CHAMBERS.map(name => ({ name, number: null })));
      }
    }
    setShowForm(true);
  }

  function openEditForm(court: JudicialBody) {
    setEditingCourt(court);
    setFormData({ ...court });

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

    setShowForm(true);
  }

  async function saveCourt() {
    const now = new Date();
    const chambersJson = chambers.length > 0 ? JSON.stringify(chambers) : undefined;

    if (editingCourt?.id) {
      await db.judicialBodies.update(editingCourt.id, {
        ...formData,
        chambers: chambersJson,
        updatedAt: now,
      });
      toast.success('تم تحديث الهيئة القضائية بنجاح');
    } else {
      await db.judicialBodies.add({
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

  async function deleteCourt(id: number) {
    // التحقق من عدم وجود قضايا مرتبطة
    const linkedCases = cases?.filter((c) => c.courtId === id).length ?? 0;
    if (linkedCases > 0) {
      toast.error(`لا يمكن حذف هذه الهيئة لأنها مرتبطة بـ ${linkedCases.toLocaleString('en-US')} قضية`);
      setDeleteConfirm(null);
      return;
    }

    await db.judicialBodies.delete(id);
    setDeleteConfirm(null);
    toast.success('تم حذف الهيئة القضائية');
  }

  // تحديث الغرف عند تغيير النوع
  function handleTypeChange(type: string) {
    setFormData({ ...formData, type, parentCouncilId: undefined });
    if (type === 'supreme') {
      setChambers(SUPREME_CHAMBERS.map(name => ({ name, number: null })));
      setFormData(prev => ({ ...prev, wilayaId: undefined, type }));
    } else if (type === 'council') {
      setChambers(COUNCIL_CHAMBERS.map(name => ({ name, number: null })));
      setFormData(prev => ({ ...prev, type }));
    } else if (type === 'court') {
      setChambers(COURT_SECTIONS.map(name => ({ name, number: null })));
      setFormData(prev => ({ ...prev, type }));
    } else {
      setChambers([]);
      setFormData(prev => ({ ...prev, type }));
    }
  }

  function updateChamberNumber(index: number, number: number | null) {
    const updated = [...chambers];
    updated[index] = { ...updated[index], number };
    setChambers(updated);
  }

  function toggleChamber(index: number) {
    const updated = [...chambers];
    if (updated[index].number === null) {
      updated[index] = { ...updated[index], number: 0 };
    } else {
      updated[index] = { ...updated[index], number: null };
    }
    setChambers(updated);
  }

  // المجالس القضائية للاختيار كأب
  const councils = courts?.filter((c) => c.type === 'council') || [];

  if (!courts) {
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
        <Button onClick={() => openAddForm()} className="bg-teal-600 hover:bg-teal-700 shrink-0 h-11">
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
              const linkedCasesCount = cases?.filter((c) => c.courtId === court.id).length ?? 0;
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
              const linkedCasesCount = cases?.filter((c) => c.courtId === court.id).length ?? 0;
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
              const linkedCasesCount = cases?.filter((c) => c.courtId === court.id).length ?? 0;
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
                      <div className="mt-2 pt-2 border-t flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openEditForm(court)}>
                          <Pencil className="w-3 h-3 ml-1" /> تعديل
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => court.id && setDeleteConfirm(court.id)}>
                          <Trash2 className="w-3 h-3 ml-1" /> حذف
                        </Button>
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

      {/* نافذة إضافة/تعديل */}
      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold">
              {editingCourt ? 'تعديل الهيئة القضائية' : 'إضافة هيئة قضائية جديدة'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* اختيار نوع القضاء */}
            <div>
              <Label className="text-xs font-semibold">نوع القضاء</Label>
              <Select
                value={formData.type || ''}
                onValueChange={handleTypeChange}
                disabled={!!editingCourt}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="اختر نوع القضاء" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="supreme">المحكمة العليا</SelectItem>
                  <SelectItem value="council">مجلس قضائي (القضاء العادي)</SelectItem>
                  <SelectItem value="court">محكمة (القضاء العادي)</SelectItem>
                  <SelectItem value="admin_appeal">محكمة إدارية استئنافية</SelectItem>
                  <SelectItem value="admin_first">محكمة إدارية ابتدائية</SelectItem>
                  <SelectItem value="commercial">محكمة تجارية متخصصة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* اسم الهيئة */}
            <div>
              <Label className="text-xs font-semibold">اسم الهيئة القضائية</Label>
              <Input
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="اسم الهيئة"
                className="h-11"
              />
            </div>

            {/* الولاية - لا تظهر للمحكمة العليا */}
            {formData.type !== 'supreme' && (
              <div>
                <Label className="text-xs font-semibold">الولاية</Label>
                <Select
                  value={formData.wilayaId?.toString() || ''}
                  onValueChange={(v) => setFormData({ ...formData, wilayaId: v ? Number(v) : undefined })}
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
              </div>
            )}

            {/* المحكمة تابعة لمجلس */}
            {formData.type === 'court' && (
              <div>
                <Label className="text-xs font-semibold">تابعة للمجلس القضائي</Label>
                <Select
                  value={formData.parentCouncilId?.toString() || ''}
                  onValueChange={(v) => setFormData({ ...formData, parentCouncilId: v ? Number(v) : undefined })}
                >
                  <SelectTrigger className="h-11">
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
              </div>
            )}

            {/* الغرف/الأقسام */}
            {(formData.type === 'supreme' || formData.type === 'council' || formData.type === 'court') && chambers.length > 0 && (
              <div>
                <Label className="text-xs font-semibold mb-2 block">
                  {formData.type === 'court' ? 'الأقسام وأرقامها' : 'الغرف وأرقامها'}
                </Label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
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
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>إلغاء</Button>
            <Button onClick={saveCourt} className="bg-teal-600 hover:bg-teal-700">حفظ</Button>
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
              onClick={() => deleteConfirm && deleteCourt(deleteConfirm)}
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
