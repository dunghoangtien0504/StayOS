/**
 * Pancake API client helpers
 * ------------------------------------------------------------------
 * Pancake messaging API on `pages.fm`. Auth via `access_token` query
 * param. Each token is a PAGE-level token (a JWT) — the page_id is
 * encoded inside the JWT payload, so no /v1/pages call is needed.
 *
 * Env:
 *   PANCAKE_PAGE_TOKENS = comma-separated page tokens (server-side only)
 *   PANCAKE_API_BASE    = https://pages.fm/api  (default)
 * ------------------------------------------------------------------
 */

export const PANCAKE_API_BASE =
  process.env.PANCAKE_API_BASE || 'https://pages.fm/api';

export interface PancakePageToken {
  pageId: string;
  token: string;
  channel: string;
}

/** Decode the payload of a JWT without verifying the signature */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const json = Buffer.from(parts[1], 'base64url').toString('utf-8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/** Infer the channel from a Pancake page_id prefix */
export function channelFromPageId(pageId: string): string {
  if (pageId.startsWith('igo_')) return 'instagram';
  if (pageId.startsWith('ttm_')) return 'tiktok';
  if (pageId.startsWith('zlo_') || pageId.startsWith('zalo')) return 'zalo';
  if (/^\d+$/.test(pageId)) return 'facebook';
  return 'unknown';
}

/**
 * Parse PANCAKE_PAGE_TOKENS into a list of { pageId, token, channel }.
 * Falls back to the legacy PANCAKE_API_KEY var for backward compat.
 */
export function getPageTokens(): PancakePageToken[] {
  const raw =
    process.env.PANCAKE_PAGE_TOKENS || process.env.PANCAKE_API_KEY || '';

  return raw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .map((token) => {
      const payload = decodeJwtPayload(token);
      const pageId = String(payload?.id || '');
      return { pageId, token, channel: channelFromPageId(pageId) };
    })
    .filter((p) => p.pageId);
}

/** Find the token for a given page id */
export function getTokenForPage(pageId: string): PancakePageToken | null {
  return getPageTokens().find((p) => p.pageId === pageId) || null;
}

/** Pancake returns naive datetimes (no tz) -> treat as UTC */
export function parsePancakeDate(s?: string): Date {
  if (!s) return new Date();
  const hasTz = /[zZ]|[+-]\d\d:?\d\d$/.test(s);
  return new Date(hasTz ? s : s + 'Z');
}

/** Strip HTML tags / decode basic entities from a Pancake message body */
export function stripHtml(html?: string): string {
  if (!html) return '';
  return html
    // Line breaks
    .replace(/<br\s*\/?>/gi, '\n')
    // Block-level closing + opening tags → newline (covers div, p, li, h1-h6, tr, blockquote)
    .replace(/<\/?(div|p|li|tr|blockquote|h[1-6])[^>]*>/gi, '\n')
    // List wrappers
    .replace(/<\/?[ou]l[^>]*>/gi, '\n')
    // Remove remaining tags
    .replace(/<[^>]*>/g, '')
    // HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Collapse 3+ newlines → max 2 (preserve paragraph breaks, not just single newlines)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
