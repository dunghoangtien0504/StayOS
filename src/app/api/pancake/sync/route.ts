import { NextRequest, NextResponse } from 'next/server';
import {
  PANCAKE_API_BASE,
  getPageTokens,
  parsePancakeDate,
} from '@/lib/pancake';

/**
 * GET /api/pancake/sync
 * Pulls conversations from every connected page -> Smart Inbox list.
 *
 * Pancake endpoint (verified):
 *   GET /public_api/v1/pages/{page_id}/conversations
 *   Required params: access_token, since, until (range < 1 month),
 *                    page_number
 */

interface StayOSMessage {
  id: string;
  conversationId: string;
  pageId: string;
  customerId?: string;
  guestName: string;
  guestPhone?: string;
  message: string;
  timestamp: Date;
  channel: string;
  isIncoming: boolean;
}

/** List conversations for one page (most recent ~25 days, page 1) */
async function fetchConversations(pageId: string, token: string) {
  const until = Math.floor(Date.now() / 1000);
  const since = until - 25 * 86400; // < 1 month (API limit)

  const url =
    `${PANCAKE_API_BASE}/public_api/v1/pages/${pageId}/conversations` +
    `?access_token=${token}` +
    `&since=${since}&until=${until}` +
    `&page_number=1&order_by=updated_at`;

  const res = await fetch(url, { cache: 'no-store' });
  const data = await res.json();

  if (!res.ok || data.success === false) {
    throw new Error(
      data.message || `Pancake /conversations failed: HTTP ${res.status}`
    );
  }
  return data.conversations || data.data || [];
}

export async function GET(_request: NextRequest) {
  try {
    const pages = getPageTokens();

    if (pages.length === 0) {
      return NextResponse.json(
        { error: 'PANCAKE_PAGE_TOKENS is not configured' },
        { status: 400 }
      );
    }

    const allMessages: StayOSMessage[] = [];
    const errors: { pageId: string; error: string }[] = [];

    for (const page of pages) {
      try {
        const conversations = await fetchConversations(page.pageId, page.token);

        for (const conv of conversations) {
          allMessages.push({
            id: conv.id,
            conversationId: conv.id,
            pageId: page.pageId,
            customerId: conv.customer_id,
            guestName:
              conv.from?.name ||
              conv.page_customer?.name ||
              conv.customers?.[0]?.name ||
              'Khách',
            guestPhone: conv.recent_phone_numbers?.[0],
            message: conv.snippet || '',
            timestamp: parsePancakeDate(conv.updated_at || conv.inserted_at),
            channel: page.channel,
            // last message from the customer => incoming
            isIncoming: conv.last_sent_by?.id === conv.from?.id,
          });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        console.warn(`Skipping page ${page.pageId}:`, msg);
        errors.push({ pageId: page.pageId, error: msg });
      }
    }

    allMessages.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return NextResponse.json({
      success: true,
      count: allMessages.length,
      pages: pages.length,
      messages: allMessages,
      errors: errors.length ? errors : undefined,
      synced_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Pancake sync error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** POST = force sync (identical to GET) */
export async function POST(request: NextRequest) {
  return GET(request);
}
