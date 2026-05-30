import { Room, Settings } from "./types";

// ─── Room tier ───────────────────────────────────────────────
// Deluxe: 101, 102, 302   |   VIP: 201, 202, 301
export type RoomTier = 'Deluxe' | 'VIP';

export function getRoomTier(room: Room): RoomTier {
  return room.roomType === 'VIP' ? 'VIP' : 'Deluxe';
}

// ─── Day type ────────────────────────────────────────────────
// Weekday = Mon(1)-Thu(4)  |  Weekend = Fri(5)-Sun(0)
export type DayType = 'weekday' | 'weekend';

export function getDayType(date: Date): DayType {
  const d = date.getDay();
  return d === 0 || d === 5 || d === 6 ? 'weekend' : 'weekday';
}

// ─── Slot types ──────────────────────────────────────────────
export type SlotType =
  | 'hourly'           // ≤4h trong ngày
  | 'morning'          // 6h–11h
  | 'day_11_18'        // 11h–18h
  | 'day_12_19'        // 12h–19h
  | 'day_14_24'        // 14h–24h
  | 'overnight_combo3' // 21h–11h hôm sau
  | 'overnight_combo4' // 14h–11h hôm sau (hoặc qua đêm mặc định)
  | 'multi_night';     // nhiều đêm → tính combo4 × số đêm

export const SLOT_LABEL: Record<SlotType, string> = {
  hourly: 'Theo giờ (3-4h)',
  morning: 'Trong ngày 6h–11h',
  day_11_18: 'Trong ngày 11h–18h',
  day_12_19: 'Trong ngày 12h–19h',
  day_14_24: 'Trong ngày 14h–24h',
  overnight_combo3: 'Qua đêm Combo 3 (21h–11h)',
  overnight_combo4: 'Qua đêm Combo 4 (14h–11h)',
  multi_night: 'Nhiều đêm (Combo 4 × đêm)',
};

// ─── Price table ─────────────────────────────────────────────
const PRICE: Record<DayType, Record<RoomTier, Record<Exclude<SlotType, 'multi_night'>, number>>> = {
  weekday: {
    Deluxe: {
      hourly: 359000,
      morning: 560000,
      day_11_18: 640000,
      day_12_19: 570000,
      day_14_24: 690000,
      overnight_combo3: 599000,
      overnight_combo4: 699000,
    },
    VIP: {
      hourly: 389000,
      morning: 640000,
      day_11_18: 690000,
      day_12_19: 650000,
      day_14_24: 750000,
      overnight_combo3: 660000,
      overnight_combo4: 760000,
    },
  },
  weekend: {
    Deluxe: {
      hourly: 389000,
      morning: 580000,
      day_11_18: 670000,
      day_12_19: 610000,
      day_14_24: 710000,
      overnight_combo3: 649000,
      overnight_combo4: 749000,
    },
    VIP: {
      hourly: 419000,
      morning: 660000,
      day_11_18: 710000,
      day_12_19: 690000,
      day_14_24: 770000,
      overnight_combo3: 710000,
      overnight_combo4: 819000,
    },
  },
};

// Extra hour surcharge (after 2 hours)
export const EXTRA_HOUR_PRICE = 70000;

// ─── Slot detection ──────────────────────────────────────────
export function detectSlot(checkIn: Date, checkOut: Date): SlotType {
  const ciH = checkIn.getHours() + checkIn.getMinutes() / 60;
  const coH = checkOut.getHours() + checkOut.getMinutes() / 60;
  const nights = calculateNights(checkIn, checkOut);

  if (nights > 1) return 'multi_night';

  const crossDay =
    checkOut.getDate() !== checkIn.getDate() ||
    checkOut.getMonth() !== checkIn.getMonth();

  if (crossDay) {
    // Overnight slots
    if (ciH >= 20.5) return 'overnight_combo3'; // 21h+
    return 'overnight_combo4';
  }

  // Same-day slots
  const durationH = coH - ciH;

  if (durationH <= 4.5) return 'hourly';
  if (ciH >= 5.5 && coH <= 11.5) return 'morning';
  if (ciH >= 10.5 && coH <= 18.5) return 'day_11_18';
  if (ciH >= 13.5 && coH <= 20) return 'day_14_24';
  return 'day_12_19';
}

// ─── Single-night price ──────────────────────────────────────
export function getNightPrice(
  room: Room,
  checkIn: Date,
  checkOut: Date,
  pricingSettings?: Settings['pricing'],
): number {
  const tier = getRoomTier(room);
  const day = getDayType(checkIn);
  const slot = detectSlot(checkIn, checkOut);

  const base =
    slot === 'multi_night'
      ? PRICE[day][tier].overnight_combo4
      : PRICE[day][tier][slot];

  return applyMultiplier(base, checkIn, pricingSettings);
}

// ─── Apply holiday / weekend multiplier ──────────────────────
function applyMultiplier(
  base: number,
  date: Date,
  settings?: Settings['pricing'],
): number {
  if (!settings) return base;
  const dateStr = formatDateKey(date);
  if (settings.peakDates?.includes(dateStr) && settings.peakMultiplier > 1) {
    return Math.round(base * settings.peakMultiplier);
  }
  return base;
}

function formatDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ─── Main export: total booking price ────────────────────────
export function calculateBookingTotal(
  room: Room,
  checkIn: Date,
  checkOut: Date,
  pricingSettings?: Settings['pricing'],
): number {
  const slot = detectSlot(checkIn, checkOut);

  if (slot !== 'multi_night') {
    return getNightPrice(room, checkIn, checkOut, pricingSettings);
  }

  // Multi-night: iterate each night, price based on that night's check-in day
  const nights = calculateNights(checkIn, checkOut);
  let total = 0;
  const cursor = new Date(checkIn);

  for (let i = 0; i < nights; i++) {
    const tier = getRoomTier(room);
    const day = getDayType(cursor);
    const base = PRICE[day][tier].overnight_combo4;
    total += applyMultiplier(base, cursor, pricingSettings);
    cursor.setDate(cursor.getDate() + 1);
  }

  return total;
}

// ─── Price breakdown for UI display ─────────────────────────
export interface PriceBreakdown {
  slot: SlotType;
  slotLabel: string;
  tier: RoomTier;
  dayType: DayType;
  basePrice: number;
  nights: number;
  total: number;
}

export function getPriceBreakdown(
  room: Room,
  checkIn: Date,
  checkOut: Date,
  pricingSettings?: Settings['pricing'],
): PriceBreakdown {
  const slot = detectSlot(checkIn, checkOut);
  const tier = getRoomTier(room);
  const day = getDayType(checkIn);
  const nights = calculateNights(checkIn, checkOut);

  const basePrice =
    slot === 'multi_night'
      ? PRICE[day][tier].overnight_combo4
      : PRICE[day][tier][slot];

  const total = calculateBookingTotal(room, checkIn, checkOut, pricingSettings);

  return {
    slot,
    slotLabel: SLOT_LABEL[slot],
    tier,
    dayType: day,
    basePrice,
    nights,
    total,
  };
}

// ─── Utilities ───────────────────────────────────────────────
export function calculateNights(checkIn: Date, checkOut: Date): number {
  const diffTime = checkOut.getTime() - checkIn.getTime();
  if (diffTime <= 0) return 0;
  return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
}
