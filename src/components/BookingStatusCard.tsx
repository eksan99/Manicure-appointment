"use client";

import Link from "next/link";

export type CustomerAppointment = {
  id: number;
  customer_name: string;
  contact: string;
  date: string;
  slot: string;
  status: "pending" | "confirmed" | "cancelled" | string;
};

function formatDisplayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function statusCopy(status: string) {
  if (status === "confirmed") {
    return {
      label: "Confirmed",
      title: "Your booking is confirmed",
      detail: "See you at the studio. Please arrive a few minutes early.",
      className: "text-success",
    };
  }
  if (status === "cancelled") {
    return {
      label: "Cancelled",
      title: "This booking was cancelled",
      detail: "The slot is no longer held. You can book another time.",
      className: "text-accent",
    };
  }
  return {
    label: "Pending",
    title: "Waiting for staff confirmation",
    detail: "Your request is in. Staff will confirm or cancel soon.",
    className: "text-warning",
  };
}

export function BookingStatusCard({
  appointment,
  onRefresh,
  refreshing,
  onBookAnother,
}: {
  appointment: CustomerAppointment;
  onRefresh?: () => void;
  refreshing?: boolean;
  onBookAnother?: () => void;
}) {
  const copy = statusCopy(appointment.status);

  return (
    <div className="rounded-2xl border border-border bg-panel p-8 shadow-sm">
      <p className={`text-sm font-medium ${copy.className}`}>{copy.label}</p>
      <h2 className="mt-2 text-2xl font-semibold">{copy.title}</h2>
      <p className="mt-3 text-muted">{copy.detail}</p>
      <p className="mt-2 text-xs text-muted">Booking #{appointment.id}</p>
      <dl className="mt-6 space-y-3 text-sm">
        <div className="flex justify-between gap-4 border-b border-border pb-2">
          <dt className="text-muted">Name</dt>
          <dd className="font-medium">{appointment.customer_name}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-border pb-2">
          <dt className="text-muted">Contact</dt>
          <dd className="font-medium">{appointment.contact}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-border pb-2">
          <dt className="text-muted">Date</dt>
          <dd className="font-medium">{formatDisplayDate(appointment.date)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Time</dt>
          <dd className="font-medium">{appointment.slot} (90 min)</dd>
        </div>
      </dl>
      <div className="mt-8 flex flex-wrap items-center gap-4">
        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-accent-soft disabled:opacity-50"
          >
            {refreshing ? "Checking…" : "Refresh status"}
          </button>
        ) : null}
        {onBookAnother ? (
          <button
            type="button"
            onClick={onBookAnother}
            className="text-sm font-semibold text-accent"
          >
            Book another slot
          </button>
        ) : (
          <Link href="/book" className="text-sm font-semibold text-accent">
            Book another slot
          </Link>
        )}
      </div>
      {appointment.status === "pending" ? (
        <p className="mt-4 text-xs text-muted">
          Status updates automatically while this page stays open.
        </p>
      ) : null}
    </div>
  );
}
