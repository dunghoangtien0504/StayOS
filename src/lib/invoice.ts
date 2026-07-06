import type { Booking, Room, Property } from './types';
import { statusLabel, sourceLabel } from './labels';

export function printInvoice(booking: Booking, room?: Room, property?: Property): void {
  const nights = Math.round(
    (booking.checkOut.getTime() - booking.checkIn.getTime()) / 86400_000
  );
  const remaining = booking.totalPrice - booking.amountPaid;

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8"/>
<title>Hóa đơn - ${booking.guestName}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 13px; padding: 24px; color: #222; max-width: 480px; margin: 0 auto; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  .sub { color: #666; font-size: 12px; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  td { padding: 6px 8px; border-bottom: 1px solid #eee; }
  td:first-child { color: #666; width: 44%; }
  .total-row td { font-weight: bold; font-size: 15px; border-top: 2px solid #222; }
  .footer { margin-top: 28px; text-align: center; color: #888; font-size: 11px; }
</style>
</head>
<body>
  <h1>Ta Thong Dong Homestay</h1>
  <div class="sub">49 Trần Quốc Diệu, P.Nhiêu Lộc, Q.3, TP.HCM</div>
  <h2 style="font-size:15px;margin-bottom:12px;">HÓA ĐƠN THANH TOÁN</h2>
  <table>
    <tr><td>Khách</td><td>${booking.guestName}</td></tr>
    <tr><td>SĐT</td><td>${booking.guestPhone || '—'}</td></tr>
    <tr><td>Phòng</td><td>${room?.name || booking.roomId}</td></tr>
    <tr><td>Check-in</td><td>${booking.checkIn.toLocaleDateString('vi-VN')}</td></tr>
    <tr><td>Check-out</td><td>${booking.checkOut.toLocaleDateString('vi-VN')}</td></tr>
    <tr><td>Số đêm</td><td>${nights} đêm</td></tr>
    <tr><td>Nguồn</td><td>${sourceLabel(booking.source)}</td></tr>
    <tr><td>Trạng thái</td><td>${statusLabel(booking.status)}</td></tr>
    <tr class="total-row"><td>Tổng tiền</td><td>${booking.totalPrice.toLocaleString('vi-VN')}đ</td></tr>
    <tr><td>Đã thanh toán</td><td>${booking.amountPaid.toLocaleString('vi-VN')}đ</td></tr>
    ${remaining > 0 ? `<tr><td>Còn lại</td><td style="color:red">${remaining.toLocaleString('vi-VN')}đ</td></tr>` : ''}
  </table>
  <div class="footer">Cảm ơn quý khách đã lưu trú tại Ta Thong Dong Homestay!</div>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
    win.print();
  }
}
