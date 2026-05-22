# PMS SAAS — ARCHITECTURE BLUEPRINT & ANTIGRAVITY MASTER PROMPT
### Phiên bản v2.0 | Đã kiểm toán & vá lỗi đầy đủ | Dựa trên PRD V18 Final
### Changelog v2.0: +Check-in flow | +Buffer runtime | +Google Sheets | +Phiếu thu | +No-show | +Công thức giá | +Commission | Clarify Investor role

---

## PHẦN 1 — LUỒNG DỮ LIỆU TỔNG THỂ (Cross-Module Data Flow)

### 1.1. Vòng đời đầy đủ của một Booking (Full Lifecycle — v2)

```
╔══════════════════════════════════════════════════════════════╗
║  [MODULE 4 - ADD BOOKING MODAL]  — BƯỚC 1: TẠO BOOKING      ║
╚══════════════════════════════════════════════════════════════╝
Lễ tân điền form → Validate:
  ✓ checkout > checkin (bắt buộc)
  ✓ Room conflict: SELECT * FROM bookings WHERE room_id = ? 
                   AND status NOT IN ('cancelled','no_show')
                   AND check_in < new_checkout AND check_out > new_checkin
  ✓ Buffer 30 phút: khoảng cách với booking liền kề ≥ 30 phút
  ✓ Nếu conflict → Block submit, hiển thị lịch xung đột ngay trên modal

→ Ghi bookings: status = "confirmed" (chưa cọc) hoặc "deposited" (đã cọc)
→ Trigger: Nếu có payment → Ghi payment_records → Sinh receipt tự động
→ Trigger: Google Sheets Sync Queue — append row mới vào Sheet khách hàng
→ Hiển thị: Booking Block màu Xanh dương xuất hiện trên Timeline (M2.3)
→ Table View (M9): KPI cards cập nhật real-time

         ▼

╔══════════════════════════════════════════════════════════════╗
║  [MODULE 8 - BOOKING DETAILS MODAL] — BƯỚC 2: CHECK-IN  🆕  ║
╚══════════════════════════════════════════════════════════════╝
Lễ tân mở Booking Details Modal → Bấm nút [Check-in]:
  → Validate: Phòng đang ở trạng thái "Đã dọn" (Clean)?
      Nếu KHÔNG → Hiện cảnh báo "Phòng chưa sẵn sàng" + block Check-in
      Nếu CÓ → Cho phép tiếp tục
  → bookings.status → "checked_in"
  → bookings.actual_check_in = NOW()
  → Booking Block đổi màu → Xanh lá "Đang ở"
  → Google Sheets Sync: Update row tương ứng (cột actual_check_in)

         ▼

╔══════════════════════════════════════════════════════════════╗
║  TRONG THỜI GIAN LƯU TRÚ — Thanh toán nhiều đợt             ║
╚══════════════════════════════════════════════════════════════╝
Mỗi lần ghi payment:
  → INSERT payment_records (booking_id, amount, method, date)
  → bookings.amount_paid = SUM(payment_records.amount)
  → bookings.amount_remaining = total_price - amount_paid
  → Auto-trigger: Nếu remaining = 0 → status badge đổi "Đã TT đủ"
  → Sinh phiếu thu (receipt) on-demand — có thể in ngay
  → Table View (M9): Cột "Chưa TT" và "Ngày TT gần nhất" cập nhật real-time
  → Google Sheets Sync: Update row (payment columns)

  ⚠️ RUNTIME ALERT (Buffer check):
  → Cron job chạy mỗi 15 phút: Scan bookings kế tiếp trong 60 phút tới
  → Nếu phòng vẫn "Bẩn"/"Đang dọn" VÀ booking tiếp theo < 60 phút
     → Push notification cho Housekeeping lead + lễ tân

         ▼

╔══════════════════════════════════════════════════════════════╗
║  [MODULE 8] — BƯỚC 3: CHECK-OUT                              ║
╚══════════════════════════════════════════════════════════════╝
Lễ tân bấm [Check-out]:
  → Validate: Còn nợ (amount_remaining > 0)?
       → Hiện warning dialog: "Khách còn nợ [X]đ. Vẫn check-out?"
       → [Xác nhận] → Ghi nhận nợ tồn, vẫn cho check-out
       → [Hủy] → Quay lại thu tiền
  → bookings.status → "checked_out"
  → bookings.actual_check_out = NOW()
  → ⚡ AUTO-TRIGGER: room.status → "dirty" (Bẩn)
  → Timeline: Block đổi màu xám, Room dot đổi đỏ
  → Housekeeping Board: Card mới xuất hiện cột "CẦN DỌN"
  → Google Sheets Sync: Update row (checkout columns)

  ⚠️ LATE CHECK-OUT ALERT:
  → Nếu current_time > booking.check_out VÀ status vẫn "checked_in"
     → Booking Block nháy cam trên Timeline
     → Nếu booking kế tiếp < 2 tiếng → Alert popup lễ tân
     → Lễ tân chọn: [Gia hạn + tính phí giờ] | [Miễn phí late C/O]

  ⚠️ NO-SHOW HANDLING: 🆕
  → Nếu current_time > check_in + 2 tiếng VÀ status vẫn "confirmed/deposited"
     → Auto-alert lễ tân: "Khách [tên] chưa check-in"
     → Lễ tân bấm [Đánh dấu No-show]:
          → bookings.status → "no_show"
          → Popup: Chính sách tiền cọc? [Giữ lại | Hoàn trả]
          → Phòng → tự động "Available" (KHÔNG cần dọn, chưa ai ở)
          → KHÔNG trigger Housekeeping

         ▼

╔══════════════════════════════════════════════════════════════╗
║  [MODULE 7 - HOUSEKEEPING] — BƯỚC 4: DỌN PHÒNG              ║
╚══════════════════════════════════════════════════════════════╝
Nhận card "CẦN DỌN":
  → Trưởng bộ phận phân công đích danh Housekeeper (từ danh sách staff)
  → cleaning_assignments: INSERT (room_id, booking_id, assigned_to, status='pending')
  → Housekeeper nhận task trên mobile → Bấm [Bắt đầu dọn]
     → room.status → "cleaning" (Vàng)
  → Housekeeper upload ảnh từ camera mobile:
     → VALIDATE real-time: count(photos) hiển thị "X/8 ảnh"
     → Nút [Hoàn thành] chỉ enable khi đủ 8 ảnh
  → Bấm [Hoàn thành]:
     → room.status → "clean" (Xanh)
     → cleaning_assignments.status → "done"
     → Timeline: Room dot đổi xanh, phòng sẵn sàng cho booking tiếp

         ▼

╔══════════════════════════════════════════════════════════════╗
║  [MODULE 12 + 13] — SONG SONG: CHI PHÍ & BÁO CÁO            ║
╚══════════════════════════════════════════════════════════════╝
Module 12 — Expense:
  → Kế toán ghi chi phí: property_id (hoặc NULL = chung toàn chuỗi)
  → expenses table → Trigger M13 recalculate P&L

Module 13 — P&L real-time:
  → Revenue  = SUM(total_price) WHERE status NOT IN ('cancelled','no_show')
               + Doanh thu thuần = Revenue - SUM(refund_amount)
  → Expenses = SUM(amount) per property + phân bổ chi phí chung
  → Fixed    = SUM(properties.monthly_rent) per kỳ
  → Profit   = Revenue_thuần - Expenses - Fixed
  → Occupancy = actual_checked_in_nights / total_room_nights * 100
  → KPI "Chưa TT" = SUM(amount_remaining) WHERE status 
                     NOT IN ('cancelled','no_show','checked_out_debt_written_off')

         ▼

╔══════════════════════════════════════════════════════════════╗
║  [MODULE 15] — GOOGLE SHEETS BACKUP (REAL-TIME SYNC)  🆕     ║
╚══════════════════════════════════════════════════════════════╝
Mỗi write operation trong hệ thống:
  → Event được đẩy vào sync_queue (bảng DB hoặc Redis queue)
  → Background job (chạy mỗi 30 giây hoặc webhook):
       - Lấy events chưa sync (synced = false)
       - Call Google Sheets API: append/update dòng tương ứng
       - Đánh dấu synced = true, ghi sync_at timestamp
  → Nếu API call thất bại: retry 3 lần, sau đó báo lỗi admin
  → Dedup: Check idempotency_key trước khi write vào Sheet
  → Khách hàng sở hữu dữ liệu: Sheet nằm trong Google Drive của họ
```

