"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useTimelineStore } from '@/store/useTimelineStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Send,
  Bot,
  User,
  Sparkles,
  AlertCircle,
  Check,
  X,
  RefreshCw,
  Calendar,
  DollarSign,
  Activity,
  FileText,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { calculateBookingTotal, getRoomTier, detectSlot, SLOT_LABEL } from '@/lib/pricing';
import { BookingSource, RoomStatus, ExpenseCategory } from '@/lib/types';
import { cn } from '@/lib/utils';

// Interfaces for structured AI actions
interface ParsedAction {
  action: 'ADD_BOOKING' | 'CHECK_IN' | 'CHECK_OUT' | 'ADD_EXPENSE' | 'UPDATE_ROOM_STATUS';
  data: any;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  action?: ParsedAction;
  actionExecuted?: boolean;
  actionError?: string;
}

// Custom prompt compilation
function compileSystemPrompt(state: any) {
  const now = new Date();
  const rooms = state.rooms;
  const properties = state.properties;
  const bookings = state.bookings;

  // Format rooms list
  const roomsText = rooms.map((r: any) => {
    const prop = properties.find((p: any) => p.id === r.propertyId);
    return `- Phòng ID: "${r.id}", Tên: "${r.name}", Hạng: "${r.roomType}", Tầng: ${r.floor}, Giá cơ bản: ${r.basePrice.toLocaleString('vi-VN')}đ, Cơ sở: "${prop?.name || r.propertyId}" (ID: "${r.propertyId}")`;
  }).join('\n');

  // Format properties list
  const propertiesText = properties.map((p: any) => {
    return `- Cơ sở ID: "${p.id}", Tên: "${p.name}", Địa chỉ: "${p.address}"`;
  }).join('\n');

  // Format upcoming active bookings (next 30 days) to prevent conflict
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + 30);
  const activeBookings = bookings.filter((b: any) => {
    if (b.status === 'cancelled' || b.status === 'no_show') return false;
    const checkOutDate = new Date(b.checkOut);
    const checkInDate = new Date(b.checkIn);
    return checkOutDate >= now && checkInDate <= cutoff;
  });

  const bookingsText = activeBookings.map((b: any) => {
    const roomName = rooms.find((r: any) => r.id === b.roomId)?.name || b.roomId;
    return `- Booking ID: "${b.id}", Khách: "${b.guestName}" (${b.guestPhone || 'Không SĐT'}), Phòng: "${roomName}" (RoomID: "${b.roomId}"), Check-in: ${new Date(b.checkIn).toISOString()}, Check-out: ${new Date(b.checkOut).toISOString()}, Trạng thái: "${b.status}"`;
  }).join('\n');

  return `Bạn là "Trợ lý Agent Ta Thong Dong", trợ lý AI quản lý thông minh của chuỗi homestay "Ta Thong Dong Homestay".
Bạn đang tích hợp trực tiếp vào trang quản trị (Admin Dashboard) của StayOS PMS.
Nhiệm vụ của bạn là hỗ trợ người quản lý (Admin) thực hiện các tác vụ nhanh bằng tiếng Việt thông qua hội thoại.
Thời gian hệ thống hiện tại là: ${now.toString()} (ngày ${format(now, 'dd/MM/yyyy')}, thứ ${now.getDay() === 0 ? 'Chủ Nhật' : now.getDay() + 1}).

Quy tắc cốt lõi:
1. Bạn có thể giải đáp thông tin về các phòng, giá phòng, lịch bận/trống, chính sách.
2. Nếu người dùng muốn thực hiện một hành động quản trị (vd: tạo đặt phòng mới, check-in, check-out, thêm chi phí, thay đổi trạng thái dọn phòng), hãy trả lời bằng văn bản giải thích và BẮT BUỘC append một khối mã JSON hành động ở CUỐI CÙNG tin nhắn của bạn. Khối mã JSON này phải nằm trong cặp thẻ dấu ngã \`\`\`json ... \`\`\`.

Định dạng khối JSON hành động (Action Blocks):

A. TẠO ĐẶT PHÒNG (ADD_BOOKING):
Nếu người dùng cung cấp thông tin đặt phòng (vd: copy từ Zalo/Facebook, hoặc gõ trực tiếp), hãy phân tích tên khách, số điện thoại, ngày nhận phòng, ngày trả phòng, và hạng phòng (Deluxe hoặc VIP). Chọn một phòng còn trống cùng loại (kiểm tra danh sách booking hiện có để tránh trùng) và tính giá dựa trên pricing rule. Trả về:
\`\`\`json
{
  "action": "ADD_BOOKING",
  "data": {
    "guestName": "Tên khách",
    "guestPhone": "Số điện thoại",
    "roomId": "roomId chọn được (ví dụ: r101)",
    "propertyId": "p1",
    "checkIn": "YYYY-MM-DDTHH:mm:ss.sssZ (ISO 8601)",
    "checkOut": "YYYY-MM-DDTHH:mm:ss.sssZ (ISO 8601)",
    "source": "zalo" | "facebook" | "direct" (mặc định nếu không rõ),
    "status": "confirmed",
    "totalPrice": 699000, (tổng tiền tính toán được),
    "amountPaid": 0
  }
}
\`\`\`
Lưu ý tính giá cho phòng Deluxe (r101, r102, r302) và VIP (r201, r202, r301) theo các khung giờ (ví dụ: Theo giờ 3-4h, Buổi sáng 6h-11h, Qua đêm combo 3 21h-11h, Combo 4 14h-11h, Ngày 11h-18h, v.v.). Xem thông tin bảng giá chi tiết trong tri thức.

B. NHẬN PHÒNG (CHECK_IN):
Khi được yêu cầu nhận phòng hoặc check-in cho một phòng hoặc một khách nhất định:
\`\`\`json
{
  "action": "CHECK_IN",
  "data": {
    "roomId": "r101",
    "guestName": "Tên khách nếu có"
  }
}
\`\`\`

C. TRẢ PHÒNG (CHECK_OUT):
Khi được yêu cầu trả phòng hoặc check-out:
\`\`\`json
{
  "action": "CHECK_OUT",
  "data": {
    "roomId": "r101",
    "guestName": "Tên khách nếu có"
  }
}
\`\`\`

D. THÊM CHI PHÍ (ADD_EXPENSE):
Khi được yêu cầu ghi nhận chi phí (ví dụ: tiền điện, nước, sửa chữa...):
\`\`\`json
{
  "action": "ADD_EXPENSE",
  "data": {
    "amount": 1500000,
    "category": "electricity" | "water" | "laundry" | "salary" | "maintenance" | "other",
    "note": "Mô tả chi phí",
    "propertyId": "p1"
  }
}
\`\`\`

E. CẬP NHẬT DỌN PHÒNG (UPDATE_ROOM_STATUS):
Khi được yêu cầu thay đổi trạng thái dọn dẹp của phòng (vd: phòng 101 dọn xong rồi, phòng 202 bị dơ):
\`\`\`json
{
  "action": "UPDATE_ROOM_STATUS",
  "data": {
    "roomId": "roomId cần đổi",
    "status": "clean" | "dirty" | "cleaning"
  }
}
\`\`\`

Danh sách Cơ sở:
${propertiesText}

Danh sách Phòng hiện có:
${roomsText}

Lịch đặt phòng sắp tới (30 ngày gần đây để tham chiếu trống/trùng phòng):
${bookingsText || '- Chưa có đặt phòng nào trong 30 ngày tới.'}

Khi trả lời hội thoại, hãy cực kỳ thông minh, chính xác, lịch sự và thân thiện. Nếu phát hiện yêu cầu trùng phòng (conflict), hãy báo ngay cho người dùng và đề xuất phòng khác trống.`;
}

