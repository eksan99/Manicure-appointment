import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">
        Studio booking
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground">
        Manicure Appointments
      </h1>
      <p className="mt-4 text-base leading-relaxed text-muted">
        90-minute sets. Choose a weekday or Saturday slot, leave your name and
        phone, and we will confirm your booking.
      </p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/book"
          className="inline-flex items-center justify-center rounded-xl bg-accent px-5 py-3 text-center text-sm font-semibold text-white transition hover:opacity-90"
        >
          Book an appointment
        </Link>
        <Link
          href="/book/status"
          className="inline-flex items-center justify-center rounded-xl border border-border bg-panel px-5 py-3 text-center text-sm font-semibold text-foreground transition hover:bg-accent-soft"
        >
          Check booking status
        </Link>
        <Link
          href="/admin"
          className="inline-flex items-center justify-center rounded-xl border border-border bg-panel px-5 py-3 text-center text-sm font-semibold text-foreground transition hover:bg-accent-soft"
        >
          Staff admin
        </Link>
      </div>
    </main>
  );
}
