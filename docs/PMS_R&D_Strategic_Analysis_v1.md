# 🎯 PMS SAAS — PHÂN TÍCH R&D CHIẾN LƯỢC v1.0
### Tài liệu định vị sản phẩm & chỉ thị thiết kế cho Antigravity
**Soạn bởi:** Director R&D — 20 năm kinh nghiệm Hospitality Tech
**Bối cảnh thị trường:** Tháng 5/2026 | Ho Chi Minh City
**Tài liệu nền:** PRD V18 Final + Architecture Blueprint v2.0
**Mục đích:** Định nghĩa cách "thắng" 2 đối thủ Việt Nam + 5 PMS hàng đầu thế giới

---

## PHẦN 0 — TÓM TẮT CHO LÃNH ĐẠO (TL;DR)

PRD V18 của anh đã đủ tốt để **đạt parity** với An Nhiên Homestay (đối thủ Việt Nam mạnh nhất trong ảnh) và **vượt mặt** Hotel Manager (đối thủ yếu — Google Apps Script). Tuy nhiên nếu chỉ build đúng PRD V18, sản phẩm anh sẽ là **"another PMS"** — một trong hàng chục đối thủ. Để **thắng** — đặc biệt chống lại Cloudbeds/Mews khi họ vào VN — cần thêm **7 viên gạch khác biệt** (Section 3) và **8 UX pattern hiện đại 2026** (Section 4).

**Kết luận thực tế:**
- ✅ **Giữ nguyên** 90% PRD V18 — nó đã chắc.
- ➕ **Bổ sung** 7 differentiators (AI Co-pilot, Smart Unified Inbox, Voice Input, Predictive Cleaning, Owner P&L Real-time, Channel Manager Lite, Vietnamese-first DNA).
- 🎨 **Nâng cấp UX** lên chuẩn 2026 (Command Palette, drag-and-drop calendar mượt như Mews, Mobile-first housekeeping).
- 🚀 **Roadmap 12 tháng** chia 3 phase, mỗi phase ship được giá trị độc lập.

**Lời hứa cuối cùng cho founder:** Nếu làm đúng tài liệu này, sản phẩm anh sẽ có:
- Front desk staff tiết kiệm **3-4 giờ/ngày** (chuẩn Hotelogix 2026).
- RevPAR tăng **15-25%** từ dynamic pricing (chuẩn industry 2026).
- Guest satisfaction **+30-40%** từ automation (chuẩn industry 2026).
- Pricing dưới Mews/Cloudbeds **40-60%** vì built-for-Vietnam.

---

## PHẦN 1 — PHÂN TÍCH 2 ĐỐI THỦ TRONG ẢNH

### 1.1. An Nhiên Homestay (Ảnh 1) — ĐỐI THỦ MẠNH 🟠

**Họ làm tốt cái gì?**

| Điểm mạnh | Đánh giá R&D |
|---|---|
| Dashboard chuỗi (12 cơ sở, 86 căn) | ✅ Họ hiểu đa cơ sở — đúng segment chuỗi homestay VN |
| KPI cards 6 chỉ số top: Tổng cơ sở, Căn lưu trú, Lấp đầy %, Doanh thu tháng, Booking hôm nay, Khách đang lưu trú | ✅ Đúng KPI cốt lõi — không thừa, không thiếu |
| Donut chart "Tỷ lệ lấp đầy theo khu vực" có trung bình toàn chuỗi | ✅ Nice touch — giúp owner biết khu vực nào underperform |
| Recent bookings sidebar có status (Đã xác nhận / Chờ xử lý / Đã nhận phòng) | ✅ Quick glance hữu ích cho lễ tân & owner |
| "Cảnh báo vận hành" khu vực: 2 phòng cần dọn, 1 căn bảo trì, 3 booking cần xác nhận | ✅ **Đây là idea hay** — actionable insights, không phải vanity metrics |
| Bảng "Hiệu suất nhân viên" có tỷ lệ hoàn thành & rating | ✅ Theo dõi staff KPI ngay trên dashboard |
| Báo cáo tổng quan: ADR, RevPAR, Tỷ lệ hủy | ✅ Họ biết về industry KPI — không amateur |
| Visual identity nhất quán: tone xanh olive + cam đất + nền be | ✅ Brand đẹp, thanh lịch — premium feel |

**Họ làm dở cái gì? (Cơ hội của ANH)**

| Điểm yếu | Cách ANH làm tốt hơn |
|---|---|
| ❌ **Chỉ là dashboard view** — không thấy Timeline/Calendar (tính năng cốt lõi của PMS) | ✅ Anh có Timeline View là **hero feature** (Module 5) |
| ❌ Không có **Channel Manager** — dữ liệu Booking/Airbnb/Agoda phải nhập tay | ✅ Anh build Channel Manager Lite (Section 3.6) |
| ❌ Donut chart **không có drill-down** — click vào "Đà Lạt 82%" không đi đâu | ✅ Mọi metric phải clickable, dẫn xuống chi tiết |
| ❌ "Hiệu suất nhân viên" hiển thị 4 vai trò cố định (Lễ tân/Buồng phòng/CSKH/Kỹ thuật) — không reflect được team thật của homestay nhỏ | ✅ Anh cho tự định nghĩa vai trò + RBAC linh hoạt |
| ❌ Không có **Smart Inbox** — nhắn tin Booking/Airbnb/Zalo vẫn tách lẻ | ✅ Anh build Unified Inbox (Section 3.2) — đây là **moat lớn nhất** |
| ❌ Không có **AI** ở bất cứ đâu — 2026 mà thiếu AI là behind 2 năm | ✅ Anh có AI Co-pilot (Section 3.1) |
| ❌ Không có **mobile-first design** cho housekeeper — họ vẫn gắn vào desktop | ✅ Anh build PWA mobile cho housekeeper (đã có trong PRD V18) |
| ❌ "+12% so tháng trước" — số đẹp nhưng **không có trend chart 12 tháng** ở ngay đó | ✅ Sparkline mini trong KPI card |
| ❌ Không có **Forecast** — chỉ historical data | ✅ Anh có Predictive Occupancy (Section 3.4) |
| ❌ Không thấy **Owner Portal** riêng cho nhà đầu tư | ✅ PRD V18 anh đã design role Investor — phải build cho ra hồn |

