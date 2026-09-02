# Deploy (free tier)

Recommended host: **[Fly.io](https://fly.io)** — free allowance, HTTPS, persistent volume for SQLite, Singapore region (`sin`).

You only need a laptop **once** to deploy. After that, staff use an **iPad** in Safari:

- Customers: `https://YOUR-APP.fly.dev/book` (or QR)
- Staff: `https://YOUR-APP.fly.dev/admin`

## 1. Push code to GitHub

Repo: `https://github.com/eksan99/manicure-appointment-app`

If the repo does not exist yet, create an empty repo on GitHub with that name, then:

```bash
git remote add origin https://github.com/eksan99/manicure-appointment-app.git
git branch -M main
git push -u origin main
```

## 2. Install Fly CLI (one time, on your laptop)

Windows (PowerShell):

```powershell
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

Sign up / log in:

```bash
fly auth signup
# or
fly auth login
```

## 3. Create the app and database volume

From the project folder:

```bash
fly launch --no-deploy
```

When prompted:

- Use existing `fly.toml` → **yes**
- App name → `manicure-appointment-app` (or pick a unique name)
- Region → **Singapore (sin)**

Create persistent storage (keeps bookings across restarts):

```bash
fly volumes create appointment_data --region sin --size 1
```

## 4. Set secrets (passwords)

```bash
fly secrets set ADMIN_PASSWORD="your-strong-password"
fly secrets set SESSION_SECRET="paste-a-long-random-string-here"
```

After the first deploy, set the public URL (replace with your real Fly URL):

```bash
fly secrets set NEXT_PUBLIC_APP_URL="https://manicure-appointment-app.fly.dev"
```

## 5. Deploy

```bash
fly deploy
```

Open the site:

```bash
fly open
```

## 6. iPad setup in the office

1. Safari → `https://YOUR-APP.fly.dev/admin`
2. Log in with `ADMIN_PASSWORD`
3. **Share → Add to Home Screen** (admin shortcut)
4. Open **Booking QR**, print or display at the counter

## Costs

Fly.io free tier includes a monthly usage allowance. A small booking app with auto-stop when idle usually stays within free limits. The 1 GB volume is low cost if exceeded — check [fly.io/docs/about/pricing](https://fly.io/docs/about/pricing).

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Bookings disappear after redeploy | Volume not mounted — run `fly volumes list` and check `fly.toml` `[mounts]` |
| QR opens wrong URL | Update `NEXT_PUBLIC_APP_URL` and redeploy |
| App slow first visit | Free tier auto-stops when idle; first request wakes the machine (~5–10s) |
| `better-sqlite3` build error | Deploy uses Docker (`Dockerfile`); do not use serverless hosts |

## Other free options (not configured here)

| Host | SQLite | Notes |
|------|--------|-------|
| Oracle Cloud Always Free VPS | Yes | More setup, always-on VM |
| Render free | Risky | Disk is ephemeral on free tier |
| Vercel | No | Not suitable for SQLite file DB |
