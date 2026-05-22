"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Shell } from '@/components/layout/Shell';
import Link from 'next/link';
import { useTimelineStore } from '@/store/useTimelineStore';
import type { ChatThread, ChatSource, Message } from '@/lib/types';
import {
  Search, Send,
  Phone, User, MessageSquare,
  MessageCircle, Image as ImageIcon,
  Smile, Paperclip, CheckCheck,
  RefreshCw, Loader2, AlertCircle,
} from 'lucide-react';
import { cn, formatVNTime } from '@/lib/utils';
import { AddBookingModal } from '@/components/booking/AddBookingModal';
import { Plus, Link as LinkIcon } from 'lucide-react';

/** Pancake channel -> ChatThread source (with safe fallback) */
function toSource(channel: string): ChatSource {
  if (
    channel === 'facebook' ||
    channel === 'instagram' ||
    channel === 'tiktok' ||
    channel === 'zalo'
  ) {
    return channel;
  }
  return 'facebook';
}

/** Map one /api/pancake/sync item to a ChatThread */
interface SyncItem {
  id: string;
  conversationId: string;
  pageId: string;
  customerId?: string;
  guestName: string;
  guestPhone?: string;
  message: string;
  timestamp: string;
  channel: string;
  isIncoming: boolean;
}

function syncItemToThread(item: SyncItem): ChatThread {
  return {
    id: item.conversationId || item.id,
    guestName: item.guestName || 'Khách',
    guestPhone: item.guestPhone || '',
    lastMessage: item.message || '',
    lastMessageAt: new Date(item.timestamp),
    unreadCount: item.isIncoming ? 1 : 0,
    messages: [],
    source: toSource(item.channel),
    pageId: item.pageId,
    customerId: item.customerId,
    messagesLoaded: false,
  };
}

