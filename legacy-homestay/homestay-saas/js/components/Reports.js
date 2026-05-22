import { store } from '../store.js';

export const Reports = {
    render() {
        const payments = store.getPaymentRecords();
        const expenses = store.getExpenses();
        const properties = store.getProperties();
        const bookings = store.getBookings();

        const totalRev = payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const totalExp = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
        const totalProfit = totalRev - totalExp;
        const margin = totalRev > 0 ? (totalProfit / totalRev * 100).toFixed(1) : 0;

        return `
            <div class="view-container">
                <header class="topbar">
                    <div class="topbar-title">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.5" style="margin-right:8px;"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
                        Báo cáo tài chính v2.0
                    </div>
                    <div style="display:flex; gap:10px;">
                        <button class="btn-outline">Xuất Excel</button>
                        <button class="btn-primary">In báo cáo</button>
                    </div>
                </header>

                <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:20px; margin-bottom:30px;">
                    <div class="card" style="padding:20px; background:linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border:none;">
                        <div style="font-size:12px; font-weight:700; color:#1e40af; margin-bottom:10px;">TỔNG DOANH THU</div>
                        <div style="font-size:24px; font-weight:800; color:#1e3a8a;">${totalRev.toLocaleString()}đ</div>
                        <div style="font-size:11px; color:#60a5fa; margin-top:5px;">↑ 12% so với tháng trước</div>
                    </div>
                    <div class="card" style="padding:20px; background:linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border:none;">
                        <div style="font-size:12px; font-weight:700; color:#991b1b; margin-bottom:10px;">TỔNG CHI PHÍ</div>
                        <div style="font-size:24px; font-weight:800; color:#b91c1c;">${totalExp.toLocaleString()}đ</div>
                        <div style="font-size:11px; color:#f87171; margin-top:5px;">Bao gồm 8 hạng mục</div>
                    </div>
                    <div class="card" style="padding:20px; background:linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border:none;">
                        <div style="font-size:12px; font-weight:700; color:#166534; margin-bottom:10px;">LỢI NHUẬN RÒNG</div>
                        <div style="font-size:24px; font-weight:800; color:#15803d;">${totalProfit.toLocaleString()}đ</div>
                        <div style="font-size:11px; color:#4ade80; margin-top:5px;">Lợi nhuận thực tế</div>
                    </div>
                    <div class="card" style="padding:20px; background:linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border:none;">
                        <div style="font-size:12px; font-weight:700; color:#92400e; margin-bottom:10px;">TỶ SUẤT (MARGIN)</div>
                        <div style="font-size:24px; font-weight:800; color:#b45309;">${margin}%</div>
                        <div style="font-size:11px; color:#fbbf24; margin-top:5px;">Hiệu suất vận hành</div>
                    </div>
                </div>

                <div class="card" style="margin-bottom:30px;">
                    <div style="padding:15px 20px; border-bottom:1px solid #e2e8f0; font-weight:700; color:#1e293b;">PHÂN TÍCH DOANH THU CHI TIẾT</div>
                    <div class="table-responsive">
                        <table style="width:100%; border-collapse:collapse; font-size:13px;">
                            <thead>
                                <tr style="background:#f8fafc; border-bottom:1px solid #e2e8f0;">
                                    <th style="padding:15px; text-align:left;">Tháng</th>
                                    <th style="padding:15px; text-align:right;">Doanh thu</th>
                                    <th style="padding:15px; text-align:right;">Chi phí</th>
                                    <th style="padding:15px; text-align:right;">Lợi nhuận</th>
                                    <th style="padding:15px; text-align:right;">Tăng trưởng</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style="border-bottom:1px solid #f1f5f9;">
                                    <td style="padding:15px; font-weight:700;">Tháng 05/2026</td>
                                    <td style="padding:15px; text-align:right; color:#2563eb; font-weight:700;">${totalRev.toLocaleString()}đ</td>
                                    <td style="padding:15px; text-align:right; color:#ef4444;">${totalExp.toLocaleString()}đ</td>
                                    <td style="padding:15px; text-align:right; color:#10b981; font-weight:800;">${totalProfit.toLocaleString()}đ</td>
                                    <td style="padding:15px; text-align:right; color:#10b981;">+100%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:30px;">
                    <div class="card">
                        <div style="padding:15px 20px; border-bottom:1px solid #e2e8f0; font-weight:700;">DOANH THU THEO CƠ SỞ</div>
                        <div style="padding:20px;">
                            ${properties.map(p => {
                                const pRev = payments.filter(pay => pay.property_id === p.id).reduce((s, pay) => s + Number(pay.amount), 0);
                                const percent = totalRev > 0 ? (pRev / totalRev * 100).toFixed(0) : 0;
                                return `
                                    <div style="margin-bottom:15px;">
                                        <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:5px;">
                                            <span style="font-weight:600;">${p.name}</span>
                                            <span>${pRev.toLocaleString()}đ (${percent}%)</span>
                                        </div>
                                        <div style="height:8px; background:#f1f5f9; border-radius:4px; overflow:hidden;">
                                            <div style="height:100%; width:${percent}%; background:#3b82f6;"></div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                    <div class="card">
                        <div style="padding:15px 20px; border-bottom:1px solid #e2e8f0; font-weight:700;">DOANH THU THEO NGUỒN</div>
                        <div style="padding:20px;">
                            ${['Agoda', 'Booking.com', 'Facebook', 'Walk-in'].map(src => {
                                const sRev = bookings.filter(b => b.source === src).reduce((s, b) => s + (b.amount_paid || 0), 0);
                                const percent = totalRev > 0 ? (sRev / totalRev * 100).toFixed(0) : 0;
                                return `
                                    <div style="margin-bottom:15px;">
                                        <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:5px;">
                                            <span style="font-weight:600;">${src}</span>
                                            <span>${sRev.toLocaleString()}đ (${percent}%)</span>
                                        </div>
                                        <div style="height:8px; background:#f1f5f9; border-radius:4px; overflow:hidden;">
                                            <div style="height:100%; width:${percent}%; background:#10b981;"></div>
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
