#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: sync-skills.sh [--check]

Sync repository skills into Codex and Cursor.

  --check  Report drift without changing anything.

Environment overrides:
  CODEX_SKILLS_DIR   Defaults to ${CODEX_HOME:-$HOME/.codex}/skills
  CURSOR_SKILLS_DIR  Defaults to $HOME/.cursor/skills
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
codex_root=${CODEX_SKILLS_DIR:-${CODEX_HOME:-$HOME/.codex}/skills}
cursor_root=${CURSOR_SKILLS_DIR:-$HOME/.cursor/skills}

shopt -s nullglob
skill_files=("$repo_root"/*/SKILL.md)
if [[ ${#skill_files[@]} -eq 0 ]]; then
  echo "No top-level skills found in $repo_root" >&2
  exit 1
fi

is_repo_skill() {
  [[ -f "$repo_root/$1/SKILL.md" ]]
}

check_target() {
  local target_root=$1
  local prune_extras=$2
  local drift=0
  local skill_file skill_dir skill_name target entry extra_name

  for skill_file in "${skill_files[@]}"; do
    skill_dir=${skill_file%/SKILL.md}
    skill_name=${skill_dir##*/}
    target="$target_root/$skill_name"
    if [[ ! -d "$target" ]]; then
      echo "missing: $target"
      drift=1
    elif ! diff -qr "$skill_dir" "$target" >/dev/null; then
      echo "different: $target"
      drift=1
    fi
  done

  if [[ "$prune_extras" == true && -d "$target_root" ]]; then
    for entry in "$target_root"/*; do
      extra_name=${entry##*/}
      if ! is_repo_skill "$extra_name"; then
        echo "extra: $entry"
        drift=1
      fi
    done
  fi

  return "$drift"
}

sync_target() {
  local target_root=$1
  local prune_extras=$2
  local skill_file skill_dir skill_name entry extra_name

  mkdir -p "$target_root"
  for skill_file in "${skill_files[@]}"; do
    skill_dir=${skill_file%/SKILL.md}
    skill_name=${skill_dir##*/}
    mkdir -p "$target_root/$skill_name"
    rsync -a --delete "$skill_dir/" "$target_root/$skill_name/"
    echo "synced: $target_root/$skill_name"
  done

  if [[ "$prune_extras" == true ]]; then
    if ! command -v trash >/dev/null 2>&1; then
      echo "trash is required to prune extra Cursor skills safely" >&2
      exit 1
    fi
    for entry in "$target_root"/*; do
      extra_name=${entry##*/}
      if ! is_repo_skill "$extra_name"; then
        trash "$entry"
        echo "moved extra skill to Trash: $entry"
      fi
    done
  fi
}

if [[ "$mode" == check ]]; then
  drift=0
  check_target "$codex_root" false || drift=1
  check_target "$cursor_root" true || drift=1
  if [[ "$drift" -ne 0 ]]; then
    exit 1
  fi
  echo "Codex and Cursor skills match the repository."
  exit 0
fi

# Codex may contain system, plugin, or unrelated personal skills, so preserve extras.
sync_target "$codex_root" false

# Cursor's user skill directory is an exact mirror of this repository. Cursor's
# separately managed built-ins under ~/.cursor/skills-cursor remain untouched.
sync_target "$cursor_root" true

echo "Codex and Cursor skill sync complete."
