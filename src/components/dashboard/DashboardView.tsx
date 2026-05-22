"use client";

import React from 'react';
import {
  Home,
  BookOpen,
  Activity,
  DollarSign,
  TrendingUp,
  TrendingDown
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
import { startOfMonth, endOfMonth } from 'date-fns';
import { getRevenueByPeriod, getExpenseByPeriod, getLastNMonthsStats } from '@/lib/finance';

export const DashboardView = () => {
  const { bookings, properties, rooms, assignments, selectedPropertyId, settings } = useTimelineStore();
  const hiddenWidgets = settings?.hiddenWidgets ?? [];
  const showWidget = (slug: string) => !hiddenWidgets.includes(slug);

  // Filter data by property
  const filteredBookings = selectedPropertyId 
    ? bookings.filter(b => b.propertyId === selectedPropertyId)
    : bookings;
  
  const filteredProperties = selectedPropertyId 
    ? properties.filter(p => p.id === selectedPropertyId)
    : properties;

  const filteredRooms = selectedPropertyId
    ? rooms.filter(r => r.propertyId === selectedPropertyId)
    : rooms;

  // Calculate KPIs
  const currentMonthStart = startOfMonth(new Date());
  const currentMonthEnd = endOfMonth(new Date());

  const totalRevenue = getRevenueByPeriod(bookings, currentMonthStart, currentMonthEnd, selectedPropertyId || undefined);
  const totalExpense = getExpenseByPeriod(useTimelineStore.getState().expenses, currentMonthStart, currentMonthEnd, selectedPropertyId || undefined);

  const activeBookings = filteredBookings.filter(b => b.status === 'checked_in').length;
  
  // Simple Occupancy Calculation (Booked rooms / Total rooms for current month)
  const totalRooms = filteredRooms.length;
  const occupancyRate = totalRooms > 0 ? Math.min(100, Math.round((filteredBookings.length / (totalRooms * 30)) * 100)) : 0;

  const kpis = [
    { id: 1, label: 'Cơ sở quản lý', value: filteredProperties.length.toString(), trend: '+0', trendUp: true, icon: Home, color: 'text-primary', bg: 'bg-primary/10' },
    { id: 2, label: 'Booking tháng này', value: filteredBookings.length.toString(), trend: '+5', trendUp: true, icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 3, label: 'Tỷ lệ lấp đầy', value: `${occupancyRate}%`, trend: '+2%', trendUp: true, icon: Activity, color: 'text-green-500', bg: 'bg-green-500/10' },
    { id: 4, label: 'Doanh thu thực tế', value: `${(totalRevenue / 1000000).toFixed(2)}M`, trend: '+8%', trendUp: true, icon: DollarSign, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  // Prepare Recent Bookings
  const recentBookings = [...filteredBookings]
    .sort((a, b) => b.checkIn.getTime() - a.checkIn.getTime())
    .slice(0, 4);

  // Prepare Operational Alerts
  const dirtyRoomsCount = filteredRooms.filter(r => r.status === 'dirty').length;
  
  const pendingTasks = assignments.filter(t => t.status === 'pending').length;

  // Calculate Monthly Revenue Trend (Last 6 months)
  const trendData = getLastNMonthsStats(bookings, useTimelineStore.getState().expenses, 6, selectedPropertyId || undefined)
    .map(d => ({ name: d.name, value: Math.round(d.revenue / 1000000) }));

  return (
    <div className="flex-1 p-8 space-y-8 overflow-y-auto bg-background/50">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Tổng quan vận hành</h1>
          <p className="text-muted-foreground font-medium">Báo cáo hiệu suất kinh doanh thời gian thực</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border shadow-sm mr-4">
            <button className="px-4 py-2 bg-primary/10 text-primary rounded-xl font-bold text-sm">Hôm nay</button>
            <button className="px-4 py-2 text-muted-foreground hover:text-foreground rounded-xl font-bold text-sm transition-colors">Tháng này</button>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-black text-sm shadow-lg shadow-primary/20 hover:scale-105 transition-all">
            <BookOpen size={18} />
            Đặt phòng mới
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {showWidget('kpis') && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <div key={kpi.id} className="bg-white p-6 rounded-[2rem] border shadow-sm hover:shadow-md transition-all group border-b-4 border-b-transparent hover:border-b-primary">
            <div className={`w-12 h-12 ${kpi.bg} ${kpi.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <kpi.icon size={24} />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">{kpi.label}</p>
            <h3 className="text-3xl font-black tracking-tight text-foreground">{kpi.value}</h3>
            <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${kpi.trendUp ? 'text-green-600' : 'text-red-600'}`}>
              {kpi.trendUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {kpi.trend} so với tháng trước
            </div>
          </div>
        ))}
      </div>}

      {/* Main Stats Row */}
      {(showWidget('revenue-trend') || showWidget('finance-summary')) && <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Chart */}
        {showWidget('revenue-trend') && <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] border shadow-sm flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black tracking-tight">Xu hướng doanh thu</h3>
              <p className="text-sm text-muted-foreground font-medium">6 tháng gần nhất · Đơn vị: Triệu VNĐ</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                <TrendingUp size={12} /> +12%
              </span>
            </div>
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
        </div>}

        {/* Quick Finance Summary */}
        {showWidget('finance-summary') && <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[2rem] border shadow-xl flex flex-col gap-8 text-white">
          <div>
            <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
              <Activity size={20} className="text-primary" />
              Hiệu suất tài chính
            </h3>
            <p className="text-slate-400 text-sm font-medium mt-1">Ước tính tháng này</p>
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
              <p className="text-xs text-green-400 font-bold mt-1">Margin: ~{totalRevenue > 0 ? (((totalRevenue - totalExpense) / totalRevenue) * 100).toFixed(1) : 0}%</p>
            </div>
          </div>

          <button className="mt-auto w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-bold transition-colors text-sm border border-white/10">
            Xem báo cáo chi tiết →
          </button>
        </div>}
      </div>}

      {/* Operational Alerts & Recent Activity */}
      {(showWidget('alerts') || showWidget('recent-bookings')) && <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
        {showWidget('alerts') && <div className="bg-white p-8 rounded-[2rem] border shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black tracking-tight">Cảnh báo vận hành</h3>
            <span className="text-[10px] font-black uppercase bg-red-100 text-red-600 px-3 py-1 rounded-full animate-pulse">Live</span>
          </div>
          
          <div className="space-y-4">
            <div className={cn("flex items-start gap-4 p-4 rounded-2xl border transition-all hover:translate-x-1 cursor-pointer", dirtyRoomsCount > 0 ? "bg-amber-50 border-amber-100" : "bg-green-50 border-green-100 opacity-50")}>
              <span className="text-lg">{dirtyRoomsCount > 0 ? '🟡' : '✅'}</span>
              <div>
                <div className="text-sm font-black">{dirtyRoomsCount} phòng cần dọn dẹp</div>
                <div className="text-xs text-muted-foreground font-medium mt-0.5">
                  {dirtyRoomsCount > 0 ? 'Cần bàn giao sạch sẽ trước giờ check-in' : 'Tất cả phòng đều sạch'}
                </div>
              </div>
            </div>

            <div className={cn("flex items-start gap-4 p-4 rounded-2xl border transition-all hover:translate-x-1 cursor-pointer", pendingTasks > 0 ? "bg-rose-50 border-rose-100" : "bg-green-50 border-green-100 opacity-50")}>
              <span className="text-lg">{pendingTasks > 0 ? '🔴' : '✅'}</span>
              <div>
                <div className="text-sm font-black">{pendingTasks} công việc dọn phòng chưa xong</div>
                <div className="text-xs text-muted-foreground font-medium mt-0.5">
                  {pendingTasks > 0 ? 'Nhân viên buồng phòng đang thực hiện...' : 'Đã hoàn thành mọi đầu việc'}
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border-blue-100 flex items-start gap-4 p-4 rounded-2xl border transition-all hover:translate-x-1 cursor-pointer">
              <span className="text-lg">🔵</span>
              <div>
                <div className="text-sm font-black">{activeBookings} khách đang lưu trú</div>
                <div className="text-xs text-muted-foreground font-medium mt-0.5">Theo dõi dịch vụ và hỗ trợ khách hàng</div>
              </div>
            </div>

            <div className="bg-slate-50 border-slate-100 flex items-start gap-4 p-4 rounded-2xl border transition-all hover:translate-x-1 cursor-pointer">
              <span className="text-lg">⭐</span>
              <div>
                <div className="text-sm font-black">Điểm đánh giá: 4.8 / 5</div>
                <div className="text-xs text-muted-foreground font-medium mt-0.5">Dựa trên 328 đánh giá khách hàng</div>
              </div>
            </div>
          </div>
        </div>}

        {showWidget('recent-bookings') && <div className="bg-white p-8 rounded-[2rem] border shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black tracking-tight">Đặt phòng mới nhất</h3>
            <button className="text-xs font-bold text-primary hover:underline">Xem tất cả →</button>
          </div>
          
          <div className="space-y-4">
            {recentBookings.length > 0 ? recentBookings.map((item) => {
              const roomName = rooms.find((r) => r.id === item.roomId)?.name ?? item.roomId;
              return (
              <div key={item.id} className="flex items-center gap-4 p-2 rounded-2xl hover:bg-muted/30 transition-colors">
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
        </div>}
      </div>}
    </div>
  );
};
