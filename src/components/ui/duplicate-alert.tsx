'use client';

import React from 'react';
import { AlertTriangle, X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DuplicateMatch {
  id: number;
  name?: string;
  phone?: string;
  type?: string;
  wilayaId?: number;
  barNumber?: string;
  caseNumber?: string;
  subject?: string;
}

interface DuplicateAlertProps {
  /** قائمة التكرارات المكتشفة */
  duplicates: DuplicateMatch[];
  /** نوع الكيان (للعرض) */
  entityType: string;
  /** ما إذا كان المستخدم قد أكد المتابعة رغم التكرار */
  onForceProceed: () => void;
  /** إغلاق التنبيه */
  onDismiss: () => void;
  /** نص إضافي اختياري */
  extraInfo?: string;
}

/**
 * مكون تنبيه التكرارات - يُظهر عندما يتم اكتشاف عنصر مكرر
 * يعرض تفاصيل العناصر الموجودة ويسمح للمستخدم بالمتابعة أو الإلغاء
 */
export function DuplicateAlert({ duplicates, entityType, onForceProceed, onDismiss, extraInfo }: DuplicateAlertProps) {
  if (!duplicates || duplicates.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-3 space-y-2 animate-in fade-in duration-200">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
            تكرار مكتشف!
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 text-amber-600 dark:text-amber-400 hover:text-amber-800"
          onClick={onDismiss}
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      <p className="text-xs text-amber-700 dark:text-amber-400">
        {extraInfo || `يوجد ${entityType} بنفس البيانات بالفعل:`}
      </p>

      <div className="space-y-1.5">
        {duplicates.map((dup) => (
          <div
            key={dup.id}
            className="flex items-center gap-2 p-2 rounded-md bg-white/60 dark:bg-white/5 border border-amber-200 dark:border-amber-800"
          >
            <ExternalLink className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
            <div className="min-w-0 flex-1 text-xs">
              <span className="font-bold text-amber-900 dark:text-amber-200">
                {dup.name || dup.caseNumber || '—'}
              </span>
              {dup.phone && (
                <span className="text-amber-700 dark:text-amber-400 mr-2">
                  هاتف: {dup.phone}
                </span>
              )}
              {dup.barNumber && (
                <span className="text-amber-700 dark:text-amber-400 mr-2">
                  قيد: {dup.barNumber}
                </span>
              )}
              {dup.subject && (
                <span className="text-amber-700 dark:text-amber-400 mr-2">
                  الموضوع: {dup.subject}
                </span>
              )}
              {dup.type && (
                <span className="text-amber-700 dark:text-amber-400 mr-2">
                  النوع: {dup.type}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          className="text-xs h-7 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30"
          onClick={onForceProceed}
        >
          متابعة رغم التكرار
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-7 text-amber-700 dark:text-amber-400"
          onClick={onDismiss}
        >
          إلغاء
        </Button>
      </div>
    </div>
  );
}

/**
 * دالة كشف التكرارات المحلية - تبحث في البيانات المحملة
 * تُستخدم للكشف الفوري أثناء الكتابة (قبل الإرسال)
 */

// كشف تكرار الموكلين
export function findDuplicateClients(
  name: string,
  phone: string,
  existingClients: any[],
  excludeId?: number
): any[] {
  const duplicates: any[] = [];
  if (!name?.trim()) return duplicates;

  const nameLower = name.trim().toLowerCase();

  for (const client of existingClients) {
    if (excludeId && client.id === excludeId) continue;

    // تطابق الاسم (غير حساس لحالة الأحرف)
    if (client.name?.trim().toLowerCase() === nameLower) {
      duplicates.push(client);
      continue;
    }

    // تطابق رقم الهاتف
    if (phone?.trim() && client.phone?.trim() && client.phone.trim() === phone.trim()) {
      duplicates.push(client);
    }
  }

  return duplicates;
}

// كشف تكرار المحامين
export function findDuplicateLawyers(
  name: string,
  barNumber: string,
  existingLawyers: any[],
  excludeId?: number
): any[] {
  const duplicates: any[] = [];
  if (!name?.trim()) return duplicates;

  const nameLower = name.trim().toLowerCase();

  for (const lawyer of existingLawyers) {
    if (excludeId && lawyer.id === excludeId) continue;

    // تطابق الاسم (غير حساس لحالة الأحرف)
    if (lawyer.name?.trim().toLowerCase() === nameLower) {
      duplicates.push(lawyer);
      continue;
    }

    // تطابق رقم القيد
    if (barNumber?.trim() && lawyer.barNumber?.trim() && lawyer.barNumber.trim() === barNumber.trim()) {
      duplicates.push(lawyer);
    }
  }

  return duplicates;
}

// كشف تكرار الهيئات القضائية
export function findDuplicateJudicialBodies(
  name: string,
  type: string,
  wilayaId: number | undefined,
  existingBodies: any[],
  excludeId?: number
): any[] {
  const duplicates: any[] = [];
  if (!name?.trim() || !type) return duplicates;

  const nameLower = name.trim().toLowerCase();

  for (const body of existingBodies) {
    if (excludeId && body.id === excludeId) continue;

    // تطابق الاسم + النوع + الولاية
    const nameMatch = body.name?.trim().toLowerCase() === nameLower;
    const typeMatch = body.type === type;
    const wilayaMatch = !wilayaId || body.wilayaId === wilayaId;

    if (nameMatch && typeMatch && wilayaMatch) {
      duplicates.push(body);
    }
  }

  return duplicates;
}

// كشف تكرار أرقام القضايا
export function findDuplicateCaseNumbers(
  caseNumber: string,
  existingCases: any[],
  excludeId?: number
): any[] {
  const duplicates: any[] = [];
  if (!caseNumber?.trim()) return duplicates;

  for (const c of existingCases) {
    if (excludeId && c.id === excludeId) continue;
    if (c.caseNumber?.trim() === caseNumber.trim()) {
      duplicates.push(c);
    }
  }

  return duplicates;
}

// كشف تكرار أسماء الأطراف داخل نفس القضية
export function findDuplicatePartyNames(
  parties: { name?: string; id: string }[]
): { name: string; indices: number[] }[] {
  const nameMap: Record<string, number[]> = {};

  for (let i = 0; i < parties.length; i++) {
    const name = parties[i].name?.trim().toLowerCase();
    if (!name) continue;
    if (!nameMap[name]) nameMap[name] = [];
    nameMap[name].push(i);
  }

  return Object.entries(nameMap)
    .filter(([, indices]) => indices.length > 1)
    .map(([name, indices]) => ({ name, indices }));
}
