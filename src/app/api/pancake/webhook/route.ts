import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { PANCAKE_API_BASE, getTokenForPage, stripHtml, parsePancakeDate } from '@/lib/pancake';

const GOCLAW_URL = process.env.GOCLAW_API_URL || 'http://localhost:18790';
const GOCLAW_KEY = process.env.GOCLAW_API_KEY || '';
const AGENT_KEY = process.env.GOCLAW_AGENT_KEY || 'ta-thong-dong';
const WEBHOOK_SECRET = process.env.PANCAKE_WEBHOOK_SECRET || 'stayos_webhook_2026';

// Dedup: skip if we already processed this message ID recently
const processedIds = new Map<string, number>();
function isDuplicate(msgId: string): boolean {
  const now = Date.now();
  // Clean up old entries (>5 minutes)
  for (const [id, ts] of processedIds) {
    if (now - ts > 300_000) processedIds.delete(id);
  }
  if (processedIds.has(msgId)) return true;
  processedIds.set(msgId, now);
  return false;
}

// ── GET: Pancake webhook verification ─────────────────────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('verify_token') || searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge') || searchParams.get('challenge') || 'ok';

  if (token === WEBHOOK_SECRET) {
    return new Response(challenge, { status: 200 });
  }
  return new Response('Forbidden', { status: 403 });
}

// ── POST: Incoming message from Pancake ───────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    // Extract fields from various Pancake webhook formats
    const pageId: string = body.page_id || body.pageId || '';
    const conversationId: string = body.conversation_id || body.conversationId || '';
    const customerId: string = body.customer_id || body.customerId || '';

    // Message content — handle nested or flat
    const msgObj = body.message || body.msg || body;
    const msgId: string = msgObj.id || msgObj.message_id || body.id || '';
    const sentByCustomer: boolean =
      msgObj.sent_by_customer ?? msgObj.is_from_customer ?? body.sent_by_customer ?? true;
    const rawContent: string = msgObj.content || msgObj.message || msgObj.text || '';
    const content = stripHtml(rawContent).trim();

    // Skip messages sent BY the page (not from customer) to avoid loops
    if (!sentByCustomer) return NextResponse.json({ ok: true, skip: 'page_message' });

    // Skip empty messages
    if (!content) return NextResponse.json({ ok: true, skip: 'empty' });

    // Dedup
    if (msgId && isDuplicate(msgId)) {
      return NextResponse.json({ ok: true, skip: 'duplicate' });
    }

    // Need page token to reply
    if (!pageId || !conversationId) {
      return NextResponse.json({ ok: true, skip: 'no_page_or_conv' });
    }

    const page = getTokenForPage(pageId);
    if (!page) {
      console.warn(`[webhook] No token for page ${pageId}`);
      return NextResponse.json({ ok: true, skip: 'no_token' });
    }

    // Run async (don't block Pancake's webhook call)
    handleMessage({ pageId, conversationId, customerId, msgId, content, page });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[webhook] Error:', err);
    return NextResponse.json({ ok: true }); // Always return 200 to Pancake
  }
}

// ── Core handler (async, not awaited by POST) ─────────────────────────────────
async function handleMessage(opts: {
  pageId: string;
  conversationId: string;
  customerId: string;
  msgId: string;
  content: string;
  page: ReturnType<typeof getTokenForPage> & object;
}) {
  const { pageId, conversationId, customerId, content, page } = opts;

  try {
    // 1. Get conversation history from Pancake (last 15 messages)
    const history = await fetchConversationHistory(pageId, conversationId, page.token);

    // 2. Get real availability from Supabase (next 90 days)
    const availabilityText = await getAvailabilityText();

    // 3. Build system prompt (Customer Bot — limited permissions)
    const systemPrompt = buildCustomerSystemPrompt(availabilityText);

    // 4. Call GoClaw with conversation history
    const aiReply = await callGoClaw(systemPrompt, content, history);
    if (!aiReply) return;

    // 5. Parse BOOKING_DRAFT if present → create pending booking
    const { cleanReply, draft } = parseBookingDraft(aiReply);
    if (draft) {
      await createPendingBooking({
        pageId,
        conversationId,
        customerId,
        ...draft,
      });
    }

    // 6. Send reply to guest via Pancake
    await sendPancakeMessage(pageId, conversationId, cleanReply, page.token, customerId);
  } catch (err) {
    console.error('[webhook] handleMessage error:', err);
  }
}