export default function SmartInboxPage() {
  const {
    chatThreads,
    sendMessage,
    markThreadAsRead,
    syncPancakeThreads,
    setThreadMessages,
  } = useTimelineStore();

  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddBookingOpen, setIsAddBookingOpen] = useState(false);

  // Pancake sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedThread = chatThreads.find(t => t.id === selectedThreadId);
  const filteredThreads = chatThreads.filter(t =>
    t.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Sync conversations from Pancake ──────────────────────────
  const runSync = useCallback(async () => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const res = await fetch('/api/pancake/sync');
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `Sync thất bại (HTTP ${res.status})`);
      }
      const threads = (data.messages as SyncItem[]).map(syncItemToThread);
      syncPancakeThreads(threads);
      setLastSyncAt(new Date());
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Lỗi không xác định');
    } finally {
      setIsSyncing(false);
    }
  }, [syncPancakeThreads]);

  // Auto-sync on mount + every 5 minutes
  useEffect(() => {
    runSync();
    const interval = setInterval(runSync, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [runSync]);

  // Keep a valid thread selected
  useEffect(() => {
    if (
      (!selectedThreadId || !chatThreads.some(t => t.id === selectedThreadId)) &&
      chatThreads.length > 0
    ) {
      setSelectedThreadId(chatThreads[0].id);
    }
  }, [chatThreads, selectedThreadId]);

  // ── Load full message history for the selected thread ────────
  useEffect(() => {
    const thread = chatThreads.find(t => t.id === selectedThreadId);
    if (!thread || !thread.pageId || thread.messagesLoaded) return;

    let cancelled = false;
    setIsLoadingMessages(true);
    setSendError(null);

    const params = new URLSearchParams({
      pageId: thread.pageId,
      conversationId: thread.id,
      ...(thread.customerId ? { customerId: thread.customerId } : {}),
    });

    fetch(`/api/pancake/messages?${params}`)
      .then(res => res.json())
      .then((data) => {
        if (cancelled) return;
        if (!data.success) throw new Error(data.error || 'Không tải được tin nhắn');
        const msgs: Message[] = (data.messages as Message[]).map(m => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }));
        setThreadMessages(thread.id, msgs);
      })
      .catch((err) => {
        if (!cancelled) {
          setSendError(err instanceof Error ? err.message : 'Lỗi tải tin nhắn');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingMessages(false);
      });

    return () => { cancelled = true; };
  }, [selectedThreadId, chatThreads, setThreadMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
    if (selectedThreadId) {
      markThreadAsRead(selectedThreadId);
    }
  }, [selectedThread?.messages.length, selectedThreadId, markThreadAsRead]);

  // ── Send a reply ─────────────────────────────────────────────
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || !selectedThread) return;

    // Local-only thread (mock) — just append
    if (!selectedThread.pageId) {
      sendMessage(selectedThread.id, text);
      setInputText('');
      return;
    }

    // Pancake thread — send through the API
    setIsSending(true);
    setSendError(null);
    try {
      const res = await fetch('/api/pancake/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId: selectedThread.pageId,
          conversationId: selectedThread.id,
          customerId: selectedThread.customerId,
          message: text,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `Gửi thất bại (HTTP ${res.status})`);
      }
      sendMessage(selectedThread.id, text);
      setInputText('');
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Gửi tin nhắn thất bại');
    } finally {
      setIsSending(false);
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'facebook':
        return <MessageCircle className="text-blue-600" size={14} />;
      case 'instagram':
        return (
          <div className="w-4 h-4 rounded-md flex items-center justify-center text-[8px] text-white font-black bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600">
            IG
          </div>
        );
      case 'tiktok':
        return (
          <div className="w-4 h-4 bg-black rounded-md flex items-center justify-center text-[8px] text-white font-black">
            TT
          </div>
        );
      case 'zalo':
        return (
          <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-[10px] text-white font-black">
            Z
          </div>
        );
      default:
        return <MessageSquare className="text-primary" size={14} />;
    }
  };

  const totalUnread = chatThreads.reduce((acc, t) => acc + t.unreadCount, 0);

  return (
    <Shell title="Smart Inbox">
      <div className="h-full flex overflow-hidden bg-white">
        {/* Sidebar: Thread List */}
        <div className="w-[400px] border-r flex flex-col h-full bg-muted/5">
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-black tracking-tight">Tin nhắn</h1>
              <div className="flex items-center gap-2">
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-black">
                  {totalUnread} mới
                </span>
                <button
                  onClick={runSync}
                  disabled={isSyncing}
                  title={lastSyncAt ? `Đồng bộ lúc ${formatVNTime(lastSyncAt)}` : 'Đồng bộ Pancake'}
                  className="p-2 rounded-xl hover:bg-primary/10 text-primary transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={16} className={cn(isSyncing && 'animate-spin')} />
                </button>
              </div>
            </div>

            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
              <input
                type="text"
                placeholder="Tìm hội thoại..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-2xl border bg-white focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium text-sm"
              />
            </div>

            {syncError && (
              <div className="flex items-start gap-2 text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{syncError}</span>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-3 space-y-1 pb-6">
            {isSyncing && chatThreads.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                <Loader2 size={28} className="animate-spin" />
                <span className="text-xs font-bold">Đang đồng bộ Pancake...</span>
              </div>
            )}

            {!isSyncing && chatThreads.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground text-center px-6">
                <MessageSquare size={28} className="opacity-30" />
                <span className="text-xs font-bold">Chưa có hội thoại nào</span>
              </div>
            )}

            {filteredThreads.map(thread => (
              <div
                key={thread.id}
                onClick={() => setSelectedThreadId(thread.id)}
                className={cn(
                  "p-4 rounded-[1.5rem] cursor-pointer transition-all flex gap-4 group relative",
                  selectedThreadId === thread.id
                    ? "bg-white shadow-md ring-1 ring-primary/5"
                    : "hover:bg-white/50"
                )}
              >
                <div className="relative shrink-0">
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-black text-xl border-2 border-white shadow-sm">
                    {thread.guestName.charAt(0)}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm border">
                    {getSourceIcon(thread.source)}
                  </div>
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={cn("text-sm truncate", thread.unreadCount > 0 ? "font-black" : "font-bold text-foreground")}>
                      {thread.guestName}
                    </h3>
                    <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap">
                      {formatVNTime(thread.lastMessageAt)}
                    </span>
                  </div>
                  <p className={cn(
                    "text-xs truncate",
                    thread.unreadCount > 0 ? "text-foreground font-black" : "text-muted-foreground font-medium"
                  )}>
                    {thread.lastMessage}
                  </p>
                </div>

                {thread.unreadCount > 0 && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-primary rounded-full shadow-sm shadow-primary/30" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col h-full relative">
          {selectedThread ? (
            <>
              {/* Chat Header */}
              <div className="h-20 border-b flex items-center justify-between px-8 shrink-0 bg-white/80 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-black text-sm">
                    {selectedThread.guestName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-black flex items-center gap-2">
                        {selectedThread.guestName}
                        <span className="w-2 h-2 bg-green-500 rounded-full" />
                      </h2>
                      {selectedThread.linkedBookingId && (
                        <Link
                          href={`/bookings/table?focus=${selectedThread.linkedBookingId}`}
                          className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase hover:bg-primary/20 transition-colors"
                        >
                          <LinkIcon size={10} />
                          #{selectedThread.linkedBookingId.split('-')[1]}
                        </Link>
                      )}
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                      {getSourceIcon(selectedThread.source)}
                      <span>{selectedThread.source}</span>
                      {selectedThread.guestPhone && (
                        <span>• {selectedThread.guestPhone}</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!selectedThread.linkedBookingId && (
                    <button
                      onClick={() => setIsAddBookingOpen(true)}
                      className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-xl font-bold text-xs hover:bg-primary/20 transition-all mr-2"
                    >
                      <Plus size={14} />
                      Tạo booking
                    </button>
                  )}
                  <button className="p-2.5 hover:bg-muted rounded-xl transition-colors text-muted-foreground"><Phone size={20} /></button>
                  <button className="p-2.5 hover:bg-muted rounded-xl transition-colors text-muted-foreground"><User size={20} /></button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-muted/5">
                {isLoadingMessages && (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
                    <Loader2 size={24} className="animate-spin" />
                    <span className="text-xs font-bold">Đang tải tin nhắn...</span>
                  </div>
                )}

                {!isLoadingMessages && (
                  <div className="text-center">
                    <span className="px-4 py-1.5 bg-white border rounded-full text-[10px] font-black text-muted-foreground uppercase tracking-widest shadow-sm">
                      Bắt đầu hội thoại
                    </span>
                  </div>
                )}

                {selectedThread.messages.map((msg, idx) => {
                  const isLast = idx === selectedThread.messages.length - 1;
                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex flex-col max-w-[70%] animate-in fade-in slide-in-from-bottom-2 duration-300",
                        msg.isFromGuest ? "mr-auto" : "ml-auto items-end text-right"
                      )}
                    >
                      <div className={cn(
                        "p-4 rounded-[1.5rem] shadow-sm relative group",
                        msg.isFromGuest
                          ? "bg-white text-foreground border rounded-bl-none"
                          : "bg-primary text-white rounded-br-none"
                      )}>
                        <p className="text-sm font-bold leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2 px-1">
                        <span className="text-[10px] font-bold text-muted-foreground opacity-60">
                          {formatVNTime(msg.timestamp)}
                        </span>
                        {!msg.isFromGuest && isLast && (
                          <CheckCheck size={12} className="text-primary" />
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-6 border-t bg-white shrink-0 space-y-2">
                {sendError && (
                  <div className="flex items-center gap-2 text-xs font-bold text-red-600 px-2">
                    <AlertCircle size={14} />
                    <span>{sendError}</span>
                  </div>
                )}
                <form
                  onSubmit={handleSend}
                  className="bg-muted/30 p-2 rounded-[2rem] border focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/5 transition-all flex items-center gap-2"
                >
                  <div className="flex items-center px-2">
                    <button type="button" className="p-2 text-muted-foreground hover:text-primary transition-colors"><Paperclip size={20} /></button>
                    <button type="button" className="p-2 text-muted-foreground hover:text-primary transition-colors"><ImageIcon size={20} /></button>
                    <button type="button" className="p-2 text-muted-foreground hover:text-primary transition-colors"><Smile size={20} /></button>
                  </div>
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Viết câu trả lời..."
                    disabled={isSending}
                    className="flex-1 bg-transparent border-none outline-none text-sm font-bold py-2 placeholder:text-muted-foreground/60 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={isSending}
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg",
                      inputText.trim() && !isSending ? "bg-primary text-white scale-100" : "bg-muted text-muted-foreground scale-90 opacity-50"
                    )}
                  >
                    {isSending
                      ? <Loader2 size={20} className="animate-spin" />
                      : <Send size={20} className={cn(inputText.trim() && "translate-x-0.5 -translate-y-0.5")} />}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center space-y-6 text-center p-12">
              <div className="w-24 h-24 bg-muted/30 rounded-[2.5rem] flex items-center justify-center text-muted-foreground/20">
                <MessageSquare size={48} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black">Chọn một cuộc hội thoại</h2>
                <p className="text-muted-foreground font-medium max-w-sm">
                  Kết nối với khách hàng của bạn qua nhiều kênh (Facebook, Instagram, TikTok, Zalo) tại một nơi duy nhất.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      <AddBookingModal
        isOpen={isAddBookingOpen}
        onClose={() => setIsAddBookingOpen(false)}
        initialGuestName={selectedThread?.guestName}
        initialGuestPhone={selectedThread?.guestPhone}
        fromThreadId={selectedThread?.id}
      />
    </Shell>
  );
}
