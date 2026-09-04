# Deploy — 100% free (Render + Turso)

This app stores bookings in **Turso** (free hosted SQLite) and runs on
**Render's free tier**. Both are free with **no credit card**, and deploy
automatically from your GitHub repo.

## Why Render + Turso

- **Render free tier**: free Node.js web service, redeploys on every `git push`.
  Free services **sleep after ~15 min of inactivity** and wake on the next
  request (first hit can take ~30–60s).
- **Turso**: free hosted SQLite (libSQL), so bookings persist even though
  Render's filesystem is ephemeral.

> Railway was considered but no longer has a free tier (usage-based, requires a
> card). Fly now requires a payment method — which is why we moved.

## 1. Create the Turso database

Install the Turso CLI (see https://docs.turso.tech/cli/install for your OS), or
use the web dashboard at https://app.turso.tech.

```bash
turso auth signup
turso db create appointments
turso db tokens create appointments
```

`turso db tokens create` prints a token **once** — save it. Your database URL is
shown by `turso db show appointments` and looks like
`libsql://appointments-<org>.turso.io`.

## 2. Deploy to Render

1. Push this repo to GitHub.
2. Sign in to https://render.com with GitHub (free plan).
3. **New → Blueprint**, then select your repo. Render reads `render.yaml`.
4. Fill in the environment variables it asks for:

| Variable | Value |
|----------|-------|
| `TURSO_DATABASE_URL` | your `libsql://…` URL |
| `TURSO_AUTH_TOKEN` | your Turso token |
| `ADMIN_PASSWORD` | a strong admin password |
| `SESSION_SECRET` | a long random string (e.g. `openssl rand -hex 32`) |
| `NEXT_PUBLIC_APP_URL` | `https://<your-service>.onrender.com` (or custom domain) |

5. Click **Apply**. Render runs `npm install && npm run build`, then starts the
   app with `npm start`.

## 3. Set your public URL (for the QR code)

Render gives you a URL like `https://manicure-appointment-app.onrender.com`.

Set `NEXT_PUBLIC_APP_URL` to that exact URL (Environment → edit → **Save**).
Render redeploys and inlines it into the build, so the QR points at the right
address.

- Customers book: `https://<url>/book`
- Staff admin: `https://<url>/admin`
- QR for printout: `https://<url>/admin/qr` (after admin login)

## 4. Local development

No Turso account is needed for local dev — the app falls back to a local SQLite
file at `data/local.db`:

```bash
npm install
cp .env.example .env.local   # set ADMIN_PASSWORD (optional for dev)
npm run dev
```

To test against your real Turso database locally, add to `.env.local`:

```
TURSO_DATABASE_URL=libsql://…
TURSO_AUTH_TOKEN=…
```

## Updating the app

Push to your deploy branch — Render redeploys automatically. Editing environment
variables also triggers a redeploy.

## Backing up bookings

```bash
turso db shell appointments ".dump" > backup.sql
```

(Or use Turso's export in the web dashboard.)

## Costs / limits

- Render free web service: no card, sleeps when idle, cold-start on wake.
- Turso free plan: generous free storage/rows, no card.
