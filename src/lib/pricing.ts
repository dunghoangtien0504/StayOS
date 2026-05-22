import { Room } from "./types";

/**
 * Calculates the number of nights between two dates.
 * Minimum is 1 night.
 */
export function calculateNights(checkIn: Date, checkOut: Date): number {
  const diffTime = checkOut.getTime() - checkIn.getTime();
  if (diffTime <= 0) return 0;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
}

/**
 * Calculates the total booking price based on room base price and number of nights.
 */
export function calculateBookingTotal(room: Room, checkIn: Date, checkOut: Date): number {
  const nights = calculateNights(checkIn, checkOut);
  return nights * room.basePrice;
}
