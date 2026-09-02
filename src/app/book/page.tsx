"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  BookingStatusCard,
  type CustomerAppointment,
} from "@/components/BookingStatusCard";

type SlotsResponse = {
  date: string;
  slots: string[];
  allSlots: string[];
  closed: boolean;
};

const LAST_BOOKING_KEY = "last_booking_id";

function formatDisplayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function buildDateOptions(): string[] {
  const dates: string[] = [];
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);
  for (let i = 0; i <= 21; i++) {
    const d = new Date(cursor);
    d.setDate(cursor.getDate() + i);
    if (d.getDay() === 0) continue;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    dates.push(`${y}-${m}-${day}`);
  }
  return dates;
}

export default function BookPage() {
  const dateOptions = useMemo(() => buildDateOptions(), []);
  const [date, setDate] = useState(dateOptions[0] ?? "");
  const [slots, setSlots] = useState<string[]>([]);
  const [closed, setClosed] = useState(false);
  const [slot, setSlot] = useState("");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<CustomerAppointment | null>(
    null
  );
  const [refreshing, setRefreshing] = useState(false);

  const loadSlots = useCallback(async (selectedDate: string) => {
    if (!selectedDate) return;
    setLoadingSlots(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/slots?date=${encodeURIComponent(selectedDate)}`
      );
      const data = (await res.json()) as SlotsResponse & { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not load slots");
        setSlots([]);
        setSlot("");
        return;
      }
      setSlots(data.slots);
      setClosed(data.closed);
      setSlot((prev) => (data.slots.includes(prev) ? prev : ""));
    } catch {
      setError("Could not load slots");
      setSlots([]);
      setSlot("");
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  const refreshConfirmation = useCallback(async (id: number) => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/appointments/${id}`);
      const data = await res.json();
      if (res.ok && data.appointment) {
        setConfirmation(data.appointment as CustomerAppointment);
      }
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadSlots(date);
  }, [date, loadSlots]);

  // Auto-poll while pending so confirm/cancel from admin shows up
  useEffect(() => {
    if (!confirmation || confirmation.status !== "pending") return;

    const tick = () => {
      void refreshConfirmation(confirmation.id);
    };
    const interval = window.setInterval(tick, 4000);
    return () => window.clearInterval(interval);
  }, [confirmation, refreshConfirmation]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: name,
          contact,
          date,
          slot,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Booking failed");
        await loadSlots(date);
        return;
      }
      const appt = data.appointment as CustomerAppointment;
      setConfirmation(appt);
      try {
        localStorage.setItem(LAST_BOOKING_KEY, String(appt.id));
      } catch {
        /* ignore */
      }
    } catch {
      setError("Booking failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmation) {
    return (
      <main className="mx-auto w-full max-w-lg flex-1 px-6 py-12">
        <BookingStatusCard
          appointment={confirmation}
          refreshing={refreshing}
          onRefresh={() => void refreshConfirmation(confirmation.id)}
          onBookAnother={() => {
            setConfirmation(null);
            setName("");
            setContact("");
            setSlot("");
            void loadSlots(date);
          }}
        />
        <p className="mt-4 text-center text-sm text-muted">
          Save booking #{confirmation.id}, or{" "}
          <Link
            href={`/book/status?id=${confirmation.id}`}
            className="font-semibold text-accent"
          >
            check status later
          </Link>
          .
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-6 py-12">
      <div className="flex items-center justify-between gap-3">
        <Link href="/" className="text-sm text-muted hover:text-foreground">
          ← Home
        </Link>
        <Link
          href="/book/status"
          className="text-sm font-semibold text-accent hover:opacity-80"
        >
          Check booking status
        </Link>
      </div>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">
        Book your manicure
      </h1>
      <p className="mt-2 text-muted">
        Each set takes 90 minutes. One guest per time slot.
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-8 space-y-6 rounded-2xl border border-border bg-panel p-6 shadow-sm"
      >
        <label className="block">
          <span className="text-sm font-medium">Date</span>
          <select
            className="mt-2 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-accent"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          >
            {dateOptions.map((d) => (
              <option key={d} value={d}>
                {formatDisplayDate(d)}
              </option>
            ))}
          </select>
        </label>

        <fieldset>
          <legend className="text-sm font-medium">Available times</legend>
          {loadingSlots ? (
            <p className="mt-3 text-sm text-muted">Loading slots…</p>
          ) : closed ? (
            <p className="mt-3 text-sm text-muted">Closed on this day.</p>
          ) : slots.length === 0 ? (
            <p className="mt-3 text-sm text-muted">
              No open slots left for this date.
            </p>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {slots.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSlot(s)}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                    slot === s
                      ? "border-accent bg-accent-soft text-accent"
                      : "border-border bg-white hover:border-accent/40"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </fieldset>

        <label className="block">
          <span className="text-sm font-medium">Your name</span>
          <input
            className="mt-2 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-accent"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Phone / contact</span>
          <input
            className="mt-2 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-accent"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            required
            autoComplete="tel"
            inputMode="tel"
          />
        </label>

        {error ? (
          <p className="rounded-xl bg-accent-soft px-3 py-2 text-sm text-accent">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting || !slot || !name.trim() || !contact.trim()}
          className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Request booking"}
        </button>
      </form>
    </main>
  );
}