// ── Fetch recent conversation history from Pancake ────────────────────────────
async function fetchConversationHistory(
  pageId: string,
  conversationId: string,
  token: string
): Promise<{ role: 'user' | 'assistant'; content: string }[]> {
  try {
    const url =
      `${PANCAKE_API_BASE}/public_api/v1/pages/${pageId}` +
      `/conversations/${conversationId}/messages` +
      `?access_token=${token}&page_number=1&count=20`;

    const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];

    const data = await res.json();
    const messages: Array<{
      id: string;
      content?: string;
      message?: string;
      sent_by_customer?: boolean;
      is_from_customer?: boolean;
      created_at?: string;
    }> = data.messages || data.data || [];

    // Sort ascending by time, take last 16 messages (8 exchanges)
    const sorted = [...messages].sort((a, b) => {
      const ta = parsePancakeDate(a.created_at).getTime();
      const tb = parsePancakeDate(b.created_at).getTime();
      return ta - tb;
    }).slice(-16);

    return sorted.map(m => {
      const fromCustomer = m.sent_by_customer ?? m.is_from_customer ?? false;
      const text = stripHtml(m.content || m.message || '').trim();
      return { role: (fromCustomer ? 'user' : 'assistant') as 'user' | 'assistant', content: text };
    }).filter(m => m.content);
  } catch {
    return [];
  }
}

// ── Query Supabase for room availability (next 90 days) ───────────────────────
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

    // Group occupied periods by room
    const occupied: Record<string, string[]> = {};
    for (const b of bookings ?? []) {
      if (!occupied[b.room_id]) occupied[b.room_id] = [];
      const ci = b.check_in.split('T')[0];
      const co = b.check_out.split('T')[0];
      occupied[b.room_id].push(`${ci} → ${co}`);
    }

    const lines = (rooms ?? []).map((r: { id: string; name: string; room_type: string }) => {
      const periods = occupied[r.id] ?? [];
      if (periods.length === 0) return `${r.name} (${r.room_type}): Trống hoàn toàn`;
      return `${r.name} (${r.room_type}): Đã book ${periods.join(', ')}`;
    });

    return lines.join('\n');
  } catch {
    return 'Không thể tải lịch phòng lúc này.';
  }
}

// ── Build customer-facing system prompt ───────────────────────────────────────
function buildCustomerSystemPrompt(availabilityText: string): string {
  return `Bạn là nhân viên tư vấn đặt phòng của Ta Thong Dong Homestay Saigon.

== THÔNG TIN HOMESTAY ==
Địa chỉ: 49 Trần Quốc Diệu, Phường Nhiêu Lộc, Quận 3, TP.HCM
Kênh đặt phòng chính thức: Fanpage "Ta Thong Dong homestay SaiGon"
Từ sân bay Tân Sơn Nhất: khoảng 10–15 phút

== PHÒNG & GIÁ ==
Phòng Deluxe (P.101, P.102, P.202, P.302):
  Thứ 2–5: 750.000đ/đêm
  Thứ 6, 7, CN: 900.000đ/đêm
Phòng VIP (P.201, P.301):
  Thứ 2–5: 950.000đ/đêm
  Thứ 6, 7, CN: 1.100.000đ/đêm
Thêm giờ: 70.000đ/giờ

== LỊCH PHÒNG THỰC TẾ (90 NGÀY TỚI) ==
${availabilityText}

== QUY ĐỊNH ==
Check-in: 14:00 | Check-out: 11:00
Xe máy: để trong nhà (miễn phí)
Ô tô: bãi xe 25 Kỳ Đồng Q3, cách ~1.2km
Nên đặt trước; cuối tuần đặt trước 1–2 tuần
Thanh toán TOÀN BỘ khi xác nhận (không đặt cọc một phần)

== QUY TRÌNH TƯ VẤN ==
1. Hỏi ngày nhận/trả phòng, số khách
2. Kiểm tra lịch trống (xem bên trên), gợi ý phòng phù hợp
3. Báo giá chi tiết (tính theo từng đêm)
4. Khi khách đồng ý → hỏi: Họ tên đầy đủ, Số điện thoại
5. Hướng dẫn chuyển khoản:
   Thông báo: "Chủ nhà sẽ xác nhận booking sau khi nhận được chuyển khoản. Bạn vui lòng chờ xác nhận nhé!"
6. KHÔNG tự xác nhận lịch hoặc hứa lock phòng. Luôn nhấn mạnh chủ nhà sẽ xác nhận.

== QUYỀN HẠN ==
Bạn CHỈ ĐƯỢC: tư vấn, báo giá, kiểm tra lịch, thu thập thông tin khách.
KHÔNG ĐƯỢC: xác nhận đặt phòng, hứa lock phòng, điều chỉnh giá.

== TÓM TẮT BOOKING (khi đủ thông tin) ==
Khi bạn đã thu thập đủ: tên khách, SĐT, ngày check-in, check-out, loại phòng, tổng tiền
→ Thêm block này ở CUỐI TIN NHẮN (không hiển thị cho khách):
BOOKING_DRAFT:{"guestName":"...","guestPhone":"...","checkIn":"YYYY-MM-DD","checkOut":"YYYY-MM-DD","roomType":"Deluxe|VIP","totalPrice":000000}

== PHONG CÁCH ==
Thân thiện, dùng "bạn/mình". Ngắn gọn, súc tích. Không quá formal. Dùng tiếng Việt tự nhiên.`;
}

