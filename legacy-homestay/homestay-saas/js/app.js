import { store } from './store.js';
import { Timeline } from './components/Timeline.js';
import { Sidebar } from './components/Sidebar.js';
import { Housekeeping } from './components/Housekeeping.js';
import { Expenses } from './components/Expenses.js';
import { Reports } from './components/Reports.js';
import { Dashboard } from './components/Dashboard.js';
import { TableView } from './components/TableView.js';
import { Staff } from './components/Staff.js';

class App {
    constructor() {
        this.currentView = 'timeline';
        store.init();
        window.store = store;
        this.renderLayout();
        this.navigate('timeline');
    }

    renderLayout() {
        document.body.innerHTML = `
            <div class="app-container" style="display:flex; height:100vh; overflow:hidden;">
                <div id="sidebar-container" style="width:260px; height:100vh; background:#1e3a8a; flex-shrink:0;"></div>
                <main class="main-content" style="flex:1; overflow-y:auto; background:#f8fafc;">
                    <div id="view-container"></div>
                </main>
            </div>
            <div id="modal-root"></div>
            <div id="toast-container" class="toast-container"></div>
        `;
        document.getElementById('sidebar-container').innerHTML = Sidebar.render();
        Sidebar.init();
    }

    showToast(message, type = 'danger') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`; 
        toast.innerText = message;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }

    formatCurrencyInput(input) {
        let value = input.value.replace(/[^0-9]/g, '');
        if (value === '') { input.value = ''; return; }
        input.value = Number(value).toLocaleString();
    }

    formatDateInput(input) {
        let v = input.value.replace(/\D/g, '').slice(0, 8);
        if (v.length >= 5) v = `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`;
        else if (v.length >= 3) v = `${v.slice(0, 2)}/${v.slice(2)}`;
        input.value = v;
    }

    getNumericValue(formattedString) {
        if (!formattedString) return 0;
        return Number(formattedString.toString().replace(/[.,]/g, '')) || 0;
    }

    parseDateVN(vnStr) {
        const parts = vnStr.split('/');
        if (parts.length !== 3) return null;
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }

    navigate(view) {
        this.currentView = view;
        const container = document.getElementById('view-container');
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.view === view);
        });

        switch(view) {
            case 'dashboard': container.innerHTML = Dashboard.render(); Dashboard.init(); break;
            case 'timeline': container.innerHTML = Timeline.render(); Timeline.init(); break;
            case 'table_view': container.innerHTML = TableView.render(); TableView.init(); break;
            case 'staff': container.innerHTML = Staff.render(); Staff.init(); break;
            case 'housekeeping': container.innerHTML = Housekeeping.render(); Housekeeping.init(); break;
            case 'expenses': container.innerHTML = Expenses.render(); Expenses.init(); break;
            case 'reports': container.innerHTML = Reports.render(); Reports.init(); break;
            default: container.innerHTML = `<div class="view-container"><h1>Module ${view} đang phát triển</h1></div>`;
        }
    }

    openStatusModal(roomId) {
        const room = store.getRooms().find(r => r.id === roomId);
        const modalRoot = document.getElementById('modal-root');
        let selectedStatus = room.status;
        let uploadedFiles = [];

        const render = () => {
            modalRoot.innerHTML = `
                <div class="modal-overlay active">
                    <div class="modal-content" style="width:450px;">
                        <div class="modal-header">
                            <span>Trạng thái phòng ${room.name}</span>
                            <button style="border:none; background:none; font-size:24px; cursor:pointer; color:#fff;" onclick="document.getElementById('modal-root').innerHTML=''">×</button>
                        </div>
                        <div class="modal-body" style="padding:20px;">
                            <div class="status-option ${selectedStatus === 'clean' ? 'active' : ''}" onclick="window.app.selectStatus('${roomId}', 'clean')">🟢 Đã dọn (Sạch)</div>
                            <div class="status-option ${selectedStatus === 'dirty' ? 'active' : ''}" onclick="window.app.selectStatus('${roomId}', 'dirty')">🔴 Bẩn</div>
                            <div class="status-option ${selectedStatus === 'cleaning' ? 'active' : ''}" onclick="window.app.selectStatus('${roomId}', 'cleaning')">🟡 Đang dọn</div>
                            
