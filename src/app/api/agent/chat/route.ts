import { NextRequest, NextResponse } from 'next/server';

const GOCLAW_URL = process.env.GOCLAW_API_URL || 'http://localhost:18790';
const GOCLAW_KEY = process.env.GOCLAW_API_KEY || '';
const AGENT_KEY = process.env.GOCLAW_AGENT_KEY || 'ta-thong-dong';

/**
 * POST /api/agent/chat
 * Body: { message: string, history?: { role: 'user'|'assistant', content: string }[] }
 * Returns: { reply: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, history = [] } = body || {};

    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    if (!GOCLAW_KEY) {
      return NextResponse.json({ error: 'GOCLAW_API_KEY chưa được cấu hình' }, { status: 500 });
    }

    const messages = [
      ...history.slice(-6), // keep last 6 turns for context
      { role: 'user', content: message },
    ];

    const res = await fetch(`${GOCLAW_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GOCLAW_KEY}`,
        'X-GoClaw-User-Id': 'stayos',
      },
      body: JSON.stringify({
        model: `goclaw:${AGENT_KEY}`,
        messages,
        stream: false,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error?.message || `GoClaw error: HTTP ${res.status}` },
        { status: 502 }
      );
    }

    const reply = data.choices?.[0]?.message?.content || '';
    return NextResponse.json({ reply });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
