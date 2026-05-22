import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Vietnam timezone — used for all customer-facing time display */
export const VN_TIMEZONE = "Asia/Ho_Chi_Minh"

/**
 * Format a date as HH:mm in Vietnam time (Asia/Ho_Chi_Minh),
 * regardless of the browser/server timezone.
 */
export function formatVNTime(date: Date | string | number): string {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: VN_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(date))
}

/**
 * Format a date as dd/MM/yyyy HH:mm in Vietnam time (Asia/Ho_Chi_Minh).
 */
export function formatVNDateTime(date: Date | string | number): string {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: VN_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(date))
}
