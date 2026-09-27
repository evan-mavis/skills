#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: sync-skills.sh [--check]

Install repository skills via the skills CLI.

  published.txt -> Codex and the agents hub. Cursor uses the ai-dev-workflow plugin.
  personal.txt  -> Cursor, Codex, and the agents hub.
  references/   -> shared references in all three skill roots

  The agents hub (~/.agents/skills) is a distribution target, never a source. Claude
  Code and Droid reach it through the symlinks they keep in their own skill dirs.

  --check  Report drift without changing anything.

Environment overrides:
  SKILLS_CLI          Defaults to "npx skills"
  AGENTS_SKILLS_DIR   Defaults to ~/.agents/skills
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
skills_root="$repo_root/ai-dev-workflow/skills"
personal_root="$repo_root/personal-skills"
shared_references="$skills_root/references"
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
  local drift=0 skill target root source_root

  for skill in "${published[@]}"; do
    source_root="$skills_root"
    for root in "$codex_root" "$agents_root"; do
      target="$root/$skill"
      if [[ ! -d "$target" ]]; then
        echo "missing: $target"
        drift=1
      elif ! diff -qr "$source_root/$skill" "$target" >/dev/null; then
        echo "different: $target"
        drift=1
      fi
    done
    if [[ -d "$cursor_root/$skill" ]]; then
      echo "unexpected duplicate: $cursor_root/$skill"
      drift=1
    fi
  done

  for skill in "${personal[@]}"; do
    source_root="$personal_root"
    for root in "$codex_root" "$cursor_root" "$agents_root"; do
      target="$root/$skill"
      if [[ ! -d "$target" ]]; then
        echo "missing: $target"
        drift=1
      elif ! diff -qr "$source_root/$skill" "$target" >/dev/null; then
        echo "different: $target"
        drift=1
      fi
    done
  done

  if [[ -d "$shared_references" ]]; then
    for root in "$codex_root" "$cursor_root" "$agents_root"; do
      target="$root/references"
      if [[ ! -d "$target" ]]; then
        echo "missing: $target"
        drift=1
      elif ! diff -qr "$shared_references" "$target" >/dev/null; then
        echo "different: $target"
        drift=1
      fi
    done
  fi

  return "$drift"
}

sync_shared_references() {
  local root

  [[ -d "$shared_references" ]] || return 0

  for root in "$codex_root" "$cursor_root" "$agents_root"; do
    mkdir -p "$root/references"
    rsync -a --delete "$shared_references/" "$root/references/"
  done
}

if [[ "$mode" == check ]]; then
  if check_installed_skills; then
    echo "Installed skills match the repository (Codex + Cursor + agents hub)."
    exit 0
  fi
  echo "Run ./scripts/sync-skills.sh to refresh local installs." >&2
  exit 1
fi

mkdir -p "$codex_root" "$cursor_root" "$agents_root"

if ((${#published[@]} > 0)); then
  published_args=()
  for skill in "${published[@]}"; do
    published_args+=(--skill "$skill")
  done
  "${skills_cli[@]}" add "$skills_root" "${published_args[@]}" -a codex -g -y
  "${skills_cli[@]}" remove -g -a cursor -s "${published[@]}" -y >/dev/null
  for skill in "${published[@]}"; do
    rm -rf "$codex_root/$skill" "$cursor_root/$skill" "$agents_root/$skill"
    cp -R "$skills_root/$skill" "$codex_root/$skill"
    cp -R "$skills_root/$skill" "$agents_root/$skill"
  done
fi

if ((${#personal[@]} > 0)); then
  personal_args=()
  for skill in "${personal[@]}"; do
    personal_args+=(--skill "$skill")
  done
  "${skills_cli[@]}" add "$personal_root" "${personal_args[@]}" -a cursor -a codex -g -y
  for skill in "${personal[@]}"; do
    rm -rf "$codex_root/$skill" "$cursor_root/$skill" "$agents_root/$skill"
    cp -R "$personal_root/$skill" "$codex_root/$skill"
    cp -R "$personal_root/$skill" "$cursor_root/$skill"
    cp -R "$personal_root/$skill" "$agents_root/$skill"
  done
fi

sync_shared_references

if ! check_installed_skills; then
  echo "skills CLI finished, but installed skills still differ from the repository." >&2
  exit 1
fi

echo "Skills synced via skills CLI."
echo "installed skills: ${#repo_skills[@]} (${#published[@]} published via Codex + plugin, ${#personal[@]} personal via Cursor + Codex; all ${#repo_skills[@]} mirrored to the agents hub)"
