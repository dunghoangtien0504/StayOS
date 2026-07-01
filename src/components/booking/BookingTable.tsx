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
  LogIn,
  LogOut,
  Phone,
  Calendar,
  CreditCard,
  XCircle,
  Download,
} from 'lucide-react';
import { statusLabel, statusColor, sourceLabel, sourceColor } from '@/lib/labels';
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

interface BookingTableProps {
  fromDate?: Date;
  toDate?: Date;
  searchTerm?: string;
  kpiFilter?: 'all' | 'received' | 'debt' | 'count';
}

export const BookingTable = ({ fromDate, toDate, searchTerm, kpiFilter = 'all' }: BookingTableProps = {}) => {
  const { bookings, rooms, selectedPropertyId, updateBooking, checkInBooking, checkOutBooking } = useTimelineStore();
  const [activeBooking, setActiveBooking] = React.useState<Booking | null>(null);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  let filteredBookings = (selectedPropertyId
    ? bookings.filter(b => b.propertyId === selectedPropertyId)
    : bookings);

  if (fromDate && toDate) {
    filteredBookings = filteredBookings.filter(b => b.checkIn >= fromDate && b.checkIn <= toDate);
  }

  if (kpiFilter === 'debt') {
    filteredBookings = filteredBookings.filter(b => b.totalPrice - b.amountPaid > 0 && b.status !== 'cancelled');
  } else if (kpiFilter === 'received') {
    filteredBookings = filteredBookings.filter(b => b.amountPaid > 0 && b.status !== 'cancelled');
  }

  if (searchTerm && searchTerm.trim()) {
    const q = searchTerm.toLowerCase().trim();
    filteredBookings = filteredBookings.filter(b =>
      b.guestName.toLowerCase().includes(q) ||
      (b.guestPhone || '').toLowerCase().includes(q) ||
      b.id.toLowerCase().includes(q)
    );
  }

  filteredBookings = filteredBookings.sort((a, b) => b.checkIn.getTime() - a.checkIn.getTime());

  const allSelected = filteredBookings.length > 0 && filteredBookings.every(b => selected.has(b.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(filteredBookings.map(b => b.id)));
  const toggleOne = (id: string) => setSelected(prev => {
    const s = new Set(prev);
    if (s.has(id)) s.delete(id); else s.add(id);
    return s;
  });

  const bulkCancel = () => {
    if (!confirm(`Hủy ${selected.size} booking đã chọn?`)) return;
    selected.forEach(id => updateBooking(id, { status: 'cancelled' }));
    setSelected(new Set());
  };

  const bulkExportCSV = () => {
    const rows = filteredBookings.filter(b => selected.has(b.id));
    const headers = ['ID', 'Khách', 'SĐT', 'Phòng', 'Check-in', 'Check-out', 'Trạng thái', 'Tổng tiền', 'Đã trả'];
    const csv = [headers, ...rows.map(b => [
      b.id, b.guestName, b.guestPhone,
      rooms.find(r => r.id === b.roomId)?.name ?? b.roomId,
      b.checkIn.toLocaleDateString('vi-VN'), b.checkOut.toLocaleDateString('vi-VN'),
      statusLabel(b.status), b.totalPrice, b.amountPaid,
    ])].map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = `bookings_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.csv`;
    a.click();
    setSelected(new Set());
  };

  const getRoomName = (roomId: string) => {
    return rooms.find(r => r.id === roomId)?.name || 'N/A';
  };

  const cancelBooking = (booking: Booking) => {
    if (!confirm(`Hủy đặt phòng của ${booking.guestName}?`)) return;
    updateBooking(booking.id, { status: 'cancelled' });
  };

  return (
    <div className="bg-white rounded-[2rem] border-2 shadow-2xl shadow-slate-200/50 overflow-hidden">
      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-6 py-3 bg-primary/5 border-b border-primary/10">
          <span className="text-sm font-black text-primary">Đã chọn {selected.size} booking</span>
          <button onClick={bulkExportCSV} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border text-xs font-bold hover:bg-muted/50 transition-colors">
            <Download size={13} /> Xuất CSV
          </button>
          <button onClick={bulkCancel} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-100 text-red-600 text-xs font-bold hover:bg-red-100 transition-colors">
            <XCircle size={13} /> Hủy tất cả
          </button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-xs text-muted-foreground hover:text-foreground font-bold">
            Bỏ chọn
          </button>
        </div>
      )}
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow className="hover:bg-transparent border-b-2">
            <TableHead className="w-12 py-6 pl-6">
              <input type="checkbox" checked={allSelected} onChange={toggleAll}
                className="w-4 h-4 rounded cursor-pointer accent-primary" />
            </TableHead>
            <TableHead className="w-[250px] font-black text-[10px] uppercase tracking-widest text-muted-foreground py-6">Khách hàng</TableHead>
            <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground py-6">Phòng & Lịch trình</TableHead>
            <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground py-6">Trạng thái</TableHead>
            <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground py-6 text-right">Thanh toán</TableHead>
            <TableHead className="w-[80px] py-6 pr-8"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredBookings.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-64 text-center">
                <div className="flex flex-col items-center gap-2 opacity-40">
                  <Calendar size={48} />
                  <p className="font-bold">Không có dữ liệu đặt phòng</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            filteredBookings.map((booking) => (
              <TableRow
                key={booking.id}
                className={cn("group hover:bg-slate-50/50 transition-colors border-b last:border-0 cursor-pointer", selected.has(booking.id) && "bg-primary/5")}
                onClick={() => setActiveBooking(booking)}
              >
                <TableCell className="py-6 pl-6" onClick={e => { e.stopPropagation(); toggleOne(booking.id); }}>
                  <input type="checkbox" checked={selected.has(booking.id)} onChange={() => toggleOne(booking.id)}
                    className="w-4 h-4 rounded cursor-pointer accent-primary" />
                </TableCell>
                <TableCell className="py-6">
                  <div className="flex items-center gap-4">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-sm", sourceColor(booking.source))}>
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
                    <Badge className={cn("w-fit rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-tight border shadow-none", statusColor(booking.status))}>
                      {statusLabel(booking.status)}
                    </Badge>
                    <div className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                      Nguồn: <span className="text-foreground">{sourceLabel(booking.source)}</span>
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
                      {(booking.status === 'confirmed' || booking.status === 'deposited') && (
                        <DropdownMenuItem
                          onClick={() => {
                            if (!checkInBooking(booking.id)) {
                              alert('Không thể check-in: phòng chưa được dọn sạch.');
                            }
                          }}
                          className="gap-2 font-bold text-sm cursor-pointer py-2.5 rounded-lg focus:bg-green-50 focus:text-green-600"
                        >
                          <LogIn size={16} /> Check-in
                        </DropdownMenuItem>
                      )}
                      {booking.status === 'checked_in' && (
                        <DropdownMenuItem
                          onClick={() => checkOutBooking(booking.id)}
                          className="gap-2 font-bold text-sm cursor-pointer py-2.5 rounded-lg focus:bg-blue-50 focus:text-blue-600"
                        >
                          <LogOut size={16} /> Check-out
                        </DropdownMenuItem>
                      )}
                      {booking.status !== 'cancelled' && booking.status !== 'checked_out' && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => cancelBooking(booking)}
                            className="gap-2 font-bold text-sm cursor-pointer py-2.5 rounded-lg text-red-600 focus:bg-red-50 focus:text-red-600"
                          >
                            <XCircle size={16} /> Hủy đặt phòng
                          </DropdownMenuItem>
                        </>
                      )}
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
