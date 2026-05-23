"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTimelineStore } from '@/store/useTimelineStore';
import { useEffect, useRef } from 'react';
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
} from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { NotificationBell } from './NotificationBell';

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
    chatThreads,
    addNotification,
    settings,
  } = useTimelineStore();
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

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
        w-72 bg-white border-r flex flex-col shadow-sm
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg overflow-hidden"
              style={{ backgroundColor: settings?.branding?.primaryColor ?? '#E8843A' }}
            >
              {settings?.branding?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={settings.branding.logoUrl} alt="logo" className="w-full h-full object-cover" />
              ) : (
                <Home className="text-white" size={20} />
              )}
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tight leading-none uppercase">{settings?.branding?.name ?? 'StayOS'}</h1>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Management OS</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-8">
          <div className="space-y-1">
            <p className="px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Menu chính</p>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all group relative
                  ${pathname === item.href ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
              >
                <item.icon size={20} className={pathname === item.href ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'} />
                {item.label}
                {item.badge && (
                  <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
                {pathname === item.href && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_8px_rgba(232,132,58,0.5)]" />
                )}
              </Link>
            ))}
          </div>

          <div className="space-y-1">
            <p className="px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Vận hành</p>
            {opsItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all group
                  ${pathname === item.href ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
              >
                <item.icon size={20} />
                {item.label}
                {item.badge && (
                  <span className={`ml-auto ${item.badgeColor || 'bg-primary'} text-white text-[10px] font-bold px-2 py-0.5 rounded-full`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </nav>

        <div className="p-4 border-t">
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full text-left bg-muted/30 p-4 rounded-[1.5rem] border border-dashed border-muted-foreground/20 hover:border-primary/40 transition-colors">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Cơ sở đang xem</p>
              <div className="flex items-center justify-between group">
                <div>
                  <p className="text-sm font-black text-foreground">{selectorLabel}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mt-0.5">{selectorSubLabel}</p>
                </div>
                <ChevronDown size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
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
        <header className="h-14 md:h-20 bg-white border-b flex items-center px-3 md:px-8 flex-shrink-0 z-50 shadow-sm gap-3">
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
            {/* Search — hidden on mobile */}
            <div className="hidden md:flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-xl border border-muted focus-within:border-primary/50 transition-colors">
              <Search size={18} className="text-muted-foreground" />
              <input
                type="text"
                placeholder="Tìm khách hàng, booking... (⌘K)"
                className="bg-transparent border-none outline-none text-sm font-medium w-64 placeholder:text-muted-foreground/60"
              />
            </div>
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

        <main className="flex-1 overflow-hidden flex flex-col">
          {children}
        </main>
      </div>

      <AddBookingModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />
    </div>
  );
};
