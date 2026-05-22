'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import {
  exportToFile,
  importFromFile,
  getBackupInfo,
} from '@/lib/backup';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
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
  Download,
  Upload,
  HardDrive,
  Database,
  Users,
  Briefcase,
  Calendar,
  Banknote,
  Clock,
  Archive,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileJson,
  Shield,
  CalendarClock,
  RotateCcw,
  Loader2,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';

// ============================================================================
// ثوابت
// ============================================================================

const LAST_BACKUP_KEY = 'lawfirm_last_backup_date';
const LAST_RESTORE_KEY = 'lawfirm_last_restore_date';
const BACKUP_WARNING_DAYS = 7;

/** أسماء الجداول بالعربية */
const TABLE_LABELS: Record<string, string> = {
  clients: 'الموكلون',
  cases: 'القضايا',
  sessions: 'الجلسات',
  payments: 'المدفوعات',
  delays: 'التأجيلات',
  parties: 'أطراف النزاع',
  archives: 'الأرشيف',
};

/** أيقونات الجداول */
const TABLE_ICONS: Record<string, React.ElementType> = {
  clients: Users,
  cases: Briefcase,
  sessions: Calendar,
  payments: Banknote,
  delays: Clock,
  parties: Shield,
  archives: Archive,
};

/** ألوان الجداول */
const TABLE_COLORS: Record<string, string> = {
  clients: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20',
  cases: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20',
  sessions: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20',
  payments: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20',
  delays: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20',
  parties: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20',
  archives: 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/30',
};

// ============================================================================
// دوال مساعدة
// ============================================================================

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('ar-DZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function formatDateShort(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('ar-DZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getDaysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const then = new Date(dateStr).getTime();
  const now = Date.now();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

function getLastBackupDate(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(LAST_BACKUP_KEY);
}

function setLastBackupDate(date: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LAST_BACKUP_KEY, date);
}

function getLastRestoreDate(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(LAST_RESTORE_KEY);
}

function setLastRestoreDate(date: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LAST_RESTORE_KEY, date);
}

// ============================================================================
// مكون إحصائيات قاعدة البيانات
// ============================================================================

