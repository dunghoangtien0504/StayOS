"use client";

import React from 'react';
import { Shell } from '@/components/layout/Shell';
import { HousekeepingKanban } from '@/components/housekeeping/HousekeepingKanban';

export default function HousekeepingPage() {
  return (
    <Shell title="Quản lý Buồng phòng">
      <main className="flex-1 p-8 flex flex-col gap-8 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 flex-shrink-0">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">Housekeeping Board</h1>
            <p className="text-muted-foreground font-medium">Theo dõi và nghiệm thu trạng thái dọn phòng thời gian thực.</p>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-200 text-xs font-bold uppercase tracking-tight animate-pulse">
               <span className="w-2 h-2 bg-amber-500 rounded-full" />
               Cần dọn gấp: 2 phòng
             </div>
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <HousekeepingKanban />
        </div>
      </main>
    </Shell>
  );
}
