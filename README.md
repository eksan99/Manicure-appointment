# Manicure Appointment System

Web booking for a single manicurist. See [SPEC.md](./SPEC.md) for full product rules.

## Quick start

```bash
npm install
cp .env.example .env.local   # set ADMIN_PASSWORD (optional for local dev)
npm run dev
```

- Customer booking: [http://localhost:3000/book](http://localhost:3000/book)
- Check status: [http://localhost:3000/book/status](http://localhost:3000/book/status)
- Admin: [http://localhost:3000/admin](http://localhost:3000/admin) (password from `.env.local`)
- QR for printout: `/admin/qr` after login

Default local admin password: `changeme`

Local development stores data in a local SQLite file (`data/local.db`) — no
database service required. To use the hosted Turso database locally instead, set
`TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` in `.env.local`.

## Stack

Next.js App Router, TypeScript, Tailwind, and SQLite via libSQL (`@libsql/client`).
Production uses [Turso](https://turso.tech); local dev falls back to a local file.

## Deploy

See [DEPLOY.md](./DEPLOY.md) for the free Render + Turso setup.
