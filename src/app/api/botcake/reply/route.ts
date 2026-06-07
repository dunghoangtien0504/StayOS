import { NextRequest, NextResponse } from 'next/server';
import { PANCAKE_API_BASE, getTokenForPage } from '@/lib/pancake';

/**
 * POST /api/botcake/reply
 * ---------------------------------------------------------------------------
 * Webhook endpoint được Botcake gọi khi có tin nhắn mới từ khách trên Pancake.
 *
 * Botcake gửi vào (HTTP Request block trong bot flow):
 *   {
 *     "message":         "nội dung tin nhắn của khách",
 *     "conversation_id": "...",
 *     "page_id":         "...",
 *     "customer_id":     "...",
 *     "customer_name":   "Tên khách"
 *   }
 *
 * Flow bên trong:
 *   1. Lấy nội dung tin nhắn
 *   2. Gọi GoClaw AI agent (ta-thong-dong) → nhận câu trả lời
 *   3. Gửi reply qua Pancake API (nếu page_id + token có sẵn)
 *   4. Trả về { reply } để Botcake có thể dùng trong flow (optional)
 *
 * Bảo mật: dùng BOTCAKE_WEBHOOK_SECRET để verify request đến từ Botcake
 * (set header X-Botcake-Secret trong Botcake HTTP Request block)
 * ---------------------------------------------------------------------------
 */

const GOCLAW_URL   = process.env.GOCLAW_API_URL   || 'http://localhost:18790';
const GOCLAW_KEY   = process.env.GOCLAW_API_KEY   || '';
const AGENT_KEY    = process.env.GOCLAW_AGENT_KEY || 'ta-thong-dong';
const WEBHOOK_SECRET = process.env.BOTCAKE_WEBHOOK_SECRET || '';

// System prompt cho bot tư vấn homestay
const SYSTEM_PROMPT = `Bạn là trợ lý tư vấn đặt phòng của "Ta Thong Dong Homestay" (địa chỉ: 351/58A Lê Văn Sỹ, TP.HCM).
Nhiệm vụ: trả lời tự động, thân thiện và ngắn gọn bằng tiếng Việt.

Thông tin phòng:
- Phòng Deluxe (R101, R201): 2 phòng, chuẩn khách sạn, giá từ 399k/đêm
- Phòng VIP (R102, R202, R301, R302): 4 phòng, cao cấp hơn, giá từ 449k/đêm

Bảng giá cơ bản (ngày thường T2-T5 / cuối tuần T6-CN):
- 2 tiếng đầu: Deluxe 99k / VIP 119k
- Thêm giờ: Deluxe 30k/h / VIP 40k/h
- Buổi sáng (8h-12h): Deluxe 149k / VIP 199k
- Cả ngày (8h-20h): Deluxe 299k / VIP 349k (T6-CN: +50k)
- Qua đêm (22h-8h): Deluxe 299k / VIP 349k (T6-CN: +50k)
- Combo đêm (14h-12h hôm sau): Deluxe 449k / VIP 499k (T6-CN: 499k / 549k)
- Thuê nhiều đêm: tính theo combo đêm × số ngày

Ngày lễ Tết: tăng 30-50% theo mức độ.

Hướng dẫn trả lời:
- Nếu khách hỏi giá: báo giá cụ thể theo loại phòng và ca
- Nếu khách hỏi phòng trống: hỏi ngày check-in/check-out rồi thông báo "Để kiểm tra phòng trống, vui lòng liên hệ trực tiếp số hotline hoặc nhắn ngày cụ thể"
- Nếu khách muốn đặt: yêu cầu tên, số điện thoại, ngày nhận phòng, loại phòng
- Câu trả lời tối đa 150 từ, thân thiện, dùng emoji phù hợp 🏡`;

async function callAI(userMessage: string, customerName?: string): Promise<string> {
  if (!GOCLAW_KEY) {
    throw new Error('GOCLAW_API_KEY chưa được cấu hình');
  }

  const greeting = customerName ? `[Khách: ${customerName}] ` : '';

  const res = await fetch(`${GOCLAW_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GOCLAW_KEY}`,
      'X-GoClaw-User-Id': 'stayos-botcake',
    },
    body: JSON.stringify({
      model: `goclaw:${AGENT_KEY}`,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: greeting + userMessage },
      ],
      stream: false,
      max_tokens: 300,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error?.message || `GoClaw error: HTTP ${res.status}`);
  }

  return data.choices?.[0]?.message?.content || 'Xin lỗi, tôi chưa thể trả lời ngay. Vui lòng liên hệ trực tiếp để được hỗ trợ! 🙏';
}

async function sendViaPancake(
  pageId: string,
  conversationId: string,
  message: string,
  customerId?: string
): Promise<boolean> {
  const page = getTokenForPage(pageId);
  if (!page) return false;

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
    cache: 'no-store',
  });

  const data = await res.json().catch(() => ({}));
  return res.ok && data.success !== false;
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret nếu đã cấu hình
    if (WEBHOOK_SECRET) {
      const incomingSecret =
        request.headers.get('x-botcake-secret') ||
        request.headers.get('authorization')?.replace('Bearer ', '');
      if (incomingSecret !== WEBHOOK_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const body = await request.json();

    // Botcake HTTP Request block gửi các field này
    const {
      message,
      conversation_id,
      page_id,
      customer_id,
      customer_name,
    } = body || {};

    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'message is required', reply: '' },
        { status: 400 }
      );
    }

    // 1. Gọi AI lấy câu trả lời
    const reply = await callAI(message.trim(), customer_name);

    // 2. Nếu có page_id + conversation_id → gửi thẳng qua Pancake
    let sentViaPancake = false;
    if (page_id && conversation_id) {
      sentViaPancake = await sendViaPancake(
        page_id,
        conversation_id,
        reply,
        customer_id
      );
    }

    // 3. Luôn trả về reply để Botcake có thể dùng trong "Send message" block
    return NextResponse.json({
      success: true,
      reply,
      sent_via_pancake: sentViaPancake,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Botcake webhook] error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';

    // Trả về fallback reply thay vì lỗi để Botcake vẫn gửi được gì đó cho khách
    return NextResponse.json({
      success: false,
      reply: 'Xin lỗi, hệ thống đang bận. Vui lòng liên hệ trực tiếp để được hỗ trợ nhanh nhất! 🙏',
      error: msg,
    }, { status: 200 }); // 200 để Botcake không retry liên tục
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'POST /api/botcake/reply',
    description: 'Botcake → StayOS AI auto-reply webhook',
    ai_configured: !!GOCLAW_KEY,
    pages_configured: !!(process.env.PANCAKE_PAGE_TOKENS),
  });
}
