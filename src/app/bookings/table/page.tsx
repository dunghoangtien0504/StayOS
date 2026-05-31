"use client";

import React, { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { BookingKpiCards } from '@/components/booking/BookingKpiCards';
import { BookingTable } from '@/components/booking/BookingTable';
import {
  Search,
  Download,
  LayoutGrid,
  List,
  Calendar as CalendarIcon,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';

export default function BookingTablePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const now = new Date();
  const [fromDate, setFromDate] = useState(format(startOfMonth(now), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(format(endOfMonth(now), 'yyyy-MM-dd'));

  const from = startOfDay(new Date(fromDate));
  const to = endOfDay(new Date(toDate));

  const setPreset = (preset: 'today' | 'month' | 'all') => {
    if (preset === 'today') {
      setFromDate(format(now, 'yyyy-MM-dd'));
      setToDate(format(now, 'yyyy-MM-dd'));
    } else if (preset === 'month') {
      setFromDate(format(startOfMonth(now), 'yyyy-MM-dd'));
      setToDate(format(endOfMonth(now), 'yyyy-MM-dd'));
    } else {
      setFromDate('2026-01-01');
      setToDate('2026-12-31');
    }
  };

  return (
    <Shell title="Danh sách đặt phòng">
      <main className="flex-1 p-8 space-y-8 overflow-y-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">Quản lý đặt phòng</h1>
            <p className="text-muted-foreground font-medium">Danh sách chi tiết và báo cáo doanh thu theo từng booking.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-white border-2 rounded-2xl p-1 shadow-sm">
              <Link href="/bookings/timeline">
                <Button variant="ghost" size="sm" className="rounded-xl px-4 gap-2 font-bold text-muted-foreground">
                  <LayoutGrid size={16} /> Timeline
                </Button>
              </Link>
              <Button size="sm" className="rounded-xl px-4 gap-2 font-bold bg-primary text-white shadow-lg shadow-primary/20">
                <List size={16} /> Danh sách
              </Button>
            </div>
            <Button variant="outline" className="rounded-2xl border-2 px-4 gap-2 font-bold shadow-sm">
              <Download size={16} /> Xuất Excel
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <BookingKpiCards fromDate={from} toDate={to} />

        {/* Filters & Table */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-96 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                <Input
                  placeholder="Tìm theo tên khách, số điện thoại, mã booking..."
                  className="pl-12 rounded-[1.5rem] border-2 focus-visible:ring-primary/20 h-12 font-medium"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 bg-white border-2 rounded-2xl p-1 shadow-sm">
                <button
                  onClick={() => setPreset('today')}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  Hôm nay
                </button>
                <button
                  onClick={() => setPreset('month')}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  Tháng này
                </button>
                <button
                  onClick={() => setPreset('all')}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  Cả năm
                </button>
              </div>

              <div className="flex items-center gap-2 bg-white border-2 rounded-2xl p-2 shadow-sm h-12 px-3">
                <CalendarIcon size={16} className="text-muted-foreground" />
                <input
                  type="date"
                  value={fromDate}
                  max={toDate}
                  onChange={e => setFromDate(e.target.value)}
                  className="text-xs font-bold outline-none bg-transparent cursor-pointer"
                />
                <span className="text-muted-foreground text-xs">→</span>
                <input
                  type="date"
                  value={toDate}
                  min={fromDate}
                  onChange={e => setToDate(e.target.value)}
                  className="text-xs font-bold outline-none bg-transparent cursor-pointer"
                />
              </div>
            </div>
          </div>

          <BookingTable fromDate={from} toDate={to} searchTerm={searchTerm} />
        </div>
      </main>
    </Shell>
  );
}
