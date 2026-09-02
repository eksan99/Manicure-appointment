import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { updateAppointmentStatus } from "@/lib/db";
import type { AppointmentStatus } from "@/lib/types";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const status = body.status as AppointmentStatus | undefined;
  if (status !== "confirmed" && status !== "cancelled" && status !== "pending") {
    return NextResponse.json(
      { error: "status must be pending, confirmed, or cancelled" },
      { status: 400 }
    );
  }

  try {
    const appointment = updateAppointmentStatus(id, status);
    if (!appointment) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ appointment });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (
      message.includes("UNIQUE") ||
      message.includes("unique") ||
      message.includes("constraint")
    ) {
      return NextResponse.json(
        {
          error:
            "Cannot set this status: another active booking already holds this slot.",
        },
        { status: 409 }
      );
    }
    console.error("updateAppointmentStatus failed", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
