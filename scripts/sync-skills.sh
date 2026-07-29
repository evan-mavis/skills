#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: sync-skills.sh [--check]

Install repository skills via the skills CLI.

  published.txt -> Codex only (~/.agents/skills). Cursor uses the ai-dev-workflow plugin.
  personal.txt  -> Cursor and Codex (~/.agents/skills)

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
    echo "Installed skills match the repository (~/.agents/skills)."
    exit 0
  fi
  echo "Run ./scripts/sync-skills.sh to refresh local installs." >&2
  exit 1
fi

if ((${#published[@]} > 0)); then
  published_args=()
  for skill in "${published[@]}"; do
    published_args+=(--skill "$skill")
  done
  "${skills_cli[@]}" add "$repo_root" "${published_args[@]}" -a codex -g -y
fi

if ((${#personal[@]} > 0)); then
  personal_args=()
  for skill in "${personal[@]}"; do
    personal_args+=(--skill "$skill")
  done
  "${skills_cli[@]}" add "$repo_root" "${personal_args[@]}" -a cursor -a codex -g -y
fi

if ! check_installed_skills; then
  echo "skills CLI finished, but installed skills still differ from the repository." >&2
  exit 1
fi

echo "Skills synced via skills CLI (~/.agents/skills)."
echo "installed skills: ${#repo_skills[@]} (${#published[@]} published via Codex + plugin, ${#personal[@]} personal via Cursor + Codex)"