interface AdminAgentChatProps {
  onClose?: () => void;
}

export const AdminAgentChat = ({ onClose }: AdminAgentChatProps) => {
  const store = useTimelineStore();
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('stayos_agent_chat_history');
      if (saved) {
        try {
          const { timestamp, messages: savedMessages } = JSON.parse(saved);
          const ageInMinutes = (Date.now() - timestamp) / (60 * 1000);
          if (ageInMinutes < 60 && Array.isArray(savedMessages) && savedMessages.length > 0) {
            return savedMessages;
          }
        } catch (e) {
          console.error('Lỗi load chat history từ localStorage:', e);
        }
      }
    }
    return [
      {
        id: 'welcome',
        role: 'assistant',
        content: 'Xin chào! Tôi là **Trợ lý Agent Ta Thong Dong**. Bạn có thể gửi thông tin đặt phòng copy từ khách hàng hoặc ra bất kỳ lệnh quản trị nào cho tôi (ví dụ: tạo đặt phòng, check-in/out, ghi chép chi phí, đổi trạng thái dọn dẹp phòng). Tôi sẽ xử lý và hiển thị mẫu xác nhận ngay lập tức!'
      }
    ];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync messages to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      localStorage.setItem('stayos_agent_chat_history', JSON.stringify({
        timestamp: Date.now(),
        messages
      }));
    }
  }, [messages]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Extract action blocks from assistant response
  const parseAIResponse = (text: string): { cleanText: string; action?: ParsedAction } => {
    const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
    const match = text.match(jsonRegex);
    
    if (match && match[1]) {
      try {
        const actionObj = JSON.parse(match[1].trim());
        const cleanText = text.replace(jsonRegex, '').trim();
        return { cleanText, action: actionObj };
      } catch (e) {
        console.error('Lỗi parse JSON hành động từ AI:', e);
      }
    }
    return { cleanText: text };
  };

  // Handle message send
  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    if (!textToSend) setInput('');

    // Append user message
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: query
    };
    
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({
          role: m.role,
          content: m.content
        }));

      // Dynamic system prompt containing updated homestay state
      const systemPrompt = compileSystemPrompt(store);

      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: query,
          history,
          system: systemPrompt
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi hệ thống');
      }

      const rawReply = data.reply || '';
      const { cleanText, action } = parseAIResponse(rawReply);

      const assistantMsg: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: cleanText || 'Tôi đã xử lý lệnh của bạn.',
        action
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error('Lỗi khi gọi Agent API:', error);
      const errorMsg: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: `❌ Lỗi: Không thể kết nối với Agent AI (${error instanceof Error ? error.message : 'Lỗi không xác định'}). Vui lòng thử lại.`
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Execution actions
  const executeAction = (msgId: string, action: ParsedAction) => {
    try {
      switch (action.action) {
        case 'ADD_BOOKING': {
          const { guestName, guestPhone, roomId, propertyId, checkIn, checkOut, source, totalPrice, amountPaid } = action.data;
          const room = store.rooms.find(r => r.id === roomId);
          
          // Revalidate checks
          const cIn = new Date(checkIn);
          const cOut = new Date(checkOut);
          
          const hasConflict = store.checkConflict(roomId, cIn, cOut);
          if (hasConflict) {
            throw new Error(`Phòng này đã bị trùng lịch trùng trong thời gian trên.`);
          }

          const finalTotalPrice = (totalPrice && totalPrice > 0)
            ? totalPrice
            : (room ? calculateBookingTotal(room, cIn, cOut) : 0);

          const newBookingId = store.addBooking({
            guestName,
            guestPhone: guestPhone || '',
            roomId,
            propertyId,
            checkIn: cIn,
            checkOut: cOut,
            source: source || 'direct',
            status: amountPaid > 0 ? 'deposited' : 'confirmed',
            totalPrice: finalTotalPrice,
            amountPaid: amountPaid || 0
          });

          if (!newBookingId) {
            throw new Error('Hệ thống từ chối tạo booking do trùng lịch.');
          }

          break;
        }
        case 'CHECK_IN': {
          const { bookingId } = action.data;
          const success = store.checkInBooking(bookingId);
          if (!success) {
            throw new Error('Không thể check-in. Vui lòng kiểm tra lại trạng thái phòng (phải ở trạng thái SẠCH).');
          }
          break;
        }
        case 'CHECK_OUT': {
          const { bookingId } = action.data;
          store.checkOutBooking(bookingId);
          break;
        }
        case 'ADD_EXPENSE': {
          const { amount, category, note, propertyId } = action.data;
          store.addExpense({
            amount: parseFloat(amount) || 0,
            category: category || 'other',
            note: note || '',
            propertyId,
            date: new Date()
          });
          break;
        }
        case 'UPDATE_ROOM_STATUS': {
          const { roomId, status } = action.data;
          store.updateRoomStatus(roomId, status as RoomStatus);
          break;
        }
      }

      // Mark action as executed successfully
      setMessages(prev => prev.map(m => {
        if (m.id === msgId) {
          return { ...m, actionExecuted: true, actionError: undefined };
        }
        return m;
      }));

      // Add positive system feedback
      const successFeedback: Message = {
        id: `sys-${Date.now()}`,
        role: 'assistant',
        content: `🎉 **Đã thực thi thành công tác vụ!** Các trạng thái trên StayOS đã được cập nhật thời gian thực.`
      };
      setMessages(prev => [...prev, successFeedback]);

    } catch (err) {
      console.error('Lỗi khi thực thi action:', err);
      setMessages(prev => prev.map(m => {
        if (m.id === msgId) {
          return { ...m, actionExecuted: false, actionError: err instanceof Error ? err.message : 'Lỗi bất ngờ' };
        }
        return m;
      }));
    }
  };

  // Helper renderer for action cards
  const renderActionCard = (msgId: string, action: ParsedAction, executed?: boolean, error?: string) => {
    switch (action.action) {
      case 'ADD_BOOKING': {
        const { guestName, guestPhone, roomId, checkIn, checkOut, source, totalPrice } = action.data;
        const room = store.rooms.find(r => r.id === roomId);
        const property = store.properties.find(p => p.id === (action.data.propertyId || 'p1'));
        
        const cIn = new Date(checkIn);
        const cOut = new Date(checkOut);
        
        const hasConflict = store.checkConflict(roomId, cIn, cOut);
        const calculatedTotal = (totalPrice && totalPrice > 0) ? totalPrice : (room ? calculateBookingTotal(room, cIn, cOut) : 0);
        const slot = detectSlot(cIn, cOut);

        return (
          <Card className="border-l-4 border-l-orange-500 overflow-hidden shadow-md mt-2">
            <CardHeader className="bg-orange-50/50 py-3 px-4">
              <CardTitle className="text-sm font-black flex items-center gap-2 text-orange-800">
                <Calendar size={16} /> XÁC NHẬN TẠO ĐẶT PHÒNG
              </CardTitle>
              <CardDescription className="text-[11px] font-medium text-orange-700">Xem trước thông tin phân tích bởi Agent</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 font-semibold">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase">Khách hàng</span>
                  <span className="text-foreground text-sm font-black">{guestName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase">Số điện thoại</span>
                  <span className="text-foreground text-sm font-black">{guestPhone || '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase">Phòng đề xuất</span>
                  <span className="text-foreground text-sm font-black">{room?.name || roomId} ({room?.roomType || 'Deluxe'})</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase">Khung giờ thuê</span>
                  <span className="text-foreground font-black text-primary">{SLOT_LABEL[slot] || slot}</span>
                </div>
                <div className="col-span-2 border-t pt-2 grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase">Check-in</span>
                    <span>{format(cIn, 'HH:mm · dd/MM/yyyy')}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase">Check-out</span>
                    <span>{format(cOut, 'HH:mm · dd/MM/yyyy')}</span>
                  </div>
                </div>
                <div className="col-span-2 border-t pt-2 flex items-center justify-between">
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase">Tổng tiền (Tạm tính)</span>
                    <span className="text-lg font-black text-orange-600">{(calculatedTotal || 0).toLocaleString('vi-VN')} đ</span>
                  </div>
                  <Badge variant="outline" className="capitalize">{source}</Badge>
                </div>
              </div>

              {hasConflict && !executed && (
                <div className="flex gap-2 items-start p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 font-bold">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <div>
                    <div>Cảnh báo: Trùng lịch!</div>
                    <div className="text-[10px] font-normal text-rose-600 mt-0.5">Phòng này đã có khách đặt trong khoảng thời gian đã chọn.</div>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex gap-2 items-center p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 font-bold">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>Lỗi: {error}</span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                {executed ? (
                  <Button disabled className="w-full bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl py-2 shadow-sm flex items-center justify-center gap-1.5">
                    <Check size={15} /> ĐÃ TẠO ĐẶT PHÒNG
                  </Button>
                ) : (
                  <>
                    <Button 
                      onClick={() => executeAction(msgId, action)}
                      disabled={hasConflict}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-xl py-2 shadow-sm"
                    >
                      Xác nhận & Tạo đặt phòng
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setMessages(prev => prev.filter(m => m.id !== msgId))}
                      className="rounded-xl border font-bold"
                    >
                      Bỏ qua
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        );
      }
      case 'CHECK_IN':
      case 'CHECK_OUT': {
        const isCheckIn = action.action === 'CHECK_IN';
        const { roomId, guestName } = action.data;
        const room = store.rooms.find(r => r.id === roomId || r.name === roomId);
        
        // Find matching booking
        let booking: any = null;
        if (room) {
          booking = store.bookings.find(b => {
            if (isCheckIn) {
              return b.roomId === room.id && (b.status === 'confirmed' || b.status === 'deposited');
            } else {
              return b.roomId === room.id && b.status === 'checked_in';
            }
          });
        }

        const fallbackName = guestName || booking?.guestName || 'Khách lưu trú';

        return (
          <Card className={cn("border-l-4 overflow-hidden shadow-md mt-2", isCheckIn ? "border-l-blue-500" : "border-l-slate-700")}>
            <CardHeader className={cn("py-3 px-4", isCheckIn ? "bg-blue-50/50 text-blue-800" : "bg-slate-50 text-slate-800")}>
              <CardTitle className="text-sm font-black flex items-center gap-2">
                <Activity size={16} /> {isCheckIn ? 'XÁC NHẬN CHECK-IN (NHẬN PHÒNG)' : 'XÁC NHẬN CHECK-OUT (TRẢ PHÒNG)'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              {!booking && !executed ? (
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-700 font-bold flex gap-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <div>
                    Không tìm thấy booking phù hợp ở trạng thái {isCheckIn ? 'chưa nhận phòng' : 'đang ở'} cho phòng {room?.name || roomId}.
                    <p className="font-normal text-[10px] text-amber-600 mt-1">Vui lòng kiểm tra lại tình trạng trên Timeline.</p>
                  </div>
                </div>
              ) : (
                <div className="font-semibold space-y-1">
                  <div><span className="text-muted-foreground text-[10px] uppercase">Phòng:</span> {room?.name || roomId}</div>
                  <div><span className="text-muted-foreground text-[10px] uppercase">Khách hàng:</span> {fallbackName}</div>
                  {booking && (
                    <>
                      <div><span className="text-muted-foreground text-[10px] uppercase">Thời gian thuê:</span> {format(new Date(booking.checkIn), 'dd/MM')} – {format(new Date(booking.checkOut), 'dd/MM')}</div>
                      {!isCheckIn && (
                        <div className="text-rose-600 font-black"><span className="text-muted-foreground text-[10px] uppercase block">Tổng thanh toán:</span> {booking.totalPrice.toLocaleString('vi-VN')} đ (Đã trả: {booking.amountPaid.toLocaleString('vi-VN')} đ)</div>
                      )}
                    </>
                  )}
                </div>
              )}

              {error && (
                <div className="flex gap-2 items-center p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 font-bold">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>Lỗi: {error}</span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                {executed ? (
                  <Button disabled className="w-full bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl py-2 shadow-sm flex items-center justify-center gap-1.5">
                    <Check size={15} /> ĐÃ THỰC THI THÀNH CÔNG
                  </Button>
                ) : (
                  <>
                    <Button 
                      onClick={() => executeAction(msgId, { action: action.action, data: { bookingId: booking?.id || '' } })}
                      disabled={!booking}
                      className={cn("flex-1 text-white font-black rounded-xl py-2 shadow-sm", isCheckIn ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-800 hover:bg-slate-900")}
                    >
                      {isCheckIn ? 'Xác nhận Nhận phòng' : 'Xác nhận Trả phòng'}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setMessages(prev => prev.filter(m => m.id !== msgId))}
                      className="rounded-xl border font-bold"
                    >
                      Hủy
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        );
      }
      case 'ADD_EXPENSE': {
        const { amount, category, note } = action.data;
        
        const categoryLabels: Record<string, string> = {
          electricity: '⚡ Tiền điện',
          water: '💧 Tiền nước',
          laundry: '🧺 Giặt là',
          salary: '👤 Lương nhân viên',
          maintenance: '🛠 Sửa chữa / Bảo trì',
          other: '📦 Chi phí khác'
        };

        return (
          <Card className="border-l-4 border-l-rose-500 overflow-hidden shadow-md mt-2">
            <CardHeader className="bg-rose-50/50 py-3 px-4">
              <CardTitle className="text-sm font-black flex items-center gap-2 text-rose-800">
                <DollarSign size={16} /> XÁC NHẬN GHI CHI PHÍ
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="font-semibold grid grid-cols-2 gap-3">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase">Khoản chi</span>
                  <span className="text-foreground text-sm font-black">{categoryLabels[category] || category}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase">Số tiền chi</span>
                  <span className="text-rose-600 text-sm font-black">{(parseFloat(amount) || 0).toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground block text-[10px] uppercase">Ghi chú chi tiết</span>
                  <span className="text-foreground">{note || 'Không có ghi chú'}</span>
                </div>
              </div>

              {error && (
                <div className="flex gap-2 items-center p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 font-bold">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>Lỗi: {error}</span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                {executed ? (
                  <Button disabled className="w-full bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl py-2 shadow-sm flex items-center justify-center gap-1.5">
                    <Check size={15} /> ĐÃ GHI NHẬN CHI PHÍ
                  </Button>
                ) : (
                  <>
                    <Button 
                      onClick={() => executeAction(msgId, action)}
                      className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl py-2 shadow-sm"
                    >
                      Xác nhận chi
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setMessages(prev => prev.filter(m => m.id !== msgId))}
                      className="rounded-xl border font-bold"
                    >
                      Hủy
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        );
      }
      case 'UPDATE_ROOM_STATUS': {
        const { roomId, status } = action.data;
        const room = store.rooms.find(r => r.id === roomId || r.name === roomId);
        
        const statusLabels: Record<RoomStatus, string> = {
          clean: '🟢 Sạch sẽ (Sẵn sàng đón khách)',
          dirty: '🔴 Phòng dơ (Cần dọn dẹp)',
          cleaning: '🟡 Đang dọn dẹp'
        };

        const targetRoomId = room?.id || roomId;

        return (
          <Card className="border-l-4 border-l-teal-500 overflow-hidden shadow-md mt-2">
            <CardHeader className="bg-teal-50/50 py-3 px-4">
              <CardTitle className="text-sm font-black flex items-center gap-2 text-teal-800">
                <Activity size={16} /> XÁC NHẬN CẬP NHẬT DỌN PHÒNG
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="font-semibold grid grid-cols-2 gap-3">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase">Phòng</span>
                  <span className="text-foreground text-sm font-black">{room?.name || roomId}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase">Trạng thái mới</span>
                  <span className="text-foreground text-sm font-black">{statusLabels[status as RoomStatus] || status}</span>
                </div>
              </div>

              {error && (
                <div className="flex gap-2 items-center p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 font-bold">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>Lỗi: {error}</span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                {executed ? (
                  <Button disabled className="w-full bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl py-2 shadow-sm flex items-center justify-center gap-1.5">
                    <Check size={15} /> ĐÃ ĐỔI TRẠNG THÁI PHÒNG
                  </Button>
                ) : (
                  <>
                    <Button 
                      onClick={() => executeAction(msgId, { action: 'UPDATE_ROOM_STATUS', data: { roomId: targetRoomId, status } })}
                      className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-xl py-2 shadow-sm"
                    >
                      Xác nhận đổi
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setMessages(prev => prev.filter(m => m.id !== msgId))}
                      className="rounded-xl border font-bold"
                    >
                      Hủy
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        );
      }
      default:
        return null;
    }
  };

  const suggestions = [
    { label: 'Tạo đặt phòng nhanh', text: 'Tạo đặt phòng Deluxe 101 cho Nguyễn Văn A, SĐT 0901234567, check-in 14h ngày mai, trả phòng 11h ngày kia' },
    { label: 'Nhận phòng (Check-in)', text: 'Nhận phòng cho P.101' },
    { label: 'Trả phòng (Check-out)', text: 'Trả phòng P.101' },
    { label: 'Ghi chép chi phí điện', text: 'Ghi nhận chi phí tiền điện 1.500.000đ cơ sở Lê Văn Sỹ tháng này' },
    { label: 'Báo phòng sạch', text: 'Phòng P.102 đã dọn dẹp sạch sẽ rồi' },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50/50 rounded-2xl overflow-hidden border">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-6 py-4 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
            <Sparkles size={20} className="animate-pulse" />
          </div>
          <div>
            <div className="font-black text-base flex items-center gap-1.5">
              Agent Ta Thong Dong
              <Badge variant="secondary" className="bg-primary/20 hover:bg-primary/25 border-none text-primary font-bold text-[10px] py-0.5">Trợ lý ảo</Badge>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">PMS Administrative AI Agent</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setMessages([
            {
              id: 'welcome',
              role: 'assistant',
              content: 'Đã làm mới cuộc hội thoại! Tôi đã sẵn sàng nhận các lệnh mới của bạn.'
            }
          ])} className="text-slate-400 hover:text-white rounded-xl text-xs flex gap-1 font-bold px-2.5">
            <RefreshCw size={12} /> Làm mới
          </Button>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white rounded-xl h-8 w-8">
              <X size={16} />
            </Button>
          )}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div key={m.id} className={cn("flex gap-3 max-w-[85%]", isUser ? "ml-auto flex-row-reverse" : "mr-auto")}>
              {/* Avatar */}
              <div className={cn(
                "w-8 h-8 rounded-xl shrink-0 flex items-center justify-center border font-bold text-xs uppercase shadow-sm",
                isUser ? "bg-white text-slate-700" : "bg-primary/10 border-primary/20 text-primary"
              )}>
                {isUser ? <User size={14} /> : <Bot size={14} />}
              </div>

              {/* Bubble */}
              <div className="space-y-2 flex-1">
                <div className={cn(
                  "p-4 rounded-[1.5rem] text-sm leading-relaxed shadow-sm",
                  isUser 
                    ? "bg-primary text-white rounded-tr-none font-medium" 
                    : "bg-white border rounded-tl-none text-slate-800 font-medium"
                )}>
                  {/* Basic markdown style support for strong & lists */}
                  <div className="whitespace-pre-wrap select-text">
                    {m.content.split('\n').map((line, i) => {
                      // Process bold text **text**
                      let processed = line;
                      const boldRegex = /\*\*(.*?)\*\*/g;
                      const parts = [];
                      let lastIndex = 0;
                      let match;
                      
                      while ((match = boldRegex.exec(processed)) !== null) {
                        if (match.index > lastIndex) {
                          parts.push(processed.substring(lastIndex, match.index));
                        }
                        parts.push(<strong key={match.index} className={cn(isUser ? "font-black" : "font-extrabold text-slate-900")}>{match[1]}</strong>);
                        lastIndex = boldRegex.lastIndex;
                      }
                      if (lastIndex < processed.length) {
                        parts.push(processed.substring(lastIndex));
                      }

                      return (
                        <p key={i} className={cn(line.startsWith('-') ? "pl-2" : "", "mb-1")}>
                          {parts.length > 0 ? parts : line}
                        </p>
                      );
                    })}
                  </div>
                </div>

                {/* Render interactive action cards if present */}
                {m.action && renderActionCard(m.id, m.action, m.actionExecuted, m.actionError)}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 max-w-[80%] mr-auto items-center">
            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
              <Bot size={14} className="animate-spin" />
            </div>
            <div className="bg-white border rounded-[1.5rem] rounded-tl-none px-4 py-3 text-xs text-muted-foreground font-bold flex items-center gap-2">
              <RefreshCw size={12} className="animate-spin text-primary" />
              Agent đang tính toán lịch phòng và phân tích...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Actions */}
      {messages.length === 1 && !loading && (
        <div className="px-6 py-2 shrink-0 bg-slate-50 border-t flex flex-col gap-2">
          <p className="text-[10px] font-black tracking-widest text-muted-foreground uppercase flex items-center gap-1">
            <HelpCircle size={10} /> Đề xuất ra lệnh mẫu
          </p>
          <div className="flex flex-wrap gap-2 pb-1 overflow-x-auto max-h-[100px]">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(s.text)}
                className="text-[11px] font-bold text-left px-3 py-1.5 bg-white hover:bg-slate-100 hover:text-primary rounded-xl border text-muted-foreground transition-all shrink-0 flex items-center gap-1 hover:translate-y-[-1px] shadow-sm"
              >
                {s.label} <ArrowRight size={10} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <div className="bg-white p-4 border-t flex gap-2 items-center shrink-0">
        <Input
          placeholder="Nhập yêu cầu quản trị hoặc dán thông tin đặt phòng tại đây..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !loading) handleSend();
          }}
          disabled={loading}
          className="flex-1 rounded-xl h-11 border-slate-200"
        />
        <Button
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
          className="h-11 w-11 rounded-xl shrink-0 p-0 shadow-md"
        >
          <Send size={16} />
        </Button>
      </div>
    </div>
  );
};
