// Global SSE event emitter — shared across webhook + SSE route
// Uses a simple Set of WritableStreamDefaultWriter to broadcast to all connected clients

type SSEClient = {
  id: string;
  controller: ReadableStreamDefaultController;
};

const clients = new Set<SSEClient>();

export function addSSEClient(client: SSEClient) {
  clients.add(client);
}

export function removeSSEClient(client: SSEClient) {
  clients.delete(client);
}

export function broadcastSSE(event: string, data: unknown) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of clients) {
    try {
      client.controller.enqueue(payload);
    } catch {
      clients.delete(client);
    }
  }
}
