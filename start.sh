#!/usr/bin/env bash
set -euo pipefail
project_root="$(cd "$(dirname "$0")" && pwd)"
if [ "${NODE_ENV:-development}" = test ]&&[ -n "${RUNTIME_PROJECT_SOURCE:-}" ]&&[ -d "$RUNTIME_PROJECT_SOURCE" ];then project_root="$RUNTIME_PROJECT_SOURCE";fi
cd "$project_root"
[ "${NODE_ENV:-development}" != test ]&&[ -f .env ]&&{ set -a;. ./.env;set +a; }
if [ "${NODE_ENV:-development}" = test ];then CONNECTOR_ENCRYPTION_KEY="${MEMORY_ENCRYPTION_KEY_BASE64:-}";FRONTEND_ORIGIN="http://127.0.0.1:${FRONTEND_PORT:-}";export CONNECTOR_ENCRYPTION_KEY FRONTEND_ORIGIN;fi
: "${DATABASE_URL:?DATABASE_URL is required}"
: "${JWT_SECRET:?JWT_SECRET is required}"
: "${CONNECTOR_ENCRYPTION_KEY:?CONNECTOR_ENCRYPTION_KEY is required}"
[ "${#JWT_SECRET}" -ge 32 ] || { echo "JWT_SECRET must be at least 32 characters" >&2; exit 1; }
[[ "${BACKEND_PORT:-}" =~ ^[0-9]+$ ]]&&[ "$BACKEND_PORT" -ge 1024 ]&&[ "$BACKEND_PORT" -le 65535 ]||{ echo "BACKEND_PORT must be an explicit integer between 1024 and 65535" >&2;exit 1; }
[ -d node_modules ] || { echo "Dependencies missing; run npm ci explicitly" >&2; exit 1; }
case "${1:-api}" in
  api) lsof -nP -iTCP:"$BACKEND_PORT" -sTCP:LISTEN >/dev/null 2>&1&&{ echo "Assigned port $BACKEND_PORT is occupied" >&2;exit 1;};BACKEND_HOST=127.0.0.1;export BACKEND_HOST;exec npm start ;;
  worker) exec npm run worker ;;
  frontend)
    [[ "${FRONTEND_PORT:-}" =~ ^[0-9]+$ ]]&&[ "$FRONTEND_PORT" -ge 1024 ]&&[ "$FRONTEND_PORT" -le 65535 ]||{ echo "FRONTEND_PORT must be an explicit integer between 1024 and 65535" >&2;exit 1; }
    [ "$FRONTEND_PORT" != "$BACKEND_PORT" ]||{ echo "FRONTEND_PORT and BACKEND_PORT must be different" >&2;exit 1; }
    lsof -nP -iTCP:"$FRONTEND_PORT" -sTCP:LISTEN >/dev/null 2>&1&&{ echo "Assigned port $FRONTEND_PORT is occupied" >&2;exit 1; }
    exec npm run dev -w frontend -- --host 127.0.0.1 --port "$FRONTEND_PORT"
    ;;
  *) echo "Usage: ./start.sh api|worker|frontend (run each in its own terminal)" >&2; exit 2 ;;
esac
