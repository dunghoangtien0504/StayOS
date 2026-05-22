import os

html_content = """<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hotel Manager Dashboard</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --sidebar-bg: #2b6cb0;
            --sidebar-active: #3182ce;
            --sidebar-hover: #2c5282;
            --bg-color: #f7fafc;
            --surface-color: #ffffff;
            --border-color: #e2e8f0;
            --text-primary: #1a202c;
            --text-secondary: #718096;
            --accent-primary: #3182ce;
            
            --success: #38a169;
            --warning: #d69e2e;
            --danger: #e53e3e;
            --purple: #805ad5;
            --pink: #d53f8c;
            --teal: #319795;
            
            --sidebar-width: 240px;
            --room-col-width: 180px;
            --day-width: 240px; /* 24 hours * 10px */
            --hour-width: 10px;
            --row-height: 40px;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', sans-serif; }
        body { display: flex; height: 100vh; overflow: hidden; background: var(--bg-color); color: var(--text-primary); }

        /* Sidebar */
        .sidebar { width: var(--sidebar-width); background: var(--sidebar-bg); color: white; display: flex; flex-direction: column; z-index: 100; }
        .sidebar-header { height: 60px; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; font-weight: 700; font-size: 1.1rem; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .sidebar-header svg { width: 24px; height: 24px; fill: white; cursor: pointer; }
        .sync-btn { margin: 15px; padding: 8px; text-align: center; font-size: 0.85rem; border: 1px solid rgba(255,255,255,0.3); border-radius: 4px; cursor: pointer; transition: 0.2s; }
        .sync-btn:hover { background: rgba(255,255,255,0.1); }
        .nav-menu { flex: 1; overflow-y: auto; padding-top: 10px; }
        .nav-item { display: flex; align-items: center; gap: 12px; padding: 12px 20px; color: rgba(255,255,255,0.8); text-decoration: none; font-size: 0.95rem; cursor: pointer; transition: 0.2s; }
        .nav-item:hover { background: var(--sidebar-hover); color: white; }
        .nav-item.active { background: var(--sidebar-active); color: white; border-left: 4px solid white; padding-left: 16px; }
        .nav-item svg { width: 20px; height: 20px; fill: currentColor; }
        .sidebar-footer { padding: 15px 0; border-top: 1px solid rgba(255,255,255,0.1); }
        .logout { color: #feb2b2; }

        /* Main Content */
        .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

        /* Top Header */
        .top-header { display: flex; align-items: center; justify-content: space-between; padding: 15px 24px; background: var(--surface-color); border-bottom: 1px solid var(--border-color); }
        .top-title { display: flex; align-items: center; gap: 8px; font-size: 1.25rem; font-weight: 600; }
        .top-title svg { width: 24px; height: 24px; fill: var(--accent-primary); }
        .top-actions { display: flex; gap: 12px; align-items: center; }
        .view-toggles { display: flex; background: #edf2f7; border-radius: 6px; padding: 3px; }
        .view-btn { padding: 6px 12px; font-size: 0.85rem; border: none; background: none; border-radius: 4px; cursor: pointer; color: var(--text-secondary); font-weight: 500; }
        .view-btn.active { background: var(--accent-primary); color: white; }
        .btn-add { background: var(--accent-primary); color: white; padding: 8px 16px; border-radius: 6px; border: none; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 0.9rem; }
        .btn-add:hover { background: #2b6cb0; }

        /* Filters Bar */
        .filters-bar { display: flex; gap: 16px; padding: 15px 24px; background: var(--surface-color); border-bottom: 1px solid var(--border-color); align-items: flex-end; }
        .filter-group { display: flex; flex-direction: column; gap: 6px; flex: 1; }
        .filter-group label { font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; }
        .filter-input { padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 0.85rem; outline: none; }
        .filter-input:focus { border-color: var(--accent-primary); }

        /* Timeline Navigation */
        .timeline-nav { display: flex; justify-content: center; align-items: center; padding: 10px 0; background: var(--surface-color); border-bottom: 1px solid var(--border-color); }
        .nav-pill { display: flex; align-items: center; border-radius: 20px; overflow: hidden; border: 1px solid var(--border-color); }
        .nav-arrow { background: #718096; color: white; border: none; padding: 6px 12px; cursor: pointer; font-size: 0.8rem; font-weight: 600; }
        .nav-arrow:hover { background: #4a5568; }
        .nav-date-range { padding: 6px 16px; font-size: 0.9rem; font-weight: 600; background: white; cursor: pointer; }

        /* Timeline Grid */
        .timeline-container { flex: 1; overflow: auto; background: var(--bg-color); position: relative; padding: 16px; }
        .timeline-wrapper { background: white; border: 1px solid var(--border-color); border-radius: 8px; min-width: max-content; display: inline-flex; flex-direction: column; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        
        .tl-header { display: flex; position: sticky; top: 0; background: white; z-index: 10; border-bottom: 1px solid var(--border-color); }
        .tl-room-col-header { width: var(--room-col-width); min-width: var(--room-col-width); padding: 10px 16px; font-weight: 600; font-size: 0.9rem; border-right: 1px solid var(--border-color); position: sticky; left: 0; background: white; z-index: 11; display: flex; align-items: flex-end; }
        .tl-days-row { display: flex; }
        .tl-day-col { width: var(--day-width); min-width: var(--day-width); border-right: 1px solid var(--border-color); display: flex; flex-direction: column; }
        .tl-day-name { text-align: center; padding: 6px 0; font-weight: 600; font-size: 0.85rem; border-bottom: 1px solid var(--border-color); }
        .tl-hours-row { display: flex; height: 20px; }
        .tl-hour { flex: 1; font-size: 0.6rem; color: #a0aec0; text-align: center; line-height: 20px; border-right: 1px solid #f7fafc; }
        
        .tl-body { position: relative; }
        .tl-facility-row { background: #ebf8ff; color: #2b6cb0; font-weight: 600; font-size: 0.85rem; padding: 8px 16px; border-bottom: 1px solid var(--border-color); position: sticky; left: 0; z-index: 5; display: flex; align-items: center; gap: 8px; }
        
        .tl-row { display: flex; height: var(--row-height); border-bottom: 1px solid var(--border-color); }
        .tl-room-info { width: var(--room-col-width); min-width: var(--room-col-width); padding: 0 16px; display: flex; align-items: center; gap: 8px; border-right: 1px solid var(--border-color); position: sticky; left: 0; background: white; z-index: 4; }
        .tl-room-name { font-weight: 600; font-size: 0.85rem; }
        .room-badge { font-size: 0.65rem; padding: 2px 6px; border-radius: 12px; font-weight: 600; }
        .badge-clean { background: #c6f6d5; color: #22543d; }
        .badge-dirty { background: #fed7d7; color: #742a2a; }
        .badge-cleaning { background: #fefcbf; color: #744210; }

        .tl-grid-bg { display: flex; position: absolute; left: var(--room-col-width); top: 0; height: 100%; pointer-events: none; z-index: 1; }
        .tl-day-bg { width: var(--day-width); border-right: 1px solid var(--border-color); display: flex; }
        /* Create hourly grid lines using background gradient */
        .tl-day-bg-inner { width: 100%; background-image: linear-gradient(to right, transparent 9px, #edf2f7 10px); background-size: 20px 100%; /* 2-hour intervals */ }
        
        .tl-bookings-container { position: absolute; left: var(--room-col-width); top: 0; height: 100%; pointer-events: none; z-index: 2; width: calc(100% - var(--room-col-width)); }
        
        /* Time Line Indicator */
        .current-time-line { position: absolute; top: 0; width: 2px; height: 100%; background: red; z-index: 3; }
        .current-time-indicator { position: absolute; top: -5px; left: -4px; width: 10px; height: 10px; background: red; border-radius: 50%; }

        /* Booking Blocks */
        .booking-block { position: absolute; height: 26px; margin-top: 7px; border-radius: 13px; font-size: 0.75rem; font-weight: 600; display: flex; align-items: center; padding: 0 10px; color: white; cursor: pointer; pointer-events: auto; white-space: nowrap; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.1); transition: transform 0.1s; }
        .booking-block:hover { transform: scale(1.02); z-index: 10; }
        .b-dot { width: 8px; height: 8px; border-radius: 50%; background: white; margin-right: 6px; box-shadow: 0 0 2px rgba(0,0,0,0.3); }
        .b-dot.green { background: #48bb78; }
        .b-dot.red { background: #f56565; }
        .b-text { overflow: hidden; text-overflow: ellipsis; }

        /* Tooltip */
        .tooltip { visibility: hidden; position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%); background: #2d3748; color: white; text-align: left; padding: 8px 12px; border-radius: 6px; margin-bottom: 5px; z-index: 100; font-size: 0.75rem; font-weight: normal; width: 250px; line-height: 1.4; box-shadow: 0 4px 6px rgba(0,0,0,0.1); white-space: normal; pointer-events: none; opacity: 0; transition: opacity 0.2s; }
        .tooltip::after { content: ""; position: absolute; top: 100%; left: 50%; margin-left: -5px; border-width: 5px; border-style: solid; border-color: #2d3748 transparent transparent transparent; }
        .booking-block:hover .tooltip { visibility: visible; opacity: 1; }
        .tooltip strong { color: #a0aec0; }

        /* Modals (Re-used basic styling) */
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: none; align-items: center; justify-content: center; z-index: 200; }
        .modal-overlay.active { display: flex; }
        .modal { background: white; width: 500px; border-radius: 12px; padding: 24px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; font-size: 1.25rem; font-weight: 700; }
        .close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #a0aec0; }
        .close-btn:hover { color: #4a5568; }
        .form-group { margin-bottom: 15px; }
        .form-row { display: flex; gap: 15px; }
        .form-row > * { flex: 1; }
        label { display: block; font-size: 0.8rem; font-weight: 600; color: #4a5568; margin-bottom: 5px; }
        input, select { width: 100%; padding: 8px 12px; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 0.9rem; outline: none; }
        input:focus, select:focus { border-color: var(--accent-primary); box-shadow: 0 0 0 1px var(--accent-primary); }
        .modal-footer { margin-top: 24px; display: flex; justify-content: flex-end; gap: 10px; }
        .btn-outline { padding: 8px 16px; border: 1px solid #cbd5e0; background: white; border-radius: 6px; cursor: pointer; font-weight: 600; }
        .btn-outline:hover { background: #f7fafc; }
        .btn-danger { padding: 8px 16px; border: none; background: #e53e3e; color: white; border-radius: 6px; cursor: pointer; font-weight: 600; }
        
        .clickable-cell { flex: 1; cursor: pointer; }
        .clickable-cell:hover { background: rgba(49, 130, 206, 0.05); }

    </style>
</head>
<body>
    <!-- Sidebar -->
    <aside class="sidebar">
        <div class="sidebar-header">
            <span>🏨 Hotel Manager</span>
            <svg viewBox="0 0 24 24"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>
        </div>
        <div class="sync-btn">
            <svg style="width:14px; height:14px; vertical-align:middle; fill:currentColor" viewBox="0 0 24 24"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>
            Cập nhật dữ liệu
        </div>
        <nav class="nav-menu">
            <a class="nav-item"><svg viewBox="0 0 24 24"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg> Dashboard</a>
            <a class="nav-item active"><svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V9h14v10zm0-12H5V5h14v2zm-7 4H7v2h5v-2zm0 4H7v2h5v-2z"/></svg> Đặt phòng</a>
            <a class="nav-item"><svg viewBox="0 0 24 24"><path d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z"/></svg> Phòng</a>
            <a class="nav-item"><svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg> Nhân viên</a>
            <a class="nav-item"><svg viewBox="0 0 24 24"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg> Chi phí</a>
            <a class="nav-item"><svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg> Báo cáo</a>
            <a class="nav-item"><svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .43-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.49-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg> Cài đặt</a>
        </nav>
        <div class="sidebar-footer">
            <a class="nav-item"><svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg> Admin</a>
            <a class="nav-item logout"><svg viewBox="0 0 24 24"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg> Đăng xuất</a>
        </div>
    </aside>

    <!-- Main -->
    <main class="main">
        <header class="top-header">
            <div class="top-title">
                <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V9h14v10zm0-12H5V5h14v2zm-7 4H7v2h5v-2zm0 4H7v2h5v-2z"/></svg>
                Quản lý đặt phòng
            </div>
            <div class="top-actions">
                <div class="view-toggles">
                    <button class="view-btn active">Timeline</button>
                    <button class="view-btn">Table</button>
                </div>
                <button class="btn-add" onclick="openAddModal()">+ Thêm đặt phòng</button>
            </div>
        </header>

        <div class="filters-bar">
            <div class="filter-group" style="flex: 2">
                <label>Tìm kiếm:</label>
                <input type="text" class="filter-input" placeholder="Tìm tên, số điện thoại, phòng, ID...">
            </div>
            <div class="filter-group">
                <label>Cơ sở:</label>
                <select class="filter-input">
                    <option>Tất cả</option>
                    <option>15 Trung Liệt</option>
                    <option>11 Mỹ Đình</option>
                    <option>25 Quan Hoa</option>
                </select>
            </div>
            <div class="filter-group">
                <label>Từ ngày:</label>
                <input type="date" class="filter-input">
            </div>
            <div class="filter-group">
                <label>Đến ngày:</label>
                <input type="date" class="filter-input">
            </div>
            <div class="filter-group">
                <label>Trạng thái đơn:</label>
                <select class="filter-input">
                    <option>Tất cả</option>
                    <option>Đã xác nhận</option>
                    <option>Đang xử lý</option>
                </select>
            </div>
        </div>

        <div class="timeline-nav">
            <div class="nav-pill">
                <button class="nav-arrow" onclick="moveDate(-7)">&lt; Tuần trước</button>
                <div class="nav-date-range" id="nav-date-display" onclick="goToToday()">29/9/2025 - 5/10/2025</div>
                <button class="nav-arrow" onclick="moveDate(7)">Tuần sau &gt;</button>
            </div>
        </div>

        <div class="timeline-container" id="tl-container">
            <div class="timeline-wrapper">
                <div class="tl-header">
                    <div class="tl-room-col-header">Phòng</div>
                    <div class="tl-days-row" id="tl-days-header">
                        <!-- Dates generated here -->
                    </div>
                </div>
                
                <div class="tl-body" id="tl-body">
                    <!-- Background Grid -->
                    <div class="tl-grid-bg" id="tl-grid-bg">
                        <!-- Grid generated here -->
                    </div>
                    
                    <!-- Rows & Bookings -->
                    <div id="tl-rows-container">
                        <!-- Rows generated here -->
                    </div>
                    
                    <div class="tl-bookings-container" id="tl-bookings">
                        <!-- Bookings generated here -->
                    </div>
                    
                    <!-- Current Time Line -->
                    <div class="current-time-line" id="current-time-line" style="display: none;">
                        <div class="current-time-indicator"></div>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <!-- Modal Form -->
    <div class="modal-overlay" id="bookingModal">
        <div class="modal">
            <div class="modal-header">
                <span id="modal-title">Thêm Đặt Phòng</span>
                <button class="close-btn" onclick="closeModal('bookingModal')">&times;</button>
            </div>
            <form id="bookingForm">
                <input type="hidden" id="b-id">
                <div class="form-group">
                    <label>Khách hàng</label>
                    <input type="text" id="b-guest" required placeholder="Tên khách hàng">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Số điện thoại</label>
                        <input type="tel" id="b-phone" placeholder="SĐT">
                    </div>
                    <div class="form-group">
                        <label>Cơ sở</label>
                        <select id="b-facility" onchange="updateRoomOptions()">
                            <option value="15 Trung Liệt">15 Trung Liệt</option>
                            <option value="11 Mỹ Đình">11 Mỹ Đình</option>
                            <option value="25 Quan Hoa">25 Quan Hoa</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Phòng</label>
                    <select id="b-room"></select>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Check-in</label>
                        <input type="datetime-local" id="b-checkin" required>
                    </div>
                    <div class="form-group">
                        <label>Check-out</label>
                        <input type="datetime-local" id="b-checkout" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Nguồn đặt</label>
                        <select id="b-source">
                            <option value="Direct">Trực tiếp</option>
                            <option value="Booking.com">Booking.com</option>
                            <option value="Agoda">Agoda</option>
                            <option value="Facebook">Facebook</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Trạng thái thanh toán</label>
                        <select id="b-status">
                            <option value="unpaid">Chưa thanh toán</option>
                            <option value="deposit">Đã cọc</option>
                            <option value="paid">Đã thanh toán đủ</option>
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-danger" id="btn-delete" style="display:none" onclick="deleteBooking()">Xóa</button>
                    <div style="flex:1"></div>
                    <button type="button" class="btn-outline" onclick="closeModal('bookingModal')">Hủy</button>
                    <button type="submit" class="btn-add" style="border-radius:6px">Lưu</button>
                </div>
            </form>
        </div>
    </div>

    <script>
        // --- Data & State ---
        let currentStartDate = new Date();
        currentStartDate.setHours(0,0,0,0);
        // adjust to Monday
        const day = currentStartDate.getDay();
        const diff = currentStartDate.getDate() - day + (day === 0 ? -6 : 1);
        currentStartDate.setDate(diff);
        
        const DAYS_TO_RENDER = 7; // Show 1 week

        const defaultRooms = [
            { id: 'r1', facility: '15 Trung Liệt', name: 'P101', status: 'bẩn' },
            { id: 'r2', facility: '15 Trung Liệt', name: 'P102', status: 'đang dọn' },
            { id: 'r3', facility: '15 Trung Liệt', name: 'P103', status: 'đang dọn' },
            { id: 'r4', facility: '15 Trung Liệt', name: 'P201', status: 'đang dọn' },
            { id: 'r5', facility: '15 Trung Liệt', name: 'P202', status: 'đã dọn' },
            { id: 'r6', facility: '11 Mỹ Đình', name: 'P201', status: 'đã dọn' },
            { id: 'r7', facility: '11 Mỹ Đình', name: 'P202', status: 'bẩn' },
            { id: 'r8', facility: '11 Mỹ Đình', name: 'P301', status: 'đã dọn' },
            { id: 'r9', facility: '25 Quan Hoa', name: 'P201', status: 'đã dọn' },
            { id: 'r10', facility: '25 Quan Hoa', name: 'P202', status: 'đang dọn' }
        ];

        const sourceColors = {
            'Direct': '#38a169',
            'Booking.com': '#3182ce',
            'Agoda': '#805ad5',
            'Facebook': '#d53f8c'
        };

        function getRooms() {
            return defaultRooms; // Static for demo
        }

        function getBookings() {
            const b = localStorage.getItem('hm_bookings');
            return b ? JSON.parse(b) : [];
        }

        function saveBookings(bookings) {
            localStorage.setItem('hm_bookings', JSON.stringify(bookings));
        }

        function initMockData() {
            if(!localStorage.getItem('hm_bookings')) {
                const today = new Date();
                today.setHours(14,0,0,0);
                
                const t1 = new Date(today); t1.setHours(14,0);
                const t2 = new Date(today); t2.setDate(t2.getDate() + 1); t2.setHours(12,0);
                
                const t3 = new Date(today); t3.setDate(t3.getDate() + 1); t3.setHours(14,0);
                const t4 = new Date(today); t4.setDate(t4.getDate() + 3); t4.setHours(10,0);
                
                const t5 = new Date(today); t5.setDate(t5.getDate() - 1); t5.setHours(10,0);
                const t6 = new Date(today); t6.setDate(t6.getDate() + 1); t6.setHours(11,0);

                const mockBookings = [
                    { id: 'b1', roomId: 'r1', guest: 'Ngô Tuấn Khang', phone: '090111', source: 'Direct', checkIn: t1.toISOString(), checkOut: t2.toISOString(), status: 'paid' },
                    { id: 'b2', roomId: 'r2', guest: 'Mạnh Cường', phone: '090222', source: 'Booking.com', checkIn: t5.toISOString(), checkOut: t1.toISOString(), status: 'deposit' },
                    { id: 'b3', roomId: 'r1', guest: 'Mạnh Hường', phone: '090333', source: 'Agoda', checkIn: t3.toISOString(), checkOut: t4.toISOString(), status: 'unpaid' },
                    { id: 'b4', roomId: 'r7', guest: 'Hải Long', phone: '090444', source: 'Facebook', checkIn: t1.toISOString(), checkOut: t4.toISOString(), status: 'paid' }
                ];
                saveBookings(mockBookings);
            }
        }

        // --- Core Functions ---
        function parseISO(str) { return new Date(str); }
        function toLocalISOString(date) {
            const pad = n => n < 10 ? '0'+n : n;
            return date.getFullYear() + '-' + pad(date.getMonth()+1) + '-' + pad(date.getDate()) + 'T' + pad(date.getHours()) + ':' + pad(date.getMinutes());
        }

        function moveDate(offset) {
            currentStartDate.setDate(currentStartDate.getDate() + offset);
            renderTimeline();
        }

        function goToToday() {
            currentStartDate = new Date();
            currentStartDate.setHours(0,0,0,0);
            const day = currentStartDate.getDay();
            const diff = currentStartDate.getDate() - day + (day === 0 ? -6 : 1);
            currentStartDate.setDate(diff);
            renderTimeline();
        }

        function updateDateNav() {
            const end = new Date(currentStartDate);
            end.setDate(end.getDate() + DAYS_TO_RENDER - 1);
            const fmt = d => `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
            document.getElementById('nav-date-display').textContent = `${fmt(currentStartDate)} - ${fmt(end)}`;
        }

        function getStatusBadge(status) {
            let cl = 'badge-clean';
            if (status === 'bẩn') cl = 'badge-dirty';
            if (status === 'đang dọn') cl = 'badge-cleaning';
            return `<span class="room-badge ${cl}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>`;
        }

        function renderTimeline() {
            updateDateNav();
            const rooms = getRooms();
            const groupedRooms = {};
            rooms.forEach(r => {
                if(!groupedRooms[r.facility]) groupedRooms[r.facility] = [];
                groupedRooms[r.facility].push(r);
            });

            // 1. Render Headers & Grid BG
            let daysHTML = '';
            let gridBgHTML = '';
            const daysOfWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
            
            // Generate hours row content (every 2 hours)
            let hoursHTML = '';
            for(let h=0; h<24; h+=2) {
                hoursHTML += `<div class="tl-hour">${h.toString().padStart(2,'0')}</div>`;
            }

            for(let i=0; i<DAYS_TO_RENDER; i++) {
                const d = new Date(currentStartDate);
                d.setDate(d.getDate() + i);
                const isToday = (d.toDateString() === new Date().toDateString());
                
                daysHTML += `
                    <div class="tl-day-col" style="${isToday ? 'background: #fff5f5;' : ''}">
                        <div class="tl-day-name ${isToday ? 'logout' : ''}">${daysOfWeek[d.getDay()]} - ${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}</div>
                        <div class="tl-hours-row">${hoursHTML}</div>
                    </div>
                `;
                
                gridBgHTML += `
                    <div class="tl-day-bg" style="${isToday ? 'background: rgba(254,215,215,0.2);' : ''}">
                        <div class="tl-day-bg-inner"></div>
                    </div>
                `;
            }
            document.getElementById('tl-days-header').innerHTML = daysHTML;
            document.getElementById('tl-grid-bg').innerHTML = gridBgHTML;

            // 2. Render Rows
            let rowsHTML = '';
            let rowIndex = 0;
            const roomIndexMap = {}; // map roomId to cumulative Y position
            
            for (const [facility, fRooms] of Object.entries(groupedRooms)) {
                // Facility header row
                rowsHTML += `
                    <div class="tl-facility-row">
                        <svg viewBox="0 0 24 24" style="width:16px; fill:currentColor"><path d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z"/></svg>
                        ${facility}
                    </div>
                `;
                rowIndex++; // Facility row takes space
                
                fRooms.forEach(room => {
                    roomIndexMap[room.id] = rowIndex;
                    rowsHTML += `
                        <div class="tl-row" data-room="${room.id}">
                            <div class="tl-room-info">
                                <div class="tl-room-name">${room.name}</div>
                                ${getStatusBadge(room.status)}
                            </div>
                            <div class="clickable-cell" onclick="cellClicked('${room.id}', '${facility}')"></div>
                        </div>
                    `;
                    rowIndex++;
                });
            }
            document.getElementById('tl-rows-container').innerHTML = rowsHTML;

            // 3. Render Bookings
            renderBookings(roomIndexMap);
            
            // 4. Update Current Time Line
            updateCurrentTimeLine();
        }

        function renderBookings(roomIndexMap) {
            const container = document.getElementById('tl-bookings');
            const bookings = getBookings();
            let html = '';
            
            const startMs = currentStartDate.getTime();
            const endMs = startMs + (DAYS_TO_RENDER * 24 * 60 * 60 * 1000);
            const ROW_HEIGHT = 40; // var(--row-height)

            bookings.forEach(b => {
                const rIdx = roomIndexMap[b.roomId];
                if (rIdx === undefined) return;
                
                const inMs = parseISO(b.checkIn).getTime();
                const outMs = parseISO(b.checkOut).getTime();
                
                if (outMs <= startMs || inMs >= endMs) return; // Out of view
                
                // Calculate positions. 240px = 24h = 86400000ms. -> 10px per hour
                const msToPx = 240 / (24 * 60 * 60 * 1000);
                
                let leftPx = (inMs - startMs) * msToPx;
                let widthPx = (outMs - inMs) * msToPx;
                
                let actualLeft = leftPx;
                if (leftPx < 0) {
                    widthPx += leftPx; // reduce width
                    actualLeft = 0;
                }
                if (actualLeft + widthPx > DAYS_TO_RENDER * 240) {
                    widthPx = (DAYS_TO_RENDER * 240) - actualLeft;
                }

                const topPx = rIdx * ROW_HEIGHT;
                const color = sourceColors[b.source] || '#3182ce';
                
                const inDate = parseISO(b.checkIn);
                const timeStr = `${inDate.getHours().toString().padStart(2,'0')}:${inDate.getMinutes().toString().padStart(2,'0')}`;
                
                const dotColor = b.status === 'paid' ? 'green' : (b.status === 'deposit' ? 'yellow' : 'red');

                html += `
                    <div class="booking-block" style="top: ${topPx}px; left: ${actualLeft}px; width: ${widthPx}px; background-color: ${color}" onclick="openEditModal('${b.id}')">
                        <div class="b-dot ${dotColor}"></div>
                        <div class="b-text">${b.guest} ${timeStr}</div>
                        
                        <div class="tooltip">
                            <strong>👤 Khách:</strong> ${b.guest} (${b.phone})<br>
                            <strong>📅 Thời gian:</strong> ${formatDisplayDate(b.checkIn)} - ${formatDisplayDate(b.checkOut)}<br>
                            <strong>🏷️ Nguồn:</strong> ${b.source} <br>
                            <strong>💰 TT:</strong> ${b.status}
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;
        }

        function updateCurrentTimeLine() {
            const line = document.getElementById('current-time-line');
            const now = new Date();
            const startMs = currentStartDate.getTime();
            const endMs = startMs + (DAYS_TO_RENDER * 24 * 60 * 60 * 1000);
            
            if (now.getTime() >= startMs && now.getTime() <= endMs) {
                line.style.display = 'block';
                const msToPx = 240 / (24 * 60 * 60 * 1000);
                const leftPx = (now.getTime() - startMs) * msToPx + 180; // 180 is room col width
                line.style.left = leftPx + 'px';
            } else {
                line.style.display = 'none';
            }
        }
        
        setInterval(updateCurrentTimeLine, 60000); // update every minute

        // --- Modals ---
        function updateRoomOptions() {
            const facility = document.getElementById('b-facility').value;
            const rooms = getRooms().filter(r => r.facility === facility);
            const sel = document.getElementById('b-room');
            sel.innerHTML = rooms.map(r => `<option value="${r.id}">${r.name} (${r.type})</option>`).join('');
        }

        function openAddModal(roomId = null, facility = null) {
            document.getElementById('bookingForm').reset();
            document.getElementById('b-id').value = '';
            document.getElementById('modal-title').textContent = 'Thêm Đặt Phòng';
            document.getElementById('btn-delete').style.display = 'none';
            
            if(facility) {
                document.getElementById('b-facility').value = facility;
            } else {
                document.getElementById('b-facility').selectedIndex = 0;
            }
            updateRoomOptions();
            if(roomId) document.getElementById('b-room').value = roomId;
            
            // Default times: Today 14:00 to Tomorrow 12:00
            const now = new Date();
            now.setHours(14,0,0,0);
            document.getElementById('b-checkin').value = toLocalISOString(now);
            now.setDate(now.getDate() + 1);
            now.setHours(12,0,0,0);
            document.getElementById('b-checkout').value = toLocalISOString(now);

            document.getElementById('bookingModal').classList.add('active');
        }

        function cellClicked(roomId, facility) {
            openAddModal(roomId, facility);
        }

        function openEditModal(bookingId) {
            const b = getBookings().find(x => x.id === bookingId);
            if(!b) return;
            
            const r = getRooms().find(x => x.id === b.roomId);
            
            document.getElementById('modal-title').textContent = 'Sửa Đặt Phòng';
            document.getElementById('b-id').value = b.id;
            document.getElementById('b-guest').value = b.guest;
            document.getElementById('b-phone').value = b.phone || '';
            document.getElementById('b-facility').value = r.facility;
            updateRoomOptions();
            document.getElementById('b-room').value = b.roomId;
            document.getElementById('b-checkin').value = toLocalISOString(parseISO(b.checkIn));
            document.getElementById('b-checkout').value = toLocalISOString(parseISO(b.checkOut));
            document.getElementById('b-source').value = b.source;
            document.getElementById('b-status').value = b.status;
            
            document.getElementById('btn-delete').style.display = 'block';
            document.getElementById('bookingModal').classList.add('active');
        }

        function closeModal(id) {
            document.getElementById(id).classList.remove('active');
        }

        function deleteBooking() {
            const id = document.getElementById('b-id').value;
            if(id && confirm('Bạn có chắc chắn muốn xóa?')) {
                let bs = getBookings();
                bs = bs.filter(b => b.id !== id);
                saveBookings(bs);
                closeModal('bookingModal');
                renderTimeline();
            }
        }

        document.getElementById('bookingForm').onsubmit = function(e) {
            e.preventDefault();
            const id = document.getElementById('b-id').value || ('b_' + Date.now());
            const guest = document.getElementById('b-guest').value;
            const phone = document.getElementById('b-phone').value;
            const roomId = document.getElementById('b-room').value;
            const source = document.getElementById('b-source').value;
            const checkIn = new Date(document.getElementById('b-checkin').value).toISOString();
            const checkOut = new Date(document.getElementById('b-checkout').value).toISOString();
            const status = document.getElementById('b-status').value;
            
            if(new Date(checkOut) <= new Date(checkIn)) {
                alert('Ngày Check-out phải sau Check-in!');
                return;
            }
            
            let bs = getBookings();
            // simple conflict check
            const conflict = bs.find(b => b.id !== id && b.roomId === roomId && new Date(b.checkIn) < new Date(checkOut) && new Date(b.checkOut) > new Date(checkIn));
            if(conflict) {
                alert('Phòng đã bị trùng lặp thời gian với khách khác!');
                return;
            }

            const newB = { id, roomId, guest, phone, source, checkIn, checkOut, status };
            bs = bs.filter(b => b.id !== id);
            bs.push(newB);
            saveBookings(bs);
            
            closeModal('bookingModal');
            renderTimeline();
        };

        window.onclick = function(e) {
            if(e.target.classList.contains('modal-overlay')) closeModal('bookingModal');
        };

        window.onload = () => {
            initMockData();
            renderTimeline();
        };

        // Scroll sync
        document.getElementById('tl-container').addEventListener('scroll', function() {
            const left = this.scrollLeft;
            document.querySelectorAll('.tl-room-col-header, .tl-room-info, .tl-facility-row').forEach(el => {
                if(el.classList.contains('tl-facility-row')) return; // keep sticky using CSS
            });
        });
    </script>
</body>
</html>
"""

with open('d:/Kinh doanh/AI/Homestay/homestay_booking.html', 'w', encoding='utf-8') as f:
    f.write(html_content)

print("SUCCESS")