---

### 1.2. Bảng liên kết Module — v2 (Cross-Reference Matrix)

| Sự kiện | Module nguồn | Trigger sang | Dữ liệu truyền |
|---------|-------------|--------------|----------------|
| Tạo Booking | M4 | M9, M2.3, M15 | booking_id, room_id, dates, amount |
| Ghi Payment | M4/M8 | M9, M13, M15, Receipt | payment_amount, booking_id |
| **Check-in** 🆕 | M8 | M2.3 | room_id, actual_check_in |
| Check-out | M8 | M7, M2.3, M15 | room_id → dirty |
| **No-show** 🆕 | M8 | M2.3 | room_id → available (skip cleaning) |
| Dọn xong | M7 | M2.3, M8 (unblock checkin) | room_id → clean |
| Nhập chi phí | M12 | M13, M15 | expense, property_id |
| Cài đặt giá thuê CS | M11 | M13 (Fixed Cost) | monthly_rent |
| Nhân viên tạo booking | M4 | M14 KPI, Commission | staff_id, booking_revenue |
| **Google Sheets write** 🆕 | M15 | External Google Drive | Sync payload |

---

## PHẦN 2 — BUSINESS LOGIC & CÔNG THỨC (v2)

### 2.1. Công thức tính giá theo Hình thức phòng 🆕

