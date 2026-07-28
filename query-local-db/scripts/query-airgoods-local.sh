#!/usr/bin/env bash
set -euo pipefail

readonly_option="-c default_transaction_read_only=on"
on_error_stop_option="-v ON_ERROR_STOP=1"

if [[ -n "${PGOPTIONS:-}" ]]; then
  export PGOPTIONS="${readonly_option} ${PGOPTIONS}"
else
  export PGOPTIONS="${readonly_option}"
fi

if [[ -n "${AIRGOODS_LOCAL_DATABASE_URL:-}" ]]; then
  exec psql ${on_error_stop_option} "${AIRGOODS_LOCAL_DATABASE_URL}" "$@"
fi

export PGDATABASE="${PGDATABASE:-stack}"
export PGHOST="${PGHOST:-localhost}"
export PGPORT="${PGPORT:-5432}"
export PGUSER="${PGUSER:-postgres}"

exec psql ${on_error_stop_option} "$@"
