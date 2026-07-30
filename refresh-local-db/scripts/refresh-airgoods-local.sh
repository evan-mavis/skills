#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT=""
YES=false
FROM_RENDER_EXPORT=false
EXPORT_FILE=""
ALLOW_REMOTE_DSN=false
DSN=""
DSN_SOURCE=""
NEON_CONFIG_FILE="${NEON_CONFIG_FILE:-$HOME/.config/airgoods/local-dev-neon.env}"

usage() {
  cat <<'EOF'
Usage:
  refresh-airgoods-local.sh --yes [OPTIONS]

Default: reset the configured personal Neon dev branch from the production-copy
parent branch. This is the fast path after the Neon parent refresh action runs.

Legacy Render import (optional):
  refresh-airgoods-local.sh --yes --from-render-export --file <path> [OPTIONS]

Options:
  --yes                         Required. Confirms destructive refresh.
  --from-render-export          Import a local Render export instead of Neon reset.
  --file <path>                 Required with --from-render-export.
  --dsn <url>                   Target Postgres DSN for Render import only.
  --repo-root <path>            Airgoods repo root. Defaults to current git repo.
  --neon-config-file <path>     Neon dev branch config file.
  --allow-remote-dsn            Allow Render import into a non-local DSN.
  -h, --help                    Show this help.

Neon config file defaults to ~/.config/airgoods/local-dev-neon.env with:
  NEON_PROJECT_ID, NEON_PARENT_BRANCH_ID, NEON_LOCAL_DEV_BRANCH_NAME

Examples:
  refresh-airgoods-local.sh --yes
  refresh-airgoods-local.sh --yes --from-render-export --file ~/Downloads/stack.dir.tar.gz
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --yes)
      YES=true
      shift
      ;;
    --from-render-export)
      FROM_RENDER_EXPORT=true
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
    --neon-config-file)
      NEON_CONFIG_FILE="${2:-}"
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
  echo "This operation discards local changes in the target database." >&2
  exit 1
fi

if ! command -v git >/dev/null 2>&1; then
  echo "Error: required command not found: git" >&2
  exit 1
fi

if [[ -z "$REPO_ROOT" ]]; then
  REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
fi

load_neon_config() {
  local key value

  if [[ ! -f "$NEON_CONFIG_FILE" ]]; then
    echo "Error: Neon dev config not found: $NEON_CONFIG_FILE" >&2
    echo "Create a personal Neon dev branch first, then write branch metadata there." >&2
    exit 1
  fi

  while IFS='=' read -r key value; do
    [[ -z "$key" || "$key" == \#* ]] && continue
    value="${value%$'\r'}"
    printf -v "$key" '%s' "$value"
  done < "$NEON_CONFIG_FILE"

  if [[ -z "${NEON_PROJECT_ID:-}" || -z "${NEON_PARENT_BRANCH_ID:-}" || -z "${NEON_LOCAL_DEV_BRANCH_NAME:-}" ]]; then
    echo "Error: $NEON_CONFIG_FILE must define NEON_PROJECT_ID, NEON_PARENT_BRANCH_ID, and NEON_LOCAL_DEV_BRANCH_NAME." >&2
    exit 1
  fi
}

neon_cli() {
  if command -v neonctl >/dev/null 2>&1; then
    neonctl "$@"
  elif command -v neon >/dev/null 2>&1; then
    neon "$@"
  else
    npx --yes neonctl "$@"
  fi
}

wait_for_branch_ready() {
  local branch_ref="$1"
  local attempt state

  for attempt in $(seq 1 60); do
    state="$(
      neon_cli branches get "$branch_ref" \
        --project-id "$NEON_PROJECT_ID" \
        -o json \
        | python3 -c 'import json,sys; print(json.load(sys.stdin).get("branch", {}).get("current_state", ""))'
    )"
    if [[ "$state" == "ready" ]]; then
      return 0
    fi
    sleep 2
  done

  echo "Error: branch did not become ready: $branch_ref" >&2
  exit 1
}

refresh_neon_dev_branch() {
  load_neon_config

  echo "Resetting personal Neon dev branch from production-copy parent..."
  echo "  Project: ${NEON_PROJECT_ID}"
  echo "  Parent:  ${NEON_PARENT_BRANCH_ID}"
  echo "  Branch:  ${NEON_LOCAL_DEV_BRANCH_NAME}"

  neon_cli branches reset "$NEON_LOCAL_DEV_BRANCH_NAME" \
    --project-id "$NEON_PROJECT_ID" \
    --parent

  wait_for_branch_ready "$NEON_LOCAL_DEV_BRANCH_NAME"

  if [[ -n "${REPO_ROOT:-}" && -f "$REPO_ROOT/apps/backend/.env.local" ]]; then
    echo "  App override: $REPO_ROOT/apps/backend/.env.local"
  fi

  echo "Neon dev branch refresh complete."
  echo "Restart local app processes if they were connected during the reset."
}

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
  local key value

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

is_local_dsn() {
  local dsn_no_params="${DSN%%\?*}"
  local after_at="${dsn_no_params#*@}"
  local host_port host

  if [[ "$after_at" == "$dsn_no_params" ]]; then
    return 1
  fi

  host_port="${after_at%%/*}"
  host="${host_port%%:*}"
  [[ "$host" == "localhost" || "$host" == "127.0.0.1" || "$host" == "::1" || "$host" == "[::1]" ]]
}

refresh_from_render_export() {
  if [[ -z "$EXPORT_FILE" ]]; then
    echo "Error: --file is required with --from-render-export." >&2
    exit 1
  fi

  if [[ ! -f "$EXPORT_FILE" && ! -d "$EXPORT_FILE" ]]; then
    echo "Error: export path not found: $EXPORT_FILE" >&2
    exit 1
  fi

  if [[ -z "$REPO_ROOT" || ! -f "$REPO_ROOT/scripts/import-pg-export.sh" ]]; then
    echo "Error: could not find Airgoods repo root with scripts/import-pg-export.sh." >&2
    echo "Run from the repo or pass --repo-root /absolute/path/to/airgoods." >&2
    exit 1
  fi

  if [[ -z "$DSN" ]]; then
    resolve_backend_dsn
  elif [[ -z "$DSN_SOURCE" ]]; then
    DSN_SOURCE="DSN environment variable"
  fi

  if [[ "$ALLOW_REMOTE_DSN" != true ]] && ! is_local_dsn; then
    echo "Refusing to import into a non-local DSN." >&2
    echo "Pass --allow-remote-dsn only for an explicitly requested remote restore." >&2
    exit 1
  fi

  export_file_path="$(cd "$(dirname "$EXPORT_FILE")" && pwd)/$(basename "$EXPORT_FILE")"
  display_dsn="$(printf '%s' "$DSN" | sed -E 's#(postgres(ql)?://[^:]+:)[^@]*@#\1***@#')"

  echo "Importing local Render export into target database..."
  echo "  Export: ${export_file_path}"
  echo "  Target: ${display_dsn}"
  echo "  Source: ${DSN_SOURCE}"

  bash "$REPO_ROOT/scripts/import-pg-export.sh" \
    --file "$export_file_path" \
    --dsn "$DSN"

  echo "Local database refresh complete."
}

if [[ "$FROM_RENDER_EXPORT" == true ]]; then
  refresh_from_render_export
else
  refresh_neon_dev_branch
fi
