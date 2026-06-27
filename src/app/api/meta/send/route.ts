import { NextRequest, NextResponse } from 'next/server';
import { sendTextMessage, sendImageMessage } from '@/lib/meta';

/**
 * POST /api/meta/send
 * Body: { recipientId, message?, imageUrl? }
 *   recipientId — PSID (Messenger) or IGSID (Instagram)
 *   message     — text to send
 *   imageUrl    — public image URL to send as attachment
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipientId, message, imageUrl } = body || {};

    if (!recipientId || (!message && !imageUrl)) {
      return NextResponse.json(
        { error: 'recipientId and (message or imageUrl) are required' },
        { status: 400 }
      );
    }

    if (!process.env.META_PAGE_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: 'META_PAGE_ACCESS_TOKEN not configured' },
        { status: 400 }
      );
    }

    if (message) await sendTextMessage(recipientId, message);
    if (imageUrl) await sendImageMessage(recipientId, imageUrl);

    return NextResponse.json({ success: true, sent_at: new Date().toISOString() });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
