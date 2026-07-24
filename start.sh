#!/usr/bin/env bash
set -euo pipefail
project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)";set -a;source "$project_dir/.env";set +a;mode="${1:-start}"
case "$mode" in check) npm --prefix "$project_dir" run typecheck;exit;;migrate) npm --prefix "$project_dir" run migrate;exit;;start);;*)echo 'usage: ./start.sh check|migrate|start' >&2;exit 2;;esac
: "${DATABASE_URL:?DATABASE_URL is required}";: "${JWT_SECRET:?JWT_SECRET is required}";: "${OPENROUTER_API_KEY:?OPENROUTER_API_KEY is required}";: "${OPENROUTER_MODEL:?OPENROUTER_MODEL is required}";: "${OPENROUTER_BASE_URL:?OPENROUTER_BASE_URL is required}"
api_port="${BACKEND_PORT:?BACKEND_PORT is required}";ui_port="${FRONTEND_PORT:?FRONTEND_PORT is required}";[[ "$api_port" != "$ui_port" ]]||{ echo 'ports must differ' >&2;exit 1;};for port in "$api_port" "$ui_port";do ! lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1||{ echo "port $port is occupied" >&2;exit 1;};done
export BACKEND_HOST=127.0.0.1 FRONTEND_ORIGIN="http://127.0.0.1:$ui_port" BOOTSTRAP_ACKNOWLEDGEMENT=create-initial-admin
export VITE_BACKEND_URL="http://127.0.0.1:$api_port"
export BOOTSTRAP_TENANT_SLUG="${BOOTSTRAP_TENANT_SLUG:-runtime}" BOOTSTRAP_TENANT_NAME="${BOOTSTRAP_TENANT_NAME:-Runtime Tenant}" BOOTSTRAP_EMAIL="${ADMIN_EMAIL:?ADMIN_EMAIL is required}" BOOTSTRAP_PASSWORD="${ADMIN_PASSWORD:?ADMIN_PASSWORD is required}" BOOTSTRAP_NAME="${PROVISION_ADMIN_NAME:-Runtime Administrator}" BOOTSTRAP_ROLE=tenant_admin
export AI_PROVIDER_API_KEY="$OPENROUTER_API_KEY" AI_PROVIDER_MODEL="$OPENROUTER_MODEL" AI_PROVIDER_URL="$OPENROUTER_BASE_URL"
if [[ "${MIGRATE_ON_START:-false}" == "true" ]];then npm --prefix "$project_dir" run migrate;fi;npm --prefix "$project_dir/backend" run create-admin
cleanup(){ trap - INT TERM EXIT;[[ -z "${ui_pid:-}" ]]||kill "$ui_pid" 2>/dev/null||true;[[ -z "${api_pid:-}" ]]||kill "$api_pid" 2>/dev/null||true;[[ -z "${ui_pid:-}" ]]||wait "$ui_pid" 2>/dev/null||true;[[ -z "${api_pid:-}" ]]||wait "$api_pid" 2>/dev/null||true;};trap cleanup INT TERM EXIT
NODE_ENV=development npm --prefix "$project_dir/backend" start & api_pid=$!;for ((attempt=0;attempt<120;attempt++));do curl -fsS "http://127.0.0.1:$api_port/api/health" >/dev/null 2>&1&&break;ps -p "$api_pid" >/dev/null||{ wait "$api_pid";exit $?;};sleep 0.5;done;curl -fsS "http://127.0.0.1:$api_port/api/health" >/dev/null
npm --prefix "$project_dir" run dev -w frontend -- --host 127.0.0.1 --port "$ui_port" & ui_pid=$!;wait "$api_pid" "$ui_pid"
