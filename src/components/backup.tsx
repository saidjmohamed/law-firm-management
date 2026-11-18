'use client';

import React, { useState, useRef } from 'react';
import {
  useCases,
  useTasks,
  useLawyers,
  useJudicialBodies,
  useSessions,
  usePayments,
  useDelays,
  useParties,
  useArchives,
  useSettings,
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
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const { cases } = useCases();
  const { tasks } = useTasks();
  const { lawyers } = useLawyers();
  const { judicialBodies } = useJudicialBodies();
  const { sessions } = useSessions();
  const { payments } = usePayments();
  const { delays } = useDelays();
  const { parties } = useParties();
  const { archives } = useArchives();
  const { settings } = useSettings();

  const lastBackupDate = getSettingValue(settings, 'lastBackupDate');

  const stats = {
    cases: cases.length,
    tasks: tasks.length,
    lawyers: lawyers.length,
    judicialBodies: judicialBodies.length,
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
        schemaVersion: 3,
        exportDate: new Date().toISOString(),
        appVersion: '3.0',
        counts: {
          cases: cases.length,
          tasks: tasks.length,
          lawyers: lawyers.length,
          judicialBodies: judicialBodies.length,
          sessions: sessions.length,
          payments: payments.length,
          delays: delays.length,
          parties: parties.length,
          archives: archives.length,
        },
        // البيانات الفعلية
        cases,
        tasks,
        lawyers,
        judicialBodies,
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
    const expectedArrays = ['cases', 'sessions', 'payments', 'delays', 'parties', 'archives', 'tasks', 'lawyers', 'judicialBodies'];
    for (const key of expectedArrays) {
      if (data[key] !== undefined && !Array.isArray(data[key])) {
        return { ok: false, error: `الحقل ${key} يجب أن يكون مصفوفة` };
      }
    }
    return {
      ok: true,
      counts: {
        cases: data.cases?.length ?? 0,
        tasks: data.tasks?.length ?? 0,
        lawyers: data.lawyers?.length ?? 0,
        judicialBodies: data.judicialBodies?.length ?? 0,
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
   * - إزالة العلاقات المتداخلة (parties, delays, sessions, payments, archives, case, lawyer)
   */
  function cleanRecord(record: any): any {
    if (!record || typeof record !== 'object') return record;
    const {
      id,
      createdAt,
      updatedAt,
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
      const importedCounts = { cases: 0, sessions: 0, payments: 0, delays: 0, parties: 0, archives: 0, tasks: 0, lawyers: 0, judicialBodies: 0 };

      // 1) المحامون والهيئات القضائية أولاً حتى نعيد ربط المراجع.
      const lawyerIdMap = new Map<number, number>();
      for (const lawyer of (Array.isArray(data.lawyers) ? data.lawyers : [])) {
        const oldId = lawyer.id;
        const res = await fetch('/api/lawyers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cleanRecord(lawyer)) });
        if (res.ok) { const created = await res.json().catch(() => null); if (created?.id && oldId) lawyerIdMap.set(oldId, created.id); importedCounts.lawyers++; }
      }
      const judicialBodyIdMap = new Map<number, number>();
      for (const body of (Array.isArray(data.judicialBodies) ? data.judicialBodies : [])) {
        const oldId = body.id;
        const res = await fetch('/api/judicial-bodies', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cleanRecord(body)) });
        if (res.ok) { const created = await res.json().catch(() => null); if (created?.id && oldId) judicialBodyIdMap.set(oldId, created.id); importedCounts.judicialBodies++; }
      }

      // 2) القضايا
      const caseIdMap = new Map<number, number>();
      const delayIdMap = new Map<number, number>();
      const sessionIdMap = new Map<number, number>();
      // توافق رجعي: تحويل ارتباط الشخص القديم إلى طرف ممثل في القضية.
      const legacyPeople = new Map<number, any>((Array.isArray(data.clients) ? data.clients : []).map((client: any) => [Number(client.id), client]));
      const legacyCaseParties = new Map<number, any>();
      if (Array.isArray(data.cases)) {
        for (const caseItem of data.cases) {
          const oldId = caseItem.id;
          const cleaned = cleanRecord(caseItem);
          const legacyPerson = caseItem.clientId ? legacyPeople.get(Number(caseItem.clientId)) : null;
          if (legacyPerson) legacyCaseParties.set(Number(oldId), legacyPerson);
          delete cleaned.clientId;
          if (cleaned.courtId && judicialBodyIdMap.has(cleaned.courtId)) cleaned.courtId = judicialBodyIdMap.get(cleaned.courtId);
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
          const oldId = delay.id;
          const cleaned = cleanRecord(delay);
          if (cleaned.caseId && caseIdMap.has(cleaned.caseId)) cleaned.caseId = caseIdMap.get(cleaned.caseId);
          const res = await fetch('/api/delays', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cleaned) });
          if (res.ok) {
            const created = await res.json().catch(() => null);
            if (created?.id && oldId) delayIdMap.set(oldId, created.id);
            importedCounts.delays++;
          }
        }
      }

      // 4) الجلسات
      if (Array.isArray(data.sessions)) {
        for (const session of data.sessions) {
          const oldId = session.id;
          const cleaned = cleanRecord(session);
          cleaned.skipAutoTask = true;
          if (cleaned.caseId && caseIdMap.has(cleaned.caseId)) cleaned.caseId = caseIdMap.get(cleaned.caseId);
          const res = await fetch('/api/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cleaned) });
          if (res.ok) {
            const created = await res.json().catch(() => null);
            if (created?.id && oldId) sessionIdMap.set(oldId, created.id);
            importedCounts.sessions++;
          }
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
          if (cleaned.caseId && caseIdMap.has(cleaned.caseId)) cleaned.caseId = caseIdMap.get(cleaned.caseId);
          if (cleaned.lawyerId && lawyerIdMap.has(cleaned.lawyerId)) cleaned.lawyerId = lawyerIdMap.get(cleaned.lawyerId);
          if (await postJson('/api/parties', cleaned)) importedCounts.parties++;
        }
      }

      // تحويل روابط الأشخاص القديمة إلى أطراف ممثلة بعد إنشاء الأطراف الأصلية.
      for (const [oldCaseId, legacyPerson] of legacyCaseParties) {
        const newCaseId = caseIdMap.get(oldCaseId);
        if (!newCaseId) continue;
        const existingRepresented = Array.isArray(data.parties) && data.parties.some((p: any) => Number(p.caseId) === oldCaseId && (p.side || 'for') === 'for' && (p.name || '').trim().toLowerCase() === (legacyPerson.name || '').trim().toLowerCase());
        if (!existingRepresented) {
          const converted = { caseId: newCaseId, name: legacyPerson.name || '', phone: legacyPerson.phone || '', phone2: legacyPerson.phone2 || '', address: legacyPerson.address || null, wilaya: legacyPerson.wilaya ?? 16, nationalId: legacyPerson.nationalId || null, contactNotes: legacyPerson.notes || null, role: '', side: 'for' };
          if (await postJson('/api/parties', converted)) importedCounts.parties++;
        }
      }

      // حفظ الأشخاص الذين لم يرتبطوا بأي قضية في النسخة القديمة داخل سجل ترحيل غير ظاهر.
      if (Array.isArray(data.clients)) {
        const linkedLegacyIds = new Set((Array.isArray(data.cases) ? data.cases : []).map((item: any) => Number(item.clientId)).filter(Boolean));
        const unassignedPeople = data.clients
          .filter((person: any) => !linkedLegacyIds.has(Number(person.id)))
          .map((person: any) => ({
            name: person.name || '',
            phone: person.phone || '',
            phone2: person.phone2 || '',
            address: person.address || '',
            wilaya: person.wilaya ?? 16,
            nationalId: person.nationalId || '',
            notes: person.notes || '',
          }));
        if (unassignedPeople.length) {
          await fetch('/api/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: 'legacyUnassignedPartyData', value: JSON.stringify(unassignedPeople) }),
          });
        }
      }

      // 7) المهام المرتبطة بالقضايا.
      if (Array.isArray(data.tasks)) {
        for (const task of data.tasks) {
          const cleaned = cleanRecord(task);
          if (cleaned.relatedCaseId && caseIdMap.has(cleaned.relatedCaseId)) cleaned.relatedCaseId = caseIdMap.get(cleaned.relatedCaseId);
          if (cleaned.sourceType === 'session' && cleaned.sourceId && sessionIdMap.has(cleaned.sourceId)) cleaned.sourceId = sessionIdMap.get(cleaned.sourceId);
          if (cleaned.sourceType === 'delay' && cleaned.sourceId && delayIdMap.has(cleaned.sourceId)) cleaned.sourceId = delayIdMap.get(cleaned.sourceId);
          if (cleaned.sourceType === 'judgment' && cleaned.sourceId && caseIdMap.has(cleaned.sourceId)) cleaned.sourceId = caseIdMap.get(cleaned.sourceId);
          delete cleaned.relatedClientId;
          if (await postJson('/api/tasks', cleaned)) importedCounts.tasks++;
        }
      }

      // 8) الإعدادات
      if (data.settings && typeof data.settings === 'object') {
        for (const [key, value] of Object.entries(data.settings)) {
          try {
            await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, value }) });
          } catch { /* continue importing other records */ }
        }
      }

      // 9) الأرشيف
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
        cases: expectedCounts.cases - importedCounts.cases,
        sessions: expectedCounts.sessions - importedCounts.sessions,
        payments: expectedCounts.payments - importedCounts.payments,
        delays: expectedCounts.delays - importedCounts.delays,
        parties: Math.max(0, expectedCounts.parties - importedCounts.parties),
        archives: expectedCounts.archives - importedCounts.archives,
        tasks: expectedCounts.tasks - importedCounts.tasks,
        lawyers: expectedCounts.lawyers - importedCounts.lawyers,
        judicialBodies: expectedCounts.judicialBodies - importedCounts.judicialBodies,
      };
      const totalFailed = Object.values(failedCounts).reduce((a, b) => a + b, 0);

      if (totalFailed === 0) {
        toast.success(`تم استيراد كل السجلات بنجاح (${importedCounts.cases} قضية، ${importedCounts.parties} طرف)`);
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
            <StatBadge label="المهام" count={stats.tasks} />
            <StatBadge label="المحامون" count={stats.lawyers} />
            <StatBadge label="الهيئات القضائية" count={stats.judicialBodies} />
            <StatBadge label="الأطراف" count={stats.parties} />
            <StatBadge label="الجلسات" count={stats.sessions} />
            <StatBadge label="المدفوعات" count={stats.payments} />
            <StatBadge label="التأجيلات" count={stats.delays} />
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

      <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20">
        <CardContent className="flex items-start gap-3 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400" />
          <div>
            <p className="text-sm font-semibold">حماية بيانات المكتب</p>
            <p className="mt-1 text-sm text-muted-foreground">
              تم تعطيل إعادة تعيين قاعدة البيانات من الواجهة حتى لا تُحذف القضايا أو سجلات الموكلين بطريق الخطأ. استخدم النسخ الاحتياطي للتصدير والاستعادة فقط.
            </p>
          </div>
        </CardContent>
      </Card>
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
