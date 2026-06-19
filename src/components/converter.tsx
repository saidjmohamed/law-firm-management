'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Globe,
  Image,
  Upload,
  Download,
  Type,
} from 'lucide-react';
import { toast } from 'sonner';

type ConverterTab = 'html' | 'text' | 'media';

export function Converter() {
  const [activeTab, setActiveTab] = useState<ConverterTab>('html');

  // HTML to PDF state
  const [htmlUrl, setHtmlUrl] = useState('');

  // Text to PDF state
  const [textContent, setTextContent] = useState('');
  const [textFileName, setTextFileName] = useState('مستند');

  function convertHtmlToPdf() {
    if (!htmlUrl.trim()) {
      toast.error('يرجى إدخال رابط الصفحة');
      return;
    }

    // Generate an HTML document that embeds the URL via iframe for printing
    const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>تحويل صفحة ويب إلى PDF</title>
  <style>
    body { margin: 0; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; }
    iframe { width: 100%; height: 100vh; border: none; }
    .toolbar { padding: 8px 16px; background: #1a5276; color: #fff; display: flex; justify-content: space-between; align-items: center; }
    .toolbar button { background: #fff; color: #1a5276; border: none; padding: 6px 16px; border-radius: 4px; cursor: pointer; font-size: 14px; }
    @media print { .toolbar { display: none; } iframe { height: auto; } }
  </style>
</head>
<body>
  <div class="toolbar">
    <span>تحويل: ${htmlUrl}</span>
    <button onclick="window.print()">طباعة / حفظ كـ PDF</button>
  </div>
  <iframe src="${htmlUrl}" onload="this.style.height=this.contentDocument.body.scrollHeight+'px'"></iframe>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    toast.success('تم فتح صفحة التحويل');
  }

  function convertTextToPdf() {
    if (!textContent.trim()) {
      toast.error('يرجى إدخال النص');
      return;
    }

    // Build a printable HTML document from text
    const paragraphs = textContent.split('\n').map(line =>
      line.trim() ? `<p style="margin:0 0 8px 0;">${line}</p>` : '<br/>'
    ).join('');

    const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>${textFileName}</title>
  <style>
    @page { size: A4; margin: 20mm; }
    body {
      font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
      direction: rtl;
      font-size: 14px;
      line-height: 1.8;
      color: #000;
    }
    h1 {
      text-align: center;
      font-size: 18px;
      margin-bottom: 20px;
      border-bottom: 2px solid #1a5276;
      padding-bottom: 8px;
    }
    .content { white-space: pre-wrap; }
    .no-print { display: none; }
    @media print { .no-print { display: none !important; } }
  </style>
</head>
<body>
  <div class="no-print" style="padding:8px 16px;background:#1a5276;color:#fff;display:flex;justify-content:space-between;align-items:center;">
    <span>${textFileName}</span>
    <button onclick="window.print()" style="background:#fff;color:#1a5276;border:none;padding:6px 16px;border-radius:4px;cursor:pointer;font-size:14px;">طباعة / حفظ كـ PDF</button>
  </div>
  <h1>${textFileName}</h1>
  <div class="content">${paragraphs}</div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
    } else {
      // Fallback: download
      const a = document.createElement('a');
      a.href = url;
      a.download = `${textFileName}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    URL.revokeObjectURL(url);
    toast.success('تم فتح المستند للطباعة');
  }

  const tabs: { id: ConverterTab; label: string; icon: React.ElementType; description: string }[] = [
    { id: 'html', label: 'تحويل صفحات الويب', icon: Globe, description: 'HTML > PDF - تحويل صفحة ويب إلى ملف PDF' },
    { id: 'text', label: 'تحويل النص', icon: Type, description: 'ملف/نص - تحويل نص إلى ملف PDF' },
    { id: 'media', label: 'تحويل الصور والفيديو', icon: Image, description: 'تحويل الصور والفيديو (قريباً)' },
  ];

  return (
    <div className="space-y-6">
      {/* تبويبات التحويل */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isDisabled = tab.id === 'media';
          return (
            <Card
              key={tab.id}
              className={`cursor-pointer transition-all duration-200 ${
                isDisabled
                  ? 'opacity-50 cursor-not-allowed'
                  : isActive
                  ? 'border-teal-500 ring-2 ring-teal-500/20 shadow-md'
                  : 'hover:shadow-md hover:border-teal-300'
              }`}
              onClick={() => !isDisabled && setActiveTab(tab.id)}
            >
              <CardContent className="p-4 text-center">
                <div className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-3 ${
                  isActive ? 'bg-teal-100 dark:bg-teal-900/30' : 'bg-muted'
                }`}>
                  <Icon className={`w-6 h-6 ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-muted-foreground'}`} />
                </div>
                <h3 className="font-bold text-sm mb-1">{tab.label}</h3>
                <p className="text-xs text-muted-foreground">{tab.description}</p>
                {isDisabled && (
                  <Badge className="mt-2 bg-amber-100 text-amber-800 text-[10px]">قريباً</Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* محتوى التبويب */}
      {activeTab === 'html' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="w-4 h-4 text-teal-600" />
              تحويل صفحات الويب (HTML &gt; PDF)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs">رابط الصفحة (URL)</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={htmlUrl}
                  onChange={(e) => setHtmlUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="h-11 flex-1"
                  dir="ltr"
                />
                <Button
                  onClick={convertHtmlToPdf}
                  className="bg-teal-600 hover:bg-teal-700 shrink-0 h-11 touch-target"
                >
                  <Download className="w-4 h-4 ml-1" />
                  تحويل
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                أدخل رابط صفحة الويب ثم اضغط &quot;تحويل&quot; لفتحها في نافذة الطباعة وحفظها كملف PDF
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'text' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-600" />
              تحويل النص (ملف/نص)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs">عنوان المستند</Label>
              <Input
                value={textFileName}
                onChange={(e) => setTextFileName(e.target.value)}
                placeholder="عنوان المستند"
                className="h-11 mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">محتوى النص</Label>
              <Textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="اكتب أو الصق النص هنا..."
                className="mt-1 min-h-[200px] leading-relaxed"
                rows={10}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={convertTextToPdf}
                className="bg-teal-600 hover:bg-teal-700 touch-target"
              >
                <Download className="w-4 h-4 ml-1" />
                تحويل إلى PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'media' && (
        <Card>
          <CardContent className="p-8 text-center">
            <Image className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" aria-hidden />
            <h3 className="font-bold text-lg mb-2">تحويل الصور والفيديو</h3>
            <p className="text-muted-foreground text-sm">
              هذه الميزة قيد التطوير وستكون متاحة قريباً
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
