import Link from "next/link";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { isAdminAuthenticated } from "@/lib/auth";

export const runtime = "nodejs";

export default async function AdminQrPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin");
  }

  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";
  const bookingUrl = `${base}/book`;
  const qrDataUrl = await QRCode.toDataURL(bookingUrl, {
    width: 320,
    margin: 2,
    color: { dark: "#1c1917", light: "#ffffff" },
  });

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-6 py-12">
      <Link
        href="/admin"
        className="text-sm text-muted hover:text-foreground"
      >
        ← Back to bookings
      </Link>
      <h1 className="mt-4 text-3xl font-semibold">Customer booking QR</h1>
      <p className="mt-2 text-muted">
        Print or display this code so customers can open the booking page.
      </p>
      <div className="mt-8 flex flex-col items-center rounded-2xl border border-border bg-panel p-8 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrDataUrl}
          alt="QR code linking to booking page"
          width={320}
          height={320}
          className="rounded-xl"
        />
        <p className="mt-6 break-all text-center text-sm font-medium text-foreground">
          {bookingUrl}
        </p>
      </div>
    </main>
  );
}
