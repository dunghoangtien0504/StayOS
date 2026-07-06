import { supabase } from './supabase'
import type {
  Booking, Room, Property, Guest, Staff, Expense,
  CleaningAssignment, Settings, ChatLabel, PendingBooking,
  BookingSource, BookingStatus, RoomStatus, CleaningStatus,
} from './types'
import {
  mockBookings, mockRooms, mockProperties,
  mockCleaningAssignments, mockExpenses,
} from './mock-data'

// ── Type converters ───────────────────────────────────────────────────────────

function toDbBooking(b: Booking) {
  return {
    id: b.id,
    property_id: b.propertyId,
    room_id: b.roomId,
    guest_name: b.guestName,
    guest_phone: b.guestPhone ?? '',
    source: b.source,
    status: b.status,
    check_in: b.checkIn.toISOString(),
    check_out: b.checkOut.toISOString(),
    actual_check_in: b.actualCheckIn?.toISOString() ?? null,
    actual_check_out: b.actualCheckOut?.toISOString() ?? null,
    total_price: b.totalPrice,
    amount_paid: b.amountPaid,
    payments: (b.payments ?? []).map(p => ({ ...p, date: p.date.toISOString() })),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromDbBooking(row: Record<string, any>): Booking {
  return {
    id: row.id,
    propertyId: row.property_id,
    roomId: row.room_id,
    guestName: row.guest_name,
    guestPhone: row.guest_phone ?? '',
    source: row.source as BookingSource,
    status: row.status as BookingStatus,
    checkIn: new Date(row.check_in),
    checkOut: new Date(row.check_out),
    actualCheckIn: row.actual_check_in ? new Date(row.actual_check_in) : undefined,
    actualCheckOut: row.actual_check_out ? new Date(row.actual_check_out) : undefined,
    totalPrice: row.total_price,
    amountPaid: row.amount_paid,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payments: (row.payments ?? []).map((p: any) => ({ ...p, date: new Date(p.date) })),
  }
}

function toDbRoom(r: Room) {
  return {
    id: r.id,
    property_id: r.propertyId,
    name: r.name,
    room_type: r.roomType,
    status: r.status,
    floor: r.floor,
    base_price: r.basePrice,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromDbRoom(row: Record<string, any>): Room {
  return {
    id: row.id,
    propertyId: row.property_id,
    name: row.name,
    roomType: row.room_type,
    status: row.status as RoomStatus,
    floor: row.floor,
    basePrice: row.base_price,
  }
}

function toDbProperty(p: Property) {
  return {
    id: p.id,
    name: p.name,
    address: p.address ?? '',
    check_in_time: p.checkInTime,
    check_out_time: p.checkOutTime,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromDbProperty(row: Record<string, any>): Property {
  return {
    id: row.id,
    name: row.name,
    address: row.address ?? '',
    checkInTime: row.check_in_time ?? '14:00',
    checkOutTime: row.check_out_time ?? '12:00',
  }
}

function toDbGuest(g: Guest) {
  return {
    id: g.id,
    name: g.name,
    phone: g.phone ?? '',
    email: g.email ?? null,
    id_card: g.idCard ?? null,
    nationality: g.nationality ?? 'Việt Nam',
    notes: g.notes ?? null,
    created_at: g.createdAt instanceof Date ? g.createdAt.toISOString() : g.createdAt,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromDbGuest(row: Record<string, any>): Guest {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone ?? '',
    email: row.email ?? undefined,
    idCard: row.id_card ?? undefined,
    nationality: row.nationality ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: new Date(row.created_at),
  }
}

function toDbStaff(s: Staff) {
  return {
    id: s.id,
    name: s.name,
    role: s.role,
    phone: s.phone ?? '',
    active: s.active,
    created_at: s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromDbStaff(row: Record<string, any>): Staff {
  return {
    id: row.id,
    name: row.name,
    role: row.role as 'housekeeping' | 'reception' | 'manager',
    phone: row.phone ?? '',
    active: row.active,
    createdAt: new Date(row.created_at),
  }
}

function toDbExpense(e: Expense) {
  const d = e.date instanceof Date ? e.date : new Date(e.date)
  return {
    id: e.id,
    property_id: e.propertyId ?? null,
    amount: e.amount,
    category: e.category,
    date: d.toISOString().split('T')[0],
    note: e.note ?? '',
    recurring: e.recurring ?? null,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromDbExpense(row: Record<string, any>): Expense {
  return {
    id: row.id,
    propertyId: row.property_id ?? undefined,
    amount: row.amount,
    category: row.category,
    date: new Date(row.date),
    note: row.note ?? '',
    recurring: row.recurring ?? undefined,
  }
}

function toDbAssignment(a: CleaningAssignment) {
  return {
    id: a.id,
    room_id: a.roomId,
    booking_id: a.bookingId ?? null,
    staff_id: a.staffId ?? null,
    staff_name: a.staffName ?? null,
    status: a.status,
    photos: a.photos ?? [],
    notes: a.notes ?? null,
    started_at: a.startedAt?.toISOString() ?? null,
    completed_at: a.completedAt?.toISOString() ?? null,
    created_at: a.createdAt instanceof Date ? a.createdAt.toISOString() : a.createdAt,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromDbAssignment(row: Record<string, any>): CleaningAssignment {
  return {
    id: row.id,
    roomId: row.room_id,
    bookingId: row.booking_id ?? undefined,
    staffId: row.staff_id ?? undefined,
    staffName: row.staff_name ?? undefined,
    status: row.status as CleaningStatus,
    photos: row.photos ?? [],
    notes: row.notes ?? undefined,
    startedAt: row.started_at ? new Date(row.started_at) : undefined,
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    createdAt: new Date(row.created_at),
  }
}

function toDbPendingBooking(p: PendingBooking) {
  return {
    id: p.id,
    page_id: p.pageId,
    conversation_id: p.conversationId,
    customer_id: p.customerId ?? null,
    guest_name: p.guestName,
    guest_phone: p.guestPhone ?? null,
    check_in: p.checkIn instanceof Date ? p.checkIn.toISOString().split('T')[0] : p.checkIn,
    check_out: p.checkOut instanceof Date ? p.checkOut.toISOString().split('T')[0] : p.checkOut,
    room_type: p.roomType ?? null,
    preferred_room_id: p.preferredRoomId ?? null,
    total_price: p.totalPrice,
    notes: p.notes ?? null,
    status: p.status,
    created_at: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
    approved_booking_id: p.approvedBookingId ?? null,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromDbPendingBooking(row: Record<string, any>): PendingBooking {
  return {
    id: row.id,
    pageId: row.page_id,
    conversationId: row.conversation_id,
    customerId: row.customer_id ?? undefined,
    guestName: row.guest_name,
    guestPhone: row.guest_phone ?? undefined,
    checkIn: new Date(row.check_in),
    checkOut: new Date(row.check_out),
    roomType: row.room_type ?? undefined,
    preferredRoomId: row.preferred_room_id ?? undefined,
    totalPrice: row.total_price,
    notes: row.notes ?? undefined,
    status: row.status as PendingBooking['status'],
    createdAt: new Date(row.created_at),
    approvedBookingId: row.approved_booking_id ?? undefined,
  }
}

// ── Public DB layer ───────────────────────────────────────────────────────────

export const db = {
  async fetchAll() {
    const [
      { data: propertiesRaw, error: e1 },
      { data: roomsRaw, error: e2 },
      { data: bookingsRaw, error: e3 },
      { data: guestsRaw, error: e4 },
      { data: staffRaw, error: e5 },
      { data: expensesRaw, error: e6 },
      { data: assignmentsRaw, error: e7 },
      { data: settingsRow, error: e8 },
      { data: labelsRaw, error: e9 },
    ] = await Promise.all([
      supabase.from('properties').select('*'),
      supabase.from('rooms').select('*'),
      supabase.from('bookings').select('*').order('check_in', { ascending: false }),
      supabase.from('guests').select('*').order('created_at', { ascending: false }),
      supabase.from('staff').select('*'),
      supabase.from('expenses').select('*').order('date', { ascending: false }),
      supabase.from('cleaning_assignments').select('*').order('created_at', { ascending: false }),
      supabase.from('settings').select('data').eq('id', 'main').maybeSingle(),
      supabase.from('custom_labels').select('*'),
    ])

    const errors = [e1,e2,e3,e4,e5,e6,e7,e8,e9].filter(Boolean)
    if (errors.length) console.error('[StayOS DB] fetchAll errors:', errors)

    return {
      properties: (propertiesRaw ?? []).map(fromDbProperty),
      rooms: (roomsRaw ?? []).map(fromDbRoom),
      bookings: (bookingsRaw ?? []).map(fromDbBooking),
      guests: (guestsRaw ?? []).map(fromDbGuest),
      staff: (staffRaw ?? []).map(fromDbStaff),
      expenses: (expensesRaw ?? []).map(fromDbExpense),
      assignments: (assignmentsRaw ?? []).map(fromDbAssignment),
      settings: settingsRow?.data as Settings | null,
      customLabels: (labelsRaw ?? []) as ChatLabel[],
      isEmpty: !propertiesRaw || propertiesRaw.length === 0,
    }
  },

  // Seeds mock data (May–June historical records) on first run
  async seedInitialData(initialSettings: Settings) {
    console.log('[StayOS DB] First run — seeding initial data...')
    // Insert in FK dependency order: properties → rooms → bookings → rest
    await supabase.from('properties').upsert(mockProperties.map(toDbProperty))
    await supabase.from('rooms').upsert(mockRooms.map(toDbRoom))
    await supabase.from('bookings').upsert(mockBookings.map(toDbBooking))
    if (mockExpenses.length) {
      await supabase.from('expenses').upsert(mockExpenses.map(toDbExpense))
    }
    if (mockCleaningAssignments.length) {
      await supabase.from('cleaning_assignments').upsert(mockCleaningAssignments.map(toDbAssignment))
    }
    await supabase.from('settings').upsert({ id: 'main', data: initialSettings })
    console.log('[StayOS DB] Seed complete.')
  },

  // Bookings
  async upsertBooking(b: Booking) {
    const { error } = await supabase.from('bookings').upsert(toDbBooking(b))
    if (error) console.error('[DB] upsertBooking', error)
  },
  async deleteBooking(id: string) {
    const { error } = await supabase.from('bookings').delete().eq('id', id)
    if (error) console.error('[DB] deleteBooking', error)
  },

  // Rooms
  async upsertRoom(r: Room) {
    const { error } = await supabase.from('rooms').upsert(toDbRoom(r))
    if (error) console.error('[DB] upsertRoom', error)
  },
  async deleteRoom(id: string) {
    const { error } = await supabase.from('rooms').delete().eq('id', id)
    if (error) console.error('[DB] deleteRoom', error)
  },

  // Properties
  async upsertProperty(p: Property) {
    const { error } = await supabase.from('properties').upsert(toDbProperty(p))
    if (error) console.error('[DB] upsertProperty', error)
  },
  async deleteProperty(id: string) {
    const { error } = await supabase.from('properties').delete().eq('id', id)
    if (error) console.error('[DB] deleteProperty', error)
  },

  // Guests
  async upsertGuest(g: Guest) {
    const { error } = await supabase.from('guests').upsert(toDbGuest(g))
    if (error) console.error('[DB] upsertGuest', error)
  },
  async deleteGuest(id: string) {
    const { error } = await supabase.from('guests').delete().eq('id', id)
    if (error) console.error('[DB] deleteGuest', error)
  },

  // Staff
  async upsertStaff(s: Staff) {
    const { error } = await supabase.from('staff').upsert(toDbStaff(s))
    if (error) console.error('[DB] upsertStaff', error)
  },
  async deleteStaff(id: string) {
    const { error } = await supabase.from('staff').delete().eq('id', id)
    if (error) console.error('[DB] deleteStaff', error)
  },

  // Expenses
  async upsertExpense(e: Expense) {
    const { error } = await supabase.from('expenses').upsert(toDbExpense(e))
    if (error) console.error('[DB] upsertExpense', error)
  },
  async deleteExpense(id: string) {
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) console.error('[DB] deleteExpense', error)
  },

  // Cleaning assignments
  async upsertAssignment(a: CleaningAssignment) {
    const { error } = await supabase.from('cleaning_assignments').upsert(toDbAssignment(a))
    if (error) console.error('[DB] upsertAssignment', error)
  },

  // Settings
  async saveSettings(s: Settings) {
    const { error } = await supabase.from('settings').upsert({ id: 'main', data: s })
    if (error) console.error('[DB] saveSettings', error)
  },

  // Pending bookings (from bot conversations, awaiting owner approval)
  async fetchPendingBookings() {
    const { data, error } = await supabase
      .from('pending_bookings')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) console.error('[DB] fetchPendingBookings', error)
    return (data ?? []).map(fromDbPendingBooking)
  },
  async upsertPendingBooking(p: PendingBooking) {
    const { error } = await supabase.from('pending_bookings').upsert(toDbPendingBooking(p))
    if (error) console.error('[DB] upsertPendingBooking', error)
    return !error
  },
  async updatePendingBookingStatus(id: string, status: PendingBooking['status'], approvedBookingId?: string) {
    const { error } = await supabase
      .from('pending_bookings')
      .update({ status, approved_booking_id: approvedBookingId ?? null })
      .eq('id', id)
    if (error) console.error('[DB] updatePendingBookingStatus', error)
    return !error
  },
  async deletePendingBooking(id: string) {
    const { error } = await supabase.from('pending_bookings').delete().eq('id', id)
    if (error) console.error('[DB] deletePendingBooking', error)
  },

  // Custom labels
  async upsertLabel(l: ChatLabel) {
    const { error } = await supabase.from('custom_labels').upsert({
      id: l.id, name: l.name, color: l.color, emoji: l.emoji ?? null,
    })
    if (error) console.error('[DB] upsertLabel', error)
  },
  async deleteLabel(id: string) {
    const { error } = await supabase.from('custom_labels').delete().eq('id', id)
    if (error) console.error('[DB] deleteLabel', error)
  },
}
