'use client';

import React, { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getSetting } from '@/lib/db';
import { exportBackup, importBackup, importFromTxtFiles } from '@/lib/backup';
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
  const [txtImporting, setTxtImporting] = useState(false);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const txtInputRef = useRef<HTMLInputElement>(null);

  const lastBackupDate = useLiveQuery(() => getSetting<string>('lastBackupDate'));

  const stats = useLiveQuery(async () => {
    const [clients, cases, sessions, payments, delays, parties, archives] = await Promise.all([
      db.clients.count(),
      db.cases.count(),
      db.sessions.count(),
      db.payments.count(),
      db.delays.count(),
      db.parties.count(),
      db.archives.count(),
    ]);
    return { clients, cases, sessions, payments, delays, parties, archives };
  });

  async function handleExport() {
    try {
      await exportBackup();
      toast.success('تم تصدير النسخة الاحتياطية بنجاح');
    } catch (err) {
      toast.error('حدث خطأ أثناء التصدير');
      console.error(err);
    }
  }

  async function handleImport(file: File) {
    try {
      setImporting(true);
      await importBackup(file);
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

  async function handleTxtImport(files: FileList) {
    try {
      setTxtImporting(true);
      const count = await importFromTxtFiles(files);
      toast.success(`تم استيراد ${(count).toLocaleString('en-US')} ملف بنجاح`);
    } catch (err) {
      toast.error('حدث خطأ أثناء استيراد الملفات النصية');
      console.error(err);
    } finally {
      setTxtImporting(false);
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
            <StatBadge label="القضايا" count={stats?.cases ?? 0} />
            <StatBadge label="الموكلون" count={stats?.clients ?? 0} />
            <StatBadge label="الجلسات" count={stats?.sessions ?? 0} />
            <StatBadge label="المدفوعات" count={stats?.payments ?? 0} />
            <StatBadge label="التأجيلات" count={stats?.delays ?? 0} />
            <StatBadge label="الأطراف" count={stats?.parties ?? 0} />
            <StatBadge label="الأرشيف" count={stats?.archives ?? 0} />
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
            استيراد بيانات من ملف JSON - سيتم استبدال جميع البيانات الحالية
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

      {/* استيراد من ملفات نصية */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-500" />
            استيراد من ملفات نصية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            استيراد بيانات القضايا من ملفات .txt القديمة
          </p>
          <input
            ref={txtInputRef}
            type="file"
            accept=".txt"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleTxtImport(e.target.files);
              }
            }}
          />
          <Button
            variant="outline"
            onClick={() => txtInputRef.current?.click()}
            disabled={txtImporting}
          >
            <FileText className="w-4 h-4 ml-2" />
            {txtImporting ? 'جاري الاستيراد...' : 'اختيار ملفات TXT'}
          </Button>
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
              سيتم استبدال جميع البيانات الحالية بالبيانات المستوردة. هل أنت متأكد؟
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
