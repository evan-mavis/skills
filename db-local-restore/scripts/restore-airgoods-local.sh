#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  restore-airgoods-local.sh [--db DB_NAME] /absolute/path/to/dump

Examples:
  restore-airgoods-local.sh /Users/evanmavis/Downloads/2026-04-27T17:30Z/stack_anry
  restore-airgoods-local.sh --db stack_restore_test /Users/evanmavis/Downloads/2026-04-27T17:30Z/stack_anry

Behavior:
  - Defaults to local Postgres connection settings if not already set.
  - Drops and recreates the target database.
  - Uses pg_restore for directory/custom dumps.
  - Uses psql for plain SQL files.
EOF
}

target_db="stack"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --db)
      target_db="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    --)
      shift
      break
      ;;
    -*)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
    *)
      break
      ;;
  esac
done

if [[ $# -ne 1 ]]; then
  usage >&2
  exit 1
fi

dump_path="$1"

if [[ -z "${target_db}" ]]; then
  echo "Target database name cannot be empty." >&2
  exit 1
fi

if [[ ! -e "${dump_path}" ]]; then
  echo "Dump path does not exist: ${dump_path}" >&2
  exit 1
fi

export PGHOST="${PGHOST:-localhost}"
export PGPORT="${PGPORT:-5432}"
export PGUSER="${PGUSER:-postgres}"

echo "Restoring dump into local database '${target_db}' as ${PGUSER}@${PGHOST}:${PGPORT}"
echo "Dump path: ${dump_path}"

dropdb --if-exists --force "${target_db}"
createdb "${target_db}"

if [[ -d "${dump_path}" || -f "${dump_path}/toc.dat" ]]; then
  pg_restore --dbname="${target_db}" --no-owner --no-acl "${dump_path}"
elif [[ -f "${dump_path}" && "${dump_path}" == *.sql ]]; then
  psql --dbname="${target_db}" -v ON_ERROR_STOP=1 -f "${dump_path}"
else
  echo "Unsupported dump format. Expected a pg_dump directory/custom dump or a .sql file." >&2
  exit 1
fi

echo "Restore complete for database '${target_db}'."
