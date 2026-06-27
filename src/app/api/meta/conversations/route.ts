import { NextResponse } from 'next/server';
import { fetchConversations } from '@/lib/meta';

/** GET /api/meta/conversations — list Messenger + Instagram threads */
export async function GET() {
  try {
    if (!process.env.META_PAGE_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: 'META_PAGE_ACCESS_TOKEN not configured' },
        { status: 400 }
      );
    }

    const [messenger, instagram] = await Promise.allSettled([
      fetchConversations('messenger'),
      fetchConversations('instagram'),
    ]);

    const threads = [
      ...(messenger.status === 'fulfilled' ? messenger.value : []),
      ...(instagram.status === 'fulfilled' ? instagram.value : []),
    ].sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

    return NextResponse.json({
      success: true,
      threads,
      errors: [
        ...(messenger.status === 'rejected'
          ? [{ platform: 'messenger', error: (messenger.reason as Error).message }]
          : []),
        ...(instagram.status === 'rejected'
          ? [{ platform: 'instagram', error: (instagram.reason as Error).message }]
          : []),
      ],
      synced_at: new Date().toISOString(),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
