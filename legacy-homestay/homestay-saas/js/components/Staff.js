import { store } from '../store.js';

export const Staff = {
    render() {
        const staffList = store.getStaff();
        const currentUser = store.getCurrentUser();
        const isAdmin = currentUser.role === 'Admin';

        return `
            <div class="view-container">
                <header class="topbar">
                    <div class="topbar-title">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.5" style="margin-right:8px;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                        Quản lý nhân viên
                    </div>
                    ${isAdmin ? '<button class="btn-primary" onclick="window.app.openStaffModal()">+ Thêm nhân viên</button>' : ''}
                </header>

                <div class="data-card" style="margin-bottom:30px;">
                    <div style="padding:15px 20px; border-bottom:1px solid #e2e8f0; font-weight:700;">PHÂN QUYỀN HỆ THỐNG</div>
                    <div class="table-responsive">
                        <table style="width:100%; border-collapse:collapse; font-size:13px;">
                            <thead>
                                <tr style="background:#f8fafc; border-bottom:1px solid #e2e8f0;">
                                    <th style="padding:15px; text-align:left;">Quyền hạn</th>
                                    <th style="padding:15px; text-align:center;">Admin</th>
                                    <th style="padding:15px; text-align:center;">Quản lý</th>
                                    <th style="padding:15px; text-align:center;">Nhân viên</th>
                                    <th style="padding:15px; text-align:center;">Nhà đầu tư</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style="border-bottom:1px solid #f1f5f9;">
                                    <td style="padding:15px; font-weight:600;">Xem booking</td>
                                    <td style="padding:15px; text-align:center; color:#10b981;">✓</td>
                                    <td style="padding:15px; text-align:center; color:#10b981;">✓</td>
                                    <td style="padding:15px; text-align:center; color:#10b981;">✓</td>
                                    <td style="padding:15px; text-align:center; color:#64748b; font-size:11px;">(Chỉ cơ sở đầu tư)</td>
                                </tr>
                                <tr style="border-bottom:1px solid #f1f5f9;">
                                    <td style="padding:15px; font-weight:600;">Thêm booking</td>
                                    <td style="padding:15px; text-align:center; color:#10b981;">✓</td>
                                    <td style="padding:15px; text-align:center; color:#10b981;">✓</td>
                                    <td style="padding:15px; text-align:center; color:#10b981;">✓</td>
                                    <td style="padding:15px; text-align:center; color:#ef4444;">✕</td>
                                </tr>
                                <tr style="border-bottom:1px solid #f1f5f9;">
                                    <td style="padding:15px; font-weight:600;">Sửa/Xóa booking</td>
                                    <td style="padding:15px; text-align:center; color:#10b981;">✓</td>
                                    <td style="padding:15px; text-align:center; color:#10b981;">✓</td>
                                    <td style="padding:15px; text-align:center; color:#64748b; font-size:11px;">(Chỉ của mình)</td>
                                    <td style="padding:15px; text-align:center; color:#ef4444;">✕</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="data-card">
                    <div style="padding:15px 20px; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center;">
                        <strong style="color:#1e3a8a;">DANH SÁCH CTV / NHÂN VIÊN</strong>
                        <input type="text" placeholder="Tìm theo tên..." class="form-input" style="width:250px; padding:6px 12px;">
                    </div>
                    <div class="table-responsive">
                        <table style="width:100%; border-collapse:collapse; font-size:13px;">
                            <thead>
                                <tr style="background:#f8fafc; border-bottom:1px solid #e2e8f0;">
                                    <th style="padding:15px; text-align:left;">ID</th>
                                    <th style="padding:15px; text-align:left;">Tên</th>
                                    <th style="padding:15px; text-align:left;">Quyền</th>
                                    <th style="padding:15px; text-align:left;">Quản lý cơ sở</th>
                                    <th style="padding:15px; text-align:center;">Màu</th>
                                    <th style="padding:15px; text-align:right;">Hoa hồng (%)</th>
                                    <th style="padding:15px; text-align:right;">Hoa hồng</th>
                                    ${isAdmin ? '<th style="padding:15px; text-align:center;">Thao tác</th>' : ''}
                                </tr>
                            </thead>
                            <tbody>
                                ${staffList.map(s => `
                                    <tr style="border-bottom:1px solid #f1f5f9; transition:0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
                                        <td style="padding:15px; color:#64748b;">${s.id}</td>
                                        <td style="padding:15px; font-weight:700;">${s.name}</td>
                                        <td style="padding:15px;">
                                            <span style="padding:2px 8px; border-radius:4px; font-size:11px; background:${s.role === 'Admin' ? '#fef2f2' : (s.role === 'Quản lý' ? '#eff6ff' : '#f0fdf4')}; color:${s.role === 'Admin' ? '#ef4444' : (s.role === 'Quản lý' ? '#2563eb' : '#16a34a')}; font-weight:600;">${s.role}</span>
                                        </td>
                                        <td style="padding:15px; color:#64748b; font-style:italic;">${s.facility}</td>
                                        <td style="padding:15px; text-align:center;">
                                            <div style="width:20px; height:20px; border-radius:4px; background:${s.color}; margin:0 auto; border:1px solid rgba(0,0,0,0.1);"></div>
                                        </td>
                                        <td style="padding:15px; text-align:right;">${s.comm}</td>
                                        <td style="padding:15px; text-align:right; color:#16a34a; font-weight:700;">${s.totalComm}</td>
                                        ${isAdmin ? `
                                            <td style="padding:15px; text-align:center;">
                                                <button onclick="window.app.openStaffModal('${s.id}')" style="border:none; background:none; cursor:pointer; font-size:16px; margin-right:10px;" title="Chỉnh sửa">📝</button>
                                                <button onclick="window.app.deleteStaff('${s.id}')" style="border:none; background:none; cursor:pointer; font-size:16px;" title="Xóa">🗑️</button>
                                            </td>
                                        ` : ''}
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },

    init() {}
};