```
"Theo ngày":
  → total_price = unit_price × số_ngày
  → Số ngày = CEIL((checkout_date - checkin_date) / 86400 seconds)
  → Ví dụ: Check-in 10/6 14h → Check-out 12/6 12h = 2 ngày

"Theo giờ":
  → total_price = unit_price × số_giờ (làm tròn LÊN)
  → Số giờ = CEIL((checkout_time - checkin_time) / 3600 seconds)
  → Ví dụ: 14h00 → 17h30 = CEIL(3.5) = 4 giờ

"Qua đêm":
  → total_price = unit_price × 1 (giá cố định cho 1 lượt qua đêm)
  → Khung giờ chuẩn: Check-in 22h00 → Check-out 08h00 hôm sau
  → Nếu khác khung giờ chuẩn: áp dụng phụ phí

Frontend: Khi user chọn room_type → JS tự động detect công thức 
         và recalculate total_price real-time khi thay đổi dates.
```

### 2.2. Commission (Hoa hồng nhân viên) 🆕

```
Thời điểm tính: Khi booking.status chuyển sang "checked_out"
Công thức: commission_earned = booking.total_price × user.commission_rate / 100
Lưu trữ: Ghi vào bookings.commission_earned (computed at checkout)
Hiển thị: Dashboard M14.3 → Staff Performance Table cột "Commission"
Xuất báo cáo: Tính tổng commission theo kỳ cho từng staff
Lưu ý: Commission tính trên TỔNG doanh thu, không trừ discount/refund
        (Điều chỉnh tùy chính sách — cần confirm với Product Owner)
```

### 2.3. Phân quyền Nhà đầu tư — đã làm rõ 🆕

```
⚠️ Mâu thuẫn trong PRD gốc đã được giải quyết như sau:
   M6.1: "Nhà đầu tư — Chỉ xem cơ sở của mình"
   KSP #10: "chỉ được xem báo cáo cơ sở rớt vốn" (có thể là typo "rớt" = "của")

→ Quyết định thiết kế (chờ confirm Product Owner):
   Nhà đầu tư XEM ĐƯỢC: 
     - Báo cáo P&L đầy đủ của cơ sở mình đầu tư (property_access[])
     - Dashboard KPI của cơ sở đó
     - Không thấy cơ sở khác, không thấy dữ liệu nhân viên, không thấy chi tiết booking
   Nhà đầu tư KHÔNG xem:
     - Danh sách booking, thông tin khách hàng cụ thể
     - Chi phí nhân viên, hoa hồng
     - Cài đặt hệ thống

→ Implementation: users.property_access = UUID[] (array of property_ids)
   Mọi query của Investor role đều có WHERE property_id = ANY(user.property_access)
```

---

## PHẦN 3 — EDGE CASES (v2 — Cập nhật đầy đủ)

### EC-1: Hủy phòng có cọc tiền

