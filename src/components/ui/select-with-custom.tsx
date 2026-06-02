'use client';
import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useCustomOptions } from '@/lib/api';

interface SelectWithCustomProps {
  field: string;
  value: string;
  onChange: (value: string) => void;
  staticOptions: { value: string; label: string }[];
  placeholder?: string;
}

export function SelectWithCustom({
  field,
  value,
  onChange,
  staticOptions,
  placeholder = 'اختر...',
}: SelectWithCustomProps) {
  const { customOptions, addOption } = useCustomOptions(field);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState('');

  const allOptions = [
    ...staticOptions,
    ...customOptions.filter(co =>
      !staticOptions.some(so => so.value === co.value)
    ),
  ];

  const handleSaveCustom = async () => {
    const trimmed = customValue.trim();
    if (!trimmed) return;
    await addOption(trimmed, trimmed);
    onChange(trimmed);
    setCustomValue('');
    setShowCustomInput(false);
  };

  return (
    <div className="space-y-2">
      <Select
        value={value}
        onValueChange={(v) => {
          if (v === '__custom__') {
            setShowCustomInput(true);
          } else {
            setShowCustomInput(false);
            onChange(v);
          }
        }}
      >
        <SelectTrigger className="h-11">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {allOptions.map(opt => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
          <SelectItem value="__custom__" className="text-teal-600 font-medium border-t border-border mt-1 pt-1">
            ＋ أخرى (أدخل قيمة جديدة)
          </SelectItem>
        </SelectContent>
      </Select>

      {showCustomInput && (
        <div className="flex gap-2 items-center">
          <Input
            value={customValue}
            onChange={e => setCustomValue(e.target.value)}
            placeholder="اكتب القيمة الجديدة..."
            className="h-9 flex-1"
            onKeyDown={e => e.key === 'Enter' && handleSaveCustom()}
            autoFocus
          />
          <Button
            type="button"
            size="sm"
            onClick={handleSaveCustom}
            disabled={!customValue.trim()}
            className="h-9 px-3"
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => { setShowCustomInput(false); setCustomValue(''); }}
            className="h-9 px-3"
          >
            إلغاء
          </Button>
        </div>
      )}
    </div>
  );
}
