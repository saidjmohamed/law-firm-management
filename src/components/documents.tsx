'use client';

import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Document } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  FileText,
  Eye,
  ChevronDown,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const docTypes = ['عقد', 'وكالة', 'حكم', 'مذكرة', 'مراسلة', 'أخرى'];

const docTypeColors: Record<string, string> = {
  'عقد': 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  'وكالة': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'حكم': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'مذكرة': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'مراسلة': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'أخرى': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

export function Documents() {
  const documents = useLiveQuery(() => db.documents.orderBy('createdAt').reverse().toArray());
  const cases = useLiveQuery(() => db.cases.toArray());
  const clients = useLiveQuery(() => db.clients.toArray());

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [casePickerOpen, setCasePickerOpen] = useState(false);
  const [clientPickerOpen, setClientPickerOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Document>>({
    title: '',
    docType: 'عقد',
    content: '',
    caseId: undefined,
    caseTitle: '',
    clientId: undefined,
    clientName: '',
  });

  const filteredDocs = documents?.filter((d) => {
    const matchSearch =
      !search ||
      d.title.includes(search) ||
      d.content.includes(search);
    const matchType = filterType === 'all' || d.docType === filterType;
    return matchSearch && matchType;
  });

  const openAdd = () => {
    setFormData({
      title: '',
      docType: 'عقد',
      content: '',
      caseId: undefined,
      caseTitle: '',
      clientId: undefined,
      clientName: '',
    });
    setSelectedDoc(null);
    setDialogOpen(true);
  };

  const openEdit = (d: Document) => {
    setFormData({ ...d });
    setSelectedDoc(d);
    setDialogOpen(true);
  };

  const openView = (d: Document) => {
    setSelectedDoc(d);
    setViewOpen(true);
  };

  const openDelete = (d: Document) => {
    setSelectedDoc(d);
    setDeleteOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title?.trim()) {
      toast.error('يرجى إدخال عنوان المستند');
      return;
    }
    try {
      if (selectedDoc?.id) {
        await db.documents.update(selectedDoc.id, {
          ...formData,
          title: formData.title!.trim(),
        } as Document);
        toast.success('تم تحديث المستند بنجاح');
      } else {
        await db.documents.add({
          title: formData.title!.trim(),
          docType: formData.docType || 'أخرى',
          content: formData.content || '',
          caseId: formData.caseId || undefined,
          caseTitle: formData.caseTitle || undefined,
          clientId: formData.clientId || undefined,
          clientName: formData.clientName || undefined,
          createdAt: new Date(),
        });
        toast.success('تم إضافة المستند بنجاح');
      }
      setDialogOpen(false);
    } catch {
      toast.error('حدث خطأ أثناء الحفظ');
    }
  };

  const handleDelete = async () => {
    if (selectedDoc?.id) {
      try {
        await db.documents.delete(selectedDoc.id);
        toast.success('تم حذف المستند بنجاح');
      } catch {
        toast.error('حدث خطأ أثناء الحذف');
      }
      setDeleteOpen(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالعنوان أو المحتوى..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="النوع" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الأنواع</SelectItem>
            {docTypes.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={openAdd} className="bg-teal-700 hover:bg-teal-800 shrink-0">
          <Plus className="w-4 h-4 ml-2" />
          إضافة مستند
        </Button>
      </div>

      {/* Documents grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[calc(100vh-280px)] overflow-y-auto">
        {filteredDocs && filteredDocs.length > 0 ? (
          filteredDocs.map((doc) => (
            <Card key={doc.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    </div>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${docTypeColors[doc.docType] || ''}`}
                    >
                      {doc.docType}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openView(doc)}>
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(doc)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => openDelete(doc)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <h3 className="font-semibold text-sm mb-1">{doc.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {doc.content || 'لا يوجد محتوى'}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatDate(doc.createdAt)}</span>
                  {doc.caseTitle && (
                    <>
                      <span>•</span>
                      <span className="truncate">{doc.caseTitle}</span>
                    </>
                  )}
                </div>
                {doc.clientName && (
                  <p className="text-xs text-muted-foreground mt-1">العميل: {doc.clientName}</p>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full">
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center text-muted-foreground">
                {search ? 'لا توجد نتائج للبحث' : 'لا توجد مستندات بعد'}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{selectedDoc ? 'تعديل المستند' : 'إضافة مستند جديد'}</DialogTitle>
            <DialogDescription>
              {selectedDoc ? 'قم بتعديل بيانات المستند' : 'أدخل بيانات المستند الجديد'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>العنوان *</Label>
                <Input
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="عنوان المستند"
                />
              </div>
              <div className="grid gap-2">
                <Label>النوع</Label>
                <Select
                  value={formData.docType || 'عقد'}
                  onValueChange={(v) => setFormData({ ...formData, docType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {docTypes.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>القضية</Label>
                <Popover open={casePickerOpen} onOpenChange={setCasePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-between font-normal text-sm">
                      {formData.caseTitle || 'اختر القضية'}
                      <ChevronDown className="w-4 h-4 mr-2 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0" align="start">
                    <Command>
                      <CommandInput placeholder="بحث عن قضية..." />
                      <CommandList>
                        <CommandEmpty>لا توجد قضايا</CommandEmpty>
                        <CommandGroup>
                          {cases?.map((c) => (
                            <CommandItem
                              key={c.id}
                              onSelect={() => {
                                setFormData({ ...formData, caseId: c.id, caseTitle: c.title });
                                setCasePickerOpen(false);
                              }}
                            >
                              <Check className={cn('w-4 h-4 ml-2', formData.caseId === c.id ? 'opacity-100' : 'opacity-0')} />
                              {c.title}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label>العميل</Label>
                <Popover open={clientPickerOpen} onOpenChange={setClientPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-between font-normal text-sm">
                      {formData.clientName || 'اختر العميل'}
                      <ChevronDown className="w-4 h-4 mr-2 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0" align="start">
                    <Command>
                      <CommandInput placeholder="بحث عن عميل..." />
                      <CommandList>
                        <CommandEmpty>لا يوجد عملاء</CommandEmpty>
                        <CommandGroup>
                          {clients?.map((cl) => (
                            <CommandItem
                              key={cl.id}
                              onSelect={() => {
                                setFormData({ ...formData, clientId: cl.id, clientName: cl.name });
                                setClientPickerOpen(false);
                              }}
                            >
                              <Check className={cn('w-4 h-4 ml-2', formData.clientId === cl.id ? 'opacity-100' : 'opacity-0')} />
                              {cl.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>المحتوى</Label>
              <Textarea
                value={formData.content || ''}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="محتوى المستند..."
                rows={8}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSave} className="bg-teal-700 hover:bg-teal-800">
              {selectedDoc ? 'تحديث' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Document Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>عرض المستند</DialogTitle>
            <DialogDescription>تفاصيل المستند</DialogDescription>
          </DialogHeader>
          {selectedDoc && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <h3 className="font-bold text-lg">{selectedDoc.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className={`text-xs ${docTypeColors[selectedDoc.docType] || ''}`}>
                      {selectedDoc.docType}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(selectedDoc.createdAt)}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {selectedDoc.caseTitle && (
                  <div><span className="text-muted-foreground">القضية: </span>{selectedDoc.caseTitle}</div>
                )}
                {selectedDoc.clientName && (
                  <div><span className="text-muted-foreground">العميل: </span>{selectedDoc.clientName}</div>
                )}
              </div>
              {selectedDoc.content && (
                <div className="p-4 rounded-lg bg-muted/50 text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedDoc.content}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف المستند &quot;{selectedDoc?.title}&quot;؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