                            ${selectedStatus === 'clean' ? `
                                <div style="margin-top:15px; padding:15px; border:1px dashed #cbd5e1; border-radius:8px; background:#f8fafc;">
                                    <div style="font-weight:700; font-size:12px; color:#1e293b; margin-bottom:10px;">📸 Ảnh nghiệm thu (Tối thiểu 8 ảnh)</div>
                                    <input type="file" id="photo-upload" multiple accept="image/*" style="display:none;">
                                    <label for="photo-upload" style="display:block; padding:8px; background:#fff; border:1px solid #e2e8f0; border-radius:6px; text-align:center; cursor:pointer; font-size:12px;">+ Chọn ảnh</label>
                                    <div style="margin-top:10px; font-size:12px; font-weight:700; color:${uploadedFiles.length >= 8 ? '#16a34a' : '#ef4444'};">Đã chọn: ${uploadedFiles.length}/8 ảnh</div>
                                </div>
                            ` : ''}

                            <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
                                <button class="btn-outline" onclick="document.getElementById('modal-root').innerHTML=''">Đóng</button>
                                <button class="btn-primary" id="save-status-btn" ${selectedStatus === 'clean' && uploadedFiles.length < 8 ? 'disabled style="opacity:0.5;"' : ''}>Cập nhật</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            if (selectedStatus === 'clean') {
                document.getElementById('photo-upload').onchange = (e) => { uploadedFiles = Array.from(e.target.files); render(); };
            }
            document.getElementById('save-status-btn').onclick = () => {
                store.updateRoomStatus(roomId, selectedStatus);
                document.getElementById('modal-root').innerHTML = '';
                this.navigate('timeline');
            };
        };
        this.selectStatus = (rid, status) => { selectedStatus = status; render(); };
        render();
    }

    openBookingModal(roomId = null, bookingId = null, startTime = null) {
        const modalRoot = document.getElementById('modal-root');
        const rooms = store.getRooms();
        const properties = store.getProperties();
        const configs = store.getConfigs();
        
        let booking = bookingId ? store.getBookings().find(b => b.id === bookingId) : null;
        let initialRoomId = roomId || booking?.room_id;
        let initialPropertyId = booking?.property_id || (initialRoomId ? rooms.find(r => r.id === initialRoomId)?.property_id : properties[0]?.id);

        const fmtDateVN = (d) => `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
        const fmtTime = (d) => ({ h: d.getHours().toString().padStart(2, '0'), m: d.getMinutes().toString().padStart(2, '0') });

        let checkInDate = '', checkInH = '14', checkInM = '00';
        let checkOutDate = '', checkOutH = '12', checkOutM = '00';

        if (booking) {
            const dIn = new Date(booking.check_in);
            checkInDate = fmtDateVN(dIn);
            const tIn = fmtTime(dIn); checkInH = tIn.h; checkInM = tIn.m;
            const dOut = new Date(booking.check_out);
            checkOutDate = fmtDateVN(dOut);
            const tOut = fmtTime(dOut); checkOutH = tOut.h; checkOutM = tOut.m;
        } else if (startTime) {
            const d = new Date(Number(startTime));
            checkInDate = fmtDateVN(d);
            const t = fmtTime(d); checkInH = t.h; checkInM = t.m;
        } else {
            const d = new Date(); checkInDate = fmtDateVN(d);
        }

        const renderTimePicker = (name, selH, selM) => {
            let hOpts = '', mOpts = '';
            for(let i=0; i<24; i++) {
                const v = i.toString().padStart(2,'0');
                hOpts += `<option value="${v}" ${v === selH ? 'selected' : ''}>${v}</option>`;
            }
            for(let i=0; i<60; i+=5) {
                const v = i.toString().padStart(2,'0');
                mOpts += `<option value="${v}" ${v === selM ? 'selected' : ''}>${v}</option>`;
            }
            return `
                <div style="display:flex; gap:4px; align-items:center;">
                    <select name="${name}_h" class="form-input time-trigger" style="padding:8px 4px; min-width:55px;">${hOpts}</select>
                    <span>:</span>
                    <select name="${name}_m" class="form-input time-trigger" style="padding:8px 4px; min-width:55px;">${mOpts}</select>
                </div>
            `;
        };

        modalRoot.innerHTML = `
            <div class="modal-overlay active">
                <div class="modal-content" style="width:780px;">
                    <div class="modal-header">
                        <span>${booking ? 'Chi tiết đặt phòng v2.0' : 'Thêm đặt phòng mới'}</span>
                        <button style="border:none; background:none; font-size:24px; cursor:pointer; color:#fff;" id="close-modal">×</button>
                    </div>
                    <div class="modal-body" style="padding:0; overflow-y:auto; max-height:85vh;">
                        <form id="booking-form">
                            <div class="form-grid">
                                <div>
                                    <label class="form-label">Cơ sở / Phòng <span>*</span></label>
                                    <div style="display:flex; gap:8px;">
                                        <select name="property_id" id="property-select" class="form-input" style="flex:1;">
                                            ${properties.map(p => `<option value="${p.id}" ${p.id === initialPropertyId ? 'selected' : ''}>${p.name}</option>`).join('')}
                                        </select>
                                        <select name="room_id" id="room-select" class="form-input" style="flex:1;"></select>
                                    </div>
                                </div>
                                <div>
                                    <label class="form-label">Khách hàng / SĐT <span>*</span></label>
                                    <div style="display:flex; gap:8px;">
                                        <input type="text" name="guest_name" class="form-input" placeholder="Tên khách" value="${booking?.guest_name || ''}" required style="flex:1;">
                                        <input type="text" name="guest_phone" class="form-input" placeholder="Số điện thoại" value="${booking?.guest_phone || ''}" required style="flex:1;">
                                    </div>
                                </div>
                                <div>
                                    <label class="form-label">Check-in <span>*</span></label>
                                    <div style="display:flex; gap:8px; align-items:center;">
                                        <button type="button" class="calendar-icon-btn" style="border:none; background:none; font-size:20px; cursor:pointer; padding:0;" onclick="document.getElementById('check_in_date_hidden').showPicker()">🗓️</button>
                                        <div style="position:relative; flex:1.5;">
                                            <input type="text" id="check_in_date_text" name="check_in_date" class="form-input date-vn time-trigger" placeholder="dd/mm/yyyy" value="${checkInDate}" required>
                                            <input type="date" id="check_in_date_hidden" style="position:absolute; opacity:0; width:0; height:0; bottom:0; left:0;">
                                        </div>
                                        ${renderTimePicker('check_in', checkInH, checkInM)}
                                    </div>
                                </div>
                                <div>
                                    <label class="form-label">Check-out <span>*</span></label>
                                    <div style="display:flex; gap:8px; align-items:center;">
                                        <button type="button" class="calendar-icon-btn" style="border:none; background:none; font-size:20px; cursor:pointer; padding:0;" onclick="document.getElementById('check_out_date_hidden').showPicker()">🗓️</button>
                                        <div style="position:relative; flex:1.5;">
                                            <input type="text" id="check_out_date_text" name="check_out_date" class="form-input date-vn time-trigger" placeholder="dd/mm/yyyy" value="${checkOutDate}" required>
                                            <input type="date" id="check_out_date_hidden" style="position:absolute; opacity:0; width:0; height:0; bottom:0; left:0;">
                                        </div>
                                        ${renderTimePicker('check_out', checkOutH, checkOutM)}
                                    </div>
                                </div>
                                <div>
                                    <label class="form-label">Hình thức / Nhân viên</label>
                                    <div style="display:flex; gap:8px;">
                                        <select name="room_type" id="room_type" class="form-input" style="flex:1;">
                                            ${configs.room_types.map(t => `<option ${booking?.room_type === t ? 'selected' : ''}>${t}</option>`).join('')}
                                        </select>
                                        <select name="staff_name" class="form-input" style="flex:1;">
                                            ${configs.staff.map(s => `<option ${booking?.staff_name === s ? 'selected' : ''}>${s}</option>`).join('')}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label class="form-label">Giá / Phụ phí / Trạng thái</label>
                                    <div style="display:flex; gap:8px;">
                                        <input type="text" name="unit_price" id="unit_price" class="form-input" value="${(booking?.unit_price || 0).toLocaleString()}" style="flex:1;">
                                        <input type="text" name="surcharge" id="surcharge" class="form-input" value="${(booking?.surcharge || 0).toLocaleString()}" style="flex:1;">
                                        <select name="status" class="form-input" style="flex:1; font-weight:700;">
                                            <option value="confirmed" ${booking?.status === 'confirmed' ? 'selected' : ''}>Chưa cọc</option>
                                            <option value="deposited" ${booking?.status === 'deposited' ? 'selected' : ''}>Đã cọc</option>
                                            <option value="checked_in" ${booking?.status === 'checked_in' ? 'selected' : ''}>Đang ở</option>
                                            <option value="checked_out" ${booking?.status === 'checked_out' ? 'selected' : ''}>Đã trả</option>
                                            <option value="no_show" ${booking?.status === 'no_show' ? 'selected' : ''}>No-show</option>
                                        </select>
                                    </div>
                                </div>
                                <div style="grid-column: span 2; display:flex; justify-content:space-between; align-items:center; background:#eff6ff; padding:12px; border-radius:8px;">
                                    <div style="font-weight:700; color:#1d4ed8; font-size:16px;">TỔNG DOANH THU: <span id="total_display">0đ</span></div>
                                    <div style="font-weight:700; color:#ef4444;" id="remaining-display">Còn lại: 0đ</div>
                                </div>
                            </div>
                            
                            <div style="padding:20px;">
                                <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
                                    <span style="font-weight:700;">Lịch sử thanh toán</span>
                                    <button type="button" class="btn-outline" id="add-payment-btn" style="padding:2px 8px;">+</button>
                                </div>
                                <div id="payment-rows"></div>
                            </div>

                            <div style="display:flex; justify-content:space-between; gap:12px; padding:20px; background:#f8fafc; border-top:1px solid #e2e8f0;">
                                <div style="display:flex; gap:8px;">
                                    ${booking && booking.status !== 'checked_in' ? `<button type="button" class="btn-primary" id="checkin-btn" style="background:#10b981;">CHECK-IN</button>` : ''}
                                    ${booking && booking.status === 'checked_in' ? `<button type="button" class="btn-primary" id="checkout-btn" style="background:#6b7280;">CHECK-OUT</button>` : ''}
                                    ${booking && (booking.status === 'confirmed' || booking.status === 'deposited') ? `<button type="button" class="btn-outline" id="noshow-btn" style="color:#f59e0b; border-color:#f59e0b;">NO-SHOW</button>` : ''}
                                </div>
                                <div style="display:flex; gap:8px;">
                                    <button type="button" class="btn-outline" id="close-btn">Đóng</button>
                                    <button type="submit" class="btn-primary">LƯU THÔNG TIN</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        const updateRoomList = (pId, selRId) => {
            const fRooms = rooms.filter(r => r.property_id === pId);
            document.getElementById('room-select').innerHTML = fRooms.map(r => `<option value="${r.id}" ${r.id === selRId ? 'selected' : ''}>${r.name}</option>`).join('');
        };
        const propertySelect = document.getElementById('property-select');
        propertySelect.onchange = (e) => updateRoomList(e.target.value, null);
        updateRoomList(initialPropertyId, initialRoomId);

        const updateCalculations = () => {
            const type = document.getElementById('room_type').value;
            const price = this.getNumericValue(document.getElementById('unit_price').value);
            const surcharge = this.getNumericValue(document.getElementById('surcharge').value);
            
            // Auto-pricing logic
            const cin = this.parseDateVN(document.getElementById('check_in_date_text').value);
            const cout = this.parseDateVN(document.getElementById('check_out_date_text').value);
            let total = 0;

            if (cin && cout) {
                const start = new Date(`${cin}T${document.getElementsByName('check_in_h')[0].value}:${document.getElementsByName('check_in_m')[0].value}`).getTime();
                const end = new Date(`${cout}T${document.getElementsByName('check_out_h')[0].value}:${document.getElementsByName('check_out_m')[0].value}`).getTime();
                const diffMs = end - start;

                if (type === 'Theo ngày') {
                    const days = Math.ceil(diffMs / (24 * 60 * 60 * 1000)) || 1;
                    total = (price * days) + surcharge;
                } else if (type === 'Theo giờ') {
                    const hours = Math.ceil(diffMs / (60 * 60 * 1000)) || 1;
                    total = (price * hours) + surcharge;
                } else if (type === 'Qua đêm') {
                    total = price + surcharge; // Fixed per night as per v2.0
                } else {
                    total = price + surcharge;
                }
            } else {
                total = price + surcharge;
            }

            const totalEl = document.getElementById('total_display');
            const remainEl = document.getElementById('remaining-display');
            
            totalEl.innerText = total.toLocaleString() + 'đ';
            let totalPaid = 0;
            document.querySelectorAll('.p-amount').forEach(input => { totalPaid += this.getNumericValue(input.value); });
            const remaining = total - totalPaid;
            
            remainEl.innerText = `Còn lại: ${remaining.toLocaleString()}đ`;
            remainEl.style.color = remaining > 0 ? '#ef4444' : '#10b981';
        };

        const renderPaymentRow = (p = { date: new Date().toISOString().slice(0,10), amount: 0, note: '' }) => {
            const row = document.createElement('div');
            row.className = 'payment-row';
            row.style = 'display:grid; grid-template-columns: 180px 140px 1fr 40px; gap:10px; margin-bottom:10px;';
            const payDateVN = p.date.includes('-') ? `${p.date.split('-')[2]}/${p.date.split('-')[1]}/${p.date.split('-')[0]}` : p.date;
            row.innerHTML = `
                <div style="display:flex; align-items:center; gap:5px; position:relative;">
                    <input type="date" class="p-date-hidden" style="position:absolute; opacity:0; width:0; height:0; left:0;">
                    <button type="button" class="calendar-icon-btn small" style="border:none; background:none; font-size:16px; cursor:pointer; padding:0;">🗓️</button>
                    <input type="text" class="form-input p-date date-vn" value="${payDateVN}" style="flex:1;">
                </div>
                <input type="text" class="form-input p-amount" value="${Number(p.amount).toLocaleString()}">
                <input type="text" class="form-input p-note" value="${p.note}" placeholder="Ghi chú">
                <button type="button" class="delete-p-btn">🗑️</button>
            `;
            const hInput = row.querySelector('.p-date-hidden');
            const tInput = row.querySelector('.p-date');
            row.querySelector('.calendar-icon-btn').onclick = () => hInput.showPicker();
            hInput.onchange = (e) => {
                const [y, m, d] = e.target.value.split('-');
                tInput.value = `${d}/${m}/${y}`;
                updateCalculations();
            };
            row.querySelector('.delete-p-btn').onclick = () => { row.remove(); updateCalculations(); };
            row.querySelector('.p-amount').oninput = (e) => { this.formatCurrencyInput(e.target); updateCalculations(); };
            document.getElementById('payment-rows').appendChild(row);
        };

        if (booking?.payments?.length > 0) booking.payments.forEach(p => renderPaymentRow(p));
        else renderPaymentRow();

        document.getElementById('add-payment-btn').onclick = () => renderPaymentRow();
        document.querySelectorAll('.time-trigger').forEach(el => el.onchange = updateCalculations);
        document.getElementById('room_type').onchange = updateCalculations;
        document.getElementById('unit_price').oninput = (e) => { this.formatCurrencyInput(e.target); updateCalculations(); };
        document.getElementById('surcharge').oninput = (e) => { this.formatCurrencyInput(e.target); updateCalculations(); };
        updateCalculations();

        // Check-in logic
        if (document.getElementById('checkin-btn')) {
            document.getElementById('checkin-btn').onclick = () => {
                const room = rooms.find(r => r.id === initialRoomId);
                if (room.status !== 'clean') {
                    this.showToast(`Phòng ${room.name} chưa sạch! Hãy dọn phòng trước khi check-in.`, 'danger');
                    return;
                }
                store.updateBooking(booking.id, { status: 'checked_in', actual_check_in: new Date().toISOString() });
                modalRoot.innerHTML = ''; this.navigate('timeline');
            };
        }

        // Check-out logic
        if (document.getElementById('checkout-btn')) {
            document.getElementById('checkout-btn').onclick = () => {
                const total = this.getNumericValue(document.getElementById('total_display').innerText);
                let paid = 0; document.querySelectorAll('.p-amount').forEach(i => paid += this.getNumericValue(i.value));
                if (total > paid) {
                    if (!confirm(`Khách còn nợ ${(total - paid).toLocaleString()}đ. Bạn vẫn muốn Check-out?`)) return;
                }
                store.updateBooking(booking.id, { status: 'checked_out', actual_check_out: new Date().toISOString() });
                store.updateRoomStatus(booking.room_id, 'dirty');
                modalRoot.innerHTML = ''; this.navigate('timeline');
            };
        }

        // No-show logic
        if (document.getElementById('noshow-btn')) {
            document.getElementById('noshow-btn').onclick = () => {
                if (confirm('Xác nhận No-show? Phòng sẽ được giải phóng ngay lập tức.')) {
                    store.updateBooking(booking.id, { status: 'no_show' });
                    modalRoot.innerHTML = ''; this.navigate('timeline');
                }
            };
        }

        document.getElementById('close-modal').onclick = () => modalRoot.innerHTML = '';
        document.getElementById('close-btn').onclick = () => modalRoot.innerHTML = '';
        document.getElementById('booking-form').onsubmit = (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            data.check_in = `${this.parseDateVN(data.check_in_date)}T${data.check_in_h}:${data.check_in_m}`;
            data.check_out = `${this.parseDateVN(data.check_out_date)}T${data.check_out_h}:${data.check_out_m}`;
            data.unit_price = this.getNumericValue(data.unit_price);
            data.surcharge = this.getNumericValue(data.surcharge);
            data.payments = [];
            document.querySelectorAll('.payment-row').forEach(row => {
                data.payments.push({
                    date: this.parseDateVN(row.querySelector('.p-date').value) || row.querySelector('.p-date').value,
                    amount: this.getNumericValue(row.querySelector('.p-amount').value),
                    note: row.querySelector('.p-note').value
                });
            });
            if (booking) store.updateBooking(booking.id, data);
            else store.addBooking(data);
            modalRoot.innerHTML = ''; this.navigate(this.currentView);
        };
    }

    openStaffModal(staffId = null) {
        // Kiểm tra quyền Admin
        const currentUser = store.getCurrentUser();
        if (currentUser.role !== 'Admin') {
            this.showToast('Bạn không có quyền thực hiện thao tác này!', 'danger');
            return;
        }

        const modalRoot = document.getElementById('modal-root');
        const staff = staffId ? store.getStaff().find(s => s.id === staffId) : null;
        const properties = store.getProperties();

        modalRoot.innerHTML = `
            <div class="modal-overlay active">
                <div class="modal-content" style="width:500px;">
                    <div class="modal-header">
                        <span>${staff ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}</span>
                        <button style="border:none; background:none; font-size:24px; cursor:pointer; color:#fff;" onclick="document.getElementById('modal-root').innerHTML=''">×</button>
                    </div>
                    <form id="staff-form" style="padding:20px;">
                        <div style="margin-bottom:15px;">
                            <label class="form-label">Tên nhân viên</label>
                            <input type="text" name="name" class="form-input" value="${staff?.name || ''}" required>
                        </div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-bottom:15px;">
                            <div>
                                <label class="form-label">Quyền hạn</label>
                                <select name="role" class="form-input">
                                    <option ${staff?.role === 'Admin' ? 'selected' : ''}>Admin</option>
                                    <option ${staff?.role === 'Quản lý' ? 'selected' : ''}>Quản lý</option>
                                    <option ${staff?.role === 'Nhân viên' ? 'selected' : ''}>Nhân viên</option>
                                    <option ${staff?.role === 'Nhà đầu tư' ? 'selected' : ''}>Nhà đầu tư</option>
                                </select>
                            </div>
                            <div>
                                <label class="form-label">Cơ sở quản lý</label>
                                <select name="facility" class="form-input">
                                    <option value="Tất cả" ${staff?.facility === 'Tất cả' ? 'selected' : ''}>Tất cả cơ sở</option>
                                    ${properties.map(p => `<option value="${p.name}" ${staff?.facility === p.name ? 'selected' : ''}>${p.name}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-bottom:15px;">
                            <div>
                                <label class="form-label">Hoa hồng (%)</label>
                                <input type="text" name="comm" class="form-input" value="${staff?.comm || '0%'}" placeholder="VD: 10%">
                            </div>
                            <div>
                                <label class="form-label">Màu định danh</label>
                                <input type="color" name="color" class="form-input" value="${staff?.color || '#3b82f6'}" style="height:40px; padding:2px;">
                            </div>
                        </div>
                        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
                            <button type="button" class="btn-outline" onclick="document.getElementById('modal-root').innerHTML=''">Hủy</button>
                            <button type="submit" class="btn-primary">LƯU THÔNG TIN</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.getElementById('staff-form').onsubmit = (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            
            // Hiện popup xác nhận lớp 2
            this.confirmAction(
                `Xác nhận ${staff ? 'cập nhật' : 'thêm'} nhân viên <strong>${data.name}</strong>?`,
                () => {
                    if (staff) store.updateStaff(staffId, data);
                    else store.addStaff(data);
                    modalRoot.innerHTML = '';
                    this.navigate('staff');
                    this.showToast('Thao tác thành công!', 'success');
                }
            );
        };
    }

    deleteStaff(staffId) {
        const staff = store.getStaff().find(s => s.id === staffId);
        if (!staff) return;

        this.confirmAction(
            `Bạn có chắc chắn muốn xóa nhân viên <strong>${staff.name}</strong>? <br><small style="color:red">Hành động này không thể hoàn tác!</small>`,
            () => {
                store.deleteStaff(staffId);
                this.navigate('staff');
                this.showToast('Đã xóa nhân viên thành công!', 'success');
            }
        );
    }

    confirmAction(message, onConfirm) {
        const confirmRoot = document.createElement('div');
        confirmRoot.id = 'confirm-modal';
        document.body.appendChild(confirmRoot);
        
        confirmRoot.innerHTML = `
            <div class="modal-overlay active" style="z-index:2000;">
                <div class="modal-content" style="width:350px; text-align:center; padding:30px;">
                    <div style="font-size:48px; margin-bottom:15px;">❓</div>
                    <div style="font-size:16px; font-weight:600; margin-bottom:20px; color:#1e293b;">${message}</div>
                    <div style="display:flex; justify-content:center; gap:12px;">
                        <button class="btn-outline" onclick="document.getElementById('confirm-modal').remove()">Hủy bỏ</button>
                        <button class="btn-primary" id="confirm-yes-btn" style="background:#ef4444;">Đồng ý</button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('confirm-yes-btn').onclick = () => {
            onConfirm();
            confirmRoot.remove();
        };
    }

    openBookingDetailsModal(bookingId) {
        const booking = store.getBookings().find(b => b.id === bookingId);
        if (!booking) return;

        const room = store.getRooms().find(r => r.id === booking.room_id);
        const modalRoot = document.getElementById('modal-root');
        
        const render = () => {
            const amount_paid = booking.amount_paid || 0;
            const total = (Number(booking.unit_price) || 0) + (Number(booking.surcharge) || 0);
            const remaining = total - amount_paid;

            modalRoot.innerHTML = `
                <div class="modal-overlay active">
                    <div class="modal-content" style="width:550px;">
                        <div class="modal-header" style="background:${remaining > 0 ? '#f59e0b' : '#10b981'};">
                            <span>Chi tiết Đặt phòng - ${booking.guest_name}</span>
                            <button style="border:none; background:none; font-size:24px; cursor:pointer; color:#fff;" onclick="document.getElementById('modal-root').innerHTML=''">×</button>
                        </div>
                        <div class="modal-body" style="padding:25px;">
                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:20px;">
                                <div>
                                    <label style="font-size:11px; font-weight:800; color:#94a3b8; text-transform:uppercase;">Khách hàng</label>
                                    <div style="font-weight:700; font-size:16px;">${booking.guest_name}</div>
                                    <div style="color:#64748b; font-size:13px;">${booking.guest_phone}</div>
                                </div>
                                <div>
                                    <label style="font-size:11px; font-weight:800; color:#94a3b8; text-transform:uppercase;">Phòng</label>
                                    <div style="font-weight:700; font-size:16px;">${room?.name}</div>
                                    <div style="font-size:12px; color:${room?.status === 'clean' ? '#16a34a' : '#ef4444'}; font-weight:700;">
                                        Trạng thái: ${room?.status === 'clean' ? 'Đã dọn' : (room?.status === 'dirty' ? 'Bẩn' : 'Đang dọn')}
                                    </div>
                                </div>
                            </div>

                            <div style="background:#f8fafc; padding:15px; border-radius:12px; margin-bottom:20px; border:1px solid #e2e8f0;">
                                <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                                    <span style="color:#64748b; font-weight:600;">Tổng tiền:</span>
                                    <span style="font-weight:800; font-size:16px;">${total.toLocaleString()}đ</span>
                                </div>
                                <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                                    <span style="color:#64748b; font-weight:600;">Đã trả:</span>
                                    <span style="font-weight:800; color:#16a34a;">${amount_paid.toLocaleString()}đ</span>
                                </div>
                                <div style="display:flex; justify-content:space-between; padding-top:8px; border-top:1px solid #e2e8f0;">
                                    <span style="color:#64748b; font-weight:600;">Còn lại:</span>
                                    <span style="font-weight:900; color:${remaining > 0 ? '#ef4444' : '#16a34a'}; font-size:18px;">${remaining.toLocaleString()}đ</span>
                                </div>
                            </div>

                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:20px;">
                                ${booking.status === 'confirmed' || booking.status === 'deposited' ? `
                                    <button class="btn-primary" id="btn-checkin" style="background:#10b981;">Xác nhận Check-in</button>
                                    <button class="btn-outline" id="btn-noshow" style="color:#f59e0b; border-color:#f59e0b;">Báo No-show</button>
                                ` : ''}
                                
                                ${booking.status === 'checked_in' ? `
                                    <button class="btn-primary" id="btn-checkout" style="background:#6366f1;">Check-out & Trả phòng</button>
                                ` : ''}
                                
                                <button class="btn-outline" onclick="window.app.openBookingModal(null, '${booking.id}')">Sửa thông tin</button>
                                <button class="btn-outline" onclick="window.app.printReceipt('${booking.id}')">In phiếu thu</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Check-in logic
            const ciBtn = document.getElementById('btn-checkin');
            if (ciBtn) {
                ciBtn.onclick = () => {
                    if (room.status !== 'clean') {
                        alert('⚠️ Phòng chưa được dọn sạch! Vui lòng kiểm tra lại bộ phận buồng phòng.');
                        return;
                    }
                    store.updateBooking(booking.id, { status: 'checked_in', actual_check_in: new Date().toISOString() });
                    modalRoot.innerHTML = '';
                    this.navigate('timeline');
                };
            }

            // No-show logic
            const nsBtn = document.getElementById('btn-noshow');
            if (nsBtn) {
                nsBtn.onclick = () => {
                    if (confirm('Xác nhận khách không đến (No-show)? Phòng sẽ được giải phóng ngay lập tức.')) {
                        store.updateBooking(booking.id, { status: 'no_show' });
                        modalRoot.innerHTML = '';
                        this.navigate('timeline');
                    }
                };
            }

            // Check-out logic
            const coBtn = document.getElementById('btn-checkout');
            if (coBtn) {
                coBtn.onclick = () => {
                    if (remaining > 0) {
                        if (!confirm(`Khách vẫn còn nợ ${remaining.toLocaleString()}đ. Bạn có chắc chắn muốn Check-out?`)) return;
                    }
                    store.updateBooking(booking.id, { status: 'checked_out', actual_check_out: new Date().toISOString() });
                    store.updateRoomStatus(booking.room_id, 'dirty');
                    modalRoot.innerHTML = '';
                    this.navigate('timeline');
                };
            }
        };

        this.printReceipt = (bid) => {
            alert('Đang khởi tạo lệnh in Phiếu thu...');
            // Logic in thực tế sẽ được thêm sau
        };

        render();
    }

    updateCleaning(id, status) {
        store.updateCleaningAssignment(id, status);
        document.getElementById('modal-root').innerHTML = ''; // Close modal
        this.navigate('housekeeping');
    }
}

window.app = new App();
