#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

database_url_env=""
database_url_env_requested="false"
show_source="false"
psql_args=()

print_help() {
  cat <<'EOF'
Query PostgreSQL in read-only mode for Airgoods local dev or verified task databases.

Usage:
  bash query-airgoods-local.sh --show-source
  bash query-airgoods-local.sh -c "select now()"
  bash query-airgoods-local.sh --csv -c "select id, name from public.supplier limit 20"
  bash query-airgoods-local.sh --database-url-env DATABASE_URL -c "select now()"

Connection resolution:
  1. --database-url-env <name> when caller verified an isolated task database
  2. AIRGOODS_LOCAL_DATABASE_URL when explicitly exported in the shell
  3. apps/backend/.env.example + apps/backend/.env.local when run from an Airgoods repo
  4. localhost Postgres defaults (PGDATABASE=stack, PGHOST=localhost, PGPORT=5432)
EOF
}

find_backend_env_files() {
  local dir="${PWD}"
  while [[ "${dir}" != "/" ]]; do
    if [[ -f "${dir}/apps/backend/.env.example" ]]; then
      printf '%s\n' "${dir}/apps/backend/.env.example"
      if [[ -f "${dir}/apps/backend/.env.local" ]]; then
        printf '%s\n' "${dir}/apps/backend/.env.local"
      fi
      return 0
    fi
    dir="$(dirname "${dir}")"
  done

  if command -v git >/dev/null 2>&1; then
    local git_root=""
    git_root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
    if [[ -n "${git_root}" && -f "${git_root}/apps/backend/.env.example" ]]; then
      printf '%s\n' "${git_root}/apps/backend/.env.example"
      if [[ -f "${git_root}/apps/backend/.env.local" ]]; then
        printf '%s\n' "${git_root}/apps/backend/.env.local"
      fi
      return 0
    fi
  fi

  return 1
}

load_backend_env_resolution() {
  local resolved_env=""
  local env_files=()
  local file=""

  while IFS= read -r file; do
    [[ -n "${file}" ]] && env_files+=("${file}")
  done < <(find_backend_env_files)

  [[ "${#env_files[@]}" -gt 0 ]] || return 1

  resolved_env="$(mktemp)"
  trap 'rm -f "${resolved_env}"' RETURN

  node - "${env_files[@]}" >"${resolved_env}" <<'NODE'
const fs = require('fs');

const wantedKeys = new Set([
  'DATABASE_URL',
  'DB_HOST_LOCAL',
  'DB_PORT_LOCAL',
  'DB_USER_NAME_LOCAL',
  'DB_PASSWORD_LOCAL',
  'DB_NAME_LOCAL',
]);

const parsed = {};

for (const file of process.argv.slice(2)) {
  const contents = fs.readFileSync(file, 'utf8');

  for (const rawLine of contents.split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    if (trimmed === '' || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = rawLine.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = rawLine.slice(0, separatorIndex).trim();
    if (!wantedKeys.has(key)) {
      continue;
    }

    let value = rawLine.slice(separatorIndex + 1).trim();
    const isWrappedInDoubleQuotes =
      value.startsWith('"') && value.endsWith('"');
    const isWrappedInSingleQuotes =
      value.startsWith("'") && value.endsWith("'");
    if (isWrappedInDoubleQuotes || isWrappedInSingleQuotes) {
      value = value.slice(1, -1);
    }

    parsed[key] = value;
  }
}

function describeConnection(parsedValues) {
  if (parsedValues.DATABASE_URL) {
    try {
      const url = new URL(parsedValues.DATABASE_URL);
      const host = url.hostname;
      const database = url.pathname.replace(/^\//, '') || 'postgres';
      let source = 'remote-url';
      if (host.includes('neon.tech')) {
        source = url.hostname.includes('-pooler.')
          ? 'neon-pooler'
          : 'neon-direct';
      } else if (
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host === '::1'
      ) {
        source = 'local-url';
      }

      return {
        mode: 'url',
        source,
        label: `${source} database=${database} host=${host}`,
      };
    } catch {
      return {
        mode: 'url',
        source: 'remote-url',
        label: 'remote-url database=<unparseable DATABASE_URL>',
      };
    }
  }

  const host = parsedValues.DB_HOST_LOCAL || 'localhost';
  const port = parsedValues.DB_PORT_LOCAL || '5432';
  const database = parsedValues.DB_NAME_LOCAL || 'stack';
  let source = 'local-host';

  if (host === 'localhost' || host === '127.0.0.1' || host === '::1') {
    source = port === '5500' ? 'local-docker' : 'local-host';
  }

  return {
    mode: 'host',
    source,
    label: `${source} database=${database} host=${host} port=${port}`,
  };
}

function shellExport(name, value) {
  return `export ${name}=${JSON.stringify(value)}`;
}

const connection = describeConnection(parsed);

console.log(shellExport('CONNECTION_MODE', connection.mode));
console.log(shellExport('CONNECTION_SOURCE', connection.source));
console.log(shellExport('CONNECTION_LABEL', connection.label));

for (const [key, value] of Object.entries(parsed)) {
  console.log(shellExport(key, value));
}
NODE

  # shellcheck disable=SC1090
  source "${resolved_env}"
}

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
    --show-source)
      show_source="true"
      shift
      ;;
    --help | -h)
      print_help
      exit 0
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

