#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: install.sh [--check]

Link Estack skills, agents, and bundled defaults into Cursor, Codex, Factory,
and Devin. Edits in this repository are live after linking.
Rerun after adding, removing, or renaming a skill, or editing the bundled defaults.

  ~/.agents/skills/<skill>        -> estack/skills/<skill>
  ~/.cursor/agents/<agent>.md     -> estack/agents/<agent>.md
  ~/.codex/AGENTS.md              -> estack/skills/estack/references/personal-defaults.md
  ~/.factory/AGENTS.md            copied from the bundled defaults
  ~/.cursor/rules/personal.mdc    generated from the bundled defaults
  Factory plugins                core, debugging, droid-control, typescript
                                 from Factory-AI/factory-plugins (when droid is installed)

Former ai-dev-workflow skills, and copies of managed skills in host-specific
skill folders, are moved to ~/.skills-backup/<timestamp>/ rather than deleted.

  --check  Report drift without changing anything. Exits 1 on drift.
EOF
}

mode=apply
case "${1:-}" in
  "") ;;
  --check) mode=check ;;
  -h|--help) usage; exit 0 ;;
  *) usage >&2; exit 2 ;;
esac

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)
hub="$HOME/.agents/skills"
host_skill_roots=("$HOME/.factory/skills" "$HOME/.codex/skills" "$HOME/.cursor/skills" "$HOME/.claude/skills")
backup_root="$HOME/.skills-backup/$(date +%Y%m%d-%H%M%S)"
drift=0

retired_skills=(prune-dead-code)
for dir in "$repo_root"/deprecated/ai-dev-workflow/skills/*/; do
  retired_skills+=("$(basename "$dir")")
done

managed_names=()
managed_sources=()
while IFS= read -r skill_file; do
  source_dir=$(dirname "$skill_file")
  name=$(basename "$source_dir")
  for existing in "${managed_names[@]+"${managed_names[@]}"}"; do
    if [[ "$existing" == "$name" ]]; then
      echo "duplicate skill name: $name" >&2
      exit 1
    fi
  done
  managed_names+=("$name")
  managed_sources+=("$source_dir")
done < <(
  find "$repo_root/estack/skills" -mindepth 2 -maxdepth 2 -name SKILL.md
)

is_managed() {
  local candidate=$1 name
  for name in "${managed_names[@]}"; do
    [[ "$name" == "$candidate" ]] && return 0
  done
  return 1
}

report() {
  drift=1
  echo "$1"
}

backup() {
  local path=$1 destination
  destination="$backup_root/${path#"$HOME"/}"
  mkdir -p "$(dirname "$destination")"
  mv "$path" "$destination"
}

retire() {
  local path=$1
  [[ -e "$path" || -L "$path" ]] || return 0
  report "retire: $path"
  [[ "$mode" == apply ]] && backup "$path"
  return 0
}

ensure_link() {
  local source=$1 target=$2
  if [[ -L "$target" && "$(readlink "$target")" == "$source" ]]; then
    return 0
  fi
  report "link: $target -> $source"
  [[ "$mode" == apply ]] || return 0
  if [[ -e "$target" || -L "$target" ]]; then
    backup "$target"
  fi
  mkdir -p "$(dirname "$target")"
  ln -s "$source" "$target"
}

ensure_file() {
  local target=$1 content=$2
  if [[ -f "$target" && ! -L "$target" && "$(cat "$target")" == "$content" ]]; then
    return 0
  fi
  report "write: $target"
  [[ "$mode" == apply ]] || return 0
  if [[ -e "$target" || -L "$target" ]]; then
    backup "$target"
  fi
  mkdir -p "$(dirname "$target")"
  printf '%s\n' "$content" > "$target"
}

for name in "${retired_skills[@]}"; do
  is_managed "$name" || retire "$hub/$name"
done

for i in "${!managed_names[@]}"; do
  ensure_link "${managed_sources[$i]}" "$hub/${managed_names[$i]}"
done

for root in "${host_skill_roots[@]}"; do
  for name in "${retired_skills[@]}"; do
    is_managed "$name" || retire "$root/$name"
  done
  for name in "${managed_names[@]}"; do
    retire "$root/$name"
  done
done

for agent in "$repo_root"/estack/agents/*.md; do
  ensure_link "$agent" "$HOME/.cursor/agents/$(basename "$agent")"
done

if [[ -L "$HOME/.cursor/rules/pstack-models.mdc" && "$(readlink "$HOME/.cursor/rules/pstack-models.mdc")" == "$repo_root/personal/cursor/pstack-models.mdc" ]]; then
  retire "$HOME/.cursor/rules/pstack-models.mdc"
fi
ensure_link "$repo_root/estack/skills/estack/references/personal-defaults.md" "$HOME/.codex/AGENTS.md"
# Factory requires a copy of the bundled defaults.
ensure_file "$HOME/.factory/AGENTS.md" "$(cat "$repo_root/estack/skills/estack/references/personal-defaults.md")"
ensure_file "$HOME/.cursor/rules/personal.mdc" "$(printf -- '---\ndescription: Personal defaults generated from Estack bundled defaults by scripts/install.sh\nalwaysApply: true\n---\n'; cat "$repo_root/estack/skills/estack/references/personal-defaults.md")"

factory_marketplace=factory-plugins
factory_plugins=(core debugging droid-control typescript)
if command -v droid >/dev/null; then
  if ! droid plugin marketplace list 2>/dev/null | grep -q "^ *$factory_marketplace "; then
    report "add: Factory marketplace Factory-AI/factory-plugins"
    [[ "$mode" == apply ]] && droid plugin marketplace add Factory-AI/factory-plugins
  fi
  installed_plugins=$(droid plugin list --scope user 2>/dev/null || true)
  for plugin in "${factory_plugins[@]}"; do
    id="$plugin@$factory_marketplace"
    grep -q "^ *$id " <<<"$installed_plugins" && continue
    report "install: Factory plugin $id"
    [[ "$mode" == apply ]] && droid plugin install "$id" --scope user
  done
fi

scripts_dir="$repo_root/estack/skills/poteto-mode/scripts"
if [[ ! -d "$scripts_dir/node_modules" ]]; then
  report "install: bun dependencies in $scripts_dir"
  if [[ "$mode" == apply ]]; then
    if command -v bun >/dev/null; then
      (cd "$scripts_dir" && bun install --frozen-lockfile)
    else
      echo "bun is not installed; watch-pr needs it" >&2
    fi
  fi
fi

if [[ "$mode" == check ]]; then
  [[ "$drift" == 0 ]] && echo "no drift"
  exit "$drift"
fi
[[ -d "$backup_root" ]] && echo "backup: $backup_root"
echo "done"
