'use client';

import React from 'react';
import { formatDate, formatDateTime } from '@/lib/constants';

/**
 * عرض التاريخ بصيغة DD/MM/YYYY مع dir="ltr" لمنع انعكاسه في RTL
 */
export function DateDisplay({
  value,
  withTime = false,
  className = '',
  placeholder = '—',
}: {
  value: string | Date | null | undefined;
  withTime?: boolean;
  className?: string;
  placeholder?: string;
}) {
  if (!value) return <span className={className}>{placeholder}</span>;
  const formatted = withTime ? formatDateTime(value) : formatDate(value);
  if (formatted === '—') return <span className={className}>{placeholder}</span>;
  return (
    <span
      dir="ltr"
      className={`date-display inline-block ${className}`}
      style={{ unicodeBidi: 'isolate' }}
    >
      {formatted}
    </span>
  );
}

/**
 * حقل إدخال تاريخ بـ dir="ltr" يمنع الانعكاس في RTL
 */
export const DateInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function DateInput({ className = '', ...props }, ref) {
  return (
    <input
      ref={ref}
      type="date"
      dir="ltr"
      style={{ unicodeBidi: 'isolate' }}
      className={`w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all ${className}`}
      {...props}
    />
  );
});

/**
 * تحويل Date من Prisma إلى قيمة YYYY-MM-DD لـ input[type=date]
 */
export function toDateInputValue(value: string | Date | null | undefined): string {
  if (!value) return '';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
