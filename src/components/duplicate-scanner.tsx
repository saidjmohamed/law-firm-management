'use client';

import React, { useState, useMemo } from 'react';
import { useLawyers, useJudicialBodies, useCases, useParties, deleteParty, deleteLawyer, deleteJudicialBody , deleteCase} from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  Search,
  AlertTriangle,
  Users,
  Scale,
  Building2,
  Briefcase,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { WILAYAS } from '@/lib/constants';
type EntityType = 'party' | 'lawyer' | 'judicialBody' | 'case';

interface DuplicateGroup {
  key: string;
  entityType: EntityType;
  field: string;
  items: any[];
}

/**
 * ماسح التكرارات الشامل - يبحث في كل قاعدة البيانات عن العناصر المكررة
 * يعرض النتائج مجمّعة حسب نوع الكيان والحقل المتكرر
 */
export function DuplicateScanner() {
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: EntityType; id: number } | null>(null);

  const { lawyers, isLoading: lawyersLoading } = useLawyers();
  const { judicialBodies, isLoading: bodiesLoading } = useJudicialBodies();
  const { cases, isLoading: casesLoading } = useCases();
  const { parties } = useParties();

  const isLoading = lawyersLoading || bodiesLoading || casesLoading;

  // كشف جميع التكرارات
  const duplicateGroups = useMemo(() => {
    const groups: DuplicateGroup[] = [];

    // 1. تكرار الأطراف داخل القضية نفسها فقط؛ تكرار الاسم عبر قضايا مختلفة ليس تكراراً.
    const partyNameMap: Record<string, any[]> = {};
    parties?.forEach((party: any) => {
      if (!party.name?.trim()) return;
      const key = `${party.caseId}:${party.name.trim().toLowerCase()}`;
      if (!partyNameMap[key]) partyNameMap[key] = [];
      partyNameMap[key].push(party);
    });
    Object.entries(partyNameMap).forEach(([key, items]) => {
      if (items.length > 1) groups.push({ key: `party-name-${key}`, entityType: 'party', field: 'الاسم داخل القضية', items });
    });

    // 2. تكرار الهاتف داخل القضية نفسها.
    const partyPhoneMap: Record<string, any[]> = {};
    parties?.forEach((party: any) => {
      if (!party.phone?.trim()) return;
      const key = `${party.caseId}:${party.phone.trim()}`;
      if (!partyPhoneMap[key]) partyPhoneMap[key] = [];
      partyPhoneMap[key].push(party);
    });
    Object.entries(partyPhoneMap).forEach(([key, items]) => {
      if (items.length > 1) groups.push({ key: `party-phone-${key}`, entityType: 'party', field: 'الهاتف داخل القضية', items });
    });

    // 3. تكرار المحامين بالاسم
    const lawyerNameMap: Record<string, any[]> = {};
    lawyers?.forEach((l: any) => {
      if (!l.name?.trim()) return;
      const key = l.name.trim().toLowerCase();
      if (!lawyerNameMap[key]) lawyerNameMap[key] = [];
      lawyerNameMap[key].push(l);
    });
    Object.entries(lawyerNameMap).forEach(([key, items]) => {
      if (items.length > 1) {
        groups.push({
          key: `lawyer-name-${key}`,
          entityType: 'lawyer',
          field: 'الاسم',
          items,
        });
      }
    });

    // 4. تكرار المحامين برقم القيد
    const lawyerBarMap: Record<string, any[]> = {};
    lawyers?.forEach((l: any) => {
      if (!l.barNumber?.trim()) return;
      if (!lawyerBarMap[l.barNumber.trim()]) lawyerBarMap[l.barNumber.trim()] = [];
      lawyerBarMap[l.barNumber.trim()].push(l);
    });
    Object.entries(lawyerBarMap).forEach(([key, items]) => {
      if (items.length > 1) {
        groups.push({
          key: `lawyer-bar-${key}`,
          entityType: 'lawyer',
          field: 'رقم القيد',
          items,
        });
      }
    });

    // 5. تكرار الهيئات القضائية بالاسم والنوع
    const bodyNameMap: Record<string, any[]> = {};
    judicialBodies?.forEach((b: any) => {
      if (!b.name?.trim()) return;
      const key = `${b.name.trim().toLowerCase()}-${b.type}`;
      if (!bodyNameMap[key]) bodyNameMap[key] = [];
      bodyNameMap[key].push(b);
    });
    Object.entries(bodyNameMap).forEach(([key, items]) => {
      if (items.length > 1) {
        groups.push({
          key: `body-${key}`,
          entityType: 'judicialBody',
          field: 'الاسم والنوع',
          items,
        });
      }
    });

    // 6. تكرار أرقام القضايا
    const caseNumMap: Record<string, any[]> = {};
    cases?.forEach((c: any) => {
      if (!c.caseNumber?.trim()) return;
      if (!caseNumMap[c.caseNumber.trim()]) caseNumMap[c.caseNumber.trim()] = [];
      caseNumMap[c.caseNumber.trim()].push(c);
    });
    Object.entries(caseNumMap).forEach(([key, items]) => {
      if (items.length > 1) {
        groups.push({
          key: `case-num-${key}`,
          entityType: 'case',
          field: 'رقم القضية',
          items,
        });
      }
    });

    return groups;
  }, [lawyers, judicialBodies, cases, parties]);

  const totalDuplicates = duplicateGroups.length;

  const entityIcon = (type: EntityType) => {
    switch (type) {
      case 'party': return Users;
      case 'lawyer': return Scale;
      case 'judicialBody': return Building2;
      case 'case': return Briefcase;
      default: return AlertTriangle;
    }
  };

  const entityColor = (type: EntityType) => {
    switch (type) {
      case 'party': return 'text-teal-600 dark:text-teal-400';
      case 'lawyer': return 'text-indigo-600 dark:text-indigo-400';
      case 'judicialBody': return 'text-rose-600 dark:text-rose-400';
      case 'case': return 'text-amber-600 dark:text-amber-400';
      default: return 'text-muted-foreground';
    }
  };

  async function handleDeleteDuplicate(type: EntityType, id: number) {
    try {
      switch (type) {
        case 'party':
          await deleteParty(id);
          break;
        case 'lawyer':
          await deleteLawyer(id);
          break;
        case 'judicialBody':
          await deleteJudicialBody(id);
          break;
      case 'case': await deleteCase(id); break;
      }
      setDeleteConfirm(null);
      toast.success('تم حذف العنصر المكرر');
    } catch (error) {
      console.error('Delete duplicate error:', error);
      toast.error('فشل في حذف العنصر');
    }
  }
  const entityLabel = (type: EntityType) => { switch (type) { case 'party': return 'أطراف'; case 'lawyer': return 'محامون'; case 'judicialBody': return 'جهات قضائية'; case 'case': return 'قضايا'; default: return ''; } };
  
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    );
  }

  if (totalDuplicates === 0) {
    return (
      <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/10">
        <CardContent className="p-6 text-center">
          <Search className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
          <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">لا توجد تكرارات!</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">جميع البيانات نظيفة بدون أي تكرار</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-5 h-5 text-amber-500" />
        <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
          تم اكتشاف {totalDuplicates.toLocaleString('en-US')} تكرار
        </p>
      </div>

      {duplicateGroups.map((group) => {
        const Icon = entityIcon(group.entityType);
        const colorClass = entityColor(group.entityType);
        const isExpanded = expandedGroup === group.key;

        return (
          <Card key={group.key} className="overflow-hidden border-amber-200 dark:border-amber-800">
            <CardContent
              className="p-3 cursor-pointer hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-colors"
              onClick={() => setExpandedGroup(isExpanded ? null : group.key)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${colorClass}`} />
                  <Badge variant="outline" className="text-xs">{entityLabel(group.entityType)}</Badge>
                  <span className="text-sm font-medium">
                    تكرار في {group.field}: <span className="font-bold">{group.items[0]?.name || group.items[0]?.caseNumber || '—'}</span>
                  </span>
                  <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                    {group.items.length.toLocaleString('en-US')} نسخة
                  </Badge>
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>

              {isExpanded && (
                <div className="mt-3 space-y-2 border-t pt-3">
                  {group.items.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 rounded-md bg-white dark:bg-white/5 border"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">#{(idx + 1).toLocaleString('en-US')}</span>
                          <span className="text-sm font-medium">{item.name || item.caseNumber || '—'}</span>
                          {item.phone && (
                            <span className="text-xs text-muted-foreground">هاتف: {item.phone}</span>
                          )}
                          {item.type && (
                            <Badge variant="outline" className="text-[10px]">{item.type}</Badge>
                          )}
                          {item.subject && (
                            <span className="text-xs text-muted-foreground truncate">{item.subject}</span>
                          )}
                          {item.wilayaId && (
                            <span className="text-xs text-muted-foreground">
                              {WILAYAS.find((w: any) => w.code === item.wilayaId)?.name || ''}
                            </span>
                          )}
                          {item.barNumber && (
                            <span className="text-xs text-muted-foreground">قيد: {item.barNumber}</span>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground">ID: {item.id}</span>
                      </div>
                      {idx > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-destructive hover:text-destructive shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirm({ type: group.entityType, id: item.id });
                          }}
                        >
                          <Trash2 className="w-3 h-3 ml-1" />
                          حذف
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      <AlertDialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد حذف التكرار</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا العنصر المكرر؟ سيتم الاحتفاظ بالنسخة الأولى فقط.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDeleteDuplicate(deleteConfirm.type, deleteConfirm.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
