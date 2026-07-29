#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: sync-skills.sh [--check]

Install repository skills into Cursor and Codex via the skills CLI.

  --check  Report drift without changing anything.

Environment overrides:
  SKILLS_CLI          Defaults to "npx skills"
  AGENTS_SKILLS_DIR   Defaults to ~/.agents/skills
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
agents_root=${AGENTS_SKILLS_DIR:-$HOME/.agents/skills}
skills_cli=(npx skills)
if [[ -n "${SKILLS_CLI:-}" ]]; then
  # shellcheck disable=SC2206
  skills_cli=(${SKILLS_CLI})
fi

# shellcheck source=manifests.sh
source "$script_dir/manifests.sh"

published=()
personal=()
while IFS= read -r skill; do
  published+=("$skill")
done < <(read_manifest "$script_dir/published.txt")
while IFS= read -r skill; do
  personal+=("$skill")
done < <(read_manifest "$script_dir/personal.txt")
validate_manifests "$repo_root"

repo_skills=("${published[@]}" "${personal[@]}")

check_installed_skills() {
  local drift=0 skill target

  for skill in "${repo_skills[@]}"; do
    target="$agents_root/$skill"
    if [[ ! -d "$target" ]]; then
      echo "missing: $target"
      drift=1
    elif ! diff -qr "$repo_root/$skill" "$target" >/dev/null; then
      echo "different: $target"
      drift=1
    fi
  done

  return "$drift"
}

if [[ "$mode" == check ]]; then
  if check_installed_skills; then
    echo "Cursor and Codex skills match the repository (~/.agents/skills)."
    exit 0
  fi
  echo "Run ./scripts/sync-skills.sh to refresh local installs." >&2
  exit 1
fi

skill_args=()
for skill in "${repo_skills[@]}"; do
  skill_args+=(--skill "$skill")
done

"${skills_cli[@]}" add "$repo_root" "${skill_args[@]}" -a cursor -a codex -g -y

if ! check_installed_skills; then
  echo "skills CLI finished, but installed skills still differ from the repository." >&2
  exit 1
fi

echo "Cursor and Codex skills synced via skills CLI (~/.agents/skills)."
echo "installed skills: ${#repo_skills[@]} (${#published[@]} published, ${#personal[@]} personal)"
