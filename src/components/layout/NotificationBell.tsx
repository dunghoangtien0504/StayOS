"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useTimelineStore } from '@/store/useTimelineStore';
import { 
  Bell, CheckCheck, Trash2, 
  UserCheck, UserMinus, Sparkles, 
  CreditCard, Info, ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import Link from 'next/link';

export const NotificationBell = () => {
  const { notifications, markAsRead, markAllAsRead, clearAllNotifications } = useTimelineStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'check_in': return <UserCheck className="text-green-500" size={18} />;
      case 'check_out': return <UserMinus className="text-amber-500" size={18} />;
      case 'new_booking': return <Sparkles className="text-primary" size={18} />;
      case 'payment_received': return <CreditCard className="text-blue-500" size={18} />;
      default: return <Info className="text-muted-foreground" size={18} />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-3 rounded-2xl transition-all duration-300",
          isOpen ? "bg-primary/10 text-primary shadow-inner" : "hover:bg-muted text-muted-foreground hover:text-foreground"
        )}
      >
        <Bell size={22} className={cn(isOpen && "animate-bounce")} />
        {unreadCount > 0 && (
          <span className="absolute top-2.5 right-2.5 w-5 h-5 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-sm animate-in zoom-in duration-300">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed md:absolute left-2 right-2 md:left-auto md:right-0 top-[60px] md:top-auto md:mt-4 md:w-[400px] bg-white rounded-[2rem] shadow-2xl border border-muted/50 overflow-hidden z-[70] animate-in fade-in slide-in-from-top-4 duration-300">
          {/* Header */}
          <div className="p-6 border-b bg-muted/10 flex items-center justify-between">
            <div>
              <h3 className="font-black text-lg">Thông báo</h3>
              <p className="text-xs text-muted-foreground font-bold">Bạn có {unreadCount} tin chưa đọc</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={markAllAsRead}
                className="p-2 hover:bg-white rounded-xl text-muted-foreground hover:text-primary transition-all group"
                title="Đánh dấu tất cả đã đọc"
              >
                <CheckCheck size={18} className="group-hover:scale-110" />
              </button>
              <button 
                onClick={clearAllNotifications}
                className="p-2 hover:bg-white rounded-xl text-muted-foreground hover:text-red-500 transition-all group"
                title="Xóa tất cả"
              >
                <Trash2 size={18} className="group-hover:scale-110" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[60vh] md:max-h-[500px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="py-16 px-8 text-center space-y-3">
                <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto text-muted-foreground/30">
                  <Bell size={32} />
                </div>
                <p className="text-muted-foreground font-medium">Hộp thư thông báo đang trống</p>
              </div>
            ) : (
              <div className="divide-y divide-muted/30">
                {notifications.map((n) => (
                  <div 
                    key={n.id}
                    onClick={() => markAsRead(n.id)}
                    className={cn(
                      "p-5 flex gap-4 transition-all hover:bg-muted/30 cursor-pointer group relative",
                      !n.isRead && "bg-primary/5"
                    )}
                  >
                    {!n.isRead && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
                    
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                      !n.isRead ? "bg-white" : "bg-muted/50"
                    )}>
                      {getIcon(n.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className={cn("text-sm truncate", !n.isRead ? "font-black" : "font-bold text-muted-foreground")}>
                          {n.title}
                        </h4>
                        <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(n.createdAt, { addSuffix: true, locale: vi })}
                        </span>
                      </div>
                      <p className={cn(
                        "text-xs leading-relaxed",
                        !n.isRead ? "text-foreground font-medium" : "text-muted-foreground"
                      )}>
                        {n.message}
                      </p>
                      
                      {n.link && (
                        <Link 
                          href={n.link}
                          className="inline-flex items-center gap-1.5 text-[10px] font-black text-primary uppercase tracking-widest mt-2 hover:underline"
                        >
                          Chi tiết <ExternalLink size={10} />
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-4 border-t bg-muted/10 text-center">
              <button className="text-xs font-black text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest">
                Xem tất cả thông báo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
