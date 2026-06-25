import React, { useMemo } from 'react';
import { useTimelineStore } from '@/store/useTimelineStore';
import { format, addDays, startOfDay, isSameDay, addMinutes } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { 
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragMoveEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay
} from '@dnd-kit/core';
import { Booking } from '@/lib/types';
import { BookingBlock } from './BookingBlock';
import { Badge } from '@/components/ui/badge';

const HOUR_WIDTH = 60;
const ROW_HEIGHT = 80; // Match room row height
const ROOM_COL_WIDTH = 200;

interface TimelineCanvasProps {
  sourceFilter?: Set<string> | null;
}

export const TimelineCanvas = ({ sourceFilter }: TimelineCanvasProps) => {
  const mounted = React.useSyncExternalStore(
    (cb) => { cb(); return () => {}; },
    () => true,
    () => false,
  );

  const { 
    rooms, 
    selectedPropertyId, 
    startDate, 
    daysToShow, 
    bookings,
    updateBooking,
    checkConflict,
    setActiveConflictBookingId,
    activeConflictBookingId
  } = useTimelineStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const propertyRooms = useMemo(() => 
    rooms.filter(r => r.propertyId === selectedPropertyId),
    [rooms, selectedPropertyId]
  );

  const timelineDays = useMemo(() => 
    Array.from({ length: daysToShow }).map((_, i) => addDays(startOfDay(startDate), i)),
    [startDate, daysToShow]
  );

  const [activeBooking, setActiveBooking] = React.useState<Booking | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveBooking(event.active.data.current?.booking);
  };

  const handleDragMove = (event: DragMoveEvent) => {
    const { active, delta } = event;
    const booking = active.data.current?.booking;
    if (!booking) return;

    const minuteShift = Math.round(delta.x / (HOUR_WIDTH / 60));
    const newCheckIn = addMinutes(booking.checkIn, minuteShift);
    const newCheckOut = addMinutes(booking.checkOut, minuteShift);

    const rowShift = Math.round(delta.y / ROW_HEIGHT);
    const currentIndex = propertyRooms.findIndex(r => r.id === booking.roomId);
    const newIndex = Math.max(0, Math.min(propertyRooms.length - 1, currentIndex + rowShift));
    const newRoomId = propertyRooms[newIndex].id;

    if (checkConflict(newRoomId, newCheckIn, newCheckOut, booking.id)) {
      setActiveConflictBookingId(booking.id);
    } else {
      setActiveConflictBookingId(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const booking = active.data.current?.booking;
    setActiveBooking(null);
    if (!booking) return;

    setActiveConflictBookingId(null);

    const minuteShift = Math.round(delta.x / (HOUR_WIDTH / 60));
    const newCheckIn = addMinutes(booking.checkIn, minuteShift);
    const newCheckOut = addMinutes(booking.checkOut, minuteShift);

    const rowShift = Math.round(delta.y / ROW_HEIGHT);
    const currentIndex = propertyRooms.findIndex(r => r.id === booking.roomId);
    const newIndex = Math.max(0, Math.min(propertyRooms.length - 1, currentIndex + rowShift));
    const newRoomId = propertyRooms[newIndex].id;

    updateBooking(booking.id, {
      roomId: newRoomId,
      checkIn: newCheckIn,
      checkOut: newCheckOut
    });
  };

  if (!mounted) return null;

  return (
    <DndContext 
      sensors={sensors} 
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={() => { setActiveConflictBookingId(null); setActiveBooking(null); }}
      collisionDetection={closestCorners}
    >
      <div className="flex flex-col h-full bg-background border rounded-xl overflow-hidden shadow-2xl">
        {/* Main Scrollable Container */}
        <div className="flex-1 overflow-auto relative custom-scrollbar">
          <div className="min-w-max flex flex-col">
            {/* 1. UNIFIED STICKY HEADER ROW */}
            <div className="sticky top-0 z-[50] flex flex-shrink-0">
              {/* Corner Spacer (Sticky Top & Left) */}
              <div 
                className="sticky left-0 z-[60] bg-slate-100 border-b border-r flex items-center justify-between px-4 h-[70px] flex-shrink-0"
                style={{ width: ROOM_COL_WIDTH }}
              >
                <span className="font-black uppercase tracking-tight text-slate-700">Phòng</span>
                <button 
                  onClick={() => {
                    const el = document.getElementById('now-indicator');
                    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                  }}
                  className="p-1.5 hover:bg-white rounded-lg text-primary transition-all shadow-sm border border-primary/10 group"
                  title="Về hiện tại"
                >
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                </button>
              </div>

              {/* Time Header (Sticky Top) */}
              <div className="flex-1 flex bg-white border-b h-[70px] flex-shrink-0">
                {timelineDays.map((day) => (
                  <div key={day.toISOString()} className="flex-shrink-0 flex flex-col" style={{ width: 24 * HOUR_WIDTH }}>
                    <div className="h-10 px-4 flex items-center text-[11px] font-black uppercase tracking-widest text-slate-500 bg-slate-50/50 border-b border-r">
                      {format(day, 'EEEE, dd/MM', { locale: vi })}
                    </div>
                    <div 
                      className="flex h-7 relative border-r"
                      style={{
                        backgroundImage: `
                          repeating-linear-gradient(to right, hsl(var(--muted-foreground) / 0.1) 0, hsl(var(--muted-foreground) / 0.1) 1px, transparent 1px, transparent ${HOUR_WIDTH}px),
                          repeating-linear-gradient(to right, hsl(var(--muted-foreground) / 0.05) 0, hsl(var(--muted-foreground) / 0.05) 1px, transparent 1px, transparent ${HOUR_WIDTH / 2}px)
                        `,
                      }}
                    >
                      {Array.from({ length: 24 }).map((_, h) => (
                        <div 
                          key={h} 
                          className="flex-shrink-0 h-full relative" 
                          style={{ width: HOUR_WIDTH }}
                        >
                          <span className={cn(
                            "absolute top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 bg-white/90 px-1.5 py-0.5 rounded-sm z-[45] whitespace-nowrap shadow-sm border border-slate-100 transition-all",
                            h === 0 ? "left-1 translate-x-0" : "left-0 -translate-x-1/2"
                          )}>
                            {h.toString().padStart(2, '0')}:00
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. TIMELINE BODY ROW */}
            <div className="flex flex-1">
              {/* Room Sidebar (Sticky Left) */}
              <div 
                className="sticky left-0 z-[40] bg-white border-r flex-shrink-0 flex flex-col shadow-[4px_0_10px_-4px_rgba(0,0,0,0.05)]" 
                style={{ width: ROOM_COL_WIDTH }}
              >
                {propertyRooms.map((room) => (
                  <div 
                    key={room.id} 
                    className="h-[80px] border-b px-4 flex flex-col justify-center gap-1 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2.5 h-2.5 rounded-full shadow-sm",
                        room.status === 'clean' ? "bg-green-500 shadow-green-100" : 
                        room.status === 'dirty' ? "bg-red-500 shadow-red-100" : "bg-amber-500 shadow-amber-100"
                      )} />
                      <span className="font-black text-sm tracking-tight text-slate-700 group-hover:text-primary transition-colors uppercase">{room.name}</span>
                      <Badge variant="secondary" className="ml-auto text-[8px] font-black uppercase tracking-tighter opacity-70">
                        {room.roomType}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400">
                      <div className="w-1 h-1 rounded-full bg-slate-300" />
                      Tầng {room.floor}
                    </div>
                  </div>
                ))}
              </div>

              {/* Grid & Bookings Content */}
              <div className="flex-1 relative bg-white">
                {/* Alternating row backgrounds */}
                {propertyRooms.map((room, i) => (
                  <div
                    key={room.id}
                    className="absolute left-0 right-0 pointer-events-none"
                    style={{
                      top: i * ROW_HEIGHT,
                      height: ROW_HEIGHT,
                      background: i % 2 === 0 ? 'rgba(248,250,252,0.8)' : 'rgba(255,255,255,0.8)',
                    }}
                  />
                ))}
                {/* Visual Grid Background */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: `
                      repeating-linear-gradient(to right, rgba(0,0,0,0.12) 0, rgba(0,0,0,0.12) 1px, transparent 1px, transparent ${HOUR_WIDTH}px),
                      repeating-linear-gradient(to right, rgba(0,0,0,0.05) 0, rgba(0,0,0,0.05) 1px, transparent 1px, transparent ${HOUR_WIDTH / 2}px),
                      repeating-linear-gradient(to bottom, rgba(0,0,0,0.1) 0, rgba(0,0,0,0.1) 1px, transparent 1px, transparent ${ROW_HEIGHT}px)
                    `,
                  }}
                />

                {/* Now Indicator */}
                <NowIndicator startDate={startDate} totalDays={daysToShow} />

                {/* Bookings Canvas */}
                <div className="relative z-10">
                  {propertyRooms.map((room) => (
                    <div key={room.id} className="h-[80px] relative">
                      {bookings
                        .filter((b) => b.roomId === room.id && b.status !== 'cancelled' && (!sourceFilter || sourceFilter.has(b.source)))
                        .map((booking) => (
                          <BookingBlock 
                            key={booking.id} 
                            booking={booking} 
                            startDate={startDate}
                            top={0} // Relative to row container
                            isConflict={activeConflictBookingId === booking.id}
                          />
                        ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeBooking && (
          <div 
            className="w-[120px] h-[40px] bg-primary/20 border-2 border-primary border-dashed rounded-lg"
            style={{ cursor: 'grabbing' }}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
};

const NowIndicator = ({ startDate, totalDays }: { startDate: Date, totalDays: number }) => {
  const [now, setNow] = React.useState(new Date());

  React.useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const posWithinDay = (hours + (minutes + seconds / 60) / 60) * HOUR_WIDTH;

  const timelineDays = Array.from({ length: totalDays }).map((_, i) => addDays(startOfDay(startDate), i));
  const dayIndex = timelineDays.findIndex(d => isSameDay(d, now));

  if (dayIndex === -1) return null;

  const left = dayIndex * 24 * HOUR_WIDTH + posWithinDay;

  return (
    <div 
      id="now-indicator"
      className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-[35] pointer-events-none"
      style={{ left }}
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-[0_0_10px_rgba(239,68,68,0.5)] flex items-center justify-center">
        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
      </div>
      
      <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-full shadow-xl whitespace-nowrap ring-2 ring-red-500/20">
        {format(now, 'HH:mm')}
      </div>
    </div>
  );
};
