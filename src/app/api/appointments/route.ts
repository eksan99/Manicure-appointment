import { NextRequest, NextResponse } from "next/server";
import { createAppointment } from "@/lib/db";
import {
  isAllowedSlot,
  isSlotStillBookable,
  isValidDateString,
  isWithinBookingWindow,
} from "@/lib/slots";

export const runtime = "nodejs";

type Body = {
  customer_name?: string;
  contact?: string;
  date?: string;
  slot?: string;
};

export async function POST(request: NextRequest) {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const customer_name = body.customer_name?.trim() ?? "";
  const contact = body.contact?.trim() ?? "";
  const date = body.date?.trim() ?? "";
  const slot = body.slot?.trim() ?? "";

  if (!customer_name || !contact || !date || !slot) {
    return NextResponse.json(
      { error: "Name, contact, date, and slot are required" },
      { status: 400 }
    );
  }

  if (!isValidDateString(date) || !isWithinBookingWindow(date)) {
    return NextResponse.json(
      { error: "Date is outside the bookable window" },
      { status: 400 }
    );
  }

  if (!isAllowedSlot(date, slot)) {
    return NextResponse.json(
      { error: "That time is not available on the selected day" },
      { status: 400 }
    );
  }

  if (!isSlotStillBookable(date, slot)) {
    return NextResponse.json(
      { error: "That time slot has already passed" },
      { status: 400 }
    );
  }

  try {
    const appointment = await createAppointment({
      customer_name,
      contact,
      date,
      slot,
    });
    return NextResponse.json({ appointment }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (
      message.includes("UNIQUE") ||
      message.includes("unique") ||
      message.includes("constraint")
    ) {
      return NextResponse.json(
        { error: "This slot is already taken. Please choose another time." },
        { status: 409 }
      );
    }
    console.error("createAppointment failed", err);
    return NextResponse.json(
      { error: "Could not create booking" },
      { status: 500 }
    );
  }
}
