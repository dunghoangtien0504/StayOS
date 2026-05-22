import { NextRequest, NextResponse } from 'next/server';
import {
  PANCAKE_API_BASE,
  getTokenForPage,
  parsePancakeDate,
  stripHtml,
} from '@/lib/pancake';

/**
 * GET /api/pancake/messages?pageId=X&conversationId=Y&customerId=Z
 * Fetch the full message history of one conversation.
 *
 * Pancake endpoint (verified):
 *   GET /public_api/v1/pages/{page_id}/conversations/{cid}/messages
 *   Params: access_token, customer_id
 *   Returns messages oldest-first; body is HTML.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId');
    const conversationId = searchParams.get('conversationId');
    const customerId = searchParams.get('customerId');

    if (!pageId || !conversationId) {
      return NextResponse.json(
        { error: 'pageId and conversationId are required' },
        { status: 400 }
      );
    }

    const page = getTokenForPage(pageId);
    if (!page) {
      return NextResponse.json(
        { error: `No Pancake token configured for page ${pageId}` },
        { status: 400 }
      );
    }

    const url =
      `${PANCAKE_API_BASE}/public_api/v1/pages/${pageId}` +
      `/conversations/${conversationId}/messages` +
      `?access_token=${page.token}` +
      (customerId ? `&customer_id=${customerId}` : '');

    const res = await fetch(url, { cache: 'no-store' });
    const data = await res.json();

    if (!res.ok || data.success === false) {
      return NextResponse.json(
        { error: data.message || `Pancake messages failed: HTTP ${res.status}` },
        { status: res.ok ? 502 : res.status }
      );
    }

    const raw = data.messages || data.data || [];
    const messages = raw
      .map((m: Record<string, unknown>) => {
        const from = (m.from || {}) as { id?: string; name?: string };
        // Extract image/file attachment URLs (type: photo, image, video, file, sticker)
        const rawAttachments = Array.isArray(m.attachments) ? m.attachments : [];
        const attachments: string[] = rawAttachments
          .filter((a: Record<string, unknown>) => typeof a.url === 'string')
          .map((a: Record<string, unknown>) => a.url as string);
        return {
          id: m.id as string,
          sender: from.name || 'Khách',
          content: stripHtml(m.message as string),
          timestamp: parsePancakeDate(m.inserted_at as string),
          isFromGuest: String(from.id) !== String(pageId),
          attachments,
        };
      })
      // Keep message if it has text OR attachments (image-only messages have empty content)
      .filter((m: { content: string; attachments: string[] }) =>
        m.content.length > 0 || m.attachments.length > 0
      );

    return NextResponse.json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (error) {
    console.error('Pancake messages error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
