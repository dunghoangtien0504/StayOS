"use client";

import React, { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { ExpenseList } from '@/components/finance/ExpenseList';
import { ExpenseForm } from '@/components/finance/ExpenseForm';
import { Button } from '@/components/ui/button';
import { Plus, DollarSign, Wallet, TrendingDown } from 'lucide-react';
import { useTimelineStore } from '@/store/useTimelineStore';

export default function ExpensesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { expenses, selectedPropertyId } = useTimelineStore();

  const filteredExpenses = selectedPropertyId 
    ? expenses.filter(e => !e.propertyId || e.propertyId === selectedPropertyId)
    : expenses;

  const totalExpense = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <Shell title="Quản lý Chi phí">
      <main className="flex-1 p-8 flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">Chi phí vận hành</h1>
            <p className="text-muted-foreground font-medium">Theo dõi và quản lý các khoản chi phí của cơ sở.</p>
          </div>
          
          <Button 
            onClick={() => setIsFormOpen(true)}
            className="rounded-[1.25rem] bg-rose-600 hover:bg-rose-700 text-white font-black px-8 h-14 shadow-lg shadow-rose-100 gap-3"
          >
            <Plus size={20} /> Ghi nhận chi phí mới
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-[2rem] border-2 shadow-sm flex items-center gap-6">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-[1.5rem] flex items-center justify-center">
              <TrendingDown size={32} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Tổng chi tháng này</p>
              <p className="text-3xl font-black">{totalExpense.toLocaleString()}đ</p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] border-2 shadow-sm flex items-center gap-6">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-[1.5rem] flex items-center justify-center">
              <Wallet size={32} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Số giao dịch</p>
              <p className="text-3xl font-black">{filteredExpenses.length}</p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] border-2 shadow-sm flex items-center gap-6 opacity-50 grayscale cursor-not-allowed">
            <div className="w-16 h-16 bg-slate-100 text-slate-600 rounded-[1.5rem] flex items-center justify-center">
              <DollarSign size={32} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Dự chi tháng tới</p>
              <p className="text-3xl font-black">---</p>
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="font-black text-sm uppercase tracking-widest text-slate-500">Lịch sử chi phí gần đây</h3>
          </div>
          <ExpenseList />
        </div>
      </main>

      <ExpenseForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
    </Shell>
  );
}