**Tổng kết An Nhiên:** Đây là sản phẩm **chỉn chu nhưng dừng ở "good enough" của 2023**. Họ thiếu hoàn toàn AI, Channel Manager, và Unified Inbox — 3 thứ định nghĩa PMS thế hệ mới (2025-2026). Nếu anh build đủ PRD V18 + 7 differentiators bên dưới, anh sẽ vượt họ trong 12 tháng.

---

### 1.2. Hotel Manager (Ảnh 2) — ĐỐI THỦ YẾU 🔴

**Họ làm được gì?**

| Điểm mạnh | Đánh giá R&D |
|---|---|
| Có Timeline view với swimlane theo phòng | ✅ UX cốt lõi đã có (mặc dù primitive) |
| Group theo cơ sở (11 Mỹ Đình / 25 Quan Hoa / 182 Lạc Long Quân) | ✅ Hiểu được multi-property |
| Status cleaning ngay đầu row (Đã dọn / Đang dọn / Bẩn) | ✅ Hữu dụng cho lễ tân |
| Color coding mỗi booking khác nhau (random) | ✅ Visual differentiation tạm chấp nhận được |
| Có pin marker "🚩" trên booking (chắc là cọc?) | ✅ Có cố gắng hiển thị metadata |

**Họ thua tan tành ở đâu?**

| Điểm yếu | Severity |
|---|---|
| ❌ **Là Google Apps Script** — chạy trên script.google.com, performance kém, scale 0 | 🔴🔴🔴 Fatal |
| ❌ Sidebar amateur: chỉ 7 mục, thiếu Báo cáo nâng cao, Khách hàng, Channel | 🔴 Critical |
| ❌ Khung giờ trên timeline chỉ hiển thị **00, 02, 04, 06, 08, 10, 12, 14, 16, 18, 20, 22** — không có giờ chính xác cho check-in/out | 🔴 Critical |
| ❌ Color của booking block **random** — không có ý nghĩa (status? OTA source? Đã thanh toán?) | 🔴 High |
| ❌ Không có buffer cleaning visualization — booking dán liền nhau | 🔴 High |
| ❌ **Không có Dashboard riêng** — chỉ có timeline | 🟡 Medium |
| ❌ Không có drag-and-drop — phải click vào edit modal mới đổi được | 🔴 Critical |
| ❌ UI text nhiều chỗ truncate "Qan... 07:25" — không cho hover xem full | 🟡 Medium |
| ❌ Filter "Trạng thái dọn" có nhưng **không có filter theo trạng thái booking, nguồn OTA** | 🔴 High |
| ❌ Visual chật — lưới quá dày, không có khoảng thở | 🟡 Medium |

**Tổng kết Hotel Manager:** Đây là **proof-of-concept**, không phải sản phẩm thương mại. Nó tồn tại được vì nhiều owner VN chưa biết đến giải pháp tốt hơn. Anh có thể vượt sản phẩm này trong **2 tuần** nếu chỉ ship Module 5 (Timeline) + Module 4 (Add Booking Modal) của PRD V18.

---

## PHẦN 2 — BENCHMARK GLOBAL 2026

### 2.1. Bảng so sánh Top 5 PMS thế giới (theo kết quả search 5/2026)

| PMS | Định vị | Strength chính 2026 | Anh cần học gì? |
|---|---|---|---|
| **Mews** | API-first, premium chains | "User disengagement" philosophy — staff ít nhìn màn hình hơn, tương tác với khách nhiều hơn. 1000+ integrations. Atomize AI RMS dự báo 2 năm. | UX minimalist, drag-drop calendar mượt, reduce cognitive load |
| **Cloudbeds** | All-in-one cho indie | "Causal AI" — foundation model riêng cho hospitality. 300+ OTA connections. Single source of truth: PMS+CRS+Booking Engine. | Channel Manager là phải có. AI native, không bolt-on. |
| **Hotelogix** | Mid-market, mobile-first | Tiết kiệm **3-4 giờ/ngày** cho front desk. Mobile app vẫn chạy được khi mất internet (offline mode). | Offline-first cho housekeeper. Sync khi có mạng lại. |
| **Roommaster** | Enterprise | AI Voice Concierge 24/7 trả lời khách gọi/nhắn. Ampliphi AI RMS tăng RevPAR 20%. | Voice + AI chat là tương lai gần. |
| **eviivo Suite** | Boutique 3-30 phòng | **AI-powered Unified Inbox** — gom SMS, WhatsApp, email, Booking, Airbnb, Expedia, Vrbo vào 1 màn hình. Đoạt giải Guest Engagement Innovation 2025. | **Đây là moat lớn nhất** — anh phải build Smart Inbox cho Zalo + Booking + Airbnb + Agoda + Facebook |

### 2.2. 10 xu hướng PMS 2026 (gaps trong PRD V18 hiện tại)

