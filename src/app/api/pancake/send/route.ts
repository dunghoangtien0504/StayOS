import { NextRequest, NextResponse } from 'next/server';
import { PANCAKE_API_BASE, getTokenForPage } from '@/lib/pancake';

/**
 * POST /api/pancake/send
 * Reply to a guest through Pancake.
 *
 * Body: { pageId, conversationId, message, customerId? }
 *
 * Pancake endpoint:
 *   POST /v1/pages/{page_id}/conversations/{conversation_id}/messages
 *        ?access_token={page_token}
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pageId, conversationId, message, customerId } = body || {};

    if (!pageId || !conversationId || !message) {
      return NextResponse.json(
        { error: 'pageId, conversationId and message are required' },
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
      `${PANCAKE_API_BASE}/v1/pages/${pageId}` +
      `/conversations/${conversationId}/messages` +
      `?access_token=${page.token}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        action: 'reply_inbox',
        ...(customerId ? { customer_id: customerId } : {}),
      }),
      cache: 'no-store',
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        { error: `Pancake send failed: ${res.status}`, details: data },
        { status: res.status }
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
