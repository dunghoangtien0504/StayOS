import { Room, Settings } from "./types";

export function calculateNights(checkIn: Date, checkOut: Date): number {
  const diffTime = checkOut.getTime() - checkIn.getTime();
  if (diffTime <= 0) return 0;
  return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
}

function isWeekend(date: Date): boolean {
  const day = date.getDay(); // 0=Sun, 5=Fri, 6=Sat
  return day === 0 || day === 5 || day === 6;
}

function isPeakDate(date: Date, peakDates: string[]): boolean {
  const s = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return peakDates.includes(s);
}

/**
 * Tính tổng tiền phòng theo từng đêm, áp giá cuối tuần & ngày lễ nếu có.
 */
export function calculateBookingTotal(room: Room, checkIn: Date, checkOut: Date, pricingSettings?: Settings['pricing']): number {
  const nights = calculateNights(checkIn, checkOut);
  if (!pricingSettings || (pricingSettings.weekendMultiplier === 1 && pricingSettings.peakDates.length === 0)) {
    return nights * room.basePrice;
  }

  let total = 0;
  const cursor = new Date(checkIn);
  cursor.setHours(0, 0, 0, 0);

  for (let i = 0; i < nights; i++) {
    const peakDates = pricingSettings.peakDates || [];
    let multiplier = 1;
    if (isPeakDate(cursor, peakDates) && pricingSettings.peakMultiplier > 1) {
      multiplier = pricingSettings.peakMultiplier;
    } else if (isWeekend(cursor) && pricingSettings.weekendMultiplier > 1) {
      multiplier = pricingSettings.weekendMultiplier;
    }
    total += room.basePrice * multiplier;
    cursor.setDate(cursor.getDate() + 1);
  }
  return Math.round(total);
}

/** Tính giá cho 1 đêm cụ thể (dùng cho preview trong form đặt phòng) */
export function getNightPrice(room: Room, date: Date, pricingSettings?: Settings['pricing']): number {
  if (!pricingSettings) return room.basePrice;
  const peakDates = pricingSettings.peakDates || [];
  if (isPeakDate(date, peakDates) && pricingSettings.peakMultiplier > 1) return Math.round(room.basePrice * pricingSettings.peakMultiplier);
  if (isWeekend(date) && pricingSettings.weekendMultiplier > 1) return Math.round(room.basePrice * pricingSettings.weekendMultiplier);
  return room.basePrice;
}
