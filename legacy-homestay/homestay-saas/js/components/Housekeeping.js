// Housekeeping.js - PMS Architecture v2.2 (Kanban + Photo Grid v2.0)
export default class Housekeeping {
    render() {
        const assignments = store.getCleaningAssignments() || [];
        const rooms = store.getRooms();

        const getCol = (status) => assignments.filter(a => a.status === status);

        const renderCard = (a) => {
            const room = rooms.find(r => r.id === a.room_id);
            return `
                <div class="filter-card" style="margin-bottom:15px; cursor:pointer;" onclick="window.app.openCleaningModal('${a.id}')">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <span style="font-weight:800; font-size:16px;">Phòng ${room?.name}</span>
                        <span style="font-size:10px; background:#f1f5f9; padding:2px 8px; border-radius:10px; font-weight:700;">#${a.id.slice(-4)}</span>
                    </div>
                    <div style="font-size:12px; color:#64748b; margin-bottom:4px;">Nhân viên: <span style="color:#1e293b; font-weight:700;">${a.assigned_to || 'Chưa gán'}</span></div>
                    <div style="font-size:11px; color:#94a3b8;">Trigger: ${new Date(a.created_at).toLocaleTimeString('vi-VN')}</div>
                </div>
            `;
        };

        return `
            <div class="dashboard-header">
                <div class="header-left">
                    <h1 class="header-title">Điều hành Buồng phòng</h1>
                </div>
                <div class="header-actions">
                    <button class="btn-primary" onclick="alert('Tính năng tự động phân ca dọn phòng...')">Tự động phân ca</button>
                </div>
            </div>

            <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:25px; height: calc(100vh - 200px);">
                <!-- Cột Cần dọn -->
                <div style="background:#f1f5f9; border-radius:16px; padding:20px; display:flex; flex-direction:column;">
                    <div style="display:flex; align-items:center; gap:10px; margin-bottom:20px;">
                        <div style="width:12px; height:12px; background:#ef4444; border-radius:50%;"></div>
                        <h2 style="font-size:14px; font-weight:800; text-transform:uppercase; color:#475569;">Cần dọn (🔴)</h2>
                        <span style="margin-left:auto; background:#cbd5e1; color:white; padding:2px 8px; border-radius:10px; font-size:11px;">${getCol('pending').length}</span>
                    </div>
                    <div style="flex:1; overflow-y:auto;">
                        ${getCol('pending').map(renderCard).join('')}
                    </div>
                </div>

                <!-- Cột Đang dọn -->
                <div style="background:#fffbeb; border-radius:16px; padding:20px; display:flex; flex-direction:column; border:1px solid #fef3c7;">
                    <div style="display:flex; align-items:center; gap:10px; margin-bottom:20px;">
                        <div style="width:12px; height:12px; background:#f59e0b; border-radius:50%;"></div>
                        <h2 style="font-size:14px; font-weight:800; text-transform:uppercase; color:#92400e;">Đang dọn (🟡)</h2>
                        <span style="margin-left:auto; background:#fcd34d; color:white; padding:2px 8px; border-radius:10px; font-size:11px;">${getCol('in_progress').length}</span>
                    </div>
                    <div style="flex:1; overflow-y:auto;">
                        ${getCol('in_progress').map(renderCard).join('')}
                    </div>
                </div>

                <!-- Cột Hoàn thành -->
                <div style="background:#f0fdf4; border-radius:16px; padding:20px; display:flex; flex-direction:column; border:1px solid #dcfce7;">
                    <div style="display:flex; align-items:center; gap:10px; margin-bottom:20px;">
                        <div style="width:12px; height:12px; background:#10b981; border-radius:50%;"></div>
                        <h2 style="font-size:14px; font-weight:800; text-transform:uppercase; color:#166534;">Hoàn thành (🟢)</h2>
                        <span style="margin-left:auto; background:#86efac; color:white; padding:2px 8px; border-radius:10px; font-size:11px;">${getCol('done').length}</span>
                    </div>
                    <div style="flex:1; overflow-y:auto;">
                        ${getCol('done').map(renderCard).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    init() {
        // Logic mở Modal nghiệm thu ảnh v2.0
        window.app.openCleaningModal = (aid) => {
            const assignment = store.getCleaningAssignments().find(a => a.id === aid);
            const room = store.getRooms().find(r => r.id === assignment.room_id);
            const modalRoot = document.getElementById('modal-root');
            
            let photos = assignment.photos || [];
            
            const render = () => {
                modalRoot.innerHTML = `
                    <div class="modal-overlay active">
                        <div class="modal-content" style="width:600px;">
                            <div class="modal-header" style="background:#6366f1;">
                                <span>Nghiệm thu Phòng ${room?.name}</span>
                                <button style="border:none; background:none; font-size:24px; cursor:pointer; color:#fff;" onclick="document.getElementById('modal-root').innerHTML=''">×</button>
                            </div>
                            <div class="modal-body" style="padding:25px;">
                                <div style="margin-bottom:20px;">
                                    <label style="font-size:11px; font-weight:800; color:#94a3b8; text-transform:uppercase;">Tiến độ: ${photos.length}/8 ảnh</label>
                                    <div style="height:8px; background:#f1f5f9; border-radius:4px; margin-top:8px; overflow:hidden;">
                                        <div style="width:${(photos.length/8)*100}%; height:100%; background:#6366f1; transition:0.3s;"></div>
                                    </div>
                                </div>

                                <!-- Photo Grid 2x4 -->
                                <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:10px; margin-bottom:25px;">
                                    ${Array.from({length: 8}).map((_, i) => `
                                        <div style="aspect-ratio:1/1; background:#f8fafc; border:2px dashed #e2e8f0; border-radius:12px; display:flex; align-items:center; justify-content:center; cursor:pointer; overflow:hidden;" onclick="document.getElementById('photo-input-${i}').click()">
                                            ${photos[i] ? `<img src="${photos[i]}" style="width:100%; height:100%; object-fit:cover;">` : `<span style="font-size:20px; color:#cbd5e1;">+</span>`}
                                            <input type="file" id="photo-input-${i}" style="display:none;" onchange="window.app.handlePhotoUpload('${aid}', ${i}, event)">
                                        </div>
                                    `).join('')}
                                </div>

                                <div style="display:flex; justify-content:flex-end; gap:12px; border-top:1px solid #e2e8f0; padding-top:20px;">
                                    <button class="btn-outline" onclick="document.getElementById('modal-root').innerHTML=''">Đóng</button>
                                    ${assignment.status === 'pending' ? `
                                        <button class="btn-primary" onclick="window.app.updateCleaning('${aid}', 'in_progress')">Bắt đầu dọn</button>
                                    ` : `
                                        <button class="btn-primary" style="background:#10b981;" ${photos.length < 8 ? 'disabled' : ''} onclick="window.app.updateCleaning('${aid}', 'done')">Hoàn thành (Đủ 8 ảnh)</button>
                                    `}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            };

            window.app.handlePhotoUpload = (aid, index, event) => {
                const file = event.target.files[0];
                if (!file) return;
                // Giả lập upload ảnh (Base64)
                const reader = new FileReader();
                reader.onload = (e) => {
                    photos[index] = e.target.result;
                    store.updateCleaningPhotos(aid, photos);
                    render();
                };
                reader.readAsDataURL(file);
            };

            render();
        };
    }
}
