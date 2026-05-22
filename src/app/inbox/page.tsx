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
  RefreshCw, Loader2, AlertCircle, Sparkles, Bot, X,
  Zap, Pencil, Trash2, Plus, Check, Link as LinkIcon,
} from 'lucide-react';
import { getQuickReplies, saveQuickReplies, type QuickReply } from '@/lib/quickReplies';
import { cn, formatVNTime } from '@/lib/utils';
import { AddBookingModal } from '@/components/booking/AddBookingModal';

const EMOJIS = [
  '😊','😄','😂','🥰','😍','😘','🤩','😎',
  '👍','👏','🙏','❤️','🔥','✨','🎉','💯',
  '😢','😅','🤣','😇','🥳','🤗','😏','🫶',
  '🏠','🛏️','🚿','📅','💰','📞','✅','⭐',
  '🙂','😐','🤔','😬','😴','🤑','😋','🫡',
];

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
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Quick replies
  const [showQuickReply, setShowQuickReply] = useState(false);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [qrSearch, setQrSearch] = useState('');
  const [editingQR, setEditingQR] = useState<QuickReply | null>(null);
  const [editingField, setEditingField] = useState<{ shortcut: string; message: string }>({ shortcut: '', message: '' });
  const [editingImages, setEditingImages] = useState<string[]>([]);
  const [isUploadingQRImage, setIsUploadingQRImage] = useState(false);
  const qrImageInputRef = useRef<HTMLInputElement>(null);
  const [isAddingQR, setIsAddingQR] = useState(false);

  // Load quick replies from localStorage on mount
  useEffect(() => { setQuickReplies(getQuickReplies()); }, []);

  const saveQR = (updated: QuickReply[]) => {
    setQuickReplies(updated);
    saveQuickReplies(updated);
  };

  const startEditQR = (qr: QuickReply | null) => {
    setEditingQR(qr);
    setEditingField({ shortcut: qr?.shortcut ?? '', message: qr?.message ?? '' });
    setEditingImages(qr?.imageUrls ?? []);
    setIsAddingQR(qr === null);
  };

  // Upload an image for a QR template (stores relative URL)
  const handleQRImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setIsUploadingQRImage(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'Upload thất bại');
      setEditingImages(prev => [...prev, data.url as string]);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Upload ảnh thất bại');
    } finally {
      setIsUploadingQRImage(false);
    }
  };

  const filteredQR = quickReplies.filter(q =>
    q.shortcut.toLowerCase().includes(qrSearch.toLowerCase()) ||
    q.message.toLowerCase().includes(qrSearch.toLowerCase())
  );
  const [autoReply, setAutoReply] = useState(false);
  const autoReplyRef = useRef(false);

  // Per-thread auto-reply: set of threadIds that have individual auto-reply on
  const [perThreadAutoReply, setPerThreadAutoReply] = useState<Set<string>>(new Set());
  const perThreadAutoReplyRef = useRef<Set<string>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedThread = chatThreads.find(t => t.id === selectedThreadId);
  const filteredThreads = chatThreads.filter(t =>
    t.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Send a quick reply immediately (text + images)
  const handleQRSend = useCallback(async (qr: QuickReply) => {
    setShowQuickReply(false);
    setQrSearch('');

    const hasImages = qr.imageUrls && qr.imageUrls.length > 0;

    // No Pancake thread or no images → just fill input
    if (!selectedThread?.pageId || !hasImages) {
      setInputText(qr.message);
      return;
    }

    setIsSending(true);
    setSendError(null);
    try {
      // 1. Send text
      if (qr.message.trim()) {
        const res = await fetch('/api/pancake/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pageId: selectedThread.pageId,
            conversationId: selectedThread.id,
            customerId: selectedThread.customerId,
            message: qr.message,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Gửi text thất bại');
        sendMessage(selectedThread.id, qr.message);
      }
      // 2. Send each image
      for (const imgUrl of qr.imageUrls!) {
        const absoluteUrl = imgUrl.startsWith('http')
          ? imgUrl
          : `${window.location.origin}${imgUrl}`;
        const res = await fetch('/api/pancake/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pageId: selectedThread.pageId,
            conversationId: selectedThread.id,
            customerId: selectedThread.customerId,
            contentUrl: absoluteUrl,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Gửi ảnh thất bại');
        sendMessage(selectedThread.id, '[Ảnh]');
      }
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Gửi thất bại');
    } finally {
      setIsSending(false);
    }
  }, [selectedThread, sendMessage]);

  // Keep refs in sync so interval callbacks always see latest values
  useEffect(() => { autoReplyRef.current = autoReply; }, [autoReply]);
  useEffect(() => { perThreadAutoReplyRef.current = perThreadAutoReply; }, [perThreadAutoReply]);

  const togglePerThreadAutoReply = (threadId: string) => {
    setPerThreadAutoReply(prev => {
      const next = new Set(prev);
      if (next.has(threadId)) next.delete(threadId);
      else next.add(threadId);
      return next;
    });
  };

  // ── Auto-reply: call agent and send to Pancake ────────────────
  const triggerAutoReply = useCallback(async (thread: ReturnType<typeof syncItemToThread>) => {
    if (!thread.pageId) return;
    try {
      // Fetch full messages for context
      const params = new URLSearchParams({
        pageId: thread.pageId,
        conversationId: thread.id,
        ...(thread.customerId ? { customerId: thread.customerId } : {}),
      });
      const msgRes = await fetch(`/api/pancake/messages?${params}`);
      const msgData = await msgRes.json();
      if (!msgData.success) return;

      const msgs: { role: string; content: string }[] = (msgData.messages as { isFromGuest: boolean; content: string }[])
        .slice(-6)
        .map(m => ({ role: m.isFromGuest ? 'user' : 'assistant', content: m.content }));

      const lastUser = [...msgs].reverse().find(m => m.role === 'user');
      if (!lastUser) return;

      const aiRes = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: lastUser.content, history: msgs.slice(0, -1) }),
      });
      const aiData = await aiRes.json();
      if (!aiData.reply) return;

      await fetch('/api/pancake/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId: thread.pageId,
          conversationId: thread.id,
          customerId: thread.customerId,
          message: aiData.reply,
        }),
      });
    } catch {
      // silent — auto-reply failures shouldn't break the UI
    }
  }, []);

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

      // Auto-reply: global (all unread) OR per-thread (specific threads)
      const unread = threads.filter(t => t.unreadCount > 0);
      for (const t of unread) {
        if (autoReplyRef.current || perThreadAutoReplyRef.current.has(t.id)) {
          triggerAutoReply(t);
        }
      }
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Lỗi không xác định');
    } finally {
      setIsSyncing(false);
    }
  }, [syncPancakeThreads, triggerAutoReply]);

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

  // ── AI suggest reply ─────────────────────────────────────────
  const handleAiSuggest = async () => {
    if (!selectedThread || isAiLoading) return;
    const msgs = selectedThread.messages;
    if (msgs.length === 0) return;

    setIsAiLoading(true);
    setAiError(null);
    try {
      // Build history from last 6 messages
      const history = msgs.slice(-6).map(m => ({
        role: m.isFromGuest ? 'user' : 'assistant',
        content: m.content,
      }));
      const lastGuest = [...msgs].reverse().find(m => m.isFromGuest);
      if (!lastGuest) return;

      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: lastGuest.content, history: history.slice(0, -1) }),
      });
      const data = await res.json();
      if (!res.ok || !data.reply) throw new Error(data.error || 'AI không trả về kết quả');
      setInputText(data.reply);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Lỗi AI');
    } finally {
      setIsAiLoading(false);
    }
  };

  // ── Upload & send image directly to Pancake (multipart) ─────
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedThread?.pageId) return;
    e.target.value = '';

    setIsUploadingImage(true);
    setSendError(null);
    try {
      // Send file directly to Pancake via our proxy endpoint (no intermediate URL needed)
      const form = new FormData();
      form.append('file', file);
      form.append('pageId', selectedThread.pageId);
      form.append('conversationId', selectedThread.id);
      if (selectedThread.customerId) form.append('customerId', selectedThread.customerId);

      const res = await fetch('/api/pancake/send-image', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Gửi ảnh thất bại');

      sendMessage(selectedThread.id, `[Ảnh: ${file.name}]`);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Lỗi gửi ảnh');
    } finally {
      setIsUploadingImage(false);
    }
  };

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
      <div className="h-full flex overflow-hidden" style={{ background: '#f5f6fa' }}>

        {/* ── Sidebar ── */}
        <div className="w-[320px] border-r flex flex-col h-full bg-white">

          {/* Sidebar header */}
          <div className="px-4 pt-4 pb-3 border-b space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-gray-800">Hội thoại</span>
              <div className="flex items-center gap-1">
                {totalUnread > 0 && (
                  <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[11px] font-semibold">
                    {totalUnread}
                  </span>
                )}
                <button
                  onClick={runSync}
                  disabled={isSyncing}
                  title={lastSyncAt ? `Đồng bộ lúc ${formatVNTime(lastSyncAt)}` : 'Đồng bộ Pancake'}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={15} className={cn(isSyncing && 'animate-spin')} />
                </button>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input
                type="text"
                placeholder="Tìm hội thoại..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-primary/50 outline-none text-sm text-gray-700 placeholder:text-gray-400 transition-all"
              />
            </div>
            {syncError && (
              <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2.5">
                <AlertCircle size={13} className="shrink-0 mt-0.5" />
                <span>{syncError}</span>
              </div>
            )}
          </div>

          {/* Thread list */}
          <div className="flex-1 overflow-y-auto">
            {isSyncing && chatThreads.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
                <Loader2 size={24} className="animate-spin" />
                <span className="text-xs">Đang đồng bộ...</span>
              </div>
            )}
            {!isSyncing && chatThreads.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-400 text-center px-6">
                <MessageSquare size={28} className="opacity-40" />
                <span className="text-xs">Chưa có hội thoại nào</span>
              </div>
            )}
            {filteredThreads.map(thread => (
              <div
                key={thread.id}
                onClick={() => setSelectedThreadId(thread.id)}
                className={cn(
                  "px-4 py-3 cursor-pointer transition-colors flex gap-3 relative border-b border-gray-100",
                  selectedThreadId === thread.id
                    ? "bg-primary/5 border-l-[3px] border-l-primary"
                    : "hover:bg-gray-50 border-l-[3px] border-l-transparent"
                )}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary font-semibold text-sm">
                    {thread.guestName.charAt(0)}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-white rounded-full flex items-center justify-center border border-gray-200">
                    {getSourceIcon(thread.source)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-1 mb-0.5">
                    <span className={cn("text-sm truncate", thread.unreadCount > 0 ? "font-semibold text-gray-900" : "font-medium text-gray-700")}>
                      {thread.guestName}
                    </span>
                    <span className="text-[11px] text-gray-400 whitespace-nowrap shrink-0">
                      {formatVNTime(thread.lastMessageAt)}
                    </span>
                  </div>
                  <p className={cn(
                    "text-xs truncate leading-snug",
                    thread.unreadCount > 0 ? "text-gray-800 font-medium" : "text-gray-400"
                  )}>
                    {thread.lastMessage || '📷 Hình ảnh'}
                  </p>
                </div>

                {/* Badges */}
                <div className="flex flex-col items-end justify-between gap-1 shrink-0">
                  {thread.unreadCount > 0 && !perThreadAutoReply.has(thread.id) && (
                    <span className="w-2 h-2 rounded-full bg-primary mt-1" />
                  )}
                  {perThreadAutoReply.has(thread.id) && (
                    <button
                      onClick={(e) => { e.stopPropagation(); togglePerThreadAutoReply(thread.id); }}
                      className="w-5 h-5 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center hover:bg-violet-200 transition-colors"
                      title="AI tự động BẬT — bấm để tắt"
                    >
                      <Bot size={11} />
                    </button>
                  )}
                  {!perThreadAutoReply.has(thread.id) && (
                    <button
                      onClick={(e) => { e.stopPropagation(); togglePerThreadAutoReply(thread.id); }}
                      className="w-5 h-5 rounded-full text-gray-300 flex items-center justify-center hover:bg-gray-100 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-all"
                      title="Bật AI tự động cho khách này"
                    >
                      <Bot size={11} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Chat Window ── */}
        <div className="flex-1 flex flex-col h-full">
          {selectedThread ? (
            <>
              {/* Chat Header — Pancake style */}
              <div className="border-b bg-white flex items-center justify-between px-5 py-3 shrink-0 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-primary font-semibold text-sm">
                      {selectedThread.guestName.charAt(0)}
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-white rounded-full" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 leading-tight">
                      <span className="text-sm font-semibold text-gray-900">{selectedThread.guestName}</span>
                      {selectedThread.linkedBookingId && (
                        <Link
                          href={`/bookings/table?focus=${selectedThread.linkedBookingId}`}
                          className="flex items-center gap-1 px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-medium hover:bg-primary/20 transition-colors"
                        >
                          <LinkIcon size={9} />
                          #{selectedThread.linkedBookingId.split('-')[1]}
                        </Link>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
                      {getSourceIcon(selectedThread.source)}
                      <span className="uppercase tracking-wide">{selectedThread.source}</span>
                      {selectedThread.guestPhone && <span>• {selectedThread.guestPhone}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {!selectedThread.linkedBookingId && (
                    <button
                      onClick={() => setIsAddBookingOpen(true)}
                      className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50 transition-all"
                    >
                      <Plus size={13} />
                      Tạo booking
                    </button>
                  )}
                  <button
                    onClick={() => selectedThread && togglePerThreadAutoReply(selectedThread.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                      selectedThread && perThreadAutoReply.has(selectedThread.id)
                        ? 'bg-violet-500 text-white border-violet-500'
                        : 'border-gray-200 text-gray-500 hover:border-violet-300 hover:text-violet-600'
                    )}
                  >
                    <Bot size={13} />
                    AI riêng
                  </button>
                  <button
                    onClick={() => setAutoReply(v => !v)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                      autoReply
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'border-gray-200 text-gray-500 hover:border-orange-300 hover:text-orange-600'
                    )}
                  >
                    <Bot size={13} />
                    Tự động trả lời
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400"><Phone size={17} /></button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400"><User size={17} /></button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3" style={{ background: '#f0f2f5' }}>
                {isLoadingMessages && (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
                    <Loader2 size={22} className="animate-spin" />
                    <span className="text-xs">Đang tải tin nhắn...</span>
                  </div>
                )}

                {!isLoadingMessages && selectedThread.messages.length === 0 && (
                  <div className="flex justify-center py-4">
                    <span className="px-3 py-1 bg-white/70 rounded-full text-[11px] text-gray-400 shadow-sm">
                      Bắt đầu hội thoại
                    </span>
                  </div>
                )}

                {selectedThread.messages.map((msg, idx) => {
                  const isLast = idx === selectedThread.messages.length - 1;
                  const hasText = msg.content && msg.content.trim().length > 0;
                  const hasImages = msg.attachments && msg.attachments.length > 0;
                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex flex-col max-w-[72%]",
                        msg.isFromGuest ? "mr-auto items-start" : "ml-auto items-end"
                      )}
                    >
                      {/* Bubble */}
                      {hasText && (
                        <div className={cn(
                          "rounded-2xl text-sm leading-relaxed",
                          msg.isFromGuest
                            ? "bg-white text-gray-800 shadow-sm rounded-tl-sm px-3.5 py-2.5"
                            : "bg-primary text-white rounded-tr-sm px-3.5 py-2.5"
                        )}>
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      )}

                      {/* Images — grid layout like Pancake */}
                      {hasImages && (
                        <div className={cn(
                          "mt-1",
                          hasText ? "mt-1.5" : ""
                        )}>
                          {msg.attachments!.length === 1 ? (
                            <img
                              src={msg.attachments![0]}
                              alt="ảnh"
                              className="max-w-[280px] max-h-[320px] rounded-2xl object-cover cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
                              onClick={() => window.open(msg.attachments![0], '_blank')}
                            />
                          ) : msg.attachments!.length === 2 ? (
                            <div className="grid grid-cols-2 gap-1">
                              {msg.attachments!.map((url, i) => (
                                <img key={i} src={url} alt="ảnh"
                                  className="w-[140px] h-[140px] rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
                                  onClick={() => window.open(url, '_blank')} />
                              ))}
                            </div>
                          ) : (
                            <div className="grid grid-cols-3 gap-1">
                              {msg.attachments!.map((url, i) => (
                                <img key={i} src={url} alt="ảnh"
                                  className="w-[110px] h-[110px] rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
                                  onClick={() => window.open(url, '_blank')} />
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Time + read receipt */}
                      <div className={cn(
                        "mt-1 flex items-center gap-1.5",
                        msg.isFromGuest ? "" : "flex-row-reverse"
                      )}>
                        <span className="text-[11px] text-gray-400">
                          {formatVNTime(msg.timestamp)}
                        </span>
                        {!msg.isFromGuest && isLast && (
                          <CheckCheck size={13} className="text-primary" />
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="bg-white border-t shrink-0">
                {/* Errors */}
                {(sendError || aiError) && (
                  <div className="px-4 pt-2 space-y-1">
                    {sendError && (
                      <div className="flex items-center gap-2 text-xs text-red-500">
                        <AlertCircle size={13} /><span>{sendError}</span>
                      </div>
                    )}
                    {aiError && (
                      <div className="flex items-center gap-2 text-xs text-orange-500">
                        <AlertCircle size={13} /><span>{aiError}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Emoji Picker */}
                {showEmojiPicker && (
                  <div className="mx-4 mt-3 bg-white border rounded-xl shadow-lg p-3 relative">
                    <button type="button" onClick={() => setShowEmojiPicker(false)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">
                      <X size={13} />
                    </button>
                    <div className="grid grid-cols-10 gap-0.5">
                      {EMOJIS.map(emoji => (
                        <button key={emoji} type="button"
                          onClick={() => setInputText(t => t + emoji)}
                          className="text-lg p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Reply Panel */}
                {showQuickReply && (
                  <div className="mx-4 mt-3 bg-white border rounded-xl shadow-lg overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-3 py-2 border-b bg-gray-50">
                      <span className="text-xs font-semibold text-gray-600">Mẫu trả lời nhanh</span>
                      <div className="flex items-center gap-2">
                        <button type="button"
                          onClick={() => startEditQR(null)}
                          className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium hover:bg-primary/20 transition-colors">
                          <Plus size={11} /> Thêm
                        </button>
                        <button type="button" onClick={() => setShowQuickReply(false)} className="text-gray-400 hover:text-gray-600">
                          <X size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Search */}
                    <div className="px-3 py-2 border-b">
                      <input type="text" placeholder="Tìm mẫu..." value={qrSearch}
                        onChange={e => setQrSearch(e.target.value)}
                        className="w-full text-xs px-3 py-1.5 rounded-lg bg-gray-50 border outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>

                    {/* Add / Edit form */}
                    {(isAddingQR || editingQR) && (
                      <div className="px-3 py-3 bg-primary/5 border-b space-y-2">
                        {/* Row 1: shortcut + message + save/cancel */}
                        <div className="flex gap-2">
                          <input type="text" placeholder="Tắt (BG)" value={editingField.shortcut}
                            onChange={e => setEditingField(f => ({ ...f, shortcut: e.target.value.toUpperCase() }))}
                            className="w-20 text-xs px-2.5 py-1.5 rounded-lg border outline-none focus:ring-2 focus:ring-primary/20 bg-white font-semibold" />
                          <input type="text" placeholder="Nội dung tin nhắn..."  value={editingField.message}
                            onChange={e => setEditingField(f => ({ ...f, message: e.target.value }))}
                            className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border outline-none focus:ring-2 focus:ring-primary/20 bg-white" />
                          <button type="button"
                            onClick={() => {
                              if (!editingField.shortcut.trim()) return;
                              const entry = { ...editingField, imageUrls: editingImages };
                              if (editingQR) {
                                saveQR(quickReplies.map(q => q.id === editingQR.id ? { ...q, ...entry } : q));
                              } else {
                                saveQR([...quickReplies, { id: Date.now().toString(), ...entry }]);
                              }
                              setEditingQR(null); setIsAddingQR(false);
                              setEditingField({ shortcut: '', message: '' }); setEditingImages([]);
                            }}
                            className="px-2.5 py-1.5 bg-primary text-white rounded-lg text-xs hover:bg-primary/90 shrink-0">
                            <Check size={13} />
                          </button>
                          <button type="button"
                            onClick={() => { setEditingQR(null); setIsAddingQR(false); setEditingImages([]); }}
                            className="px-2.5 py-1.5 bg-gray-100 text-gray-500 rounded-lg text-xs hover:bg-gray-200 shrink-0">
                            <X size={13} />
                          </button>
                        </div>

                        {/* Row 2: image upload + thumbnails */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <input ref={qrImageInputRef} type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            className="hidden" onChange={handleQRImageUpload} />
                          <button type="button"
                            onClick={() => qrImageInputRef.current?.click()}
                            disabled={isUploadingQRImage}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-dashed border-gray-300 text-gray-500 text-xs hover:border-primary hover:text-primary transition-colors disabled:opacity-50">
                            {isUploadingQRImage
                              ? <Loader2 size={13} className="animate-spin" />
                              : <ImageIcon size={13} />}
                            {isUploadingQRImage ? 'Đang tải...' : 'Thêm ảnh'}
                          </button>
                          {editingImages.map((url, i) => (
                            <div key={i} className="relative group">
                              <img src={url} alt="" className="w-12 h-12 rounded-lg object-cover border border-gray-200" />
                              <button type="button"
                                onClick={() => setEditingImages(imgs => imgs.filter((_, j) => j !== i))}
                                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <X size={9} />
                              </button>
                            </div>
                          ))}
                          {editingImages.length > 0 && (
                            <span className="text-[11px] text-gray-400">{editingImages.length} ảnh đính kèm</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* List */}
                    <div className="max-h-56 overflow-y-auto divide-y divide-gray-50">
                      {filteredQR.length === 0 && (
                        <div className="text-center py-5 text-xs text-gray-400">Không tìm thấy</div>
                      )}
                      {filteredQR.map((qr, i) => (
                        <div key={qr.id}
                          className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 cursor-pointer group transition-colors"
                          onClick={() => {
                            if (editingQR?.id === qr.id) return;
                            handleQRSend(qr);
                          }}>
                          <span className="text-[10px] text-gray-300 w-4 shrink-0 text-center">{i + 1}</span>
                          <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-semibold shrink-0 min-w-[2.5rem] text-center">
                            {qr.shortcut}
                          </span>
                          {/* Image count badge */}
                          {qr.imageUrls && qr.imageUrls.length > 0 && (
                            <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-orange-50 text-orange-500 rounded text-[10px] font-medium shrink-0">
                              <ImageIcon size={10} />
                              +{qr.imageUrls.length}
                            </span>
                          )}
                          <p className="flex-1 text-xs text-gray-600 truncate">{qr.message || <span className="text-gray-400 italic">chỉ ảnh</span>}</p>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={e => e.stopPropagation()}>
                            <button type="button"
                              onClick={() => startEditQR(qr)}
                              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-primary">
                              <Pencil size={11} />
                            </button>
                            <button type="button"
                              onClick={() => saveQR(quickReplies.filter(q => q.id !== qr.id))}
                              className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500">
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hidden image input */}
                <input ref={imageInputRef} type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden" onChange={handleImageUpload} />

                {/* Toolbar + input */}
                <div className="px-4 pt-2 pb-1 flex items-center gap-1 border-b border-gray-100">
                  <button type="button"
                    onClick={() => { setShowQuickReply(v => !v); setShowEmojiPicker(false); }}
                    title="Mẫu trả lời nhanh"
                    className={cn("p-1.5 rounded-lg transition-colors", showQuickReply ? "text-primary bg-primary/10" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100")}>
                    <Zap size={18} />
                  </button>
                  <button type="button" className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100" title="Đính kèm file">
                    <Paperclip size={18} />
                  </button>
                  <button type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={isUploadingImage || !selectedThread?.pageId}
                    title="Gửi ảnh"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-40">
                    {isUploadingImage ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />}
                  </button>
                  <button type="button"
                    onClick={() => { setShowEmojiPicker(v => !v); setShowQuickReply(false); }}
                    title="Chọn emoji"
                    className={cn("p-1.5 rounded-lg transition-colors", showEmojiPicker ? "text-primary bg-primary/10" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100")}>
                    <Smile size={18} />
                  </button>
                </div>

                {/* Text input row */}
                <form onSubmit={handleSend} className="flex items-end gap-2 px-4 py-3">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Aa"
                    disabled={isSending}
                    className="flex-1 bg-gray-100 rounded-2xl px-4 py-2.5 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-gray-400 disabled:opacity-50 transition-all"
                  />
                  <button type="button" onClick={handleAiSuggest}
                    disabled={isAiLoading || !selectedThread?.messages.some(m => m.isFromGuest)}
                    title="AI gợi ý"
                    className="w-9 h-9 rounded-full bg-violet-100 text-violet-500 flex items-center justify-center hover:bg-violet-200 disabled:opacity-40 transition-colors shrink-0">
                    {isAiLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  </button>
                  <button type="submit" disabled={isSending || !inputText.trim()}
                    className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0",
                      inputText.trim() && !isSending ? "bg-primary text-white hover:bg-primary/90" : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    )}>
                    {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className={cn(inputText.trim() && "translate-x-0.5 -translate-y-0.5")} />}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <MessageSquare size={32} className="text-gray-300" />
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-gray-700">Chọn một cuộc hội thoại</h2>
                <p className="text-sm text-gray-400 max-w-xs">
                  Kết nối với khách qua Facebook, Instagram, TikTok, Zalo tại một nơi.
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
