#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: sync-all.sh [--check]

Sync repository skills into Codex, Cursor, and the ai-dev-workflow marketplace plugin.

  --check  Report drift without changing anything.

Workflow:
  1. sync-skills.sh      -> ~/.agents/skills via the skills CLI
  2. sync-marketplace.sh -> ../airgoods-plugin-marketplace/plugins/ai-dev-workflow

Manifests:
  scripts/published.txt  skills shipped in the marketplace plugin
  scripts/personal.txt   local-only skills (never copied to the plugin)

Environment overrides:
  SKILLS_CLI          Passed to sync-skills.sh
  AGENTS_SKILLS_DIR   Passed to sync-skills.sh
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
repo_root=$(cd "$script_dir/.." && pwd -P)

# shellcheck source=manifests.sh
source "$script_dir/manifests.sh"
validate_manifests "$repo_root"

if [[ "$mode" == check ]]; then
  "$script_dir/sync-skills.sh" --check
  "$script_dir/sync-marketplace.sh" --check
  echo "Codex, Cursor, and marketplace plugin match the repository."
else
  "$script_dir/sync-skills.sh"
  "$script_dir/sync-marketplace.sh"
  echo "All skill destinations synced."
fi
