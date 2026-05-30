import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
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
} from '@/lib/types';
import { mockBookings, mockRooms, mockProperties, mockCleaningAssignments, mockExpenses } from '@/lib/mock-data';
import { startOfToday, format } from 'date-fns';
import { calculateBookingTotal } from '@/lib/pricing';

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
  settings: Settings;
  selectedPropertyId: string;
  startDate: Date;
  daysToShow: number;
  activeConflictBookingId: string | null;

  updateSettings: (updates: Partial<Settings>) => void;
  
  // Actions
  setSelectedPropertyId: (id: string | null) => void;
  setStartDate: (date: Date) => void;
  setActiveConflictBookingId: (id: string | null) => void;
  updateBooking: (bookingId: string, updates: Partial<Booking>) => boolean;
  addBooking: (booking: Omit<Booking, 'id'>, fromThreadId?: string) => string | null;
  checkConflict: (roomId: string, checkIn: Date, checkOut: Date, excludeBookingId?: string) => boolean;
  
  // Housekeeping Actions
  updateRoomStatus: (roomId: string, status: RoomStatus) => void;
  startCleaning: (assignmentId: string, housekeeperName: string) => void;
  completeCleaning: (assignmentId: string, photos: string[]) => void;

  // Booking Lifecycle Actions
  checkInBooking: (bookingId: string) => boolean;
  checkOutBooking: (bookingId: string) => void;
  addPayment: (bookingId: string, amount: number, method: 'cash' | 'transfer' | 'card', note?: string) => void;
  markAsNoShow: (bookingId: string) => void;

  // Finance Actions
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  deleteExpense: (expenseId: string) => void;

  // Property & Room Settings
  addProperty: (property: Omit<Property, 'id'>) => void;
  updateProperty: (propertyId: string, updates: Partial<Property>) => void;
  deleteProperty: (propertyId: string) => void;
  addRoom: (room: Omit<Room, 'id'>) => void;
  updateRoom: (roomId: string, updates: Partial<Room>) => void;
  deleteRoom: (roomId: string) => void;

  // Guest CRM Actions
  addGuest: (guest: Omit<Guest, 'id' | 'createdAt'>) => void;
  updateGuest: (guestId: string, updates: Partial<Guest>) => void;
  deleteGuest: (guestId: string) => void;

  // Staff Actions
  addStaff: (staff: Omit<Staff, 'id' | 'createdAt'>) => void;
  updateStaff: (staffId: string, updates: Partial<Staff>) => void;
  deleteStaff: (staffId: string) => void;
  assignTask: (assignmentId: string, staffId: string) => void;

  // Notification Actions
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearAllNotifications: () => void;

  // Auth Actions
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;

  // Chat Actions
  sendMessage: (threadId: string, content: string) => void;
  markThreadAsRead: (threadId: string) => void;
  syncPancakeThreads: (threads: ChatThread[]) => void;
  setThreadMessages: (threadId: string, messages: Message[]) => void;
}

