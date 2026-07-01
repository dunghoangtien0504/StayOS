"use client";

import React from 'react';
import { useTimelineStore } from '@/store/useTimelineStore';
import { 
  DollarSign, 
  Wallet, 
  Clock, 
  TrendingUp,
  CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props { 
  fromDate?: Date; 
  toDate?: Date; 
  activeFilter?: 'all' | 'received' | 'debt' | 'count';
  onFilterChange?: (filter: 'all' | 'received' | 'debt' | 'count') => void;
}

export const BookingKpiCards = ({ fromDate, toDate, activeFilter = 'all', onFilterChange }: Props = {}) => {
  const { bookings, selectedPropertyId } = useTimelineStore();

  let filteredBookings = selectedPropertyId
    ? bookings.filter(b => b.propertyId === selectedPropertyId && b.status !== 'cancelled')
    : bookings.filter(b => b.status !== 'cancelled');

  // Apply date range filter (by check-in date)
  if (fromDate && toDate) {
    filteredBookings = filteredBookings.filter(b => b.checkIn >= fromDate && b.checkIn <= toDate);
  }

  const stats = {
    totalRevenue: filteredBookings.reduce((sum, b) => sum + b.totalPrice, 0),
    totalPaid: filteredBookings.reduce((sum, b) => sum + b.amountPaid, 0),
    remainingDebt: filteredBookings.reduce((sum, b) => sum + (b.totalPrice - b.amountPaid), 0),
    bookingCount: filteredBookings.length,
  };

  const kpis = [
    {
      filter: 'all' as const,
      label: 'Tổng doanh thu',
      value: stats.totalRevenue.toLocaleString('vi-VN') + 'đ',
      icon: DollarSign,
      color: 'text-primary',
      bg: 'bg-primary/10',
      border: 'border-primary/20'
    },
    {
      filter: 'received' as const,
      label: 'Thực thu',
      value: stats.totalPaid.toLocaleString('vi-VN') + 'đ',
      icon: Wallet,
      color: 'text-green-600',
      bg: 'bg-green-50/10',
      border: 'border-green-500/20'
    },
    {
      filter: 'debt' as const,
      label: 'Công nợ (Chưa TT)',
      value: stats.remainingDebt.toLocaleString('vi-VN') + 'đ',
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20'
    },
    {
      filter: 'count' as const,
      label: 'Số lượng đặt phòng',
      value: stats.bookingCount.toString(),
      icon: CreditCard,
      color: 'text-blue-600',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpis.map((kpi) => {
        const isActive = activeFilter === kpi.filter;
        return (
          <div 
            key={kpi.label} 
            onClick={() => onFilterChange?.(kpi.filter)}
            className={cn(
              "bg-white p-6 rounded-[2rem] border-2 shadow-sm transition-all group cursor-pointer hover:shadow-md",
              isActive 
                ? "border-primary ring-2 ring-primary/10 scale-[1.02] shadow-md" 
                : kpi.border
            )}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", kpi.bg, kpi.color)}>
                <kpi.icon size={24} />
              </div>
              <div className="flex items-center gap-1 text-[10px] font-black text-green-600 uppercase tracking-widest bg-green-50 px-2 py-1 rounded-full">
                <TrendingUp size={12} />
                +12.5%
              </div>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">{kpi.label}</p>
            <h3 className="text-2xl font-black tracking-tight text-foreground">{kpi.value}</h3>
          </div>
        );
      })}
    </div>
  );
};
