"use client";

import React, { useState } from 'react';
import { useTimelineStore } from '@/store/useTimelineStore';
import { BookingSource } from '@/lib/types';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
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
import { format, addHours, startOfToday } from 'date-fns';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { getPriceBreakdown } from '@/lib/pricing';
import { useEffect } from 'react';
import { useWatch } from 'react-hook-form';

const formSchema = z.object({
  guestName: z.string().min(2, "Tên khách phải có ít nhất 2 ký tự"),
  guestPhone: z.string().min(10, "Số điện thoại không hợp lệ"),
  roomId: z.string().min(1, "Vui lòng chọn phòng"),
  source: z.string().min(1, "Vui lòng chọn nguồn"),
  checkIn: z.string(),
  checkOut: z.string(),
  totalPrice: z.number().min(0),
  amountPaid: z.number().min(0),
});

interface AddBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialGuestName?: string;
  initialGuestPhone?: string;
  fromThreadId?: string;
}

type FormValues = z.infer<typeof formSchema>;

export const AddBookingModal = ({ 
  isOpen, 
  onClose, 
  initialGuestName, 
  initialGuestPhone,
  fromThreadId 
}: AddBookingModalProps) => {
  const { rooms, selectedPropertyId, addBooking } = useTimelineStore();
  const [error, setError] = useState<string | null>(null);

  const propertyRooms = selectedPropertyId
    ? rooms.filter(r => r.propertyId === selectedPropertyId)
    : rooms;

  const { register, handleSubmit, formState: { errors }, reset, setValue, control } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      guestName: initialGuestName || '',
      guestPhone: initialGuestPhone || '',
      checkIn: format(addHours(startOfToday(), 14), "yyyy-MM-dd'T'HH:mm"),
      checkOut: format(addHours(startOfToday(), 36), "yyyy-MM-dd'T'HH:mm"),
      source: 'direct',
      totalPrice: 0,
      amountPaid: 0,
    }
  });

  // Re-sync if props change
  useEffect(() => {
    if (initialGuestName) setValue('guestName', initialGuestName);
    if (initialGuestPhone) setValue('guestPhone', initialGuestPhone);
  }, [initialGuestName, initialGuestPhone, setValue]);
  
  const watchedRoomId = useWatch({ control, name: 'roomId' });
  const watchedCheckIn = useWatch({ control, name: 'checkIn' });
  const watchedCheckOut = useWatch({ control, name: 'checkOut' });

  const { settings } = useTimelineStore();
  const selectedRoom = rooms.find(r => r.id === watchedRoomId);

  const breakdown = (selectedRoom && watchedCheckIn && watchedCheckOut)
    ? getPriceBreakdown(selectedRoom, new Date(watchedCheckIn), new Date(watchedCheckOut), settings?.pricing)
    : null;

  useEffect(() => {
    if (breakdown && breakdown.total > 0) {
      setValue('totalPrice', breakdown.total);
    }
  }, [breakdown?.total, setValue]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setError(null);
    
    const resultId = addBooking({
      propertyId: selectedPropertyId,
      roomId: values.roomId,
      guestName: values.guestName,
      guestPhone: values.guestPhone,
      source: values.source as BookingSource,
      status: 'confirmed',
      checkIn: new Date(values.checkIn),
      checkOut: new Date(values.checkOut),
      totalPrice: values.totalPrice,
      amountPaid: values.amountPaid,
    }, fromThreadId);

    if (resultId) {
      reset();
      onClose();
    } else {
      setError("Xung đột lịch! Phòng đã có khách trong khoảng thời gian này.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] bg-white border-2 p-0 overflow-hidden rounded-2xl shadow-2xl">
        <div className="bg-primary h-2 w-full" />
        
        <div className="p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight text-foreground">Tạo đặt phòng mới</DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium">
              Nhập thông tin khách hàng và lịch trình lưu trú.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Left Column: Guest Info */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="guestName" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Tên khách hàng</Label>
                  <Input id="guestName" {...register("guestName")} placeholder="Nguyễn Văn A" className="rounded-xl border-muted focus:ring-primary/20" />
                  {errors.guestName && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.guestName.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="guestPhone" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Số điện thoại</Label>
                  <Input id="guestPhone" {...register("guestPhone")} placeholder="09xx.xxx.xxx" className="rounded-xl border-muted" />
                  {errors.guestPhone && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.guestPhone.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Nguồn đặt phòng</Label>
                  <Select onValueChange={(val: unknown) => { if (typeof val === 'string') setValue('source', val); }} defaultValue="direct">
                    <SelectTrigger className="rounded-xl border-muted">
                      <SelectValue placeholder="Chọn nguồn" />
                    </SelectTrigger>
                    <SelectContent>
                      {(useTimelineStore.getState().settings?.enabledBookingSources ?? ['direct','zalo','facebook','booking','airbnb','walk_in']).map((s) => {
                        const labels: Record<string, string> = {
                          direct: 'Trực tiếp (Direct)',
                          zalo: 'Zalo',
                          facebook: 'Facebook',
                          booking: 'Booking.com',
                          airbnb: 'Airbnb',
                          walk_in: 'Khách vãng lai (Walk-in)',
                        };
                        return <SelectItem key={s} value={s}>{labels[s] ?? s}</SelectItem>;
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Right Column: Room & Dates */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Chọn phòng</Label>
                  <Select onValueChange={(val: unknown) => { if (typeof val === 'string') setValue('roomId', val); }}>
                    <SelectTrigger className="rounded-xl border-muted font-bold">
                      <SelectValue placeholder="Chọn phòng trống" />
                    </SelectTrigger>
                    <SelectContent>
                      {propertyRooms.map(r => (
                        <SelectItem key={r.id} value={r.id}>{r.name} - {r.roomType}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.roomId && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.roomId.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="checkIn" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Ngày nhận (Check-in)</Label>
                  <Input id="checkIn" type="datetime-local" {...register("checkIn")} className="rounded-xl border-muted" lang="en-GB" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="checkOut" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Ngày trả (Check-out)</Label>
                  <Input id="checkOut" type="datetime-local" {...register("checkOut")} className="rounded-xl border-muted" lang="en-GB" />
                </div>
              </div>
            </div>

            {/* Price breakdown */}
            {breakdown && (
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-2xl text-xs flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-black text-primary">{breakdown.tier}</span>
                <span className="text-muted-foreground">·</span>
                <span className="font-bold text-foreground">{breakdown.dayType === 'weekend' ? 'Cuối tuần' : 'Ngày thường'}</span>
                <span className="text-muted-foreground">·</span>
                <span className="font-bold text-foreground">{breakdown.slotLabel}</span>
                {breakdown.nights > 1 && (
                  <>
                    <span className="text-muted-foreground">·</span>
                    <span className="font-bold">{breakdown.nights} đêm × {breakdown.basePrice.toLocaleString()}đ</span>
                  </>
                )}
                <span className="ml-auto font-black text-primary text-sm">{breakdown.total.toLocaleString()}đ</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-6 p-4 bg-muted/30 rounded-2xl border border-muted">
              <div className="space-y-2">
                <Label htmlFor="totalPrice" className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Tổng tiền phòng (VNĐ)</Label>
                <Input id="totalPrice" type="number" {...register("totalPrice", { valueAsNumber: true })} className="rounded-xl border-none bg-white font-bold text-primary" />
                {!breakdown && selectedRoom && (
                  <p className="text-[10px] text-muted-foreground ml-1">Chọn phòng và giờ để tự tính giá</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="amountPaid" className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Đã đặt cọc / Thanh toán</Label>
                <Input id="amountPaid" type="number" {...register("amountPaid", { valueAsNumber: true })} className="rounded-xl border-none bg-white font-bold text-green-600" />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 p-3 rounded-xl flex items-center gap-2 animate-shake">
                <span className="text-red-600 text-xs font-bold uppercase tracking-tight">⚠️ {error}</span>
              </div>
            )}

            <DialogFooter className="gap-3">
              <Button type="button" variant="outline" onClick={onClose} className="rounded-xl font-bold px-6 border-muted text-muted-foreground">Hủy</Button>
              <Button type="submit" className="rounded-xl font-bold px-8 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">Xác nhận đặt phòng</Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
