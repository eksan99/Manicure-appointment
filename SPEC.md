# Manicure Appointment System — Spec

## Overview

Web-based manicure booking for one manicurist. Customers book via website or QR code. Staff review, confirm, and manage bookings in an admin console. Each time slot accepts at most one active booking.

## Service rules

- Duration: **90 minutes** per set
- **Monday–Friday** slots: `11:00`, `12:30`, `14:00`, `15:30`, `17:00`, `18:30`
- **Saturday** slots: `11:30`, `13:00`, `14:30`, `16:00`, `17:30`
- **Sunday**: closed (no slots)
- Capacity: **one booking per `(date, slot)`** while status is `pending` or `confirmed`
- Bookable window: today (remaining future slots only) through **21 days** ahead

## Customer data

| Field   | Required | Notes                |
|---------|----------|----------------------|
| Name    | Yes      | Customer full name   |
| Contact | Yes      | Phone number (string)|

## Booking lifecycle

```
pending → confirmed
pending → cancelled
confirmed → cancelled
```

- New bookings start as **`pending`**
- Admin can **confirm** or **cancel**
- Cancelling a booking frees the slot for others
- Customers cannot cancel or reschedule in v1 (admin manages)

## Access

| Role     | Path           | Auth                          |
|----------|----------------|-------------------------------|
| Customer | `/book`        | Public (QR targets this URL)  |
| Status   | `/book/status` | Public (booking # or phone)   |
| Admin    | `/admin`       | Password (`ADMIN_PASSWORD`)   |
| QR print | `/admin/qr`    | Admin session required        |

After booking, the confirmation screen **auto-refreshes** while status is `pending`, so confirm/cancel from admin appears without leaving the page.

## Out of scope (v1)

- Payments
- SMS / email notifications
- Multiple staff / parallel slots
- Customer self-cancel or reschedule
- Multi-language UI

## Technical notes

- Stack: Next.js App Router, TypeScript, Tailwind, SQLite via libSQL (`@libsql/client`; Turso in production, local file in dev)
- Double-booking guard: unique index on active `(date, slot)` + transactional insert
- Env: `ADMIN_PASSWORD`, `SESSION_SECRET`, `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` (production), `NEXT_PUBLIC_APP_URL`

## Smoke-test checklist

1. Open `/book`, pick a weekday, see Mon–Fri slots
2. Pick a Saturday, see Saturday-only slots
3. Confirm Sunday dates are not bookable
4. Create a booking with name + phone → status `pending`
5. Same slot disappears from availability / second book fails with clear error
6. Admin login → list shows booking → confirm
7. Admin cancel → slot becomes available again
8. `/admin/qr` shows QR pointing at the public booking URL