| # | Trend 2026 | PRD V18 có chưa? | Action |
|---|---|---|---|
| 1 | **AI co-pilot** trong mọi tác vụ (booking, reply, report) | ❌ Chưa | ➕ Bổ sung Section 3.1 |
| 2 | **Unified Smart Inbox** đa kênh | ❌ Chưa | ➕ Bổ sung Section 3.2 |
| 3 | **Autonomous Revenue Management** (dynamic pricing) | ❌ Chưa | ➕ V2.0 — Section 5 |
| 4 | **Channel Manager** 2-way sync với Booking/Airbnb/Agoda | ❌ Chưa | ➕ V1.5 — Section 3.6 |
| 5 | **Predictive staffing** (dự báo lượng booking → tự xếp ca) | ❌ Chưa | ➕ V2.0 |
| 6 | **Proactive friction detection** (cảnh báo trước khi vấn đề xảy ra) | 🟡 Một phần (no-show, late checkin) | ⬆ Mở rộng |
| 7 | **Voice input** (lễ tân nói "tạo booking cho phòng 201 từ ngày mai 2 đêm") | ❌ Chưa | ➕ V1.5 |
| 8 | **Mobile-first housekeeping** (PWA, offline mode) | ✅ Có (Module 7) | ✓ Giữ + nâng cấp offline |
| 9 | **Open API + plug-and-play integrations** | 🟡 Đang plan | ⬆ Document & expose ra OpenAPI 3.0 |
| 10 | **IoT / Smart Lock** (cấp mã cửa tự động khi check-in) | ❌ Chưa | ➕ V2.0 — partner với Igloohome/August/Ttlock |

---

## PHẦN 3 — 7 VIÊN GẠCH KHÁC BIỆT (10X COMPETITIVE ADVANTAGE)

> **Triết lý:** PRD V18 cho anh đạt parity. 7 viên gạch này cho anh **win**.

### 3.1. 🤖 AI Co-pilot "An Trợ Lý" — Nhân viên ảo 24/7

**Vấn đề user:** Owner homestay 5-30 căn không có người ngồi 8h/ngày check email Booking/Airbnb. Khách nhắn lúc 11h tối, sáng mai mới reply → khách hủy đặt sang chỗ khác.

**Giải pháp:**
- **Inline AI** trong mọi modal: gõ "/" để gọi AI suggest reply, generate báo cáo, tạo SOP cleaning, tổng hợp ý kiến khách.
- **Reply Assistant**: khi có tin nhắn mới ở Smart Inbox, AI **draft sẵn 3 phương án trả lời** theo tone (chuyên nghiệp / thân thiện / cảm ơn). Lễ tân chỉ cần chọn → gửi.
- **Daily Briefing**: 7h sáng AI gửi notification cho owner: "Hôm nay 12 lượt check-in, 8 check-out, doanh thu dự kiến 32 triệu, 2 phòng cần dọn gấp trước 14h, 1 booking đặt trên Booking.com chưa xác nhận."
- **Anomaly detection**: AI phát hiện "Tuần này doanh thu cơ sở Đà Lạt giảm 18% so tuần trước, lý do có thể là 2 đánh giá 3 sao mới trên Booking — kiểm tra ngay."

**Tech:** Claude Haiku 4.5 cho speed/cost, fallback Sonnet 4.6 cho task phức tạp. Streaming responses. Cache common templates.

**ROI cho user:** Tiết kiệm 2-3 giờ/ngày trả lời tin. Tỷ lệ phản hồi <15 phút → tăng conversion 35-50%.

---

### 3.2. 📬 Smart Unified Inbox — Đặc trưng Việt Nam

**Vấn đề user:** Owner VN dùng 5-7 app cùng lúc: Booking extranet, Airbnb host app, Agoda extranet, **Zalo OA**, Facebook Messenger, SMS, Email. Mỗi tin nhắn check ở 1 chỗ → bỏ sót, trả lời chậm.

**Giải pháp Smart Inbox:**
- **Aggregate** tất cả conversation vào 1 màn hình duy nhất.
- **Canonical guest profile**: AI tự match tin nhắn từ các kênh về cùng 1 khách (số điện thoại/email/tên + booking_id) → có lịch sử full.
- **Action buttons inline**: ngay trong tin nhắn có nút "Tạo booking", "Gửi báo giá", "Confirm cọc", "Send check-in instruction" — không phải copy-paste sang module khác.
- **Macro replies bằng tiếng Việt**: 50 template sẵn cho VN (giá thuê, hướng dẫn check-in, chính sách hủy, gửi mã wifi, gửi địa chỉ Google Maps).

**Đặc trưng VN — Đây là điểm Cloudbeds/Mews KHÔNG bao giờ có:**

| Kênh | Tích hợp | Độ ưu tiên |
|---|---|---|
| **Zalo OA** | Zalo OA Open API | 🔴 V1.0 — bắt buộc |
| **Facebook Messenger** | Meta Conversations API | 🔴 V1.0 — bắt buộc |
| **Booking.com** | Booking.com Connectivity API | 🟠 V1.5 |
| **Airbnb** | Airbnb Partner API (cần PMS partnership) | 🟠 V1.5 |
| **Agoda YCS** | Agoda YCS API | 🟡 V2.0 |
| **WhatsApp Business** | WhatsApp Cloud API | 🟡 V2.0 |
| Email (IMAP/SMTP) | Gmail API + Outlook Graph | 🟢 V1.0 nếu có thời gian |
| SMS | eSMS/Speedsms VN | 🟢 V1.5 |

**Tech:** Webhook listeners → message queue (Supabase Realtime hoặc Redis) → normalize message schema → store ở `messages` table → render Smart Inbox UI.

**ROI cho user:** Giảm 70% thời gian quản lý đa kênh. **Đây là USP # 1 — quảng cáo: "Tất cả tin nhắn của bạn — Booking, Airbnb, Zalo, Facebook — trên 1 màn hình duy nhất."**

---

### 3.3. 🎙️ Voice-to-Booking — Lễ tân nói, hệ thống tạo

