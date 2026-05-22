"use client";

import React, { useState } from 'react';
import { TimelineCanvas } from '@/components/timeline/TimelineCanvas';
import {
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Shell } from '@/components/layout/Shell';
import { cn } from '@/lib/utils';
import { useTimelineStore } from '@/store/useTimelineStore';
import { addDays, subDays, format } from 'date-fns';
import { vi } from 'date-fns/locale';

type BookingSource = 'zalo' | 'facebook' | 'booking' | 'airbnb' | 'walk_in' | 'direct';

const SOURCES: { key: BookingSource; label: string; color: string }[] = [
  { key: 'zalo',     label: 'Zalo',        color: 'bg-[#0068FF]' },
  { key: 'facebook', label: 'Facebook',    color: 'bg-[#1877F2]' },
  { key: 'booking',  label: 'Booking.com', color: 'bg-[#003580]' },
  { key: 'airbnb',   label: 'Airbnb',      color: 'bg-[#FF5A5F]' },
  { key: 'walk_in',  label: 'Walk-in',     color: 'bg-[#6B7280]' },
  { key: 'direct',   label: 'Direct',      color: 'bg-[#10B981]' },
];

export default function TimelinePage() {
  const { startDate, setStartDate, daysToShow } = useTimelineStore();
  const [activeFilters, setActiveFilters] = useState<Set<BookingSource>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const toggleSource = (key: BookingSource) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const clearFilters = () => setActiveFilters(new Set());

  const endDate = addDays(startDate, daysToShow - 1);

  return (
    <Shell title="Lịch đặt phòng">
      <main className="flex-1 p-6 overflow-hidden flex flex-col gap-4">

        {/* Toolbar */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Date nav */}
            <div className="flex items-center gap-1 bg-white border rounded-xl p-1 shadow-sm">
              <button
                onClick={() => setStartDate(subDays(startDate, daysToShow))}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="px-3 text-sm font-black tracking-tight min-w-[140px] text-center">
                {format(startDate, 'dd/MM', { locale: vi })} – {format(endDate, 'dd/MM/yyyy', { locale: vi })}
              </span>
              <button
                onClick={() => setStartDate(addDays(startDate, daysToShow))}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
            <button
              onClick={() => setStartDate(new Date())}
              className="px-4 py-2 bg-white border rounded-xl font-bold text-sm shadow-sm hover:bg-muted transition-colors"
            >
              Hôm nay
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeFilters.size > 0 && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-xs font-bold text-muted-foreground bg-white border rounded-xl hover:bg-muted transition-colors"
              >
                Bỏ lọc ({activeFilters.size})
              </button>
            )}
            <button
              onClick={() => setShowFilters(v => !v)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm shadow-sm border transition-colors",
                showFilters || activeFilters.size > 0
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-foreground hover:bg-muted"
              )}
            >
              <Filter size={16} />
              Lọc kênh
              {activeFilters.size > 0 && (
                <span className="bg-white/30 text-white text-[10px] font-black px-1.5 rounded-full">
                  {activeFilters.size}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Source Filter Panel */}
        {showFilters && (
          <div className="flex items-center gap-2 flex-wrap animate-in fade-in slide-in-from-top-2 duration-200 flex-shrink-0">
            <span className="text-[11px] font-black uppercase text-muted-foreground tracking-wider mr-1">
              Lọc theo kênh:
            </span>
            {SOURCES.map(src => {
              const active = activeFilters.has(src.key);
              return (
                <button
                  key={src.key}
                  onClick={() => toggleSource(src.key)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all",
                    active
                      ? "border-transparent text-white shadow-md scale-105"
                      : "border-muted bg-white text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                  style={active ? { backgroundColor: src.color.replace('bg-[', '').replace(']', '') } : {}}
                >
                  <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", src.color)} />
                  {src.label}
                  {active && <span className="text-white/80">✓</span>}
                </button>
              );
            })}
            <div className="h-4 w-px bg-muted mx-1" />
            <span className="text-[10px] text-muted-foreground font-medium italic">
              {activeFilters.size === 0 ? 'Hiện tất cả kênh' : `Chỉ hiện: ${[...activeFilters].map(k => SOURCES.find(s => s.key === k)?.label).join(', ')}`}
            </span>
          </div>
        )}

        {/* Legend (always visible) */}
        <div className="flex items-center gap-5 flex-shrink-0 px-1 overflow-x-auto">
          {SOURCES.map(src => (
            <button
              key={src.key}
              onClick={() => { setShowFilters(true); toggleSource(src.key); }}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap group transition-all",
                activeFilters.has(src.key) ? "opacity-100" : activeFilters.size > 0 ? "opacity-40" : "opacity-80 hover:opacity-100"
              )}
              title={`Lọc theo ${src.label}`}
            >
              <div className={cn(
                "w-3 h-3 rounded-sm transition-transform group-hover:scale-125",
                src.color,
                activeFilters.has(src.key) && "ring-2 ring-offset-1 ring-foreground/30 scale-110"
              )} />
              <span className="text-[10px] font-black uppercase tracking-tight text-muted-foreground group-hover:text-foreground transition-colors">
                {src.label}
              </span>
            </button>
          ))}
          <div className="h-4 w-px bg-muted mx-1 flex-shrink-0" />
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-[10px] font-black uppercase tracking-tight text-muted-foreground">Sạch</span>
          </div>
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-[10px] font-black uppercase tracking-tight text-muted-foreground">Đang dọn</span>
          </div>
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-[10px] font-black uppercase tracking-tight text-muted-foreground">Bẩn</span>
          </div>
        </div>

        {/* Timeline Canvas */}
        <div className="flex-1 min-h-0 bg-white rounded-[2rem] border shadow-2xl shadow-slate-200/50 overflow-hidden relative border-t-8 border-t-primary/20">
          <TimelineCanvas sourceFilter={activeFilters.size > 0 ? activeFilters : null} />
        </div>
      </main>
    </Shell>
  );
}
