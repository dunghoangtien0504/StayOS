import React, { useState, useCallback } from 'react';
import { Booking } from '@/lib/types';
import { differenceInMinutes, format, addMinutes } from 'date-fns';
import { cn } from '@/lib/utils';
import { useDraggable } from '@dnd-kit/core';
import { useTimelineStore } from '@/store/useTimelineStore';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from 'lucide-react';
import { BookingDetailsModal } from '@/components/booking/BookingDetailsModal';

interface BookingBlockProps {
  booking: Booking;
  top: number;
  startDate: Date;
  isConflict?: boolean;
}

const HOUR_WIDTH = 60;

export const BookingBlock = ({ booking, top, startDate, isConflict }: BookingBlockProps) => {
  const { updateBooking } = useTimelineStore();
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDelta, setResizeDelta] = useState(0);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: booking.id,
    data: { booking },
    disabled: isResizing
  });

  const left = (differenceInMinutes(booking.checkIn, startDate) / 60) * HOUR_WIDTH;
  const baseWidth = (differenceInMinutes(booking.checkOut, booking.checkIn) / 60) * HOUR_WIDTH;
  const currentWidth = baseWidth + resizeDelta;

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    
    const startX = e.clientX;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      setResizeDelta(deltaX);
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      const finalDeltaX = upEvent.clientX - startX;
      const minuteShift = Math.round(finalDeltaX / (HOUR_WIDTH / 60));
      const newCheckOut = addMinutes(booking.checkOut, minuteShift);

      updateBooking(booking.id, { checkOut: newCheckOut });
      
      setIsResizing(false);
      setResizeDelta(0);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [booking, updateBooking]);

  const style = {
    top: top + 4,
    left: left,
    width: Math.max(HOUR_WIDTH * 0.5, currentWidth), // Min 30 mins
    height: 52,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
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
    <Popover>
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        className={cn(
          "absolute rounded-lg border-2 shadow-sm cursor-grab active:cursor-grabbing overflow-hidden transition-all group z-10",
          sourceColors[booking.source] || 'bg-primary',
          isConflict ? "border-red-500 ring-4 ring-red-500/20" : "border-white/20",
          isDragging ? "opacity-50 shadow-xl scale-[1.02] z-50 cursor-grabbing" : "hover:shadow-md",
          isResizing && "z-50 ring-2 ring-white/50",
          "text-white select-none"
        )}
      >
        <PopoverTrigger
          className="absolute inset-0 w-full h-full p-2 text-left outline-none"
        >
          {/* Buffer Visualization (30min gray zone) */}
          <div
            className="absolute right-0 top-0 bottom-0 bg-black/20 pointer-events-none"
            style={{ width: HOUR_WIDTH / 2 }}
            title="30 min buffer"
          />

          <div className="flex flex-col h-full justify-between pointer-events-none">
            <div className="text-[11px] font-extrabold truncate leading-tight flex items-center gap-1">
              {booking.guestName}
              {isConflict && <span className="text-[10px] bg-red-600 px-1 rounded">Xung đột!</span>}
            </div>
            <div className="flex items-center justify-between mt-auto">
                <span className="text-[9px] font-medium opacity-90">
                  {format(booking.checkIn, 'HH:mm')} - {format(booking.checkOut, 'HH:mm')}
                </span>
                {booking.amountPaid < booking.totalPrice && (
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-[0_0_5px_rgba(250,204,21,1)]" title="Còn nợ" />
                )}
            </div>
          </div>
        </PopoverTrigger>

        {/* Resize Handle */}
        {!isDragging && (
          <div
            className="absolute right-0 top-0 bottom-0 w-2.5 cursor-ew-resize hover:bg-white/40 transition-colors z-20"
            onMouseDown={handleResizeStart}
          />
        )}
      </div>
      
      <PopoverContent className="w-80 p-0 overflow-hidden shadow-2xl border-2" side="top" align="start" sideOffset={10}>
        <div className={cn("h-2", sourceColors[booking.source])} />
        <div className="p-4 space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-bold text-lg">{booking.guestName}</h4>
              <p className="text-sm text-muted-foreground">{booking.guestPhone}</p>
            </div>
            <Badge variant="outline" className="capitalize font-bold border-primary/20 text-primary">{booking.status.replace('_', ' ')}</Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm bg-muted/40 p-3 rounded-xl border">
            <div>
              <p className="text-muted-foreground text-[10px] uppercase font-black tracking-wider">Check-in</p>
              <p className="font-bold">{format(booking.checkIn, 'dd/MM HH:mm')}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-[10px] uppercase font-black tracking-wider">Check-out</p>
              <p className="font-bold">{format(booking.checkOut, 'dd/MM HH:mm')}</p>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t gap-3">
            <Button 
              onClick={() => setIsDetailsOpen(true)}
              className="flex-1 rounded-xl bg-primary text-white font-bold text-[11px] h-9 gap-2 shadow-lg shadow-primary/20"
            >
              <ExternalLink size={14} /> Xem chi tiết
            </Button>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground font-bold">TỔNG TIỀN</p>
              <p className="font-black text-sm text-primary">{booking.totalPrice.toLocaleString('vi-VN')}đ</p>
            </div>
          </div>
        </div>
      </PopoverContent>

      <BookingDetailsModal 
        booking={booking} 
        isOpen={isDetailsOpen} 
        onClose={() => setIsDetailsOpen(false)} 
      />
    </Popover>
  );
};
