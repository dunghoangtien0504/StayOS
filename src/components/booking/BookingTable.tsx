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
import { cn } from '@/lib/utils';
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2,
  Phone,
  Calendar,
  CreditCard
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { BookingDetailsModal } from '@/components/booking/BookingDetailsModal';
import { Booking } from '@/lib/types';

export const BookingTable = () => {
  const { bookings, rooms, selectedPropertyId } = useTimelineStore();
  const [activeBooking, setActiveBooking] = React.useState<Booking | null>(null);

  const filteredBookings = selectedPropertyId 
    ? bookings.filter(b => b.propertyId === selectedPropertyId)
    : bookings;

  const getRoomName = (roomId: string) => {
    return rooms.find(r => r.id === roomId)?.name || 'N/A';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'deposited': return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'checked_in': return 'bg-green-100 text-green-600 border-green-200';
      case 'checked_out': return 'bg-slate-500 text-white border-slate-600';
      case 'cancelled': return 'bg-red-100 text-red-600 border-red-200 line-through';
      case 'no_show': return 'bg-amber-100 text-amber-600 border-amber-200';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const sourceColors: Record<string, string> = {
    zalo: 'bg-[#0068FF]',
    facebook: 'bg-[#1877F2]',
    booking: 'bg-[#003580]',
    airbnb: 'bg-[#FF5A5F]',
    walk_in: 'bg-[#6B7280]',
    direct: 'bg-[#10B981]',
  };

  return (
    <div className="bg-white rounded-[2rem] border-2 shadow-2xl shadow-slate-200/50 overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow className="hover:bg-transparent border-b-2">
            <TableHead className="w-[250px] font-black text-[10px] uppercase tracking-widest text-muted-foreground py-6 pl-8">Khách hàng</TableHead>
            <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground py-6">Phòng & Lịch trình</TableHead>
            <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground py-6">Trạng thái</TableHead>
            <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground py-6 text-right">Thanh toán</TableHead>
            <TableHead className="w-[80px] py-6 pr-8"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredBookings.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-64 text-center">
                <div className="flex flex-col items-center gap-2 opacity-40">
                  <Calendar size={48} />
                  <p className="font-bold">Không có dữ liệu đặt phòng</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            filteredBookings.sort((a, b) => b.checkIn.getTime() - a.checkIn.getTime()).map((booking) => (
              <TableRow 
                key={booking.id} 
                className="group hover:bg-slate-50/50 transition-colors border-b last:border-0 cursor-pointer"
                onClick={() => setActiveBooking(booking)}
              >
                <TableCell className="py-6 pl-8">
                  <div className="flex items-center gap-4">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-sm", sourceColors[booking.source])}>
                      {booking.guestName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="font-black text-sm text-foreground group-hover:text-primary transition-colors">{booking.guestName}</div>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-bold mt-1">
                        <Phone size={10} />
                        {booking.guestPhone}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="rounded-lg font-black text-[10px] uppercase tracking-tighter bg-slate-50 border-slate-200">
                        {getRoomName(booking.roomId)}
                      </Badge>
                      <span className="text-xs font-bold text-muted-foreground">
                        {format(booking.checkIn, 'dd/MM')} – {format(booking.checkOut, 'dd/MM')}
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground font-bold uppercase mt-1 tracking-tight">
                      {format(booking.checkIn, 'HH:mm')} nhận · {format(booking.checkOut, 'HH:mm')} trả
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-6">
                  <div className="flex flex-col gap-1.5">
                    <Badge className={cn("w-fit rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-tight border shadow-none", getStatusColor(booking.status))}>
                      {booking.status.replace('_', ' ')}
                    </Badge>
                    <div className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                      Nguồn: <span className="text-foreground">{booking.source}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-6 text-right">
                  <div className="flex flex-col items-end">
                    <div className="font-black text-sm text-foreground">
                      {booking.totalPrice.toLocaleString('vi-VN')}đ
                    </div>
                    {(booking.totalPrice - booking.amountPaid) > 0 ? (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 mt-1 uppercase tracking-tight bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                        <CreditCard size={10} />
                        Còn nợ {(booking.totalPrice - booking.amountPaid).toLocaleString('vi-VN')}đ
                      </div>
                    ) : (
                      <div className="text-[10px] font-bold text-green-600 mt-1 uppercase tracking-tight bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                        Đã thanh toán đủ
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-6 pr-8 text-right" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end" className="w-48 rounded-xl border-2 shadow-xl">
                      <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Thao tác</DropdownMenuLabel>
                      <DropdownMenuItem 
                        onClick={() => setActiveBooking(booking)}
                        className="gap-2 font-bold text-sm cursor-pointer py-2.5 rounded-lg focus:bg-primary/5 focus:text-primary"
                      >
                        <Eye size={16} /> Xem chi tiết
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 font-bold text-sm cursor-pointer py-2.5 rounded-lg focus:bg-primary/5 focus:text-primary">
                        <Edit size={16} /> Chỉnh sửa
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="gap-2 font-bold text-sm cursor-pointer py-2.5 rounded-lg text-red-600 focus:bg-red-50 focus:text-red-600">
                        <Trash2 size={16} /> Hủy đặt phòng
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {activeBooking && (
        <BookingDetailsModal 
          booking={activeBooking} 
          isOpen={activeBooking !== null} 
          onClose={() => setActiveBooking(null)} 
        />
      )}
    </div>
  );
};
