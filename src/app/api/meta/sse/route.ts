import { NextRequest } from 'next/server';
import { addSSEClient, removeSSEClient } from '@/lib/sse-emitter';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_request: NextRequest) {
  let clientRef: { id: string; controller: ReadableStreamDefaultController } | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  const cleanup = () => {
    if (heartbeat) { clearInterval(heartbeat); heartbeat = null; }
    if (clientRef) { removeSSEClient(clientRef); clientRef = null; }
  };

  const stream = new ReadableStream({
    start(controller) {
      clientRef = { id: crypto.randomUUID(), controller };
      addSSEClient(clientRef);
      // Send initial ping
      controller.enqueue('event: ping\ndata: {"ts":"' + new Date().toISOString() + '"}\n\n');

      // Heartbeat mỗi 25s — giữ kết nối "còn sống" để nginx (proxy_read_timeout 60s)
      // không tự đóng connection khi không có tin nhắn mới → tránh ERR_INCOMPLETE_CHUNKED_ENCODING.
      // Dòng bắt đầu bằng ':' là SSE comment, EventSource sẽ bỏ qua, không ảnh hưởng client.
      heartbeat = setInterval(() => {
        try {
          controller.enqueue(': keepalive\n\n');
        } catch {
          cleanup();
        }
      }, 25000);
    },
    cancel() {
      cleanup();
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
