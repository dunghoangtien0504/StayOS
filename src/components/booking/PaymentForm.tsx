"use client";

import React, { useState } from 'react';
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
import { DollarSign, Banknote, FileText } from 'lucide-react';

interface PaymentFormProps {
  onAddPayment: (amount: number, method: 'cash' | 'transfer' | 'card', note?: string) => void;
  remainingAmount: number;
}

export const PaymentForm = ({ onAddPayment, remainingAmount }: PaymentFormProps) => {
  const [amount, setAmount] = useState<number>(remainingAmount);
  const [method, setMethod] = useState<'cash' | 'transfer' | 'card'>('transfer');
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount > 0) {
      onAddPayment(amount, method, note);
      setNote('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-muted/30 rounded-2xl border border-dashed border-muted-foreground/20">
      <div className="flex items-center gap-2 mb-2">
        <DollarSign size={16} className="text-primary" />
        <h4 className="text-xs font-black uppercase tracking-widest text-foreground">Ghi nhận thanh toán mới</h4>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase text-muted-foreground">Số tiền (VNĐ)</Label>
          <Input 
            type="number" 
            value={amount} 
            onChange={(e) => setAmount(Number(e.target.value))}
            className="rounded-xl border-2 font-bold"
            placeholder="0"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase text-muted-foreground">Phương thức</Label>
          <Select value={method} onValueChange={(val) => setMethod(val as 'cash' | 'transfer' | 'card')}>
            <SelectTrigger className="rounded-xl border-2 font-bold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="transfer">Chuyển khoản</SelectItem>
              <SelectItem value="cash">Tiền mặt</SelectItem>
              <SelectItem value="card">Thẻ (POS)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-[10px] font-bold uppercase text-muted-foreground">Ghi chú</Label>
        <div className="relative group">
          <FileText size={14} className="absolute left-3 top-3 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            value={note} 
            onChange={(e) => setNote(e.target.value)}
            className="rounded-xl border-2 pl-9 text-sm"
            placeholder="Nhập ghi chú thanh toán..."
          />
        </div>
      </div>

      <Button type="submit" className="w-full rounded-xl bg-primary text-white font-bold h-11 gap-2 shadow-lg shadow-primary/20 hover:scale-[1.01] transition-all">
        <Banknote size={18} /> Xác nhận thanh toán
      </Button>
    </form>
  );
};
