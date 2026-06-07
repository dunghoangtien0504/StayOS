import { NextRequest, NextResponse } from 'next/server';
import { PANCAKE_API_BASE, getTokenForPage, stripHtml } from '@/lib/pancake';

/**
 * POST /api/pancake/webhook
 * ------------------------------------------------------------------
 * Pancake gọi URL này mỗi khi có tin nhắn mới từ khách.
 * Flow: nhận tin → gọi AI → gửi reply qua Pancake API.
 *
 * Cấu hình trong Pancake:
 *   pancake.vn → Cài đặt → Kết nối → Webhook
 *   URL: https://<domain>/api/pancake/webhook
 *   Events: new_message (hoặc message_created)
 * ------------------------------------------------------------------
 */

const GOCLAW_URL = process.env.GOCLAW_API_URL   || 'http://localhost:18790';
const GOCLAW_KEY = process.env.GOCLAW_API_KEY   || '';
const AGENT_KEY  = process.env.GOCLAW_AGENT_KEY || 'ta-thong-dong';

// Chống loop: lưu message_id đã xử lý trong 5 phút
const recentIds = new Map<string, number>();
function isDuplicate(id: string): boolean {
  const now = Date.now();
  // Dọn entries cũ hơn 5 phút
  for (const [k, t] of recentIds) if (now - t > 300_000) recentIds.delete(k);
  if (recentIds.has(id)) return true;
  recentIds.set(id, now);
  return false;
}

const SYSTEM_PROMPT = `Bạn là trợ lý tư vấn đặt phòng của "Ta Thong Dong Homestay" (351/58A Lê Văn Sỹ, TP.HCM).
Trả lời ngắn gọn, thân thiện bằng tiếng Việt. Tối đa 150 từ.

Thông tin phòng:
- Deluxe (R101, R201): từ 399k/đêm
- VIP (R102, R202, R301, R302): từ 449k/đêm

Bảng giá (ngày thường T2-T5 / cuối tuần T6-CN):
- 2 tiếng: Deluxe 99k / VIP 119k (thêm giờ: +30k/+40k)
- Buổi sáng 8h-12h: 149k / 199k
- Cả ngày 8h-20h: 299k / 349k (cuối tuần +50k)
- Qua đêm 22h-8h: 299k / 349k (cuối tuần +50k)
- Combo đêm 14h→12h hôm sau: 449k/499k (cuối tuần 499k/549k)
- Nhiều đêm: tính theo combo đêm × số đêm
- Lễ/Tết: +30-50%

Khi khách hỏi đặt phòng → hỏi: tên, SĐT, ngày nhận phòng, loại phòng muốn.
Dùng emoji phù hợp 🏡`;

async function getAIReply(message: string, guestName?: string): Promise<string> {
  if (!GOCLAW_KEY) return '';

  const res = await fetch(`${GOCLAW_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GOCLAW_KEY}`,
      'X-GoClaw-User-Id': 'stayos-webhook',
    },
    body: JSON.stringify({
      model: `goclaw:${AGENT_KEY}`,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: guestName ? `[${guestName}]: ${message}` : message,
        },
      ],
      stream: false,
      max_tokens: 300,
    }),
  });

  if (!res.ok) return '';
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

async function sendReply(
  pageId: string,
  conversationId: string,
  message: string,
  customerId?: string
): Promise<void> {
  const page = getTokenForPage(pageId);
  if (!page) {
    console.error(`[webhook] No token for page ${pageId}`);
    return;
  }

  const url =
    `${PANCAKE_API_BASE}/public_api/v1/pages/${pageId}` +
    `/conversations/${conversationId}/messages` +
    `?access_token=${page.token}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'reply_inbox',
      message,
      ...(customerId ? { customer_id: customerId } : {}),
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    console.error('[webhook] Send failed:', JSON.stringify(data).slice(0, 200));
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // ── Pancake có thể gửi nhiều format khác nhau tuỳ version ──
    // Format 1: { webhook_event, page_id, conversation_id, message: { from, message, id } }
    // Format 2: { event, data: { page_id, conversation_id, ... } }
    // Format 3: array of events

    const events = Array.isArray(body) ? body : [body];

    for (const event of events) {
      const data    = event.data || event;
      const pageId  = data.page_id  || event.page_id;
      const convId  = data.conversation_id || event.conversation_id;
      const msg     = data.message || event.message || {};
      const msgId   = msg.id || data.id || `${Date.now()}`;

      // Chỉ xử lý tin nhắn VĂN BẢN từ khách (bỏ qua tin nhắn của page tự gửi)
      const fromId  = String(msg.from?.id  || data.from?.id  || '');
      const toId    = String(msg.to?.id    || data.to?.id    || '');
      const text    = stripHtml(msg.message || msg.text || data.text || '').trim();
      const guestName = msg.from?.name || data.from?.name || data.customer_name || '';
      const customerId = msg.from?.id || data.customer_id || '';

      // Bỏ qua nếu:
      // - Không có nội dung
      // - Tin nhắn từ chính page (fromId === pageId) → tránh loop
      // - Đã xử lý rồi
      if (!text || !pageId || !convId) continue;
      if (fromId === pageId || toId !== pageId) {
        // Nếu from là page → tin của chúng ta gửi, bỏ qua
        // toId là pageId → khách gửi đến page (đúng)
        if (fromId === pageId) continue;
      }
      if (isDuplicate(msgId)) continue;

      console.log(`[webhook] New msg from "${guestName}" on page ${pageId}: "${text.slice(0, 60)}"`);

      // Gọi AI lấy câu trả lời (không block response)
      getAIReply(text, guestName)
        .then(reply => {
          if (!reply) return;
          return sendReply(pageId, convId, reply, String(customerId));
        })
        .catch(err => console.error('[webhook] AI/send error:', err));
    }

    // Phải trả về 200 ngay lập tức cho Pancake (timeout ngắn)
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[webhook] parse error:', error);
    // Vẫn trả 200 để Pancake không retry liên tục
    return NextResponse.json({ received: true });
  }
}

// GET = verification endpoint (Pancake gọi lúc setup để xác nhận webhook hoạt động)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('hub.challenge') || searchParams.get('challenge');
  if (challenge) return new Response(challenge, { status: 200 });

  return NextResponse.json({
    status: 'ok',
    webhook: 'POST /api/pancake/webhook',
    ai_ready: !!GOCLAW_KEY,
    pages: (process.env.PANCAKE_PAGE_TOKENS || '').split(',').filter(Boolean).length,
  });
}
