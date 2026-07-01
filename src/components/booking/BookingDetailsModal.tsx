"use client";

import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTimelineStore } from '@/store/useTimelineStore';
import { Booking, BookingSource } from '@/lib/types';
import { 
  User, 
  Phone, 
  Calendar, 
  CreditCard, 
  History, 
  CheckCircle2,
  LogOut,
  XCircle,
  MapPin,
  Clock,
  MessageSquare,
  Edit2,
  Save,
  RotateCcw,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { statusLabel, sourceLabel } from '@/lib/labels';
import { PaymentForm } from './PaymentForm';
import { calculateNights } from '@/lib/pricing';
import { printInvoice } from '@/lib/invoice';
import { Printer } from 'lucide-react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

const editSchema = z.object({
  guestName: z.string().min(2, "Tên khách phải có ít nhất 2 ký tự"),
  guestPhone: z.string().min(10, "Số điện thoại không hợp lệ"),
  roomId: z.string().min(1, "Vui lòng chọn phòng"),
  source: z.string().min(1, "Vui lòng chọn nguồn"),
  checkInDate: z.string(),
  checkInTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Giờ check-in không hợp lệ (HH:mm)"),
  checkOutDate: z.string(),
  checkOutTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Giờ check-out không hợp lệ (HH:mm)"),
  totalPrice: z.number().min(0),
});

type EditValues = z.infer<typeof editSchema>;

interface BookingDetailsModalProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
}

