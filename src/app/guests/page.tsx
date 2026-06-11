"use client";

import React, { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { useTimelineStore } from '@/store/useTimelineStore';
import {
  Users, Search, UserPlus,
  Phone, Mail, CreditCard, Globe,
  Calendar, History, Edit2, Trash2,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Guest, Booking } from '@/lib/types';
import { format } from 'date-fns';
import { statusLabel, statusColor } from '@/lib/labels';

/**
 * Liên kết khách ↔ booking: ưu tiên SĐT (khi cả hai có), fallback theo tên.
 * Tránh bug chuỗi rỗng '' === '' khớp mọi booking không có SĐT.
 */
function bookingsOfGuest(guest: Guest, bookings: Booking[]): Booking[] {
  return bookings.filter(b => {
    if (guest.phone && b.guestPhone) return b.guestPhone === guest.phone;
    return b.guestName.trim().toLowerCase() === guest.name.trim().toLowerCase();
  });
}

export default function GuestCRMPage() {
  const { guests, bookings, rooms, addGuest, updateGuest, deleteGuest } = useTimelineStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    idCard: '',
    nationality: 'Việt Nam',
    notes: ''
  });

  const filteredGuests = guests.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.phone.includes(searchQuery) ||
    g.idCard?.includes(searchQuery)
  );

  const selectedGuest = guests.find(g => g.id === selectedGuestId);
  const guestBookings = selectedGuest ? bookingsOfGuest(selectedGuest, bookings) : [];
  const guestTotalSpent = guestBookings
    .filter(b => b.status !== 'cancelled' && b.status !== 'no_show')
    .reduce((sum, b) => sum + b.amountPaid, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateGuest(editingId, formData);
      setEditingId(null);
    } else {
      addGuest(formData);
      setIsAdding(false);
    }
    setFormData({ name: '', phone: '', email: '', idCard: '', nationality: 'Việt Nam', notes: '' });
  };

  const handleEdit = (guest: Guest) => {
    setEditingId(guest.id);
    setFormData({
      name: guest.name,
      phone: guest.phone,
      email: guest.email || '',
      idCard: guest.idCard || '',
      nationality: guest.nationality || 'Việt Nam',
      notes: guest.notes || ''
    });
    setIsAdding(true);
  };

  return (
    <Shell title="Quản lý Khách hàng (CRM)">
      <div className="h-full flex flex-col">
        {/* Header Section */}
        <div className="p-8 border-b bg-white/50 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
              <Users className="text-primary" size={32} />
              Cơ sở dữ liệu Khách hàng
            </h1>
            <p className="text-muted-foreground font-medium mt-1">Quản lý hồ sơ và lịch sử lưu trú của khách hàng</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
              <input 
                type="text"
                placeholder="Tìm tên, SĐT, CCCD..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-80 pl-12 pr-4 py-3 rounded-2xl border bg-white focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium shadow-sm"
              />
            </div>
            <button 
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all"
            >
              <UserPlus size={20} />
              Thêm khách hàng
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Guest List Area */}
          <div className={cn(
            "flex-1 overflow-y-auto p-8 space-y-6 transition-all duration-500",
            selectedGuestId ? "max-w-[60%]" : "max-w-full"
          )}>
            {isAdding && (
              <div className="bg-white p-8 rounded-[2.5rem] border shadow-xl animate-in zoom-in-95 duration-300">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black">{editingId ? 'Cập nhật hồ sơ' : 'Hồ sơ khách hàng mới'}</h2>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-muted-foreground ml-1">Họ và tên</label>
                      <input 
                        required
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-5 py-3.5 rounded-2xl border bg-muted/20 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
                        placeholder="VD: Nguyễn Văn A"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-muted-foreground ml-1">Số điện thoại</label>
                      <input 
                        required
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-5 py-3.5 rounded-2xl border bg-muted/20 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
                        placeholder="09xxx..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-muted-foreground ml-1">Email (nếu có)</label>
                      <input 
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-5 py-3.5 rounded-2xl border bg-muted/20 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
                        placeholder="example@gmail.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-muted-foreground ml-1">Số CMND/CCCD/Hộ chiếu</label>
                      <input 
                        value={formData.idCard}
                        onChange={e => setFormData({ ...formData, idCard: e.target.value })}
                        className="w-full px-5 py-3.5 rounded-2xl border bg-muted/20 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
                        placeholder="Số định danh"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3">
                    <button 
                      type="button"
                      onClick={() => {
                        setIsAdding(false);
                        setEditingId(null);
                        setFormData({ name: '', phone: '', email: '', idCard: '', nationality: 'Việt Nam', notes: '' });
                      }}
                      className="px-8 py-3 rounded-2xl font-bold text-sm hover:bg-muted transition-colors"
                    >
                      Hủy bỏ
                    </button>
                    <button 
                      type="submit"
                      className="px-8 py-3 bg-foreground text-background rounded-2xl font-bold text-sm shadow-lg"
                    >
                      {editingId ? 'Cập nhật' : 'Tạo hồ sơ'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredGuests.map(guest => {
                const gbs = bookingsOfGuest(guest, bookings);
                const spent = gbs
                  .filter(b => b.status !== 'cancelled' && b.status !== 'no_show')
                  .reduce((sum, b) => sum + b.amountPaid, 0);
                return (
                <div
                  key={guest.id}
                  onClick={() => setSelectedGuestId(guest.id === selectedGuestId ? null : guest.id)}
                  className={cn(
                    "p-6 rounded-[2rem] border transition-all cursor-pointer group relative overflow-hidden",
                    selectedGuestId === guest.id 
                      ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-[1.02]" 
                      : "bg-white hover:border-primary/50 shadow-sm"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl",
                        selectedGuestId === guest.id ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                      )}>
                        {guest.name.charAt(0)}
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-black text-xl tracking-tight leading-none">{guest.name}</h3>
                        <div className="flex items-center gap-2 text-sm opacity-80 font-bold">
                          <Phone size={14} />
                          {guest.phone}
                        </div>
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight size={24} />
                    </div>
                  </div>
                  
                  <div className="mt-6 flex items-center gap-4 text-xs font-bold opacity-70">
                    <div className="flex items-center gap-1">
                      <Globe size={12} />
                      {guest.nationality}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      Gia nhập: {format(guest.createdAt, 'dd/MM/yyyy')}
                    </div>
                  </div>

                  <div className={cn(
                    "mt-3 pt-3 flex items-center justify-between text-xs font-black border-t",
                    selectedGuestId === guest.id ? "border-white/20" : "border-border"
                  )}>
                    <span className="flex items-center gap-1.5">
                      <History size={12} />
                      {gbs.length} lượt đặt
                    </span>
                    <span className={selectedGuestId === guest.id ? "text-white" : "text-primary"}>
                      {spent.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                </div>
                );
              })}
            </div>
          </div>

          {/* Details Sidebar Area */}
          {selectedGuestId && (
            <div className="w-[40%] border-l bg-white overflow-y-auto animate-in slide-in-from-right duration-500 shadow-2xl z-20">
              {selectedGuest && (
                <div className="p-8 space-y-8">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black">Chi tiết Khách hàng</h2>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEdit(selectedGuest)}
                        className="p-3 bg-muted rounded-2xl hover:bg-muted/80 transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm('Xóa hồ sơ khách hàng này?')) {
                            deleteGuest(selectedGuest.id);
                            setSelectedGuestId(null);
                          }
                        }}
                        className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Profile Card */}
                  <div className="bg-muted/30 p-8 rounded-[2.5rem] space-y-6 border border-white/50">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm border">
                          <CreditCard size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">CMND/CCCD/Hộ chiếu</p>
                          <p className="font-black text-lg">{selectedGuest.idCard || 'Chưa cập nhật'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm border">
                          <Mail size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Email</p>
                          <p className="font-black text-lg truncate max-w-[200px]">{selectedGuest.email || 'Chưa cập nhật'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Booking History */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-black flex items-center gap-2">
                        <History size={20} className="text-primary" />
                        Lịch sử lưu trú
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-black">
                          {guestBookings.length} lượt đặt
                        </span>
                        <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-black">
                          {guestTotalSpent.toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {guestBookings.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground font-medium bg-muted/10 rounded-3xl border border-dashed">
                          Chưa có lịch sử đặt phòng.
                        </p>
                      ) : (
                        guestBookings.map(booking => (
                          <div key={booking.id} className="p-4 rounded-3xl border hover:border-primary transition-colors flex items-center justify-between">
                            <div>
                              <p className="font-black text-sm">{format(booking.checkIn, 'dd/MM/yyyy')} - {format(booking.checkOut, 'dd/MM/yyyy')}</p>
                              <p className="text-xs text-muted-foreground font-medium">
                                Phòng: {rooms.find(r => r.id === booking.roomId)?.name ?? booking.roomId}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-black text-primary text-sm">{booking.totalPrice.toLocaleString('vi-VN')}đ</p>
                              <span className={cn(
                                "inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase border",
                                statusColor(booking.status)
                              )}>
                                {statusLabel(booking.status)}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
