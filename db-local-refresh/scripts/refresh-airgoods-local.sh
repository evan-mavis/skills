#!/usr/bin/env bash
set -euo pipefail

DEFAULT_DSN="postgresql://postgres:Paghf123-1@localhost:5500/stack"

DSN="${DSN:-$DEFAULT_DSN}"
REPO_ROOT=""
EXPORT_FILE=""
ALLOW_REMOTE_DSN=false
YES=false

usage() {
  cat <<'EOF'
Usage:
  refresh-airgoods-local.sh --yes --file <path> [OPTIONS]

Imports a local Render Postgres export into the local Airgoods template database `stack`.

Options:
  --yes                    Required. Confirms local database drop/recreate.
  --file <path>            Required. Path to a local Render export (.dir.tar.gz or compatible dump).
  --dsn <url>              Target Postgres DSN. Defaults to local stack on port 5500.
  --repo-root <path>       Airgoods repo root. Defaults to current git repo.
  --allow-remote-dsn       Allow importing into a non-local DSN. Use only when explicit.
  -h, --help               Show this help.

Examples:
  refresh-airgoods-local.sh --yes --file ~/Downloads/stack.dir.tar.gz
  refresh-airgoods-local.sh --yes --file ~/Downloads/stack.dir.tar.gz \
    --dsn postgresql://postgres:Paghf123-1@localhost:5432/stack
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

if [[ ! -f "$EXPORT_FILE" ]]; then
  echo "Error: export file not found: $EXPORT_FILE" >&2
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

echo "Importing local export into target database..."
echo "  Export: ${export_file_path}"
echo "  DSN:    ${DSN}"

bash "$REPO_ROOT/scripts/import-pg-export.sh" \
  --file "$export_file_path" \
  --dsn "$DSN"

echo "Local database refresh complete."
