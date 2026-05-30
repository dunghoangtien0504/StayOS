"use client";

import React, { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { ProfitLossChart } from '@/components/finance/ProfitLossChart';
import { useTimelineStore } from '@/store/useTimelineStore';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  ArrowUpRight,
  CalendarRange,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';

export default function ReportsPage() {
  const { bookings, expenses, selectedPropertyId } = useTimelineStore();

  const now = new Date();
  const [fromDate, setFromDate] = useState(format(startOfMonth(now), 'yyyy-MM-dd'));
  const [toDate,   setToDate]   = useState(format(endOfMonth(now),   'yyyy-MM-dd'));

  const from = startOfDay(new Date(fromDate));
  const to   = endOfDay(new Date(toDate));

  const filteredBookings = (selectedPropertyId
    ? bookings.filter(b => b.propertyId === selectedPropertyId)
    : bookings
  ).filter(b => {
    const checkout = b.actualCheckOut || b.checkOut;
    return checkout >= from && checkout <= to;
  });

  const filteredExpenses = (selectedPropertyId
    ? expenses.filter(e => !e.propertyId || e.propertyId === selectedPropertyId)
    : expenses
  ).filter(e => e.date >= from && e.date <= to);

  const totalRevenue = filteredBookings
    .filter(b => b.status === 'checked_out' || b.status === 'checked_in' || b.status === 'deposited')
    .reduce((sum, b) => sum + b.amountPaid, 0);

  const totalExpense = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenue - totalExpense;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  const setPreset = (preset: 'month' | 'quarter' | 'year') => {
    if (preset === 'month') {
      setFromDate(format(startOfMonth(now), 'yyyy-MM-dd'));
      setToDate(format(endOfMonth(now), 'yyyy-MM-dd'));
    } else if (preset === 'quarter') {
      const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      const qEnd   = new Date(qStart.getFullYear(), qStart.getMonth() + 3, 0);
      setFromDate(format(qStart, 'yyyy-MM-dd'));
      setToDate(format(qEnd, 'yyyy-MM-dd'));
    } else {
      setFromDate(`${now.getFullYear()}-01-01`);
      setToDate(`${now.getFullYear()}-12-31`);
    }
  };

  return (
    <Shell title="Báo cáo Lợi nhuận">
      <main className="flex-1 p-8 flex flex-col gap-8 overflow-y-auto">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">Báo cáo P&L (Lợi nhuận)</h1>
            <p className="text-muted-foreground font-medium">Phân tích hiệu quả kinh doanh và cấu trúc tài chính.</p>
          </div>

          {/* Date range picker */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-white border rounded-xl p-1 shadow-sm">
              {(['month', 'quarter', 'year'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPreset(p)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/50"
                >
                  {p === 'month' ? 'Tháng này' : p === 'quarter' ? 'Quý này' : 'Năm nay'}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 bg-white border rounded-xl px-3 py-2 shadow-sm">
              <CalendarRange size={15} className="text-muted-foreground" />
              <input
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="text-xs font-bold outline-none bg-transparent"
              />
              <span className="text-muted-foreground text-xs">—</span>
              <input
                type="date"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="text-xs font-bold outline-none bg-transparent"
              />
            </div>
          </div>
        </div>

        {/* Financial Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-[2rem] border-2 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                <DollarSign size={20} />
              </div>
              <div className="flex items-center gap-1 text-blue-500 font-bold text-xs bg-blue-50 px-2 py-1 rounded-lg">
                <ArrowUpRight size={14} /> {filteredBookings.length} booking
              </div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tổng doanh thu</p>
            <p className="text-2xl font-black">{totalRevenue.toLocaleString()}đ</p>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border-2 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center">
                <TrendingDown size={20} />
              </div>
              <div className="flex items-center gap-1 text-rose-500 font-bold text-xs bg-rose-50 px-2 py-1 rounded-lg">
                <ArrowUpRight size={14} /> {filteredExpenses.length} khoản
              </div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tổng chi phí</p>
            <p className="text-2xl font-black">{totalExpense.toLocaleString()}đ</p>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border-2 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${netProfit >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {netProfit >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
              </div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Lợi nhuận ròng</p>
            <p className={`text-2xl font-black ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{netProfit.toLocaleString()}đ</p>
          </div>

          <div className="bg-primary p-6 rounded-[2rem] shadow-lg shadow-primary/20 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-white/20 text-white rounded-xl flex items-center justify-center">
                <BarChart3 size={20} />
              </div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/70">Tỷ suất lợi nhuận</p>
            <p className="text-2xl font-black">{profitMargin.toFixed(1)}%</p>
          </div>
        </div>

        {/* Recent Payments Section */}
        <div className="space-y-4">
           <div className="flex items-center gap-3 px-2">
             <DollarSign size={18} className="text-primary" />
             <h3 className="font-black text-sm uppercase tracking-widest text-slate-500">Lịch sử thu tiền gần đây</h3>
           </div>
           
           <div className="bg-white rounded-[2rem] border-2 overflow-hidden">
             <table className="w-full text-left">
               <thead>
                 <tr className="bg-muted/30 border-b">
                   <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ngày</th>
                   <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Khách hàng</th>
                   <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Phương thức</th>
                   <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Số tiền</th>
                 </tr>
               </thead>
               <tbody className="divide-y">
                 {filteredBookings.flatMap(b => (b.payments || []).map(p => ({ ...p, guestName: b.guestName })))
                   .sort((a, b) => b.date.getTime() - a.date.getTime())
                   .slice(0, 5)
                   .map((payment) => (
                     <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                       <td className="px-6 py-4 text-xs font-bold">{format(payment.date, 'HH:mm - dd/MM')}</td>
                       <td className="px-6 py-4 text-xs font-black">{payment.guestName}</td>
                       <td className="px-6 py-4">
                         <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-black uppercase text-slate-600">
                           {payment.method}
                         </span>
                       </td>
                       <td className="px-6 py-4 text-xs font-black text-right text-green-600">
                         +{payment.amount.toLocaleString()}đ
                       </td>
                     </tr>
                   ))}
                 {filteredBookings.every(b => !b.payments || b.payments.length === 0) && (
                   <tr>
                     <td colSpan={4} className="px-6 py-8 text-center text-xs font-medium text-muted-foreground">
                       Chưa có dữ liệu thanh toán.
                     </td>
                   </tr>
                 )}
               </tbody>
             </table>
           </div>
        </div>

        {/* Charts Section */}
        <div className="space-y-4">
           <div className="flex items-center gap-3 px-2">
             <BarChart3 size={18} className="text-primary" />
             <h3 className="font-black text-sm uppercase tracking-widest text-slate-500">Phân tích xu hướng & Cơ cấu</h3>
           </div>
           <ProfitLossChart />
        </div>
      </main>
    </Shell>
  );
}
