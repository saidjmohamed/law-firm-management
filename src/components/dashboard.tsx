'use client';

import React from 'react';
import { useCases, useClients, useDelays, useSessions, usePayments, useParties } from '@/lib/api';
import { formatCurrency, STATUS_COLORS, CASE_NATURES, formatDate } from '@/lib/constants';
import { DateDisplay } from '@/components/ui/date-display';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Briefcase,
  TrendingUp,
  Wallet,
  Clock,
  Plus,
  Users,
  Calendar,
  AlertTriangle,
  Scale,
  CircleDollarSign,
  ArrowUpLeft,
  ArrowDownLeft,
} from 'lucide-react';

// Colors for nature progress bars
const NATURE_COLORS: Record<string, string> = {
  'جنحة': 'bg-red-500',
  'مخالفة': 'bg-orange-500',
  'جناية': 'bg-rose-600',
  'أحداث': 'bg-violet-500',
  'تحقيق / غرفة الاتهام': 'bg-purple-500',
  'مدني': 'bg-teal-500',
  'عقاري': 'bg-cyan-500',
  'شؤون الأسرة': 'bg-pink-500',
  'عمالي': 'bg-amber-500',
  'تجاري': 'bg-emerald-500',
  'بحري': 'bg-sky-500',
  'استعجالي': 'bg-yellow-500',
  'إداري': 'bg-indigo-500',
  'اداري استئنافي': 'bg-blue-500',
  'أمر على عريضة': 'bg-lime-500',
  'أخرى': 'bg-gray-500',
};

const NATURE_BG_COLORS: Record<string, string> = {
  'جنحة': 'bg-red-100 dark:bg-red-900/20',
  'مخالفة': 'bg-orange-100 dark:bg-orange-900/20',
  'جناية': 'bg-rose-100 dark:bg-rose-900/20',
  'أحداث': 'bg-violet-100 dark:bg-violet-900/20',
  'تحقيق / غرفة الاتهام': 'bg-purple-100 dark:bg-purple-900/20',
  'مدني': 'bg-teal-100 dark:bg-teal-900/20',
  'عقاري': 'bg-cyan-100 dark:bg-cyan-900/20',
  'شؤون الأسرة': 'bg-pink-100 dark:bg-pink-900/20',
  'عمالي': 'bg-amber-100 dark:bg-amber-900/20',
  'تجاري': 'bg-emerald-100 dark:bg-emerald-900/20',
  'بحري': 'bg-sky-100 dark:bg-sky-900/20',
  'استعجالي': 'bg-yellow-100 dark:bg-yellow-900/20',
  'إداري': 'bg-indigo-100 dark:bg-indigo-900/20',
  'اداري استئنافي': 'bg-blue-100 dark:bg-blue-900/20',
  'أمر على عريضة': 'bg-lime-100 dark:bg-lime-900/20',
  'أخرى': 'bg-gray-100 dark:bg-gray-900/20',
};

