"use client";

import React from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area
} from 'recharts';
import { useTimelineStore } from '@/store/useTimelineStore';
import { getLastNMonthsStats } from '@/lib/finance';

export const ProfitLossChart = () => {
  const { bookings, expenses, selectedPropertyId } = useTimelineStore();

  // Filter data by property
  const filteredExpenses = selectedPropertyId 
    ? expenses.filter(e => !e.propertyId || e.propertyId === selectedPropertyId)
    : expenses;

  // Prepare Trend Data (Last 6 months)
  const trendData = getLastNMonthsStats(bookings, expenses, 6, selectedPropertyId || undefined);

  // Prepare Category Data
  const categories: Record<string, { name: string; value: number; color: string }> = {
    electricity: { name: 'Điện', value: 0, color: '#f59e0b' },
    water: { name: 'Nước', value: 0, color: '#3b82f6' },
    laundry: { name: 'Giặt là', value: 0, color: '#6366f1' },
    salary: { name: 'Lương', value: 0, color: '#22c55e' },
    commission: { name: 'Hoa hồng', value: 0, color: '#f43f5e' },
    maintenance: { name: 'Sửa chữa', value: 0, color: '#f97316' },
    other: { name: 'Khác', value: 0, color: '#64748b' },
  };

  filteredExpenses.forEach(e => {
    if (categories[e.category]) {
      categories[e.category].value += e.amount;
    }
  });

  const pieData = Object.values(categories).filter(c => c.value > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Revenue vs Expense Trend */}
      <div className="lg:col-span-2 bg-white rounded-[2rem] border-2 shadow-sm p-8 h-[400px] flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="font-black text-sm uppercase tracking-widest">Biểu đồ Doanh thu & Chi phí</h3>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Dữ liệu 6 tháng gần nhất</p>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-[10px] font-black uppercase">Doanh thu</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="text-[10px] font-black uppercase">Chi phí</span>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendData}>
            <defs>
              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }}
              tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
            />
            <RechartsTooltip
              contentStyle={{ borderRadius: '16px', border: '2px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
              formatter={(value) => [Number(value).toLocaleString() + ' đ']}
            />
            <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
            <Area type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={4} fill="transparent" strokeDasharray="8 8" />
          </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Expense Breakdown */}
      <div className="bg-white rounded-[2rem] border-2 shadow-sm p-8 h-[400px] flex flex-col">
        <div className="mb-6">
          <h3 className="font-black text-sm uppercase tracking-widest">Cấu trúc chi phí</h3>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Phân loại theo hạng mục</p>
        </div>

        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <RechartsTooltip
              contentStyle={{ borderRadius: '16px', border: '2px solid #f1f5f9', fontWeight: 'bold' }}
              formatter={(value) => [Number(value).toLocaleString() + ' đ']}
            />
          </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-y-2">
          {pieData.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground truncate">{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

