import { Booking, Room, Property, Settings } from './types';
import { calculateNights } from './pricing';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

function vietQrUrl(bankId: string, accountNo: string, accountName: string, amount: number, info: string) {
  const base = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png`;
  const params = new URLSearchParams({
    amount: String(amount),
    addInfo: info,
    accountName,
  });
  return `${base}?${params}`;
}

const STATUS_LABEL: Record<string, string> = {
  confirmed: 'Đã xác nhận',
  deposited: 'Đã đặt cọc',
  checked_in: 'Đang lưu trú',
  checked_out: 'Đã trả phòng',
  cancelled: 'Đã huỷ',
  no_show: 'No-show',
};

const METHOD_LABEL: Record<string, string> = {
  cash: 'Tiền mặt',
  transfer: 'Chuyển khoản',
  card: 'Thẻ',
};

export function printInvoice(booking: Booking, room: Room | undefined, property: Property | undefined, settings: Settings) {
  const nights = calculateNights(booking.checkIn, booking.checkOut);
  const remaining = booking.totalPrice - booking.amountPaid;
  const primary = settings.branding.primaryColor || '#E8843A';
  const propName = settings.branding.name || property?.name || 'StayOS';
  const propAddress = settings.branding.address || property?.address || '';
  const propPhone = settings.branding.phone || '';
  const bank = settings.bankInfo;

  const qrHtml = bank && remaining > 0
    ? `<div class="qr-section">
        <p class="qr-label">Quét mã chuyển khoản số tiền còn lại</p>
        <img class="qr-img" src="${vietQrUrl(bank.bankId, bank.accountNo, bank.accountName, remaining, `TT ${booking.id.slice(-6).toUpperCase()}`)}" alt="QR chuyển khoản" />
        <p class="bank-info">${bank.bankId} · ${bank.accountNo}<br/><b>${bank.accountName}</b></p>
      </div>`
    : '';

  const paymentRows = (booking.payments || [])
    .map(p => `<tr>
      <td>${format(p.date, 'HH:mm dd/MM/yyyy')}</td>
      <td>${METHOD_LABEL[p.method] || p.method}</td>
      <td class="amount">+${p.amount.toLocaleString('vi-VN')} đ</td>
      <td>${p.note || ''}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8" />
<title>Hóa đơn #${booking.id.slice(-6).toUpperCase()}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; background: #fff; padding: 32px; max-width: 720px; margin: auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 3px solid ${primary}; }
  .brand-name { font-size: 26px; font-weight: 900; letter-spacing: -1px; color: ${primary}; }
  .brand-sub { font-size: 11px; color: #888; margin-top: 4px; }
  .brand-contact { font-size: 12px; color: #555; margin-top: 4px; }
  .invoice-meta { text-align: right; }
  .invoice-meta h2 { font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: #888; }
  .invoice-no { font-size: 28px; font-weight: 900; color: #1a1a1a; letter-spacing: -1px; }
  .invoice-date { font-size: 12px; color: #888; margin-top: 4px; }
  .status-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; background: ${primary}20; color: ${primary}; margin-top: 6px; }

  .section { margin-bottom: 24px; }
  .section-title { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: #888; margin-bottom: 10px; }

  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .info-box { background: #f8f9fb; border-radius: 12px; padding: 14px 16px; }
  .info-box label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #aaa; display: block; margin-bottom: 4px; }
  .info-box span { font-size: 14px; font-weight: 700; color: #1a1a1a; }

  .price-table { width: 100%; border-collapse: collapse; }
  .price-table td { padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
  .price-table td:last-child { text-align: right; font-weight: 700; }
  .price-table .total-row td { font-size: 15px; font-weight: 900; border-bottom: none; border-top: 2px solid #eee; padding-top: 14px; }
  .price-table .paid-row td { color: #16a34a; }
  .price-table .debt-row td { color: ${remaining > 0 ? '#dc2626' : '#888'}; }
  .amount { text-align: right !important; }

  .payment-table { width: 100%; border-collapse: collapse; font-size: 12px; }
  .payment-table th { background: #f8f9fb; padding: 8px 10px; text-align: left; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #888; }
  .payment-table td { padding: 8px 10px; border-bottom: 1px solid #f5f5f5; }
  .payment-table .amount { text-align: right; font-weight: 700; color: #16a34a; }

  .qr-section { text-align: center; padding: 20px; background: #f8f9fb; border-radius: 12px; margin-top: 16px; }
  .qr-label { font-size: 11px; color: #888; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
  .qr-img { width: 160px; height: 160px; object-fit: contain; }
  .bank-info { font-size: 12px; color: #555; margin-top: 8px; line-height: 1.6; }

  .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 11px; color: #aaa; }
  .footer b { color: ${primary}; }

  @media print {
    body { padding: 16px; }
    @page { margin: 1cm; }
  }
</style>
</head>
<body>

<div class="header">
  <div>
    <div class="brand-name">${propName}</div>
    ${propAddress ? `<div class="brand-sub">${propAddress}</div>` : ''}
    ${propPhone ? `<div class="brand-contact">📞 ${propPhone}</div>` : ''}
  </div>
  <div class="invoice-meta">
    <h2>Xác nhận đặt phòng</h2>
    <div class="invoice-no">#${booking.id.slice(-6).toUpperCase()}</div>
    <div class="invoice-date">Ngày: ${format(new Date(), 'dd/MM/yyyy', { locale: vi })}</div>
    <div class="status-badge">${STATUS_LABEL[booking.status] || booking.status}</div>
  </div>
</div>

<div class="section">
  <div class="section-title">Thông tin khách hàng & phòng</div>
  <div class="info-grid">
    <div class="info-box">
      <label>Khách hàng</label>
      <span>${booking.guestName}</span>
    </div>
    <div class="info-box">
      <label>Số điện thoại</label>
      <span>${booking.guestPhone || '—'}</span>
    </div>
    <div class="info-box">
      <label>Phòng</label>
      <span>${room?.name || booking.roomId} · ${room?.roomType || ''}</span>
    </div>
    <div class="info-box">
      <label>Nguồn đặt</label>
      <span style="text-transform:uppercase">${booking.source}</span>
    </div>
    <div class="info-box">
      <label>Check-in</label>
      <span>${format(booking.checkIn, 'HH:mm · dd/MM/yyyy', { locale: vi })}</span>
    </div>
    <div class="info-box">
      <label>Check-out</label>
      <span>${format(booking.checkOut, 'HH:mm · dd/MM/yyyy', { locale: vi })}</span>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-title">Chi tiết thanh toán</div>
  <table class="price-table">
    <tr>
      <td>${room?.name || 'Phòng'} × ${nights} đêm</td>
      <td>${booking.totalPrice.toLocaleString('vi-VN')} đ</td>
    </tr>
    <tr class="total-row">
      <td>Tổng cộng</td>
      <td>${booking.totalPrice.toLocaleString('vi-VN')} đ</td>
    </tr>
    <tr class="paid-row">
      <td>Đã thanh toán</td>
      <td>−${booking.amountPaid.toLocaleString('vi-VN')} đ</td>
    </tr>
    <tr class="debt-row">
      <td><b>${remaining > 0 ? 'Còn lại cần thanh toán' : 'Đã thanh toán đủ'}</b></td>
      <td><b>${remaining > 0 ? remaining.toLocaleString('vi-VN') + ' đ' : '✓ 0 đ'}</b></td>
    </tr>
  </table>
</div>

${(booking.payments || []).length > 0 ? `
<div class="section">
  <div class="section-title">Lịch sử thu tiền</div>
  <table class="payment-table">
    <thead><tr><th>Thời gian</th><th>Phương thức</th><th>Số tiền</th><th>Ghi chú</th></tr></thead>
    <tbody>${paymentRows}</tbody>
  </table>
</div>` : ''}

${qrHtml}

<div class="footer">
  Cảm ơn quý khách đã lựa chọn <b>${propName}</b>!<br/>
  Mọi thắc mắc vui lòng liên hệ${propPhone ? ` <b>${propPhone}</b>` : ' lễ tân'}.
</div>

<script>window.onload = () => window.print();</script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=800,height=900');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
