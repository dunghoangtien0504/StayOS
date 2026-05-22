// store.js - PMS Architecture v2.1 Standard
const STORAGE_KEY = 'homestay_saas_v2_data';

const defaultData = {
    organizations: [{ id: 'org_1', name: 'Ta Thong Dong Chain', plan: 'pro' }],
    properties: [
        { id: 'p1', org_id: 'org_1', name: '15 Trung Liệt', address: 'Đống Đa, Hà Nội', monthly_rent: 15000000 },
        { id: 'p2', org_id: 'org_1', name: '11 Mỹ Đình', address: 'Nam Từ Liêm, Hà Nội', monthly_rent: 12000000 }
    ],
    rooms: [
        { id: 'r1', property_id: 'p1', name: 'P101', status: 'clean', base_price: 500000, floor: 1 },
        { id: 'r2', property_id: 'p1', name: 'P102', status: 'dirty', base_price: 600000, floor: 1 },
        { id: 'r3', property_id: 'p2', name: 'P201', status: 'clean', base_price: 450000, floor: 2 },
        { id: 'r4', property_id: 'p2', name: 'P202', status: 'cleaning', base_price: 450000, floor: 2 }
    ],
    staff: [
        { id: 'CTV00001', name: 'Admin', role: 'Admin', facility: 'Tất cả', color: '#f59e0b', comm: '5%', totalComm: '721.650 đ' },
        { id: 'CTV00002', name: 'Minh', role: 'Nhà đầu tư', facility: '15 Trung Liệt', color: '#10b981', comm: '10%', totalComm: '1.426.800 đ' },
        { id: 'CTV00003', name: 'Hải', role: 'Quản lý', facility: '11 Mỹ Đình', color: '#1e3a8a', comm: '15%', totalComm: '2.452.050 đ' },
        { id: 'CTV00004', name: 'Hà', role: 'Nhân viên', facility: 'Tất cả', color: '#9333ea', comm: '10%', totalComm: '1.634.600 đ' },
        { id: 'CTV00005', name: 'Thanh', role: 'Nhân viên', facility: 'Tất cả', color: '#16a34a', comm: '8%', totalComm: '1.493.280 đ' }
    ],
    bookings: [
        { 
            id: 'bk_sample_1', 
            property_id: 'p1', 
            room_id: 'r1', 
            guest_name: 'Nguyễn Văn A', 
            guest_phone: '0912345678', 
            check_in: '2026-05-04T14:00', 
            check_out: '2026-05-07T12:00', 
            unit_price: 500000, 
            surcharge: 0, 
            source: 'Agoda',
            staff_name: 'Admin',
            room_type: 'Qua đêm',
            status: 'checked_in',
            payments: [{ date: '2026-05-04', amount: 500000, note: 'Đã cọc' }] 
        }
    ],
    expenses: [],
    cleaning_assignments: [],
    configs: {
        sources: ['Walk-in', 'Booking.com', 'Agoda', 'Facebook', 'Zalo', 'Direct'],
        room_types: ['Theo ngày', 'Theo giờ', 'Qua đêm'],
        expense_categories: ['Điện', 'Nước', 'Lương', 'Marketing', 'Sửa chữa', 'Khác']
    }
};

export const store = {
    init() {
        if (!localStorage.getItem(STORAGE_KEY)) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
        } else {
            // Cập nhật cấu trúc nếu thiếu trường staff (Migrate v2.0 -> v2.1)
            const data = this.getData();
            if (!data.staff) {
                data.staff = defaultData.staff;
                this.saveData(data);
            }
        }
    },
    getData() { return JSON.parse(localStorage.getItem(STORAGE_KEY)); },
    saveData(data) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); },
    
    getProperties() { return this.getData().properties; },
    getRooms() { return this.getData().rooms; },
    getStaff() { return this.getData().staff || []; },

    getBookings() {
        const data = this.getData();
        return (data.bookings || []).map(b => {
            const amount_paid = (b.payments || []).reduce((sum, p) => sum + Number(p.amount), 0);
            const total = Number(b.unit_price) + Number(b.surcharge || 0);
            return { ...b, amount_paid, amount_remaining: total - amount_paid, total_price: total };
        });
    },

    updateStaff(id, staffData) {
        const data = this.getData();
        const idx = data.staff.findIndex(s => s.id === id);
        if (idx !== -1) {
            data.staff[idx] = { ...data.staff[idx], ...staffData };
            this.saveData(data);
        }
    },

    addStaff(staffData) {
        const data = this.getData();
        const sId = 'CTV' + String(data.staff.length + 1).padStart(5, '0');
        data.staff.push({ ...staffData, id: sId, totalComm: '0 đ' });
        this.saveData(data);
    },

    deleteStaff(id) {
        const data = this.getData();
        data.staff = data.staff.filter(s => s.id !== id);
        this.saveData(data);
    },

    addBooking(bookingData) {
        const data = this.getData();
        const bId = 'bk_' + Date.now();
        data.bookings.push({ ...bookingData, id: bId });
        this.saveData(data);
    },

    updateBooking(id, bookingData) {
        const data = this.getData();
        const idx = data.bookings.findIndex(b => b.id === id);
        if (idx !== -1) {
            data.bookings[idx] = { ...data.bookings[idx], ...bookingData };
            this.saveData(data);
        }
    },

    getPaymentRecords() {
        const bookings = this.getBookings();
        let records = [];
        bookings.forEach(b => {
            (b.payments || []).forEach(p => {
                records.push({ ...p, guest_name: b.guest_name, room_id: b.room_id, property_id: b.property_id });
            });
        });
        return records;
    },

    updateRoomStatus(id, status) {
        const data = this.getData();
        const idx = data.rooms.findIndex(r => r.id === id);
        if (idx !== -1) {
            data.rooms[idx].status = status;
            this.saveData(data);
        }
    },

    getCleaningAssignments() {
        return this.getData().cleaning_assignments || [];
    },

    updateCleaningAssignment(id, status) {
        const data = this.getData();
        const idx = data.cleaning_assignments.findIndex(a => a.id === id);
        if (idx !== -1) {
            data.cleaning_assignments[idx].status = status;
            if (status === 'done') {
                const roomIdx = data.rooms.findIndex(r => r.id === data.cleaning_assignments[idx].room_id);
                if (roomIdx !== -1) data.rooms[roomIdx].status = 'clean';
            }
            this.saveData(data);
        }
    },

    updateCleaningPhotos(id, photos) {
        const data = this.getData();
        const idx = data.cleaning_assignments.findIndex(a => a.id === id);
        if (idx !== -1) {
            data.cleaning_assignments[idx].photos = photos;
            this.saveData(data);
        }
    },

    getExpenses() { return this.getData().expenses || []; },
    getConfigs() { return this.getData().configs || {}; },
    getCurrentUser() {
        // Giả lập người dùng hiện tại là Admin để kiểm tra tính năng
        return { name: 'Admin', role: 'Admin' };
    }
};
