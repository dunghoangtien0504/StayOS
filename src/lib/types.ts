export type BookingStatus = 'confirmed' | 'deposited' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';

export type BookingSource = 'zalo' | 'facebook' | 'booking' | 'airbnb' | 'walk_in' | 'direct';

export type RoomStatus = 'clean' | 'dirty' | 'cleaning';

export interface Property {
  id: string;
  name: string;
  address: string;
  checkInTime: string; // HH:mm
  checkOutTime: string; // HH:mm
}

export interface Room {
  id: string;
  propertyId: string;
  name: string;
  roomType: string;
  status: RoomStatus;
  floor: number;
  basePrice: number;
}

export interface Booking {
  id: string;
  propertyId: string;
  roomId: string;
  guestName: string;
  guestPhone: string;
  source: BookingSource;
  status: BookingStatus;
  checkIn: Date;
  checkOut: Date;
  actualCheckIn?: Date;
  actualCheckOut?: Date;
  totalPrice: number;
  amountPaid: number;
  payments?: PaymentRecord[];
}

export interface PaymentRecord {
  id: string;
  bookingId: string;
  amount: number;
  method: 'cash' | 'transfer' | 'card';
  date: Date;
  note?: string;
}

export type CleaningStatus = 'pending' | 'in_progress' | 'done';

export interface CleaningAssignment {
  id: string;
  roomId: string;
  bookingId?: string;
  staffId?: string;
  staffName?: string;
  status: CleaningStatus;
  photos: string[]; // Array of image URLs
  notes?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

export interface Staff {
  id: string;
  name: string;
  role: 'housekeeping' | 'reception' | 'manager';
  phone: string;
  active: boolean;
  createdAt: Date;
}

export type ExpenseCategory = 'electricity' | 'water' | 'laundry' | 'salary' | 'commission' | 'maintenance' | 'other';

export interface Expense {
  id: string;
  propertyId?: string; // Optional: can be a general expense
  amount: number;
  category: ExpenseCategory | string;
  date: Date;
  note: string;
}

export interface Guest {
  id: string;
  name: string;
  phone: string;
  email?: string;
  idCard?: string; // Hộ chiếu/CCCD
  nationality?: string;
  notes?: string;
  createdAt: Date;
}

export type NotificationType = 'check_in' | 'check_out' | 'cleaning_done' | 'new_booking' | 'payment_received' | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  link?: string;
}

export type UserRole = 'admin' | 'manager' | 'staff' | 'housekeeping';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
  isFromGuest: boolean;
}

export interface Settings {
  branding: {
    name: string;
    logoUrl?: string;
    primaryColor: string;
    timezone: string;
  };
  theme: {
    colorScheme: 'light' | 'dark' | 'system';
  };
  hiddenNavItems: string[];
  hiddenWidgets: string[];
  notifPrefs: Record<NotificationType, boolean>;
  enabledBookingSources: BookingSource[];
  customExpenseCategories: string[];
  cleaningTaskTemplates: string[];
}

export type ChatSource =
  | 'zalo'
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'booking'
  | 'airbnb';

export interface ChatThread {
  id: string;
  guestName: string;
  guestPhone: string;
  lastMessage: string;
  lastMessageAt: Date;
  unreadCount: number;
  messages: Message[];
  source: ChatSource;
  guestId?: string;
  linkedBookingId?: string;
  /** Pancake integration fields (present for synced threads) */
  pageId?: string;
  customerId?: string;
  /** true once full message history has been loaded from Pancake */
  messagesLoaded?: boolean;
}