**Vấn đề user:** Lễ tân đang đón 1 đoàn khách walk-in 10 người. Cùng lúc điện thoại reo, có khách đặt phòng. Lễ tân không thể bỏ khách trước mặt để gõ form 12 fields.

**Giải pháp:**
- Nút mic trong AddBookingModal.
- Lễ tân **nói**: "Đặt phòng 201 cho chú Nam, số điện thoại 0987654321, từ ngày mai đến chủ nhật, 2 người, đã cọc 500 nghìn."
- Whisper API → parse → fill form → confirm modal.
- **2026 baseline:** TalkType (iOS), Wispr Flow (cross-platform) đã quá phổ biến. PMS có voice là chuẩn, không phải gimmick.

**Tech:** OpenAI Whisper API hoặc Google Speech-to-Text VN tiếng Việt. Cost ~$0.006/phút — 100 booking/ngày = $1.8/tháng.

---

### 3.4. 🔮 Predictive Cleaning & Occupancy

**Vấn đề user:** Phòng 301 booking từ 13/5 đến 16/5. Phòng 301 **kế tiếp** booking từ 16/5 14h. Housekeeper chỉ có 2 người, đang dọn phòng khác. Nếu không cảnh báo trước → 14h khách check-in mà phòng còn bẩn → chargeback Booking, đánh giá 1 sao.

**Giải pháp:**
- Hệ thống quét **24h tới** mỗi 15 phút.
- Phát hiện phòng có check-in sắp tới (< 6 giờ) chưa "Đã dọn" → push notification cho Trưởng buồng phòng.
- Hệ thống ước lượng workload: "Cần 3 giờ để dọn 5 phòng, hiện có 2 housekeeper → cần thêm 1 người ca chiều."
- Tích hợp với module Staff (Module 11 trong PRD V18) — gợi ý gọi ai.

**Bonus — Occupancy forecast:** Dự báo 7-30 ngày tới dựa trên:
- Booked bookings hiện tại
- Lịch sử cùng kỳ năm trước
- Các sự kiện local (concert, lễ hội — fetch từ Google Calendar API hoặc nhập tay)
- Holiday calendar VN (Tết, 30/4, 2/9, lễ vía)

**ROI cho user:** Giảm 90% complaint "phòng chưa dọn xong khi check-in". Tăng NPS 20-30 điểm.

---

### 3.5. 💰 Owner P&L Real-time + Investor Portal

**Vấn đề user:** Chủ chuỗi homestay có 5 nhà đầu tư, mỗi người góp tiền vào 2-3 cơ sở. Mỗi cuối tháng owner phải làm 5 bản Excel khác nhau gửi từng nhà đầu tư. Sai số liệu → mất uy tín.

**Giải pháp Investor Portal (RBAC nâng cao):**
- Mỗi nhà đầu tư có account riêng, **chỉ thấy** cơ sở mình đầu tư.
- Dashboard hiển thị: Doanh thu, Chi phí, Lợi nhuận, ROI %, So sánh vs targeted.
- **Real-time** — không phải báo cáo cuối tháng. Investor mở app 11h tối là biết hôm nay cơ sở mình thu được bao nhiêu.
- Export PDF báo cáo có thương hiệu cơ sở.
- Notification khi có biến động lớn (lợi nhuận giảm > 20% so tháng trước).

**Đây là feature mà Cloudbeds/Mews KHÔNG có** — vì họ build cho boutique hotel có 1 owner, không phải mô hình "nhà đầu tư + đối tác vận hành" rất phổ biến ở VN.

---

### 3.6. 🔌 Channel Manager Lite (V1.5)

**Vấn đề user:** Owner phải vào Booking extranet, Airbnb host app, Agoda YCS để cập nhật giá + availability mỗi ngày. 5 cơ sở × 3 OTA = 15 lần update/ngày. Sai lệch → overbooking → khách giận → 1 sao.

**Giải pháp 2-way sync:**

| Hướng | Data | Frequency |
|---|---|---|
| PMS → OTA | Availability, Rates, Stop-sell | Real-time (webhook) |
| OTA → PMS | New bookings, Modifications, Cancellations | Real-time (webhook) |

**Lưu ý quan trọng:** Direct API integration với Booking/Airbnb/Agoda **rất tốn thời gian** (mỗi cái 3-6 tháng partnership process). 

**Strategy:**
- **V1.0**: Thủ công — owner copy data từ OTA về (như An Nhiên hiện tại). Không build gì cho lý do tiết kiệm thời gian phát triển.
- **V1.5**: Tích hợp qua **iCal sync** (Booking & Airbnb đều support) — đơn giản, free, 1-way. Đủ cho 80% case (chống overbooking).
- **V2.0**: Direct API partnership với các OTA lớn nhất. Hoặc tích hợp **SiteMinder/MyAllocator** làm middleware (họ đã connect 100+ OTA, ta chỉ tích hợp 1 lần).

---

### 3.7. 🇻🇳 Vietnamese-First DNA — "Made in Vietnam, for Vietnam"

**Đây không phải là feature, đây là philosophy thấm vào mọi quyết định:**

| Khía cạnh | Vietnamese-first | Global PMS |
|---|---|---|
| **Tiền tệ** | VND có chấm phân cách `1.250.000` | USD/EUR formats |
| **Số điện thoại** | Format VN `0987.654.321` + tự động detect số 84 | International only |
| **Date format** | `DD/MM/YYYY` mặc định | MM/DD/YYYY hoặc cài đặt |
| **Holiday calendar** | Tết âm lịch, 30/4, 2/9, vía Phật, vía Bà | Western holidays |
| **Pricing strategies** | Theo khung giờ "ngày trong tuần" + "cuối tuần" + "ngày lễ" — đặc trưng VN | Yearly seasonality |
| **Kênh thanh toán** | VietQR (1 quét chuyển khoản), Momo, ZaloPay, ShopeePay | Stripe/PayPal |
| **Hóa đơn** | Hóa đơn điện tử VN (E-invoice nghị định 123) | Generic invoice |
| **Báo cáo cơ quan** | Khai báo lưu trú công an phường (theo Nghị định 13/2024) | None |
| **Ngôn ngữ** | Tiếng Việt 100%, không có "Booking" "Confirmation" "Status" lai | English-first translation |
| **Support** | Zalo OA hỗ trợ, gọi điện trực tiếp, không phải vé Zendesk | Email/chat tickets |

