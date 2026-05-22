import { NextRequest, NextResponse } from 'next/server';
import { PANCAKE_API_BASE, getTokenForPage } from '@/lib/pancake';

/**
 * POST /api/pancake/send-image
 * Upload an image file and send it directly to Pancake as multipart form-data.
 * This avoids needing a public URL that Pancake can fetch.
 *
 * Body: multipart/form-data
 *   file           – image file
 *   pageId         – Pancake page ID
 *   conversationId – Pancake conversation ID
 *   customerId     – (optional) Pancake customer ID
 *   message        – (optional) text to send along with the image
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const pageId = formData.get('pageId') as string | null;
    const conversationId = formData.get('conversationId') as string | null;
    const customerId = formData.get('customerId') as string | null;
    const message = formData.get('message') as string | null;

    if (!file || !pageId || !conversationId) {
      return NextResponse.json(
        { error: 'file, pageId, conversationId are required' },
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

    // Build multipart form to forward to Pancake
    const pancakeForm = new FormData();
    pancakeForm.append('action', 'reply_inbox');
    pancakeForm.append('file', file);
    if (message) pancakeForm.append('message', message);
    if (customerId) pancakeForm.append('customer_id', customerId);

    const res = await fetch(url, {
      method: 'POST',
      body: pancakeForm,
      cache: 'no-store',
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.success === false) {
      console.error('Pancake send-image error:', JSON.stringify(data));
      return NextResponse.json(
        {
          error:
            data.message ||
            data.error ||
            data.msg ||
            `Pancake image send failed: HTTP ${res.status}`,
          error_code: data.error_code,
          pancake_raw: data,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, sent_at: new Date().toISOString(), pancake: data });
  } catch (error) {
    console.error('send-image error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
