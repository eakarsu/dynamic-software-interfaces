#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"; [ -f .env ] && { set -a; . ./.env; set +a; }
: "${DATABASE_URL:?DATABASE_URL is required}"; [ "$#" -eq 1 ] && [ -f "$1" ] || { echo "Usage: ./restore.sh /path.dump" >&2; exit 2; }
[ "${CONFIRM_RESTORE:-}" = "RESTORE_TO_EMPTY_DATABASE" ] || { echo "Set CONFIRM_RESTORE=RESTORE_TO_EMPTY_DATABASE" >&2; exit 2; }
exec pg_restore --dbname="$DATABASE_URL" --exit-on-error --single-transaction --no-owner "$1"
