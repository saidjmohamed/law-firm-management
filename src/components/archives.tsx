'use client';

import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { STATUS_COLORS, formatDate } from '@/lib/constants';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { toast } from 'sonner';
import {
  Archive,
  RotateCcw,
  Eye,
  Trash2,
  ChevronLeft,
} from 'lucide-react';

export function ArchivesManager() {
  const { setSelectedCaseId, setActiveSection } = useAppStore();
  const [viewingArchive, setViewingArchive] = useState<number | null>(null);
  const [restoreConfirm, setRestoreConfirm] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const archives = useLiveQuery(() => db.archives.toArray());
  const cases = useLiveQuery(() => db.cases.toArray());

  const selectedArchive = archives?.find((a) => a.id === viewingArchive);
  const archiveData = selectedArchive ? JSON.parse(selectedArchive.caseData) : null;

  async function restoreFromArchive(archiveId: number) {
    const archive = await db.archives.get(archiveId);
    if (!archive) return;

    // إعادة حالة القضية إلى جارية
    await db.cases.update(archive.caseId, {
      status: 'جارية',
      updatedAt: new Date(),
    });

    // حذف من الأرشيف
    await db.archives.delete(archiveId);
    setRestoreConfirm(null);
    toast.success('تم استعادة القضية من الأرشيف');
  }

  async function deleteArchive(archiveId: number) {
    await db.archives.delete(archiveId);
    setDeleteConfirm(null);
    setViewingArchive(null);
    toast.success('تم حذف الأرشيف');
  }

  // عرض تفاصيل الأرشيف
  if (viewingArchive !== null && archiveData) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setViewingArchive(null)}>
            <ChevronLeft className="w-4 h-4 ml-1" />
            العودة
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{archiveData.caseNumber || '—'}</CardTitle>
              <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">مؤرشفة</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">{archiveData.subject || '—'}</p>

            <div className="grid grid-cols-2 gap-3 text-sm">
              {archiveData.caseNature && (
                <div>
                  <p className="text-xs text-muted-foreground">طبيعة القضية</p>
                  <p className="font-medium">{archiveData.caseNature}</p>
                </div>
              )}
              {archiveData.litigationStage && (
                <div>
                  <p className="text-xs text-muted-foreground">مرحلة التقاضي</p>
                  <p className="font-medium">{archiveData.litigationStage}</p>
                </div>
              )}
              {archiveData.courtName && (
                <div>
                  <p className="text-xs text-muted-foreground">المحكمة</p>
                  <p className="font-medium">{archiveData.courtName}</p>
                </div>
              )}
              {archiveData.councilName && (
                <div>
                  <p className="text-xs text-muted-foreground">المجلس</p>
                  <p className="font-medium">{archiveData.councilName}</p>
                </div>
              )}
              {archiveData.chamber && (
                <div>
                  <p className="text-xs text-muted-foreground">الغرفة</p>
                  <p className="font-medium">{archiveData.chamber}</p>
                </div>
              )}
              {archiveData.totalFees != null && (
                <div>
                  <p className="text-xs text-muted-foreground">الأتعاب</p>
                  <p className="font-medium">{(archiveData.totalFees).toLocaleString('en-US')} د.ج</p>
                </div>
              )}
            </div>

            {archiveData.judgment && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">منطوق الحكم</p>
                <p className="text-sm whitespace-pre-wrap">{archiveData.judgment}</p>
              </div>
            )}

            {/* أطراف النزاع */}
            {archiveData.parties && archiveData.parties.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">أطراف النزاع</p>
                <div className="space-y-1">
                  {archiveData.parties.map((p: { role?: string; name?: string }, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="text-xs">{p.role || '—'}</Badge>
                      <span>{p.name || '—'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-3">
              <Button
                variant="outline"
                onClick={() => selectedArchive?.id && setRestoreConfirm(selectedArchive.id)}
                className="text-teal-700 border-teal-300 hover:bg-teal-50 dark:text-teal-400 dark:border-teal-700 dark:hover:bg-teal-900/20"
              >
                <RotateCcw className="w-4 h-4 ml-1" />
                استعادة
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => selectedArchive?.id && setDeleteConfirm(selectedArchive.id)}
              >
                <Trash2 className="w-3 h-3 ml-1" />
                حذف الأرشيف
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* تأكيد الاستعادة */}
        <AlertDialog open={restoreConfirm !== null} onOpenChange={() => setRestoreConfirm(null)}>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>تأكيد الاستعادة</AlertDialogTitle>
              <AlertDialogDescription>
                سيتم استعادة القضية وتغيير حالتها إلى &quot;جارية&quot;.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction onClick={() => restoreConfirm && restoreFromArchive(restoreConfirm)}>
                استعادة
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* تأكيد حذف الأرشيف */}
        <AlertDialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>حذف الأرشيف</AlertDialogTitle>
              <AlertDialogDescription>
                سيتم حذف الأرشيف نهائياً. القضية ستبقى في النظام بحالة &quot;مؤرشفة&quot;.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteConfirm && deleteArchive(deleteConfirm)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
      {archives && archives.length > 0 ? (
        <div className="space-y-2">
          {archives.map((archive) => {
            let data: { caseNumber?: string; subject?: string; courtName?: string } = {};
            try {
              data = JSON.parse(archive.caseData);
            } catch { /* ignore */ }

            return (
              <Card
                key={archive.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setViewingArchive(archive.id ?? null)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Archive className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium">{data.caseNumber || '—'}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">{data.subject || '—'}</p>
                    </div>
                    <div className="text-left mr-3">
                      <Badge variant="outline" className="text-xs">{formatDate(archive.archiveDate)}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Archive className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">لا توجد قضايا مؤرشفة</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
