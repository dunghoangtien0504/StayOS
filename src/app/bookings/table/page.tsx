"use client";

import React, { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { BookingKpiCards } from '@/components/booking/BookingKpiCards';
import { BookingTable } from '@/components/booking/BookingTable';
import { 
  Search, 
  Filter, 
  Download, 
  LayoutGrid, 
  List,
  Calendar as CalendarIcon
} from 'lucide-react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function BookingTablePage() {
  const [searchTerm, setSearchTerm] = useState('');

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
        <BookingKpiCards />

        {/* Filters & Table */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-96 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                <Input 
                  placeholder="Tìm theo tên khách, số điện thoại..." 
                  className="pl-12 rounded-[1.5rem] border-2 focus-visible:ring-primary/20 h-12 font-medium"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" className="rounded-2xl border-2 h-12 px-6 gap-2 font-bold hover:bg-muted transition-colors">
                <Filter size={18} /> Lọc
              </Button>
            </div>

            <div className="flex items-center gap-2 bg-white border-2 rounded-2xl p-1 shadow-sm h-12 px-4">
              <CalendarIcon size={18} className="text-muted-foreground" />
              <span className="text-sm font-black tracking-tight px-2">01/05/2026 – 31/05/2026</span>
            </div>
          </div>

          <BookingTable />
        </div>
      </main>
    </Shell>
  );
}
