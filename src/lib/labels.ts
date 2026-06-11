/**
 * Nhãn tiếng Việt + màu sắc thống nhất cho toàn hệ thống.
 * Mọi component hiển thị status / source / category PHẢI dùng file này
 * thay vì hardcode chuỗi tiếng Anh thô ("checked_in", "walk_in"...).
 */

import { BookingStatus, BookingSource, ExpenseCategory, RoomStatus, CleaningStatus } from '@/lib/types';

// ── Trạng thái booking ──────────────────────────────────────────

export const STATUS_LABELS: Record<BookingStatus, string> = {
  confirmed: 'Đã xác nhận',
  deposited: 'Đã cọc',
  checked_in: 'Đang ở',
  checked_out: 'Đã trả phòng',
  cancelled: 'Đã hủy',
  no_show: 'Không đến',
};

/** Badge classes cho từng trạng thái — dùng chung BookingTable, Modal, Dashboard */
export const STATUS_COLORS: Record<BookingStatus, string> = {
  confirmed: 'bg-slate-100 text-slate-600 border-slate-200',
  deposited: 'bg-blue-100 text-blue-600 border-blue-200',
  checked_in: 'bg-green-100 text-green-600 border-green-200',
  checked_out: 'bg-slate-500 text-white border-slate-600',
  cancelled: 'bg-red-100 text-red-600 border-red-200 line-through',
  no_show: 'bg-amber-100 text-amber-600 border-amber-200',
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status as BookingStatus] ?? status;
}

export function statusColor(status: string): string {
  return STATUS_COLORS[status as BookingStatus] ?? 'bg-slate-100 text-slate-600';
}

// ── Nguồn booking ───────────────────────────────────────────────

export const SOURCE_LABELS: Record<BookingSource, string> = {
  zalo: 'Zalo',
  facebook: 'Facebook',
  booking: 'Booking.com',
  airbnb: 'Airbnb',
  walk_in: 'Khách vãng lai',
  direct: 'Đặt trực tiếp',
};

/** Màu nền avatar/dot theo nguồn — đồng bộ với --color-source-* trong globals.css */
export const SOURCE_COLORS: Record<BookingSource, string> = {
  zalo: 'bg-[#0068FF]',
  facebook: 'bg-[#1877F2]',
  booking: 'bg-[#003580]',
  airbnb: 'bg-[#FF5A5F]',
  walk_in: 'bg-[#6B7280]',
  direct: 'bg-[#10B981]',
};

export function sourceLabel(source: string): string {
  return SOURCE_LABELS[source as BookingSource] ?? source;
}

export function sourceColor(source: string): string {
  return SOURCE_COLORS[source as BookingSource] ?? 'bg-slate-400';
}

// ── Danh mục chi phí ────────────────────────────────────────────

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  electricity: 'Tiền điện',
  water: 'Tiền nước',
  laundry: 'Giặt ủi',
  salary: 'Lương nhân viên',
  commission: 'Hoa hồng',
  maintenance: 'Bảo trì sửa chữa',
  other: 'Khác',
};

export function expenseCategoryLabel(category: string): string {
  return EXPENSE_CATEGORY_LABELS[category as ExpenseCategory] ?? category;
}

// ── Trạng thái phòng & dọn dẹp ─────────────────────────────────

export const ROOM_STATUS_LABELS: Record<RoomStatus, string> = {
  clean: 'Sạch',
  dirty: 'Cần dọn',
  cleaning: 'Đang dọn',
};

export const CLEANING_STATUS_LABELS: Record<CleaningStatus, string> = {
  pending: 'Chờ dọn',
  in_progress: 'Đang dọn',
  done: 'Hoàn thành',
};

// ── Phương thức thanh toán ─────────────────────────────────────

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Tiền mặt',
  transfer: 'Chuyển khoản',
  card: 'Thẻ',
};

export function paymentMethodLabel(method: string): string {
  return PAYMENT_METHOD_LABELS[method] ?? method;
}