if [[ "${show_source}" == "false" && "${#psql_args[@]}" -eq 0 ]]; then
  print_help
  exit 0
fi

CONNECTION_MODE=""
CONNECTION_SOURCE=""
CONNECTION_LABEL=""
readonly_psql_prefix=()

if [[ "${database_url_env_requested}" == "true" ]]; then
  if [[ -z "${database_url_env}" ]]; then
    echo "query-airgoods-local: --database-url-env requires an environment variable name" >&2
    exit 2
  fi

  if [[ ! "${database_url_env}" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
    echo "query-airgoods-local: invalid environment variable name" >&2
    exit 2
  fi

  if ! DATABASE_URL="$(printenv "${database_url_env}")" || [[ -z "${DATABASE_URL}" ]]; then
    echo "query-airgoods-local: ${database_url_env} is not set" >&2
    exit 2
  fi

  CONNECTION_MODE="url"
  CONNECTION_SOURCE="task-env"
  CONNECTION_LABEL="task-env via ${database_url_env}"
  readonly_psql_prefix=(-c "SET default_transaction_read_only = ON;")
elif [[ -n "${AIRGOODS_LOCAL_DATABASE_URL:-}" ]]; then
  DATABASE_URL="${AIRGOODS_LOCAL_DATABASE_URL}"
  CONNECTION_MODE="url"
  CONNECTION_SOURCE="shell-override"
  CONNECTION_LABEL="shell-override via AIRGOODS_LOCAL_DATABASE_URL"
  readonly_psql_prefix=(-c "SET default_transaction_read_only = ON;")
elif load_backend_env_resolution; then
  if [[ "${CONNECTION_MODE}" == "url" ]]; then
    : "${DATABASE_URL:?DATABASE_URL is required}"
    readonly_psql_prefix=(-c "SET default_transaction_read_only = ON;")
  else
    : "${DB_HOST_LOCAL:?DB_HOST_LOCAL is required}"
    : "${DB_PORT_LOCAL:?DB_PORT_LOCAL is required}"
    : "${DB_USER_NAME_LOCAL:?DB_USER_NAME_LOCAL is required}"
    : "${DB_PASSWORD_LOCAL:?DB_PASSWORD_LOCAL is required}"
    : "${DB_NAME_LOCAL:?DB_NAME_LOCAL is required}"

    readonly_pgoptions="-c default_transaction_read_only=on"
    if [[ -n "${PGOPTIONS:-}" ]]; then
      readonly_pgoptions="${PGOPTIONS} ${readonly_pgoptions}"
    fi
    export PGOPTIONS="${readonly_pgoptions}"
  fi
else
  CONNECTION_MODE="host"
  CONNECTION_SOURCE="localhost-default"
  CONNECTION_LABEL="localhost-default database=${PGDATABASE:-stack} host=${PGHOST:-localhost} port=${PGPORT:-5432}"

  export PGDATABASE="${PGDATABASE:-stack}"
  export PGHOST="${PGHOST:-localhost}"
  export PGPORT="${PGPORT:-5432}"
  export PGUSER="${PGUSER:-postgres}"

  readonly_pgoptions="-c default_transaction_read_only=on"
  if [[ -n "${PGOPTIONS:-}" ]]; then
    readonly_pgoptions="${PGOPTIONS} ${readonly_pgoptions}"
  fi
  export PGOPTIONS="${readonly_pgoptions}"
fi

echo "query-airgoods-local: ${CONNECTION_LABEL}" >&2

run_psql() {
  if [[ "${CONNECTION_MODE}" == "url" ]]; then
    psql -X -q -v ON_ERROR_STOP=1 "${DATABASE_URL}" "${readonly_psql_prefix[@]}" "$@"
  else
    PGPASSWORD="${DB_PASSWORD_LOCAL:-${PGPASSWORD:-}}" \
      psql \
      -X \
      -v ON_ERROR_STOP=1 \
      -h "${DB_HOST_LOCAL:-${PGHOST}}" \
      -p "${DB_PORT_LOCAL:-${PGPORT}}" \
      -U "${DB_USER_NAME_LOCAL:-${PGUSER}}" \
      -d "${DB_NAME_LOCAL:-${PGDATABASE}}" \
      "$@"
  fi
}

if [[ "${show_source}" == "true" ]]; then
  run_psql -c "
    select
      current_database() as database,
      current_user as db_user,
      coalesce(inet_server_addr()::text, 'local') as server_addr,
      coalesce(inet_server_port()::text, 'local') as server_port,
      version() as version;
  "

  if [[ "${#psql_args[@]}" -eq 0 ]]; then
    exit 0
  fi
fi

run_psql "${psql_args[@]}"
