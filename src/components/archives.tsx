'use client';

import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Archive, type Case } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  Trash2,
  Eye,
  Archive as ArchiveIcon,
  RotateCcw,
  FileText,
  CalendarDays,
  Scale,
  Users,
  Banknote,
  Clock,
  MapPin,
} from 'lucide-react';
import { toast } from 'sonner';

// ============================================================================
// ثوابت
// ============================================================================
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

const fmtCurrency = (amount: number | undefined) => {
  if (!amount) return '—';
  return `${amount.toLocaleString('en-US')} د.ج`;
};

const statusLabels: Record<string, string> = {
  active: 'جارية',
  scheduling: 'للجدولة',
  decided: 'مفصول فيها',
  archived: 'مؤرشفة',
};

const courtTypeLabels: Record<string, string> = {
  ordinary: 'عادي',
  administrative: 'إداري',
  supreme: 'محكمة عليا',
};

// ============================================================================
// مكون الأرشيف
// ============================================================================
export function ArchivesManager() {
  const archives = useLiveQuery(() => db.archives.orderBy('archiveDate').reverse().toArray());
  const cases = useLiveQuery(() => db.cases.toArray());

  const [search, setSearch] = useState('');
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [selectedArchive, setSelectedArchive] = useState<Archive | null>(null);

  // Parse case data JSON
  const parsedCaseData = useMemo((): Case | null => {
    if (!selectedArchive?.caseData) return null;
    try {
      return JSON.parse(selectedArchive.caseData) as Case;
    } catch {
      return null;
    }
  }, [selectedArchive]);

  // Filter archives
  const filteredArchives = useMemo(() => {
    if (!archives) return [];
    return archives.filter((a) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      // Search in caseData fields
      const caseData = (() => {
        try { return JSON.parse(a.caseData); } catch { return {}; }
      })();
      return (
        (a.caseNumber && a.caseNumber.toString().toLowerCase().includes(q)) ||
        (caseData.caseNumber && caseData.caseNumber.toLowerCase().includes(q)) ||
        (caseData.subject && caseData.subject.toLowerCase().includes(q)) ||
        (caseData.clientName && caseData.clientName.toLowerCase().includes(q)) ||
        (a.reason && a.reason.toLowerCase().includes(q)) ||
        (caseData.courtName && caseData.courtName.toLowerCase().includes(q)) ||
        (caseData.notes && caseData.notes.toLowerCase().includes(q))
      );
    });
  }, [archives, search]);

  // Handlers
  const openView = (a: Archive) => {
    setSelectedArchive(a);
    setViewOpen(true);
  };

  const openDelete = (a: Archive) => {
    setSelectedArchive(a);
    setDeleteOpen(true);
  };

  const openRestore = (a: Archive) => {
    setSelectedArchive(a);
    setRestoreOpen(true);
  };

  const handleDelete = async () => {
    if (selectedArchive?.id) {
      try {
        await db.archives.delete(selectedArchive.id);
        toast.success('تم حذف الأرشيف نهائياً');
      } catch {
        toast.error('حدث خطأ أثناء الحذف');
      }
      setDeleteOpen(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedArchive?.id) return;
    try {
      const caseData = parsedCaseData;
      if (!caseData) {
        toast.error('لا يمكن استعادة القضية - بيانات تالفة');
        setRestoreOpen(false);
        return;
      }

      // Check if case already exists
      const existingCase = cases?.find((c) => c.id === selectedArchive.caseId);
      if (existingCase) {
        // Update existing case status back to active
        await db.cases.update(existingCase.id!, {
          status: 'active',
          updatedAt: new Date(),
        } as Case);
      } else {
        // Re-create the case from archived data
        const now = new Date();
        await db.cases.add({
          ...caseData,
          status: 'active',
          createdAt: caseData.createdAt ? new Date(caseData.createdAt) : now,
          updatedAt: now,
        });
      }

      // Remove from archive
      await db.archives.delete(selectedArchive.id);
      toast.success('تم استعادة القضية بنجاح');
    } catch {
      toast.error('حدث خطأ أثناء الاستعادة');
    }
    setRestoreOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-3">
        <Card className="border-0 shadow-sm flex-1">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800/50 flex items-center justify-center shrink-0">
              <ArchiveIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">إجمالي القضايا المؤرشفة</p>
              <p className="text-lg font-bold truncate">{(archives?.length ?? 0).toLocaleString('en-US')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث برقم القضية، الموضوع، الموكل..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>
      </div>

      {/* Count */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-sm">
          <ArchiveIcon className="w-3.5 h-3.5 ml-1" />
          {filteredArchives.length} قضية مؤرشفة
        </Badge>
      </div>

      {/* Desktop Table */}
      <Card className="border-0 shadow-sm overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">رقم القضية</TableHead>
                <TableHead className="text-right">موضوع القضية</TableHead>
                <TableHead className="text-right">الموكل</TableHead>
                <TableHead className="text-right">المحكمة</TableHead>
                <TableHead className="text-right">تاريخ الأرشفة</TableHead>
                <TableHead className="text-right">السبب</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredArchives.length > 0 ? (
                filteredArchives.map((a) => {
                  const caseData = (() => {
                    try { return JSON.parse(a.caseData); } catch { return {} as Partial<Case>; }
                  })();
                  return (
                    <TableRow key={a.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-sm">{caseData.caseNumber || '—'}</TableCell>
                      <TableCell className="max-w-[180px] truncate">{caseData.subject || '—'}</TableCell>
                      <TableCell className="max-w-[120px] truncate">{caseData.clientName || '—'}</TableCell>
                      <TableCell className="max-w-[130px] truncate">{caseData.courtName || '—'}</TableCell>
                      <TableCell className="text-sm">{formatDate(a.archiveDate)}</TableCell>
                      <TableCell className="max-w-[150px] truncate text-sm">{a.reason || '—'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openView(a)} title="عرض">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600" onClick={() => openRestore(a)} title="استعادة">
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => openDelete(a)} title="حذف">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {search ? 'لا توجد نتائج للبحث' : 'لا توجد قضايا مؤرشفة'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Mobile Cards */}
      <div className="space-y-3 md:hidden max-h-[calc(100vh-320px)] overflow-y-auto">
        {filteredArchives.length > 0 ? (
          filteredArchives.map((a) => {
            const caseData = (() => {
              try { return JSON.parse(a.caseData); } catch { return {} as Partial<Case>; }
            })();
            return (
              <Card key={a.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{caseData.subject || '—'}</p>
                      <p className="text-sm text-muted-foreground font-mono">{caseData.caseNumber || '—'}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs shrink-0 bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                      مؤرشفة
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-sm mb-3">
                    {caseData.clientName && (
                      <div><span className="text-muted-foreground">الموكل: </span>{caseData.clientName}</div>
                    )}
                    {caseData.courtName && (
                      <div><span className="text-muted-foreground">المحكمة: </span>{caseData.courtName}</div>
                    )}
                    <div><span className="text-muted-foreground">الأرشفة: </span>{formatDate(a.archiveDate)}</div>
                    {a.reason && (
                      <div><span className="text-muted-foreground">السبب: </span>{a.reason}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => openView(a)}>
                      <Eye className="w-4 h-4 ml-1" /> عرض
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-emerald-600" onClick={() => openRestore(a)}>
                      <RotateCcw className="w-4 h-4 ml-1" /> استعادة
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-destructive" onClick={() => openDelete(a)}>
                      <Trash2 className="w-4 h-4 ml-1" /> حذف
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-12 text-center text-muted-foreground">
              {search ? 'لا توجد نتائج للبحث' : 'لا توجد قضايا مؤرشفة'}
            </CardContent>
          </Card>
        )}
      </div>

      {/* View Archive Details Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل القضية المؤرشفة</DialogTitle>
            <DialogDescription>بيانات القضية المؤرشفة بالكامل</DialogDescription>
          </DialogHeader>
          {selectedArchive && parsedCaseData && (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/30">
                <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700/50 flex items-center justify-center shrink-0">
                  <ArchiveIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold">{parsedCaseData.subject || '—'}</p>
                  <p className="text-sm text-muted-foreground font-mono">{parsedCaseData.caseNumber || '—'}</p>
                </div>
                <Badge variant="secondary" className="text-xs shrink-0 mr-auto bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                  مؤرشفة
                </Badge>
              </div>

              {/* Archive Info */}
              <div className="text-sm space-y-2">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">تاريخ الأرشفة: </span>
                  <span className="font-medium">{formatDate(selectedArchive.archiveDate)}</span>
                </div>
                {selectedArchive.reason && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <span className="text-muted-foreground">سبب الأرشفة: </span>
                    {selectedArchive.reason}
                  </div>
                )}
              </div>

              <Separator />

              {/* Case Basic Info */}
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-600" />
                  معلومات أساسية
                </h4>
                <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-900/10 space-y-1 text-sm">
                  <div><span className="text-muted-foreground">رقم القضية: </span><span className="font-mono">{parsedCaseData.caseNumber || '—'}</span></div>
                  <div><span className="text-muted-foreground">الموضوع: </span>{parsedCaseData.subject || '—'}</div>
                  <div><span className="text-muted-foreground">الموكل: </span>{parsedCaseData.clientName || '—'}</div>
                  <div><span className="text-muted-foreground">طبيعة القضية: </span>{parsedCaseData.caseNature || '—'}</div>
                  <div><span className="text-muted-foreground">المرحلة: </span>{parsedCaseData.stage === 'أخرى' ? parsedCaseData.customStage : parsedCaseData.stage || '—'}</div>
                  <div><span className="text-muted-foreground">الحالة السابقة: </span>{statusLabels[parsedCaseData.status] || parsedCaseData.status || '—'}</div>
                </div>
              </div>

              {/* Court Info */}
              {(parsedCaseData.courtName || parsedCaseData.councilName || parsedCaseData.courtType) && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <Scale className="w-4 h-4 text-teal-600" />
                    الجهة القضائية
                  </h4>
                  <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-900/10 space-y-1 text-sm">
                    {parsedCaseData.courtType && <div><span className="text-muted-foreground">نوع القضاء: </span>{courtTypeLabels[parsedCaseData.courtType] || parsedCaseData.courtType}</div>}
                    {parsedCaseData.councilName && <div><span className="text-muted-foreground">المجلس: </span>{parsedCaseData.councilName}</div>}
                    {parsedCaseData.courtName && <div><span className="text-muted-foreground">المحكمة: </span>{parsedCaseData.courtName}</div>}
                    {parsedCaseData.sectionName && <div><span className="text-muted-foreground">القسم: </span>{parsedCaseData.sectionName}</div>}
                  </div>
                </div>
              )}

              {/* Financial Info */}
              {(parsedCaseData.fees || parsedCaseData.paid) && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-teal-600" />
                    الأتعاب
                  </h4>
                  <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-900/10 space-y-1 text-sm">
                    <div><span className="text-muted-foreground">الأتعاب: </span>{fmtCurrency(parsedCaseData.fees)}</div>
                    <div><span className="text-muted-foreground">المدفوع: </span>{fmtCurrency(parsedCaseData.paid)}</div>
                    {parsedCaseData.fees && (
                      <div>
                        <span className="text-muted-foreground">المتبقي: </span>
                        <span className={(parsedCaseData.fees - (parsedCaseData.paid || 0)) > 0 ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-emerald-600 dark:text-emerald-400'}>
                          {fmtCurrency(parsedCaseData.fees - (parsedCaseData.paid || 0))}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Opposing Party */}
              {(parsedCaseData.opposingParty || parsedCaseData.opposingLawyer) && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-teal-600" />
                    الخصم
                  </h4>
                  <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-900/10 space-y-1 text-sm">
                    {parsedCaseData.opposingParty && <div><span className="text-muted-foreground">الخصم: </span>{parsedCaseData.opposingParty}</div>}
                    {parsedCaseData.opposingLawyer && <div><span className="text-muted-foreground">محامي الخصم: </span>{parsedCaseData.opposingLawyer}</div>}
                  </div>
                </div>
              )}

              {/* Dates */}
              {(parsedCaseData.registrationDate || parsedCaseData.firstSessionDate || parsedCaseData.delibDate) && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-teal-600" />
                    التواريخ
                  </h4>
                  <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-900/10 space-y-1 text-sm">
                    {parsedCaseData.registrationDate && <div><span className="text-muted-foreground">تاريخ التسجيل: </span>{formatDate(parsedCaseData.registrationDate)}</div>}
                    {parsedCaseData.firstSessionDate && <div><span className="text-muted-foreground">أول جلسة: </span>{formatDate(parsedCaseData.firstSessionDate)}</div>}
                    {parsedCaseData.delibDate && <div><span className="text-muted-foreground">تاريخ المداولة: </span>{formatDate(parsedCaseData.delibDate)}</div>}
                  </div>
                </div>
              )}

              {/* Judgment */}
              {parsedCaseData.judgment && (
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-sm">
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium">منطوق الحكم: </span>
                  {parsedCaseData.judgment}
                </div>
              )}

              {/* Notes */}
              {parsedCaseData.notes && (
                <div className="text-sm p-3 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">ملاحظات: </span>
                  {parsedCaseData.notes}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                  onClick={() => {
                    setViewOpen(false);
                    setTimeout(() => openRestore(selectedArchive), 200);
                  }}
                >
                  <RotateCcw className="w-4 h-4 ml-2" />
                  استعادة
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 text-destructive hover:text-destructive"
                  onClick={() => {
                    setViewOpen(false);
                    setTimeout(() => openDelete(selectedArchive), 200);
                  }}
                >
                  <Trash2 className="w-4 h-4 ml-2" />
                  حذف
                </Button>
              </div>
            </div>
          )}
          {selectedArchive && !parsedCaseData && (
            <div className="py-8 text-center text-muted-foreground">
              لا يمكن قراءة بيانات القضية المؤرشفة
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Restore Confirmation */}
      <AlertDialog open={restoreOpen} onOpenChange={setRestoreOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الاستعادة</AlertDialogTitle>
            <AlertDialogDescription>
              هل تريد استعادة هذه القضية من الأرشيف؟ ستعود القضية إلى القائمة النشطة بحالة &quot;جارية&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore} className="bg-emerald-600 hover:bg-emerald-700">
              <RotateCcw className="w-4 h-4 ml-2" />
              استعادة
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف نهائي</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من الحذف النهائي لهذا الأرشيف؟ لا يمكن التراجع عن هذا الإجراء ولن تتمكن من استعادة القضية.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              حذف نهائي
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
