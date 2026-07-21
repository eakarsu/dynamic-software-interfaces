#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
[ -f .env ] && { set -a; . ./.env; set +a; }
: "${DATABASE_URL:?DATABASE_URL is required}"
exec npm run migrate
