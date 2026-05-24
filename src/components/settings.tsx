'use client';

import React, { useState } from 'react';
import { useSettings, updateSetting, getSettingValue } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Save, User, Phone, MapPin } from 'lucide-react';

export function SettingsManager() {
  const { settings, isLoading } = useSettings();

  // Local edits track only changes; displayed value falls back to server data
  const [localEdits, setLocalEdits] = useState<Record<string, string>>({});

  const lawyerName = localEdits.lawyerName ?? getSettingValue(settings, 'lawyerName');
  const lawyerTitle = localEdits.lawyerTitle ?? getSettingValue(settings, 'lawyerTitle');
  const lawyerAddress = localEdits.lawyerAddress ?? getSettingValue(settings, 'lawyerAddress');
  const lawyerPhone = localEdits.lawyerPhone ?? getSettingValue(settings, 'lawyerPhone');

  async function saveSettings() {
    try {
      await updateSetting('lawyerName', lawyerName);
      await updateSetting('lawyerTitle', lawyerTitle);
      await updateSetting('lawyerAddress', lawyerAddress);
      await updateSetting('lawyerPhone', lawyerPhone);
      setLocalEdits({});
      toast.success('تم حفظ الإعدادات بنجاح');
    } catch (err) {
      toast.error('حدث خطأ أثناء حفظ الإعدادات');
      console.error(err);
    }
  }

  if (isLoading) return null;

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
              onChange={(e) => setLocalEdits((prev) => ({ ...prev, lawyerName: e.target.value }))}
              placeholder="الاسم واللقب"
            />
          </div>
          <div>
            <Label className="text-xs">الصفة</Label>
            <Input
              value={lawyerTitle}
              onChange={(e) => setLocalEdits((prev) => ({ ...prev, lawyerTitle: e.target.value }))}
              placeholder="محام لدى المجلس"
            />
          </div>
          <div>
            <Label className="text-xs">العنوان</Label>
            <Input
              value={lawyerAddress}
              onChange={(e) => setLocalEdits((prev) => ({ ...prev, lawyerAddress: e.target.value }))}
              placeholder="عنوان المكتب"
            />
          </div>
          <div>
            <Label className="text-xs">الهاتف</Label>
            <Input
              value={lawyerPhone}
              onChange={(e) => setLocalEdits((prev) => ({ ...prev, lawyerPhone: e.target.value }))}
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
