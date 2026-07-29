#!/usr/bin/env bash
set -euo pipefail

readonly_option="-c default_transaction_read_only=on"
database_url_env=""
database_url_env_requested="false"
psql_args=()

while [[ "$#" -gt 0 ]]; do
  case "$1" in
    --database-url-env)
      if [[ "$#" -lt 2 ]]; then
        echo "query-airgoods-local: --database-url-env requires an environment variable name" >&2
        exit 2
      fi
      database_url_env="$2"
      database_url_env_requested="true"
      shift 2
      ;;
    --database-url-env=*)
      database_url_env="${1#*=}"
      database_url_env_requested="true"
      shift
      ;;
    --)
      shift
      while [[ "$#" -gt 0 ]]; do
        psql_args+=("$1")
        shift
      done
      ;;
    *)
      psql_args+=("$1")
      shift
      ;;
  esac
done

if [[ -n "${PGOPTIONS:-}" ]]; then
  export PGOPTIONS="${readonly_option} ${PGOPTIONS}"
else
  export PGOPTIONS="${readonly_option}"
fi

if [[ "${database_url_env_requested}" == "true" ]]; then
  if [[ -z "${database_url_env}" ]]; then
    echo "query-airgoods-local: --database-url-env requires an environment variable name" >&2
    exit 2
  fi

  if [[ ! "${database_url_env}" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
    echo "query-airgoods-local: invalid environment variable name" >&2
    exit 2
  fi

  if ! database_url="$(printenv "${database_url_env}")" || [[ -z "${database_url}" ]]; then
    echo "query-airgoods-local: ${database_url_env} is not set" >&2
    exit 2
  fi

  exec psql -v ON_ERROR_STOP=1 "${database_url}" "${psql_args[@]}"
fi

if [[ -n "${AIRGOODS_LOCAL_DATABASE_URL:-}" ]]; then
  exec psql -v ON_ERROR_STOP=1 "${AIRGOODS_LOCAL_DATABASE_URL}" "${psql_args[@]}"
fi

export PGDATABASE="${PGDATABASE:-stack}"
export PGHOST="${PGHOST:-localhost}"
export PGPORT="${PGPORT:-5432}"
export PGUSER="${PGUSER:-postgres}"

exec psql -v ON_ERROR_STOP=1 "${psql_args[@]}"
