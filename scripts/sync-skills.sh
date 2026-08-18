#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: sync-skills.sh [--check]

Install repository skills via the skills CLI.

  published.txt -> Codex only (~/.codex/skills). Cursor uses the ai-dev-workflow plugin.
  personal.txt  -> Cursor and Codex (~/.cursor/skills and ~/.codex/skills)
  references/   -> shared references in both skill roots

  --check  Report drift without changing anything.

Environment overrides:
  SKILLS_CLI          Defaults to "npx skills"
  AGENTS_SKILLS_DIR   Defaults to ~/.agents/skills (legacy cleanup only)
  CURSOR_SKILLS_DIR   Defaults to ~/.cursor/skills
  CODEX_SKILLS_DIR    Defaults to ~/.codex/skills
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
cursor_root=${CURSOR_SKILLS_DIR:-$HOME/.cursor/skills}
codex_root=${CODEX_SKILLS_DIR:-$HOME/.codex/skills}
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
  local drift=0 skill target root

  for skill in "${published[@]}"; do
    target="$codex_root/$skill"
    if [[ ! -d "$target" ]]; then
      echo "missing: $target"
      drift=1
    elif ! diff -qr "$repo_root/$skill" "$target" >/dev/null; then
      echo "different: $target"
      drift=1
    fi
    for root in "$cursor_root" "$agents_root"; do
      if [[ -d "$root/$skill" ]]; then
        echo "unexpected duplicate: $root/$skill"
        drift=1
      fi
    done
  done

  for skill in "${personal[@]}"; do
    for root in "$codex_root" "$cursor_root"; do
      target="$root/$skill"
      if [[ ! -d "$target" ]]; then
        echo "missing: $target"
        drift=1
      elif ! diff -qr "$repo_root/$skill" "$target" >/dev/null; then
        echo "different: $target"
        drift=1
      fi
    done
    if [[ -d "$agents_root/$skill" ]]; then
      echo "unexpected legacy duplicate: $agents_root/$skill"
      drift=1
    fi
  done

  if [[ -d "$repo_root/references" ]]; then
    for root in "$codex_root" "$cursor_root"; do
      target="$root/references"
      if [[ ! -d "$target" ]]; then
        echo "missing: $target"
        drift=1
      elif ! diff -qr "$repo_root/references" "$target" >/dev/null; then
        echo "different: $target"
        drift=1
      fi
    done
    if [[ -d "$agents_root/references" ]]; then
      echo "unexpected legacy duplicate: $agents_root/references"
      drift=1
    fi
  fi

  return "$drift"
}

sync_shared_references() {
  local root

  [[ -d "$repo_root/references" ]] || return 0

  for root in "$codex_root" "$cursor_root"; do
    mkdir -p "$root/references"
    rsync -a --delete "$repo_root/references/" "$root/references/"
  done
  rm -rf "$agents_root/references"
}

if [[ "$mode" == check ]]; then
  if check_installed_skills; then
    echo "Installed skills match the repository (Codex + Cursor)."
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
  "${skills_cli[@]}" remove -g -a cursor -s "${published[@]}" -y >/dev/null
  for skill in "${published[@]}"; do
    rm -rf "$codex_root/$skill" "$cursor_root/$skill" "$agents_root/$skill"
    cp -R "$repo_root/$skill" "$codex_root/$skill"
  done
fi

if ((${#personal[@]} > 0)); then
  personal_args=()
  for skill in "${personal[@]}"; do
    personal_args+=(--skill "$skill")
  done
  "${skills_cli[@]}" add "$repo_root" "${personal_args[@]}" -a cursor -a codex -g -y
  for skill in "${personal[@]}"; do
    rm -rf "$codex_root/$skill" "$cursor_root/$skill" "$agents_root/$skill"
    cp -R "$repo_root/$skill" "$codex_root/$skill"
    cp -R "$repo_root/$skill" "$cursor_root/$skill"
  done
fi

sync_shared_references

if ! check_installed_skills; then
  echo "skills CLI finished, but installed skills still differ from the repository." >&2
  exit 1
fi

echo "Skills synced via skills CLI."
echo "installed skills: ${#repo_skills[@]} (${#published[@]} published via Codex + plugin, ${#personal[@]} personal via Cursor + Codex)"
