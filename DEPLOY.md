# Deploying BelieveMeGuys on Railway

Two services from this one monorepo — **web** (Next.js, the thing people view) and
**engine** (the copy-trading worker). The **DB** is Neon Singapore (already migrated)
and **Redis** is your existing Railway Redis (used via `REDIS_URL`). Deploy the web
service first so people can view the app.

There are two ways to deploy, below:
- **[Deploy via the Railway CLI](#deploy-via-the-railway-cli-no-dashboard)** — no dashboard (recommended, this is what we set up).
- **[Deploy via the dashboard](#1-web-service-nextjs--deploy-this-first)** — the click-through alternative (sections 1–4).

---

## ✅ Deployed (2026-09-21)

Live on Railway (account `amrevjournal@gmail.com`, project **believemeguys**):
- **web:** https://web-production-548c3.up.railway.app  (verified: landing, login, dashboard with live data)
- **engine:** running, connected to Neon Singapore, watching leader "Leo Live Delta" (no decrypt errors)
- DB = Neon Singapore, Redis = existing public URL, all via env vars (no GitHub used — deployed with `railway up`).

> **Gotcha found:** `railway environment edit --service-config <svc> build.buildCommand/deploy.startCommand`
> reported success but did **not** persist (build failed with "No start command detected").
> What worked: set them via the GraphQL API —
> `railway api 'mutation($sid:String!,$eid:String!,$input:ServiceInstanceUpdateInput!){ serviceInstanceUpdate(serviceId:$sid,environmentId:$eid,input:$input) }' --variables @cfg.json`
> with `input:{buildCommand,startCommand}` — or set them in the service's dashboard Settings.

> **For live copy trading:** the engine's Delta orders are IP-whitelisted. Railway's egress IP is
> dynamic on Hobby, so set the Delta API keys' IP allowlist to **empty/unrestricted**, or add a
> static-egress IP add-on and whitelist that. The frontend works regardless.

---

## Deploy via the Railway CLI (no dashboard)

This is a **shared** pnpm monorepo (the two apps import `packages/*`), so both
services keep their **root directory at the repo root** and get their own **build /
start commands** set with `railway environment edit --service-config`. (Per-app
`railway.json` files are *not* read in this flow — Railway only auto-detects those
via the dashboard "import repo" wizard — so we set the commands explicitly instead.)

Every command below was verified against Railway CLI **5.58.0** (`brew install railway`).

### Step 1 — sign in and create the project
```bash
railway login                       # opens a browser (device code on headless)
railway init --name believemeguys   # creates the project + links this folder
```

### Step 2 — create the two services
```bash
railway add --service web
railway add --service engine
```
> We do **not** add a Railway Postgres or Redis: the DB is Neon Singapore and Redis
> is your existing instance — both are wired via `REDIS_URL` / `DATABASE_URL` env
> vars in Step 4. (Later, to move Redis into this project: `railway add --database
> redis`, then set `REDIS_URL` to `${{Redis.REDIS_URL}}` for the internal URL.)

### Step 3 — set each service's build + start command
```bash
# web (Next.js): generate Prisma client, then build; start binds $PORT/0.0.0.0
railway environment edit --service-config web \
  build.buildCommand "pnpm --filter @belivemeguys/db exec prisma generate && pnpm --filter @belivemeguys/web build"
railway environment edit --service-config web \
  deploy.startCommand "pnpm --filter @belivemeguys/web start"

# engine (worker): only needs the Prisma client generated at build
railway environment edit --service-config engine \
  build.buildCommand "pnpm --filter @belivemeguys/db exec prisma generate"
railway environment edit --service-config engine \
  deploy.startCommand "pnpm --filter @belivemeguys/engine start"
```

### Step 4 — push all env vars (from local `.env`, no hand-copying secrets)
```bash
bash scripts/railway-set-vars.sh
```
This reads `./.env` at runtime and sets every var on `web` and `engine` via `--stdin`
(safe for the `&`/`?` in the Neon URL) with `--skip-deploys`. It never prints or
commits a secret. It deliberately skips `NEXT_PUBLIC_APP_URL` (set in Step 6).

### Step 5 — deploy both services (from the repo root)
```bash
railway up --service web        # uploads the whole repo; builds+starts web
railway up --service engine
```
`railway up` respects `.gitignore`, so your `.env` is **not** uploaded — the app reads
the Railway variables from Step 4.

### Step 6 — give web a public URL, then rebuild so auth uses it
`NEXT_PUBLIC_APP_URL` is baked in at build time and better-auth uses it for cookies +
OTP links, so it must be the real domain and web must be rebuilt after setting it:
```bash
railway domain --service web                      # prints https://<something>.up.railway.app
railway variable set NEXT_PUBLIC_APP_URL=https://<that-domain> --service web
railway up --service web                          # redeploy so the URL bakes in
```

### Step 7 — verify
```bash
railway logs --service engine     # expect: "started leader watcher ... Leo Live Delta", no decrypt errors
railway logs --service web        # expect: Next.js "Ready"
```
Open the web domain from Step 6 → sign in → dashboard.

> **DB migrations:** the Singapore DB already has the full schema + data, so no
> migration step is needed now. If you change the schema later, run:
> `cd packages/db && npx dotenv -e ../../.env -- npx prisma migrate deploy`.

> ⚠️ **Engine + live trading:** Railway's outbound IP differs from your Mac, and
> Delta keys are IP-whitelisted. For real copies, whitelist Railway's egress IP on
> the Delta keys (static-egress add-on) or leave the key allowlist empty. The
> frontend works regardless.

> **Before real users:** remove the demo backdoor —
> `railway variable delete DEMO_OTP_BYPASS --service web` and
> `railway variable delete NEXT_PUBLIC_DEMO_OTP_BYPASS --service web` (then redeploy
> web), and delete `apps/web/src/app/api/demo/otp`.

---

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
