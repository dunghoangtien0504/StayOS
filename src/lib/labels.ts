import type { BookingStatus, BookingSource } from './types';

export const STATUS_LABELS: Record<BookingStatus, string> = {
  confirmed:   'Đã xác nhận',
  deposited:   'Đặt cọc',
  checked_in:  'Đang ở',
  checked_out: 'Đã trả phòng',
  cancelled:   'Đã hủy',
  no_show:     'Không đến',
};

export const SOURCE_LABELS: Record<BookingSource, string> = {
  zalo:     'Zalo',
  facebook: 'Facebook',
  booking:  'Booking.com',
  airbnb:   'Airbnb',
  walk_in:  'Khách vãng lai',
  direct:   'Trực tiếp',
};

export const CLEANING_STATUS_LABELS: Record<string, string> = {
  pending:     'Chờ dọn',
  in_progress: 'Đang dọn',
  done:        'Đã sạch',
};

export const STATUS_COLORS: Record<BookingStatus, string> = {
  confirmed:   'bg-blue-100 text-blue-800',
  deposited:   'bg-indigo-100 text-indigo-800',
  checked_in:  'bg-green-100 text-green-800',
  checked_out: 'bg-gray-100 text-gray-700',
  cancelled:   'bg-red-100 text-red-700',
  no_show:     'bg-amber-100 text-amber-800',
};

export const SOURCE_COLORS: Record<BookingSource, string> = {
  zalo:     'bg-blue-50 text-blue-600',
  facebook: 'bg-indigo-50 text-indigo-600',
  booking:  'bg-cyan-50 text-cyan-700',
  airbnb:   'bg-rose-50 text-rose-600',
  walk_in:  'bg-green-50 text-green-700',
  direct:   'bg-gray-50 text-gray-600',
};

export function statusLabel(s: BookingStatus | string): string {
  return STATUS_LABELS[s as BookingStatus] ?? s;
}

export function sourceLabel(s: BookingSource | string): string {
  return SOURCE_LABELS[s as BookingSource] ?? s;
}

export function statusColor(s: BookingStatus | string): string {
  return STATUS_COLORS[s as BookingStatus] ?? 'bg-gray-100 text-gray-600';
}

export function sourceColor(s: BookingSource | string): string {
  return SOURCE_COLORS[s as BookingSource] ?? 'bg-gray-50 text-gray-600';
}
