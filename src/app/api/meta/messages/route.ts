import { NextRequest, NextResponse } from 'next/server';
import { fetchMessages } from '@/lib/meta';

/** GET /api/meta/messages?conversationId=X — full message history */
export async function GET(request: NextRequest) {
  try {
    const conversationId = request.nextUrl.searchParams.get('conversationId');
    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId required' }, { status: 400 });
    }
    const messages = await fetchMessages(conversationId);
    return NextResponse.json({ success: true, messages });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
