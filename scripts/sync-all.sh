#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: sync-all.sh [--check]

Sync repository skills into Codex, Cursor, and the ai-dev-workflow marketplace plugin.

  --check  Report drift without changing anything.

Environment overrides:
  CODEX_SKILLS_DIR    Passed to sync-skills.sh
  CURSOR_SKILLS_DIR   Passed to sync-skills.sh
  MARKETPLACE_ROOT    Passed to sync-marketplace.sh
EOF
}

mode=sync
case "${1:-}" in
  "") ;;
  --check) mode=check ;;
  -h|--help)
    usage
    exit 0
    ;;
  *)
    usage >&2
    exit 2
    ;;
esac

script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)

if [[ "$mode" == check ]]; then
  "$script_dir/sync-skills.sh" --check
  "$script_dir/sync-marketplace.sh" --check
else
  "$script_dir/sync-skills.sh"
  "$script_dir/sync-marketplace.sh"
fi

if [[ "$mode" == check ]]; then
  echo "Codex, Cursor, and marketplace plugin match the repository."
else
  echo "All skill destinations synced."
fi
