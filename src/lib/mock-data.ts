import { addHours, startOfToday, addDays, subDays } from 'date-fns';
import { Property, Room, Booking, CleaningAssignment, Expense } from './types';

export const mockProperties: Property[] = [
  {
    id: 'p1',
    name: 'Ta Thong Dong Homestay',
    address: 'Ta Thong Dong, Làng Cù Lần, Lạc Dương, Lâm Đồng',
    checkInTime: '14:00',
    checkOutTime: '12:00',
  },
];

export const mockRooms: Room[] = [
  { id: 'r101', propertyId: 'p1', name: 'P.101', roomType: 'Standard', status: 'clean', floor: 1, basePrice: 600000 },
  { id: 'r102', propertyId: 'p1', name: 'P.102', roomType: 'Standard', status: 'dirty', floor: 1, basePrice: 600000 },
  { id: 'r201', propertyId: 'p1', name: 'P.201', roomType: 'Deluxe', status: 'cleaning', floor: 2, basePrice: 900000 },
  { id: 'r202', propertyId: 'p1', name: 'P.202', roomType: 'Deluxe', status: 'clean', floor: 2, basePrice: 900000 },
  { id: 'r301', propertyId: 'p1', name: 'P.301', roomType: 'Studio', status: 'clean', floor: 3, basePrice: 1200000 },
  { id: 'r302', propertyId: 'p1', name: 'P.302', roomType: 'Studio', status: 'clean', floor: 3, basePrice: 1200000 },
];

const today = startOfToday();

export const mockBookings: Booking[] = [
  {
    id: 'b1',
    propertyId: 'p1',
    roomId: 'r101',
    guestName: 'Nguyễn Văn An',
    guestPhone: '0987.654.321',
    source: 'zalo',
    status: 'checked_in',
    checkIn: addHours(today, 14),
    checkOut: addDays(addHours(today, 12), 2),
    totalPrice: 1200000,
    amountPaid: 1200000,
    payments: [{ id: 'pay-b1-1', bookingId: 'b1', amount: 1200000, method: 'transfer', date: addHours(today, 13), note: 'Chuyển khoản đủ' }],
  },
  {
    id: 'b2',
    propertyId: 'p1',
    roomId: 'r102',
    guestName: 'Trần Thị Bảo',
    guestPhone: '0912.345.678',
    source: 'facebook',
    status: 'deposited',
    checkIn: addHours(today, 16),
    checkOut: addDays(addHours(today, 12), 1),
    totalPrice: 600000,
    amountPaid: 200000,
    payments: [{ id: 'pay-b2-1', bookingId: 'b2', amount: 200000, method: 'cash', date: subDays(today, 1), note: 'Đặt cọc' }],
  },
  {
    id: 'b3',
    propertyId: 'p1',
    roomId: 'r201',
    guestName: 'Lê Văn Cường',
    guestPhone: '0900.111.222',
    source: 'booking',
    status: 'confirmed',
    checkIn: addHours(today, 14),
    checkOut: addDays(addHours(today, 12), 1),
    totalPrice: 900000,
    amountPaid: 0,
    payments: [],
  },
  {
    id: 'b4',
    propertyId: 'p1',
    roomId: 'r202',
    guestName: 'Phạm Minh Đức',
    guestPhone: '0977.888.999',
    source: 'airbnb',
    status: 'checked_in',
    checkIn: subDays(addHours(today, 14), 1),
    checkOut: addDays(addHours(today, 12), 1),
    totalPrice: 1800000,
    amountPaid: 1800000,
    payments: [{ id: 'pay-b4-1', bookingId: 'b4', amount: 1800000, method: 'transfer', date: subDays(today, 1), note: 'Thanh toán qua Airbnb' }],
  },
];

export const mockCleaningAssignments: CleaningAssignment[] = [
  {
    id: 'c1',
    roomId: 'r102',
    status: 'pending',
    photos: [],
    createdAt: addHours(today, -2),
  },
  {
    id: 'c2',
    roomId: 'r201',
    status: 'in_progress',
    staffName: 'Chị Hoa',
    photos: [],
    startedAt: addHours(today, -1),
    createdAt: addHours(today, -3),
  },
];

export const mockExpenses: Expense[] = [
  {
    id: 'e1',
    propertyId: 'p1',
    amount: 450000,
    category: 'electricity',
    date: subDays(today, 5),
    note: 'Tiền điện tháng 4',
  },
  {
    id: 'e2',
    propertyId: 'p1',
    amount: 150000,
    category: 'water',
    date: subDays(today, 4),
    note: 'Tiền nước tháng 4',
  },
  {
    id: 'e3',
    propertyId: 'p1',
    amount: 800000,
    category: 'salary',
    date: subDays(today, 2),
    note: 'Lương nhân viên dọn phòng tháng 4',
  },
  {
    id: 'e4',
    propertyId: 'p1',
    amount: 200000,
    category: 'supplies',
    date: subDays(today, 1),
    note: 'Mua đồ vệ sinh, khăn tắm',
  },
];
