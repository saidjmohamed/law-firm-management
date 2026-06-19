// ============================================================================
// الثوابت - الولايات والبيانات القانونية الجزائرية
// ============================================================================

/** الولايات الـ 58 */
export const WILAYAS = [
  { code: 1, name: 'أدرار' },
  { code: 2, name: 'الشلف' },
  { code: 3, name: 'الأغواط' },
  { code: 4, name: 'أم البواقي' },
  { code: 5, name: 'باتنة' },
  { code: 6, name: 'بجاية' },
  { code: 7, name: 'بسكرة' },
  { code: 8, name: 'بشار' },
  { code: 9, name: 'البليدة' },
  { code: 10, name: 'البويرة' },
  { code: 11, name: 'تمنراست' },
  { code: 12, name: 'تبسة' },
  { code: 13, name: 'تلمسان' },
  { code: 14, name: 'تيارت' },
  { code: 15, name: 'تيزي وزو' },
  { code: 16, name: 'الجزائر' },
  { code: 17, name: 'الجلفة' },
  { code: 18, name: 'جيجل' },
  { code: 19, name: 'سطيف' },
  { code: 20, name: 'سعيدة' },
  { code: 21, name: 'سكيكدة' },
  { code: 22, name: 'سيدي بلعباس' },
  { code: 23, name: 'عنابة' },
  { code: 24, name: 'قالمة' },
  { code: 25, name: 'قسنطينة' },
  { code: 26, name: 'المدية' },
  { code: 27, name: 'مستغانم' },
  { code: 28, name: 'المسيلة' },
  { code: 29, name: 'معسكر' },
  { code: 30, name: 'ورقلة' },
  { code: 31, name: 'وهران' },
  { code: 32, name: 'البيض' },
  { code: 33, name: 'إليزي' },
  { code: 34, name: 'برج بوعريريج' },
  { code: 35, name: 'بومرداس' },
  { code: 36, name: 'الطارف' },
  { code: 37, name: 'تندوف' },
  { code: 38, name: 'تيسمسيلت' },
  { code: 39, name: 'الوادي' },
  { code: 40, name: 'خنشلة' },
  { code: 41, name: 'سوق أهراس' },
  { code: 42, name: 'تيبازة' },
  { code: 43, name: 'ميلة' },
  { code: 44, name: 'عين الدفلى' },
  { code: 45, name: 'النعامة' },
  { code: 46, name: 'عين تيموشنت' },
  { code: 47, name: 'غرداية' },
  { code: 48, name: 'غليزان' },
  { code: 49, name: 'تيميمون' },
  { code: 50, name: 'برج باجي مختار' },
  { code: 51, name: 'أولاد جلال' },
  { code: 52, name: 'بني عباس' },
  { code: 53, name: 'عين صالح' },
  { code: 54, name: 'عين قزام' },
  { code: 55, name: 'تقرت' },
  { code: 56, name: 'جانت' },
  { code: 57, name: 'المغير' },
  { code: 58, name: 'المنيعة' },
] as const;

/** طبيعة القضية */
export const CASE_NATURES = [
  'جنحة',
  'مخالفة',
  'جناية',
  'أحداث',
  'تحقيق / غرفة الاتهام',
  'مدني',
  'عقاري',
  'شؤون الأسرة',
  'عمالي',
  'تجاري',
  'بحري',
  'استعجالي',
  'إداري',
  'اداري استئنافي',
  'أمر على عريضة',
  'أخرى',
] as const;

/** حالة القضية */
export const CASE_STATUSES = [
  'جارية',
  'للجدولة',
  'مفصول فيها',
  'مؤرشفة',
] as const;

/** مراحل التقاضي */
export const LITIGATION_STAGES = [
  'افتتاحية (ابتدائي)',
  'استئنافية',
  'معارضة',
  'استدعاء مباشر',
  'تحقيق',
  'معارضة مع إدخال رقم القضية محل البراءة',
  'أخرى',
] as const;

/** أدوار الأطراف */
export const PARTY_ROLES = [
  'مدعي',
  'مدعى عليه',
  'مشتكي',
  'مشتكى منه',
  'ضحية',
  'طرف مدني',
  'مدخل في الخصام',
  'متهم',
  'مستأنف',
  'مستأنف عليه',
  'معارض',
  'معارض ضده',
] as const;

/** أنواع القضاء */
export const JUDICIARY_TYPES = [
  { value: 'supreme', label: 'المحكمة العليا' },
  { value: 'ordinary', label: 'القضاء العادي' },
  { value: 'admin', label: 'القضاء الإداري' },
  { value: 'commercial', label: 'المحكمة التجارية المتخصصة' },
] as const;

/** مستويات القضاء العادي */
export const ORDINARY_COURT_LEVELS = [
  { value: 'council', label: 'مجلس قضائي' },
  { value: 'court', label: 'محكمة' },
] as const;

/** مستويات القضاء الإداري */
export const ADMIN_COURT_LEVELS = [
  { value: 'admin_appeal', label: 'المحكمة الإدارية الاستئنافية' },
  { value: 'admin_first', label: 'المحكمة الإدارية الابتدائية' },
] as const;

