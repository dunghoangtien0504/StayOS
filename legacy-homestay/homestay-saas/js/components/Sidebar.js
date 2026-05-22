export const Sidebar = {
    render() {
        return `
            <div class="sidebar" style="display:flex; flex-direction:column; height:100vh; background:#1e3a8a; color:white; overflow:hidden;">
                <!-- Header: Cố định trên cùng -->
                <div class="brand" style="flex-shrink:0; display:flex; justify-content:space-between; align-items:center; height:70px; padding:0 20px;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                        <span style="font-weight:800; font-size:18px;">Hotel Manager</span>
                    </div>
                </div>
                
                <div style="flex-shrink:0; margin: 0 16px 10px; padding: 10px; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; text-align: center; font-size: 11px; cursor: pointer; background: rgba(255,255,255,0.1); color:#fff; display:flex; align-items:center; justify-content:center; gap:8px;" onclick="location.reload()">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M23 4v6h-6"></path><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                    Cập nhật dữ liệu
                </div>

                <!-- Menu Content: Có thể cuộn nếu bị thiếu diện tích -->
                <div class="nav-links" style="flex:1; overflow-y:auto; padding-bottom:20px;">
                    <div class="nav-item" data-view="dashboard">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                        Dashboard
                    </div>
                    <div class="nav-item active" data-view="timeline">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        Đặt phòng
                    </div>
                    <div class="nav-item" data-view="rooms">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path></svg>
                        Phòng
                    </div>
                    <div class="nav-item" data-view="staff">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                        Nhân viên
                    </div>
                    <div class="nav-item" data-view="expenses">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                        Chi phí
                    </div>
                    <div class="nav-item" data-view="reports">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
                        Báo cáo
                    </div>
                    <div class="nav-item" data-view="settings">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                        Cài đặt
                    </div>
                </div>

                <!-- Bottom: Cố định ở đáy Sidebar -->
                <div class="sidebar-bottom" style="flex-shrink:0; padding:20px; border-top:1px solid rgba(255,255,255,0.1); background: #1e3a8a;">
                    <div class="user-profile" style="margin-bottom:10px; display:flex; align-items:center; gap:10px; padding:8px; background:rgba(255,255,255,0.05); border-radius:8px;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        <span style="font-weight:700;">Admin</span>
                    </div>
                    <div class="nav-item logout-btn" style="color:rgba(255,255,255,0.6); background:none; padding:10px; font-size:13px; display:flex; align-items:center; gap:12px; cursor:pointer;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                        Đăng xuất
                    </div>
                </div>
            </div>
        `;
    },

    init() {
        document.querySelectorAll('.nav-item').forEach(item => {
            if (item.dataset.view) {
                item.onclick = () => window.app.navigate(item.dataset.view);
            }
        });
    }
};
