import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  PANCAKE_API_BASE,
  getPageTokens,
  parsePancakeDate,
  stripHtml,
} from '@/lib/pancake';

const GOCLAW_URL = process.env.GOCLAW_API_URL || 'http://localhost:18790';
const GOCLAW_KEY = process.env.GOCLAW_API_KEY || '';
const AGENT_KEY = process.env.GOCLAW_AGENT_KEY || 'ta-thong-dong';

// Only auto-reply to messages younger than 2 hours
const MAX_AGE_MS = 2 * 60 * 60 * 1000;

// Dedup: conversationId → timestamp of our last reply
// Persists in memory across requests (same Node.js process on VPS)
const repliedAt = new Map<string, number>();

function canReply(convId: string, convUpdatedAt: number): boolean {
  const last = repliedAt.get(convId) ?? 0;
  // Customer sent a new message after our last reply
  return convUpdatedAt > last + 5000; // 5s buffer for propagation
}

// ── Main cron handler ─────────────────────────────────────────────────────────
export async function GET() {
  const pages = getPageTokens();
  if (!pages.length) {
    return NextResponse.json({ ok: false, error: 'No page tokens configured' }, { status: 400 });
  }

  const summary: Record<string, { replied: number; skipped: number; errors: number }> = {};
  const now = Date.now();

  for (const page of pages) {
    let replied = 0, skipped = 0, errors = 0;

    try {
      const conversations = await fetchUnreplied(page.pageId, page.token);

      for (const conv of conversations) {
        const updatedAt = parsePancakeDate(conv.updated_at || conv.inserted_at).getTime();

        // Skip stale (customer not actively waiting)
        if (now - updatedAt > MAX_AGE_MS) { skipped++; continue; }

        // Skip if we already replied after this message
        if (!canReply(conv.id, updatedAt)) { skipped++; continue; }

        // Skip comment threads (only handle INBOX direct messages)
        if (conv.type && conv.type !== 'INBOX') { skipped++; continue; }

        try {
          // Fetch full message history, extract last customer message
          const messages = await fetchMessages(page.pageId, conv.id, page.token);
          if (!messages.length) { skipped++; continue; }

          const lastMsg = messages[messages.length - 1];
          if (lastMsg.role !== 'user' || !lastMsg.content) { skipped++; continue; }

          const history = messages.slice(0, -1);

          // Build prompt with live availability
          const availability = await getAvailabilityText();
          const systemPrompt = buildSystemPrompt(availability);

          // Call GoClaw AI
          const aiReply = await callGoClaw(systemPrompt, lastMsg.content, history);
          if (!aiReply) { skipped++; continue; }

          // Parse BOOKING_DRAFT → create pending booking record
          const { cleanReply, draft } = parseBookingDraft(aiReply);
          const customerId = conv.from?.id || conv.customer_id || '';
          if (draft) {
            await createPendingBooking({
              pageId: page.pageId,
              conversationId: conv.id,
              customerId,
              ...draft,
            });
          }

          // Send reply via Pancake
          await sendMessage(page.pageId, conv.id, cleanReply, page.token, customerId);

          repliedAt.set(conv.id, Date.now());
          replied++;
          console.log(`[auto-reply] Replied to conv ${conv.id} on page ${page.pageId}`);

          // Throttle: avoid hammering GoClaw when many convs arrive at once
          await new Promise(r => setTimeout(r, 1500));
        } catch (err) {
          console.error(`[auto-reply] conv ${conv.id} failed:`, err);
          errors++;
        }
      }
    } catch (err) {
      console.error(`[auto-reply] page ${page.pageId} failed:`, err);
    }

    summary[page.pageId] = { replied, skipped, errors };
  }

  return NextResponse.json({ ok: true, summary, ts: new Date().toISOString() });
}

// ── Fetch unreplied INBOX conversations (last 2 hours) ────────────────────────
async function fetchUnreplied(pageId: string, token: string) {
  const until = Math.floor(Date.now() / 1000);
  const since = until - 2 * 3600;

  const url =
    `${PANCAKE_API_BASE}/public_api/v1/pages/${pageId}/conversations` +
    `?access_token=${token}` +
    `&since=${since}&until=${until}` +
    `&page_number=1&order_by=updated_at`;

  const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(10_000) });
  if (!res.ok) return [];

  const data = await res.json();
  const conversations: ConvItem[] = data.conversations || data.data || [];

  // Keep only conversations where customer sent the last message
  return conversations.filter(conv => {
    if (typeof conv.is_replied === 'boolean') return !conv.is_replied;
    // Fallback: last_sent_by matches the customer (not the page)
    return conv.last_sent_by?.id && conv.from?.id &&
      conv.last_sent_by.id === conv.from.id;
  });
}

