import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { listAppointments } from "@/lib/db";
import type { AppointmentStatus } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const date = request.nextUrl.searchParams.get("date") ?? undefined;
  const statusParam = request.nextUrl.searchParams.get("status") ?? "all";
  const status =
    statusParam === "all" ||
    statusParam === "pending" ||
    statusParam === "confirmed" ||
    statusParam === "cancelled"
      ? (statusParam as AppointmentStatus | "all")
      : "all";

  const appointments = await listAppointments({ date, status });
  return NextResponse.json({ appointments });
}
