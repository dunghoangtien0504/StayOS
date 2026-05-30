"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Home,
  BookOpen,
  Activity,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { useTimelineStore } from '@/store/useTimelineStore';
import { cn } from '@/lib/utils';
import { startOfMonth, endOfMonth, startOfDay, endOfDay, subMonths, subDays, format } from 'date-fns';
import { getRevenueByPeriod, getExpenseByPeriod, getLastNMonthsStats } from '@/lib/finance';

type Period = 'today' | 'month' | 'custom';

function calcTrend(current: number, prev: number, asPercent = true): { label: string; up: boolean } {
  if (prev === 0) return current > 0 ? { label: 'Mới', up: true } : { label: '—', up: true };
  const delta = current - prev;
  const sign = delta >= 0 ? '+' : '';
  if (asPercent) {
    return { label: `${sign}${((delta / prev) * 100).toFixed(1)}%`, up: delta >= 0 };
  }
  return { label: `${sign}${delta}`, up: delta >= 0 };
}

export const DashboardView = () => {
  const { bookings, properties, rooms, assignments, selectedPropertyId, settings } = useTimelineStore();
  const hiddenWidgets = settings?.hiddenWidgets ?? [];
  const showWidget = (slug: string) => !hiddenWidgets.includes(slug);

  const [period, setPeriod] = useState<Period>('month');
  const router = useRouter();

  const now = new Date();
  const propertyId = selectedPropertyId || undefined;

  // Custom date range
  const [customFrom, setCustomFrom] = useState(format(startOfMonth(now), 'yyyy-MM-dd'));
  const [customTo, setCustomTo]     = useState(format(now, 'yyyy-MM-dd'));

  // Period bounds
  let periodStart: Date, periodEnd: Date, prevStart: Date, prevEnd: Date;
  if (period === 'custom') {
    periodStart = startOfDay(new Date(customFrom));
    periodEnd   = endOfDay(new Date(customTo));
    // Previous = same-length window immediately before
    const len = periodEnd.getTime() - periodStart.getTime();
    prevEnd   = new Date(periodStart.getTime() - 1);
    prevStart = new Date(prevEnd.getTime() - len);
  } else if (period === 'month') {
    periodStart = startOfMonth(now);
    periodEnd   = endOfMonth(now);
    prevStart   = startOfMonth(subMonths(now, 1));
    prevEnd     = endOfMonth(subMonths(now, 1));
  } else {
    periodStart = startOfDay(now);
    periodEnd   = endOfDay(now);
    prevStart   = startOfDay(subDays(now, 1));
    prevEnd     = endOfDay(subDays(now, 1));
  }

  // Filter by property
  const filteredBookings = selectedPropertyId
    ? bookings.filter(b => b.propertyId === selectedPropertyId)
    : bookings;

  const filteredRooms = selectedPropertyId
    ? rooms.filter(r => r.propertyId === selectedPropertyId)
    : rooms;

  const filteredProperties = selectedPropertyId
    ? properties.filter(p => p.id === selectedPropertyId)
    : properties;

  // Bookings in period (by checkIn, excludes cancelled/no_show)
  const active = (b: typeof bookings[0]) => b.status !== 'cancelled' && b.status !== 'no_show';
  const bookingsInPeriod     = filteredBookings.filter(b => active(b) && b.checkIn >= periodStart && b.checkIn <= periodEnd);
  const bookingsInPrevPeriod = filteredBookings.filter(b => active(b) && b.checkIn >= prevStart   && b.checkIn <= prevEnd);

  // Revenue & expense
  const totalRevenue = getRevenueByPeriod(bookings, periodStart, periodEnd, propertyId);
  const prevRevenue  = getRevenueByPeriod(bookings, prevStart,   prevEnd,   propertyId);
  const totalExpense = getExpenseByPeriod(useTimelineStore.getState().expenses, periodStart, periodEnd, propertyId);

  // Occupancy
  const totalRooms = filteredRooms.length;
  let occupancyRate = 0;
  let prevOccupancyRate = 0;
  if (totalRooms > 0) {
    if (period === 'today') {
      const checkedIn = filteredBookings.filter(b => b.status === 'checked_in').length;
      occupancyRate = Math.round((checkedIn / totalRooms) * 100);
      const prevActive = filteredBookings.filter(b => {
        const co = b.actualCheckOut || b.checkOut;
        return active(b) && b.checkIn <= prevEnd && co >= prevStart;
      }).length;
      prevOccupancyRate = Math.round((prevActive / totalRooms) * 100);
    } else {
      // Range-based (month or custom): room-nights / (rooms × days in range)
      const daysInRange = Math.max(1, Math.ceil((periodEnd.getTime() - periodStart.getTime()) / 86400000));
      // Count any active booking overlapping the range, not just checkIn-in-range
      const overlapping = filteredBookings.filter(b => {
        const co = b.actualCheckOut || b.checkOut;
        return active(b) && b.checkIn <= periodEnd && co >= periodStart;
      });
      const roomNights = overlapping.reduce((sum, b) => {
        const ci = b.checkIn < periodStart ? periodStart : b.checkIn;
        const co = (b.actualCheckOut || b.checkOut) > periodEnd ? periodEnd : (b.actualCheckOut || b.checkOut);
        return sum + Math.max(0, Math.ceil((co.getTime() - ci.getTime()) / 86400000));
      }, 0);
      occupancyRate = Math.min(100, Math.round((roomNights / (totalRooms * daysInRange)) * 100));

      const prevDays = Math.max(1, Math.ceil((prevEnd.getTime() - prevStart.getTime()) / 86400000));
      const prevOverlap = filteredBookings.filter(b => {
        const co = b.actualCheckOut || b.checkOut;
        return active(b) && b.checkIn <= prevEnd && co >= prevStart;
      });
      const prevNights = prevOverlap.reduce((sum, b) => {
        const ci = b.checkIn < prevStart ? prevStart : b.checkIn;
        const co = (b.actualCheckOut || b.checkOut) > prevEnd ? prevEnd : (b.actualCheckOut || b.checkOut);
        return sum + Math.max(0, Math.ceil((co.getTime() - ci.getTime()) / 86400000));
      }, 0);
      prevOccupancyRate = Math.min(100, Math.round((prevNights / (totalRooms * prevDays)) * 100));
    }
  }

  const activeBookings  = filteredBookings.filter(b => b.status === 'checked_in').length;
  const dirtyRoomsCount = filteredRooms.filter(r => r.status === 'dirty').length;
  const pendingTasks    = assignments.filter(t => t.status === 'pending').length;

  const bookingTrend   = calcTrend(bookingsInPeriod.length, bookingsInPrevPeriod.length, false);
  const occupancyTrend = calcTrend(occupancyRate, prevOccupancyRate);
  const revenueTrend   = calcTrend(totalRevenue, prevRevenue);
  const periodLabel    = period === 'month' ? 'tháng trước' : period === 'today' ? 'hôm qua' : 'kỳ trước';

  const kpis = [
    {
      id: 1, label: 'Cơ sở quản lý',
      value: filteredProperties.length.toString(),
      trend: '—', trendUp: true,
      icon: Home, color: 'text-primary', bg: 'bg-primary/10',
    },
    {
      id: 2, label: period === 'month' ? 'Booking tháng này' : period === 'today' ? 'Booking hôm nay' : 'Booking trong kỳ',
      value: bookingsInPeriod.length.toString(),
      trend: bookingTrend.label, trendUp: bookingTrend.up,
      icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-500/10',
    },
    {
      id: 3, label: 'Tỷ lệ lấp đầy',
      value: `${occupancyRate}%`,
      trend: occupancyTrend.label, trendUp: occupancyTrend.up,
      icon: Activity, color: 'text-green-500', bg: 'bg-green-500/10',
    },
    {
      id: 4, label: 'Doanh thu thực tế',
      value: `${(totalRevenue / 1000000).toFixed(2)}M`,
      trend: revenueTrend.label, trendUp: revenueTrend.up,
      icon: DollarSign, color: 'text-purple-500', bg: 'bg-purple-500/10',
    },
  ];

  const recentBookings = [...filteredBookings]
    .sort((a, b) => b.checkIn.getTime() - a.checkIn.getTime())
    .slice(0, 4);

  const trendData = getLastNMonthsStats(bookings, useTimelineStore.getState().expenses, 6, propertyId)
    .map(d => ({ name: d.name, value: Math.round(d.revenue / 1000000) }));

  return (
    <div className="flex-1 p-8 space-y-8 overflow-y-auto bg-background/50">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Tổng quan vận hành</h1>
          <p className="text-muted-foreground font-medium">
            {period === 'custom'
              ? `Từ ${format(periodStart, 'dd/MM/yyyy')} đến ${format(periodEnd, 'dd/MM/yyyy')}`
              : 'Báo cáo hiệu suất kinh doanh thời gian thực'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border shadow-sm">
            <button
              onClick={() => setPeriod('today')}
              className={cn('px-4 py-2 rounded-xl font-bold text-sm transition-colors',
                period === 'today' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Hôm nay
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={cn('px-4 py-2 rounded-xl font-bold text-sm transition-colors',
                period === 'month' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Tháng này
            </button>
            <button
              onClick={() => setPeriod('custom')}
              className={cn('px-4 py-2 rounded-xl font-bold text-sm transition-colors',
                period === 'custom' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Tùy chọn
            </button>
          </div>

          {/* Custom date range — only when 'custom' active */}
          {period === 'custom' && (
            <div className="flex items-center gap-2 bg-white border rounded-2xl px-3 py-2 shadow-sm">
              <Calendar size={15} className="text-muted-foreground" />
              <input
                type="date"
                value={customFrom}
                max={customTo}
                onChange={e => setCustomFrom(e.target.value)}
                className="text-xs font-bold outline-none bg-transparent"
              />
              <span className="text-muted-foreground text-xs">→</span>
              <input
                type="date"
                value={customTo}
                min={customFrom}
                onChange={e => setCustomTo(e.target.value)}
                className="text-xs font-bold outline-none bg-transparent"
              />
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      {showWidget('kpis') && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpis.map((kpi) => (
            <div key={kpi.id} className="bg-white p-6 rounded-[2rem] border shadow-sm hover:shadow-md transition-all group border-b-4 border-b-transparent hover:border-b-primary">
              <div className={`w-12 h-12 ${kpi.bg} ${kpi.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <kpi.icon size={24} />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">{kpi.label}</p>
              <h3 className="text-3xl font-black tracking-tight text-foreground">{kpi.value}</h3>
              <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${kpi.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                {kpi.trendUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {kpi.trend} so với {periodLabel}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Stats Row */}
      {(showWidget('revenue-trend') || showWidget('finance-summary')) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {showWidget('revenue-trend') && (
            <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] border shadow-sm flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black tracking-tight">Xu hướng doanh thu</h3>
                  <p className="text-sm text-muted-foreground font-medium">6 tháng gần nhất · Đơn vị: Triệu VNĐ</p>
                </div>
                <span className={cn(
                  'flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg',
                  revenueTrend.up ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
                )}>
                  <TrendingUp size={12} /> {revenueTrend.label}
                </span>
              </div>

              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E8843A" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#E8843A" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#888' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#888' }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                      itemStyle={{ color: '#E8843A' }}
                      formatter={(val) => [`${val ?? 0}M`, 'Doanh thu']}
                    />
                    <Area type="monotone" dataKey="value" stroke="#E8843A" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {showWidget('finance-summary') && (
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[2rem] border shadow-xl flex flex-col gap-8 text-white">
              <div>
                <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                  <Activity size={20} className="text-primary" />
                  Hiệu suất tài chính
                </h3>
                <p className="text-slate-400 text-sm font-medium mt-1">{period === 'month' ? 'Tháng này' : period === 'today' ? 'Hôm nay' : `${format(periodStart, 'dd/MM')} – ${format(periodEnd, 'dd/MM')}`}</p>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                    <span>Doanh thu</span>
                    <span className="text-white">{(totalRevenue / 1000000).toFixed(1)}M</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: '100%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                    <span>Chi phí (Tạm tính)</span>
                    <span className="text-rose-400">{(totalExpense / 1000000).toFixed(1)}M</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500" style={{ width: totalRevenue > 0 ? `${Math.min(100, (totalExpense / totalRevenue) * 100)}%` : '0%' }} />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-700">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Lợi nhuận dự kiến</p>
                  <h4 className="text-4xl font-black mt-2 text-primary">
                    {((totalRevenue - totalExpense) / 1000000).toFixed(1)}M
                  </h4>
                  <p className="text-xs text-green-400 font-bold mt-1">
                    Margin: ~{totalRevenue > 0 ? (((totalRevenue - totalExpense) / totalRevenue) * 100).toFixed(1) : 0}%
                  </p>
                </div>
              </div>

              <button className="mt-auto w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-bold transition-colors text-sm border border-white/10">
                Xem báo cáo chi tiết →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Operational Alerts & Recent Activity */}
      {(showWidget('alerts') || showWidget('recent-bookings')) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
          {showWidget('alerts') && (
            <div className="bg-white p-8 rounded-[2rem] border shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black tracking-tight">Cảnh báo vận hành</h3>
                <span className="text-[10px] font-black uppercase bg-red-100 text-red-600 px-3 py-1 rounded-full animate-pulse">Live</span>
              </div>

              <div className="space-y-4">
                <div onClick={() => router.push('/housekeeping')} className={cn("flex items-start gap-4 p-4 rounded-2xl border transition-all hover:translate-x-1 cursor-pointer", dirtyRoomsCount > 0 ? "bg-amber-50 border-amber-100" : "bg-green-50 border-green-100 opacity-50")}>
                  <span className="text-lg">{dirtyRoomsCount > 0 ? '🟡' : '✅'}</span>
                  <div>
                    <div className="text-sm font-black">{dirtyRoomsCount} phòng cần dọn dẹp</div>
                    <div className="text-xs text-muted-foreground font-medium mt-0.5">
                      {dirtyRoomsCount > 0 ? 'Cần bàn giao sạch sẽ trước giờ check-in' : 'Tất cả phòng đều sạch'}
                    </div>
                  </div>
                </div>

                <div onClick={() => router.push('/housekeeping')} className={cn("flex items-start gap-4 p-4 rounded-2xl border transition-all hover:translate-x-1 cursor-pointer", pendingTasks > 0 ? "bg-rose-50 border-rose-100" : "bg-green-50 border-green-100 opacity-50")}>
                  <span className="text-lg">{pendingTasks > 0 ? '🔴' : '✅'}</span>
                  <div>
                    <div className="text-sm font-black">{pendingTasks} công việc dọn phòng chưa xong</div>
                    <div className="text-xs text-muted-foreground font-medium mt-0.5">
                      {pendingTasks > 0 ? 'Nhân viên buồng phòng đang thực hiện...' : 'Đã hoàn thành mọi đầu việc'}
                    </div>
                  </div>
                </div>

                <div onClick={() => router.push('/bookings/table')} className="bg-blue-50 border-blue-100 flex items-start gap-4 p-4 rounded-2xl border transition-all hover:translate-x-1 cursor-pointer">
                  <span className="text-lg">🔵</span>
                  <div>
                    <div className="text-sm font-black">{activeBookings} khách đang lưu trú</div>
                    <div className="text-xs text-muted-foreground font-medium mt-0.5">Theo dõi dịch vụ và hỗ trợ khách hàng</div>
                  </div>
                </div>

                <div onClick={() => router.push('/finance/reports')} className="bg-slate-50 border-slate-100 flex items-start gap-4 p-4 rounded-2xl border transition-all hover:translate-x-1 cursor-pointer">
                  <span className="text-lg">📊</span>
                  <div>
                    <div className="text-sm font-black">Lấp đầy: {occupancyRate}%</div>
                    <div className="text-xs text-muted-foreground font-medium mt-0.5">
                      {period === 'today'
                        ? `${activeBookings}/${totalRooms} phòng đang có khách`
                        : `Tỷ lệ lấp đầy tháng ${now.getMonth() + 1}`}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showWidget('recent-bookings') && (
            <div className="bg-white p-8 rounded-[2rem] border shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black tracking-tight">Đặt phòng mới nhất</h3>
                <button onClick={() => router.push('/bookings/table')} className="text-xs font-bold text-primary hover:underline">Xem tất cả →</button>
              </div>

              <div className="space-y-4">
                {recentBookings.length > 0 ? recentBookings.map((item) => {
                  const roomName = rooms.find((r) => r.id === item.roomId)?.name ?? item.roomId;
                  return (
                    <div key={item.id} onClick={() => router.push(`/bookings/table?focus=${item.id}`)} className="flex items-center gap-4 p-2 rounded-2xl hover:bg-muted/30 transition-colors cursor-pointer">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center font-bold text-xs uppercase">
                        {item.guestName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-black">{item.guestName}</div>
                        <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">
                          Phòng {roomName} · {item.checkIn.toLocaleDateString('vi-VN')} – {item.checkOut.toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                      <div className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase",
                        item.status === 'confirmed' ? 'bg-green-100 text-green-600' :
                        item.status === 'checked_in' ? 'bg-blue-100 text-blue-600' :
                        item.status === 'checked_out' ? 'bg-slate-100 text-slate-600' :
                        'bg-amber-100 text-amber-600'
                      )}>
                        {item.status}
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-center py-8 text-muted-foreground italic">Chưa có dữ liệu đặt phòng</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
