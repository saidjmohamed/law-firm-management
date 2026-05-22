'use client';

import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, formatCurrency } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Briefcase, Calendar, TrendingUp, TrendingDown, Banknote } from 'lucide-react';

const statusLabels: Record<string, string> = {
  active: 'جارية',
  scheduling: 'للجدولة',
  decided: 'مفصول فيها',
  archived: 'مؤرشفة',
};

const statusColors: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  scheduling: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  decided: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  archived: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

export function Dashboard() {
  const clients = useLiveQuery(() => db.clients.toArray());
  const cases = useLiveQuery(() => db.cases.toArray());
  const sessions = useLiveQuery(() => db.sessions.toArray());
  const payments = useLiveQuery(() => db.payments.toArray());
  const delays = useLiveQuery(() => db.delays.toArray());

  const totalClients = clients?.length ?? 0;
  const activeCases = cases?.filter((c) => c.status === 'active').length ?? 0;
  const upcomingSessions = sessions?.filter((s) => s.status === 'scheduled').length ?? 0;
  const pendingDelays = delays?.length ?? 0;
  const totalIncome = payments?.filter((p) => p.type === 'income').reduce((sum, p) => sum + p.amount, 0) ?? 0;
  const totalExpenses = payments?.filter((p) => p.type === 'expense').reduce((sum, p) => sum + p.amount, 0) ?? 0;
  const netBalance = totalIncome - totalExpenses;

  const recentCases = cases
    ?.slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5) ?? [];

  const nextSessions = sessions
    ?.filter((s) => s.status === 'scheduled')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5) ?? [];

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('ar-DZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const summaryCards = [
    {
      title: 'إجمالي الموكلين',
      value: totalClients,
      icon: Users,
      color: 'text-teal-600 dark:text-teal-400',
      bg: 'bg-teal-50 dark:bg-teal-900/20',
    },
    {
      title: 'القضايا الجارية',
      value: activeCases,
      icon: Briefcase,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
    {
      title: 'الجلسات القادمة',
      value: upcomingSessions,
      icon: Calendar,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
    },
    {
      title: 'إجمالي الإيرادات',
      value: formatCurrency(totalIncome),
      icon: TrendingUp,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
    {
      title: 'إجمالي المصروفات',
      value: formatCurrency(totalExpenses),
      icon: TrendingDown,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/20',
    },
    {
      title: 'صافي الرصيد',
      value: formatCurrency(netBalance),
      icon: Banknote,
      color: netBalance >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-red-600 dark:text-red-400',
      bg: netBalance >= 0 ? 'bg-teal-50 dark:bg-teal-900/20' : 'bg-red-50 dark:bg-red-900/20',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <p className="text-xs text-muted-foreground mb-1">{card.title}</p>
                <p className="text-lg font-bold">{card.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Cases and Upcoming Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">أحدث القضايا</CardTitle>
          </CardHeader>
          <CardContent>
            {recentCases.length > 0 ? (
              <div className="space-y-3">
                {recentCases.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{c.subject}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {c.caseNumber} • {c.clientName}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`text-xs mr-2 shrink-0 ${statusColors[c.status] || ''}`}
                    >
                      {statusLabels[c.status] || c.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">لا توجد قضايا</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">الجلسات القادمة</CardTitle>
          </CardHeader>
          <CardContent>
            {nextSessions.length > 0 ? (
              <div className="space-y-3">
                {nextSessions.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{s.caseSubject || s.caseNumber}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(s.date)} {s.time && `• ${s.time}`} {s.court && `• ${s.court}`}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs mr-2 shrink-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      مجدولة
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">لا توجد جلسات قادمة</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">ملخص المدفوعات الأخيرة</CardTitle>
        </CardHeader>
        <CardContent>
          {payments && payments.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {payments
                .slice()
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 8)
                .map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{p.description || p.category}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(p.date)} • {p.category}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`text-xs mr-2 shrink-0 ${
                        p.type === 'income'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}
                    >
                      {p.type === 'income' ? '+' : '-'} {formatCurrency(p.amount)}
                    </Badge>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">لا توجد مدفوعات</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
