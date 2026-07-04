import { create } from 'zustand';
import {
  Booking,
  Room,
  Property,
  CleaningAssignment,
  RoomStatus,
  Expense,
  Guest,
  Staff,
  Notification,
  User,
  ChatThread,
  Message,
  PaymentRecord,
  Settings,
  ChatLabel,
} from '@/lib/types';
import { startOfToday, format } from 'date-fns';
import { calculateBookingTotal } from '@/lib/pricing';
import { db } from '@/lib/db';

// ── Default settings ──────────────────────────────────────────────────────────

const initialSettings: Settings = {
  branding: {
    name: 'Ta Thong Dong Homestay',
    primaryColor: '#E8843A',
    timezone: 'Asia/Ho_Chi_Minh',
  },
  theme: { colorScheme: 'light' },
  hiddenNavItems: [],
  hiddenWidgets: [],
  notifPrefs: {
    check_in: true,
    check_out: true,
    cleaning_done: true,
    new_booking: true,
    payment_received: true,
    system: true,
  },
  enabledBookingSources: ['zalo', 'facebook', 'booking', 'airbnb', 'walk_in', 'direct'],
  customExpenseCategories: [],
  cleaningTaskTemplates: ['Thay ga giường', 'Lau nhà', 'Vệ sinh toilet', 'Đổ rác', 'Bổ sung amenity'],
};

// ── State interface ───────────────────────────────────────────────────────────

interface TimelineState {
  properties: Property[];
  rooms: Room[];
  bookings: Booking[];
  assignments: CleaningAssignment[];
  expenses: Expense[];
  guests: Guest[];
  staff: Staff[];
  notifications: Notification[];
  user: User | null;
  chatThreads: ChatThread[];
  customLabels: ChatLabel[];
  settings: Settings;
  selectedPropertyId: string;
  startDate: Date;
  daysToShow: number;
  activeConflictBookingId: string | null;
  isLoaded: boolean;

  loadFromDb: () => Promise<void>;
  updateSettings: (updates: Partial<Settings>) => void;

  // Booking actions
  setSelectedPropertyId: (id: string | null) => void;
  setStartDate: (date: Date) => void;
  setActiveConflictBookingId: (id: string | null) => void;
  updateBooking: (bookingId: string, updates: Partial<Booking>) => boolean;
  markAllPaid: () => number;
  addBooking: (booking: Omit<Booking, 'id'>, fromThreadId?: string) => string | null;
  checkConflict: (roomId: string, checkIn: Date, checkOut: Date, excludeBookingId?: string) => boolean;

  // Housekeeping
  updateRoomStatus: (roomId: string, status: RoomStatus) => void;
  startCleaning: (assignmentId: string, housekeeperName: string) => void;
  completeCleaning: (assignmentId: string, photos: string[]) => void;

  // Booking lifecycle
  checkInBooking: (bookingId: string) => boolean;
  checkOutBooking: (bookingId: string) => void;
  addPayment: (bookingId: string, amount: number, method: 'cash' | 'transfer' | 'card', note?: string) => void;
  deletePayment: (bookingId: string, paymentId: string) => void;
  deleteBooking: (bookingId: string) => void;
  markAsNoShow: (bookingId: string) => void;

  // Finance
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  deleteExpense: (expenseId: string) => void;

  // Property & Room settings
  addProperty: (property: Omit<Property, 'id'>) => void;
  updateProperty: (propertyId: string, updates: Partial<Property>) => void;
  deleteProperty: (propertyId: string) => void;
  addRoom: (room: Omit<Room, 'id'>) => void;
  updateRoom: (roomId: string, updates: Partial<Room>) => void;
  deleteRoom: (roomId: string) => void;

  // Guest CRM
  addGuest: (guest: Omit<Guest, 'id' | 'createdAt'>) => void;
  updateGuest: (guestId: string, updates: Partial<Guest>) => void;
  deleteGuest: (guestId: string) => void;

