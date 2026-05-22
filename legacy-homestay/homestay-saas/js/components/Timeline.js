import { store } from '../store.js';

export const Timeline = {
    currentStartDate: new Date(),
    currentEndDate: new Date(new Date().setDate(new Date().getDate() + 6)),
    DAYS_TO_RENDER: 7,
    DAY_WIDTH: 300,
    HOUR_WIDTH: 300 / 24, // 12.5px
    ROOM_COL_WIDTH: 200,
    ROW_HEIGHT: 45,

    filters: {
        search: '',
        property: 'Tất cả',
        status: 'Tất cả'
    },

    getOccupancyStatus(roomId) {
        const now = new Date().getTime();
        const bookings = store.getBookings().filter(b => b.room_id === roomId);
        const currentBooking = bookings.find(b => {
            const start = new Date(b.check_in).getTime();
            const end = new Date(b.check_out).getTime();
            return now >= start && now <= end && b.status === 'checked_in';
        });
        if (currentBooking) return { text: 'CÓ KHÁCH', color: '#ef4444', icon: '👤' };
        return { text: 'TRỐNG', color: '#10b981', icon: '🏠' };
    },

    getEffectiveStartDate() {
        const start = new Date(this.currentStartDate);
        start.setHours(0,0,0,0);
        return start;
    },

    calculatePos(isoStr) {
        if (!isoStr) return 0;
        try {
            const [datePart, timePart] = isoStr.split('T');
            const [y, m, d] = datePart.split('-').map(Number);
            const [hh, mm] = timePart.split(':').map(Number);
            const start = this.getEffectiveStartDate();
            const d1 = new Date(start.getFullYear(), start.getMonth(), start.getDate());
            const d2 = new Date(y, m - 1, d);
            const dayDiff = Math.round((d2 - d1) / (24 * 60 * 60 * 1000));
            return (dayDiff * this.DAY_WIDTH) + (hh * this.HOUR_WIDTH) + (mm * (this.HOUR_WIDTH / 60));
        } catch (e) { return 0; }
    },

    render() {
        const start = this.getEffectiveStartDate();
        return `
            <div class="dashboard-header">
                <div class="header-left">
                    <h1 class="header-title">Quản lý đặt phòng v2.0</h1>
                </div>
                <div class="header-actions">
                    <button class="btn-primary" onclick="window.app.openBookingModal()">+ Thêm đặt phòng</button>
                </div>
            </div>

            <div class="tl-filters">
                <div class="filter-card">
                    <label>Tìm kiếm:</label>
                    <input type="text" id="filter-search" placeholder="Tên, phòng, SĐT..." value="${this.filters.search}">
                </div>
                <div class="filter-card">
                    <label>Cơ sở:</label>
                    <select id="filter-property">
                        <option>Tất cả</option>
                        ${store.getProperties().map(p => `<option ${this.filters.property === p.name ? 'selected' : ''}>${p.name}</option>`).join('')}
                    </select>
                </div>
                <div class="filter-card">
                    <label>Từ ngày:</label>
                    <input type="date" id="filter-date-start" value="${this.currentStartDate.toISOString().split('T')[0]}">
                </div>
                <div class="filter-card">
                    <label>Đến ngày:</label>
                    <input type="date" id="filter-date-end" value="${this.currentEndDate.toISOString().split('T')[0]}">
                </div>
                <div class="filter-card">
                    <label>Trạng thái dọn:</label>
                    <select id="filter-status">
                        <option value="Tất cả">Tất cả</option>
                        <option value="clean" ${this.filters.status === 'clean' ? 'selected' : ''}>Sạch</option>
                        <option value="dirty" ${this.filters.status === 'dirty' ? 'selected' : ''}>Bẩn</option>
                        <option value="cleaning" ${this.filters.status === 'cleaning' ? 'selected' : ''}>Đang dọn</option>
                    </select>
                </div>
            </div>

            <div class="nav-controls">
                <button class="nav-btn" id="btn-prev-week">‹ Tuần trước</button>
                <div class="date-range-display" id="btn-go-today">${this.getDateRangeText()}</div>
                <button class="nav-btn" id="btn-next-week">Tuần sau ›</button>
            </div>
            
            <div class="timeline-wrapper">
                <div style="width: ${this.ROOM_COL_WIDTH + this.DAY_WIDTH * this.DAYS_TO_RENDER}px;">
                    <div class="tl-header">
                        <div class="tl-room-col-header" style="width:${this.ROOM_COL_WIDTH}px;">Phòng | Trạng thái</div>
                        <div style="display: flex;">${this.renderDaysHeader()}</div>
                    </div>
                <div class="tl-body" style="width: ${this.ROOM_COL_WIDTH + this.DAY_WIDTH * this.DAYS_TO_RENDER}px;">
                    <div class="tl-rows-container">
                        ${this.renderRows()}
                        <div class="tl-grid-bg" style="left: ${this.ROOM_COL_WIDTH}px; width: ${this.DAY_WIDTH * this.DAYS_TO_RENDER}px;">
                            ${this.renderGridBg()}
                        </div>
                    </div>
                    <div class="tl-bookings" style="left: ${this.ROOM_COL_WIDTH}px; width: ${this.DAY_WIDTH * this.DAYS_TO_RENDER}px;">
                        ${this.renderBookings()}
                    </div>
                        <div class="current-time-line" id="current-time-line" style="display: none; left:${this.ROOM_COL_WIDTH}px;">
                            <div class="current-time-indicator"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    getDateRangeText() {
        const start = this.getEffectiveStartDate();
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        const fmt = d => `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`;
        return `${fmt(start)} - ${fmt(end)}`;
    },

    renderDaysHeader() {
        const start = this.getEffectiveStartDate();
        const daysOfWeek = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        let html = '';
        for(let i=0; i<this.DAYS_TO_RENDER; i++) {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            let hoursHTML = '';
            for(let h=0; h<24; h+=2) {
                hoursHTML += `<div class="tl-hour" style="width:25px; text-align:center;">${h.toString().padStart(2,'0')}</div>`;
            }
            html += `
                <div class="tl-day" style="width:${this.DAY_WIDTH}px; border-right: 1.5px solid #10b981; box-sizing: border-box; background:#fff;">
                    <div class="tl-day-label" style="padding:8px 0; text-align:center; color:#10b981;">${daysOfWeek[d.getDay()]} - ${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}</div>
                    <div style="display:flex; height:20px; align-items:center; background:#f0fdf4; border-bottom:1px solid #dcfce7;">${hoursHTML}</div>
                </div>
            `;
        }
        return html;
    },

    renderGridBg() {
        let html = '';
        for(let i=0; i<this.DAYS_TO_RENDER; i++) {
            let hourLines = '';
            for(let h=0; h<24; h+=2) {
                hourLines += `<div class="tl-hour-line" style="width:25px;"></div>`;
            }
            html += `<div class="tl-bg-day" style="width:${this.DAY_WIDTH}px;">${hourLines}</div>`;
        }
        return html;
    },

    renderRows() {
        const properties = store.getProperties();
        const rooms = store.getRooms();
        let html = '';
        let rowIndex = 0;
        this.roomIndexMap = {};

        properties.forEach(prop => {
            if (this.filters.property !== 'Tất cả' && prop.name !== this.filters.property) return;
            html += `
                <div class="tl-row" style="height:40px; background:#e0f2fe; border-bottom:1px solid #bae6fd;">
                    <div class="tl-room-info" style="position:sticky; left:0; z-index:95; width:${this.ROOM_COL_WIDTH}px; background:#e0f2fe; color:#0369a1; font-weight:600; padding-left:12px; border-right:1px solid #bae6fd;">${prop.name}</div>
                    <div class="row-grid-cells"></div>
                </div>
            `;
            rowIndex++;
            const propRooms = rooms.filter(r => r.property_id === prop.id);
            propRooms.forEach(room => {
                const matchSearch = room.name.toLowerCase().includes(this.filters.search.toLowerCase());
                const matchStatus = this.filters.status === 'Tất cả' || room.status === this.filters.status;
                if (!matchSearch || !matchStatus) return;
                this.roomIndexMap[room.id] = rowIndex;
                const occ = this.getOccupancyStatus(room.id);
                const sColor = room.status === 'clean' ? '#f0fdf4' : (room.status === 'dirty' ? '#fef2f2' : '#fffbeb');
                const tColor = room.status === 'clean' ? '#16a34a' : (room.status === 'dirty' ? '#ef4444' : '#d97706');
                const sText = room.status === 'clean' ? 'ĐÃ DỌN' : (room.status === 'dirty' ? 'BẨN' : 'ĐANG DỌN');
                html += `
                    <div class="tl-row" style="height:${this.ROW_HEIGHT}px; border-bottom: 1px solid #f1f5f9;">
                        <div class="tl-room-info" style="position:sticky; left:0; z-index:90; width:${this.ROOM_COL_WIDTH}px; display:grid; grid-template-columns: 80px 1fr; background:white; border-right:1px solid #e2e8f0; padding:0;">
                            <div style="display:flex; align-items:center; justify-content:center; border-right:1px solid #f1f5f9; font-weight:700;">${room.name}</div>
                            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; cursor:pointer;" onclick="window.app.openStatusModal('${room.id}')">
                                <div style="font-size:9px; font-weight:800; color:${occ.color};">${occ.icon} ${occ.text}</div>
                                <div style="font-size:9px; font-weight:700; color:${tColor}; background:${sColor}; padding:1px 6px; border-radius:10px;">${sText}</div>
                            </div>
                        </div>
                        <div class="row-grid-cells">${this.renderClickableCells(room.id)}</div>
                    </div>
                `;
                rowIndex++;
            });
        });
        return html;
    },

    renderClickableCells(roomId) {
        let html = '';
        const start = this.getEffectiveStartDate();
        for (let d = 0; d < this.DAYS_TO_RENDER; d++) {
            for (let h = 0; h < 24; h += 2) {
                const time = new Date(start);
                time.setDate(time.getDate() + d);
                time.setHours(h, 0, 0, 0);
                html += `<div class="clickable-cell" style="width:25px;" data-room="${roomId}" data-time="${time.getTime()}"></div>`;
            }
        }
        return html;
    },

    renderBookings() {
        const bookings = store.getBookings();
        const allStaff = store.getStaff();
        let html = '';
        const now = new Date().getTime();

        bookings.forEach(b => {
            const rIdx = this.roomIndexMap[b.room_id];
            if (rIdx === undefined) return;
            
            const leftPx = this.calculatePos(b.check_in);
            const endPx = this.calculatePos(b.check_out);
            const widthPx = endPx - leftPx;
            
            if (leftPx + widthPx < 0 || leftPx > this.DAYS_TO_RENDER * this.DAY_WIDTH) return;

            // V2 Status Colors
            const statusColors = {
                confirmed: '#94A3B8',
                deposited: '#3B82F6',
                checked_in: '#10B981',
                checked_out: '#6B7280',
                cancelled: '#E2E8F0',
                no_show: '#F59E0B'
            };

            const staff = allStaff.find(s => s.id === b.staffId);
            const bgColor = staff ? staff.color : (statusColors[b.status] || '#4F46E5');
            const dotClass = b.amount_remaining <= 0 ? 'success' : (b.amount_paid > 0 ? 'warning' : 'danger');

            // Late Check-out Blinking Class
            const checkOutTime = new Date(b.check_out).getTime();
            const isLate = now > checkOutTime && b.status === 'checked_in';
            const blinkingClass = isLate ? 'blinking-late' : '';

            const inTime = b.check_in.split('T')[1].substring(0, 5);
            const outTime = b.check_out.split('T')[1].substring(0, 5);

            html += `
                <div class="booking-pill ${blinkingClass}" 
                     style="top: ${rIdx * this.ROW_HEIGHT + 16}px; left: ${leftPx}px; width: ${widthPx}px; background-color: ${bgColor};" 
                     onclick="window.app.openBookingDetailsModal('${b.id}')"
                     data-id="${b.id}">
                    <span class="booking-time">${inTime}</span>
                    <span class="booking-name">${b.customerName || b.guest_name}</span>
                    <span class="booking-time">${outTime}</span>
                    <div class="b-dot ${dotClass}" style="position:absolute; right:-2px; top:-2px; border:1.5px solid white;"></div>
                </div>
            `;
        });
        return html;
    },

    init() {
        document.getElementById('btn-prev-week').onclick = () => { 
            const days = this.DAYS_TO_RENDER;
            this.currentStartDate.setDate(this.currentStartDate.getDate() - days); 
            this.currentEndDate.setDate(this.currentEndDate.getDate() - days);
            this.refresh(); 
        };
        document.getElementById('btn-next-week').onclick = () => { 
            const days = this.DAYS_TO_RENDER;
            this.currentStartDate.setDate(this.currentStartDate.getDate() + days); 
            this.currentEndDate.setDate(this.currentEndDate.getDate() + days);
            this.refresh(); 
        };
        document.getElementById('btn-go-today').onclick = () => { 
            this.currentStartDate = new Date(); 
            this.currentEndDate = new Date(new Date().setDate(new Date().getDate() + 6));
            this.updateDaysToRender();
            this.refresh(); 
        };
        document.getElementById('filter-search').oninput = (e) => { this.filters.search = e.target.value; this.refresh(); };
        document.getElementById('filter-property').onchange = (e) => { this.filters.property = e.target.value; this.refresh(); };
        document.getElementById('filter-status').onchange = (e) => { this.filters.status = e.target.value; this.refresh(); };
        document.getElementById('filter-date-start').onchange = (e) => { 
            this.currentStartDate = new Date(e.target.value); 
            this.updateDaysToRender();
            this.refresh(); 
        };
        document.getElementById('filter-date-end').onchange = (e) => { 
            this.currentEndDate = new Date(e.target.value); 
            this.updateDaysToRender();
            this.refresh(); 
        };
        document.getElementById('btn-add-booking').onclick = () => window.app.openBookingModal();
        document.querySelectorAll('.booking-pill').forEach(pill => {
            pill.onclick = (e) => { e.stopPropagation(); window.app.openBookingModal(null, pill.dataset.id); }
        });
        document.querySelectorAll('.clickable-cell').forEach(cell => {
            cell.onclick = () => window.app.openBookingModal(cell.dataset.room, null, cell.dataset.time);
        });
        this.updateTimeLine();
        if (this.timer) clearInterval(this.timer);
        this.timer = setInterval(() => this.updateTimeLine(), 60000);
    },

    updateTimeLine() {
        const line = document.getElementById('current-time-line');
        if (!line) return;
        const now = new Date();
        const start = this.getEffectiveStartDate();
        const left = this.calculatePos(now.toISOString().substring(0, 16));
        const endPx = this.DAYS_TO_RENDER * this.DAY_WIDTH;
        if (left >= 0 && left <= endPx) {
            line.style.display = 'block';
            line.style.left = left + 'px';
        } else {
            line.style.display = 'none';
        }
    },

    updateDaysToRender() {
        const diffTime = Math.abs(this.currentEndDate - this.currentStartDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        this.DAYS_TO_RENDER = diffDays > 0 ? diffDays : 1;
    },

    refresh() {
        const container = document.getElementById('view-container');
        if (container) { container.innerHTML = this.render(); this.init(); }
    }
};
