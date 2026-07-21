#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"; [ -f .env ] && { set -a; . ./.env; set +a; }
: "${DATABASE_URL:?DATABASE_URL is required}"; [ "$#" -eq 1 ] || { echo "Usage: ./backup.sh /new/path.dump" >&2; exit 2; }
[ ! -e "$1" ] || { echo "Refusing to overwrite backup" >&2; exit 2; }; exec pg_dump --dbname="$DATABASE_URL" --format=custom --file="$1"
