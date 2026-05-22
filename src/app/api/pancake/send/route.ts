import { NextRequest, NextResponse } from 'next/server';
import { PANCAKE_API_BASE, getTokenForPage } from '@/lib/pancake';

/**
 * POST /api/pancake/send
 * Reply to a guest through Pancake.
 *
 * Body: { pageId, conversationId, message?, contentUrl?, customerId? }
 *   message    — text to send
 *   contentUrl — public image URL to send as attachment (uses Pancake content_url)
 *   At least one of message or contentUrl must be provided.
 *
 * Pancake endpoint (verified):
 *   POST /public_api/v1/pages/{page_id}/conversations/{cid}/messages
 *        ?access_token={page_token}
 *   Required body: action='reply_inbox', message | content_url
 *
 * NOTE: Pancake returns HTTP 200 even on logical errors, with
 * { success: false, message, error_code } — must check data.success.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pageId, conversationId, message, contentUrl, customerId } = body || {};

    if (!pageId || !conversationId || (!message && !contentUrl)) {
      return NextResponse.json(
        { error: 'pageId, conversationId, and message or contentUrl are required' },
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
      `?access_token=${page.token}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'reply_inbox',
        ...(message ? { message } : {}),
        ...(contentUrl ? { content_url: contentUrl } : {}),
        ...(customerId ? { customer_id: customerId } : {}),
      }),
      cache: 'no-store',
    });

    const data = await res.json().catch(() => ({}));

    // Pancake returns 200 + success:false on logical errors
    if (!res.ok || data.success === false) {
      return NextResponse.json(
        {
          error:
            data.message ||
            `Pancake send failed: HTTP ${res.status}`,
          error_code: data.error_code,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      sent_at: new Date().toISOString(),
      pancake: data,
    });
  } catch (error) {
    console.error('Pancake send error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
