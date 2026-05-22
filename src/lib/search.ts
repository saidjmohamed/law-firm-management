// ============================================================================
// خدمة البحث النصي الشامل
// ============================================================================
// بحث في جميع الجداول مع دعم الفلاتر
// يستخدم Dexie .filter() مع toLowerCase().includes()
// ============================================================================

import { db, type Client, type Case, type Session, type Payment } from './db';

// ============================================================================
// أنواع البيانات
// ============================================================================

/** فلاتر البحث العامة */
export interface SearchFilters {
  courtType?: string;       // نوع القضاء
  courtName?: string;       // اسم المحكمة
  caseNature?: string;      // طبيعة القضية
  status?: string;          // الحالة
  stage?: string;           // مرحلة التقاضي
  dateFrom?: string;        // من تاريخ
  dateTo?: string;          // إلى تاريخ
}

/** فلاتر خاصة بالقضايا */
export interface CaseFilters extends SearchFilters {
  clientId?: number;        // رقم الموكل
  councilName?: string;     // المجلس القضائي
}

/** نتائج البحث مجمّعة حسب النوع */
export interface SearchResults {
  clients: Client[];
  cases: Case[];
  sessions: Session[];
  payments: Payment[];
}

// ============================================================================
// دوال مساعدة
// ============================================================================

/**
 * تطبيع النص للبحث (إزالة التشكيل وتحويل إلى حروف صغيرة)
 * @param text - النص المراد تطبيعه
 * @returns النص المطبع
 */
function normalize(text: string | undefined | null): string {
  if (!text) return '';
  return text
    .toLowerCase()
    // إزالة التشكيل العربي
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]/g, '')
    // توحيد الألف
    .replace(/[أإآا]/g, 'ا')
    // توحيد الياء
    .replace(/[ىي]/g, 'ي')
    // توحيد التاء المربوطة والهاء
    .replace(/ة/g, 'ه');
}

/**
 * البحث عن نص في عدة حقول
 * @param query - نص البحث المطبّع
 * @param fields - الحقول المراد البحث فيها
 * @returns هل تم العثور على تطابق
 */
function matchesQuery(query: string, ...fields: (string | undefined | null)[]): boolean {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return true;
  return fields.some((field) => normalize(field).includes(normalizedQuery));
}

/**
 * التحقق من تطابق التاريخ مع النطاق
 * @param dateStr - التاريخ المراد التحقق منه
 * @param dateFrom - بداية النطاق
 * @param dateTo - نهاية النطاق
 * @returns هل التاريخ ضمن النطاق
 */
function matchesDateRange(
  dateStr: string | undefined | null,
  dateFrom?: string,
  dateTo?: string
): boolean {
  if (!dateFrom && !dateTo) return true;
  if (!dateStr) return false;

  try {
    const date = new Date(dateStr).getTime();
    if (isNaN(date)) return true; // إذا كان التاريخ غير صالح، نتخطى الفلتر

    if (dateFrom) {
      const from = new Date(dateFrom).getTime();
      if (date < from) return false;
    }
    if (dateTo) {
      const to = new Date(dateTo).getTime();
      if (date > to) return false;
    }
    return true;
  } catch {
    return true;
  }
}

// ============================================================================
// بحث الموكلين
// ============================================================================

/**
 * البحث في جدول الموكلين
 * @param query - نص البحث
 * @returns قائمة الموكلين المطابقين
 */
export async function searchClients(query: string): Promise<Client[]> {
  const allClients = await db.clients.toArray();

  return allClients.filter((client) =>
    matchesQuery(
      query,
      client.name,
      client.phone,
      client.phone2,
      client.email,
      client.address,
      client.nationalId,
      client.notes
    )
  );
}

// ============================================================================
// بحث القضايا
// ============================================================================

/**
 * البحث في جدول القضايا مع دعم الفلاتر
 * @param query - نص البحث
 * @param filters - فلاتر إضافية
 * @returns قائمة القضايا المطابقة
 */
