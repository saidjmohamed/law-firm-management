'use client';

import React from 'react';
import { Archive, Construction } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function ArchivesManager() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="border-0 shadow-sm max-w-md w-full">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800/50 flex items-center justify-center mx-auto mb-4">
            <Archive className="w-8 h-8 text-gray-700 dark:text-gray-400" />
          </div>
          <h3 className="text-lg font-bold mb-2">الأرشيف</h3>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Construction className="w-4 h-4" />
            <p className="text-sm">هذا القسم قيد التطوير</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