interface ConvItem {
  id: string;
  type?: string;
  is_replied?: boolean;
  from?: { id: string; name?: string };
  last_sent_by?: { id: string };
  customer_id?: string;
  snippet?: string;
  updated_at?: string;
  inserted_at?: string;
}

// ── Fetch message history for one conversation ────────────────────────────────
async function fetchMessages(
  pageId: string,
  conversationId: string,
  token: string
): Promise<{ role: 'user' | 'assistant'; content: string }[]> {
  try {
    const url =
      `${PANCAKE_API_BASE}/public_api/v1/pages/${pageId}` +
      `/conversations/${conversationId}/messages` +
      `?access_token=${token}&page_number=1&count=20`;

    const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(8_000) });
    if (!res.ok) return [];

    const data = await res.json();
    const msgs: Array<{
      content?: string;
      message?: string;
      sent_by_customer?: boolean;
      is_from_customer?: boolean;
      created_at?: string;
    }> = data.messages || data.data || [];

    const sorted = [...msgs].sort((a, b) =>
      parsePancakeDate(a.created_at).getTime() - parsePancakeDate(b.created_at).getTime()
    ).slice(-20);

    return sorted
      .map(m => ({
        role: (m.sent_by_customer ?? m.is_from_customer ?? false)
          ? ('user' as const)
          : ('assistant' as const),
        content: stripHtml(m.content || m.message || '').trim(),
      }))
      .filter(m => m.content);
  } catch {
    return [];
  }
}

// ── Supabase: real room availability (next 90 days) ───────────────────────────
async function getAvailabilityText(): Promise<string> {
  try {
    const now = new Date();
    const end = new Date(now.getTime() + 90 * 86400_000);

    const [{ data: bookings }, { data: rooms }] = await Promise.all([
      supabase
        .from('bookings')
        .select('room_id, check_in, check_out, status')
        .not('status', 'in', '("cancelled","no_show")')
        .gte('check_out', now.toISOString())
        .lte('check_in', end.toISOString()),
      supabase.from('rooms').select('id, name, room_type'),
    ]);

    if (!rooms?.length) return 'Không có dữ liệu phòng.';

    const occupied: Record<string, string[]> = {};
    for (const b of bookings ?? []) {
      if (!occupied[b.room_id]) occupied[b.room_id] = [];
      occupied[b.room_id].push(`${b.check_in.split('T')[0]} → ${b.check_out.split('T')[0]}`);
    }

    return (rooms as { id: string; name: string; room_type: string }[])
      .map(r => {
        const periods = occupied[r.id] ?? [];
        return periods.length === 0
          ? `${r.name} (${r.room_type}): Trống hoàn toàn`
          : `${r.name} (${r.room_type}): Đã book ${periods.join(', ')}`;
      })
      .join('\n');
  } catch {
    return 'Không thể tải lịch phòng lúc này.';
  }
}

// ── Customer-facing system prompt ─────────────────────────────────────────────
function buildSystemPrompt(availabilityText: string): string {
  return `Bạn là nhân viên tư vấn đặt phòng của Ta Thong Dong Homestay Saigon.

== THÔNG TIN HOMESTAY ==
Địa chỉ: 49 Trần Quốc Diệu, Phường Nhiêu Lộc, Quận 3, TP.HCM
Kênh đặt phòng chính thức: Fanpage "Ta Thong Dong homestay SaiGon"
Từ sân bay Tân Sơn Nhất: khoảng 10–15 phút

== PHÒNG & GIÁ ==
Phòng Deluxe (P.101, P.102, P.202, P.302):
  Thứ 2–5: 750.000đ/đêm | Thứ 6, 7, CN: 900.000đ/đêm
Phòng VIP (P.201, P.301):
  Thứ 2–5: 950.000đ/đêm | Thứ 6, 7, CN: 1.100.000đ/đêm
Thêm giờ: 70.000đ/giờ

== LỊCH PHÒNG THỰC TẾ (90 NGÀY TỚI) ==
${availabilityText}

== QUY ĐỊNH ==
Check-in: 14:00 | Check-out: 11:00
Xe máy: để trong nhà (miễn phí) | Ô tô: bãi xe 25 Kỳ Đồng Q3 (~1.2km)
Nên đặt trước; cuối tuần đặt trước 1–2 tuần
Thanh toán TOÀN BỘ khi xác nhận (không đặt cọc một phần)

== QUY TRÌNH TƯ VẤN ==
1. Hỏi ngày nhận/trả phòng, số khách
2. Kiểm tra lịch trống, gợi ý phòng phù hợp
3. Báo giá chi tiết (tính theo từng đêm)
4. Khi khách đồng ý → hỏi: Họ tên đầy đủ, Số điện thoại
5. Hướng dẫn chuyển khoản. Nhấn mạnh: "Chủ nhà sẽ xác nhận booking sau khi nhận chuyển khoản."
6. KHÔNG tự xác nhận lịch hoặc hứa lock phòng.

== QUYỀN HẠN ==
CHỈ ĐƯỢC: tư vấn, báo giá, kiểm tra lịch, thu thập thông tin.
KHÔNG ĐƯỢC: xác nhận đặt phòng, hứa lock phòng, điều chỉnh giá.

== TÓM TẮT BOOKING (khi đủ thông tin) ==
Khi đã có: tên, SĐT, check-in, check-out, loại phòng, tổng tiền
→ Thêm ở CUỐI TIN (không hiển thị cho khách):
BOOKING_DRAFT:{"guestName":"...","guestPhone":"...","checkIn":"YYYY-MM-DD","checkOut":"YYYY-MM-DD","roomType":"Deluxe|VIP","totalPrice":000000}

== PHONG CÁCH ==
Thân thiện, dùng "bạn/mình". Ngắn gọn. Dùng tiếng Việt tự nhiên.`;
}

