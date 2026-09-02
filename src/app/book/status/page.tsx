"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  BookingStatusCard,
  type CustomerAppointment,
} from "@/components/BookingStatusCard";

export default function BookingStatusPage() {
  const [mode, setMode] = useState<"id" | "contact">("id");
  const [bookingId, setBookingId] = useState("");
  const [contact, setContact] = useState("");
  const [appointments, setAppointments] = useState<CustomerAppointment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const lookup = useCallback(
    async (params: { id?: string; contact?: string }) => {
      setLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams();
        if (params.id) qs.set("id", params.id);
        if (params.contact) qs.set("contact", params.contact);
        const res = await fetch(`/api/appointments/lookup?${qs.toString()}`);
        const data = await res.json();
        if (!res.ok) {
          setAppointments([]);
          setError(data.error ?? "Could not find booking");
          return;
        }
        const list = (data.appointments as CustomerAppointment[]) ?? [];
        setAppointments(list);
        if (list.length === 0) {
          setError(
            "No bookings found. Check the number or phone and try again."
          );
        }
      } catch {
        setError("Could not look up booking");
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const phone = params.get("contact");
    if (id) {
      setMode("id");
      setBookingId(id);
      void lookup({ id });
    } else if (phone) {
      setMode("contact");
      setContact(phone);
      void lookup({ contact: phone });
    }
  }, [lookup]);

  // Poll pending results on this page too
  useEffect(() => {
    const pending = appointments.filter((a) => a.status === "pending");
    if (pending.length === 0) return;

    const interval = window.setInterval(() => {
      if (mode === "id" && bookingId) {
        void lookup({ id: bookingId });
      } else if (mode === "contact" && contact) {
        void lookup({ contact });
      }
    }, 4000);
    return () => window.clearInterval(interval);
  }, [appointments, mode, bookingId, contact, lookup]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (mode === "id") {
      await lookup({ id: bookingId.trim() });
    } else {
      await lookup({ contact: contact.trim() });
    }
  }

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-6 py-12">
      <Link href="/book" className="text-sm text-muted hover:text-foreground">
        ← Back to booking
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">
        Check booking status
      </h1>
      <p className="mt-2 text-muted">
        Use your booking number or the phone you used when booking.
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-8 space-y-4 rounded-2xl border border-border bg-panel p-6 shadow-sm"
      >
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode("id")}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              mode === "id"
                ? "bg-accent-soft text-accent"
                : "text-muted hover:bg-stone-100"
            }`}
          >
            Booking #
          </button>
          <button
            type="button"
            onClick={() => setMode("contact")}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              mode === "contact"
                ? "bg-accent-soft text-accent"
                : "text-muted hover:bg-stone-100"
            }`}
          >
            Phone
          </button>
        </div>

        {mode === "id" ? (
          <label className="block">
            <span className="text-sm font-medium">Booking number</span>
            <input
              className="mt-2 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-accent"
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
              inputMode="numeric"
              required
              placeholder="e.g. 12"
            />
          </label>
        ) : (
          <label className="block">
            <span className="text-sm font-medium">Phone / contact</span>
            <input
              className="mt-2 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-accent"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              autoComplete="tel"
              inputMode="tel"
              required
            />
          </label>
        )}

        {error ? (
          <p className="rounded-xl bg-accent-soft px-3 py-2 text-sm text-accent">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Searching…" : "Check status"}
        </button>
      </form>

      <ul className="mt-6 space-y-4">
        {appointments.map((appt) => (
          <li key={appt.id}>
            <BookingStatusCard
              appointment={appt}
              refreshing={loading}
              onRefresh={() =>
                void lookup(
                  mode === "id"
                    ? { id: String(appt.id) }
                    : { contact: appt.contact }
                )
              }
            />
          </li>
        ))}
      </ul>
    </main>
  );
}