**Khai báo lưu trú công an** là **moat cứng** — Cloudbeds/Mews **không bao giờ** build feature này. PMS nào ở VN làm được tự động hóa khai báo lưu trú = giảm 30-60 phút/ngày cho lễ tân = lý do duy nhất để chuyển từ Excel sang.

---

## PHẦN 4 — 8 UX PATTERN HIỆN ĐẠI 2026 BẮT BUỘC PHẢI CÓ

> Cái này áp dụng vào toàn bộ giao diện, không phải tính năng riêng lẻ.

### 4.1. ⌨️ Command Palette `Cmd+K` / `Ctrl+K`

**Triết lý:** Power user (lễ tân lành nghề) không thao tác bằng chuột — họ thao tác bằng phím tắt.

**Pattern (giống Linear, Notion, Figma):**
```
Bấm Cmd+K → spotlight modal mở giữa màn hình
Gõ: "tạo booking phòng 201 ngày mai"
→ AI parse intent → mở AddBookingModal pre-filled
```

**Các action ưu tiên trong palette:**
- Tạo booking mới (Cmd+B)
- Tìm khách (Cmd+G)
- Tìm phòng (Cmd+R)
- Mở Timeline tuần này (Cmd+1)
- Mở Báo cáo doanh thu (Cmd+9)
- Switch cơ sở (Cmd+P)
- Toggle dark mode (Cmd+Shift+D)

**Implement:** `cmdk` package (cmdk.paco.me) — ngôn ngữ chung của shadcn/ui ecosystem.

---

### 4.2. 📅 Timeline View Đẳng Cấp Mews

PRD V18 đã có Timeline. Để đẳng cấp Mews, cần **8 chi tiết nhỏ**:

| # | Detail | Implement |
|---|---|---|
| 1 | **Drag-and-drop** booking giữa các phòng | `@dnd-kit/core` |
| 2 | **Resize handle** kéo giãn checkout time | Custom drag listener |
| 3 | **Real-time conflict detection** — khi drag vào phòng có booking khác, viền đỏ đổ + tooltip "Trùng lịch với Trần Thị B" | Server-side validation + optimistic UI |
| 4 | **Buffer visualization** — vùng xám 30 phút giữa 2 booking để báo "phòng đang dọn" | CSS pseudo-element |
| 5 | **Time-of-day grid lines** mảnh, mỗi 6h | Tailwind `border-l-px` |
| 6 | **Now indicator** — vạch đỏ horizontal cho thời điểm hiện tại | JS interval 1 phút |
| 7 | **Color coding theo nguồn**: Zalo (xanh dương Zalo), Facebook (xanh FB), Booking (xanh dương đậm), Airbnb (đỏ AB), Walk-in (xám), Direct (xanh lá) | Map từ `bookings.source` field |
| 8 | **Hover preview card** — hover vào booking block hiện popover với 8 fields chính trong 0.3s | Radix Tooltip + delayDuration |

---

### 4.3. 🎨 Design Tokens — Hệ màu chuẩn shadcn/ui v2

**Brand identity gợi ý** (anh có thể tinh chỉnh):

```css
/* Light mode */
--primary: 25 75% 45%;        /* Cam đất hospitality - 2026 trend */
--secondary: 142 30% 35%;     /* Xanh sage subtle */
--accent: 210 100% 50%;       /* Xanh action - CTA */
--success: 142 70% 40%;       /* Xanh OK */
--warning: 38 92% 50%;        /* Vàng cảnh báo */
--destructive: 0 75% 50%;     /* Đỏ hủy/xoá */
--muted: 220 14% 96%;         /* Xám nền nhẹ */

/* Status colors cho Booking blocks */
--booking-confirmed: 142 70% 40%;  /* xanh */
--booking-pending: 38 92% 50%;     /* vàng */
--booking-checked-in: 210 100% 50%; /* xanh dương */
--booking-checked-out: 220 9% 46%;  /* xám */
--booking-cancelled: 0 75% 50%;     /* đỏ */
--booking-no-show: 280 65% 60%;     /* tím */

/* Cleaning status */
--room-clean: 142 70% 40%;
--room-cleaning: 38 92% 50%;
--room-dirty: 0 75% 50%;
--room-maintenance: 220 9% 46%;
```

**Typography:**
- **Inter** cho UI text (free, Latin Extended, hỗ trợ tiếng Việt đầy đủ).
- **JetBrains Mono** cho số (alignment table, không lệch).
- **Manrope** hoặc **Geist** thay thế Inter nếu muốn tone hơi premium hơn.

**Spacing:** 4/8/12/16/24/32/48/64 — strict 4dp grid.

---

### 4.4. 📱 Mobile-First Housekeeper PWA

**Use case:** Cô Bảy (housekeeper, 45 tuổi) chỉ có Android giá rẻ. Vào nhà mạng yếu, mạng lúc có lúc không.

