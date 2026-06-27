/**
 * Meta Graph API client
 * -----------------------------------------------------------
 * Supports Facebook Messenger + Instagram DM via the same
 * Graph API. Auth via long-lived Page Access Token.
 *
 * Env vars required (add to .env.local):
 *   META_PAGE_ACCESS_TOKEN  — long-lived Page Access Token
 *   META_APP_SECRET         — App Secret (for webhook signature)
 *   META_VERIFY_TOKEN       — arbitrary string for webhook setup
 *   META_PAGE_ID            — numeric Facebook Page ID
 * -----------------------------------------------------------
 */

import { createHmac } from 'crypto';

export const META_GRAPH_BASE = 'https://graph.facebook.com/v21.0';

export function getPageToken(): string {
  return process.env.META_PAGE_ACCESS_TOKEN || '';
}

export function getAppSecret(): string {
  return process.env.META_APP_SECRET || '';
}

export function getVerifyToken(): string {
  return process.env.META_VERIFY_TOKEN || '';
}

export function getPageId(): string {
  return process.env.META_PAGE_ID || '';
}

export type MetaPlatform = 'messenger' | 'instagram';

export interface MetaConversation {
  id: string;
  guestName: string;
  guestPsid: string;
  lastMessage: string;
  lastMessageAt: string; // ISO string from Graph API
  unreadCount: number;
  platform: MetaPlatform;
}

export interface MetaMessage {
  id: string;
  content: string;
  sender: string;
  isFromGuest: boolean;
  timestamp: string;
  attachments: string[];
}

/** List ALL conversations for one platform (follows pagination, max 500) */
export async function fetchConversations(platform: MetaPlatform, maxPages = 20): Promise<MetaConversation[]> {
  const token = getPageToken();
  const pageId = getPageId();
  if (!token) throw new Error('META_PAGE_ACCESS_TOKEN not configured');

  const all: MetaConversation[] = [];
  let nextUrl: string | null =
    `${META_GRAPH_BASE}/me/conversations` +
    `?platform=${platform}` +
    `&fields=id,participants,snippet,updated_time,unread_count` +
    `&access_token=${token}&limit=50`;

  let pages = 0;
  while (nextUrl && pages < maxPages) {
    const res: Response = await fetch(nextUrl, { cache: 'no-store' });
    const data = await res.json() as {
      data?: Record<string, unknown>[];
      error?: { message?: string };
      paging?: { next?: string };
    };
    if (!res.ok || data.error) {
      throw new Error(data.error?.message || `Meta /conversations (${platform}) HTTP ${res.status}`);
    }

    const mapped = (data.data || []).map((conv) => {
      const participants = ((conv.participants as { data: { id: string; name: string }[] })?.data) || [];
      const guest = participants.find((p) => p.id !== pageId) || participants[0];
      return {
        id: conv.id as string,
        guestName: guest?.name || (platform === 'instagram' ? 'Khách Instagram' : 'Khách Messenger'),
        guestPsid: guest?.id || '',
        lastMessage: (conv.snippet as string) || '',
        lastMessageAt: (conv.updated_time as string) || new Date().toISOString(),
        unreadCount: (conv.unread_count as number) || 0,
        platform,
      };
    });

    all.push(...mapped);
    nextUrl = data.paging?.next || null;
    pages++;
  }

  return all;
}

/** Fetch message history for one conversation (oldest first) */
export async function fetchMessages(conversationId: string): Promise<MetaMessage[]> {
  const token = getPageToken();
  const pageId = getPageId();
  if (!token) throw new Error('META_PAGE_ACCESS_TOKEN not configured');

  const url =
    `${META_GRAPH_BASE}/${conversationId}/messages` +
    `?fields=id,message,from,attachments,created_time` +
    `&access_token=${token}&limit=50`;

  const res = await fetch(url, { cache: 'no-store' });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error?.message || `Meta /messages HTTP ${res.status}`);
  }

  return ((data.data || []) as Record<string, unknown>[])
    .map((m) => {
      const from = (m.from || {}) as { id?: string; name?: string };
      const attachmentData =
        ((m.attachments as { data?: { image_data?: { url?: string }; file_url?: string }[] })?.data) || [];
      const attachments = attachmentData
        .map((a) => a.image_data?.url || a.file_url || '')
        .filter(Boolean) as string[];
      return {
        id: m.id as string,
        content: (m.message as string) || '',
        sender: from.name || 'Khách',
        isFromGuest: from.id !== pageId,
        timestamp: (m.created_time as string) || new Date().toISOString(),
        attachments,
      };
    })
    .filter((m) => m.content.length > 0 || m.attachments.length > 0)
    .reverse(); // oldest first
}

/** Send a text message to a recipient (PSID or IGSID) */
export async function sendTextMessage(recipientId: string, text: string) {
  const token = getPageToken();
  if (!token) throw new Error('META_PAGE_ACCESS_TOKEN not configured');

  const res = await fetch(`${META_GRAPH_BASE}/me/messages?access_token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipient: { id: recipientId }, message: { text } }),
    cache: 'no-store',
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error?.message || `Meta send failed: HTTP ${res.status}`);
  }
  return data;
}

/** Send an image by public URL */
export async function sendImageMessage(recipientId: string, imageUrl: string) {
  const token = getPageToken();
  if (!token) throw new Error('META_PAGE_ACCESS_TOKEN not configured');

  const res = await fetch(`${META_GRAPH_BASE}/me/messages?access_token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { attachment: { type: 'image', payload: { url: imageUrl, is_reusable: true } } },
    }),
    cache: 'no-store',
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error?.message || `Meta send image failed: HTTP ${res.status}`);
  }
  return data;
}

/** Verify X-Hub-Signature-256 from Meta webhook */
export function verifyWebhookSignature(body: string, signature: string): boolean {
  const secret = getAppSecret();
  if (!secret || !signature) return !secret; // skip check if no secret configured
  const expected = 'sha256=' + createHmac('sha256', secret).update(body).digest('hex');
  return signature === expected;
}
