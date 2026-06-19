'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useCases, useClients, useSessions, useJudicialBodies, useLawyers } from '@/lib/api';
import { useAppStore, type Section } from '@/lib/store';
import { formatDate } from '@/lib/constants';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Briefcase,
  Users,
  Calendar,
  Scale,
  Banknote,
  Clock,
  Search,
  BookOpen,
} from 'lucide-react';

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const { setActiveSection, setSelectedCaseId, setSelectedClientId, setSelectedLawyerId } = useAppStore();

  const { cases, isLoading: casesLoading } = useCases();
  const { clients, isLoading: clientsLoading } = useClients();
  const { sessions } = useSessions();
  const { judicialBodies: courts } = useJudicialBodies();
  const { lawyers } = useLawyers();

  // Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSelect = useCallback((type: string, id: number | null) => {
    setOpen(false);
    if (type === 'case' && id) {
      setSelectedCaseId(id);
      setActiveSection('cases');
    } else if (type === 'client' && id) {
      setSelectedClientId(id);
      setActiveSection('clients');
    } else if (type === 'session') {
      // الجلسات مدمجة في القضايا — التنقل للقضية المرتبطة
      if (id) {
        setSelectedCaseId(id);
      }
      setActiveSection('cases');
    } else if (type === 'court') {
      setActiveSection('courts');
    } else if (type === 'lawyer' && id) {
      setSelectedLawyerId(id);
      setActiveSection('lawyers');
    }
  }, [setActiveSection, setSelectedCaseId, setSelectedClientId, setSelectedLawyerId]);

  // بناء عناصر القضايا للبحث — يشمل: رقم القضية، الموضوع، المحكمة، الموكل، الأطراف، الملاحظات، الحكم
  const caseItems = useMemo(() => {
    if (casesLoading || clientsLoading) return [];
    return cases.map((c: any) => {
      const clientName = c.clientId ? clients.find((cl: any) => cl.id === c.clientId)?.name : '';
      // تجميع أسماء الأطراف وأرقام هواتفهم ومحاميهم
      const partyText = (c.parties || [])
        .map((p: any) => `${p.name || ''} ${p.phone || ''} ${p.lawyerName || ''} ${p.lawyerPhone || ''} ${p.role || ''}`)
        .join(' ');
      // تجميع أسباب التأجيلات
      const delayText = (c.delays || [])
        .map((d: any) => `${d.reason || ''} ${d.notes || ''}`)
        .join(' ');
      return {
        id: c.id!,
        value: `${c.caseNumber || ''} ${c.subject || ''} ${c.courtName || ''} ${c.councilName || ''} ${c.caseNature || ''} ${clientName || ''} ${c.status || ''} ${c.notes || ''} ${c.judgment || ''} ${c.lawyer || ''} ${c.chamber || ''} ${partyText} ${delayText}`,
        title: `${c.caseNumber || '—'} — ${c.subject || '—'}`,
        subtitle: `${c.courtName || c.councilName || ''}${clientName ? ` | ${clientName}` : ''}`,
      };
    });
  }, [cases, clients, casesLoading, clientsLoading]);

  // بناء عناصر الموكلين للبحث
  const clientItems = useMemo(() => {
    if (clientsLoading || casesLoading) return [];
    return clients.map((cl: any) => {
      const caseCount = cases.filter((c: any) => c.clientId === cl.id).length;
      return {
        id: cl.id!,
        value: `${cl.name || ''} ${cl.phone || ''} ${cl.phone2 || ''} ${cl.nationalId || ''} ${cl.address || ''} ${cl.notes || ''}`,
        title: cl.name || '—',
        subtitle: `${cl.phone || ''}${caseCount > 0 ? ` | ${caseCount} قضية` : ''}`,
      };
    });
  }, [clients, cases, clientsLoading, casesLoading]);

  // بناء عناصر الجلسات للبحث
  const sessionItems = useMemo(() => {
    return sessions.map((s: any) => ({
      id: s.id!,
      value: `${s.caseNumber || ''} ${s.court || ''} ${s.chamber || ''} ${s.notes || ''} ${s.result || ''} ${formatDate(s.date)}`,
      title: `${s.caseNumber || '—'} — ${formatDate(s.date)}`,
      subtitle: `${s.court || ''} ${s.chamber || ''}`,
    }));
  }, [sessions]);

  // بناء عناصر الهيئات القضائية للبحث
  const courtItems = useMemo(() => {
    return courts.map((ct: any) => ({
      id: ct.id!,
      value: `${ct.name || ''} ${ct.type || ''}`,
      title: ct.name,
      subtitle: ct.type || '',
    }));
  }, [courts]);

  // بناء عناصر المحامين للبحث
  const lawyerItems = useMemo(() => {
    return lawyers.map((l: any) => ({
      id: l.id!,
      value: `${l.name || ''} ${l.phone || ''} ${l.barNumber || ''} ${l.barAssociation || ''} ${l.specialty || ''}`,
      title: l.name || '—',
      subtitle: `${l.specialty || ''}${l.barAssociation ? ` | ${l.barAssociation}` : ''}`,
    }));
  }, [lawyers]);

  // وصول سريع
  const quickItems: { label: string; section: Section; icon: React.ElementType; keywords: string }[] = [
    { label: 'القضايا', section: 'cases', icon: Briefcase, keywords: 'قضية قضايا' },
    { label: 'الموكلون', section: 'clients', icon: Users, keywords: 'موكل موكلون عملاء' },
    { label: 'الجلسات', section: 'cases', icon: Calendar, keywords: 'جلسة جلسات محكمة' },
    { label: 'الهيئات القضائية', section: 'courts', icon: Scale, keywords: 'محكمة مجلس هيئة' },
    { label: 'المدفوعات', section: 'payments', icon: Banknote, keywords: 'دفع مدفوعات أتعاب' },
    { label: 'المحامون', section: 'lawyers', icon: BookOpen, keywords: 'محامي محامون نقابة دفتر' },
  ];

  return (
    <>
      {/* زر البحث */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-input bg-background text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors w-full"
      >
        <Search className="w-3.5 h-3.5 shrink-0" />
        <span className="flex-1 text-right">بحث...</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">Ctrl</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="ابحث في القضايا، الموكلين، الجلسات، الهيئات القضائية..." />
        <CommandList>
          <CommandEmpty>لا توجد نتائج مطابقة</CommandEmpty>

          {/* القضايا */}
          {caseItems.length > 0 && (
            <CommandGroup heading="القضايا">
              {caseItems.slice(0, 15).map(item => (
                <CommandItem
                  key={`case-${item.id}`}
                  value={item.value}
                  onSelect={() => handleSelect('case', item.id)}
                >
                  <Briefcase className="w-4 h-4 ml-2 shrink-0 text-teal-600" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    {item.subtitle && (
                      <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">قضية</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* الموكلون */}
          {clientItems.length > 0 && (
            <CommandGroup heading="الموكلون">
              {clientItems.slice(0, 10).map(item => (
                <CommandItem
                  key={`client-${item.id}`}
                  value={item.value}
                  onSelect={() => handleSelect('client', item.id)}
                >
                  <Users className="w-4 h-4 ml-2 shrink-0 text-blue-600" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    {item.subtitle && (
                      <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">موكل</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* الجلسات */}
          {sessionItems.length > 0 && (
            <CommandGroup heading="الجلسات">
              {sessionItems.slice(0, 10).map(item => (
                <CommandItem
                  key={`session-${item.id}`}
                  value={item.value}
                  onSelect={() => handleSelect('session', item.id)}
                >
                  <Calendar className="w-4 h-4 ml-2 shrink-0 text-amber-600" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    {item.subtitle && (
                      <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">جلسة</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* الهيئات القضائية */}
          {courtItems.length > 0 && (
            <CommandGroup heading="الهيئات القضائية">
              {courtItems.slice(0, 8).map(item => (
                <CommandItem
                  key={`court-${item.id}`}
                  value={item.value}
                  onSelect={() => handleSelect('court', item.id)}
                >
                  <Scale className="w-4 h-4 ml-2 shrink-0 text-purple-600" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    {item.subtitle && (
                      <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">هيئة</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* المحامون */}
          {lawyerItems.length > 0 && (
            <CommandGroup heading="المحامون">
              {lawyerItems.slice(0, 10).map(item => (
                <CommandItem
                  key={`lawyer-${item.id}`}
                  value={item.value}
                  onSelect={() => handleSelect('lawyer', item.id)}
                >
                  <BookOpen className="w-4 h-4 ml-2 shrink-0 text-indigo-600" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    {item.subtitle && (
                      <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">محامي</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* وصول سريع */}
          <CommandSeparator />
          <CommandGroup heading="وصول سريع">
            {quickItems.map(qr => {
              const Icon = qr.icon;
              return (
                <CommandItem
                  key={qr.section}
                  value={`${qr.label} ${qr.keywords}`}
                  onSelect={() => {
                    setOpen(false);
                    setActiveSection(qr.section);
                  }}
                >
                  <Icon className="w-4 h-4 ml-2 shrink-0" />
                  <span>{qr.label}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
