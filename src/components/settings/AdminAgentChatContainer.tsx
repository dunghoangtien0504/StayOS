"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTimelineStore } from '@/store/useTimelineStore';
import { Sparkles, Send, Loader2, X, RefreshCw, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AddBookingModal } from '@/components/booking/AddBookingModal';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const QUICK_COMMANDS = [
  { label: 'Tạo đặt phòng nhanh', value: 'Tôi muốn tạo đặt phòng mới' },
  { label: 'Nhận phòng (Check-in)', value: 'Check-in cho khách' },
  { label: 'Trả phòng (Check-out)', value: 'Check-out cho khách' },
  { label: 'Ghi chép chi phí điện', value: 'Ghi chép chi phí điện tháng này' },
  { label: 'Báo phòng sạch', value: 'Báo phòng đã dọn sạch xong' },
];

interface AdminAgentChatProps {
  onClose?: () => void;
}

export function AdminAgentChat({ onClose }: AdminAgentChatProps) {
  const store = useTimelineStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Xin chào! Tôi là trợ lý quản lý của Ta Thong Dong Homestay.\n\nBạn cần tôi hỗ trợ tác vụ nào cho tôi (ví dụ: tạo đặt phòng, check-in/out, ghi chép chi phí, đổi trạng thái dọn dẹp phòng). Tôi sẽ xử lý và hiển thị mẫu xác nhận ngay lập tức!',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<Record<string, unknown> | null>(null);
  const [isAddBookingOpen, setIsAddBookingOpen] = useState(false);
  const [addBookingDefaults, setAddBookingDefaults] = useState<{
    guestName?: string;
    guestPhone?: string;
    checkIn?: Date;
    checkOut?: Date;
    roomId?: string;
  }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const buildSystemPrompt = useCallback(() => {
    const { bookings, rooms, properties, guests } = store;
    const today = new Date().toLocaleDateString('vi-VN');
    const todayISO = new Date().toISOString().split('T')[0];

    const todayCheckIns = bookings.filter(b =>
      b.checkIn.toISOString().split('T')[0] === todayISO && b.status === 'confirmed'
    );
    const todayCheckOuts = bookings.filter(b =>
      b.checkOut.toISOString().split('T')[0] === todayISO && b.status === 'checked_in'
    );

    return `Bạn là trợ lý quản lý nội bộ của Ta Thong Dong Homestay (dành cho chủ nhà, KHÔNG phải khách).

QUYỀN HẠN: Toàn quyền — tạo/sửa booking, check-in/out, ghi chi phí, quản lý phòng, xem báo cáo.

NGÀY HÔM NAY: ${today}
CHECK-IN HÔM NAY: ${todayCheckIns.map(b => `${b.guestName} (${rooms.find(r=>r.id===b.roomId)?.name||b.roomId})`).join(', ') || 'Không có'}
CHECK-OUT HÔM NAY: ${todayCheckOuts.map(b => `${b.guestName} (${rooms.find(r=>r.id===b.roomId)?.name||b.roomId})`).join(', ') || 'Không có'}

CƠ SỞ: ${properties.map(p => p.name).join(', ')}
PHÒNG: ${rooms.map(r => `${r.name}(${r.roomType},${r.status},${r.basePrice.toLocaleString()}đ)`).join(' | ')}

BOOKING GẦN NHẤT:
${bookings.slice(0, 8).map(b => {
  const r = rooms.find(r => r.id === b.roomId);
  return `- ${b.guestName} | ${r?.name||b.roomId} | ${b.checkIn.toLocaleDateString('vi-VN')}→${b.checkOut.toLocaleDateString('vi-VN')} | ${b.status}`;
}).join('\n')}

KHÁCH GẦN NHẤT: ${guests.slice(0, 5).map(g => `${g.name}(${g.phone})`).join(', ')}

HƯỚNG DẪN:
- Khi tạo booking: trả về JSON với action:"create_booking" và đầy đủ fields
- Khi check-in/out: trả về JSON với action:"checkin"|"checkout" và bookingId
- Hỏi thêm thông tin nếu thiếu. Luôn xác nhận trước khi thực hiện.
- Trả lời ngắn gọn, chính xác, bằng tiếng Việt.

KHI CẦN THỰC HIỆN HÀNH ĐỘNG, thêm JSON block ở cuối:
ACTION_JSON:{"action":"create_booking","guestName":"...","guestPhone":"...","checkIn":"YYYY-MM-DD","checkOut":"YYYY-MM-DD","roomId":"...","totalPrice":...}
hoặc:
ACTION_JSON:{"action":"checkin","bookingId":"..."}
hoặc:
ACTION_JSON:{"action":"checkout","bookingId":"..."}`;
  }, [store]);

  const handleSend = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || isLoading) return;
    setInput('');

    const userMsg: Message = { role: 'user', content: msg, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const history = messages.slice(-8).map(m => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          history,
          system: buildSystemPrompt(),
        }),
      });
      const data = await res.json();
      const reply: string = data.reply || 'Xin lỗi, tôi không thể xử lý yêu cầu này lúc này.';

      // Parse ACTION_JSON if present
      const actionMatch = reply.match(/ACTION_JSON:(\{[^}]+\})/);
      let cleanReply = reply.replace(/\s*ACTION_JSON:\{[^}]+\}/, '').trim();
      if (actionMatch) {
        try {
          const action = JSON.parse(actionMatch[1]);
          setPendingAction(action);
          if (action.action === 'create_booking') {
            cleanReply += '\n\n👆 Nhấn "Xác nhận" để tạo booking này.';
          }
        } catch {
          // ignore parse error
        }
      }

      setMessages(prev => [...prev, { role: 'assistant', content: cleanReply, timestamp: new Date() }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Lỗi kết nối đến AI. Vui lòng thử lại.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleConfirmAction = () => {
    if (!pendingAction) return;
    const action = pendingAction as Record<string, unknown>;

    if (action.action === 'create_booking') {
      const checkIn = action.checkIn ? new Date(action.checkIn as string) : undefined;
      const checkOut = action.checkOut ? new Date(action.checkOut as string) : undefined;
      setAddBookingDefaults({
        guestName: action.guestName as string,
        guestPhone: action.guestPhone as string,
        checkIn,
        checkOut,
        roomId: action.roomId as string,
      });
      setIsAddBookingOpen(true);
    } else if (action.action === 'checkin' && action.bookingId) {
      store.checkInBooking(action.bookingId as string);
      setMessages(prev => [...prev, { role: 'assistant', content: '✅ Đã check-in thành công!', timestamp: new Date() }]);
    } else if (action.action === 'checkout' && action.bookingId) {
      store.checkOutBooking(action.bookingId as string);
      setMessages(prev => [...prev, { role: 'assistant', content: '✅ Đã check-out thành công!', timestamp: new Date() }]);
    }

    setPendingAction(null);
  };

  const handleReset = () => {
    setMessages([{
      role: 'assistant',
      content: 'Xin chào! Bạn cần hỗ trợ gì?',
      timestamp: new Date(),
    }]);
    setPendingAction(null);
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0D2B1A] text-white shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center">
            <Bot size={16} className="text-primary" />
          </div>
          <div>
            <p className="text-[13px] font-semibold leading-tight">Agent Ta Thong Dong</p>
            <p className="text-[10px] text-white/50">PMS Administrative AI Agent</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">Trợ lý ảo</span>
          <button onClick={handleReset} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors" title="Cuộc hội thoại mới">
            <RefreshCw size={14} className="text-white/60" />
          </button>
          {onClose && (
            <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors ml-1">
              <X size={14} className="text-white/60" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8f9fa]">
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-[#0D2B1A] flex items-center justify-center mr-2 mt-0.5 shrink-0">
                <Sparkles size={12} className="text-primary" />
              </div>
            )}
            <div className={cn(
              "max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed whitespace-pre-wrap",
              msg.role === 'user'
                ? "bg-primary text-white rounded-tr-sm"
                : "bg-white text-gray-800 rounded-tl-sm border border-gray-100 shadow-sm"
            )}>
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#0D2B1A] flex items-center justify-center shrink-0">
              <Sparkles size={12} className="text-primary" />
            </div>
            <div className="bg-white px-3.5 py-2.5 rounded-2xl rounded-tl-sm border border-gray-100 shadow-sm">
              <Loader2 size={14} className="text-primary animate-spin" />
            </div>
          </div>
        )}

        {pendingAction && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between gap-3">
            <p className="text-[12px] text-amber-800 font-medium">Xác nhận thực hiện hành động này?</p>
            <div className="flex gap-1.5 shrink-0">
              <button onClick={() => setPendingAction(null)} className="px-2.5 py-1 text-[11px] bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
                Hủy
              </button>
              <button onClick={handleConfirmAction} className="px-2.5 py-1 text-[11px] bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                Xác nhận
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick commands */}
      <div className="px-3 py-2 border-t bg-white">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">ĐỀ XUẤT RA LỆNH MẪU</p>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_COMMANDS.map((cmd) => (
            <button
              key={cmd.label}
              onClick={() => handleSend(cmd.value)}
              disabled={isLoading}
              className="flex items-center gap-1 px-2.5 py-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full text-[11px] text-gray-600 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {cmd.label} →
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        className="flex items-center gap-2 px-3 py-2.5 border-t bg-white"
      >
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Nhập yêu cầu quản trị hoặc dán thông tin đặt p..."
          className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[13px] text-gray-700 outline-none focus:border-primary/50 focus:bg-white transition-all placeholder:text-gray-400"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center disabled:opacity-40 hover:bg-primary/90 transition-colors shrink-0"
        >
          {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        </button>
      </form>

      <AddBookingModal
        isOpen={isAddBookingOpen}
        onClose={() => setIsAddBookingOpen(false)}
        initialGuestName={addBookingDefaults.guestName}
        initialGuestPhone={addBookingDefaults.guestPhone}
      />
    </>
  );
}