  // Staff
  addStaff: (staff: Omit<Staff, 'id' | 'createdAt'>) => void;
  updateStaff: (staffId: string, updates: Partial<Staff>) => void;
  deleteStaff: (staffId: string) => void;
  assignTask: (assignmentId: string, staffId: string) => void;

  // Notifications
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearAllNotifications: () => void;

  // Auth
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;

  // Chat
  sendMessage: (threadId: string, content: string) => void;
  markThreadAsRead: (threadId: string) => void;
  syncMetaThreads: (threads: ChatThread[]) => void;
  setThreadMessages: (threadId: string, messages: Message[]) => void;
  appendLiveMessage: (senderId: string, msg: Message) => boolean;
  setThreadLabels: (threadId: string, labelIds: string[]) => void;
  addCustomLabel: (label: Omit<ChatLabel, 'id'>) => void;
  deleteCustomLabel: (labelId: string) => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useTimelineStore = create<TimelineState>()((set, get) => ({
  // Initial state — empty until loaded from Supabase
  properties: [],
  rooms: [],
  bookings: [],
  assignments: [],
  expenses: [],
  guests: [],
  staff: [
    { id: 's-1', name: 'Nguyễn Văn Dọn', role: 'housekeeping', phone: '0912345678', active: true, createdAt: new Date() },
    { id: 's-2', name: 'Trần Thị Sạch', role: 'housekeeping', phone: '0987654321', active: true, createdAt: new Date() },
  ],
  notifications: [
    { id: 'n-1', type: 'system', title: 'Chào mừng trở lại', message: 'Hệ thống PMS đã sẵn sàng.', isRead: false, createdAt: new Date() },
  ],
  user: {
    id: 'u-1',
    name: 'Admin User',
    email: 'admin@stayos.com',
    role: 'admin',
    avatar: 'AD',
  },
  chatThreads: [],
  customLabels: [],
  settings: initialSettings,
  selectedPropertyId: 'p1',
  startDate: startOfToday(),
  daysToShow: 7,
  activeConflictBookingId: null,
  isLoaded: false,

  // ── DB load ─────────────────────────────────────────────────────────────────

  loadFromDb: async () => {
    try {
      const data = await db.fetchAll();

      if (data.isEmpty) {
        // First run: seed May–June historical data from mock-data.ts
        await db.seedInitialData(get().settings);
        const seeded = await db.fetchAll();
        set({
          properties: seeded.properties,
          rooms: seeded.rooms,
          bookings: seeded.bookings,
          guests: seeded.guests,
          staff: seeded.staff.length ? seeded.staff : get().staff,
          expenses: seeded.expenses,
          assignments: seeded.assignments,
          customLabels: seeded.customLabels,
          settings: seeded.settings ?? initialSettings,
          selectedPropertyId: seeded.properties[0]?.id ?? 'p1',
          isLoaded: true,
        });
      } else {
        set({
          properties: data.properties,
          rooms: data.rooms,
          bookings: data.bookings,
          guests: data.guests,
          staff: data.staff.length ? data.staff : get().staff,
          expenses: data.expenses,
          assignments: data.assignments,
          customLabels: data.customLabels,
          settings: data.settings ?? initialSettings,
          selectedPropertyId: data.properties[0]?.id ?? '',
          isLoaded: true,
        });
      }
    } catch (err) {
      console.error('[StayOS] loadFromDb failed:', err);
      // Allow app to continue in offline mode with empty state
      set({ isLoaded: true });
    }
  },

  // ── Settings ────────────────────────────────────────────────────────────────

  updateSettings: (updates) => {
    set((state) => {
      const next: Settings = {
        ...state.settings,
        ...updates,
        branding: { ...state.settings.branding, ...(updates.branding || {}) },
        theme: { ...state.settings.theme, ...(updates.theme || {}) },
        notifPrefs: { ...state.settings.notifPrefs, ...(updates.notifPrefs || {}) },
      };
      db.saveSettings(next).catch(console.error);
      return { settings: next };
    });
  },

  // ── Navigation / UI ─────────────────────────────────────────────────────────

  setSelectedPropertyId: (id) => set({ selectedPropertyId: id ?? '' }),

  setStartDate: (date) => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    set({ startDate: normalized });
  },

  setActiveConflictBookingId: (id) => set({ activeConflictBookingId: id }),

  // ── Expenses ────────────────────────────────────────────────────────────────

  addExpense: (expenseData) => {
    const newId = `e-${Math.random().toString(36).substr(2, 9)}`;
    const expense: Expense = { ...expenseData, id: newId };
    set((state) => ({ expenses: [...state.expenses, expense] }));
    db.upsertExpense(expense).catch(console.error);
  },

  deleteExpense: (expenseId) => {
    set((state) => ({ expenses: state.expenses.filter(e => e.id !== expenseId) }));
    db.deleteExpense(expenseId).catch(console.error);
  },

  // ── Housekeeping ────────────────────────────────────────────────────────────

  updateRoomStatus: (roomId, status) => {
    set((state) => {
      const updatedRoom = state.rooms.find(r => r.id === roomId);
      if (!updatedRoom) return {};
      const updated = { ...updatedRoom, status };
      db.upsertRoom(updated).catch(console.error);
      return { rooms: state.rooms.map(r => r.id === roomId ? updated : r) };
    });
  },

  startCleaning: (assignmentId, housekeeperName) => {
    const assignment = get().assignments.find(a => a.id === assignmentId);
    if (!assignment) return;

    set((state) => {
      const updated = state.assignments.map(a =>
        a.id === assignmentId
          ? { ...a, status: 'in_progress' as const, staffName: housekeeperName, startedAt: new Date() }
          : a
      );
      const updatedA = updated.find(a => a.id === assignmentId)!;
      db.upsertAssignment(updatedA).catch(console.error);
      return { assignments: updated };
    });
    get().updateRoomStatus(assignment.roomId, 'cleaning');
  },

  completeCleaning: (assignmentId, photos) => {
    const assignment = get().assignments.find(a => a.id === assignmentId);
    if (!assignment) return;

    set((state) => {
      const updated = state.assignments.map(a =>
        a.id === assignmentId
          ? { ...a, status: 'done' as const, photos, completedAt: new Date() }
          : a
      );
      const updatedA = updated.find(a => a.id === assignmentId)!;
      db.upsertAssignment(updatedA).catch(console.error);
      return { assignments: updated };
    });
    get().updateRoomStatus(assignment.roomId, 'clean');
  },

  // ── Booking lifecycle ────────────────────────────────────────────────────────

  checkInBooking: (bookingId) => {
    const { bookings, rooms } = get();
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return false;

    const room = rooms.find(r => r.id === booking.roomId);
    if (room?.status !== 'clean') return false;

    set((state) => {
      const updated = state.bookings.map(b =>
        b.id === bookingId ? { ...b, status: 'checked_in' as const, actualCheckIn: new Date() } : b
      );
      const updatedB = updated.find(b => b.id === bookingId)!;
      db.upsertBooking(updatedB).catch(console.error);
      return { bookings: updated };
    });

    get().addNotification({
      type: 'check_in',
      title: 'Khách đã Check-in',
      message: `Khách ${booking.guestName} đã vào ${room?.name ?? 'phòng'}.`,
      link: '/bookings/table',
    });

    return true;
  },

  checkOutBooking: (bookingId) => {
    const { bookings, rooms } = get();
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const room = rooms.find(r => r.id === booking.roomId);

    set((state) => {
      const updated = state.bookings.map(b =>
        b.id === bookingId ? { ...b, status: 'checked_out' as const, actualCheckOut: new Date() } : b
      );
      const updatedB = updated.find(b => b.id === bookingId)!;
      db.upsertBooking(updatedB).catch(console.error);
      return { bookings: updated };
    });

    get().addNotification({
      type: 'check_out',
      title: 'Khách đã Check-out',
      message: `Khách ${booking.guestName} đã trả ${room?.name ?? 'phòng'}.`,
      link: '/housekeeping',
    });

    get().updateRoomStatus(booking.roomId, 'dirty');

    const newAssignmentId = `c-${Math.random().toString(36).substr(2, 9)}`;
    const newAssignment: CleaningAssignment = {
      id: newAssignmentId,
      roomId: booking.roomId,
      bookingId,
      status: 'pending',
      photos: [],
      createdAt: new Date(),
    };
    set((state) => ({ assignments: [...state.assignments, newAssignment] }));
    db.upsertAssignment(newAssignment).catch(console.error);
  },

  addPayment: (bookingId, amount, method, note) => {
    if (!Number.isFinite(amount) || amount <= 0) return;
    const booking = get().bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const payment: PaymentRecord = {
      id: `pay-${Math.random().toString(36).substr(2, 9)}`,
      bookingId,
      amount,
      method,
      date: new Date(),
      note,
    };

    const newAmountPaid = booking.amountPaid + amount;
    const shouldBeDeposited = newAmountPaid >= booking.totalPrice && booking.status === 'confirmed';

    set((state) => {
      const updated = state.bookings.map(b =>
        b.id === bookingId
          ? {
              ...b,
              amountPaid: newAmountPaid,
              status: shouldBeDeposited ? 'deposited' as const : b.status,
              payments: [...(b.payments || []), payment],
            }
          : b
      );
      const updatedB = updated.find(b => b.id === bookingId)!;
      db.upsertBooking(updatedB).catch(console.error);
      return { bookings: updated };
    });

    get().addNotification({
      type: 'payment_received',
      title: 'Đã thu tiền',
      message: `Đã thu ${amount.toLocaleString('vi-VN')}đ từ ${booking.guestName}`,
    });
  },

  deletePayment: (bookingId, paymentId) => {
    const booking = get().bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const payment = booking.payments?.find(p => p.id === paymentId);
    if (!payment) return;

    const newAmountPaid = Math.max(0, booking.amountPaid - payment.amount);

    set((state) => {
      const updated = state.bookings.map(b =>
        b.id === bookingId
          ? {
              ...b,
              amountPaid: newAmountPaid,
              status: (b.status === 'deposited' && newAmountPaid < b.totalPrice) ? 'confirmed' as const : b.status,
              payments: (b.payments || []).filter(p => p.id !== paymentId),
            }
          : b
      );
      const updatedB = updated.find(b => b.id === bookingId)!;
      db.upsertBooking(updatedB).catch(console.error);
      return { bookings: updated };
    });

    get().addNotification({
      type: 'system',
      title: 'Hủy giao dịch',
      message: `Đã xóa giao dịch ${payment.amount.toLocaleString('vi-VN')}đ của ${booking.guestName}`,
    });
  },

  deleteBooking: (bookingId) => {
    set((state) => ({ bookings: state.bookings.filter(b => b.id !== bookingId) }));
    db.deleteBooking(bookingId).catch(console.error);
  },

  markAsNoShow: (bookingId) => {
    const booking = get().bookings.find(b => b.id === bookingId);
    if (!booking) return;

    set((state) => {
      const updated = state.bookings.map(b =>
        b.id === bookingId ? { ...b, status: 'no_show' as const } : b
      );
      const updatedB = updated.find(b => b.id === bookingId)!;
      db.upsertBooking(updatedB).catch(console.error);
      return { bookings: updated };
    });

    get().addNotification({
      type: 'system',
      title: 'No-show',
      message: `Khách ${booking.guestName} không đến nhận phòng.`,
    });
  },

  checkConflict: (roomId, checkIn, checkOut, excludeBookingId) => {
    return get().bookings.some((b) => {
      if (b.id === excludeBookingId) return false;
      if (b.roomId !== roomId) return false;
      if (b.status === 'cancelled' || b.status === 'no_show') return false;
      return checkIn.getTime() < b.checkOut.getTime() && checkOut.getTime() > b.checkIn.getTime();
    });
  },

  updateBooking: (bookingId, updates) => {
    const { bookings, rooms, checkConflict } = get();
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return false;

    const newRoomId = updates.roomId ?? booking.roomId;
    const newCheckIn = updates.checkIn ?? booking.checkIn;
    const newCheckOut = updates.checkOut ?? booking.checkOut;

    if (checkConflict(newRoomId, newCheckIn, newCheckOut, bookingId)) return false;

    let newTotalPrice = updates.totalPrice ?? booking.totalPrice;
    if ((updates.roomId || updates.checkIn || updates.checkOut) && updates.totalPrice === undefined) {
      const room = rooms.find(r => r.id === newRoomId);
      if (room) newTotalPrice = calculateBookingTotal(room, newCheckIn, newCheckOut);
    }

    set((state) => {
      const updated = state.bookings.map((b) =>
        b.id === bookingId ? { ...b, ...updates, totalPrice: newTotalPrice } : b
      );
      const updatedB = updated.find(b => b.id === bookingId)!;
      db.upsertBooking(updatedB).catch(console.error);
      return { bookings: updated };
    });
    return true;
  },

  markAllPaid: () => {
    const { bookings } = get();
    const unpaid = bookings.filter(
      b => b.status !== 'cancelled' && b.status !== 'no_show' && b.amountPaid < b.totalPrice
    );
    if (unpaid.length === 0) return 0;
    set((state) => {
      const updated = state.bookings.map(b => {
        if (b.status === 'cancelled' || b.status === 'no_show' || b.amountPaid >= b.totalPrice) return b;
        const updatedB = { ...b, amountPaid: b.totalPrice };
        db.upsertBooking(updatedB).catch(console.error);
        return updatedB;
      });
      return { bookings: updated };
    });
    return unpaid.length;
  },

  addBooking: (newBookingData, fromThreadId) => {
    const { bookings, rooms, guests, checkConflict, addGuest, addNotification } = get();

    if (checkConflict(newBookingData.roomId, newBookingData.checkIn, newBookingData.checkOut)) {
      return null;
    }

    const guestExists = guests.some(g => g.phone === newBookingData.guestPhone);
    if (!guestExists && newBookingData.guestPhone) {
      addGuest({ name: newBookingData.guestName, phone: newBookingData.guestPhone });
    }

    const room = rooms.find(r => r.id === newBookingData.roomId);
    const newId = `b-${Math.random().toString(36).substr(2, 9)}`;
    const booking: Booking = { ...newBookingData, id: newId, payments: [] };

    set({ bookings: [...bookings, booking] });
    db.upsertBooking(booking).catch(console.error);

    if (fromThreadId) {
      set((state) => ({
        chatThreads: state.chatThreads.map(t =>
          t.id === fromThreadId ? { ...t, linkedBookingId: newId } : t
        ),
      }));
    }

    addNotification({
      type: 'new_booking',
      title: 'Đặt phòng mới',
      message: `${newBookingData.guestName} – ${room?.name || 'Phòng'} – ${format(newBookingData.checkIn, 'dd/MM HH:mm')}`,
    });

    return newId;
  },

  // ── Property & Room ─────────────────────────────────────────────────────────

  addProperty: (propertyData) => {
    const newId = `p-${Math.random().toString(36).substr(2, 9)}`;
    const property: Property = { ...propertyData, id: newId };
    set((state) => ({ properties: [...state.properties, property] }));
    db.upsertProperty(property).catch(console.error);
  },

  updateProperty: (propertyId, updates) => {
    set((state) => {
      const updated = state.properties.map(p => p.id === propertyId ? { ...p, ...updates } : p);
      const updatedP = updated.find(p => p.id === propertyId)!;
      db.upsertProperty(updatedP).catch(console.error);
      return { properties: updated };
    });
  },

  deleteProperty: (propertyId) => {
    set((state) => ({
      properties: state.properties.filter(p => p.id !== propertyId),
      rooms: state.rooms.filter(r => r.propertyId !== propertyId),
      bookings: state.bookings.filter(b => b.propertyId !== propertyId),
      selectedPropertyId: state.selectedPropertyId === propertyId
        ? (state.properties.find(p => p.id !== propertyId)?.id || '')
        : state.selectedPropertyId,
    }));
    db.deleteProperty(propertyId).catch(console.error);
  },

  addRoom: (roomData) => {
    const newId = `r-${Math.random().toString(36).substr(2, 9)}`;
    const room: Room = { ...roomData, id: newId };
    set((state) => ({ rooms: [...state.rooms, room] }));
    db.upsertRoom(room).catch(console.error);
  },

  updateRoom: (roomId, updates) => {
    set((state) => {
      const updated = state.rooms.map(r => r.id === roomId ? { ...r, ...updates } : r);
      const updatedR = updated.find(r => r.id === roomId)!;
      db.upsertRoom(updatedR).catch(console.error);
      return { rooms: updated };
    });
  },

  deleteRoom: (roomId) => {
    set((state) => ({
      rooms: state.rooms.filter(r => r.id !== roomId),
      bookings: state.bookings.filter(b => b.roomId !== roomId),
    }));
    db.deleteRoom(roomId).catch(console.error);
  },

  // ── Guests ──────────────────────────────────────────────────────────────────

  addGuest: (guestData) => {
    const newId = `g-${Math.random().toString(36).substr(2, 9)}`;
    const guest: Guest = { ...guestData, id: newId, createdAt: new Date() };
    set((state) => ({ guests: [...state.guests, guest] }));
    db.upsertGuest(guest).catch(console.error);
  },

  updateGuest: (guestId, updates) => {
    set((state) => {
      const updated = state.guests.map(g => g.id === guestId ? { ...g, ...updates } : g);
      const updatedG = updated.find(g => g.id === guestId)!;
      db.upsertGuest(updatedG).catch(console.error);
      return { guests: updated };
    });
  },

  deleteGuest: (guestId) => {
    set((state) => ({ guests: state.guests.filter(g => g.id !== guestId) }));
    db.deleteGuest(guestId).catch(console.error);
  },

  // ── Staff ────────────────────────────────────────────────────────────────────

  addStaff: (staffData) => {
    const newId = `s-${Math.random().toString(36).substr(2, 9)}`;
    const staffMember: Staff = { ...staffData, id: newId, createdAt: new Date() };
    set((state) => ({ staff: [...state.staff, staffMember] }));
    db.upsertStaff(staffMember).catch(console.error);
  },

  updateStaff: (staffId, updates) => {
    set((state) => {
      const updated = state.staff.map(s => s.id === staffId ? { ...s, ...updates } : s);
      const updatedS = updated.find(s => s.id === staffId)!;
      db.upsertStaff(updatedS).catch(console.error);
      return { staff: updated };
    });
  },

  deleteStaff: (staffId) => {
    set((state) => ({ staff: state.staff.filter(s => s.id !== staffId) }));
    db.deleteStaff(staffId).catch(console.error);
  },

  assignTask: (assignmentId, staffId) => {
    const staffMember = get().staff.find(s => s.id === staffId);
    if (!staffMember) return;

    set((state) => {
      const updated = state.assignments.map(a =>
        a.id === assignmentId ? { ...a, staffId, staffName: staffMember.name } : a
      );
      const updatedA = updated.find(a => a.id === assignmentId)!;
      db.upsertAssignment(updatedA).catch(console.error);
      return { assignments: updated };
    });
  },

  // ── Notifications ────────────────────────────────────────────────────────────

  addNotification: (notificationData) => {
    const prefs = get().settings?.notifPrefs;
    if (prefs && prefs[notificationData.type] === false) return;
    const newId = `n-${Math.random().toString(36).substr(2, 9)}`;
    set((state) => ({
      notifications: [
        { ...notificationData, id: newId, isRead: false, createdAt: new Date() },
        ...state.notifications,
      ],
    }));
  },

  markAsRead: (notificationId) => {
    set((state) => ({
      notifications: state.notifications.map(n => n.id === notificationId ? { ...n, isRead: true } : n),
    }));
  },

  markAllAsRead: () => {
    set((state) => ({ notifications: state.notifications.map(n => ({ ...n, isRead: true })) }));
  },

  clearAllNotifications: () => set({ notifications: [] }),

  // ── Auth ─────────────────────────────────────────────────────────────────────

  login: async (email, password) => {
    if (email === 'admin@stayos.com' && password === 'admin123') {
      set({ user: { id: 'u-1', name: 'Admin User', email: 'admin@stayos.com', role: 'admin', avatar: 'AD' } });
      return true;
    }
    return false;
  },

  logout: () => set({ user: null }),

  // ── Chat ─────────────────────────────────────────────────────────────────────

  sendMessage: (threadId, content) => {
    const newMessage: Message = {
      id: `m-${Math.random().toString(36).substr(2, 9)}`,
      sender: 'StayOS Admin',
      content,
      timestamp: new Date(),
      isFromGuest: false,
    };
    set((state) => ({
      chatThreads: state.chatThreads.map(t =>
        t.id === threadId
          ? { ...t, messages: [...t.messages, newMessage], lastMessage: content, lastMessageAt: new Date() }
          : t
      ),
    }));
  },

  markThreadAsRead: (threadId) => {
    set((state) => ({
      chatThreads: state.chatThreads.map(t => t.id === threadId ? { ...t, unreadCount: 0 } : t),
    }));
  },

  syncMetaThreads: (threads) => {
    set((state) => {
      const prevById = new Map(state.chatThreads.map(t => [t.id, t]));
      const merged = threads.map((next) => {
        const prev = prevById.get(next.id);
        if (!prev) return next;
        const noNewActivity = prev.lastMessageAt.getTime() >= next.lastMessageAt.getTime();
        return {
          ...next,
          linkedBookingId: prev.linkedBookingId ?? next.linkedBookingId,
          labelIds: prev.labelIds ?? next.labelIds,
          unreadCount: noNewActivity ? prev.unreadCount : prev.unreadCount + 1,
          messages: prev.messagesLoaded ? prev.messages : next.messages,
          messagesLoaded: prev.messagesLoaded && noNewActivity,
        };
      });
      return { chatThreads: merged };
    });
  },

  setThreadMessages: (threadId, messages) => {
    set((state) => ({
      chatThreads: state.chatThreads.map(t => {
        if (t.id !== threadId) return t;
        const last = messages[messages.length - 1];
        return {
          ...t,
          messages,
          messagesLoaded: true,
          lastMessage: last ? last.content : t.lastMessage,
          lastMessageAt: last ? last.timestamp : t.lastMessageAt,
        };
      }),
    }));
  },

  appendLiveMessage: (senderId, msg) => {
    let found = false;
    set((state) => {
      const updated = state.chatThreads.map(t => {
        if (t.recipientId !== senderId) return t;
        found = true;
        return {
          ...t,
          lastMessage: msg.content || '[Ảnh]',
          lastMessageAt: msg.timestamp,
          unreadCount: msg.isFromGuest ? t.unreadCount + 1 : t.unreadCount,
          messages: t.messagesLoaded ? [...t.messages, msg] : t.messages,
        };
      });
      updated.sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());
      return { chatThreads: updated };
    });
    return found;
  },

  setThreadLabels: (threadId, labelIds) => {
    set((state) => ({
      chatThreads: state.chatThreads.map(t => t.id === threadId ? { ...t, labelIds } : t),
    }));
  },

  addCustomLabel: (label) => {
    const newLabel: ChatLabel = { ...label, id: `custom-${Date.now()}` };
    set((state) => ({ customLabels: [...(state.customLabels ?? []), newLabel] }));
    db.upsertLabel(newLabel).catch(console.error);
  },

  deleteCustomLabel: (labelId) => {
    set((state) => ({
      customLabels: (state.customLabels ?? []).filter(l => l.id !== labelId),
      chatThreads: state.chatThreads.map(t => ({
        ...t,
        labelIds: (t.labelIds ?? []).filter(id => id !== labelId),
      })),
    }));
    db.deleteLabel(labelId).catch(console.error);
  },
}));
