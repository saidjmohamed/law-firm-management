'use client';

import React, { useState, useRef } from 'react';
import {
  useCases,
  useClients,
  useSessions,
  usePayments,
  useDelays,
  useParties,
  useArchives,
  useSettings,
  seedDatabase,
  refreshAll,
  getSettingValue,
} from '@/lib/api';
import { formatDate } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { toast } from 'sonner';
import {
  Download,
  Upload,
  FileText,
  HardDrive,
  Clock,
  AlertTriangle,
} from 'lucide-react';

export function BackupManager() {
  const [importing, setImporting] = useState(false);
  const [importConfirm, setImportConfirm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const { cases } = useCases();
  const { clients } = useClients();
  const { sessions } = useSessions();
  const { payments } = usePayments();
  const { delays } = useDelays();
  const { parties } = useParties();
  const { archives } = useArchives();
  const { settings } = useSettings();

  const lastBackupDate = getSettingValue(settings, 'lastBackupDate');

  const stats = {
    clients: clients.length,
    cases: cases.length,
    sessions: sessions.length,
    payments: payments.length,
    delays: delays.length,
    parties: parties.length,
    archives: archives.length,
  };

  async function handleExport() {
    try {
      const backupData = {
        // معلومات النسخة الاحتياطية
        schemaVersion: 2,
        exportDate: new Date().toISOString(),
        appVersion: '3.0',
        counts: {
          clients: clients.length,
          cases: cases.length,
          sessions: sessions.length,
          payments: payments.length,
          delays: delays.length,
          parties: parties.length,
          archives: archives.length,
        },
        // البيانات الفعلية
        clients,
        cases,
        sessions,
        payments,
        delays,
        parties,
        archives,
        settings,
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // تسجيل تاريخ آخر نسخ احتياطي
      try {
        await fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'lastBackupDate', value: new Date().toISOString() }),
        });
        await refreshAll();
      } catch {
        // non-fatal
      }

      toast.success('تم تصدير النسخة الاحتياطية بنجاح');
    } catch (err) {
      toast.error('حدث خطأ أثناء التصدير');
      console.error(err);
    }
  }

  /**
   * التحقق من بنية النسخة الاحتياطية قبل الاستيراد
   */
  function validateBackup(data: any): { ok: boolean; error?: string; counts?: Record<string, number> } {
    if (!data || typeof data !== 'object') {
      return { ok: false, error: 'الملف غير صالح' };
    }
    const expectedArrays = ['clients', 'cases', 'sessions', 'payments', 'delays', 'parties', 'archives'];
    for (const key of expectedArrays) {
      if (data[key] !== undefined && !Array.isArray(data[key])) {
        return { ok: false, error: `الحقل ${key} يجب أن يكون مصفوفة` };
      }
    }
    return {
      ok: true,
      counts: {
        clients: data.clients?.length ?? 0,
        cases: data.cases?.length ?? 0,
        sessions: data.sessions?.length ?? 0,
        payments: data.payments?.length ?? 0,
        delays: data.delays?.length ?? 0,
        parties: data.parties?.length ?? 0,
        archives: data.archives?.length ?? 0,
      },
    };
  }

  /**
   * تنظيف سجل قبل إرساله إلى API:
   * - إزالة id, createdAt, updatedAt (يولّدها الخادم)
   * - إزالة العلاقات المتداخلة (client, parties, delays, sessions, payments, archives, case, lawyer)
   */
  function cleanRecord(record: any): any {
    if (!record || typeof record !== 'object') return record;
    const {
      id,
      createdAt,
      updatedAt,
      client,
      parties,
      delays,
      sessions,
      payments,
      archives,
      case: caseRel,
      lawyer,
      ...rest
    } = record;
    return rest;
  }

  async function postJson(url: string, body: any): Promise<boolean> {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async function handleImport(file: File) {
    try {
      setImporting(true);
      const text = await file.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        toast.error('الملف ليس JSON صالح');
        return;
      }

      // التحقق من البنية
      const validation = validateBackup(data);
      if (!validation.ok) {
        toast.error(`ملف غير صالح: ${validation.error}`);
        return;
      }

      const expectedCounts = validation.counts!;
      const importedCounts = { clients: 0, cases: 0, sessions: 0, payments: 0, delays: 0, parties: 0, archives: 0 };

      // استيراد بالترتيب الصحيح: clients → cases → parties/delays/sessions/payments → archives
      // (لأن بعض الجداول لها foreign keys تتطلب وجود الأب أولاً)

      // 1) الموكلون (بدون الـ id الأصلي — سيُعين id جديد)
      // ملاحظة: للحفاظ على روابط cases→client، نستخدم خريطة قديم→جديد
      const clientIdMap = new Map<number, number>();
      if (Array.isArray(data.clients)) {
        for (const client of data.clients) {
          const oldId = client.id;
          const res = await fetch('/api/clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cleanRecord(client)),
          });
          if (res.ok) {
            const newClient = await res.json().catch(() => null);
            if (newClient?.id && oldId) clientIdMap.set(oldId, newClient.id);
            importedCounts.clients++;
          }
        }
      }

      // 2) القضايا
      const caseIdMap = new Map<number, number>();
      if (Array.isArray(data.cases)) {
        for (const caseItem of data.cases) {
          const oldId = caseItem.id;
          // ترجمة clientId القديم إلى الجديد
          const cleaned = cleanRecord(caseItem);
          if (cleaned.clientId && clientIdMap.has(cleaned.clientId)) {
            cleaned.clientId = clientIdMap.get(cleaned.clientId);
          }
          const res = await fetch('/api/cases', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cleaned),
          });
          if (res.ok) {
            const newCase = await res.json().catch(() => null);
            if (newCase?.id && oldId) caseIdMap.set(oldId, newCase.id);
            importedCounts.cases++;
          }
        }
      }

      // 3) التأجيلات (تحتاج caseId)
      if (Array.isArray(data.delays)) {
        for (const delay of data.delays) {
          const cleaned = cleanRecord(delay);
          if (cleaned.caseId && caseIdMap.has(cleaned.caseId)) {
            cleaned.caseId = caseIdMap.get(cleaned.caseId);
          }
          if (await postJson('/api/delays', cleaned)) importedCounts.delays++;
        }
      }

      // 4) الجلسات
      if (Array.isArray(data.sessions)) {
        for (const session of data.sessions) {
          const cleaned = cleanRecord(session);
          if (cleaned.caseId && caseIdMap.has(cleaned.caseId)) {
            cleaned.caseId = caseIdMap.get(cleaned.caseId);
          }
          if (await postJson('/api/sessions', cleaned)) importedCounts.sessions++;
        }
      }

      // 5) المدفوعات
      if (Array.isArray(data.payments)) {
        for (const payment of data.payments) {
          const cleaned = cleanRecord(payment);
          if (cleaned.caseId && caseIdMap.has(cleaned.caseId)) {
            cleaned.caseId = caseIdMap.get(cleaned.caseId);
          }
          if (await postJson('/api/payments', cleaned)) importedCounts.payments++;
        }
      }

      // 6) الأطراف (تحتاج caseId)
      if (Array.isArray(data.parties)) {
        for (const party of data.parties) {
          const cleaned = cleanRecord(party);
          if (cleaned.caseId && caseIdMap.has(cleaned.caseId)) {
            cleaned.caseId = caseIdMap.get(cleaned.caseId);
          }
          if (await postJson('/api/parties', cleaned)) importedCounts.parties++;
        }
      }

      // 7) الأرشيف
      if (Array.isArray(data.archives)) {
        for (const archive of data.archives) {
          const cleaned = cleanRecord(archive);
          if (cleaned.caseId && caseIdMap.has(cleaned.caseId)) {
            cleaned.caseId = caseIdMap.get(cleaned.caseId);
          }
          if (await postJson('/api/archives', cleaned)) importedCounts.archives++;
        }
      }

      await refreshAll();

      // تقرير التحقق من السلامة
      const failedCounts = {
        clients: expectedCounts.clients - importedCounts.clients,
        cases: expectedCounts.cases - importedCounts.cases,
        sessions: expectedCounts.sessions - importedCounts.sessions,
        payments: expectedCounts.payments - importedCounts.payments,
        delays: expectedCounts.delays - importedCounts.delays,
        parties: expectedCounts.parties - importedCounts.parties,
        archives: expectedCounts.archives - importedCounts.archives,
      };
      const totalFailed = Object.values(failedCounts).reduce((a, b) => a + b, 0);

      if (totalFailed === 0) {
        toast.success(`تم استيراد كل السجلات بنجاح (${importedCounts.cases} قضية، ${importedCounts.clients} موكل)`);
      } else {
        toast.warning(`استيراد جزئي — فشل ${totalFailed} سجل`, {
          description: JSON.stringify(failedCounts),
        });
      }

      setImportConfirm(false);
      setSelectedFile(null);
    } catch (err) {
      toast.error('حدث خطأ أثناء الاستيراد - تأكد من صحة الملف');
      console.error(err);
    } finally {
      setImporting(false);
    }
  }

  async function handleReset() {
    try {
      setResetting(true);
      await seedDatabase();
      toast.success('تم إعادة تعيين قاعدة البيانات بنجاح');
      setResetConfirm(false);
      window.location.reload();
    } catch (err) {
      toast.error('حدث خطأ أثناء إعادة التعيين');
      console.error(err);
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* إحصائيات قاعدة البيانات */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-teal-500" />
            حالة قاعدة البيانات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatBadge label="القضايا" count={stats.cases} />
            <StatBadge label="الموكلون" count={stats.clients} />
            <StatBadge label="الجلسات" count={stats.sessions} />
            <StatBadge label="المدفوعات" count={stats.payments} />
            <StatBadge label="التأجيلات" count={stats.delays} />
            <StatBadge label="الأطراف" count={stats.parties} />
            <StatBadge label="الأرشيف" count={stats.archives} />
          </div>
          {lastBackupDate && (
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>آخر نسخة احتياطية: {formatDate(lastBackupDate)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* تصدير */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="w-4 h-4 text-teal-500" />
            تصدير النسخة الاحتياطية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            تصدير جميع البيانات إلى ملف JSON يمكن استيراده لاحقاً
          </p>
          <Button onClick={handleExport} className="bg-teal-600 hover:bg-teal-700">
            <Download className="w-4 h-4 ml-2" />
            تصدير backup.json
          </Button>
        </CardContent>
      </Card>

      {/* استيراد من JSON */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="w-4 h-4 text-amber-500" />
            استيراد نسخة احتياطية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            استيراد بيانات من ملف JSON - سيتم إضافة البيانات المستوردة إلى البيانات الحالية
          </p>
          <div className="flex items-center gap-2">
            <input
              ref={jsonInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setSelectedFile(file);
                  setImportConfirm(true);
                }
              }}
            />
            <Button variant="outline" onClick={() => jsonInputRef.current?.click()}>
              <Upload className="w-4 h-4 ml-2" />
              اختيار ملف JSON
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* تأكيد الاستيراد */}
      <AlertDialog open={importConfirm} onOpenChange={setImportConfirm}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              تأكيد الاستيراد
            </AlertDialogTitle>
            <AlertDialogDescription>
              سيتم إضافة البيانات المستوردة إلى البيانات الحالية. هل أنت متأكد؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setImportConfirm(false); setSelectedFile(null); }}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedFile && handleImport(selectedFile)}
              disabled={importing}
            >
              {importing ? 'جاري الاستيراد...' : 'استيراد'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* إعادة تعيين قاعدة البيانات */}
      <Card className="border-destructive/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-4 h-4" />
            إعادة تعيين قاعدة البيانات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            حذف جميع البيانات وإعادة تحميل البيانات الأولية (19 قضية + 16 موكل). استخدم هذا الخيار إذا كانت البيانات مفقودة أو تالفة.
          </p>
          <Button
            variant="destructive"
            onClick={() => setResetConfirm(true)}
            disabled={resetting}
          >
            <AlertTriangle className="w-4 h-4 ml-2" />
            {resetting ? 'جاري إعادة التعيين...' : 'إعادة تعيين قاعدة البيانات'}
          </Button>
        </CardContent>
      </Card>

      {/* تأكيد إعادة التعيين */}
      <AlertDialog open={resetConfirm} onOpenChange={setResetConfirm}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              تأكيد إعادة التعيين
            </AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف جميع البيانات الحالية وإعادة تحميل البيانات الأولية. هل أنت متأكد؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              disabled={resetting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {resetting ? 'جاري إعادة التعيين...' : 'إعادة تعيين'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatBadge({ label, count }: { label: string; count: number }) {
  return (
    <div className="text-center p-2 bg-muted/50 rounded-lg">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-bold">{(count).toLocaleString('en-US')}</p>
    </div>
  );
}
