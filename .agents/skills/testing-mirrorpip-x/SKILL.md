---
name: testing-mirrorpip-x
description: How to run and end-to-end test the MirrorPip-X web app locally — dev server, OTP extraction, admin promotion, DB helpers, and known UI interaction quirks.
---

# Testing MirrorPip-X

Repo: pnpm monorepo. Web app is `apps/web` (Next.js), DB is `packages/db` (Prisma + Neon Postgres).

## Devin Secrets Needed
- None — `.env` at the REPO ROOT already has `DATABASE_URL`, `AUTH_SECRET`, `CREDENTIAL_ENCRYPTION_KEY`. `RESEND_API_KEY` is empty → OTPs print to the dev-server console instead of real email.

## Setup
- Node/pnpm are NOT on PATH. Prefix every command: `export PATH="$HOME/.nvm/versions/node/v24.19.0/bin:$PATH"`
- Env file lives at REPO ROOT (not apps/web) — next.config.ts loads `../../.env` via dotenv.
- Start dev server with a fresh log:
  `(cd /home/ubuntu/repos/mirrorpip-x && pnpm --filter @mirrorpip/web dev > /tmp/dev-server.log 2>&1 &)` → http://localhost:3000
- OTPs appear in the log as `[email:dev] to=<email> subject=XXXXXX` — `grep 'email:dev' /tmp/dev-server.log | tail`.
- If pages 500 with "Cannot find module './NNNN.js'" or missing routes-manifest: stale `.next` cache. Fix: `pkill -f "next dev"; rm -rf apps/web/.next; restart`.

## DB helper (Prisma)
- `packages/db/test-util.ts` (session-created helper; recreate if absent): run from `packages/db` with
  `set -a; source ../../.env; set +a; ./node_modules/.bin/tsx test-util.ts <cmd>`.
  Commands: `users`, `sessions`, `audit`, `notifications`, `promote <email>` (sets role=admin), `demote`, `notify <email> <title>`, `beta on|off`.
- `tsx -e` one-liners FAIL (CJS top-level await + relative import issues) — always write a .ts file and run it.
- `ADMIN_EMAILS` env only contains kkfahmin@gmail.com; promote test users via `role:'admin'` in the DB, then RE-LOGIN (better-auth `cookieCache` maxAge=5min serves stale role/consent claims).

## UI quirks (desktop automation)
- Signup/consent checkboxes don't reliably toggle via mouse click on the label (label contains Terms/Privacy <a> links). Reliable path: click the password/last field, Tab forward to the checkbox, press Space. Watch the status bar — Tab can land on the inline links.
- Submit buttons that ignore clicks: press Enter inside the last form field instead.
- Admin dossier "Details" button may crash the page (authProviders bug) — reload (F5) to recover.
- Dev-server log shows every request line (`GET /api/admin/users 403 in ...`) — the most reliable way to assert API status codes from UI-driven sessions.
- `browser_console` tool does NOT await promises: queue `fetch(...).then(console.log)` then call `browser_console` with no args, or just read the dev-server log.

## Feature-specific notes
- Consent gate: users with null tosAcceptedAt/riskDisclosureAcceptedAt redirect to /complete-profile. Session cookieCache staleness means consent just submitted may not be visible for up to ~5min — sign out/in to shortcut.
- Usage tracking: sessions keyed by userId+clientId (per tab); page_view/session_end mint UsageEvent rows, 30s heartbeats only bump durationSec. React StrictMode dev double-mount can create duplicate sessions/events.
- Maintenance banner is in the SSR root layout — only appears on FULL page load, not client-side navigation.
