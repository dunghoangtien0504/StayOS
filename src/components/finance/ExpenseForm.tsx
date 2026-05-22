"use client";

import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  DollarSign,
  Calendar as CalendarIcon,
  FileText,
  Zap,
  Droplets,
  Shirt,
  Users,
  Percent,
  Wrench,
  HelpCircle
} from 'lucide-react';
import { useTimelineStore } from '@/store/useTimelineStore';
import { ExpenseCategory } from '@/lib/types';

interface ExpenseFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES: { value: ExpenseCategory; label: string; icon: React.ComponentType<{ size?: number; className?: string }>; color: string }[] = [
  { value: 'electricity', label: 'Tiền điện', icon: Zap, color: 'text-amber-500' },
  { value: 'water', label: 'Tiền nước', icon: Droplets, color: 'text-blue-500' },
  { value: 'laundry', label: 'Giặt là', icon: Shirt, color: 'text-indigo-500' },
  { value: 'salary', label: 'Lương nhân viên', icon: Users, color: 'text-green-500' },
  { value: 'commission', label: 'Hoa hồng', icon: Percent, color: 'text-rose-500' },
  { value: 'maintenance', label: 'Sửa chữa', icon: Wrench, color: 'text-orange-500' },
  { value: 'other', label: 'Khác', icon: HelpCircle, color: 'text-slate-500' },
];

export const ExpenseForm = ({ isOpen, onClose }: ExpenseFormProps) => {
  const { properties, addExpense, settings } = useTimelineStore();
  const customCategories = settings?.customExpenseCategories ?? [];

  const [amount, setAmount] = useState<number>(0);
  const [category, setCategory] = useState<ExpenseCategory | string>('other');
  const [propertyId, setPropertyId] = useState<string>('all');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    addExpense({
      amount,
      category,
      propertyId: propertyId === 'all' ? undefined : propertyId,
      note,
      date: new Date(date),
    });
    
    onClose();
    setAmount(0);
    setNote('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-white rounded-[2rem] border-2 shadow-2xl p-0 overflow-hidden">
        <div className="bg-rose-500 h-2 w-full" />
        
        <form onSubmit={handleSubmit} className="p-8">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center">
                <DollarSign size={20} />
              </div>
              <DialogTitle className="text-2xl font-black tracking-tight">Ghi nhận chi phí</DialogTitle>
            </div>
          </DialogHeader>

          <div className="space-y-6 mt-8">
            {/* Amount */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Số tiền chi (VNĐ)</Label>
              <div className="relative group">
                <DollarSign size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-rose-500 transition-colors" />
                <Input 
                  type="number" 
                  value={amount} 
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="pl-12 h-14 rounded-2xl border-2 font-black text-xl text-rose-600"
                  placeholder="0"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Category */}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Hạng mục</Label>
                <Select value={category} onValueChange={(val) => { if (val) setCategory(val); }}>
                  <SelectTrigger className="rounded-xl border-2 h-11 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <div className="flex items-center gap-2">
                          <cat.icon size={14} className={cat.color} />
                          {cat.label}
                        </div>
                      </SelectItem>
                    ))}
                    {customCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        <div className="flex items-center gap-2">
                          <HelpCircle size={14} className="text-slate-500" />
                          {cat}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Property */}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cơ sở áp dụng</Label>
                <Select value={propertyId} onValueChange={(val) => setPropertyId(val ?? 'all')}>
                  <SelectTrigger className="rounded-xl border-2 h-11 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Chi phí chung</SelectItem>
                    {properties.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Date */}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ngày chi</Label>
                <div className="relative group">
                  <CalendarIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input 
                    type="date" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)}
                    className="pl-10 rounded-xl border-2 h-11 font-bold"
                    required
                  />
                </div>
              </div>

              {/* Note */}
              <div className="space-y-2 col-span-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ghi chú / Nội dung</Label>
                <div className="relative group">
                  <FileText size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input 
                    value={note} 
                    onChange={(e) => setNote(e.target.value)}
                    className="pl-10 rounded-xl border-2 h-11 font-medium"
                    placeholder="VD: Tiền điện tháng 4 cơ sở Mỹ Đình..."
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-10 gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl font-bold px-6 h-12 border-2">Hủy</Button>
            <Button type="submit" className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black px-8 h-12 shadow-lg shadow-rose-100 flex-1">
              Xác nhận chi
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
