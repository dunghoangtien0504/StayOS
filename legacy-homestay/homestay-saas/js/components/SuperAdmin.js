import { store } from '../store.js';
import { utils } from '../utils.js';

export const SuperAdmin = {
    render() {
        const tenants = store.getAllTenants();
        const totalMRR = tenants.reduce((sum, t) => {
            if (t.plan === 'basic') return sum + 199000;
            if (t.plan === 'pro') return sum + 499000;
            return sum;
        }, 0);

        return `
            <div style="max-width: 1000px; margin: 0 auto;">
                <div class="grid-cards" style="margin-bottom: 24px;">
                    <div class="stat-card" style="background: #1e1b4b; color: white;">
                        <div class="stat-title" style="color: #94a3b8;">Tổng doanh thu (MRR)</div>
                        <div class="stat-value" style="color: #fbbf24;">${utils.formatMoney(totalMRR)}</div>
                        <div class="stat-change text-success" style="color: #4ade80;">+25% tháng này</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-title">Tổng số khách hàng (Tenants)</div>
                        <div class="stat-value">${tenants.length}</div>
                        <div class="stat-change text-success">+3 mới hôm nay</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-title">Churn Rate</div>
                        <div class="stat-value">2.4%</div>
                        <div class="stat-change text-danger">-0.5%</div>
                    </div>
                </div>

                <h3 style="margin-bottom: 16px;">Danh sách Tenants Hệ thống</h3>
                <div class="stat-card" style="padding: 0; overflow: hidden;">
                    <table class="data-table" style="margin-bottom: 0;">
                        <thead>
                            <tr>
                                <th>Tên Tenant</th>
                                <th>Gói</th>
                                <th>Trạng thái</th>
                                <th>Ngày đăng ký</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tenants.map(t => `
                                <tr>
                                    <td><strong>${t.name}</strong><br><small style="color: var(--text-muted);">${t.slug}.homestay.os</small></td>
                                    <td><span class="badge ${t.plan === 'pro' ? 'badge-clean' : 'badge-cleaning'}" style="text-transform: uppercase;">${t.plan}</span></td>
                                    <td><span class="text-success">● Active</span></td>
                                    <td>${new Date(t.created_at).toLocaleDateString('vi-VN')}</td>
                                    <td>
                                        <button class="btn btn-primary btn-sm" onclick="alert('Đang chuyển sang tenant ${t.slug}...')">Impersonate</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    init() {}
};
