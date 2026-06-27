import { NextRequest } from 'next/server';
import { addSSEClient, removeSSEClient } from '@/lib/sse-emitter';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_request: NextRequest) {
  let clientRef: { id: string; controller: ReadableStreamDefaultController } | null = null;

  const stream = new ReadableStream({
    start(controller) {
      clientRef = { id: crypto.randomUUID(), controller };
      addSSEClient(clientRef);
      // Send initial ping
      controller.enqueue('event: ping\ndata: {"ts":"' + new Date().toISOString() + '"}\n\n');
    },
    cancel() {
      if (clientRef) removeSSEClient(clientRef);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