// ── Call GoClaw AI ─────────────────────────────────────────────────────────────
async function callGoClaw(
  systemPrompt: string,
  userMessage: string,
  history: { role: 'user' | 'assistant'; content: string }[]
): Promise<string | null> {
  if (!GOCLAW_KEY) return null;
  try {
    const res = await fetch(`${GOCLAW_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GOCLAW_KEY}`,
        'X-GoClaw-User-Id': 'stayos-auto-reply',
      },
      body: JSON.stringify({
        model: `goclaw:${AGENT_KEY}`,
        messages: [
          { role: 'system', content: systemPrompt },
          ...history.slice(-14),
          { role: 'user', content: userMessage },
        ],
        stream: false,
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch {
    return null;
  }
}

// ── Parse BOOKING_DRAFT from AI reply ─────────────────────────────────────────
interface BookingDraft {
  guestName: string;
  guestPhone?: string;
  checkIn: Date;
  checkOut: Date;
  roomType?: string;
  totalPrice: number;
}

function parseBookingDraft(reply: string): { cleanReply: string; draft: BookingDraft | null } {
  const match = reply.match(/BOOKING_DRAFT:\{([^}]+)\}/);
  if (!match) return { cleanReply: reply.trim(), draft: null };

  const cleanReply = reply.replace(/\s*BOOKING_DRAFT:\{[^}]+\}/, '').trim();
  try {
    const raw = JSON.parse(`{${match[1]}}`);
    const draft: BookingDraft = {
      guestName: raw.guestName || 'Khách',
      guestPhone: raw.guestPhone,
      checkIn: new Date(raw.checkIn),
      checkOut: new Date(raw.checkOut),
      roomType: raw.roomType,
      totalPrice: Number(raw.totalPrice) || 0,
    };
    if (isNaN(draft.checkIn.getTime()) || isNaN(draft.checkOut.getTime())) {
      return { cleanReply, draft: null };
    }
    return { cleanReply, draft };
  } catch {
    return { cleanReply, draft: null };
  }
}

// ── Create pending booking in Supabase ────────────────────────────────────────
async function createPendingBooking(opts: {
  pageId: string;
  conversationId: string;
  customerId: string;
} & BookingDraft) {
  try {
    const id = `pb_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const { error } = await supabase.from('pending_bookings').upsert(
      {
        id,
        page_id: opts.pageId,
        conversation_id: opts.conversationId,
        customer_id: opts.customerId || null,
        guest_name: opts.guestName,
        guest_phone: opts.guestPhone ?? null,
        check_in: opts.checkIn.toISOString().split('T')[0],
        check_out: opts.checkOut.toISOString().split('T')[0],
        room_type: opts.roomType ?? null,
        total_price: opts.totalPrice,
        status: 'pending',
        created_at: new Date().toISOString(),
      },
      { onConflict: 'conversation_id' }
    );
    if (error) console.error('[auto-reply] createPendingBooking error:', error);
  } catch (err) {
    console.error('[auto-reply] createPendingBooking exception:', err);
  }
}

// ── Send reply via Pancake API ─────────────────────────────────────────────────
async function sendMessage(
  pageId: string,
  conversationId: string,
  message: string,
  token: string,
  customerId?: string
) {
  const url =
    `${PANCAKE_API_BASE}/public_api/v1/pages/${pageId}` +
    `/conversations/${conversationId}/messages` +
    `?access_token=${token}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'reply_inbox',
      message,
      ...(customerId ? { customer_id: customerId } : {}),
    }),
    signal: AbortSignal.timeout(10_000),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    throw new Error(`sendMessage failed: ${JSON.stringify(data)}`);
  }
}
