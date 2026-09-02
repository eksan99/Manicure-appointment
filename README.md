# Manicure Appointment System

Web booking for a single manicurist. See [SPEC.md](./SPEC.md) for full product rules.

## Quick start

```bash
npm install
cp .env.example .env.local   # set ADMIN_PASSWORD and NEXT_PUBLIC_APP_URL
npm run dev
```

- Customer booking: [http://localhost:3000/book](http://localhost:3000/book)
- Check status: [http://localhost:3000/book/status](http://localhost:3000/book/status)
- Admin: [http://localhost:3000/admin](http://localhost:3000/admin) (password from `.env.local`)
- QR for printout: `/admin/qr` after login

Default local admin password: `changeme`

## Stack

Next.js App Router, TypeScript, Tailwind, SQLite (`better-sqlite3`). Database file lives in `data/appointments.db`.

## Deploy (free)

See **[DEPLOY.md](./DEPLOY.md)** for Fly.io (free tier + persistent SQLite) and iPad office setup.
