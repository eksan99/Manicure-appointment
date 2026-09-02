import { NextRequest, NextResponse } from "next/server";
import { getActiveBookedSlots } from "@/lib/db";
import {
  getSlotsForDate,
  isSlotStillBookable,
  isValidDateString,
  isWithinBookingWindow,
} from "@/lib/slots";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date");
  if (!date || !isValidDateString(date)) {
    return NextResponse.json(
      { error: "Invalid or missing date (YYYY-MM-DD)" },
      { status: 400 }
    );
  }

  if (!isWithinBookingWindow(date)) {
    return NextResponse.json({
      date,
      slots: [],
      allSlots: getSlotsForDate(date),
      closed: getSlotsForDate(date).length === 0,
    });
  }

  const allSlots = getSlotsForDate(date);
  const booked = new Set(getActiveBookedSlots(date));
  const slots = allSlots.filter(
    (slot) => !booked.has(slot) && isSlotStillBookable(date, slot)
  );

  return NextResponse.json({
    date,
    slots,
    allSlots,
    closed: allSlots.length === 0,
  });
}