/** غرف المحكمة العليا */
export const SUPREME_CHAMBERS = [
  'الغرفة المدنية',
  'الغرفة العقارية',
  'غرفة شؤون الأسرة والمواريث',
  'الغرفة التجارية والبحرية',
  'الغرفة الاجتماعية',
  'الغرفة الجنائية',
  'غرفة الجنح والمخالفات',
] as const;

/** غرف المجالس القضائية */
export const COUNCIL_CHAMBERS = [
  'الغرفة المدنية',
  'الغرفة الجزائية',
  'غرفة الاتهام',
  'الغرفة الاستعجالية',
  'غرفة شؤون الأسرة',
  'غرفة الأحداث',
  'الغرفة الاجتماعية',
  'الغرفة العقارية',
  'الغرفة البحرية',
  'الغرفة التجارية',
] as const;

/** جميع الغرف والأقسام (للقضايا) */
export const JUDICIAL_CHAMBERS: string[] = [
  'الغرفة المدنية',
  'الغرفة العقارية',
  'غرفة شؤون الأسرة والمواريث',
  'الغرفة التجارية والبحرية',
  'الغرفة الاجتماعية',
  'الغرفة الجنائية',
  'غرفة الجنح والمخالفات',
  'الغرفة الجزائية',
  'غرفة الاتهام',
  'الغرفة الاستعجالية',
  'غرفة شؤون الأسرة',
  'غرفة الأحداث',
  'الغرفة البحرية',
  'الغرفة التجارية',
  'القسم المدني',
  'قسم الجنح',
  'قسم المخالفات',
  'القسم الاستعجالي',
  'قسم شؤون الأسرة',
  'قسم الأحداث',
  'القسم الاجتماعي',
  'القسم العقاري',
  'القسم البحري',
  'القسم التجاري',
  'الإداري العادي',
  'الإداري الاستئنافي',
  'عقاري',
  'مدني',
  'جنح',
  'جزائي',
];

/** أقسام المحاكم */
export const COURT_SECTIONS = [
  'القسم المدني',
  'قسم الجنح',
  'قسم المخالفات',
  'القسم الاستعجالي',
  'قسم شؤون الأسرة',
  'قسم الأحداث',
  'القسم الاجتماعي',
  'القسم العقاري',
  'القسم البحري',
  'القسم التجاري',
] as const;

/** أرقام الغرف */
export const CHAMBER_NUMBERS = [
  { value: 0, label: 'بدون رقم' },
  { value: 1, label: '01' },
  { value: 2, label: '02' },
  { value: 3, label: '03' },
  { value: 4, label: '04' },
  { value: 5, label: '05' },
  { value: 6, label: '06' },
  { value: 7, label: '07' },
  { value: 8, label: '08' },
  { value: 9, label: '09' },
  { value: 10, label: '10' },
] as const;

/** فئات المدفوعات */
export const PAYMENT_CATEGORIES = [
  'أتعاب',
  'استشارات',
  'مصاريف',
  'رسوم قضية',
  'إيجار',
  'مرتبات',
  'مصاريف مكتب',
  'أخرى',
] as const;

/** حالات الجلسة */
export const SESSION_STATUSES = [
  { value: 'scheduled', label: 'مجدولة' },
  { value: 'completed', label: 'مكتملة' },
  { value: 'postponed', label: 'مؤجلة' },
  { value: 'cancelled', label: 'ملغاة' },
] as const;

/** ألوان حالة القضية */
export const STATUS_COLORS: Record<string, string> = {
  'جارية': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  'للجدولة': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  'مفصول فيها': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  'مؤرشفة': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

/** تنسيق التاريخ بصيغة DD/MM/YYYY (لاتيني لمنع انعكاس RTL) */
export function formatDate(date: string | Date | undefined | null): string {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '—';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch {
    return '—';
  }
}

/** تنسيق التاريخ والوقت بصيغة DD/MM/YYYY HH:MM */
export function formatDateTime(date: string | Date | undefined | null): string {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '—';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  } catch {
    return '—';
  }
}

/**
 * تحويل قيمة تاريخ (string من input[type=date] أو Date) إلى ISO string لقاعدة البيانات
 * - يدعم: "2026-04-30" / "30/04/2026" / Date / "" / null
 */
export function toDateInput(value: string | Date | undefined | null): string {
  if (!value) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const s = String(value).trim();
  if (!s) return '';
  // ISO YYYY-MM-DD
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  // DD/MM/YYYY
  const dmyMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dmyMatch) {
    const dd = dmyMatch[1].padStart(2, '0');
    const mm = dmyMatch[2].padStart(2, '0');
    return `${dmyMatch[3]}-${mm}-${dd}`;
  }
  // محاولة عامة
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return '';
}

/** هل التاريخ صالح؟ */
export function isValidDate(value: string | Date | undefined | null): boolean {
  if (!value) return false;
  const d = typeof value === 'string' ? new Date(value) : value;
  return !isNaN(d.getTime());
}

/** الأيام بالعربية */
export const ARABIC_DAYS = [
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت',
] as const;

/** تنسيق العملة */
export function formatCurrency(amount: number | undefined | null): string {
  if (amount == null) return '0 د.ج';
  return `${amount.toLocaleString('en-US')} د.ج`;
}

/** الأشهر بالعربية */
export const ARABIC_MONTHS = [
  'جانفي',
  'فيفري',
  'مارس',
  'أفريل',
  'ماي',
  'جوان',
  'جويلية',
  'أوت',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
] as const;