export const BookingDetailsModal = ({ booking: initialBooking, isOpen, onClose }: BookingDetailsModalProps) => {
  const { rooms, properties, bookings, chatThreads, checkInBooking, checkOutBooking, addPayment, deletePayment, deleteBooking, markAsNoShow, updateBooking, updateRoomStatus, settings } = useTimelineStore();
  const booking = bookings.find(b => b.id === initialBooking.id) || initialBooking;
  const property = properties.find(p => p.id === booking.propertyId);
  const [isEditing, setIsEditing] = React.useState(false);

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      guestName: booking.guestName,
      guestPhone: booking.guestPhone,
      roomId: booking.roomId,
      source: booking.source,
      checkInDate: format(booking.checkIn, "yyyy-MM-dd"),
      checkInTime: format(booking.checkIn, "HH:mm"),
      checkOutDate: format(booking.checkOut, "yyyy-MM-dd"),
      checkOutTime: format(booking.checkOut, "HH:mm"),
      totalPrice: booking.totalPrice,
    }
  });

  // Sync form when booking changes
  React.useEffect(() => {
    reset({
      guestName: booking.guestName,
      guestPhone: booking.guestPhone,
      roomId: booking.roomId,
      source: booking.source,
      checkInDate: format(booking.checkIn, "yyyy-MM-dd"),
      checkInTime: format(booking.checkIn, "HH:mm"),
      checkOutDate: format(booking.checkOut, "yyyy-MM-dd"),
      checkOutTime: format(booking.checkOut, "HH:mm"),
      totalPrice: booking.totalPrice,
    });
  }, [booking, reset]);
  const room = rooms.find(r => r.id === booking.roomId);
  const linkedThread = chatThreads.find(t => t.linkedBookingId === booking.id);
  
  const remainingDebt = booking.totalPrice - booking.amountPaid;

  const handleCheckIn = () => {
    let success = checkInBooking(booking.id);
    if (!success) {
      if (room && confirm(`Phòng ${room.name} chưa được dọn sạch. Bạn có muốn tự động chuyển trạng thái phòng thành SẠCH và thực hiện Check-in không?`)) {
        updateRoomStatus(room.id, 'clean');
        success = checkInBooking(booking.id);
      } else {
        alert("Không thể check-in: Phòng chưa được dọn sạch!");
      }
    }
  };

  const handleCheckOut = () => {
    if (remainingDebt > 0) {
      if (confirm(`Khách vẫn còn nợ ${remainingDebt.toLocaleString()} VNĐ. Bạn có chắc chắn muốn Check-out?`)) {
        checkOutBooking(booking.id);
        onClose();
      }
    } else {
      checkOutBooking(booking.id);
      onClose();
    }
  };

  const watchCheckInDate = watch('checkInDate');
  const watchCheckInTime = watch('checkInTime');
  const watchCheckOutDate = watch('checkOutDate');
  const watchCheckOutTime = watch('checkOutTime');

  const watchCheckIn = (watchCheckInDate && watchCheckInTime && /^\d{4}-\d{2}-\d{2}$/.test(watchCheckInDate) && /^([01]\d|2[0-3]):[0-5]\d$/.test(watchCheckInTime)) 
    ? new Date(`${watchCheckInDate}T${watchCheckInTime}`) 
    : booking.checkIn;
  const watchCheckOut = (watchCheckOutDate && watchCheckOutTime && /^\d{4}-\d{2}-\d{2}$/.test(watchCheckOutDate) && /^([01]\d|2[0-3]):[0-5]\d$/.test(watchCheckOutTime)) 
    ? new Date(`${watchCheckOutDate}T${watchCheckOutTime}`) 
    : booking.checkOut;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto bg-white rounded-[2rem] border-2 shadow-2xl p-0">
        <div className={cn(
          "h-3 w-full",
          booking.status === 'checked_in' ? "bg-green-500" : 
          booking.status === 'checked_out' ? "bg-slate-500" : "bg-primary"
        )} />
        
        <div className="p-8">
          <DialogHeader className="flex flex-row items-start justify-between space-y-0">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                {isEditing ? (
                  <div className="space-y-1">
                    <Input 
                      {...register("guestName")} 
                      className="text-xl font-black h-10 w-80 rounded-xl"
                    />
                    {errors.guestName && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.guestName.message}</p>}
                  </div>
                ) : (
                  <DialogTitle className="text-3xl font-black tracking-tight">{booking.guestName}</DialogTitle>
                )}
                <Badge variant="secondary" className="font-black uppercase tracking-widest text-[10px]">
                  {statusLabel(booking.status)}
                </Badge>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn("w-8 h-8 rounded-full", isEditing ? "text-primary bg-primary/10" : "text-muted-foreground")}
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? <RotateCcw size={16} /> : <Edit2 size={16} />}
                </Button>
              </div>
              {isEditing ? (
                <div className="flex items-center gap-3">
                  <div className="space-y-1">
                    <Input 
                      {...register("guestPhone")} 
                      className="h-8 w-40 text-sm font-bold rounded-lg"
                    />
                    {errors.guestPhone && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.guestPhone.message}</p>}
                  </div>
                  <Select onValueChange={(val) => setValue('source', val as BookingSource)} defaultValue={booking.source}>
                    <SelectTrigger className="h-8 w-32 rounded-lg text-xs font-bold uppercase">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="direct">Direct</SelectItem>
                      <SelectItem value="zalo">Zalo</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="booking">Booking.com</SelectItem>
                      <SelectItem value="airbnb">Airbnb</SelectItem>
                      <SelectItem value="walk_in">Walk-in</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <p className="text-muted-foreground font-medium flex items-center gap-2">
                  <Phone size={14} /> {booking.guestPhone} · <span className="text-primary font-bold">{sourceLabel(booking.source)}</span>
                </p>
              )}
            </div>
            
            <div className="text-right">
              <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Mã đơn</div>
              <div className="font-mono font-bold text-sm bg-muted px-3 py-1 rounded-lg">#{booking.id.slice(-6).toUpperCase()}</div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="info" className="mt-8">
            <TabsList className="grid w-full grid-cols-3 bg-muted/50 rounded-2xl p-1 h-12">
              <TabsTrigger value="info" className="gap-2 rounded-xl">
                <User size={16} /> Thông tin đơn
              </TabsTrigger>
              <TabsTrigger value="payment" className="gap-2 rounded-xl">
                <CreditCard size={16} /> Thanh toán & Công nợ
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2 rounded-xl">
                <History size={16} /> Nhật ký vận hành
              </TabsTrigger>
            </TabsList>

            {/* Info Tab */}
            <TabsContent value="info" className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-50 rounded-2xl p-5 border-2 border-slate-100 space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center justify-between">
                    <span className="flex items-center gap-2"><MapPin size={14} /> Chi tiết phòng</span>
                    {isEditing && <span className="text-[10px] text-muted-foreground">Thay đổi phòng</span>}
                  </h4>
                  <div className="flex items-center gap-4">
                    {isEditing ? (
                      <div className="w-full">
                        <Select
                          onValueChange={(val) => setValue('roomId', val ?? '')}
                          value={watch('roomId') ?? ''}
                        >
                          <SelectTrigger className="w-full h-14 rounded-xl border-2 bg-white font-bold">
                            <SelectValue>
                              {rooms.find(r => r.id === watch('roomId'))?.name || "Chọn phòng"}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {rooms.filter(r => r.propertyId === booking.propertyId).map(r => (
                              <SelectItem key={r.id} value={r.id}>{r.name} - {r.roomType}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <>
                        <div className="w-14 h-14 bg-white rounded-xl border-2 flex items-center justify-center font-black text-2xl shadow-sm">
                          {room?.name.replace('P.', '')}
                        </div>
                        <div>
                          <div className="font-black text-lg">{room?.name}</div>
                          <div className="text-sm font-bold text-muted-foreground">{room?.roomType} · Tầng {room?.floor}</div>
                        </div>
                      </>
                    )}
                  </div>
                  {!isEditing && (
                    <div className="pt-2">
                      <Badge className={cn(
                        "font-black uppercase tracking-widest text-[10px]",
                        room?.status === 'clean' ? "bg-green-500" : 
                        room?.status === 'dirty' ? "bg-red-500" : "bg-amber-500"
                      )}>
                        Phòng {room?.status === 'clean' ? 'Sạch' : room?.status === 'dirty' ? 'Bẩn' : 'Đang dọn'}
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 rounded-2xl p-5 border-2 border-slate-100 space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <Calendar size={14} /> Thời gian lưu trú
                  </h4>
                  <div className="space-y-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-muted-foreground uppercase">Check-in</span>
                        {isEditing ? (
                          <div className="flex gap-2">
                            <Input 
                              type="date" 
                              {...register("checkInDate")} 
                              className="h-8 w-28 text-xs font-bold rounded-lg py-0 px-2"
                            />
                            <Input 
                              type="text" 
                              placeholder="14:00"
                              {...register("checkInTime")} 
                              className="h-8 w-16 text-xs font-bold rounded-lg py-0 px-2 text-center"
                            />
                          </div>
                        ) : (
                          <span className="font-black text-sm">{format(booking.checkIn, 'HH:mm - dd/MM/yyyy', { locale: vi })}</span>
                        )}
                      </div>
                      {errors.checkInTime && <p className="text-[10px] text-red-500 font-bold uppercase text-right">{errors.checkInTime.message}</p>}
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-muted-foreground uppercase">Check-out</span>
                        {isEditing ? (
                          <div className="flex gap-2">
                            <Input 
                              type="date" 
                              {...register("checkOutDate")} 
                              className="h-8 w-28 text-xs font-bold rounded-lg py-0 px-2"
                            />
                            <Input 
                              type="text" 
                              placeholder="12:00"
                              {...register("checkOutTime")} 
                              className="h-8 w-16 text-xs font-bold rounded-lg py-0 px-2 text-center"
                            />
                          </div>
                        ) : (
                          <span className="font-black text-sm">{format(booking.checkOut, 'HH:mm - dd/MM/yyyy', { locale: vi })}</span>
                        )}
                      </div>
                      {errors.checkOutTime && <p className="text-[10px] text-red-500 font-bold uppercase text-right">{errors.checkOutTime.message}</p>}
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                      <span className="text-xs font-bold text-muted-foreground uppercase">Tổng số đêm</span>
                      <span className="font-black text-sm text-primary">
                        {calculateNights(watchCheckIn, watchCheckOut)} đêm
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Payment Tab */}
            <TabsContent value="payment" className="space-y-6 pt-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Tổng tiền</p>
                  {isEditing ? (
                    <Input 
                      type="number" 
                      {...register("totalPrice", { valueAsNumber: true })} 
                      className="h-8 w-28 mx-auto text-center font-black rounded-lg"
                    />
                  ) : (
                    <p className="text-lg font-black">{booking.totalPrice.toLocaleString()} VNĐ</p>
                  )}
                </div>
                <div className="bg-green-50 p-4 rounded-2xl border-2 border-green-100 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-green-600 mb-1">Đã thanh toán</p>
                  <p className="text-lg font-black text-green-600">{booking.amountPaid.toLocaleString()} VNĐ</p>
                </div>
                <div className={cn(
                  "p-4 rounded-2xl border-2 text-center",
                  remainingDebt > 0 ? "bg-red-50 border-red-100" : "bg-slate-50 border-slate-100"
                )}>
                  <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1", remainingDebt > 0 ? "text-red-600" : "text-muted-foreground")}>Công nợ</p>
                  <p className={cn("text-lg font-black", remainingDebt > 0 ? "text-red-600" : "text-slate-400")}>{remainingDebt.toLocaleString()} VNĐ</p>
                </div>
              </div>

              {remainingDebt > 0 && (
                <PaymentForm 
                  remainingAmount={remainingDebt} 
                  onAddPayment={(amt, method, note) => addPayment(booking.id, amt, method, note)} 
                />
              )}

              {booking.payments && booking.payments.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Lịch sử thanh toán</h4>
                  <div className="space-y-2">
                    {booking.payments.map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white border flex items-center justify-center">
                            <CreditCard size={14} className="text-primary" />
                          </div>
                          <div>
                            <div className="text-xs font-black">{p.amount.toLocaleString()} VNĐ</div>
                            <div className="text-[10px] font-bold text-muted-foreground uppercase">{p.method} · {format(p.date, 'HH:mm - dd/MM')}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {p.note && <div className="text-[10px] italic text-muted-foreground max-w-[150px] truncate">{p.note}</div>}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="w-8 h-8 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => {
                              if (confirm(`Bạn có chắc chắn muốn xóa giao dịch này không?`)) {
                                deletePayment(booking.id, p.id);
                              }
                            }}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-4 pt-4">
              <div className="space-y-4">
                <div className="flex gap-4 items-start relative">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 z-10">
                    <CheckCircle2 size={16} />
                  </div>
                  <div className="absolute left-4 top-8 w-0.5 h-full bg-slate-100" />
                  <div>
                    <p className="text-sm font-bold">Tạo đặt phòng</p>
                    <p className="text-xs text-muted-foreground font-medium">Hệ thống · {format(new Date(), 'HH:mm - dd/MM/yyyy')}</p>
                  </div>
                </div>
                {booking.actualCheckIn && (
                  <div className="flex gap-4 items-start relative">
                    <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center shrink-0 z-10">
                      <Clock size={16} />
                    </div>
                    <div className="absolute left-4 top-8 w-0.5 h-10 bg-slate-100" />
                    <div>
                      <p className="text-sm font-bold text-green-600">Thực tế Check-in</p>
                      <p className="text-xs text-muted-foreground font-medium">Lễ tân A · {format(booking.actualCheckIn, 'HH:mm - dd/MM/yyyy')}</p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-12 flex items-center justify-between pt-6 border-t-2 border-slate-100">
            <div className="flex gap-3">
              <Button variant="outline" className="rounded-xl font-bold h-11 px-6 border-2 gap-2" onClick={onClose}>Đóng</Button>
              {!isEditing && linkedThread && (
                <Button 
                  variant="outline" 
                  className="rounded-xl font-bold h-11 px-6 border-2 gap-2 text-primary hover:bg-primary/5 border-primary/20"
                  onClick={() => {
                    window.location.href = `/inbox?thread=${linkedThread.id}`;
                  }}
                >
                  <MessageSquare size={18} /> Mở hội thoại
                </Button>
              )}
              {!isEditing && (
                <Button variant="outline" className="rounded-xl font-bold h-11 px-6 border-2 gap-2 text-red-600 hover:bg-red-50 hover:text-red-600 border-red-100" onClick={() => markAsNoShow(booking.id)}>
                  <XCircle size={18} /> No-show
                </Button>
              )}
              {!isEditing && (
                <Button 
                  variant="outline" 
                  className="rounded-xl font-bold h-11 px-6 border-2 gap-2 text-red-500 hover:bg-red-50 hover:text-red-500 border-red-100" 
                  onClick={() => {
                    if (confirm(`Bạn có chắc chắn muốn XÓA HOÀN TOÀN đặt phòng của khách ${booking.guestName} khỏi hệ thống?`)) {
                      deleteBooking(booking.id);
                      onClose();
                    }
                  }}
                >
                  <Trash2 size={18} /> Xóa đặt phòng
                </Button>
              )}
            </div>
            
            <div className="flex gap-3">
              {isEditing ? (
                <Button 
                  onClick={handleSubmit((values) => {
                    const cIn = new Date(`${values.checkInDate}T${values.checkInTime}`);
                    const cOut = new Date(`${values.checkOutDate}T${values.checkOutTime}`);
                    const success = updateBooking(booking.id, {
                      guestName: values.guestName,
                      guestPhone: values.guestPhone,
                      roomId: values.roomId,
                      source: values.source as BookingSource,
                      checkIn: cIn,
                      checkOut: cOut,
                      totalPrice: values.totalPrice,
                    });
                    if (success) {
                      setIsEditing(false);
                    } else {
                      alert("Xung đột lịch! Không thể lưu thay đổi.");
                    }
                  })} 
                  className="rounded-xl bg-primary text-white font-black h-11 px-10 gap-2 shadow-lg shadow-primary/20"
                >
                  <Save size={18} /> Lưu thay đổi
                </Button>
              ) : (
                <>
                  {booking.status !== 'checked_in' && booking.status !== 'checked_out' && (
                    <Button 
                      onClick={handleCheckIn} 
                      className="rounded-xl bg-green-600 hover:bg-green-700 text-white font-black h-11 px-8 gap-2 shadow-lg shadow-green-100"
                    >
                      <CheckCircle2 size={18} /> Xác nhận Check-in
                    </Button>
                  )}
                  {booking.status === 'checked_in' && (
                    <Button 
                      onClick={handleCheckOut} 
                      className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black h-11 px-8 gap-2 shadow-lg shadow-amber-100"
                    >
                      <LogOut size={18} /> Trả phòng & Check-out
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    className="rounded-xl font-black h-11 px-6 gap-2"
                    onClick={() => printInvoice(booking, room, property, settings)}
                  >
                    <Printer size={18} /> In hóa đơn
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
