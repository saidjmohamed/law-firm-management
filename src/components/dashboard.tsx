'use client';

import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, formatCurrency } from '@/lib/db';
import { STATUS_COLORS, CASE_NATURES, formatDate } from '@/lib/constants';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Briefcase,
  TrendingUp,
  DollarSign,
  Clock,
  Plus,
  Users,
  Calendar,
  AlertTriangle,
} from 'lucide-react';

export function Dashboard() {
  const setActiveSection = useAppStore((s) => s.setActiveSection);
  const setSelectedCaseId = useAppStore((s) => s.setSelectedCaseId);

  const cases = useLiveQuery(() => db.cases.toArray());
  const delays = useLiveQuery(() => db.delays.toArray());
  const sessions = useLiveQuery(() => db.sessions.toArray());
  const payments = useLiveQuery(() => db.payments.toArray());
  const parties = useLiveQuery(() => db.parties.toArray());

  const totalCases = cases?.length ?? 0;
  const activeCases = cases?.filter((c) => c.status === 'جارية').length ?? 0;
  const archivedCases = cases?.filter((c) => c.status === 'مؤرشفة').length ?? 0;
  const totalFees = cases?.reduce((sum, c) => sum + (c.totalFees || 0), 0) ?? 0;
  const totalPaid = cases?.reduce((sum, c) => sum + (c.paidAmount || 0), 0) ?? 0;
  const totalRemaining = totalFees - totalPaid;

  // القضايا حسب الطبيعة
  const casesByNature = CASE_NATURES.map((nature) => ({
    nature,
    count: cases?.filter((c) => c.caseNature === nature).length ?? 0,
  })).filter((n) => n.count > 0).sort((a, b) => b.count - a.count);

  // توزيع الحالات
  const statusDistribution = [
    { status: 'جارية', count: cases?.filter((c) => c.status === 'جارية').length ?? 0 },
    { status: 'للجدولة', count: cases?.filter((c) => c.status === 'للجدولة').length ?? 0 },
    { status: 'مفصول فيها', count: cases?.filter((c) => c.status === 'مفصول فيها').length ?? 0 },
    { status: 'مؤرشفة', count: cases?.filter((c) => c.status === 'مؤرشفة').length ?? 0 },
  ].filter((s) => s.count > 0);

  // التأجيلات القادمة
  const now = new Date();
  const upcomingDelays = delays
    ?.filter((d) => d.delayDate && new Date(d.delayDate) >= now)
    .sort((a, b) => (a.delayDate || '').localeCompare(b.delayDate || ''))
    .slice(0, 5) ?? [];

  // الجلسات القادمة (7 أيام)
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcomingSessions = sessions
    ?.filter((s) => s.date && new Date(s.date) >= now && new Date(s.date) <= nextWeek)
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
    .slice(0, 5) ?? [];

  const maxNatureCount = Math.max(...casesByNature.map((n) => n.count), 1);

  return (
    <div className="space-y-6">
      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          title="إجمالي القضايا"
          value={(totalCases).toLocaleString('en-US')}
          icon={Briefcase}
          color="teal"
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
          title="إجمالي الأتعاب"
          value={formatCurrency(totalFees)}
          icon={DollarSign}
          color="teal"
        />
        <StatCard
          title="المدفوع"
          value={formatCurrency(totalPaid)}
          icon={DollarSign}
          color="emerald"
        />
        <StatCard
          title="المتبقي"
          value={formatCurrency(totalRemaining)}
          icon={AlertTriangle}
          color={totalRemaining > 0 ? 'amber' : 'emerald'}
        />
      </div>

      {/* أزرار الإجراءات السريعة */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => {
            setSelectedCaseId(null);
            setActiveSection('cases');
          }}
          className="bg-teal-600 hover:bg-teal-700"
        >
          <Plus className="w-4 h-4 ml-2" />
          إضافة قضية
        </Button>
        <Button
          variant="outline"
          onClick={() => setActiveSection('clients')}
        >
          <Plus className="w-4 h-4 ml-2" />
          إضافة موكل
        </Button>
        <Button
          variant="outline"
          onClick={() => setActiveSection('sessions')}
        >
          <Calendar className="w-4 h-4 ml-2" />
          الجلسات
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* القضايا حسب الطبيعة */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">القضايا حسب الطبيعة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {casesByNature.map((item) => (
              <div key={item.nature} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{item.nature}</span>
                  <span className="font-medium">{(item.count).toLocaleString('en-US')}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-500 rounded-full transition-all"
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
            <CardTitle className="text-base">توزيع الحالات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {statusDistribution.map((item) => (
                <Badge
                  key={item.status}
                  variant="secondary"
                  className={`${STATUS_COLORS[item.status] || ''} text-sm py-1.5 px-3`}
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
                    className={`${colors[item.status] || 'bg-gray-400'}`}
                    style={{ width: `${(item.count / totalCases) * 100}%` }}
                    title={`${item.status}: ${item.count}`}
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* التأجيلات القادمة */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              التأجيلات القادمة
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingDelays.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {upcomingDelays.map((delay) => {
                  const caseData = cases?.find((c) => c.id === delay.caseId);
                  return (
                    <div
                      key={delay.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/30"
                      onClick={() => {
                        if (delay.caseId) {
                          setSelectedCaseId(delay.caseId);
                          setActiveSection('cases');
                        }
                      }}
                    >
                      <div>
                        <p className="text-sm font-medium">{caseData?.subject || '—'}</p>
                        <p className="text-xs text-muted-foreground">{delay.reason}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {formatDate(delay.delayDate)}
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

        {/* الجلسات القادمة */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-500" />
              الجلسات القادمة (7 أيام)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingSessions.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {upcomingSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-teal-50 dark:bg-teal-900/20 cursor-pointer hover:bg-teal-100 dark:hover:bg-teal-900/30"
                    onClick={() => {
                      if (session.caseId) {
                        setSelectedCaseId(session.caseId);
                        setActiveSection('cases');
                      }
                    }}
                  >
                    <div>
                      <p className="text-sm font-medium">{session.caseNumber || '—'}</p>
                      <p className="text-xs text-muted-foreground">{session.court || ''}</p>
                    </div>
                    <div className="text-left">
                      <Badge variant="outline" className="text-xs">
                        {formatDate(session.date)}
                      </Badge>
                      {session.time && (
                        <p className="text-xs text-muted-foreground mt-1">{session.time}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">لا توجد جلسات في الأيام السبعة القادمة</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* آخر القضايا */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-teal-500" />
            آخر القضايا
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {cases
              ?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 8)
              .map((c) => (
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
                      <span className="text-sm font-medium truncate">{c.caseNumber || '—'}</span>
                      <Badge variant="secondary" className={`${STATUS_COLORS[c.status || ''] || ''} text-xs`}>
                        {c.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{c.subject || '—'}</p>
                  </div>
                  <div className="text-left mr-3 shrink-0">
                    <p className="text-xs text-muted-foreground">{c.courtName || ''}</p>
                  </div>
                </div>
              )) ?? <p className="text-sm text-muted-foreground text-center py-4">لا توجد قضايا</p>}
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
  const colorClasses: Record<string, string> = {
    teal: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    gray: 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400',
  };

  const iconClasses: Record<string, string> = {
    teal: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    gray: 'bg-gray-100 dark:bg-gray-800/30 text-gray-600 dark:text-gray-400',
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconClasses[color]}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">{title}</p>
            <p className="text-sm font-bold truncate">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
