import { NextRequest, NextResponse } from "next/server";
import { findAppointmentsByContact, getAppointmentById } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const idParam = request.nextUrl.searchParams.get("id");
  const contact = request.nextUrl.searchParams.get("contact")?.trim() ?? "";

  if (idParam) {
    const id = Number(idParam);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "Invalid booking id" }, { status: 400 });
    }
    const appointment = getAppointmentById(id);
    if (!appointment) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    return NextResponse.json({ appointments: [appointment] });
  }

  if (!contact) {
    return NextResponse.json(
      { error: "Provide booking id or contact phone" },
      { status: 400 }
    );
  }

  const appointments = findAppointmentsByContact(contact);
  return NextResponse.json({ appointments });
}
