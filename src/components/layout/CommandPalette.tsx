"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTimelineStore } from '@/store/useTimelineStore';
import { Search, BookOpen, Users, Home, Calendar, X, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Result {
  id: string;
  type: 'booking' | 'guest' | 'room' | 'page';
  label: string;
  sub: string;
  href: string;
  icon: React.ReactNode;
}

const PAGES = [
  { label: 'Tổng quan', href: '/', icon: <Home size={15} /> },
  { label: 'Lịch đặt phòng', href: '/bookings/timeline', icon: <Calendar size={15} /> },
  { label: 'Danh sách booking', href: '/bookings/table', icon: <BookOpen size={15} /> },
  { label: 'Khách hàng', href: '/guests', icon: <Users size={15} /> },
];

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { bookings, guests, rooms } = useTimelineStore();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (open) { setQuery(''); setActiveIdx(0); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [open]);

  const results: Result[] = useCallback(() => {
    if (!query.trim()) {
      return PAGES.map(p => ({ id: p.href, type: 'page' as const, label: p.label, sub: p.href, href: p.href, icon: p.icon }));
    }
    const q = query.toLowerCase();
    const bookingMatches = bookings
      .filter(b => b.guestName.toLowerCase().includes(q) || b.guestPhone.includes(q) || b.id.includes(q))
      .slice(0, 5)
      .map(b => {
        const room = rooms.find(r => r.id === b.roomId);
        return {
          id: b.id, type: 'booking' as const,
          label: b.guestName,
          sub: `${room?.name ?? ''} · ${format(b.checkIn, 'dd/MM/yyyy')} → ${format(b.checkOut, 'dd/MM/yyyy')}`,
          href: `/bookings/table?focus=${b.id}`,
          icon: <BookOpen size={15} />,
        };
      });
    const guestMatches = guests
      .filter(g => g.name.toLowerCase().includes(q) || g.phone.includes(q) || (g.idCard ?? '').includes(q))
      .slice(0, 3)
      .map(g => ({
        id: g.id, type: 'guest' as const,
        label: g.name,
        sub: g.phone + (g.nationality ? ` · ${g.nationality}` : ''),
        href: `/guests`,
        icon: <Users size={15} />,
      }));
    const roomMatches = rooms
      .filter(r => r.name.toLowerCase().includes(q) || r.roomType.toLowerCase().includes(q))
      .slice(0, 2)
      .map(r => ({
        id: r.id, type: 'room' as const,
        label: r.name,
        sub: `${r.roomType} · Tầng ${r.floor} · ${r.basePrice.toLocaleString('vi-VN')}đ/đêm`,
        href: `/settings/properties`,
        icon: <Home size={15} />,
      }));
    return [...bookingMatches, ...guestMatches, ...roomMatches];
  }, [query, bookings, guests, rooms])();

  const go = (result: Result) => {
    router.push(result.href);
    onClose();
  };

  useEffect(() => { setActiveIdx(0); }, [query]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && results[activeIdx]) go(results[activeIdx]);
    if (e.key === 'Escape') onClose();
  };

  if (!open) return null;

  const typeLabel = { booking: 'Booking', guest: 'Khách', room: 'Phòng', page: 'Trang' };
  const typeBg = { booking: 'bg-blue-100 text-blue-600', guest: 'bg-green-100 text-green-600', room: 'bg-amber-100 text-amber-600', page: 'bg-muted text-muted-foreground' };

  return (
    <div className="fixed inset-0 z-[300] flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden border">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <Search size={18} className="text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Tìm booking, khách hàng, phòng..."
            className="flex-1 bg-transparent outline-none text-base font-medium placeholder:text-muted-foreground/60"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-muted-foreground hover:text-foreground">
              <X size={15} />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-bold text-muted-foreground bg-muted">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {results.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Không tìm thấy kết quả</div>
          ) : (
            <div className="py-1.5">
              {!query && <div className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Điều hướng nhanh</div>}
              {results.map((r, i) => (
                <button
                  key={r.id + r.type}
                  onClick={() => go(r)}
                  onMouseEnter={() => setActiveIdx(i)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                    activeIdx === i ? 'bg-primary/[0.08] text-foreground' : 'hover:bg-muted/40'
                  )}
                >
                  <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', typeBg[r.type])}>
                    {r.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold truncate">{r.label}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{r.sub}</div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded', typeBg[r.type])}>
                      {typeLabel[r.type]}
                    </span>
                    {activeIdx === i && <ArrowRight size={13} className="text-muted-foreground" />}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t bg-muted/30 flex items-center gap-4 text-[11px] text-muted-foreground">
          <span><kbd className="font-bold">↑↓</kbd> điều hướng</span>
          <span><kbd className="font-bold">↵</kbd> mở</span>
          <span><kbd className="font-bold">ESC</kbd> đóng</span>
        </div>
      </div>
    </div>
  );
}