**Pattern:**
- **PWA** (không phải native app) — install qua "Add to Home Screen", không phải tải Play Store.
- **Offline-first** — IndexedDB lưu danh sách phòng cần dọn, queue ảnh upload khi mất mạng.
- **Camera native API** — bấm "Chụp 8 ảnh" → mở camera Android trực tiếp, mỗi ảnh có overlay hướng dẫn ("Ảnh 1/8: Toàn cảnh phòng").
- **One-tap status update** — chỉ 3 nút lớn: 🔴 Bắt đầu | 📷 Chụp ảnh | ✅ Hoàn thành.
- **Vietnamese voice prompt** — "Đã dọn xong phòng" → bấm voice, máy ghi nhận.

**Tech:** Next.js 14 PWA support sẵn (next-pwa), Workbox cho service worker, Supabase Storage offline queue.

---

### 4.5. 🔔 Notification Smart (không spam)

**Vấn đề:** PMS thường ping liên tục → user mute hết → bỏ lỡ thông tin quan trọng.

**Pattern Smart Notification:**

| Loại | Channel | Thời điểm |
|---|---|---|
| **Critical** (booking trùng, payment fail) | Push + Email + Zalo | Real-time |
| **High** (booking mới, check-in/out 30 phút nữa) | Push + Bell icon | Real-time |
| **Medium** (phòng cần dọn, low stock cleaning supplies) | Bell icon | Batched 30 phút/lần |
| **Low** (báo cáo cuối ngày, KPI tuần) | Email digest | 7h sáng hàng ngày |

**Anti-pattern phải tránh:**
- ❌ Push notification cho mọi thứ.
- ❌ Đếm số đỏ trên badge tăng vô hạn (15+ → "15+" max).
- ❌ Notification không có CTA → user xem rồi bỏ qua.

---

### 4.6. ⚡ Empty States & Loading — Cảm xúc tích cực

**Triết lý:** Empty state là cơ hội tốt nhất để **dạy user** dùng tính năng.

**Ví dụ:**

❌ **Tệ:** "Không có booking nào."

✅ **Tốt:** 
```
┌─────────────────────────────────┐
│   📅 (illustration)             │
│                                  │
│  Chưa có booking nào tuần này   │
│                                  │
│  Tạo booking đầu tiên hoặc      │
│  import từ Booking/Airbnb        │
│                                  │
│  [+ Tạo booking] [⬇ Import]    │
└─────────────────────────────────┘
```

**Loading states:**
- Skeleton screens cho data lists (không phải spinner)
- Optimistic UI cho các action quick (tick checkbox, toggle status)
- Progress bar có % thực cho long action (export báo cáo)

---

### 4.7. 🌗 Dark Mode (không phải optional)

2026 — dark mode là chuẩn. Lễ tân làm ca đêm cần dark mode để bảo vệ mắt. PMS quốc tế nào không có dark mode = giảm điểm review trên Hotel Tech Report ngay.

**Implement:** `next-themes` package + Tailwind `dark:` variants. Toggle ở header. Persist localStorage.

---

### 4.8. ♿ Accessibility — Không phải nice-to-have

- Contrast ratio 4.5:1 (AA standard).
- Keyboard navigation đầy đủ (Tab, Enter, Esc, Arrow keys).
- Focus rings rõ ràng (2px ring).
- ARIA labels cho icon-only buttons.
- Error messages **gần field**, không phải trên top form.
- Hỗ trợ font size scaling lên 200% không vỡ layout.

**Tại sao quan trọng?** 5-10% nhân viên homestay là trung niên 50+ tuổi mắt kém. UI không readable = họ chuyển sang dùng Excel.

---

## PHẦN 5 — ROADMAP 12 THÁNG (3 PHASE)

### 🚀 Phase 1: V1.0 MVP — 3 tháng (T6-T8/2026)

**Mục tiêu:** Ship 1 sản phẩm **đủ tốt để thay thế Excel + Hotel Manager**.

**Modules ship:**
- ✅ M1: Auth + RBAC (Owner/Manager/Receptionist/Housekeeper/Investor)
- ✅ M2: Multi-property setup
- ✅ M3: Room types + Rate plans + Inventory
- ✅ M4: AddBookingModal với validation đầy đủ (PRD V18)
- ✅ M5: Timeline View **đẳng cấp Mews** (8 detail ở Section 4.2)
- ✅ M6: Table View với KPI cards
- ✅ M7: Housekeeping flow + Mobile PWA cho cô Bảy
- ✅ M8: Booking Details Modal (Check-in, Check-out, Payment)
- ✅ M9: Smart Inbox **chỉ Zalo + FB** (V1.0 — đặc trưng VN)
- ✅ M10: Dashboard với 6 KPI cards + Recent bookings + Operational alerts
- ✅ M11: Khai báo lưu trú công an (Nghị định 13/2024) — **moat đặc biệt VN**
- ✅ M12: Expense management cơ bản
- ✅ M13: P&L Report drill-down (Chuỗi → Cơ sở → Phòng)
- ✅ M14: Settings (Cơ sở, Phòng, Nhân viên, Giá)
- ✅ M15: Google Sheets backup (như PRD V18 đã quyết định)

**Tech check:**
- Next.js 14 App Router + TypeScript (strict)
- Tailwind v3 + shadcn/ui
- Supabase: Auth + Database (Postgres) + Storage + Realtime
- Vercel deploy
- Stripe Vietnam (hoặc VNPAY/Momo) cho subscription billing

**KPI V1.0:**
- 50 properties pilot trong 60 ngày sau launch
- NPS 50+
- DAU/MAU > 60%
- Tickets support < 5%/user/tháng

---

### 🌟 Phase 2: V1.5 — 3 tháng tiếp (T9-T11/2026)

**Mục tiêu:** Thắng An Nhiên Homestay + tiếp cận chuỗi 30+ phòng.

