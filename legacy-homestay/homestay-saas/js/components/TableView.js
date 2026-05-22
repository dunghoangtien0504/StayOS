// TableView.js - PMS Architecture v2.2 (KPI Cards + Data Grid)
export default class TableView {
    constructor(filters = {}) {
        this.filters = {
            search: filters.search || '',
            property: filters.property || 'Tất cả',
            status: filters.status || 'Tất cả',
            startDate: filters.startDate || new Date(new Date().setDate(new Date().getDate() - 7)),
            endDate: filters.endDate || new Date(new Date().setDate(new Date().getDate() + 30))
        };
    }

    render() {
        const bookings = store.getBookings().filter(b => {
            const matchSearch = b.guest_name.toLowerCase().includes(this.filters.search.toLowerCase()) || 
                                b.guest_phone.includes(this.filters.search) ||
                                b.room_id.toLowerCase().includes(this.filters.search.toLowerCase());
            const matchProperty = this.filters.property === 'Tất cả' || b.property_id === store.getProperties().find(p => p.name === this.filters.property)?.id;
            return matchSearch && matchProperty;
        });

        // KPI Calculations v2.0
        const activeBookings = bookings.filter(b => !['cancelled', 'no_show'].includes(b.status));
        const totalRevenue = activeBookings.reduce((sum, b) => sum + b.total_price, 0);
        const totalPaid = activeBookings.reduce((sum, b) => sum + b.amount_paid, 0);
        const totalDebt = activeBookings.reduce((sum, b) => sum + b.amount_remaining, 0);

        return `
            <div class="dashboard-header">
                <div class="header-left">
                    <h1 class="header-title">Danh sách Đặt phòng</h1>
                </div>
                <div class="header-actions">
                    <button class="btn-primary" onclick="window.app.openBookingModal()">+ Thêm đặt phòng</button>
                </div>
            </div>

            <!-- KPI Cards Section v2.0 -->
            <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:20px; margin-bottom:30px;">
                <div class="filter-card" style="border-left: 4px solid #3b82f6;">
                    <label>Tổng Doanh thu</label>
                    <div style="font-size:20px; font-weight:800; color:#1e293b;">${totalRevenue.toLocaleString()}đ</div>
                    <div style="font-size:11px; color:#64748b;">${activeBookings.length} booking hợp lệ</div>
                </div>
                <div class="filter-card" style="border-left: 4px solid #10b981;">
                    <label>Đã Thanh toán</label>
                    <div style="font-size:20px; font-weight:800; color:#10b981;">${totalPaid.toLocaleString()}đ</div>
                    <div style="font-size:11px; color:#64748b;">Tiền mặt/Chuyển khoản</div>
                </div>
                <div class="filter-card" style="border-left: 4px solid #ef4444;">
                    <label>Công nợ (Chưa TT)</label>
                    <div style="font-size:20px; font-weight:800; color:#ef4444;">${totalDebt.toLocaleString()}đ</div>
                    <div style="font-size:11px; color:#64748b;">Cần thu thêm</div>
                </div>
                <div class="filter-card" style="border-left: 4px solid #6366f1;">
                    <label>Công suất TB</label>
                    <div style="font-size:20px; font-weight:800; color:#6366f1;">85%</div>
                    <div style="font-size:11px; color:#64748b;">Tỷ lệ lấp đầy phòng</div>
                </div>
            </div>

            <div class="timeline-wrapper">
                <table style="width:100%; border-collapse:collapse; text-align:left; font-size:14px;">
                    <thead>
                        <tr style="background:#f8fafc; border-bottom:1px solid #e2e8f0;">
                            <th style="padding:15px 20px; color:#64748b; font-weight:700;">KHÁCH HÀNG</th>
                            <th style="padding:15px 20px; color:#64748b; font-weight:700;">PHÒNG</th>
                            <th style="padding:15px 20px; color:#64748b; font-weight:700;">CHECK-IN / OUT</th>
                            <th style="padding:15px 20px; color:#64748b; font-weight:700;">DOANH THU</th>
                            <th style="padding:15px 20px; color:#64748b; font-weight:700;">CÒN NỢ</th>
                            <th style="padding:15px 20px; color:#64748b; font-weight:700;">TRẠNG THÁI</th>
                            <th style="padding:15px 20px; color:#64748b; font-weight:700;">HÀNH ĐỘNG</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${bookings.map(b => {
                            const room = store.getRooms().find(r => r.id === b.room_id);
                            const statusMap = {
                                confirmed: { text: 'Chưa cọc', color: '#94a3b8', bg: '#f1f5f9' },
                                deposited: { text: 'Đã cọc', color: '#3b82f6', bg: '#eff6ff' },
                                checked_in: { text: 'Đang ở', color: '#10b981', bg: '#f0fdf4' },
                                checked_out: { text: 'Đã trả', color: '#64748b', bg: '#f8fafc' },
                                cancelled: { text: 'Đã hủy', color: '#ef4444', bg: '#fef2f2' },
                                no_show: { text: 'No-show', color: '#f59e0b', bg: '#fffbeb' }
                            };
                            const s = statusMap[b.status] || statusMap.confirmed;
                            
                            return `
                                <tr style="border-bottom:1px solid #f1f5f9; cursor:pointer;" onclick="window.app.openBookingDetailsModal('${b.id}')">
                                    <td style="padding:15px 20px;">
                                        <div style="font-weight:700; color:#1e293b;">${b.guest_name}</div>
                                        <div style="font-size:12px; color:#94a3b8;">${b.guest_phone}</div>
                                    </td>
                                    <td style="padding:15px 20px; font-weight:700;">${room?.name || 'N/A'}</td>
                                    <td style="padding:15px 20px;">
                                        <div style="font-size:12px;">IN: ${new Date(b.check_in).toLocaleString('vi-VN')}</div>
                                        <div style="font-size:12px;">OUT: ${new Date(b.check_out).toLocaleString('vi-VN')}</div>
                                    </td>
                                    <td style="padding:15px 20px; font-weight:700;">${b.total_price.toLocaleString()}đ</td>
                                    <td style="padding:15px 20px;">
                                        <span style="font-weight:800; color:${b.amount_remaining > 0 ? '#ef4444' : '#10b981'};">
                                            ${b.amount_remaining.toLocaleString()}đ
                                        </span>
                                    </td>
                                    <td style="padding:15px 20px;">
                                        <span style="background:${s.bg}; color:${s.color}; padding:4px 10px; border-radius:12px; font-size:11px; font-weight:800; text-transform:uppercase;">
                                            ${s.text}
                                        </span>
                                    </td>
                                    <td style="padding:15px 20px;">
                                        <button class="btn-outline" style="padding:4px 10px; font-size:12px;" onclick="event.stopPropagation(); window.app.openBookingModal(null, '${b.id}')">Sửa</button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    init() {
        // Table view specific interactions if any
    }
}
