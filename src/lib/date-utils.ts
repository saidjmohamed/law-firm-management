// ============================================================================
// أدوات مساعدة للتواريخ - التحويل بين المدخلات وPrisma DateTime
// ============================================================================

/**
 * تحويل قيمة (string/Date/null/undefined) إلى Date أو null لقاعدة البيانات
 * يدعم: "2026-04-30" / "2026-04-30T00:00:00Z" / "30/04/2026" / Date / ""
 */
export function toDateOrNull(value: string | Date | null | undefined): Date | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  const s = String(value).trim();
  if (!s) return null;

  // ISO YYYY-MM-DD أو ISO timestamp
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})(T.*)?$/);
  if (isoMatch) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  // DD/MM/YYYY
  const dmyMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmyMatch) {
    const dd = dmyMatch[1].padStart(2, '0');
    const mm = dmyMatch[2].padStart(2, '0');
    const yyyy = dmyMatch[3];
    const d = new Date(`${yyyy}-${mm}-${dd}T00:00:00Z`);
    return isNaN(d.getTime()) ? null : d;
  }

  // محاولة عامة
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * تحويل قيمة (string/Date/null/undefined) إلى ISO string (للاستجابة API)
 */
export function toDateISOString(value: string | Date | null | undefined): string | null {
  const d = toDateOrNull(value);
  return d ? d.toISOString() : null;
}

/**
 * تحويل قيمة Date من Prisma إلى صيغة YYYY-MM-DD لحقول input[type=date]
 */
export function toDateInputValue(value: Date | string | null | undefined): string {
  if (!value) return '';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
