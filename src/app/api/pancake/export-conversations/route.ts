import { NextRequest, NextResponse } from 'next/server';
import { PANCAKE_API_BASE, getPageTokens, stripHtml, parsePancakeDate } from '@/lib/pancake';

/**
 * GET /api/pancake/export-conversations
 * Pulls all conversations from the last N days + full message history.
 * Used for training data analysis — owner selects good examples.
 *
 * Query params:
 *   days  — number of days back to fetch (default 60, max 90)
 *   pageId — optional: only fetch for a specific page
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const days = Math.min(Number(searchParams.get('days') || '60'), 90);
  const filterPageId = searchParams.get('pageId') || null;

  const pages = getPageTokens().filter(p => !filterPageId || p.pageId === filterPageId);

  if (pages.length === 0) {
    return NextResponse.json({ error: 'No Pancake pages configured' }, { status: 400 });
  }

  const until = Math.floor(Date.now() / 1000);
  const since = until - days * 86400;

  const results: ConversationExport[] = [];

  for (const page of pages) {
    try {
      // Fetch conversation list
      const listUrl =
        `${PANCAKE_API_BASE}/public_api/v1/pages/${page.pageId}/conversations` +
        `?access_token=${page.token}&since=${since}&until=${until}&page_number=1&order_by=updated_at`;

      const listRes = await fetch(listUrl, { cache: 'no-store', signal: AbortSignal.timeout(10_000) });
      if (!listRes.ok) continue;

      const listData = await listRes.json();
      const conversations: ConvRow[] = listData.conversations || listData.data || [];

      // Fetch messages for each conversation (parallel, max 10 at once)
      const chunks = chunkArray(conversations, 10);
      for (const chunk of chunks) {
        const fetched = await Promise.allSettled(
          chunk.map(conv => fetchMessages(page.pageId, conv, page.token))
        );
        for (const r of fetched) {
          if (r.status === 'fulfilled' && r.value) results.push(r.value);
        }
      }
    } catch (err) {
      console.error(`[export] page ${page.pageId}:`, err);
    }
  }

  // Sort by most recent
  results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return NextResponse.json({
    total: results.length,
    days,
    conversations: results,
    exportedAt: new Date().toISOString(),
  });
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface ConvRow {
  id: string;
  from?: { name?: string };
  page_customer?: { name?: string };
  customers?: { name?: string }[];
  recent_phone_numbers?: string[];
  snippet?: string;
  updated_at?: string;
  inserted_at?: string;
}

interface ExportMessage {
  role: 'guest' | 'owner';
  content: string;
  timestamp: string;
}

interface ConversationExport {
  conversationId: string;
  pageId: string;
  guestName: string;
  guestPhone?: string;
  updatedAt: string;
  messageCount: number;
  messages: ExportMessage[];
  /** Formatted as few-shot training example */
  fewShotText: string;
}

// ── Fetch messages for a single conversation ──────────────────────────────────
async function fetchMessages(pageId: string, conv: ConvRow, token: string): Promise<ConversationExport | null> {
  try {
    const url =
      `${PANCAKE_API_BASE}/public_api/v1/pages/${pageId}` +
      `/conversations/${conv.id}/messages` +
      `?access_token=${token}&page_number=1&count=50`;

    const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;

    const data = await res.json();
    const rawMessages: Array<{
      id: string;
      content?: string;
      message?: string;
      sent_by_customer?: boolean;
      is_from_customer?: boolean;
      created_at?: string;
    }> = data.messages || data.data || [];

    const sorted = [...rawMessages].sort((a, b) =>
      parsePancakeDate(a.created_at).getTime() - parsePancakeDate(b.created_at).getTime()
    );

    const messages: ExportMessage[] = sorted
      .map(m => ({
        role: (m.sent_by_customer ?? m.is_from_customer ?? false) ? 'guest' as const : 'owner' as const,
        content: stripHtml(m.content || m.message || '').trim(),
        timestamp: parsePancakeDate(m.created_at).toISOString(),
      }))
      .filter(m => m.content);

    if (messages.length === 0) return null;

    const guestName =
      conv.from?.name ||
      conv.page_customer?.name ||
      conv.customers?.[0]?.name ||
      'Khách';

    // Build few-shot training text
    const fewShotLines = messages.map(m =>
      m.role === 'guest'
        ? `Khách: ${m.content}`
        : `Nhân viên: ${m.content}`
    );
    const fewShotText = fewShotLines.join('\n');

    return {
      conversationId: conv.id,
      pageId,
      guestName,
      guestPhone: conv.recent_phone_numbers?.[0],
      updatedAt: parsePancakeDate(conv.updated_at || conv.inserted_at).toISOString(),
      messageCount: messages.length,
      messages,
      fewShotText,
    };
  } catch {
    return null;
  }
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