function DatabaseStats() {
  const clientCount = useLiveQuery(() => db.clients.count(), []);
  const caseCount = useLiveQuery(() => db.cases.count(), []);
  const sessionCount = useLiveQuery(() => db.sessions.count(), []);
  const paymentCount = useLiveQuery(() => db.payments.count(), []);
  const delayCount = useLiveQuery(() => db.delays.count(), []);
  const partyCount = useLiveQuery(() => db.parties.count(), []);
  const archiveCount = useLiveQuery(() => db.archives.count(), []);

  const counts: Record<string, number | undefined> = {
    clients: clientCount,
    cases: caseCount,
    sessions: sessionCount,
    payments: paymentCount,
    delays: delayCount,
    parties: partyCount,
    archives: archiveCount,
  };

  const totalRecords = Object.values(counts).reduce(
    (sum, c) => sum + (c ?? 0),
    0
  );

  // تقدير حجم البيانات (تقريبي)
  const estimatedSizeKB = totalRecords * 0.5; // ~0.5 KB per record average
  const sizeLabel =
    estimatedSizeKB > 1024
      ? `${(estimatedSizeKB / 1024).toFixed(1)} MB`
      : `${estimatedSizeKB.toFixed(0)} KB`;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Database className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            إحصائيات قاعدة البيانات
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {sizeLabel} تقريباً
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Object.entries(TABLE_LABELS).map(([key, label]) => {
            const Icon = TABLE_ICONS[key] || Database;
            const colorClass = TABLE_COLORS[key] || '';
            const count = counts[key];
            return (
              <div
                key={key}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">
                    {label}
                  </p>
                  <p className="text-lg font-bold leading-tight">
                    {count ?? '...'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center justify-between p-3 rounded-lg bg-teal-50 dark:bg-teal-900/20">
          <span className="text-sm font-medium text-teal-700 dark:text-teal-400">
            إجمالي السجلات
          </span>
          <span className="text-lg font-bold text-teal-700 dark:text-teal-400">
            {totalRecords}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// مكون سجل النسخ الاحتياطي
// ============================================================================

function BackupHistory() {
  const [lastBackup] = useState<string | null>(() => getLastBackupDate());
  const [lastRestore] = useState<string | null>(() => getLastRestoreDate());

  const daysSinceBackup = getDaysSince(lastBackup);
  const isWarning =
    daysSinceBackup !== null && daysSinceBackup >= BACKUP_WARNING_DAYS;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <CalendarClock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          سجل النسخ الاحتياطي
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isWarning && (
          <div className="flex items-start gap-3 p-3 mb-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                لم تقم بالنسخ الاحتياطي منذ {daysSinceBackup} يوم
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                ننصح بإجراء نسخة احتياطية بشكل منتظم لحماية بياناتك
              </p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium">آخر نسخة احتياطية</p>
                <p className="text-xs text-muted-foreground">
                  {lastBackup ? formatDate(lastBackup) : 'لم يتم بعد'}
                </p>
              </div>
            </div>
            {lastBackup && (
              <Badge
                variant="secondary"
                className={`text-xs ${
                  isWarning
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                }`}
              >
                {isWarning ? `${daysSinceBackup} يوم` : 'حديث'}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center">
                <RotateCcw className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="text-sm font-medium">آخر استعادة</p>
                <p className="text-xs text-muted-foreground">
                  {lastRestore ? formatDate(lastRestore) : 'لم يتم بعد'}
                </p>
              </div>
            </div>
            {lastRestore && (
              <Badge
                variant="secondary"
                className="text-xs bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400"
              >
                {formatDateShort(lastRestore)}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// مكون معلومات النسخة الاحتياطية (قبل الاستعادة)
// ============================================================================

interface BackupInfoDisplayProps {
  info: NonNullable<Awaited<ReturnType<typeof getBackupInfo>>>;
  fileSize: number;
  fileName: string;
}

function BackupInfoDisplay({ info, fileSize, fileName }: BackupInfoDisplayProps) {
  const totalRecords = Object.values(info.counts).reduce(
    (sum, c) => sum + c,
    0
  );

  return (
    <div className="space-y-3 p-4 rounded-lg bg-muted/50 border">
      <div className="flex items-center gap-2 mb-2">
        <FileJson className="w-4 h-4 text-teal-600 dark:text-teal-400" />
        <span className="text-sm font-medium truncate">{fileName}</span>
        <Badge variant="outline" className="text-xs mr-auto shrink-0">
          {formatFileSize(fileSize)}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">الإصدار:</span>
          <span className="font-medium">{info.version}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">التاريخ:</span>
          <span className="font-medium">{formatDateShort(info.exportDate)}</span>
        </div>
        <div className="flex items-center gap-2 col-span-2">
          <span className="text-muted-foreground">الجهاز:</span>
          <span className="font-medium text-xs truncate" dir="ltr">
            {info.deviceId}
          </span>
        </div>
      </div>

      <Separator />

      <div>
        <p className="text-xs text-muted-foreground mb-2">
          السجلات المضمّنة ({totalRecords} إجمالاً):
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.entries(info.counts).map(([key, count]) => {
            const label = TABLE_LABELS[key] || key;
            if (count === 0) return null;
            return (
              <div
                key={key}
                className="flex items-center gap-1.5 text-xs p-1.5 rounded bg-background"
              >
                <span className="text-muted-foreground">{label}:</span>
                <span className="font-bold">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// المكون الرئيسي: مدير النسخ الاحتياطي
// ============================================================================

export function BackupManager() {
  // حالات التصدير
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState<{
    date: string;
    fileName: string;
  } | null>(null);

  // حالات الاستعادة
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [backupInfo, setBackupInfo] = useState<
    NonNullable<Awaited<ReturnType<typeof getBackupInfo>>> | null
  >(null);
  const [fileSize, setFileSize] = useState<number>(0);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // تحديث سجل النسخ عند التحميل
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    forceUpdate((c) => c + 1);
  }, [exportResult, importSuccess]);

  // ============================================================================
  // التصدير
  // ============================================================================
  const handleExport = useCallback(async () => {
    setExporting(true);
    setExportResult(null);
    try {
      await exportToFile();
      const now = new Date().toISOString();
      const dateStr = now.split('T')[0];
      setExportResult({
        date: now,
        fileName: `backup_${dateStr}.json`,
      });
      setLastBackupDate(now);
      toast.success('تم حفظ النسخة الاحتياطية بنجاح', {
        description: `الملف: backup_${dateStr}.json`,
      });
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('فشل في حفظ النسخة الاحتياطية', {
        description:
          err instanceof Error ? err.message : 'حدث خطأ غير متوقع',
      });
    } finally {
      setExporting(false);
    }
  }, []);

  // ============================================================================
  // اختيار ملف الاستعادة
  // ============================================================================
  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // التحقق من نوع الملف
      if (!file.name.toLowerCase().endsWith('.json')) {
        toast.error('يرجى اختيار ملف بصيغة .json', {
          description: 'الملفات المشفرة غير مدعومة',
        });
        // إعادة تعيين حقل الملف
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      setSelectedFile(file);
      setFileSize(file.size);
      setBackupInfo(null);
      setImportError(null);
      setImportSuccess(false);
      setLoadingInfo(true);

      try {
        const info = await getBackupInfo(file);
        if (!info) {
          setImportError('فشل في قراءة ملف النسخة الاحتياطية - الملف قد يكون تالفاً');
          toast.error('فشل في قراءة ملف النسخة الاحتياطية');
          return;
        }
        setBackupInfo(info);
      } catch (err) {
        console.error('Failed to read backup info:', err);
        setImportError(
          err instanceof Error
            ? err.message
            : 'فشل في قراءة معلومات الملف'
        );
        toast.error('فشل في قراءة معلومات الملف');
      } finally {
        setLoadingInfo(false);
      }
    },
    []
  );

  // ============================================================================
  // الاستعادة
  // ============================================================================
  const handleImportConfirm = useCallback(async () => {
    if (!selectedFile) return;

    setShowConfirmDialog(false);
    setImporting(true);
    setImportProgress(0);
    setImportError(null);
    setImportSuccess(false);

    try {
      // محاكاة تقدم الاستعادة
      setImportProgress(20);
      await new Promise((r) => setTimeout(r, 300));

      setImportProgress(50);
      const backupData = await importFromFile(selectedFile);

      setImportProgress(80);
      await new Promise((r) => setTimeout(r, 200));

      setImportProgress(100);

      const now = new Date().toISOString();
      setLastRestoreDate(now);

      setImportSuccess(true);

      const totalRecords = backupData.data
        ? Object.values(backupData.data).reduce(
            (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
            0
          )
        : 0;

      toast.success('تمت استعادة البيانات بنجاح', {
        description: `تم استعادة ${totalRecords} سجل`,
      });
    } catch (err) {
      console.error('Import failed:', err);
      const msg =
        err instanceof Error ? err.message : 'حدث خطأ غير متوقع';
      setImportError(msg);
      toast.error('فشل في استعادة البيانات', {
        description: msg,
      });
    } finally {
      setImporting(false);
    }
  }, [selectedFile]);

  const handleResetImport = useCallback(() => {
    setSelectedFile(null);
    setBackupInfo(null);
    setFileSize(0);
    setImportError(null);
    setImportSuccess(false);
    setImportProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  return (
    <div className="space-y-6">
      {/* ================================================================== */}
      {/* قسم التصدير                                                       */}
      {/* ================================================================== */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Download className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            حفظ نسخة احتياطية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            قم بإنشاء نسخة احتياطية كاملة من جميع بياناتك وتنزيلها كملف JSON
            على جهازك. يمكنك استخدام هذا الملف لاستعادة بياناتك لاحقاً.
          </p>

          <Button
            onClick={handleExport}
            disabled={exporting}
            className="w-full h-14 text-base font-semibold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            size="lg"
          >
            {exporting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                جارٍ الحفظ...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                حفظ نسخة احتياطية
              </>
            )}
          </Button>

          {/* نتيجة التصدير */}
          {exportResult && (
            <div className="mt-4 flex items-start gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  تم حفظ النسخة الاحتياطية بنجاح
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">
                  الملف: {exportResult.fileName} • التاريخ:{' '}
                  {formatDate(exportResult.date)}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ================================================================== */}
      {/* قسم الاستعادة                                                      */}
      {/* ================================================================== */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Upload className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            استعادة من نسخة احتياطية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            استعد بياناتك من ملف نسخة احتياطية سابقة. سيتم استبدال جميع
            البيانات الحالية بالبيانات المستعادة.
          </p>

          {/* حقل اختيار الملف */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                disabled={importing}
                className="hidden"
                id="backup-file-input"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="flex-1 gap-2"
              >
                <FileJson className="w-4 h-4" />
                {selectedFile ? selectedFile.name : 'اختيار ملف النسخة الاحتياطية'}
              </Button>
              {selectedFile && !importing && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleResetImport}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* تحميل معلومات الملف */}
            {loadingInfo && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                <span className="text-sm text-muted-foreground">
                  جارٍ قراءة معلومات الملف...
                </span>
              </div>
            )}

            {/* خطأ في قراءة الملف */}
            {importError && !importSuccess && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">
                    فشل في قراءة الملف
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-500 mt-1">
                    {importError}
                  </p>
                </div>
              </div>
            )}

            {/* عرض معلومات النسخة الاحتياطية */}
            {backupInfo && selectedFile && !importError && (
              <>
                <BackupInfoDisplay
                  info={backupInfo}
                  fileSize={fileSize}
                  fileName={selectedFile.name}
                />

                {/* تحذير الاستبدال */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                      تنبيه: سيتم استبدال جميع البيانات الحالية
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                      لا يمكن التراجع عن هذه العملية. ننصحك بحفظ نسخة
                      احتياطية من بياناتك الحالية أولاً.
                    </p>
                  </div>
                </div>

                {/* زر الاستعادة */}
                <Button
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={importing}
                  className="w-full gap-2 bg-teal-600 hover:bg-teal-700 text-white"
                >
                  <Upload className="w-4 h-4" />
                  استعادة البيانات
                </Button>
              </>
            )}

            {/* شريط التقدم أثناء الاستعادة */}
            {importing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جارٍ استعادة البيانات...
                  </span>
                  <span className="font-medium">{importProgress}%</span>
                </div>
                <Progress value={importProgress} className="h-2" />
              </div>
            )}

            {/* نجاح الاستعادة */}
            {importSuccess && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    تمت استعادة البيانات بنجاح
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">
                    يمكنك الآن تصفح بياناتك المستعادة. قد تحتاج الصفحة إلى
                    التحديث لعرض جميع التغييرات.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 gap-1 text-xs"
                    onClick={handleResetImport}
                  >
                    استعادة ملف آخر
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ================================================================== */}
      {/* سجل النسخ الاحتياطي                                                */}
      {/* ================================================================== */}
      <BackupHistory key={`history-${exportResult?.date}-${importSuccess}`} />

      {/* ================================================================== */}
      {/* إحصائيات قاعدة البيانات                                            */}
      {/* ================================================================== */}
      <DatabaseStats />

      {/* ================================================================== */}
      {/* حوار تأكيد الاستعادة                                               */}
      {/* ================================================================== */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              تأكيد الاستعادة
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                هل تريد استبدال جميع البيانات الحالية بالبيانات الموجودة في
                النسخة الاحتياطية؟
              </p>
              <div className="flex items-start gap-2 p-2 rounded bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  سيتم حذف جميع البيانات الحالية واستبدالها. لا يمكن التراجع
                  عن هذه العملية.
                </span>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleImportConfirm}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              نعم، استعادة البيانات
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
