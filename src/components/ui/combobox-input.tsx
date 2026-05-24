'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { ChevronDown, X } from 'lucide-react';

interface ComboboxInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  className?: string;
  /** نص زر الإضافة عند عدم وجود تطابق، افتراضي: "كنقابة جديدة" */
  addLabel?: string;
}

export function ComboboxInput({
  value,
  onChange,
  suggestions,
  placeholder,
  className,
  addLabel = 'كنقابة جديدة',
}: ComboboxInputProps) {
  const [open, setOpen] = useState(false);
  const [filtered, setFiltered] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.trim() === '') {
      setFiltered(suggestions);
    } else {
      setFiltered(
        suggestions.filter((s) =>
          s.toLowerCase().includes(value.toLowerCase())
        )
      );
    }
  }, [value, suggestions]);

  // إغلاق عند النقر خارج
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // نص زر الإضافة
  const addButtonText = `إضافة "${value.trim()}" ${addLabel}`;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className={`h-11 pl-8 ${className || ''}`}
        />
        {/* أيقونة السهم */}
        <button
          type="button"
          tabIndex={-1}
          className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          onClick={() => setOpen((o) => !o)}
        >
          <ChevronDown className="w-4 h-4" />
        </button>
        {/* زر مسح */}
        {value && (
          <button
            type="button"
            tabIndex={-1}
            className="absolute left-7 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => {
              onChange('');
              setOpen(false);
            }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* قائمة الاقتراحات */}
      {open && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filtered.map((s) => (
            <button
              key={s}
              type="button"
              className="w-full text-right px-3 py-2 text-sm hover:bg-muted transition-colors block"
              onMouseDown={(e) => {
                e.preventDefault(); // منع blur على الـ Input
                onChange(s);
                setOpen(false);
              }}
            >
              {s}
            </button>
          ))}
          {/* إضافة القيمة الحالية إذا لم تكن موجودة */}
          {value.trim() &&
            !filtered.some((s) => s.toLowerCase() === value.toLowerCase()) && (
              <button
                type="button"
                className="w-full text-right px-3 py-2 text-sm text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors border-t border-border block"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(value.trim());
                  setOpen(false);
                }}
              >
                {addButtonText}
              </button>
            )}
        </div>
      )}

      {/* رسالة عند لا توجد نتائج */}
      {open && value.trim() && filtered.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg">
          <button
            type="button"
            className="w-full text-right px-3 py-2 text-sm text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors block"
            onMouseDown={(e) => {
              e.preventDefault();
              onChange(value.trim());
              setOpen(false);
            }}
          >
            {addButtonText}
          </button>
        </div>
      )}
    </div>
  );
}
