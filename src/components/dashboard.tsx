'use client';

import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Scale, CalendarDays, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const statusLabels: Record<string, string> = {
  active: 'نشطة',
  closed: 'مغلقة',
  pending: 'معلقة',
  archived: 'مؤرشفة',
};

const statusColors: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  closed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  archived: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

const caseTypeLabels: Record<string, string> = {
  'مدني': 'مدني',
  'جنائي': 'جنائي',
  'تجاري': 'تجاري',
  'أحوال شخصية': 'أحوال شخصية',
  'إداري': 'إداري',
  'عمالي': 'عمالي',
};

const PIE_COLORS = ['#0f766e', '#059669', '#d97706', '#dc2626', '#7c3aed', '#2563eb'];

export function Dashboard() {
  const clients = useLiveQuery(() => db.clients.toArray());
  const cases = useLiveQuery(() => db.cases.toArray());
  const sessions = useLiveQuery(() => db.sessions.toArray());
  const transactions = useLiveQuery(() => db.transactions.toArray());

  const totalClients = clients?.length ?? 0;
  const activeCases = cases?.filter((c) => c.status === 'active').length ?? 0;
  const upcomingSessions = sessions?.filter((s) => s.status === 'scheduled').length ?? 0;
  const totalIncome = transactions?.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) ?? 0;
  const totalExpenses = transactions?.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) ?? 0;
  const netBalance = totalIncome - totalExpenses;

  const recentCases = cases
    ?.slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5) ?? [];

  const nextSessions = sessions
    ?.filter((s) => s.status === 'scheduled')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5) ?? [];

  // Cases by type chart data
  const casesByType = React.useMemo(() => {
    const map: Record<string, number> = {};
    cases?.forEach((c) => {
      map[c.caseType] = (map[c.caseType] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [cases]);

  // Monthly income vs expenses
  const monthlyData = React.useMemo(() => {
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const data: { month: string; income: number; expenses: number }[] = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - 5 + i);
      const m = d.getMonth();
      const y = d.getFullYear();
      const income = transactions?.filter((t) => {
        const td = new Date(t.date);
        return t.type === 'income' && td.getMonth() === m && td.getFullYear() === y;
      }).reduce((s, t) => s + t.amount, 0) ?? 0;
      const expenses = transactions?.filter((t) => {
        const td = new Date(t.date);
        return t.type === 'expense' && td.getMonth() === m && td.getFullYear() === y;
      }).reduce((s, t) => s + t.amount, 0) ?? 0;
      data.push({ month: months[m], income, expenses });
    }
    return data;
  }, [transactions]);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('ar-SA') + ' ر.س';
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const summaryCards = [
    {
      title: 'إجمالي العملاء',
      value: totalClients,
      icon: Users,
      color: 'text-teal-600 dark:text-teal-400',
      bg: 'bg-teal-50 dark:bg-teal-900/20',
    },
    {
      title: 'القضايا النشطة',
      value: activeCases,
      icon: Scale,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
    {
      title: 'الجلسات القادمة',
      value: upcomingSessions,
      icon: CalendarDays,
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
      icon: Wallet,
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">القضايا حسب النوع</CardTitle>
          </CardHeader>
          <CardContent>
            {casesByType.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={casesByType}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {casesByType.map((_entry, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [value, name]}
                    contentStyle={{ direction: 'rtl', textAlign: 'right' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                لا توجد بيانات
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">الإيرادات مقابل المصروفات</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: number) => value.toLocaleString('ar-SA') + ' ر.س'}
                  contentStyle={{ direction: 'rtl', textAlign: 'right' }}
                />
                <Bar dataKey="income" name="الإيرادات" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="المصروفات" fill="#dc2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
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
                      <p className="font-medium text-sm truncate">{c.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {c.caseNumber} • {c.clientName}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`text-xs mr-2 shrink-0 ${statusColors[c.status] || ''}`}
                    >
                      {statusLabels[c.status]}
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
                      <p className="font-medium text-sm truncate">{s.caseTitle}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(s.date)} • {s.time} • {s.court}
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
    </div>
  );
}
