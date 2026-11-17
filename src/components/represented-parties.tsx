'use client';

import React, { useMemo, useState } from 'react';
import { useParties } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, UserRound, Briefcase, Phone } from 'lucide-react';

type RepresentedParty = {
  id: number;
  name?: string | null;
  role?: string | null;
  side?: string | null;
  phone?: string | null;
  phone2?: string | null;
  address?: string | null;
  contactNotes?: string | null;
  lawyerName?: string | null;
  lawyerPhone?: string | null;
  caseId: number;
  case?: { id: number; caseNumber?: string; subject?: string; status?: string } | null;
};

/**
 * تبويب الأطراف الذين نمثلهم: مصدره سجلات الأطراف داخل القضايا،
 * ولا ينشئ كياناً مستقلاً للأشخاص.
 */
export function RepresentedParties() {
  const [search, setSearch] = useState('');
  const { parties, isLoading } = useParties();

  const represented = useMemo(() => {
    const rows = (parties as RepresentedParty[]).filter(p => p.side === 'for');
    const q = search.trim().toLocaleLowerCase();
    if (!q) return rows;
    return rows.filter(p =>
      [p.name, p.role, p.phone, p.lawyerName, p.case?.caseNumber, p.case?.subject]
        .some(value => String(value || '').toLocaleLowerCase().includes(q))
    );
  }, [parties, search]);

  if (isLoading) {
    return <div className="space-y-3"><Skeleton className="h-11 w-full" />{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>;
  }

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث بالاسم أو رقم القضية أو المحامي..." className="pr-9" />
        </div>
        <Badge variant="secondary" className="w-fit self-start sm:self-center">{represented.length} طرفاً</Badge>
      </div>

      {represented.length ? (
        <div className="space-y-3">
          {represented.map(party => (
            <Card key={party.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <UserRound className="h-4 w-4 text-muted-foreground" />
                    <span className="font-bold">{party.name || 'طرف دون اسم'}</span>
                    {party.role && <Badge variant="outline">{party.role}</Badge>}
                    <Badge variant="secondary">نمثل هذا الطرف</Badge>
                  </div>
                  {party.phone && <p className="flex items-center gap-1 text-sm text-muted-foreground"><Phone className="h-3.5 w-3.5" />{party.phone}</p>}
                  {party.phone2 && <p className="text-sm text-muted-foreground">هاتف إضافي: {party.phone2}</p>}
                  {party.address && <p className="text-sm text-muted-foreground">العنوان: {party.address}</p>}
                  {party.contactNotes && <p className="text-sm text-muted-foreground">ملاحظات الاتصال: {party.contactNotes}</p>}
                  {party.lawyerName && <p className="text-sm text-muted-foreground">المحامي: {party.lawyerName}{party.lawyerPhone ? ` — ${party.lawyerPhone}` : ''}</p>}
                </div>
                <div className="shrink-0 rounded-lg bg-muted/50 p-3 text-sm">
                  <div className="flex items-center gap-1 font-semibold"><Briefcase className="h-4 w-4" />القضية</div>
                  <p>{party.case?.caseNumber || `ملف داخلي ${party.caseId}`}</p>
                  {party.case?.subject && <p className="text-muted-foreground">{party.case.subject}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">لا توجد أطراف مسجلة نمثلها في القضايا.</CardContent></Card>
      )}
    </div>
  );
}
