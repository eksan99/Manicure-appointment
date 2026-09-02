"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import type { Appointment, AppointmentStatus } from "@/lib/types";

function formatDisplayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function statusClass(status: AppointmentStatus): string {
  if (status === "confirmed") return "bg-green-100 text-success";
  if (status === "cancelled") return "bg-stone-200 text-muted";
  return "bg-amber-100 text-warning";
}

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | AppointmentStatus>(
    "all"
  );
  const [dateFilter, setDateFilter] = useState("");
  const [listError, setListError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const loadAppointments = useCallback(async () => {
    setListError(null);
    const params = new URLSearchParams();
    params.set("status", statusFilter);
    if (dateFilter) params.set("date", dateFilter);

    const res = await fetch(`/api/admin/appointments?${params.toString()}`);
    if (res.status === 401) {
      setAuthed(false);
      return;
    }
    const data = await res.json();
    if (!res.ok) {
      setListError(data.error ?? "Failed to load bookings");
      return;
    }
    setAuthed(true);
    setAppointments(data.appointments as Appointment[]);
  }, [statusFilter, dateFilter]);

  useEffect(() => {
    void loadAppointments();
  }, [loadAppointments]);

  async function onLogin(e: FormEvent) {
    e.preventDefault();
    setLoginError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setLoginError(data.error ?? "Login failed");
      return;
    }
    setPassword("");
    setAuthed(true);
    await loadAppointments();
  }

  async function onLogout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    setAuthed(false);
    setAppointments([]);
  }

  async function updateStatus(id: number, status: AppointmentStatus) {
    setBusyId(id);
    setListError(null);
    try {
      const res = await fetch(`/api/admin/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        setListError(data.error ?? "Update failed");
        return;
      }
      await loadAppointments();
    } finally {
      setBusyId(null);
    }
  }

  if (authed === null) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 items-center px-6 py-16">
        <p className="text-muted">Checking session…</p>
      </main>
    );
  }

  if (!authed) {
    return (
      <main className="mx-auto w-full max-w-md flex-1 px-6 py-16">
        <Link href="/" className="text-sm text-muted hover:text-foreground">
          ← Home
        </Link>
        <h1 className="mt-4 text-3xl font-semibold">Staff login</h1>
        <p className="mt-2 text-muted">
          Enter the admin password to review bookings.
        </p>
        <form
          onSubmit={onLogin}
          className="mt-8 space-y-4 rounded-2xl border border-border bg-panel p-6 shadow-sm"
        >
          <label className="block">
            <span className="text-sm font-medium">Password</span>
            <input
              type="password"
              className="mt-2 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-accent"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>
          {loginError ? (
            <p className="text-sm text-accent">{loginError}</p>
          ) : null}
          <button
            type="submit"
            className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
          >
            Sign in
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/" className="text-sm text-muted hover:text-foreground">
            ← Home
          </Link>
          <h1 className="mt-2 text-3xl font-semibold">Bookings</h1>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/qr"
            className="rounded-xl border border-border bg-panel px-4 py-2 text-sm font-semibold hover:bg-accent-soft"
          >
            Booking QR
          </Link>
          <button
            type="button"
            onClick={() => void onLogout()}
            className="rounded-xl border border-border bg-panel px-4 py-2 text-sm font-semibold hover:bg-accent-soft"
          >
            Log out
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3 rounded-2xl border border-border bg-panel p-4">
        <label className="text-sm">
          <span className="mb-1 block font-medium">Status</span>
          <select
            className="rounded-lg border border-border bg-white px-3 py-2"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "all" | AppointmentStatus)
            }
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">Date</span>
          <input
            type="date"
            className="rounded-lg border border-border bg-white px-3 py-2"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </label>
        {dateFilter ? (
          <button
            type="button"
            className="self-end text-sm font-medium text-accent"
            onClick={() => setDateFilter("")}
          >
            Clear date
          </button>
        ) : null}
      </div>

      {listError ? (
        <p className="mt-4 rounded-xl bg-accent-soft px-3 py-2 text-sm text-accent">
          {listError}
        </p>
      ) : null}

      <ul className="mt-6 space-y-3">
        {appointments.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-border bg-panel/60 p-8 text-center text-muted">
            No bookings match these filters.
          </li>
        ) : (
          appointments.map((appt) => (
            <li
              key={appt.id}
              className="rounded-2xl border border-border bg-panel p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold">{appt.customer_name}</p>
                  <p className="text-sm text-muted">{appt.contact}</p>
                  <p className="mt-2 text-sm">
                    {formatDisplayDate(appt.date)} · {appt.slot}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusClass(appt.status)}`}
                >
                  {appt.status}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {appt.status === "pending" ? (
                  <button
                    type="button"
                    disabled={busyId === appt.id}
                    onClick={() => void updateStatus(appt.id, "confirmed")}
                    className="rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Confirm
                  </button>
                ) : null}
                {appt.status !== "cancelled" ? (
                  <button
                    type="button"
                    disabled={busyId === appt.id}
                    onClick={() => void updateStatus(appt.id, "cancelled")}
                    className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </li>
          ))
        )}
      </ul>
    </main>
  );
}
