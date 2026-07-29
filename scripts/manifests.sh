#!/usr/bin/env bash

manifests_dir() {
  cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P
}

read_manifest() {
  local file=$1
  if [[ ! -f "$file" ]]; then
    echo "Missing manifest: $file" >&2
    return 1
  fi
  grep -Ev '^\s*(#|$)' "$file"
}

validate_manifests() {
  local repo_root=$1
  local scripts_dir skill_file skill_name
  local -a published=() personal=() repo_skills=() overlap=() missing=() extra=()
  local skill published_skill personal_skill

  scripts_dir=$(manifests_dir)

  while IFS= read -r skill; do
    published+=("$skill")
  done < <(read_manifest "$scripts_dir/published.txt")

  while IFS= read -r skill; do
    personal+=("$skill")
  done < <(read_manifest "$scripts_dir/personal.txt")

  shopt -s nullglob
  for skill_file in "$repo_root"/*/SKILL.md; do
    skill_name=${skill_file%/SKILL.md}
    skill_name=${skill_name##*/}
    repo_skills+=("$skill_name")
  done

  for skill in "${published[@]}"; do
    for personal_skill in "${personal[@]}"; do
      if [[ "$skill" == "$personal_skill" ]]; then
        overlap+=("$skill")
      fi
    done
  done

  if [[ ${#overlap[@]} -gt 0 ]]; then
    echo "Skills listed in both published.txt and personal.txt:" >&2
    printf '  %s\n' "${overlap[@]}" >&2
    return 1
  fi

  for skill in "${repo_skills[@]}"; do
    local found=false
    for published_skill in "${published[@]}"; do
      if [[ "$skill" == "$published_skill" ]]; then
        found=true
        break
      fi
    done
    if [[ "$found" == false ]]; then
      for personal_skill in "${personal[@]}"; do
        if [[ "$skill" == "$personal_skill" ]]; then
          found=true
          break
        fi
      done
    fi
    if [[ "$found" == false ]]; then
      missing+=("$skill")
    fi
  done

  if [[ ${#missing[@]} -gt 0 ]]; then
    echo "Repo skills missing from published.txt and personal.txt:" >&2
    printf '  %s\n' "${missing[@]}" >&2
    return 1
  fi

  for skill in "${published[@]}" "${personal[@]}"; do
    if [[ ! -f "$repo_root/$skill/SKILL.md" ]]; then
      extra+=("$skill")
    fi
  done

  if [[ ${#extra[@]} -gt 0 ]]; then
    echo "Manifest entries without SKILL.md in the repository:" >&2
    printf '  %s\n' "${extra[@]}" >&2
    return 1
  fi

  return 0
}
