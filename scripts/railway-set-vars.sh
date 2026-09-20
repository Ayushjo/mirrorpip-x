#!/usr/bin/env bash
#
# Push environment variables from the local .env to the Railway "web" and
# "engine" services. Reads secrets from ./.env (gitignored) at RUNTIME — no
# secret value is ever printed or committed. Uses --stdin so values with & ? =
# (e.g. the Neon URL) are passed safely, and --skip-deploys so it doesn't kick
# off a build per variable (you deploy once at the end with `railway up`).
#
# Prereqs (see DEPLOY.md → "Deploy via the Railway CLI"):
#   railway login
#   railway init --name believemeguys
#   railway add --service web
#   railway add --service engine
#
# Then run:  bash scripts/railway-set-vars.sh
#
# NOTE: NEXT_PUBLIC_APP_URL is intentionally NOT set here — it must be the real
# Railway web domain, which only exists after the first deploy + `railway domain`.
# Set it afterwards (DEPLOY.md covers this), then redeploy web so it bakes in.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT/.env"

[ -f "$ENV_FILE" ] || { echo "ERROR: $ENV_FILE not found — run from the repo."; exit 1; }
command -v railway >/dev/null 2>&1 || { echo "ERROR: railway CLI not found (brew install railway)."; exit 1; }

# Load .env into the environment without echoing any values.
set -a; . "$ENV_FILE"; set +a

# Vars the web (Next.js) service needs. NEXT_PUBLIC_* are baked at build time.
WEB_KEYS=(
  DATABASE_URL DIRECT_URL AUTH_SECRET CREDENTIAL_ENCRYPTION_KEY ADMIN_EMAILS
  DELTA_REST_URL DELTA_WS_URL REDIS_URL RESEND_API_KEY RESEND_FROM
  NEXT_PUBLIC_GOOGLE_AUTH_ENABLED GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET
  DEMO_OTP_BYPASS NEXT_PUBLIC_DEMO_OTP_BYPASS
)

# Vars the engine (copy worker) needs. CREDENTIAL_ENCRYPTION_KEY MUST match web.
ENGINE_KEYS=(
  DATABASE_URL DIRECT_URL CREDENTIAL_ENCRYPTION_KEY
  DELTA_REST_URL DELTA_WS_URL
  ENGINE_SYNC_INTERVAL_MS ENGINE_RECONCILE_INTERVAL_MS
  ENGINE_PRUNE_INTERVAL_MS USAGE_RETENTION_DAYS
)

push() {
  local svc="$1"; shift
  echo "→ service: $svc"
  local key val
  for key in "$@"; do
    val="${!key-}"
    if [ -z "${val}" ]; then
      echo "  · $key  (empty in .env — skipped)"
      continue
    fi
    # printf %s avoids a trailing newline; --stdin avoids shell-quoting the value.
    printf '%s' "$val" | railway variable set "$key" --stdin --service "$svc" --skip-deploys >/dev/null
    echo "  ✓ $key"
  done
}

push web    "${WEB_KEYS[@]}"
push engine "${ENGINE_KEYS[@]}"

echo
echo "All variables set (values never printed)."
echo "Next: railway up --service web  &&  railway up --service engine"
echo "Then: railway domain --service web  →  set NEXT_PUBLIC_APP_URL to that URL  →  redeploy web."
