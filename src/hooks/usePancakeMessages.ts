import { useState, useCallback, useEffect } from 'react';

interface PancakeMessage {
  id: string;
  guestName: string;
  guestPhone?: string;
  message: string;
  timestamp: Date;
  channel: string;
  isIncoming: boolean;
}

interface UsePancakeMessagesReturn {
  messages: PancakeMessage[];
  loading: boolean;
  error: string | null;
  sync: () => Promise<void>;
  lastSyncTime: Date | null;
}

/**
 * Hook để manage tin nhắn từ Pancake
 */
export function usePancakeMessages(): UsePancakeMessagesReturn {
  const [messages, setMessages] = useState<PancakeMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const sync = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/pancake/sync', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.messages)) {
        // Convert timestamp strings to Date objects
        const messagesWithDates = data.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));

        setMessages(messagesWithDates);
        setLastSyncTime(new Date());
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Pancake sync error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-sync on mount
  useEffect(() => {
    sync();

    // Set up interval for periodic sync (every 30 seconds)
    const interval = setInterval(sync, 30 * 1000);

    return () => clearInterval(interval);
  }, [sync]);

  return {
    messages,
    loading,
    error,
    sync,
    lastSyncTime,
  };
}