export async function searchCases(query: string, filters?: CaseFilters): Promise<Case[]> {
  const allCases = await db.cases.toArray();

  return allCases.filter((c) => {
    // بحث نصي
    const textMatch = matchesQuery(
      query,
      c.caseNumber,
      c.subject,
      c.clientName,
      c.councilName,
      c.courtName,
      c.sectionName,
      c.caseNature,
      c.stage,
      c.customStage,
      c.origCaseNumber,
      c.opposingParty,
      c.opposingLawyer,
      c.barPhone,
      c.notes,
      c.judgment
    );

    if (!textMatch) return false;

    // تطبيق الفلاتر
    if (filters) {
      if (filters.courtType && c.courtType !== filters.courtType) return false;
      if (filters.courtName && normalize(c.courtName) !== normalize(filters.courtName)) return false;
      if (filters.caseNature && normalize(c.caseNature) !== normalize(filters.caseNature)) return false;
      if (filters.status && c.status !== filters.status) return false;
      if (filters.stage && normalize(c.stage) !== normalize(filters.stage)) return false;
      if (filters.clientId !== undefined && c.clientId !== filters.clientId) return false;
      if (filters.councilName && normalize(c.councilName) !== normalize(filters.councilName)) return false;

      // فلتر التاريخ - تاريخ التسجيل
      if (!matchesDateRange(c.registrationDate, filters.dateFrom, filters.dateTo)) return false;
    }

    return true;
  });
}

// ============================================================================
// بحث الجلسات
// ============================================================================

/**
 * البحث في جدول الجلسات
 * @param query - نص البحث
 * @returns قائمة الجلسات المطابقة
 */
export async function searchSessions(query: string): Promise<Session[]> {
  const allSessions = await db.sessions.toArray();

  return allSessions.filter((session) =>
    matchesQuery(
      query,
      session.caseNumber,
      session.caseSubject,
      session.court,
      session.hall,
      session.judgeName,
      session.notes,
      session.result
    )
  );
}

// ============================================================================
// بحث المدفوعات
// ============================================================================

/**
 * البحث في جدول المدفوعات
 * @param query - نص البحث
 * @returns قائمة المدفوعات المطابقة
 */
export async function searchPayments(query: string): Promise<Payment[]> {
  const allPayments = await db.payments.toArray();

  return allPayments.filter((payment) =>
    matchesQuery(
      query,
      payment.caseNumber,
      payment.caseSubject,
      payment.clientName,
      payment.category,
      payment.description
    )
  );
}

// ============================================================================
// بحث شامل في جميع الجداول
// ============================================================================

/**
 * بحث شامل في جميع جداول قاعدة البيانات
 * @param query - نص البحث
 * @param filters - فلاتر اختيارية (تُطبّق على القضايا فقط)
 * @returns نتائج البحث مجمّعة حسب النوع
 */
export async function searchAll(query: string, filters?: SearchFilters): Promise<SearchResults> {
  if (!query.trim()) {
    return { clients: [], cases: [], sessions: [], payments: [] };
  }

  // تنفيذ البحث في جميع الجداول بالتوازي
  const [clients, cases, sessions, payments] = await Promise.all([
    searchClients(query),
    searchCases(query, filters),
    searchSessions(query),
    searchPayments(query),
  ]);

  return { clients, cases, sessions, payments };
}

// ============================================================================
// بحث متقدم - جلب القضايا حسب الحالة
// ============================================================================

/**
 * جلب القضايا حسب الحالة
 * @param status - حالة القضية
 * @returns قائمة القضايا
 */
export async function getCasesByStatus(status: Case['status']): Promise<Case[]> {
  return db.cases.where('status').equals(status).toArray();
}

/**
 * جلب الجلسات القادمة (المجدولة)
 * @param fromDate - تاريخ البداية (افتراضي: اليوم)
 * @returns قائمة الجلسات المجدولة
 */
export async function getUpcomingSessions(fromDate?: string): Promise<Session[]> {
  const startDate = fromDate || new Date().toISOString().split('T')[0];

  return db.sessions
    .where('status')
    .equals('scheduled')
    .filter((session) => session.date >= startDate)
    .sortBy('date');
}

/**
 * جلب الجلسات حسب تاريخ محدد
 * @param date - التاريخ المطلوب
 * @returns قائمة الجلسات في ذلك التاريخ
 */
export async function getSessionsByDate(date: string): Promise<Session[]> {
  return db.sessions.where('date').equals(date).toArray();
}

/**
 * جلب المدفوعات حسب النوع (إيرادات/مصاريف)
 * @param type - نوع الدفع
 * @returns قائمة المدفوعات
 */
export async function getPaymentsByType(type: Payment['type']): Promise<Payment[]> {
  return db.payments.where('type').equals(type).toArray();
}
