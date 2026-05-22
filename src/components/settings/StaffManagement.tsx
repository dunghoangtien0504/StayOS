"use client";

import React, { useState } from 'react';
import { useTimelineStore } from '@/store/useTimelineStore';
import { Staff } from '@/lib/types';
import { Plus, Phone, Trash2, Edit2, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export const StaffManagement = () => {
  const { staff, addStaff, updateStaff, deleteStaff } = useTimelineStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    role: 'housekeeping' as Staff['role'],
    phone: '',
    active: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateStaff(editingId, formData);
      setEditingId(null);
    } else {
      addStaff(formData);
    }
    setIsAdding(false);
    setFormData({ name: '', role: 'housekeeping', phone: '', active: true });
  };

  const handleEdit = (s: Staff) => {
    setEditingId(s.id);
    setFormData({ 
      name: s.name, 
      role: s.role, 
      phone: s.phone,
      active: s.active 
    });
    setIsAdding(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Quản lý Nhân sự</h2>
          <p className="text-sm font-medium text-muted-foreground">Phân quyền và quản lý nhân viên vận hành.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-black text-sm shadow-lg shadow-primary/20 hover:scale-105 transition-all"
        >
          <Plus size={18} />
          Thêm nhân viên
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-8 rounded-[2rem] border-2 shadow-xl animate-in slide-in-from-top-4 duration-300">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Họ và tên</label>
              <input 
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-6 py-4 rounded-2xl border-2 bg-slate-50 focus:bg-white focus:border-primary outline-none transition-all font-bold"
                placeholder="VD: Nguyễn Văn A"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Số điện thoại</label>
              <input 
                required
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-6 py-4 rounded-2xl border-2 bg-slate-50 focus:bg-white focus:border-primary outline-none transition-all font-bold"
                placeholder="09xx.xxx.xxx"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Vai trò</label>
              <select 
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value as Staff['role'] })}
                className="w-full px-6 py-4 rounded-2xl border-2 bg-slate-50 focus:bg-white focus:border-primary outline-none transition-all font-bold"
              >
                <option value="housekeeping">Nhân viên Buồng phòng</option>
                <option value="reception">Lễ tân</option>
                <option value="manager">Quản lý</option>
              </select>
            </div>
            <div className="flex items-center gap-4 pt-8">
              <button 
                type="submit" 
                className="flex-1 bg-primary text-white py-4 rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                {editingId ? 'Cập nhật' : 'Lưu nhân viên'}
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setIsAdding(false);
                  setEditingId(null);
                  setFormData({ name: '', role: 'housekeeping', phone: '', active: true });
                }}
                className="px-8 py-4 rounded-2xl font-bold text-muted-foreground hover:bg-muted transition-colors"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map(s => (
          <div key={s.id} className={cn(
            "bg-white p-6 rounded-[2rem] border-2 shadow-sm relative group transition-all",
            !s.active && "opacity-60"
          )}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center font-black text-xl">
                {s.name.charAt(0)}
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => handleEdit(s)}
                  className="p-2 hover:bg-muted rounded-lg text-muted-foreground transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => deleteStaff(s.id)}
                  className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="font-black text-lg flex items-center gap-2">
                {s.name}
                {s.role === 'manager' && <ShieldCheck size={16} className="text-primary" />}
              </h3>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{s.role}</p>
            </div>

            <div className="mt-4 pt-4 border-t-2 border-dashed border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                <Phone size={14} />
                {s.phone}
              </div>
              <button 
                onClick={() => updateStaff(s.id, { active: !s.active })}
                className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                  s.active ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-400"
                )}
              >
                {s.active ? 'Active' : 'Inactive'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
