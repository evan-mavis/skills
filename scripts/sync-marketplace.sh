#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: sync-marketplace.sh [--check]

Sync published workflow skills into the ai-dev-workflow marketplace plugin.

  --check  Report drift without changing anything.

Environment overrides:
  MARKETPLACE_ROOT  Defaults to ../airgoods-plugin-marketplace (sibling of this repo)
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
manifest="$script_dir/published-skills.txt"
marketplace_root=${MARKETPLACE_ROOT:-"$repo_root/../airgoods-plugin-marketplace"}
plugin_root="$marketplace_root/plugins/ai-dev-workflow"
target_skills_root="$plugin_root/skills"
target_readme="$plugin_root/README.md"
source_readme="$repo_root/ai-dev-workflow/README.md"

if [[ ! -f "$manifest" ]]; then
  echo "Missing manifest: $manifest" >&2
  exit 1
fi

if [[ ! -d "$marketplace_root" ]]; then
  echo "Marketplace repo not found: $marketplace_root" >&2
  echo "Set MARKETPLACE_ROOT to override." >&2
  exit 1
fi

skills=()
while IFS= read -r skill; do
  skills+=("$skill")
done < <(grep -Ev '^\s*(#|$)' "$manifest")

if [[ ${#skills[@]} -eq 0 ]]; then
  echo "No published skills listed in $manifest" >&2
  exit 1
fi

for skill in "${skills[@]}"; do
  if [[ ! -f "$repo_root/$skill/SKILL.md" ]]; then
    echo "Missing source skill: $repo_root/$skill/SKILL.md" >&2
    exit 1
  fi
done

if [[ ! -f "$source_readme" ]]; then
  echo "Missing workflow README: $source_readme" >&2
  exit 1
fi

check_marketplace() {
  local drift=0 skill target entry extra_name

  for skill in "${skills[@]}"; do
    target="$target_skills_root/$skill"
    if [[ ! -d "$target" ]]; then
      echo "missing: $target"
      drift=1
    elif ! diff -qr "$repo_root/$skill" "$target" >/dev/null; then
      echo "different: $target"
      drift=1
    fi
  done

  if [[ -d "$target_skills_root" ]]; then
    for entry in "$target_skills_root"/*; do
      extra_name=${entry##*/}
      local found=false
      for skill in "${skills[@]}"; do
        if [[ "$skill" == "$extra_name" ]]; then
          found=true
          break
        fi
      done
      if [[ "$found" == false ]]; then
        echo "extra: $entry"
        drift=1
      fi
    done
  fi

  if [[ ! -f "$target_readme" ]]; then
    echo "missing: $target_readme"
    drift=1
  elif ! diff -q "$source_readme" "$target_readme" >/dev/null; then
    echo "different: $target_readme"
    drift=1
  fi

  return "$drift"
}

sync_marketplace() {
  local skill
  local staging

  staging=$(mktemp -d)
  cleanup() {
    rm -rf "$staging"
  }
  trap cleanup EXIT

  mkdir -p "$staging/skills"
  for skill in "${skills[@]}"; do
    mkdir -p "$staging/skills/$skill"
    rsync -a --delete "$repo_root/$skill/" "$staging/skills/$skill/"
  done

  mkdir -p "$target_skills_root"
  rsync -a --delete "$staging/skills/" "$target_skills_root/"
  cp "$source_readme" "$target_readme"

  rm -rf "$staging"
  trap - EXIT

  echo "synced marketplace plugin: $plugin_root"
  echo "published skills: ${#skills[@]}"
}

if [[ "$mode" == check ]]; then
  if check_marketplace; then
    echo "Marketplace plugin matches the repository."
    exit 0
  fi
  exit 1
fi

sync_marketplace
