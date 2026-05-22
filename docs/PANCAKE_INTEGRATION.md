# Pancake Multi-Channel Messaging Integration

Tích hợp Pancake vào StayOS Smart Inbox — đồng bộ tin nhắn từ
Facebook, Instagram, TikTok, Zalo.

---

## 📋 Prerequisites

- ✅ Tài khoản Pancake (https://pancake.vn)
- ✅ Các kênh đã kết nối trong Pancake (Facebook, Instagram, TikTok, Zalo)
- ✅ Pancake API access token

---

## 🔌 Cách Pancake API hoạt động

Pancake chạy trên nền tảng `pages.fm`. Auth qua **`access_token`** dạng
query param (KHÔNG phải Bearer header).

Có 2 cấp token:

| Token | Lấy ở đâu | Dùng để |
|-------|-----------|---------|
| **account access_token** | Bạn tạo trong Pancake Settings | List pages |
| **page_access_token** | StayOS tự gọi `generate_page_access_token` | Đọc/gửi tin của 1 page |

Endpoint chính:

| Method | Path | Mục đích |
|--------|------|----------|
| GET  | `/v1/pages` | List các page |
| POST | `/v1/pages/{id}/generate_page_access_token` | Lấy page token |
| GET  | `/public_api/v1/pages/{id}/conversations` | List hội thoại |
| GET  | `/public_api/v1/pages/{id}/conversations/{cid}/messages` | List tin nhắn |
| POST | `/v1/pages/{id}/conversations/{cid}/messages` | Gửi tin nhắn |

---

## 🔧 Bước 1: Lấy Pancake API access token

1. **Đăng nhập** → https://pancake.vn
2. Chọn workspace có các page cần đồng bộ
3. Vào **Cài đặt** → mục **Cấu hình** / **Pancake API**
4. Bấm **Tạo access token**, cấp quyền `manage_pages` cho các page
5. **Copy access token** → đây là `PANCAKE_API_KEY`

> StayOS tự gọi `generate_page_access_token` cho từng page — bạn KHÔNG
> cần tạo token riêng cho mỗi page.

---

## ⚙️ Bước 2: Cấu hình StayOS

Tạo file `.env.local` ở thư mục gốc (file này bị git-ignore):

```env
PANCAKE_API_KEY=your_account_access_token
PANCAKE_API_BASE=https://pages.fm/api
```

Restart dev server: `npm run dev`

---

## 🚀 Bước 3: Sử dụng trong Component

```tsx
import { usePancakeMessages } from '@/hooks/usePancakeMessages';

export function SmartInbox() {
  const { messages, loading, error, sync } = usePancakeMessages();

  if (loading) return <div>Loading messages...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <button onClick={sync}>Refresh</button>
      {messages.map((msg) => (
        <div key={msg.id}>
          <strong>{msg.guestName}</strong> ({msg.channel})
          <p>{msg.message}</p>
          <small>{msg.timestamp.toLocaleString('vi-VN')}</small>
        </div>
      ))}
    </div>
  );
}
```

---

## 📡 StayOS API Endpoints

### GET /api/pancake/sync

Lấy tất cả hội thoại từ mọi page.

```bash
curl http://localhost:3002/api/pancake/sync
```

```json
{
  "success": true,
  "count": 42,
  "pages": 3,
  "messages": [
    {
      "id": "conv_123",
      "conversationId": "conv_123",
      "pageId": "page_456",
      "customerId": "cus_789",
      "guestName": "Nguyễn Văn A",
      "guestPhone": "0901234567",
      "message": "Cho mình hỏi có phòng không?",
      "timestamp": "2026-05-22T10:30:00Z",
      "channel": "facebook",
      "isIncoming": true
    }
  ],
  "synced_at": "2026-05-22T14:35:00Z"
}
```

### POST /api/pancake/send

Trả lời khách qua Pancake.

```bash
curl -X POST http://localhost:3002/api/pancake/send \
  -H "Content-Type: application/json" \
  -d '{"pageId":"page_456","conversationId":"conv_123","message":"Còn phòng nhé ạ!"}'
```

---

## 🔄 Auto-sync Behavior

- ✅ Auto-sync mỗi **5 phút** (xem `usePancakeMessages.ts`)
- ✅ Sync khi component mount
- ✅ Manual sync bằng button
- ✅ Tin mới nhất hiển thị trước

---

## 🛠️ Troubleshooting

### `PANCAKE_API_KEY is not configured`

→ `.env.local` thiếu key hoặc chưa restart server.

### `Pancake /pages failed: 401`

→ access_token sai hoặc hết hạn. Tạo token mới trong Pancake Settings.

### Tin nhắn không update

1. Page đã kết nối kênh trong Pancake chưa?
2. Token có quyền `manage_pages` cho page đó không?
3. Mở Network tab xem response `/api/pancake/sync`.

---

## 🔐 Security Notes

- ✅ `PANCAKE_API_KEY` chỉ ở `.env.local` / `.env.production` (server-side)
- ✅ Token không bao giờ lộ ra client — mọi call đi qua `/api/pancake/*`
- ✅ `.env*` đã bị git-ignore (trừ `.env.example`)

---

## 📈 Next Steps

1. ✅ Sync messages từ Pancake
2. ✅ Gửi tin nhắn qua `/api/pancake/send`
3. 🔄 Wire `/api/pancake/send` vào nút Reply trong Smart Inbox UI
4. 💾 Lưu messages vào database (persistence)
5. 🔔 Webhooks thay cho polling 5 phút (realtime)

---

## 📞 Support

- Pancake API Docs: https://developer.pancake.biz
- Pancake Docs: https://docs.pancake.biz