export const useTimelineStore = create<TimelineState>()(
  persist(
    (set, get) => ({
  properties: mockProperties,
  rooms: mockRooms,
  bookings: mockBookings,
  assignments: mockCleaningAssignments,
  expenses: mockExpenses,
  guests: [
    { id: 'g-real-1', name: 'Bao LePhong', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-2', name: 'Cherry Cherry', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-3', name: 'Cẩm Tú', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-4', name: 'Darlice Aurelius', phone: '', nationality: 'USA', createdAt: new Date('2026-06-01T00:00:00Z') },
    { id: 'g-real-5', name: 'Duyên Thùy', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-6', name: 'Freen Amstrong', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-7', name: 'Hoài Phương Võ', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-06-01T00:00:00Z') },
    { id: 'g-real-8', name: 'Hoàng Sơn', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-9', name: 'Hoàng Vũ', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-10', name: 'Huy Nguyễn', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-11', name: 'Huyen Nguyen', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-06-01T00:00:00Z') },
    { id: 'g-real-12', name: 'Huyền Như', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-13', name: 'Huỳnh Lê', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-14', name: 'Huỳnh Đăng Quang', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-15', name: 'Hồ Ngọc Hưng', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-16', name: 'Khôi Nguyên', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-17', name: 'Lys Nguyễn', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-18', name: 'Lâm Trần Tuấn', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-19', name: 'Lê Duy Minh', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-20', name: 'Lê Phượng', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-21', name: 'Lê Phạm Minh Tiên', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-22', name: 'Lịch Nguyễn', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-23', name: 'Minh Minh', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-24', name: 'Nguyễn Ngọc Thuý', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-25', name: 'Nguyễn Ngọc Thúy', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-26', name: 'Nguyễn Thanh Long', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-27', name: 'Nguyễn Tuấn Hùng', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-28', name: 'Nguyễn Ảnh Đăng Khoa', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-29', name: 'Ngô Trung', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-30', name: 'Ngọc Sáng', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-31', name: 'Nhà Nghỉ Tư Tùng II', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-32', name: 'Như Lâm', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-33', name: 'Phan Gia Thọ', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-34', name: 'Phạm Lê Vũ', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-35', name: 'Phạm Phương', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-36', name: 'Pé Bông', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-37', name: 'Quynh Nhu', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-38', name: 'Su Mihoo', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-39', name: 'Sóc Béo', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-40', name: 'Thanh Hằng', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-41', name: 'Thanh Phong Phan', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-42', name: 'Thuy Tien', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-06-01T00:00:00Z') },
    { id: 'g-real-43', name: 'Thuý Hằng', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-44', name: 'Thuỷ Tiên', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-45', name: 'Thư Nguyễn Đỗ', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-46', name: 'Thị Hà', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-47', name: 'Tosa Lance', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-06-01T00:00:00Z') },
    { id: 'g-real-48', name: 'Tran Nguyen', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-49', name: 'Tri Vo', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-50', name: 'Triết Học', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-51', name: 'Trương Kiệt', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-52', name: 'Trương Thị Diễm', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-53', name: 'Trần Dash', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-06-01T00:00:00Z') },
    { id: 'g-real-54', name: 'Trần Hoàng', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-06-01T00:00:00Z') },
    { id: 'g-real-55', name: 'Trần Ngọc Dung', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-56', name: 'Tường Vi', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-57', name: 'Võ Xuân Phú', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-58', name: '__chihai__', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-59', name: 'aiem_ngoc', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-60', name: 'dmh_197 - Harris', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-61', name: 'emtraimuadong - Đạt Phạm', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-62', name: 'luann.van - Luan Van', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-63', name: 'Lương Gia Bảo', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-64', name: 'minas', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-65', name: 'sob1004 - Madison', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-66', name: 'tai_minh_hoang - Tài Minh', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-67', name: 'uyenngan04 - Uyển Ngân', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-68', name: 'wlimt.19 - Ann', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-06-01T00:00:00Z') },
    { id: 'g-real-69', name: 'Ái Nhân', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-70', name: 'Đào Đình Chương', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-71', name: 'Đăng Như', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-72', name: 'Hoang Tony', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
    { id: 'g-real-73', name: 'Khách dài hạn', phone: '', nationality: 'Việt Nam', createdAt: new Date('2026-05-01T00:00:00Z') },
  ],
  notifications: [
    { id: 'n-1', type: 'system', title: 'Chào mừng trở lại', message: 'Hệ thống PMS đã sẵn sàng cho ngày hôm nay.', isRead: false, createdAt: new Date() },
  ],
  staff: [
    { id: 's-1', name: 'Nguyễn Văn Dọn', role: 'housekeeping', phone: '0912345678', active: true, createdAt: new Date() },
    { id: 's-2', name: 'Trần Thị Sạch', role: 'housekeeping', phone: '0987654321', active: true, createdAt: new Date() },
    { id: 's-3', name: 'Lê Văn Tẩy', role: 'housekeeping', phone: '0900112233', active: false, createdAt: new Date() },
  ],
  user: {
    id: 'u-1',
    name: 'Admin User',
    email: 'admin@stayos.com',
    role: 'admin',
    avatar: 'AD'
  },
  chatThreads: [
    {
      id: 't-1',
      guestName: 'Nguyễn Văn A',
      guestPhone: '0901234567',
      lastMessage: 'Cho mình hỏi phòng có ban công không?',
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 30),
      unreadCount: 1,
      source: 'zalo',
      messages: [
        { id: 'm-1', sender: 'Nguyễn Văn A', content: 'Chào bạn, mình muốn đặt phòng cho 2 người.', timestamp: new Date(Date.now() - 1000 * 60 * 60), isFromGuest: true },
        { id: 'm-2', sender: 'StayOS Admin', content: 'Chào bạn, StayOS xin nghe! Bạn muốn đặt vào ngày nào ạ?', timestamp: new Date(Date.now() - 1000 * 60 * 45), isFromGuest: false },
        { id: 'm-3', sender: 'Nguyễn Văn A', content: 'Cho mình hỏi phòng có ban công không?', timestamp: new Date(Date.now() - 1000 * 60 * 30), isFromGuest: true },
      ]
    },
    {
      id: 't-2',
      guestName: 'Trần Thị B',
      guestPhone: '0912345678',
      lastMessage: 'Cảm ơn bạn nhiều nhé!',
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 120),
      unreadCount: 0,
      source: 'facebook',
      messages: [
        { id: 'm-4', sender: 'Trần Thị B', content: 'P.102 còn trống không bạn?', timestamp: new Date(Date.now() - 1000 * 60 * 150), isFromGuest: true },
        { id: 'm-5', sender: 'StayOS Admin', content: 'Dạ còn bạn nhé, bạn check-in lúc mấy giờ ạ?', timestamp: new Date(Date.now() - 1000 * 60 * 130), isFromGuest: false },
        { id: 'm-6', sender: 'Trần Thị B', content: 'Cảm ơn bạn nhiều nhé!', timestamp: new Date(Date.now() - 1000 * 60 * 120), isFromGuest: true },
      ]
    }
  ],
  settings: {
    branding: {
      name: 'Ta Thong Dong Homestay',
      logoUrl: undefined,
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
  },
  selectedPropertyId: mockProperties[0].id,
  startDate: startOfToday(),
  daysToShow: 7,
  activeConflictBookingId: null,

  updateSettings: (updates) => set((state) => ({
    settings: {
      ...state.settings,
      ...updates,
      branding: { ...state.settings.branding, ...(updates.branding || {}) },
      theme: { ...state.settings.theme, ...(updates.theme || {}) },
      notifPrefs: { ...state.settings.notifPrefs, ...(updates.notifPrefs || {}) },
    }
  })),

  setSelectedPropertyId: (id) => set({ selectedPropertyId: id ?? '' }),
  setStartDate: (date) => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    set({ startDate: normalized });
  },
  setActiveConflictBookingId: (id) => set({ activeConflictBookingId: id }),

  addExpense: (expenseData) => {
    const newId = `e-${Math.random().toString(36).substr(2, 9)}`;
    set((state) => ({
      expenses: [...state.expenses, { ...expenseData, id: newId }]
    }));
  },

  deleteExpense: (expenseId) => {
    set((state) => ({
      expenses: state.expenses.filter(e => e.id !== expenseId)
    }));
  },

  updateRoomStatus: (roomId, status) => {
    set((state) => ({
      rooms: state.rooms.map(r => r.id === roomId ? { ...r, status } : r)
    }));
  },

  startCleaning: (assignmentId, housekeeperName) => {
    const assignment = get().assignments.find(a => a.id === assignmentId);
    if (!assignment) return;

    set((state) => ({
      assignments: state.assignments.map(a =>
        a.id === assignmentId
          ? { ...a, status: 'in_progress', staffName: housekeeperName, startedAt: new Date() }
          : a
      )
    }));
    get().updateRoomStatus(assignment.roomId, 'cleaning');
  },

  completeCleaning: (assignmentId, photos) => {
    const assignment = get().assignments.find(a => a.id === assignmentId);
    if (!assignment) return;

    set((state) => ({
      assignments: state.assignments.map(a => 
        a.id === assignmentId 
          ? { ...a, status: 'done', photos, completedAt: new Date() } 
          : a
      )
    }));
    get().updateRoomStatus(assignment.roomId, 'clean');
  },

  checkInBooking: (bookingId) => {
    const { bookings, rooms } = get();
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return false;

    const room = rooms.find(r => r.id === booking.roomId);
    if (room?.status !== 'clean') {
      return false;
    }

    set((state) => ({
      bookings: state.bookings.map(b =>
        b.id === bookingId
          ? { ...b, status: 'checked_in', actualCheckIn: new Date() }
          : b
      )
    }));

    get().addNotification({
      type: 'check_in',
      title: 'Khách đã Check-in',
      message: `Khách ${booking.guestName} đã vào ${room?.name ?? 'phòng'}.`,
      link: '/bookings/table'
    });

    return true;
  },

  checkOutBooking: (bookingId) => {
    const { bookings, rooms } = get();
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const room = rooms.find(r => r.id === booking.roomId);

    // Update booking status
    set((state) => ({
      bookings: state.bookings.map(b =>
        b.id === bookingId
          ? { ...b, status: 'checked_out', actualCheckOut: new Date() }
          : b
      )
    }));

    get().addNotification({
      type: 'check_out',
      title: 'Khách đã Check-out',
      message: `Khách ${booking.guestName} đã trả ${room?.name ?? 'phòng'}.`,
      link: '/housekeeping'
    });

    // Trigger Room Dirty and Cleaning Assignment
    get().updateRoomStatus(booking.roomId, 'dirty');
    
    const newAssignmentId = `c-${Math.random().toString(36).substr(2, 9)}`;
    set((state) => ({
      assignments: [
        ...state.assignments,
        {
          id: newAssignmentId,
          roomId: booking.roomId,
          bookingId: bookingId,
          status: 'pending',
          photos: [],
          createdAt: new Date(),
        }
      ]
    }));
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
      note
    };

    const newAmountPaid = booking.amountPaid + amount;
    const shouldBeDeposited = newAmountPaid >= booking.totalPrice && booking.status === 'confirmed';

    set((state) => ({
      bookings: state.bookings.map(b => 
        b.id === bookingId 
          ? { 
              ...b, 
              amountPaid: newAmountPaid, 
              status: shouldBeDeposited ? 'deposited' : b.status,
              payments: [...(b.payments || []), payment]
            } 
          : b
      )
    }));

    get().addNotification({
      type: 'payment_received',
      title: 'Đã thu tiền',
      message: `Đã thu ${amount.toLocaleString('vi-VN')}đ từ ${booking.guestName}`
    });
  },

  markAsNoShow: (bookingId) => {
    const booking = get().bookings.find(b => b.id === bookingId);
    if (!booking) return;

    set((state) => ({
      bookings: state.bookings.map(b => 
        b.id === bookingId ? { ...b, status: 'no_show' } : b
      )
    }));

    get().addNotification({
      type: 'system',
      title: 'No-show',
      message: `Khách ${booking.guestName} không đến nhận phòng.`
    });
  },

  checkConflict: (roomId, checkIn, checkOut, excludeBookingId) => {
    const { bookings } = get();
    const BUFFER_MS = 30 * 60 * 1000;
    
    return bookings.some((b) => {
      if (b.id === excludeBookingId) return false;
      if (b.roomId !== roomId) return false;
      if (b.status === 'cancelled' || b.status === 'no_show') return false;

      const bStart = b.checkIn.getTime();
      const bEnd = b.checkOut.getTime();
      const nStart = checkIn.getTime();
      const nEnd = checkOut.getTime();

      return (nStart < bEnd + BUFFER_MS) && (nEnd + BUFFER_MS > bStart);
    });
  },

  updateBooking: (bookingId, updates) => {
    const { bookings, rooms, checkConflict } = get();
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return false;

    const newRoomId = updates.roomId ?? booking.roomId;
    const newCheckIn = updates.checkIn ?? booking.checkIn;
    const newCheckOut = updates.checkOut ?? booking.checkOut;

    if (checkConflict(newRoomId, newCheckIn, newCheckOut, bookingId)) {
      return false;
    }

    // Recompute price if room or dates changed
    let newTotalPrice = updates.totalPrice ?? booking.totalPrice;
    if (updates.roomId || updates.checkIn || updates.checkOut) {
      const room = rooms.find(r => r.id === newRoomId);
      if (room) {
        const recomputedTotal = calculateBookingTotal(room, newCheckIn, newCheckOut);
        
        // Simple heuristic: if the user didn't manually set a new price in the update, recompute it
        if (updates.totalPrice === undefined) {
          newTotalPrice = recomputedTotal;
        }
      }
    }

    set({
      bookings: bookings.map((b) =>
        b.id === bookingId ? { ...b, ...updates, totalPrice: newTotalPrice } : b
      ),
    });
    return true;
  },

  addBooking: (newBookingData, fromThreadId) => {
    const { bookings, rooms, guests, checkConflict, addGuest, addNotification } = get();

    if (checkConflict(newBookingData.roomId, newBookingData.checkIn, newBookingData.checkOut)) {
      return null;
    }

    // Auto-link CRM
    const guestExists = guests.some(g => g.phone === newBookingData.guestPhone);
    if (!guestExists) {
      addGuest({
        name: newBookingData.guestName,
        phone: newBookingData.guestPhone
      });
    }

    const room = rooms.find(r => r.id === newBookingData.roomId);

    const newId = `b-${Math.random().toString(36).substr(2, 9)}`;
    const booking: Booking = {
      ...newBookingData,
      id: newId,
      payments: [] // Initialize payments array
    };

    set({
      bookings: [...bookings, booking],
    });

    // UNIT E: Link with chat thread if requested
    if (fromThreadId) {
      set((state) => ({
        chatThreads: state.chatThreads.map(t => 
          t.id === fromThreadId ? { ...t, linkedBookingId: newId } : t
        )
      }));
    }
    
    addNotification({
      type: 'new_booking',
      title: 'Đặt phòng mới',
      message: `${newBookingData.guestName} – ${room?.name || 'Phòng'} – ${format(newBookingData.checkIn, 'dd/MM HH:mm')}`
    });

    return newId;
  },

  // Property Actions
  addProperty: (propertyData) => {
    const newId = `p-${Math.random().toString(36).substr(2, 9)}`;
    set((state) => ({
      properties: [...state.properties, { ...propertyData, id: newId }]
    }));
  },

  updateProperty: (propertyId, updates) => {
    set((state) => ({
      properties: state.properties.map(p => p.id === propertyId ? { ...p, ...updates } : p)
    }));
  },

  deleteProperty: (propertyId) => {
    set((state) => ({
      properties: state.properties.filter(p => p.id !== propertyId),
      rooms: state.rooms.filter(r => r.propertyId !== propertyId),
      bookings: state.bookings.filter(b => b.propertyId !== propertyId),
      selectedPropertyId: state.selectedPropertyId === propertyId ? (state.properties[0]?.id || '') : state.selectedPropertyId
    }));
  },

  // Room Actions
  addRoom: (roomData) => {
    const newId = `r-${Math.random().toString(36).substr(2, 9)}`;
    set((state) => ({
      rooms: [...state.rooms, { ...roomData, id: newId }]
    }));
  },

  updateRoom: (roomId, updates) => {
    set((state) => ({
      rooms: state.rooms.map(r => r.id === roomId ? { ...r, ...updates } : r)
    }));
  },

  deleteRoom: (roomId) => {
    set((state) => ({
      rooms: state.rooms.filter(r => r.id !== roomId),
      bookings: state.bookings.filter(b => b.roomId !== roomId)
    }));
  },

  // Guest Actions
  addGuest: (guestData) => {
    const newId = `g-${Math.random().toString(36).substr(2, 9)}`;
    set((state) => ({
      guests: [...state.guests, { ...guestData, id: newId, createdAt: new Date() }]
    }));
  },

  updateGuest: (guestId, updates) => {
    set((state) => ({
      guests: state.guests.map(g => g.id === guestId ? { ...g, ...updates } : g)
    }));
  },

  deleteGuest: (guestId) => {
    set((state) => ({
      guests: state.guests.filter(g => g.id !== guestId)
    }));
  },

  // Staff Actions
  addStaff: (staffData) => {
    const newId = `s-${Math.random().toString(36).substr(2, 9)}`;
    set((state) => ({
      staff: [...state.staff, { ...staffData, id: newId, createdAt: new Date() }]
    }));
  },

  updateStaff: (staffId, updates) => {
    set((state) => ({
      staff: state.staff.map(s => s.id === staffId ? { ...s, ...updates } : s)
    }));
  },

  deleteStaff: (staffId) => {
    set((state) => ({
      staff: state.staff.filter(s => s.id !== staffId)
    }));
  },

  assignTask: (assignmentId, staffId) => {
    const staff = get().staff.find(s => s.id === staffId);
    if (!staff) return;

    set((state) => ({
      assignments: state.assignments.map(a => 
        a.id === assignmentId ? { ...a, staffId, staffName: staff.name } : a
      )
    }));
  },

  // Notification Actions
  addNotification: (notificationData) => {
    const prefs = get().settings?.notifPrefs;
    if (prefs && prefs[notificationData.type] === false) return;
    const newId = `n-${Math.random().toString(36).substr(2, 9)}`;
    set((state) => ({
      notifications: [
        { ...notificationData, id: newId, isRead: false, createdAt: new Date() },
        ...state.notifications
      ]
    }));
  },

  markAsRead: (notificationId) => {
    set((state) => ({
      notifications: state.notifications.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    }));
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map(n => ({ ...n, isRead: true }))
    }));
  },

  clearAllNotifications: () => {
    set({ notifications: [] });
  },

  // Auth Actions
  login: async (email, password) => {
    // Mock login logic
    if (email === 'admin@stayos.com' && password === 'admin123') {
      set({
        user: {
          id: 'u-1',
          name: 'Admin User',
          email: 'admin@stayos.com',
          role: 'admin',
          avatar: 'AD'
        }
      });
      return true;
    }
    return false;
  },

  logout: () => {
    set({ user: null });
  },

  // Chat Actions
  sendMessage: (threadId, content) => {
    const newMessage: Message = {
      id: `m-${Math.random().toString(36).substr(2, 9)}`,
      sender: 'StayOS Admin',
      content,
      timestamp: new Date(),
      isFromGuest: false
    };

    set((state) => ({
      chatThreads: state.chatThreads.map(t => 
        t.id === threadId 
          ? { 
              ...t, 
              messages: [...t.messages, newMessage],
              lastMessage: content,
              lastMessageAt: new Date()
            } 
          : t
      )
    }));
  },

  markThreadAsRead: (threadId) => {
    set((state) => ({
      chatThreads: state.chatThreads.map(t =>
        t.id === threadId ? { ...t, unreadCount: 0 } : t
      )
    }));
  },

  // Replace the thread list with freshly-synced Pancake conversations,
  // while preserving local state (loaded messages, booking links, reads).
  syncPancakeThreads: (threads) => {
    set((state) => {
      const prevById = new Map(state.chatThreads.map(t => [t.id, t]));
      const merged = threads.map((next) => {
        const prev = prevById.get(next.id);
        if (!prev) return next;
        // No new activity since last sync -> keep local read state + messages
        const noNewActivity =
          prev.lastMessageAt.getTime() >= next.lastMessageAt.getTime();
        return {
          ...next,
          linkedBookingId: prev.linkedBookingId ?? next.linkedBookingId,
          unreadCount: noNewActivity ? prev.unreadCount : next.unreadCount,
          messages: prev.messagesLoaded ? prev.messages : next.messages,
          messagesLoaded: prev.messagesLoaded && noNewActivity,
        };
      });
      return { chatThreads: merged };
    });
  },

  // Store the full message history fetched for one conversation.
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
      })
    }));
  },
    }),
    {
      name: 'stayos-store',
      version: 7,
      migrate: (_persistedState, fromVersion) => {
        console.log(`[StayOS] Store migrated from v${fromVersion} → v7. 73 khach that tu Excel.`);
        return undefined; // undefined = dùng initialState
      },
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        properties: state.properties,
        rooms: state.rooms,
        bookings: state.bookings,
        assignments: state.assignments,
        expenses: state.expenses,
        guests: state.guests,
        notifications: state.notifications,
        chatThreads: state.chatThreads,
        staff: state.staff,
        user: state.user,
        selectedPropertyId: state.selectedPropertyId,
        settings: state.settings,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Re-hydrate Date instances (JSON.parse trả về string)
        const toDate = (v: unknown) => (v ? new Date(v as string) : undefined);

        state.bookings = state.bookings.map((b) => ({
          ...b,
          checkIn: new Date(b.checkIn),
          checkOut: new Date(b.checkOut),
          actualCheckIn: toDate(b.actualCheckIn),
          actualCheckOut: toDate(b.actualCheckOut),
          payments: b.payments?.map(p => ({
            ...p,
            date: new Date(p.date)
          }))
        }));

        state.assignments = state.assignments.map((a) => ({
          ...a,
          createdAt: new Date(a.createdAt),
          startedAt: toDate(a.startedAt),
          completedAt: toDate(a.completedAt),
        }));

        state.expenses = state.expenses.map((e) => ({
          ...e,
          date: new Date(e.date),
        }));

        state.guests = state.guests.map((g) => ({
          ...g,
          createdAt: new Date(g.createdAt),
        }));

        state.notifications = state.notifications.map((n) => ({ ...n, createdAt: new Date(n.createdAt) }));
        state.staff = (state.staff ?? []).map((s) => ({ ...s, createdAt: new Date(s.createdAt) }));

        state.chatThreads = state.chatThreads.map((t) => ({
          ...t,
          lastMessageAt: new Date(t.lastMessageAt),
          messages: t.messages.map((m) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          })),
        }));

        state.startDate = new Date(state.startDate);
        state.startDate.setHours(0, 0, 0, 0); // Always snap to start of local day
        
        /* 
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (state.startDate.getTime() < today.getTime()) {
           state.startDate = today;
        }
        */
      },
    }
  )
);