export function Dashboard() {
  const setActiveSection = useAppStore((s) => s.setActiveSection);
  const setSelectedCaseId = useAppStore((s) => s.setSelectedCaseId);

  const { cases, isLoading: casesLoading } = useCases();
  const { clients, isLoading: clientsLoading } = useClients();
  const { delays } = useDelays();
  const { sessions } = useSessions();
  const { payments } = usePayments();
  const { parties } = useParties();

  const isLoading = casesLoading || clientsLoading;

  const totalCases = cases.length;
  const totalClients = clients.length;
  const activeCases = cases.filter((c: any) => c.status === 'جارية').length;
  const archivedCases = cases.filter((c: any) => c.status === 'مؤرشفة').length;
  const totalFees = cases.reduce((sum: number, c: any) => sum + (c.totalFees || 0), 0);
  const totalPaid = cases.reduce((sum: number, c: any) => sum + (c.paidAmount || 0), 0);
  const totalRemaining = totalFees - totalPaid;
  const paymentRate = totalFees > 0 ? Math.round((totalPaid / totalFees) * 100) : 0;

  // القضايا حسب الطبيعة
  const casesByNature = CASE_NATURES.map((nature) => ({
    nature,
    count: cases.filter((c: any) => c.caseNature === nature).length,
  })).filter((n) => n.count > 0).sort((a, b) => b.count - a.count);

  // توزيع الحالات
  const statusDistribution = [
    { status: 'جارية', count: cases.filter((c: any) => c.status === 'جارية').length },
    { status: 'للجدولة', count: cases.filter((c: any) => c.status === 'للجدولة').length },
    { status: 'مفصول فيها', count: cases.filter((c: any) => c.status === 'مفصول فيها').length },
    { status: 'مؤرشفة', count: cases.filter((c: any) => c.status === 'مؤرشفة').length },
  ].filter((s) => s.count > 0);

  // التأجيلات القادمة
  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const nextWeekDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  nextWeekDate.setHours(23, 59, 59, 999);

  const archivedCaseIds = new Set(
    cases.filter((c: any) => c.status === 'مؤرشفة').map((c: any) => c.id)
  );
  const upcomingDelays = delays
    .filter((d: any) => {
      if (!d.delayDate) return false;
      const dd = new Date(d.delayDate);
      return !isNaN(dd.getTime()) && dd >= todayStart && !archivedCaseIds.has(d.caseId);
    })
    .sort((a: any, b: any) => {
      const da = new Date(a.delayDate).getTime();
      const db = new Date(b.delayDate).getTime();
      return da - db;
    })
    .slice(0, 10);

  // القضايا القادمة في 7 أيام — على أساس آخر تاريخ لكل قضية
  const allUpcoming = (() => {
    const result: any[] = [];

    cases.filter((c: any) => c.status !== 'مؤرشفة').forEach((c: any) => {
      const allDates: { date: Date; source: string; label: string; sourceData: any }[] = [];

      const caseDelays = delays.filter((d: any) => d.caseId === c.id && d.delayDate);
      caseDelays.forEach((d: any) => {
        const dd = new Date(d.delayDate);
        if (!isNaN(dd.getTime())) allDates.push({ date: dd, source: 'delay', label: d.reason || 'تأجيل', sourceData: d });
      });

      const caseSessions = sessions.filter((s: any) => s.caseId === c.id && s.date);
      caseSessions.forEach((s: any) => {
        const sd = new Date(s.date);
        if (!isNaN(sd.getTime())) allDates.push({ date: sd, source: 'session', label: 'جلسة', sourceData: s });
      });

      if (c.delibDate) {
        const dd = new Date(c.delibDate);
        if (!isNaN(dd.getTime())) allDates.push({ date: dd, source: 'delib', label: 'مداولة', sourceData: c });
      }

      if (allDates.length === 0) return;

      const latest = allDates.sort((a, b) => b.date.getTime() - a.date.getTime())[0];

      if (latest.date >= todayStart && latest.date <= nextWeekDate) {
        result.push({
          id: latest.sourceData.id,
          caseId: c.id,
          caseData: c,
          delayDate: latest.date,
          date: latest.date,
          reason: latest.label,
          source: latest.source,
        });
      }
    });

    return result.sort((a, b) => new Date(a.delayDate).getTime() - new Date(b.delayDate).getTime());
  })();

  // حساب الأيام المتبقية
  function daysUntil(dateStr: string | Date) {
    let target: Date;
    if (dateStr instanceof Date) {
      target = new Date(dateStr);
    } else {
      const normalized = dateStr.length > 10 ? dateStr.substring(0, 10) : dateStr;
      target = new Date(normalized);
    }
    if (isNaN(target.getTime())) return 0;
    target.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = target.getTime() - today.getTime();
    return Math.round(diff / (1000 * 60 * 60 * 24));
  }

  const maxNatureCount = Math.max(...casesByNature.map((n) => n.count), 1);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="stat-card-hover">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-9 h-9 rounded-lg" />
                  <div className="min-w-0 space-y-1.5">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          title="إجمالي القضايا"
          value={(totalCases).toLocaleString('en-US')}
          icon={Scale}
          color="teal"
        />
        <StatCard
          title="الموكلون"
          value={(totalClients).toLocaleString('en-US')}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="قضايا جارية"
          value={(activeCases).toLocaleString('en-US')}
          icon={TrendingUp}
          color="emerald"
        />
        <StatCard
          title="مؤرشفة"
          value={(archivedCases).toLocaleString('en-US')}
          icon={Clock}
          color="gray"
        />
        <StatCard
          title="المدفوع"
          value={formatCurrency(totalPaid)}
          icon={Wallet}
          color="emerald"
        />
        <StatCard
          title="المتبقي"
          value={formatCurrency(totalRemaining)}
          icon={AlertTriangle}
          color={totalRemaining > 0 ? 'amber' : 'emerald'}
        />
      </div>

      {/* ملخص مالي */}
      <Card className="border-primary/20 dark:border-primary/30 bg-gradient-to-l from-teal-50/80 via-emerald-50/50 to-cyan-50/30 dark:from-teal-950/40 dark:via-emerald-950/30 dark:to-cyan-950/20 shadow-card overflow-hidden relative">
        <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 -translate-x-1/2 blur-2xl" />
        <CardContent className="p-5 relative">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
              <CircleDollarSign className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">الملخص المالي</h3>
              <p className="text-[11px] text-muted-foreground">تتبع الأتعاب والمدفوعات</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-2 rounded-lg hover:bg-background/60 transition-colors">
              <p className="text-[11px] text-muted-foreground mb-1.5">إجمالي الأتعاب</p>
              <p className="text-lg font-extrabold text-foreground tabular-nums">{formatCurrency(totalFees)}</p>
            </div>
            <div className="text-center p-2 rounded-lg hover:bg-background/60 transition-colors">
              <p className="text-[11px] text-muted-foreground mb-1.5">المبالغ المحصّلة</p>
              <div className="flex items-center justify-center gap-1">
                <ArrowUpLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <p className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums">{formatCurrency(totalPaid)}</p>
              </div>
            </div>
            <div className="text-center p-2 rounded-lg hover:bg-background/60 transition-colors">
              <p className="text-[11px] text-muted-foreground mb-1.5">المتبقي التحصيل</p>
              <div className="flex items-center justify-center gap-1">
                <ArrowDownLeft className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <p className={`text-lg font-extrabold tabular-nums ${totalRemaining > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                  {formatCurrency(totalRemaining)}
                </p>
              </div>
            </div>
            <div className="text-center p-2 rounded-lg hover:bg-background/60 transition-colors">
              <p className="text-[11px] text-muted-foreground mb-1.5">نسبة التحصيل</p>
              <div className="flex items-center justify-center gap-2">
                <p className="text-lg font-extrabold text-primary tabular-nums">{paymentRate.toLocaleString('en-US')}%</p>
              </div>
              <div className="mt-2 h-2 bg-primary/15 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-primary rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${Math.min(paymentRate, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* أزرار الإجراءات السريعة */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => {
            setSelectedCaseId(null);
            setActiveSection('cases');
          }}
          className="bg-gradient-primary hover:shadow-elevated touch-target btn-luxe"
        >
          <Plus className="w-4 h-4 ml-2" />
          إضافة قضية
        </Button>
        <Button
          variant="outline"
          onClick={() => setActiveSection('clients')}
          className="touch-target hover:border-primary/40 hover:bg-accent/50"
        >
          <Plus className="w-4 h-4 ml-2" />
          إضافة موكل
        </Button>
        <Button
          variant="outline"
          onClick={() => setActiveSection('cases')}
          className="touch-target hover:border-primary/40 hover:bg-accent/50"
        >
          <Calendar className="w-4 h-4 ml-2" />
          الجلسات
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* القضايا حسب الطبيعة */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">القضايا حسب الطبيعة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {casesByNature.map((item) => (
              <div key={item.nature} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${NATURE_COLORS[item.nature] || 'bg-gray-500'}`} />
                    <span className="font-medium">{item.nature}</span>
                  </div>
                  <span className="font-bold tabular-nums">{(item.count).toLocaleString('en-US')}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${NATURE_COLORS[item.nature] || 'bg-teal-500'}`}
                    style={{ width: `${(item.count / maxNatureCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {casesByNature.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">لا توجد قضايا</p>
            )}
          </CardContent>
        </Card>

        {/* توزيع الحالات */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">توزيع الحالات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {statusDistribution.map((item) => (
                <Badge
                  key={item.status}
                  variant="secondary"
                  className={`${STATUS_COLORS[item.status] || ''} text-sm py-1.5 px-3 font-medium`}
                >
                  {item.status}: {(item.count).toLocaleString('en-US')}
                </Badge>
              ))}
            </div>

            {/* شريط التوزيع */}
            <div className="mt-4 flex h-4 rounded-full overflow-hidden">
              {statusDistribution.map((item) => {
                const colors: Record<string, string> = {
                  'جارية': 'bg-emerald-500',
                  'للجدولة': 'bg-amber-500',
                  'مفصول فيها': 'bg-blue-500',
                  'مؤرشفة': 'bg-gray-400',
                };
                return (
                  <div
                    key={item.status}
                    className={`${colors[item.status] || 'bg-gray-400'} transition-all duration-300`}
                    style={{ width: `${(item.count / totalCases) * 100}%` }}
                    title={`${item.status}: ${item.count}`}
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* القضايا القادمة في 7 أيام — بطاقات كبيرة */}
      {allUpcoming.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-500" />
              القضايا القادمة (7 أيام)
              <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                {allUpcoming.length.toLocaleString('en-US')}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {allUpcoming.map((item: any) => {
                const dateStr = item.delayDate || item.date;
                const days = daysUntil(dateStr instanceof Date ? dateStr : dateStr);
                const caseData = item.caseData;
                const isToday = days === 0;
                const isTomorrow = days === 1;
                const isUrgent = days <= 1;
                return (
                  <div
                    key={`${item.source}-${item.id}`}
                    className={`p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
                      isToday
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-600 hover:border-red-500 shadow-sm'
                        : isTomorrow
                          ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-400 dark:border-amber-600 hover:border-amber-500 shadow-sm'
                          : 'bg-teal-50/80 dark:bg-teal-900/20 border-teal-300 dark:border-teal-700 hover:border-teal-400'
                    }`}
                    onClick={() => {
                      if (item.caseId) {
                        setSelectedCaseId(item.caseId);
                        setActiveSection('cases');
                      }
                    }}
                  >
                    {/* شريط الأيام المتبقية */}
                    <div className="flex items-center justify-between mb-3">
                      <Badge className={`text-sm font-bold px-3 py-1 ${
                        isToday
                          ? 'bg-red-500 text-white'
                          : isTomorrow
                            ? 'bg-amber-500 text-white'
                            : 'bg-teal-600 text-white'
                      }`}>  
                        {isToday ? '🔔 اليوم' : isTomorrow ? '⏰ غداً' : `بعد ${days.toLocaleString('en-US')} أيام`}
                      </Badge>
                      <span className="text-sm font-bold tabular-nums text-muted-foreground">
                        <DateDisplay value={dateStr} />
                      </span>
                    </div>

                    {/* رقم القضية */}
                    <p className="text-lg font-extrabold truncate mb-1">
                      {caseData?.caseNumber || '—'}
                    </p>

                    {/* الموضوع */}
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3" style={{minHeight: '2.5rem'}}>
                      {caseData?.subject || '—'}
                    </p>

                    {/* طبيعة القضية */}
                    {caseData?.caseNature && (
                      <div className="mb-2">
                        <Badge variant="outline" className={`text-xs ${NATURE_BG_COLORS[caseData.caseNature] || 'bg-gray-100 dark:bg-gray-800/30'}`}>
                          {caseData.caseNature}
                        </Badge>
                      </div>
                    )}

                    {/* السبب + المحكمة */}
                    {(item.reason || item.court) && (
                      <div className="flex items-center gap-1.5 text-sm mb-1">
                        <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="truncate font-medium">{item.reason || item.court || '—'}</span>
                      </div>
                    )}
                    {caseData?.courtName && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Scale className="w-4 h-4 shrink-0" />
                        <span className="truncate">{caseData.courtName}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* لا توجد قضايا قادمة — إظهار رسالة */}
      {allUpcoming.length === 0 && (
        <Card className="border-gray-200 dark:border-gray-800/40">
          <CardContent className="py-8 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-base font-medium text-muted-foreground">لا توجد قضايا قادمة خلال 7 أيام</p>
            <p className="text-sm text-muted-foreground/70 mt-1">ستظهر هنا القضايا المؤجلة والجلسات القادمة</p>
          </CardContent>
        </Card>
      )}

      {/* التأجيلات القادمة */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            التأجيلات القادمة
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingDelays.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto smooth-scroll">
              {upcomingDelays.map((delay: any) => {
                const caseData = cases.find((c: any) => c.id === delay.caseId);
                return (
                  <div
                    key={delay.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                    onClick={() => {
                      if (delay.caseId) {
                        setSelectedCaseId(delay.caseId);
                        setActiveSection('cases');
                      }
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{caseData?.subject || '—'}</p>
                      <p className="text-xs text-muted-foreground truncate">{delay.reason}</p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0 mr-2">
                      <DateDisplay value={delay.delayDate} />
                    </Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">لا توجد تأجيلات قادمة</p>
          )}
        </CardContent>
      </Card>

      {/* آخر القضايا */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-teal-500" />
            آخر القضايا
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-72 overflow-y-auto smooth-scroll">
            {cases.length > 0 ? (
              cases
                .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 8)
                .map((c: any) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      if (c.id) {
                        setSelectedCaseId(c.id);
                        setActiveSection('cases');
                      }
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold truncate">{c.caseNumber || '—'}</span>
                        <Badge variant="secondary" className={`${STATUS_COLORS[c.status || ''] || ''} text-xs`}>
                          {c.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{c.subject || '—'}</p>
                    </div>
                    <div className="text-left mr-3 shrink-0">
                      <p className="text-xs text-muted-foreground">{c.courtName || ''}</p>
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">لا توجد قضايا</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
}) {
  const iconClasses: Record<string, string> = {
    teal: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    gray: 'bg-gray-100 dark:bg-gray-800/30 text-gray-600 dark:text-gray-400',
    blue: 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400',
  };

  return (
    <Card className="stat-card-hover border-border/60 shadow-soft hover:shadow-elevated hover:border-primary/30">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${iconClasses[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-muted-foreground truncate leading-relaxed mb-0.5">{title}</p>
            <p className="text-base font-extrabold truncate tabular-nums text-foreground leading-tight">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
