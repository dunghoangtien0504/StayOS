export interface QuickReply {
  id: string;
  shortcut: string;    // e.g. "BG", "HG", "XACNHAN"
  message: string;     // template text
  imageUrls?: string[]; // optional attached image paths (relative or absolute)
}

const STORAGE_KEY = 'stayos_quick_replies';

const DEFAULTS: QuickReply[] = [
  { id: '1', shortcut: 'XIN', message: 'Xin chào bạn! Ta Thong Dong Homestay rất vui được phục vụ bạn 🏠✨' },
  { id: '2', shortcut: 'BG', message: 'Dạ Home gửi mình báo giá chương trình Ưu Đãi tháng này của Home để mình tham khảo nhé ạ 💕' },
  { id: '3', shortcut: 'HG', message: 'Dạ mình cho Home thông tin ngày – giờ nhận phòng – trả phòng, số lượng khách chính xác, để Home kiểm tra lịch trống cho mình nha 🧡' },
  { id: '4', shortcut: 'CK', message: 'Để Home giữ phòng và chuẩn bị chu đáo cho mình, bạn vui lòng chuyển khoản đặt cọc giúp Home nhé ạ 🙏' },
  { id: '5', shortcut: 'XACNHAN', message: 'Dạ Ta Thong Dong đã nhận được thông tin đặt phòng của mình rồi ạ! Home sẽ liên hệ xác nhận sớm nhé 💯' },
  { id: '6', shortcut: 'CAMTU', message: 'Cảm ơn bạn rất nhiều vì đã tin tưởng chọn Ta Thong Dong Homestay ❤️ Rất mong được đón tiếp bạn!' },
  { id: '7', shortcut: 'HUONG', message: 'Địa chỉ: Ta Thong Dong Homestay – bạn có thể đặt Grab hoặc xe ôm công nghệ đến nhé ạ, Home sẽ ra đón mình 🏍️' },
  { id: '8', shortcut: 'FULL', message: 'Dạ rất tiếc Home đã kín phòng trong thời gian đó rồi ạ 😔 Bạn có muốn Home kiểm tra ngày khác không?' },
];

export function getQuickReplies(): QuickReply[] {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export function saveQuickReplies(replies: QuickReply[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(replies));
}