// ── Call GoClaw AI ─────────────────────────────────────────────────────────────
async function callGoClaw(
  systemPrompt: string,
  userMessage: string,
  history: { role: 'user' | 'assistant'; content: string }[]
): Promise<string | null> {
  if (!GOCLAW_KEY) return null;

  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-14), // last 7 exchanges
      { role: 'user', content: userMessage },
    ];

    const res = await fetch(`${GOCLAW_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GOCLAW_KEY}`,
        'X-GoClaw-User-Id': 'stayos-customer-bot',
      },
      body: JSON.stringify({
        model: `goclaw:${AGENT_KEY}`,
        messages,
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
interface BookingDraftData {
  guestName: string;
  guestPhone?: string;
  checkIn: Date;
  checkOut: Date;
  roomType?: string;
  totalPrice: number;
}

function parseBookingDraft(reply: string): { cleanReply: string; draft: BookingDraftData | null } {
  const match = reply.match(/BOOKING_DRAFT:\{([^}]+)\}/);
  if (!match) return { cleanReply: reply.trim(), draft: null };

  const cleanReply = reply.replace(/\s*BOOKING_DRAFT:\{[^}]+\}/, '').trim();

  try {
    const raw = JSON.parse(`{${match[1]}}`);
    const draft: BookingDraftData = {
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
  customerId?: string;
  guestName: string;
  guestPhone?: string;
  checkIn: Date;
  checkOut: Date;
  roomType?: string;
  totalPrice: number;
}) {
  try {
    const id = `pb_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const { error } = await supabase.from('pending_bookings').upsert({
      id,
      page_id: opts.pageId,
      conversation_id: opts.conversationId,
      customer_id: opts.customerId ?? null,
      guest_name: opts.guestName,
      guest_phone: opts.guestPhone ?? null,
      check_in: opts.checkIn.toISOString().split('T')[0],
      check_out: opts.checkOut.toISOString().split('T')[0],
      room_type: opts.roomType ?? null,
      total_price: opts.totalPrice,
      status: 'pending',
      created_at: new Date().toISOString(),
    }, {
      onConflict: 'conversation_id', // upsert by conversation so we don't create duplicates
    });
    if (error) console.error('[webhook] createPendingBooking error:', error);
    else console.log('[webhook] Pending booking created:', id);
  } catch (err) {
    console.error('[webhook] createPendingBooking exception:', err);
  }
}

// ── Send message to guest via Pancake ─────────────────────────────────────────
async function sendPancakeMessage(
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
    console.error('[webhook] sendPancakeMessage failed:', data);
  }
}

