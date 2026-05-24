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
        exportDate: new Date().toISOString(),
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
      toast.success('تم تصدير النسخة الاحتياطية بنجاح');
    } catch (err) {
      toast.error('حدث خطأ أثناء التصدير');
      console.error(err);
    }
  }

  async function handleImport(file: File) {
    try {
      setImporting(true);
      const text = await file.text();
      const data = JSON.parse(text);

      // استيراد البيانات عبر API
      if (data.clients && Array.isArray(data.clients)) {
        for (const client of data.clients) {
          await fetch('/api/clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(client),
          });
        }
      }
      if (data.cases && Array.isArray(data.cases)) {
        for (const caseItem of data.cases) {
          await fetch('/api/cases', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(caseItem),
          });
        }
      }
      if (data.sessions && Array.isArray(data.sessions)) {
        for (const session of data.sessions) {
          await fetch('/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(session),
          });
        }
      }
      if (data.payments && Array.isArray(data.payments)) {
        for (const payment of data.payments) {
          await fetch('/api/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payment),
          });
        }
      }
      if (data.delays && Array.isArray(data.delays)) {
        for (const delay of data.delays) {
          await fetch('/api/delays', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(delay),
          });
        }
      }
      if (data.parties && Array.isArray(data.parties)) {
        for (const party of data.parties) {
          await fetch('/api/parties', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(party),
          });
        }
      }
      if (data.archives && Array.isArray(data.archives)) {
        for (const archive of data.archives) {
          await fetch('/api/archives', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(archive),
          });
        }
      }

      await refreshAll();
      toast.success('تم استيراد النسخة الاحتياطية بنجاح');
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
