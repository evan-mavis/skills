#!/usr/bin/env bash
set -euo pipefail

DSN="${DSN:-}"
REPO_ROOT=""
EXPORT_FILE=""
ALLOW_REMOTE_DSN=false
YES=false
DSN_SOURCE=""

usage() {
  cat <<'EOF'
Usage:
  refresh-airgoods-local.sh --yes --file <path> [OPTIONS]

Imports a local Render Postgres export into the database used by the developer's
local Airgoods application environment, as configured by `apps/backend`.

Options:
  --yes                    Required. Confirms local database drop/recreate.
  --file <path>            Required. Path to a local Render export file or extracted directory dump.
  --dsn <url>              Target Postgres DSN. Defaults to the backend app's effective database.
  --repo-root <path>       Airgoods repo root. Defaults to current git repo.
  --allow-remote-dsn       Allow importing into a non-local DSN. Use only when explicit.
  -h, --help               Show this help.

Examples:
  refresh-airgoods-local.sh --yes --file ~/Downloads/stack.dir.tar.gz
  refresh-airgoods-local.sh --yes --file ~/Downloads/stack_export
  refresh-airgoods-local.sh --yes --file ~/Downloads/stack.dir.tar.gz \
    --dsn postgresql://postgres:<password>@localhost:5432/stack
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --yes)
      YES=true
      shift
      ;;
    --file)
      EXPORT_FILE="${2:-}"
      shift 2
      ;;
    --dsn)
      DSN="${2:-}"
      DSN_SOURCE="--dsn"
      shift 2
      ;;
    --repo-root)
      REPO_ROOT="${2:-}"
      shift 2
      ;;
    --allow-remote-dsn)
      ALLOW_REMOTE_DSN=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ "$YES" != true ]]; then
  echo "Refusing to continue without --yes." >&2
  echo "This operation drops and recreates the target database." >&2
  exit 1
fi

if [[ -z "$EXPORT_FILE" ]]; then
  echo "Error: --file is required." >&2
  echo "Provide the path to a local Render export (.dir.tar.gz)." >&2
  usage >&2
  exit 1
fi

if [[ ! -f "$EXPORT_FILE" && ! -d "$EXPORT_FILE" ]]; then
  echo "Error: export path not found: $EXPORT_FILE" >&2
  exit 1
fi

if ! command -v git >/dev/null 2>&1; then
  echo "Error: required command not found: git" >&2
  exit 1
fi

if [[ -z "$REPO_ROOT" ]]; then
  REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
fi

if [[ -z "$REPO_ROOT" || ! -f "$REPO_ROOT/scripts/import-pg-export.sh" ]]; then
  echo "Error: could not find Airgoods repo root with scripts/import-pg-export.sh." >&2
  echo "Run from the repo or pass --repo-root /absolute/path/to/airgoods." >&2
  exit 1
fi

read_dotenv_value() {
  local file="$1"
  local key="$2"
  local value

  [[ -f "$file" ]] || return 1
  value="$(
    awk -v key="$key" '
      index($0, key "=") == 1 {
        value = substr($0, length(key) + 2)
        found = 1
      }
      END {
        if (found) print value
        else exit 1
      }
    ' "$file"
  )" || return 1

  value="${value%$'\r'}"
  if [[ "$value" == \"*\" && "$value" == *\" ]]; then
    value="${value:1:${#value}-2}"
  elif [[ "$value" == \'*\' && "$value" == *\' ]]; then
    value="${value:1:${#value}-2}"
  fi
  printf '%s' "$value"
}

load_backend_env_file() {
  local file="$1"
  local key
  local value

  for key in \
    DATABASE_URL NODE_ENVIRONMENT \
    DB_HOST DB_PORT DB_USER_NAME DB_PASSWORD DB_NAME \
    DB_HOST_TEST DB_PORT_TEST DB_USER_NAME_TEST DB_PASSWORD_TEST DB_NAME_TEST \
    DB_HOST_LOCAL DB_PORT_LOCAL DB_USER_NAME_LOCAL DB_PASSWORD_LOCAL DB_NAME_LOCAL
  do
    if value="$(read_dotenv_value "$file" "$key")"; then
      printf -v "$key" '%s' "$value"
    fi
  done
}

resolve_backend_dsn() {
  local backend_dir="$REPO_ROOT/apps/backend"
  local suffix
  local host_key port_key user_key password_key name_key
  local host port user password name

  if [[ ! -f "$backend_dir/.env" && ! -f "$backend_dir/.env.local" ]]; then
    echo "Error: backend .env configuration was not found." >&2
    echo "Pass --dsn explicitly or create apps/backend/.env." >&2
    exit 1
  fi

  load_backend_env_file "$backend_dir/.env"
  load_backend_env_file "$backend_dir/.env.local"

  if [[ -n "${DATABASE_URL:-}" ]]; then
    DSN="$DATABASE_URL"
    DSN_SOURCE="apps/backend effective DATABASE_URL"
    return
  fi

  case "${NODE_ENVIRONMENT:-development}" in
    production) suffix="" ;;
    testing) suffix="_TEST" ;;
    *) suffix="_LOCAL" ;;
  esac

  host_key="DB_HOST${suffix}"
  port_key="DB_PORT${suffix}"
  user_key="DB_USER_NAME${suffix}"
  password_key="DB_PASSWORD${suffix}"
  name_key="DB_NAME${suffix}"
  host="${!host_key:-}"
  port="${!port_key:-5432}"
  user="${!user_key:-}"
  password="${!password_key:-}"
  name="${!name_key:-}"

  if [[ -z "$host" || -z "$user" || -z "$name" ]]; then
    echo "Error: backend database configuration is incomplete for NODE_ENVIRONMENT=${NODE_ENVIRONMENT:-development}." >&2
    echo "Pass --dsn explicitly or fix apps/backend/.env." >&2
    exit 1
  fi

  DSN="postgresql://${user}:${password}@${host}:${port}/${name}"
  DSN_SOURCE="apps/backend DB_*${suffix} configuration"
}

if [[ -z "$DSN" ]]; then
  resolve_backend_dsn
elif [[ -z "$DSN_SOURCE" ]]; then
  DSN_SOURCE="DSN environment variable"
fi

is_local_dsn() {
  local dsn_no_params="${DSN%%\?*}"
  local after_at="${dsn_no_params#*@}"
  local host_port
  local host

  if [[ "$after_at" == "$dsn_no_params" ]]; then
    return 1
  fi

  host_port="${after_at%%/*}"
  host="${host_port%%:*}"
  [[ "$host" == "localhost" || "$host" == "127.0.0.1" || "$host" == "::1" || "$host" == "[::1]" ]]
}

if [[ "$ALLOW_REMOTE_DSN" != true ]] && ! is_local_dsn; then
  echo "Refusing to import into a non-local DSN." >&2
  echo "Pass --allow-remote-dsn only for an explicitly requested remote restore." >&2
  exit 1
fi

export_file_path="$(cd "$(dirname "$EXPORT_FILE")" && pwd)/$(basename "$EXPORT_FILE")"
display_dsn="$(printf '%s' "$DSN" | sed -E 's#(postgres(ql)?://[^:]+:)[^@]*@#\1***@#')"

echo "Importing local export into target database..."
echo "  Export: ${export_file_path}"
echo "  Target: ${display_dsn}"
echo "  Source: ${DSN_SOURCE}"

bash "$REPO_ROOT/scripts/import-pg-export.sh" \
  --file "$export_file_path" \
  --dsn "$DSN"

echo "Local database refresh complete."