**Bổ sung:**
- ➕ AI Co-pilot "An Trợ Lý" (Section 3.1) — Reply Assistant + Daily Briefing
- ➕ Unified Inbox **mở rộng**: + Booking iCal sync, Airbnb iCal sync, Email IMAP
- ➕ Voice Input cho AddBookingModal (Whisper API)
- ➕ Predictive Cleaning alerts
- ➕ Investor Portal đầy đủ
- ➕ Command Palette `Cmd+K`
- ➕ Dark mode
- ➕ Channel Manager Lite (iCal 1-way)
- ➕ Mobile app cho Owner (PWA)

**KPI V1.5:**
- 300 properties active
- ARR $500K-$1M
- Featured trên Vietcetera/Genk/Saigoneer

---

### 🚁 Phase 3: V2.0 — 6 tháng (T12/2026 - T5/2027)

**Mục tiêu:** Thắng Cloudbeds/Mews ở thị trường VN. Mở rộng SEA.

**Bổ sung:**
- ➕ Channel Manager full (direct API Booking/Airbnb/Agoda — partnership)
- ➕ Dynamic Pricing AI (Atomize-style — RevPAR +20%)
- ➕ Predictive Staffing
- ➕ Smart Lock integration (Igloohome/August/TTLock)
- ➕ Guest App (mobile) cho khách self-check-in, request thêm khăn, gọi housekeeping
- ➕ Loyalty program built-in
- ➕ Booking Engine cho website riêng của owner (commission-free)
- ➕ Marketplace tích hợp 50+ third-party tools (POS, accounting, IoT)
- ➕ Mở rộng cho **Spa, Nail, Massage, Sân golf, Sân bóng** (target market thứ 2 anh đã đề cập)

**KPI V2.0:**
- 2,000 properties active
- ARR $5M+
- Mở rộng Thái Lan, Indonesia, Philippines

---

## PHẦN 6 — CHỈ THỊ HANDOFF CHO ANTIGRAVITY

### 6.1. Thứ tự build (KHÔNG được đảo)

> Antigravity sẽ generate UI/code theo thứ tự này. Đây là **critical path**, đừng để AI tự sắp xếp.

1. **Auth + Layout shell** (sidebar + topbar)
2. **Settings → Properties** (anh phải có cơ sở trước khi add phòng)
3. **Settings → Rooms** (anh phải có phòng trước khi add booking)
4. **Settings → Rate Plans** (giá cơ bản trước khi add booking có giá)
5. **Settings → Staff** (RBAC, có nhân viên để gán)
6. **Timeline View** (HERO FEATURE — build kỹ)
7. **AddBookingModal** (validation chống overbooking)
8. **BookingDetailsModal** (check-in, check-out, payment)
9. **Table View** (KPI cards + bảng booking)
10. **Dashboard** (4 quadrants: KPI/Charts/Recent/Alerts)
11. **Housekeeping** (Desktop + Mobile PWA)
12. **Smart Inbox** (Zalo + FB integration)
13. **Reports** (P&L, Occupancy, ADR/RevPAR)
14. **Khai báo lưu trú** (export CSV theo template công an)
15. **Investor Portal** (filtered view của Reports)

### 6.2. Component Library Priority

**Build đầu tiên** (atom level) — dùng shadcn/ui:
`Button`, `Input`, `Select`, `DatePicker`, `Dialog`, `DropdownMenu`, `Badge`, `Avatar`, `Tooltip`, `Tabs`, `Skeleton`, `Toast` (Sonner).

**Build composite** (molecule level):
`KPICard`, `BookingBlock` (Timeline), `RoomRow` (Timeline), `StatusPill`, `PropertySwitcher`, `DateRangePicker`, `EmptyState`, `LoadingState`.

**Build feature** (organism level):
`AddBookingModal`, `BookingDetailsModal`, `TimelineCanvas`, `KPIGrid`, `RecentBookingsList`, `OperationalAlerts`, `OccupancyDonut`, `RevenueLineChart`.

### 6.3. Master Prompt Template cho Antigravity

```
You are building a Property Management System (PMS) SaaS for Vietnamese 
homestay/hotel chains. Stack: Next.js 14 App Router + TypeScript strict + 
Tailwind v3 + shadcn/ui + Supabase + cmdk + dnd-kit + recharts.

CRITICAL CONSTRAINTS:
- All UI text in Vietnamese (no English fallback)
- VND currency format: 1.250.000đ (dot separator)
- Date format: DD/MM/YYYY
- Phone format: 0987.654.321 (Vietnamese)
- Mobile-first responsive (test 375px first)
- Dark mode default
- All status colors must follow design tokens in `/styles/tokens.css`
- Touch targets minimum 44x44px
- All forms must have inline validation (zod)
- All modals must support Esc to close, Cmd+Enter to submit
- All tables must support keyboard navigation (Arrow keys, Enter, Esc)

TIMELINE VIEW (HERO FEATURE) MUST HAVE:
1. Drag-and-drop bookings between rooms (@dnd-kit/core)
2. Resize bookings to extend checkout (custom drag handle)
3. Real-time conflict detection (red border + toast on collision)
4. Buffer visualization (30min gray zone between bookings)
5. Now indicator (red horizontal line for current time)
6. Color coding by source: Zalo blue, FB blue, Booking dark blue, 
   Airbnb red, Walk-in gray, Direct green
7. Hover preview card with 8 key fields (300ms delay)
8. Click → open BookingDetailsModal

REFERENCES:
- Visual style: Mews + Linear (clean, minimalist, premium)
- Density: Cloudbeds (more info per screen for power users)
- Mobile: Hotelogix (offline-first PWA pattern)
- AI: Cursor's `Cmd+K` command palette

DO NOT:
- Use emojis as icons (use Lucide React)
- Hardcode colors (use design tokens)
- Use React Server Components for highly interactive views (Timeline, Inbox)
- Forget loading skeletons + empty states for every list view
```