```
→ Popup 3 lựa chọn: [Giữ cọc] | [Hoàn một phần (nhập %)] | [Hoàn toàn bộ]
→ bookings.cancellation_type + refund_amount
→ Nếu hoàn: Tạo expense_record loại "Refund" → ảnh hưởng P&L
→ P&L hiển thị: "Doanh thu gộp" vs "Doanh thu thuần (sau hoàn)"
→ Room: Available ngay lập tức (không cần dọn nếu chưa check-in)
→ Google Sheets Sync: Update row + ghi refund_amount
```

### EC-2: Late Check-out

```
→ current_time > check_out VÀ status = "checked_in"
→ Booking Block nháy màu cam trên Timeline
→ Alert lễ tân nếu booking tiếp theo < 2 tiếng
→ Chọn: [Gia hạn + phí giờ] → tạo surcharge record
         [Miễn phí] → ghi note, không tính thêm
→ Housekeeping: Nhận thông báo delay
```

### EC-3: No-show 🆕

```
→ Auto-alert sau check_in + 2 tiếng không có action
→ Lễ tân confirm No-show:
   booking.status → "no_show"
   Chọn: [Giữ cọc] | [Hoàn cọc]
   Room → "clean" (Available, không trigger Housekeeping)
   KPI: No-show booking KHÔNG tính vào Revenue thực tế
        Chỉ tính revenue từ tiền cọc giữ lại (nếu có)
```

### EC-4: Chi phí chung toàn chuỗi

```
→ property_id = NULL trong bảng expenses
→ P&L Mức 1 (Toàn chuỗi): Trừ toàn bộ chi phí chung
→ P&L Mức 2 (từng CS): Hiển thị riêng dòng "Chi phí chung được phân bổ"
   Cách phân bổ: Tỷ lệ % theo doanh thu từng cơ sở
   VD: CS-A đóng góp 60% doanh thu → chịu 60% chi phí chung
```

### EC-5: Nhân viên nghỉ việc còn booking

```
→ Soft-delete: users.is_active = false (KHÔNG xóa record)
→ Popup: "Reassign [X] bookings chưa check-in?"
→ Lịch sử booking vẫn giữ staff_id cũ (để báo cáo chính xác)
→ Báo cáo: Toggle "Hiện nhân viên đã nghỉ" để xem historical data
```

### EC-6: Double-submit / Lỗi mạng

```
→ Idempotency key: UUID sinh khi mở modal, gắn vào mọi request
→ Backend: INSERT ... ON CONFLICT (idempotency_key) DO NOTHING
→ UI: Button disabled 3s sau click + loading state
→ Google Sheets: Queue-based với dedup trên idempotency_key
```

### EC-7: Buffer runtime (Phòng dọn chưa xong) 🆕

```
→ Cron job mỗi 15 phút quét:
   SELECT bookings WHERE check_in BETWEEN NOW() AND NOW() + 60min
   JOIN rooms WHERE status IN ('dirty', 'cleaning')
→ Nếu match: Push notification → Housekeeping lead + lễ tân
→ Lễ tân không thể Check-in nếu room.status != 'clean'
   (Chỉ có thể override nếu role = Admin/Manager)
```

---

## PHẦN 4 — PHÂN RÃ COMPONENT (v2)

### 4.1. Pages / Routes (v2)

```
/ (Root)
├── /login                          → Đăng nhập
├── /dashboard                      → Dashboard tổng quan (M14)
├── /bookings
│   ├── /bookings/timeline          → Timeline Gantt View [DEFAULT]
│   └── /bookings/table             → Table View / Data Grid
├── /rooms                          → Danh sách & trạng thái phòng
├── /housekeeping                   → Kanban board dọn phòng
├── /expenses                       → Quản lý chi phí
├── /reports
│   ├── /reports/pl                 → P&L Report (drill-down)
│   ├── /reports/revenue            → Báo cáo doanh thu
│   └── /reports/occupancy          → Báo cáo công suất
├── /staff                          → Nhân viên + KPI
└── /settings
    ├── /settings/general           → Dynamic config (M10)
    ├── /settings/properties        → Cơ sở & Phòng (M11)
    ├── /settings/integrations  🆕  → Google Sheets OAuth + setup
    └── /settings/roles             → RBAC
```

---

[NỘI DUNG SQL SCHEMA VÀ MASTER PROMPT ĐƯỢC GIỮ NGUYÊN NHƯ BẢN CUNG CẤP]
