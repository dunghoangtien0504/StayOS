import { store } from '../store.js';
import { utils } from '../utils.js';

export const TenantSettings = {
    render() {
        const tenant = store.getTenant();
        const roomsCount = store.getRooms().length;
        const propCount = store.getProperties().length;

        return `
            <div style="max-width: 900px; margin: 0 auto;">
                <div class="stat-card" style="margin-bottom: 24px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h2 style="margin-bottom: 8px;">Gói cước hiện tại: <span style="text-transform: uppercase; color: var(--primary);">${tenant.plan}</span></h2>
                            <p style="color: var(--text-muted);">Tenant ID: ${tenant.id} | Slug: ${tenant.slug}</p>
                        </div>
                        <div class="badge ${tenant.status === 'active' ? 'badge-clean' : 'badge-dirty'}" style="font-size: 1rem; padding: 8px 16px;">
                            ${tenant.status.toUpperCase()}
                        </div>
                    </div>
                </div>

                <div class="grid-cards" style="margin-bottom: 24px;">
                    <div class="stat-card">
                        <div class="stat-title">Sử dụng Cơ sở</div>
                        <div class="stat-value">${propCount} / ${tenant.max_properties}</div>
                        <div class="progress-bar" style="height: 8px; background: #e2e8f0; border-radius: 4px; margin-top: 12px; overflow: hidden;">
                            <div style="width: ${(propCount / tenant.max_properties) * 100}%; background: var(--primary); height: 100%;"></div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-title">Sử dụng Phòng</div>
                        <div class="stat-value">${roomsCount} / ${tenant.max_rooms}</div>
                        <div class="progress-bar" style="height: 8px; background: #e2e8f0; border-radius: 4px; margin-top: 12px; overflow: hidden;">
                            <div style="width: ${(roomsCount / tenant.max_rooms) * 100}%; background: var(--success); height: 100%;"></div>
                        </div>
                    </div>
                </div>

                <h3 style="margin-bottom: 16px;">Nâng cấp Gói cước</h3>
                <div class="grid-cards">
                    ${this.renderPlanCard('free', '0₫', '1 Cơ sở, 10 Phòng', tenant.plan === 'free')}
                    ${this.renderPlanCard('basic', '199,000₫', '3 Cơ sở, 50 Phòng', tenant.plan === 'basic')}
                    ${this.renderPlanCard('pro', '499,000₫', '10 Cơ sở, 200 Phòng', tenant.plan === 'pro')}
                </div>
            </div>
        `;
    },

    renderPlanCard(id, price, desc, isActive) {
        return `
            <div class="stat-card" style="border: ${isActive ? '2px solid var(--primary)' : '1px solid var(--border)'}; position: relative;">
                ${isActive ? '<div style="position: absolute; top: -10px; right: 10px; background: var(--primary); color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem;">ĐANG DÙNG</div>' : ''}
                <div class="stat-title" style="text-transform: uppercase;">Gói ${id}</div>
                <div class="stat-value" style="font-size: 1.5rem; margin: 12px 0;">${price} <span style="font-size: 0.8rem; color: var(--text-muted);">/ tháng</span></div>
                <ul style="list-style: none; font-size: 0.9rem; color: var(--text-muted); margin-bottom: 20px;">
                    <li style="margin-bottom: 8px;">✓ ${desc}</li>
                    <li style="margin-bottom: 8px;">✓ Hỗ trợ qua Email</li>
                </ul>
                <button class="btn ${isActive ? '' : 'btn-primary'}" style="width: 100%;" ${isActive ? 'disabled' : ''} data-plan="${id}">
                    ${isActive ? 'Hiện tại' : 'Nâng cấp ngay'}
                </button>
            </div>
        `;
    },

    init() {
        document.querySelectorAll('[data-plan]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const plan = e.target.dataset.plan;
                if (confirm(`Bạn có muốn nâng cấp lên gói ${plan.toUpperCase()}?`)) {
                    store.updateTenantPlan(store.getCurrentTenantId(), plan);
                    window.app.navigate('settings');
                }
            });
        });
    }
};
