'use client';

import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getSetting, setSetting } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Save, User, Phone, MapPin } from 'lucide-react';

export function SettingsManager() {
  const [lawyerName, setLawyerName] = useState('');
  const [lawyerTitle, setLawyerTitle] = useState('');
  const [lawyerAddress, setLawyerAddress] = useState('');
  const [lawyerPhone, setLawyerPhone] = useState('');
  const [loaded, setLoaded] = useState(false);

  // تحميل الإعدادات
  React.useEffect(() => {
    async function loadSettings() {
      const name = await getSetting<string>('lawyerName');
      const title = await getSetting<string>('lawyerTitle');
      const address = await getSetting<string>('lawyerAddress');
      const phone = await getSetting<string>('lawyerPhone');

      if (name) setLawyerName(name);
      if (title) setLawyerTitle(title);
      if (address) setLawyerAddress(address);
      if (phone) setLawyerPhone(phone);
      setLoaded(true);
    }
    loadSettings();
  }, []);

  async function saveSettings() {
    await setSetting('lawyerName', lawyerName);
    await setSetting('lawyerTitle', lawyerTitle);
    await setSetting('lawyerAddress', lawyerAddress);
    await setSetting('lawyerPhone', lawyerPhone);
    toast.success('تم حفظ الإعدادات بنجاح');
  }

  if (!loaded) return null;

  return (
    <div className="space-y-6">
      {/* معلومات المحامي */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4 text-teal-500" />
            معلومات المحامي
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs">الاسم واللقب</Label>
            <Input
              value={lawyerName}
              onChange={(e) => setLawyerName(e.target.value)}
              placeholder="الاسم واللقب"
            />
          </div>
          <div>
            <Label className="text-xs">الصفة</Label>
            <Input
              value={lawyerTitle}
              onChange={(e) => setLawyerTitle(e.target.value)}
              placeholder="محام لدى المجلس"
            />
          </div>
          <div>
            <Label className="text-xs">العنوان</Label>
            <Input
              value={lawyerAddress}
              onChange={(e) => setLawyerAddress(e.target.value)}
              placeholder="عنوان المكتب"
            />
          </div>
          <div>
            <Label className="text-xs">الهاتف</Label>
            <Input
              value={lawyerPhone}
              onChange={(e) => setLawyerPhone(e.target.value)}
              placeholder="رقم الهاتف"
            />
          </div>
          <Button onClick={saveSettings} className="bg-teal-600 hover:bg-teal-700">
            <Save className="w-4 h-4 ml-2" />
            حفظ الإعدادات
          </Button>
        </CardContent>
      </Card>

      {/* حول التطبيق */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">حول التطبيق</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>مكتب الاستاذ سايج محمد محام لدى المجلس</p>
            <p>نظام إدارة مكتب المحاماة - الإصدار 2.0</p>
            <p>يعمل بدون اتصال بالإنترنت - البيانات محفوظة محلياً</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
