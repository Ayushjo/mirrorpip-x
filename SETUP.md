# MirrorPip-X — Setup & Status

## What this is

A crypto **copy-trading** platform (a cleaner build of mirrorpip.com). Leaders trade in
their own Delta Exchange India account; the engine watches their fills over WebSocket and
mirrors each trade proportionally into every follower's account. Followers keep custody —
the platform only ever places orders via the follower's own API key.

## Current status (verified working)

| Area | Status |
|------|--------|
| Monorepo, install, typecheck, `next build` | ✅ passing |
| Auth (register / login / session / sign-out) | ✅ verified in browser |
| Admin role detection + self-heal (`ADMIN_EMAILS`) | ✅ verified |
| Admin kill-switch (DB-backed, halts engine) | ✅ verified toggling on/off |
| Connect account → verify with Delta → AES-256-GCM encrypt | ✅ verified (rejects bad keys with a clean error) |
| Apply-as-leader → admin verify/pause/delist | ✅ built, DB-backed |
| Leaderboard, leader detail, follow config, dashboard, per-follow detail | ✅ built + live P&L polling |
| Copy engine boot / DB connect / graceful shutdown | ✅ verified |
| **Live copy of a real leader fill → follower order** | ⏳ needs real Delta **testnet** keys to demo (see below) |

## Local development

### Prerequisites
- Node ≥ 22, pnpm 11
- PostgreSQL (a local one was installed for dev via `brew install postgresql@16`)

### The local database (dev only)
A local Postgres is already running on this machine for development:
- DB `mirrorpip`, role `mirrorpip` / password `mirrorpip`, at `localhost:5432`
- Start/stop it:
  ```bash
  LC_ALL="en_US.UTF-8" /opt/homebrew/opt/postgresql@16/bin/pg_ctl -D /opt/homebrew/var/postgresql@16 -l /tmp/pg16.log start
  /opt/homebrew/opt/postgresql@16/bin/pg_ctl -D /opt/homebrew/var/postgresql@16 stop
  ```
For **production**, ignore all of the above and just set `DATABASE_URL`/`DIRECT_URL` in `.env`
to a hosted Postgres (Neon, Supabase, Railway). No code changes needed.

### Run it
```bash
pnpm install
cp .env.example .env        # already created for dev with generated keys
pnpm db:generate
pnpm db:migrate             # applies the schema
pnpm db:seed                # inits kill-switch + promotes ADMIN_EMAILS users
pnpm dev                    # web on :3000 + copy engine, together
```
Open http://localhost:3000. Register with the email in `ADMIN_EMAILS` to get the Admin tab.

## Demoing the real copy flow (needs Delta testnet keys)

The engine and order placement are wired against Delta India. To see a real fill copied:

1. Create two **Delta testnet** accounts at https://testnet.delta.exchange and generate a
   **trade-enabled, withdrawal-disabled** API key for each (one "leader", one "follower").
   The `.env` `DELTA_REST_URL` / `DELTA_WS_URL` already point at testnet.
2. In the app: sign in, go to **Accounts**, connect the follower key. Connect the leader key
   too (as a second account or a second user), then **Become a leader**.
3. As admin, **Verify** the leader.
4. As the follower, open the leader and **Follow** (pick sizing + risk limits).
5. Place a trade on the leader's testnet account → within a few seconds a copy order appears
   on the follower's **dashboard → follow detail**, and a position with live P&L.

> ⚠️ Delta's WebSocket `user_trades` field names are implemented to their documented v2 spec
> but should be confirmed against a live testnet session (see `packages/exchange/src/delta.ts`,
> `streamFills`). This is the one place to sanity-check against real payloads.

## Architecture

```
apps/web     Next.js 15 — UI + REST API + better-auth
apps/engine  Node worker — Delta WS watchers, proportional fan-out, order placement, reconcile
packages/db  Prisma schema + client (shared)
packages/exchange  Exchange interface + Delta India adapter + AES-256-GCM secret vault
```
The engine is isolated behind `packages/exchange`'s `Exchange` interface, so a future
low-latency rewrite (e.g. Rust) can replace `apps/engine` without touching web or db.

## Security / before real-money launch
- Exchange secrets are AES-256-GCM encrypted at rest (`CREDENTIAL_ENCRYPTION_KEY`); never logged
  or returned to the client (only `keyLast4`).
- Only accept **trade-enabled, withdrawal-disabled** keys.
- Required before going live with real funds: a security review/pentest, and a legal review of
  copy-trading obligations in India (SEBI algo / FIU-IND classification).

## Convention
Commit on every meaningful change; do not push unless asked.
