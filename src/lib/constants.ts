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

/** أنواع المحاكم */
export const COURT_TYPES = [
  'محكمة عادية',
  'مجلس قضاء',
  'محكمة إدارية',
  'محكمة إدارية استئنافية',
  'محكمة تجارية',
  'المحكمة العليا',
] as const;

/** الغرف/الأقسام */
export const JUDICIAL_CHAMBERS = [
  'الغرفة الجزائية',
  'الغرفة المدنية',
  'قسم الأحوال الشخصية',
  'الغرفة العقارية',
  'الغرفة التجارية',
  'الغرفة البحرية',
  'الغرفة العمالية',
  'الغرفة الإدارية',
  'غرفة الاتهام',
  'قسم الجنح',
  'قسم المخالفات',
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

/** تنسيق التاريخ */
export function formatDate(date: string | undefined | null): string {
  if (!date) return '—';
  try {
    return new Date(date).toLocaleDateString('ar-DZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return date;
  }
}
