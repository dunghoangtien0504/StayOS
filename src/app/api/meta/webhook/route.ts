import { NextRequest, NextResponse } from 'next/server';
import { getVerifyToken, verifyWebhookSignature } from '@/lib/meta';

/** GET — Meta webhook verification (hub.challenge handshake) */
export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const mode = p.get('hub.mode');
  const token = p.get('hub.verify_token');
  const challenge = p.get('hub.challenge');

  if (mode === 'subscribe' && token === getVerifyToken()) {
    return new Response(challenge, { status: 200 });
  }
  return new Response('Forbidden', { status: 403 });
}

/** POST — incoming message events from Meta */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('x-hub-signature-256') || '';

  if (!verifyWebhookSignature(body, signature)) {
    return new Response('Invalid signature', { status: 401 });
  }

  try {
    const payload = JSON.parse(body);
    // Log for now — future: push to realtime store / trigger auto-reply
    console.log('[Meta Webhook]', JSON.stringify(payload).substring(0, 300));
  } catch {
    // ignore parse errors, still return 200 to Meta
  }

  return NextResponse.json({ received: true });
}
