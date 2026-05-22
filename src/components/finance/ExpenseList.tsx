"use client";

import React from 'react';
import { useTimelineStore } from '@/store/useTimelineStore';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { 
  Zap, 
  Droplets, 
  Shirt, 
  Users, 
  Percent, 
  Wrench, 
  HelpCircle,
  Trash2,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export const ExpenseList = () => {
  const { expenses, properties, deleteExpense, selectedPropertyId } = useTimelineStore();

  const filteredExpenses = selectedPropertyId 
    ? expenses.filter(e => !e.propertyId || e.propertyId === selectedPropertyId)
    : expenses;

  const getCategoryInfo = (cat: string) => {
    switch (cat) {
      case 'electricity': return { label: 'Tiền điện', icon: Zap, color: 'bg-amber-100 text-amber-600 border-amber-200' };
      case 'water': return { label: 'Tiền nước', icon: Droplets, color: 'bg-blue-100 text-blue-600 border-blue-200' };
      case 'laundry': return { label: 'Giặt là', icon: Shirt, color: 'bg-indigo-100 text-indigo-600 border-indigo-200' };
      case 'salary': return { label: 'Lương', icon: Users, color: 'bg-green-100 text-green-600 border-green-200' };
      case 'commission': return { label: 'Hoa hồng', icon: Percent, color: 'bg-rose-100 text-rose-600 border-rose-200' };
      case 'maintenance': return { label: 'Sửa chữa', icon: Wrench, color: 'bg-orange-100 text-orange-600 border-orange-200' };
      default: return { label: 'Khác', icon: HelpCircle, color: 'bg-slate-100 text-slate-600 border-slate-200' };
    }
  };

  const getPropertyName = (id?: string) => {
    if (!id) return 'Chi phí chung';
    return properties.find(p => p.id === id)?.name || 'N/A';
  };

  return (
    <div className="bg-white rounded-[2rem] border-2 shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow className="hover:bg-transparent border-b-2">
            <TableHead className="w-[150px] font-black text-[10px] uppercase tracking-widest text-muted-foreground py-6 pl-8">Ngày chi</TableHead>
            <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground py-6">Hạng mục & Nội dung</TableHead>
            <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground py-6">Cơ sở</TableHead>
            <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground py-6 text-right">Số tiền</TableHead>
            <TableHead className="w-[60px] py-6 pr-8"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredExpenses.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-48 text-center">
                <div className="flex flex-col items-center gap-2 opacity-30">
                  <Calendar size={40} />
                  <p className="font-bold text-sm uppercase tracking-widest">Không có dữ liệu chi phí</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            filteredExpenses.sort((a, b) => b.date.getTime() - a.date.getTime()).map((expense) => {
              const cat = getCategoryInfo(expense.category);
              return (
                <TableRow key={expense.id} className="group hover:bg-slate-50/50 transition-colors border-b last:border-0">
                  <TableCell className="py-5 pl-8">
                    <div className="text-sm font-bold text-slate-600">
                      {format(expense.date, 'dd/MM/yyyy')}
                    </div>
                  </TableCell>
                  <TableCell className="py-5">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center border shadow-sm", cat.color)}>
                        <cat.icon size={16} />
                      </div>
                      <div>
                        <div className="font-black text-sm text-foreground">{cat.label}</div>
                        <div className="text-xs text-muted-foreground font-medium line-clamp-1">{expense.note}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-5">
                    <Badge variant="outline" className="rounded-lg font-black text-[10px] uppercase tracking-tight bg-slate-50 border-slate-200">
                      {getPropertyName(expense.propertyId)}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-5 text-right">
                    <div className="font-black text-sm text-rose-600">
                      -{expense.amount.toLocaleString('vi-VN')}đ
                    </div>
                  </TableCell>
                  <TableCell className="py-5 pr-8 text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => deleteExpense(expense.id)}
                      className="w-8 h-8 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};
