'use client';

import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getSetting, setSetting } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Settings,
  User,
  Phone,
  MapPin,
  Briefcase,
  Users,
  CalendarDays,
  Banknote,
  Clock,
  Database,
  Trash2,
  RotateCcw,
  Save,
  AlertTriangle,
  FileText,
  Archive,
} from 'lucide-react';
import { toast } from 'sonner';

// ============================================================================
// مكون الإعدادات
// ============================================================================
export function SettingsManager() {
  // Lawyer info state
  const [lawyerName, setLawyerName] = useState('');
  const [lawyerTitle, setLawyerTitle] = useState('');
  const [lawyerAddress, setLawyerAddress] = useState('');
  const [lawyerPhone, setLawyerPhone] = useState('');
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  // Danger zone state
  const [clearDataOpen, setClearDataOpen] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [clearConfirmText, setClearConfirmText] = useState('');
  const [resetOpen, setResetOpen] = useState(false);

  // Load settings on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const name = await getSetting<string>('lawyerName');
        const title = await getSetting<string>('lawyerTitle');
        const address = await getSetting<string>('lawyerAddress');
        const phone = await getSetting<string>('lawyerPhone');
        setLawyerName(name || '');
        setLawyerTitle(title || '');
        setLawyerAddress(address || '');
        setLawyerPhone(phone || '');
        setSettingsLoaded(true);
      } catch {
        toast.error('حدث خطأ أثناء تحميل الإعدادات');
        setSettingsLoaded(true);
      }
    }
    loadSettings();
  }, []);

  // Database counts
  const clientsCount = useLiveQuery(() => db.clients.count()) ?? 0;
  const casesCount = useLiveQuery(() => db.cases.count()) ?? 0;
  const sessionsCount = useLiveQuery(() => db.sessions.count()) ?? 0;
  const paymentsCount = useLiveQuery(() => db.payments.count()) ?? 0;
  const delaysCount = useLiveQuery(() => db.delays.count()) ?? 0;
  const partiesCount = useLiveQuery(() => db.parties.count()) ?? 0;
  const archivesCount = useLiveQuery(() => db.archives.count()) ?? 0;
  const settingsCount = useLiveQuery(() => db.settings.count()) ?? 0;

  // Save lawyer settings
  const handleSaveLawyerInfo = async () => {
    setSaving(true);
    try {
      await setSetting('lawyerName', lawyerName.trim());
      await setSetting('lawyerTitle', lawyerTitle.trim());
      await setSetting('lawyerAddress', lawyerAddress.trim());
      await setSetting('lawyerPhone', lawyerPhone.trim());
      toast.success('تم حفظ بيانات المحامي بنجاح');
    } catch {
      toast.error('حدث خطأ أثناء الحفظ');
    }
    setSaving(false);
  };

  // Clear all data
  const handleClearAllData = async () => {
    if (clearConfirmText !== 'حذف') {
      toast.error('يرجى كتابة "حذف" للتأكيد');
      return;
    }
    try {
      await db.clients.clear();
      await db.cases.clear();
      await db.sessions.clear();
      await db.payments.clear();
      await db.delays.clear();
      await db.parties.clear();
      await db.archives.clear();
      toast.success('تم حذف جميع البيانات بنجاح');
    } catch {
      toast.error('حدث خطأ أثناء حذف البيانات');
    }
    setClearConfirmOpen(false);
    setClearDataOpen(false);
    setClearConfirmText('');
  };

  // Reset to defaults
  const handleResetDefaults = async () => {
    try {
      await db.clients.clear();
      await db.cases.clear();
      await db.sessions.clear();
      await db.payments.clear();
      await db.delays.clear();
      await db.parties.clear();
      await db.archives.clear();
      await db.settings.clear();

      // Re-seed
      const { seedDatabase } = await import('@/lib/db');
      await seedDatabase();

      // Reload settings
      const name = await getSetting<string>('lawyerName');
      const title = await getSetting<string>('lawyerTitle');
      const address = await getSetting<string>('lawyerAddress');
      const phone = await getSetting<string>('lawyerPhone');
      setLawyerName(name || '');
      setLawyerTitle(title || '');
      setLawyerAddress(address || '');
      setLawyerPhone(phone || '');

      toast.success('تم إعادة تعيين البيانات الافتراضية بنجاح');
    } catch {
      toast.error('حدث خطأ أثناء إعادة التعيين');
    }
    setResetOpen(false);
  };

  if (!settingsLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-muted-foreground">جاري تحميل الإعدادات...</div>
      </div>
    );
  }

  const totalRecords = clientsCount + casesCount + sessionsCount + paymentsCount + delaysCount + partiesCount + archivesCount;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Lawyer Info Section */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <User className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            بيانات المحامي
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="lawyer-name">الاسم واللقب</Label>
              <Input
                id="lawyer-name"
                value={lawyerName}
                onChange={(e) => setLawyerName(e.target.value)}
                placeholder="الاسم واللقب"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lawyer-title">الصفة</Label>
              <Input
                id="lawyer-title"
                value={lawyerTitle}
                onChange={(e) => setLawyerTitle(e.target.value)}
                placeholder="محام لدى المجلس"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="lawyer-address">العنوان</Label>
              <div className="relative">
                <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="lawyer-address"
                  value={lawyerAddress}
                  onChange={(e) => setLawyerAddress(e.target.value)}
                  placeholder="العنوان"
                  className="pr-9"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lawyer-phone">الهاتف</Label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="lawyer-phone"
                  value={lawyerPhone}
                  onChange={(e) => setLawyerPhone(e.target.value)}
                  placeholder="05XXXXXXXX"
                  dir="ltr"
                  className="pr-9 text-right"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleSaveLawyerInfo}
              disabled={saving}
              className="bg-teal-700 hover:bg-teal-800"
            >
              <Save className="w-4 h-4 ml-2" />
              {saving ? 'جاري الحفظ...' : 'حفظ البيانات'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Database Info Section */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Database className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            معلومات قاعدة البيانات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-900/10 text-center">
              <p className="text-2xl font-bold text-teal-700 dark:text-teal-400">{totalRecords.toLocaleString('en-US')}</p>
              <p className="text-xs text-muted-foreground">إجمالي السجلات</p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 text-center">
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{clientsCount.toLocaleString('en-US')}</p>
              <p className="text-xs text-muted-foreground">الموكلون</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 text-center">
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{casesCount.toLocaleString('en-US')}</p>
              <p className="text-xs text-muted-foreground">القضايا</p>
            </div>
            <div className="p-3 rounded-lg bg-sky-50 dark:bg-sky-900/10 text-center">
              <p className="text-2xl font-bold text-sky-700 dark:text-sky-400">{sessionsCount.toLocaleString('en-US')}</p>
              <p className="text-xs text-muted-foreground">الجلسات</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: Users, label: 'الموكلون', count: clientsCount, color: 'text-emerald-600' },
              { icon: Briefcase, label: 'القضايا', count: casesCount, color: 'text-amber-600' },
              { icon: CalendarDays, label: 'الجلسات', count: sessionsCount, color: 'text-sky-600' },
              { icon: Banknote, label: 'المدفوعات', count: paymentsCount, color: 'text-teal-600' },
              { icon: Clock, label: 'التأجيلات', count: delaysCount, color: 'text-orange-600' },
              { icon: FileText, label: 'أطراف النزاع', count: partiesCount, color: 'text-purple-600' },
              { icon: Archive, label: 'الأرشيف', count: archivesCount, color: 'text-gray-600' },
              { icon: Settings, label: 'الإعدادات', count: settingsCount, color: 'text-teal-600' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                  <span className="text-sm">{item.label}</span>
                </div>
                <Badge variant="outline" className="text-xs">{item.count.toLocaleString('en-US')}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-2 border-red-200 dark:border-red-900/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="w-5 h-5" />
            منطقة الخطر
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Clear All Data */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/10">
            <div>
              <p className="font-medium text-sm">حذف جميع البيانات</p>
              <p className="text-xs text-muted-foreground">حذف جميع السجلات من قاعدة البيانات نهائياً</p>
            </div>
            <Button
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-100 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30 shrink-0"
              onClick={() => setClearDataOpen(true)}
            >
              <Trash2 className="w-4 h-4 ml-2" />
              حذف الكل
            </Button>
          </div>

          {/* Reset to Defaults */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10">
            <div>
              <p className="font-medium text-sm">إعادة تعيين البيانات الافتراضية</p>
              <p className="text-xs text-muted-foreground">حذف البيانات الحالية واستبدالها بالبيانات التجريبية</p>
            </div>
            <Button
              variant="outline"
              className="border-amber-300 text-amber-600 hover:bg-amber-100 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/30 shrink-0"
              onClick={() => setResetOpen(true)}
            >
              <RotateCcw className="w-4 h-4 ml-2" />
              إعادة تعيين
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Clear Data - First Confirmation */}
      <AlertDialog open={clearDataOpen} onOpenChange={setClearDataOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">تحذير! حذف جميع البيانات</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف جميع البيانات نهائياً بما في ذلك الموكلين والقضايا والجلسات والمدفوعات وغيرها. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setClearDataOpen(false);
                setClearConfirmOpen(true);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              متابعة
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear Data - Second Confirmation with text input */}
      <AlertDialog open={clearConfirmOpen} onOpenChange={(open) => {
        setClearConfirmOpen(open);
        if (!open) setClearConfirmText('');
      }}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">تأكيد نهائي</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>لكي يتم الحذف، اكتب <strong className="text-red-600">&quot;حذف&quot;</strong> في الحقل أدناه:</p>
                <Input
                  value={clearConfirmText}
                  onChange={(e) => setClearConfirmText(e.target.value)}
                  placeholder='اكتب "حذف" للتأكيد'
                  className="text-center"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAllData}
              className="bg-red-600 hover:bg-red-700"
              disabled={clearConfirmText !== 'حذف'}
            >
              حذف نهائي
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset to Defaults Confirmation */}
      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>إعادة تعيين البيانات الافتراضية</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف جميع البيانات الحالية واستبدالها بالبيانات التجريبية الافتراضية. هل أنت متأكد؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetDefaults} className="bg-amber-600 hover:bg-amber-700">
              إعادة تعيين
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
