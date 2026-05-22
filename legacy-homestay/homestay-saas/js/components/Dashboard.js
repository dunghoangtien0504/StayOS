import { store } from '../store.js';

export const Dashboard = {
    render() {
        const bookings = store.getBookings();
        const payments = store.getPaymentRecords();
        const properties = store.getProperties();
        const rooms = store.getRooms();

        // 1. Tính toán KPIs
        const today = new Date().toISOString().split('T')[0];
        const todayRev = payments.filter(p => p.payment_date === today).reduce((sum, p) => sum + Number(p.amount), 0);
        const activeGuests = bookings.filter(b => b.status === 'checked_in').length;
        const occupancy = ((activeGuests / rooms.length) * 100).toFixed(1);
        const newBookings = bookings.filter(b => b.created_at?.startsWith(today)).length;

        return `
            <div class="view-container">
                <div style="margin-bottom: 24px;">
                    <h1 style="font-size: 1.8rem; font-weight: 800; color: var(--secondary);">Dashboard Tổng Quan</h1>
                    <p style="color: var(--text-muted);">Theo dõi hiệu suất vận hành toàn chuỗi realtime</p>
                </div>

                <div class="kpi-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
                    <div class="kpi-card" style="background: linear-gradient(135deg, #eff6ff 0%, #fff 100%); border-left: 4px solid var(--primary);">
                        <div class="kpi-label">DOANH THU HÔM NAY</div>
                        <div class="kpi-value" style="color: var(--primary);">${todayRev.toLocaleString()}đ</div>
                        <div style="font-size:11px; margin-top:8px;">✓ Đã cập nhật 1 phút trước</div>
                    </div>
                    <div class="kpi-card" style="background: linear-gradient(135deg, #fdf4ff 0%, #fff 100%); border-left: 4px solid #d946ef;">
                        <div class="kpi-label">KHÁCH ĐANG Ở</div>
                        <div class="kpi-value" style="color: #d946ef;">${activeGuests}/${rooms.length}</div>
                        <div style="font-size:11px; margin-top:8px;">Lượt khách lưu trú thực tế</div>
                    </div>
                    <div class="kpi-card" style="background: linear-gradient(135deg, #f0fdf4 0%, #fff 100%); border-left: 4px solid var(--success);">
                        <div class="kpi-label">TỶ LỆ LẤP ĐẦY</div>
                        <div class="kpi-value" style="color: var(--success);">${occupancy}%</div>
                        <div style="font-size:11px; margin-top:8px;">Trên tổng số ${rooms.length} phòng</div>
                    </div>
                    <div class="kpi-card" style="background: linear-gradient(135deg, #fffbeb 0%, #fff 100%); border-left: 4px solid var(--warning);">
                        <div class="kpi-label">BOOKING MỚI</div>
                        <div class="kpi-value" style="color: var(--warning);">${newBookings}</div>
                        <div style="font-size:11px; margin-top:8px;">Phát sinh trong ngày hôm nay</div>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns: 2fr 1fr; gap:24px; margin-top:24px;">
                    <!-- Biểu đồ doanh thu (Mockup bars) -->
                    <div class="data-card" style="padding: 24px;">
                        <div style="font-weight:700; margin-bottom:20px; color:var(--secondary);">DOANH THU THEO CƠ SỞ</div>
                        <div style="display:flex; flex-direction:column; gap:16px;">
                            ${properties.map(p => {
                                const rev = payments.filter(pay => {
                                    const b = bookings.find(bk => bk.id === pay.booking_id);
                                    return b && b.property_id === p.id;
                                }).reduce((sum, pay) => sum + Number(pay.amount), 0);
                                const width = Math.min(100, (rev / 5000000) * 100); // Scale 5M = 100%
                                return `
                                    <div style="display:flex; align-items:center; gap:12px;">
                                        <div style="width:120px; font-size:12px; font-weight:600;">${p.name}</div>
                                        <div style="flex:1; height:12px; background:#f1f5f9; border-radius:6px; overflow:hidden;">
                                            <div style="width:${width}%; height:100%; background:var(--primary); border-radius:6px;"></div>
                                        </div>
                                        <div style="width:100px; text-align:right; font-weight:700; font-size:12px;">${rev.toLocaleString()}đ</div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>

                    <!-- Nguồn khách -->
                    <div class="data-card" style="padding: 24px;">
                        <div style="font-weight:700; margin-bottom:20px; color:var(--secondary);">NGUỒN KHÁCH</div>
                        <div style="display:flex; flex-direction:column; gap:12px;">
                            ${['Direct', 'Booking.com', 'Agoda', 'Facebook'].map(s => {
                                const count = bookings.filter(b => b.source === s).length;
                                const percent = bookings.length > 0 ? (count / bookings.length * 100).toFixed(0) : 0;
                                return `
                                    <div style="display:flex; justify-content:space-between; align-items:center; font-size:12px;">
                                        <span style="color:var(--text-muted);">${s}</span>
                                        <div style="display:flex; align-items:center; gap:8px;">
                                            <div style="width:60px; height:6px; background:#f1f5f9; border-radius:3px;"><div style="width:${percent}%; height:100%; background:var(--primary); border-radius:3px;"></div></div>
                                            <span style="font-weight:700; width:30px;">${percent}%</span>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    init() {}
};
