# Deploying BelieveMeGuys on Railway

Two services from this one monorepo — **web** (Next.js, the thing people view) and
**engine** (the copy-trading worker) — plus **Postgres** (or keep Neon) and the
**Redis** you already have. Deploy the web service first so people can view the app.

## 0. Prereqs
- Push this repo to GitHub (Railway deploys from GitHub).
- Keep the existing **Redis** service.
- **Database:** now on **Neon Singapore (`ap-southeast-1`)** — all data (users,
  leaders, encrypted keys, follows, copies) already migrated there on 2026-09-20.
  Deploy the Railway services in the **Singapore region** so the app sits next to
  the DB for lowest latency. (The `CREDENTIAL_ENCRYPTION_KEY` is unchanged, so the
  migrated encrypted API keys decrypt correctly — verified: the engine started its
  leader watcher against Singapore with no decrypt errors.)

---

## 1. Web service (Next.js) — deploy this first
Railway → **New → GitHub repo → this repo**. Then in the service **Settings**:

- **Root Directory:** `/` (repo root — it's a pnpm monorepo)
- **Install command:** `pnpm install --frozen-lockfile`
- **Build command:**
  ```
  pnpm --filter @belivemeguys/db exec prisma generate && pnpm --filter @belivemeguys/web build
  ```
- **Start command:**
  ```
  pnpm --filter @belivemeguys/web start
  ```
  (the start script already binds to `$PORT` and `0.0.0.0`, which Railway sets)
- **Watch paths (optional):** `apps/web/**`, `packages/**`

### Web env vars (Service → Variables)
```
DATABASE_URL           = <Neon pooled or Railway Postgres URL>
DIRECT_URL             = <Neon direct / same Postgres URL>
AUTH_SECRET            = <keep the SAME value across deploys — 32+ chars>
CREDENTIAL_ENCRYPTION_KEY = <keep the SAME value forever — base64 32 bytes>
NEXT_PUBLIC_APP_URL    = https://<your-web-domain>   (the Railway public URL)
ADMIN_EMAILS           = ayushs24101@iiitnr.edu.in
DELTA_REST_URL         = https://cdn-ind.testnet.deltaex.org   (testnet) or prod
DELTA_WS_URL           = wss://socket-ind.testnet.deltaex.org  (testnet) or prod
REDIS_URL              = ${{Redis.REDIS_URL}}   (reference the Redis service; use the INTERNAL url)
RESEND_API_KEY         = <your Resend key, or leave empty>
RESEND_FROM            = BelieveMeGuys <noreply@mail.belivemeguys.com>
NEXT_PUBLIC_GOOGLE_AUTH_ENABLED = false   (or true once Google is set up)
GOOGLE_CLIENT_ID       = <if enabled>
GOOGLE_CLIENT_SECRET   = <if enabled>

# DEMO ONLY — remove both before real users (any OTP verifies while these are set):
DEMO_OTP_BYPASS            = true
NEXT_PUBLIC_DEMO_OTP_BYPASS = true
```
> Reference the internal Redis URL with Railway's variable reference so it uses the
> private network (no egress cost/latency): `REDIS_URL = ${{Redis.REDIS_URL}}`.

---

## 2. Engine service (copy worker) — add as a second service from the same repo
Railway → **New → GitHub repo → (same repo) → Add service**. Settings:

- **Root Directory:** `/`
- **Install command:** `pnpm install --frozen-lockfile`
- **Build command:** `pnpm --filter @belivemeguys/db exec prisma generate`
- **Start command:** `pnpm --filter @belivemeguys/engine start`

### Engine env vars
```
DATABASE_URL              = <same as web>
DIRECT_URL                = <same as web>
CREDENTIAL_ENCRYPTION_KEY = <same value as web — MUST match or keys won't decrypt>
DELTA_REST_URL            = <same as web>
DELTA_WS_URL              = <same as web>
ENGINE_SYNC_INTERVAL_MS   = 5000
ENGINE_RECONCILE_INTERVAL_MS = 30000
ENGINE_PRUNE_INTERVAL_MS  = 21600000
USAGE_RETENTION_DAYS      = 540
```
> ⚠️ Delta API keys are IP-whitelisted. The engine's **outbound IP** is what Delta
> sees. On Railway, either leave the key's IP allowlist empty, or use a static
> egress IP add-on and whitelist that.

---

## 3. Database migrations (run once against the deployed DB)
From your machine, point at the deployed DB and run:
```
cd packages/db && npx dotenv -e ../../.env -- npx prisma migrate deploy
```
(or set the deployed `DATABASE_URL`/`DIRECT_URL` locally for this command).

---

## 4. After first deploy
- Set `NEXT_PUBLIC_APP_URL` to the real Railway web domain, then redeploy the web
  service (needed so auth cookies + OTP links use the right origin).
- If using Google OAuth, add `https://<web-domain>/api/auth/callback/google` to the
  Google console authorized redirect URIs.
- **Before real users:** delete `DEMO_OTP_BYPASS` + `NEXT_PUBLIC_DEMO_OTP_BYPASS`
  and remove the `apps/web/src/app/api/demo/otp` route.

## Notes
- `AUTH_SECRET` and `CREDENTIAL_ENCRYPTION_KEY` must stay constant across deploys —
  changing them logs everyone out / makes stored exchange keys undecryptable.
- The web app reads env from the platform (`process.env`); no `.env` file is needed
  in the container.