### 6.4. Hero Screens Specification (3 màn hình build trước)

**Màn 1 — Timeline View** (`/bookings/timeline`)
- Layout: Sidebar 240px + Topbar 64px + Main canvas
- Topbar có: PropertySwitcher + DateRangeSwitcher + Filter button + ViewToggle (Timeline/Table) + AddBookingBtn (primary)
- Main: Sticky room column (200px) + horizontal scrollable timeline (24h × 7 ngày)
- Bottom: Legend màu + Now indicator info

**Màn 2 — Smart Inbox** (`/inbox`)
- Layout: 3 column (như Gmail/Linear): Conversation list (320px) | Message thread (flex-1) | Guest profile (360px)
- Conversation list: filter by channel (Tất cả / Zalo / FB / Booking / Airbnb), sort by unread/recent
- Message thread: bubble UI, sender avatar, channel icon, timestamp, action buttons inline (Tạo booking, Gửi báo giá)
- Guest profile: avatar lớn, contact info, booking history (5 gần nhất), notes, tags

**Màn 3 — Dashboard** (`/dashboard`)
- Layout: 12-col grid responsive
- Row 1: 6 KPI cards (col-span-2 mỗi cái) — same as An Nhiên
- Row 2: Revenue line chart (col-span-8) + Occupancy donut (col-span-4)
- Row 3: Recent bookings list (col-span-6) + Operational alerts (col-span-6)
- Row 4: Staff performance bar (col-span-7) + Summary report (col-span-5)
- All cards có: hover state, click → drill-down, skeleton loading

---

## PHẦN 7 — RỦI RO & MITIGATION

| Rủi ro | Mức độ | Mitigation |
|---|---|---|
| **Cloudbeds/Mews vào VN** | 🔴 Cao | Vietnamese-first DNA + Khai báo lưu trú = moat. Pricing dưới họ 50%. Build cộng đồng owner VN sớm. |
| **Booking.com/Airbnb đổi API** | 🟠 Trung | iCal là fallback. Direct API là V2.0 — chấp nhận risk. |
| **AI cost vượt tầm kiểm soát** | 🟠 Trung | Cache common templates. Haiku 4.5 cho 90% case. Rate limit free tier. |
| **Supabase scale issue** | 🟡 Thấp | Postgres horizontal scaling sẵn. Có thể migrate Neon/PlanetScale nếu cần. |
| **Owner VN ngại đổi từ Excel** | 🔴 Cao | Free import từ Excel/Sheets. Onboarding 1-1 cho 100 customer đầu. Video tutorial tiếng Việt. |
| **Lễ tân không quen tech** | 🟠 Trung | UX simple như Hotel Manager Apps Script (familiar pattern). Tutorial overlay first time. Voice input giảm friction. |
| **Khai báo lưu trú thay đổi (luật mới)** | 🟡 Thấp | Theo dõi Nghị định, modular code. |

---

## PHẦN 8 — CÁC METRIC ĐO LƯỜNG THÀNH CÔNG

### Product metrics
- Time-to-First-Booking (TTFB): < 5 phút từ signup
- Daily Active Users / Monthly Active Users: > 60%
- Booking creation latency (P95): < 200ms
- Mobile housekeeper task completion: > 95% với 8 ảnh
- Smart Inbox response time avg: < 15 phút (so chuẩn industry)

### Business metrics
- Customer Acquisition Cost: < $50 (organic + Zalo Ads VN)
- Net Revenue Retention: > 110%
- Logo churn: < 3%/tháng
- ARR/Customer (median): $20-40/tháng/property

### Marketing metrics
- 1 test "Excel killer" — owner switch từ Excel/Sheets sang trong 1 tuần
- 5 case study/quý — homestay show trước/sau
- 1 cộng đồng Facebook 5,000+ owner trong 12 tháng

---

## KẾT LUẬN — MỘT TRANG CUỐI CÙNG

Anh đã làm đúng khi xây PRD V18 + Architecture v2.0 — đó là 70% công việc. 30% còn lại là **làm cho sản phẩm có hồn**:

1. **AI là DNA**, không phải bolt-on. Mỗi modal có "/" → AI Co-pilot.
2. **Vietnamese-first**, không phải dịch từ tiếng Anh. Khai báo lưu trú là moat.
3. **Mobile PWA cho cô Bảy**, không phải responsive desktop.
4. **Smart Inbox đa kênh** là USP # 1 cho marketing — quảng cáo: "Booking, Airbnb, Zalo, Facebook trên 1 màn hình."
5. **Timeline đẳng cấp Mews** — anh sẽ thấy lễ tân nói "Wow" lần đầu mở.
6. **Owner P&L real-time + Investor Portal** — feature mà global PMS không có vì họ không hiểu mô hình VN.
7. **Channel Manager iCal V1.5** — không cần direct API ngay, iCal đủ chống overbooking 80%.

Tài liệu này + PRD V18 + Architecture v2.0 là **package hoàn chỉnh** đưa Antigravity. Antigravity đọc xong sẽ generate được:
- Design system + tokens
- Component library
- 15 modules theo thứ tự ưu tiên
- Hero screens với spec cụ thể
- Master prompt sẵn dùng

**Quote of the day cho anh:**
> "PMS tốt nhất 2026 không phải có nhiều feature nhất. Là cái có ít feature thừa nhất, mà mỗi feature đều đúng người, đúng việc, đúng lúc."
> — Mews, "user disengagement" philosophy

---

*Tài liệu chuẩn bị bởi: AI Director R&D | 7/5/2026 | v1.0*
*Ready for: Antigravity AI Design & Code Generation*
*Next step: Đưa file này + PRD V18 + Architecture v2.0 vào Antigravity → bắt đầu build Timeline View*
