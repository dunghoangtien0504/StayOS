"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTimelineStore } from '@/store/useTimelineStore';
import { AddBookingModal } from '@/components/booking/AddBookingModal';
import {
  Calendar,
  LayoutDashboard,
  Users,
  Settings,
  Home,
  Search,
  Plus,
  ChevronDown,
  MessageSquare,
  ClipboardList,
  List,
  TrendingDown,
  BarChart3,
  FileSpreadsheet,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { NotificationBell } from './NotificationBell';
import { CommandPalette } from './CommandPalette';
import { AdminAgentChat } from '@/components/settings/AdminAgentChat';
import { cn } from '@/lib/utils';

interface ShellProps {
  children: React.ReactNode;
  title: string;
}

export const Shell = ({ children, title }: ShellProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const {
    selectedPropertyId,
    setSelectedPropertyId,
    properties,
    user,
    logout,
    bookings,
    assignments,
    rooms,
    guests,
    chatThreads,
    addNotification,
    settings,
  } = useTimelineStore();
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [isAgentOpen, setIsAgentOpen] = useState(false);

  // ⌘K / Ctrl+K opens command palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(v => !v);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);


  // Monitoring refs to avoid duplicate notifications in same session
  const notifiedBookings = useRef(new Set<string>());
  const notifiedAssignments = useRef(new Set<string>());

  useEffect(() => {
    if (!user && pathname !== '/login') {
      router.push('/login');
    }
  }, [user, pathname, router]);

  // UNIT C: Background monitoring
  useEffect(() => {
    const checkStatus = () => {
      const now = new Date();
      const currentRooms = useTimelineStore.getState().rooms;

      // 1. Check for Late Check-ins (30 mins past check-in time)
      bookings.forEach(b => {
        if ((b.status === 'confirmed' || b.status === 'deposited') && !notifiedBookings.current.has(b.id)) {
          const lateThreshold = new Date(b.checkIn.getTime() + 30 * 60 * 1000);
          if (now > lateThreshold) {
            const room = currentRooms.find(r => r.id === b.roomId);
            addNotification({
              type: 'system',
              title: 'Cảnh báo Check-in trễ',
              message: `Khách ${b.guestName} trễ giờ check-in hơn 30 phút (Phòng ${room?.name || b.roomId})`
            });
            notifiedBookings.current.add(b.id);
          }
        }
      });

      // 2. Check for Housekeeping Delay (4 hours pending)
      assignments.forEach(a => {
        if (a.status === 'pending' && !notifiedAssignments.current.has(a.id)) {
          const delayThreshold = new Date(a.createdAt.getTime() + 4 * 60 * 60 * 1000);
          if (now > delayThreshold) {
            const room = currentRooms.find(r => r.id === a.roomId);
            addNotification({
              type: 'cleaning_done',
              title: 'Cảnh báo dọn phòng trễ',
              message: `Phòng ${room?.name || a.roomId} đã ở trạng thái chờ dọn hơn 4 giờ.`
            });
            notifiedAssignments.current.add(a.id);
          }
        }
      });
    };

    // Run every 60s
    const interval = setInterval(checkStatus, 60000);
    // Initial check
    checkStatus();

    return () => clearInterval(interval);
  }, [bookings, assignments, addNotification]);

  if (!user && pathname !== '/login') {
    return null;
  }

  const inboxUnread = chatThreads.reduce((sum, t) => sum + (t.unreadCount || 0), 0);
  const pendingCleaning = assignments.filter(a => a.status === 'pending').length;

  const hidden = settings?.hiddenNavItems ?? [];

  const navItems = [
    { slug: 'dashboard', icon: LayoutDashboard, label: 'Tổng quan', href: '/' },
    { slug: 'timeline', icon: Calendar, label: 'Lịch đặt phòng', href: '/bookings/timeline' },
    { slug: 'bookings-table', icon: List, label: 'Danh sách đặt phòng', href: '/bookings/table' },
    { slug: 'inbox', icon: MessageSquare, label: 'Smart Inbox', href: '/inbox', badge: inboxUnread || undefined },
    { slug: 'properties', icon: Home, label: 'Cơ sở / Phòng', href: '/settings/properties' },
    { slug: 'guests', icon: Users, label: 'Khách hàng', href: '/guests' },
  ].filter(i => !hidden.includes(i.slug));

  const opsItems = [
    { slug: 'housekeeping', icon: ClipboardList, label: 'Buồng phòng', href: '/housekeeping', badge: pendingCleaning || undefined, badgeColor: 'bg-amber-500' },
    { slug: 'staff', icon: Users, label: 'Nhân viên', href: '/settings/staff' },
    { slug: 'expenses', icon: TrendingDown, label: 'Quản lý Chi phí', href: '/finance/expenses' },
    { slug: 'reports', icon: BarChart3, label: 'Báo cáo P&L', href: '/finance/reports' },
    { slug: 'integrations', icon: FileSpreadsheet, label: 'Tích hợp & Xuất', href: '/settings/integrations' },
    { slug: 'admin', icon: Settings, label: 'Cài đặt hệ thống', href: '/settings/admin' },
  ].filter(i => !hidden.includes(i.slug));

  const selectedProperty = properties.find(p => p.id === selectedPropertyId);
  const selectedRoomCount = selectedPropertyId
    ? rooms.filter(r => r.propertyId === selectedPropertyId).length
    : rooms.length;
  const selectorLabel = selectedProperty?.name ?? 'Tất cả cơ sở';
  const selectorSubLabel = selectedPropertyId
    ? `${selectedRoomCount} phòng`
    : `${properties.length} cơ sở · ${selectedRoomCount} phòng`;

  return (
    <div className="flex h-dvh bg-[#F8F9FB] text-foreground font-sans overflow-hidden">

      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[55] md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:relative inset-y-0 left-0 z-[60]
        w-72 flex flex-col shadow-xl
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}
      style={{ backgroundColor: '#0D2B1A' }}
      >
        <div className="p-6" style={{ borderBottom: '1px solid #1F3D28' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg overflow-hidden"
              style={{ backgroundColor: settings?.branding?.primaryColor ?? '#C0390E' }}
            >
              {settings?.branding?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={settings.branding.logoUrl} alt="logo" className="w-full h-full object-cover" />
              ) : (
                <Home className="text-white" size={20} />
              )}
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tight leading-none uppercase text-white">{settings?.branding?.name ?? 'StayOS'}</h1>
              <p className="text-[10px] font-bold uppercase tracking-widest mt-1" style={{ color: '#6A9478' }}>Management OS</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-8">
          <div className="space-y-1">
            <p className="px-4 text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#4A7A58' }}>Menu chính</p>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all group relative`}
                style={pathname === item.href
                  ? { backgroundColor: '#C0390E', color: '#FFFFFF' }
                  : { color: '#A0C4B0' }
                }
                onMouseEnter={e => { if (pathname !== item.href) (e.currentTarget as HTMLElement).style.backgroundColor = '#1A3D26'; (e.currentTarget as HTMLElement).style.color = '#E8DDD0'; }}
                onMouseLeave={e => { if (pathname !== item.href) { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#A0C4B0'; }}}
              >
                <item.icon size={20} style={{ color: 'inherit' }} />
                {item.label}
                {item.badge && (
                  <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          <div className="space-y-1">
            <p className="px-4 text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#4A7A58' }}>Vận hành</p>
            {opsItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all"
                style={pathname === item.href
                  ? { backgroundColor: '#C0390E', color: '#FFFFFF' }
                  : { color: '#A0C4B0' }
                }
                onMouseEnter={e => { if (pathname !== item.href) { (e.currentTarget as HTMLElement).style.backgroundColor = '#1A3D26'; (e.currentTarget as HTMLElement).style.color = '#E8DDD0'; }}}
                onMouseLeave={e => { if (pathname !== item.href) { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#A0C4B0'; }}}
              >
                <item.icon size={20} style={{ color: 'inherit' }} />
                {item.label}
                {item.badge && (
                  <span className={`ml-auto ${item.badgeColor || 'bg-[#C0390E]'} text-white text-[10px] font-bold px-2 py-0.5 rounded-full`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </nav>

        <div className="p-4" style={{ borderTop: '1px solid #1F3D28' }}>
          <DropdownMenu>
            <DropdownMenuTrigger
              className="w-full text-left p-4 rounded-[1.5rem] transition-colors"
              style={{ backgroundColor: '#1A3D26', border: '1px dashed #2A5038' }}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#4A7A58' }}>Cơ sở đang xem</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-black" style={{ color: '#E8DDD0' }}>{selectorLabel}</p>
                  <p className="text-[10px] font-bold uppercase mt-0.5" style={{ color: '#6A9478' }}>{selectorSubLabel}</p>
                </div>
                <ChevronDown size={16} style={{ color: '#6A9478' }} />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuItem onClick={() => setSelectedPropertyId(null)}>
                <span className="font-bold">Tất cả cơ sở</span>
                <span className="ml-auto text-[10px] text-muted-foreground">{properties.length} cơ sở</span>
              </DropdownMenuItem>
              {properties.map((p) => {
                const count = rooms.filter(r => r.propertyId === p.id).length;
                return (
                  <DropdownMenuItem key={p.id} onClick={() => setSelectedPropertyId(p.id)}>
                    <span className="font-bold">{p.name}</span>
                    <span className="ml-auto text-[10px] text-muted-foreground">{count} phòng</span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-14 md:h-20 border-b flex items-center px-3 md:px-8 flex-shrink-0 z-50 gap-3" style={{ backgroundColor: '#FFFFFF', borderColor: '#D6CFC0' }}>
          {/* Hamburger — mobile only */}
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="md:hidden p-2 rounded-xl hover:bg-muted/50 text-muted-foreground transition-colors shrink-0"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
            <h2 className="text-base md:text-xl font-black tracking-tight truncate">{title}</h2>
            <div className="h-6 w-px bg-muted mx-1 md:mx-2 hidden md:block" />
            {/* Search — opens ⌘K command palette */}
            <button
              onClick={() => setCmdOpen(true)}
              className="hidden md:flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-xl border border-muted hover:border-primary/40 transition-colors text-muted-foreground"
            >
              <Search size={18} />
              <span className="text-sm font-medium w-52 text-left">Tìm khách, booking...</span>
              <kbd className="ml-auto text-[11px] font-bold bg-white border rounded px-1.5 py-0.5">⌘K</kbd>
            </button>
          </div>

          <div className="flex items-center gap-2 md:gap-6 shrink-0">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black leading-none">{user?.name || 'User'}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight mt-1">{user?.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}</p>
                <button
                  onClick={() => logout()}
                  className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:underline mt-1"
                >
                  Đăng xuất
                </button>
              </div>
              <div className="w-9 h-9 md:w-10 md:h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-black text-sm border-2 border-white shadow-sm ring-1 ring-primary/20">
                {user?.avatar || 'U'}
              </div>
            </div>

            <div className="h-8 w-px bg-muted hidden sm:block" />

            <div className="flex items-center gap-2 md:gap-3">
              <NotificationBell />
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1.5 md:gap-2 bg-primary text-white px-3 md:px-6 py-2 md:py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-95 transition-all"
              >
                <Plus size={16} className="md:hidden" />
                <Plus size={18} className="hidden md:block" />
                <span className="hidden sm:inline">Tạo đặt phòng</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-hidden flex flex-col pb-bottom-nav md:pb-0">
          {children}
        </main>
      </div>

      <AddBookingModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />

      {/* Mobile bottom navigation — hiện ở mọi trang */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 flex items-stretch h-bottom-nav shadow-[0_-1px_8px_rgba(0,0,0,0.08)]">
        {([
          { icon: LayoutDashboard, label: 'Tổng quan', href: '/' },
          { icon: Calendar,        label: 'Lịch',       href: '/bookings/timeline' },
          { icon: MessageSquare,   label: 'Inbox',      href: '/inbox', badge: chatThreads.reduce((s, t) => s + t.unreadCount, 0) },
          { icon: ClipboardList,   label: 'Buồng phòng', href: '/housekeeping' },
        ] as { icon: React.ElementType; label: string; href: string; badge?: number }[]).map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 pt-2 pb-safe relative transition-colors ${isActive ? 'text-primary' : 'text-gray-400'}`}
            >
              <div className="relative">
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                {!!item.badge && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[9px] font-bold px-1 py-0.5 rounded-full leading-none min-w-[14px] text-center">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-semibold leading-none ${isActive ? 'text-primary' : 'text-gray-400'}`}>
                {item.label}
              </span>
              {isActive && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />}
            </Link>
          );
        })}
      </nav>

      {/* Floating AI Agent Widget */}
      <div className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-50 flex flex-col items-end">
        {/* Chat Panel */}
        {isAgentOpen && (
          <div className="mb-4 w-[420px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-16rem)] shadow-2xl rounded-2xl overflow-hidden flex flex-col bg-white border border-slate-200 transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
            <AdminAgentChat onClose={() => setIsAgentOpen(false)} />
          </div>
        )}

        {/* Floating Button */}
        <button
          onClick={() => setIsAgentOpen(v => !v)}
          className={cn(
            "w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-white transition-all shadow-xl hover:scale-110 active:scale-95",
            isAgentOpen 
              ? "bg-slate-800 shadow-slate-800/30 hover:bg-slate-700" 
              : "bg-primary shadow-primary/30 hover:bg-primary/90"
          )}
        >
          {isAgentOpen ? (
            <X size={20} />
          ) : (
            <div className="relative">
              <Sparkles size={20} className="animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 border-2 border-[#0D2B1A] rounded-full" />
            </div>
          )}
        </button>
      </div>
    </div>
  );
};
