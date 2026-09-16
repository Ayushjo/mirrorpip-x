# MirrorPip-X — Crypto Copy-Trading Platform

Watch verified **leaders**, mirror their trades automatically into **follower** accounts.
Followers keep custody of their funds — the platform only ever places orders via the
follower's own exchange API key (trade permission, never withdrawal).

> A cleaner, better-built take on mirrorpip.com. First exchange: **Delta Exchange India**.

## How it works

1. A **leader** connects their exchange account (read/trade API key). An admin verifies them.
2. A **follower** connects their own exchange account and picks a leader to follow, with
   sizing (proportional / fixed-margin / multiplier) and risk limits.
3. The **copy engine** holds a live WebSocket to each leader's account. When the leader's
   order fills, the engine sizes and places the equivalent order in every active follower's
   account — idempotently — and tracks the resulting positions and P&L.
4. Followers watch live positions/P&L on their dashboard and can pause/stop anytime.

## Monorepo layout

```
apps/
  web/        Next.js 15 — UI, REST API routes, auth (better-auth), admin
  engine/     Node worker — Delta WebSocket watchers, fan-out, order placement, reconcile
packages/
  db/         Prisma schema + generated client (shared source of truth)
  exchange/   Exchange adapter interface + Delta India adapter + secret crypto
```

## Tech

- **TypeScript** everywhere, pnpm workspaces.
- **Next.js 15** (App Router, React 19) + **Tailwind v4** for the site.
- **Prisma** on **PostgreSQL** (Neon in prod).
- **better-auth** email + password sessions.
- The engine and web share the DB; no external broker/message-bus needed for the MVP
  (engine reconciles config by polling the DB; kill-switch is a DB setting).

The engine is deliberately isolated behind `packages/exchange`'s `Exchange` interface so a
future low-latency rewrite (e.g. Rust) can replace `apps/engine` without touching the rest.

## Getting started

```bash
pnpm install
cp .env.example .env          # fill DATABASE_URL, CREDENTIAL_ENCRYPTION_KEY, AUTH_SECRET
pnpm db:generate
pnpm db:migrate               # creates the schema
pnpm dev                      # runs web (:3000) + engine together
```

## Security notes

- Exchange API secrets are **AES-256-GCM encrypted at rest** (`CREDENTIAL_ENCRYPTION_KEY`),
  decrypted only in-process to sign requests. Secrets are never logged or returned to the client.
- Only ask followers/leaders for **trade-enabled, withdrawal-disabled** API keys.
- Before any real-money launch: a security review/pentest and a legal review of copy-trading
  obligations (e.g. SEBI algo / FIU-IND in India) are required.

## Development convention

Commit on every meaningful change; **do not push** unless explicitly asked (deploys watch the remote).
