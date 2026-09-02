import {
  BOOKING_WINDOW_DAYS,
  SATURDAY_SLOTS,
  WEEKDAY_SLOTS,
} from "./types";

/** Parse YYYY-MM-DD as a local calendar date (noon to avoid DST edge cases). */
export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayString(): string {
  return formatDate(new Date());
}

/** 0 = Sunday … 6 = Saturday */
export function getWeekday(dateStr: string): number {
  return parseDate(dateStr).getDay();
}

export function isValidDateString(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const parsed = parseDate(dateStr);
  return formatDate(parsed) === dateStr;
}

/** Allowed start times for a calendar date. Empty for Sunday. */
export function getSlotsForDate(dateStr: string): string[] {
  const day = getWeekday(dateStr);
  if (day === 0) return [];
  if (day === 6) return [...SATURDAY_SLOTS];
  return [...WEEKDAY_SLOTS];
}

export function isAllowedSlot(dateStr: string, slot: string): boolean {
  return getSlotsForDate(dateStr).includes(slot);
}

export function isWithinBookingWindow(dateStr: string): boolean {
  if (!isValidDateString(dateStr)) return false;
  const today = todayString();
  if (dateStr < today) return false;

  const max = new Date();
  max.setHours(12, 0, 0, 0);
  max.setDate(max.getDate() + BOOKING_WINDOW_DAYS);
  return dateStr <= formatDate(max);
}

/** Whether a slot start time is still in the future for today. */
export function isSlotStillBookable(dateStr: string, slot: string): boolean {
  if (dateStr > todayString()) return true;
  if (dateStr < todayString()) return false;

  const [hh, mm] = slot.split(":").map(Number);
  const start = new Date();
  start.setHours(hh, mm, 0, 0);
  return start.getTime() > Date.now();
}

export function bookableDates(): string[] {
  const dates: string[] = [];
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);

  for (let i = 0; i <= BOOKING_WINDOW_DAYS; i++) {
    const d = new Date(cursor);
    d.setDate(cursor.getDate() + i);
    const dateStr = formatDate(d);
    if (getWeekday(dateStr) === 0) continue;
    dates.push(dateStr);
  }
  return dates;
}
