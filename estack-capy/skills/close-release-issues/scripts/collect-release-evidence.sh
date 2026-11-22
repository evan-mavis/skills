#!/usr/bin/env bash
# Collect read-only PR evidence. Ancestry and file presence do not prove issue scope.
set -euo pipefail

if [[ $# -lt 3 ]]; then
  echo "Usage: $0 <previous-production-ref> <released-ref> <pr-number> [pr-number...]" >&2
  exit 2
fi

previous=$(git rev-parse --verify --end-of-options "$1^{commit}")
released=$(git rev-parse --verify --end-of-options "$2^{commit}")
shift 2
for pr in "$@"; do
  if [[ ! "$pr" =~ ^[1-9][0-9]*$ ]]; then
    echo "Invalid PR number: $pr" >&2
    exit 2
  fi
done

scratch=$(mktemp -d)
trap 'rm -rf "$scratch"' EXIT
shallow=$(git rev-parse --is-shallow-repository)
failed=0

ancestry() {
  local commit=$1 snapshot=$2 code
  if [[ "$commit" == null ]] || ! git cat-file -e "$commit^{commit}" 2>/dev/null; then
    echo unknown
  elif git merge-base --is-ancestor "$commit" "$snapshot"; then
    echo yes
  else
    code=$?
    if [[ "$code" == 1 && "$shallow" == false ]]; then echo no; else echo unknown; fi
  fi
}

presence() {
  if git cat-file -e "$1:$2" 2>/dev/null; then echo yes; else echo no; fi
}

for pr in "$@"; do
  endpoint="repos/Airgoods-Inc/airgoods/pulls/$pr"
  error=
  if ! gh api --method GET "$endpoint" > "$scratch/pr.json"; then
    error=pr_metadata
  elif ! jq -e --argjson number "$pr" '.number == $number and (.title | type == "string")
    and (.state == "open" or .state == "closed") and (.merged | type == "boolean")
    and (.base.ref | type == "string") and (.html_url | type == "string")
    and (.commits | type == "number") and (.changed_files | type == "number")' "$scratch/pr.json" >/dev/null; then
    error=invalid_pr_metadata
  elif ! gh api --method GET --paginate --slurp "$endpoint/commits?per_page=100" > "$scratch/commits.json"; then
    error=pr_commits
  elif ! gh api --method GET --paginate --slurp "$endpoint/files?per_page=100" > "$scratch/files.json"; then
    error=pr_files
  elif ! jq -e 'type == "array" and length > 0 and all(.[]; type == "array" and all(.[]; (.sha | type == "string")))' "$scratch/commits.json" >/dev/null \
    || ! jq -e 'type == "array" and length > 0 and all(.[]; type == "array" and all(.[]; (.filename | type == "string")))' "$scratch/files.json" >/dev/null; then
    error=invalid_pr_evidence
  elif ! jq -e --slurpfile pr "$scratch/pr.json" 'add | length == $pr[0].commits' "$scratch/commits.json" >/dev/null \
    || ! jq -e --slurpfile pr "$scratch/pr.json" 'add | length == $pr[0].changed_files' "$scratch/files.json" >/dev/null; then
    error=incomplete_pr_evidence
  fi

  if [[ -n "$error" ]]; then
    jq -nc --argjson number "$pr" --arg error "$error" --arg previous "$previous" --arg released "$released" \
      '{number: $number, previous_snapshot: $previous, released_snapshot: $released, collection_error: $error, scope_review_required: true}'
    failed=1
    continue
  fi

  : > "$scratch/ancestry.jsonl"
  while IFS= read -r commit; do
    sha=$(jq -r '.sha' <<< "$commit")
    jq -c --arg previous "$(ancestry "$sha" "$previous")" --arg released "$(ancestry "$sha" "$released")" \
      '. + {ancestor_of_previous: $previous, ancestor_of_release: $released}' <<< "$commit" >> "$scratch/ancestry.jsonl"
  done < <(jq -c 'add | .[] | {sha, message: .commit.message}' "$scratch/commits.json")

  : > "$scratch/presence.jsonl"
  while IFS= read -r file; do
    filename=$(jq -r '.filename' <<< "$file")
    jq -c --arg previous "$(presence "$previous" "$filename")" --arg released "$(presence "$released" "$filename")" \
      '. + {present_in_previous: $previous, present_in_release: $released}' <<< "$file" >> "$scratch/presence.jsonl"
  done < <(jq -c 'add | .[] | {filename, status, previous_filename}' "$scratch/files.json")

  merge=$(jq -r '.merge_commit_sha // "null"' "$scratch/pr.json")
  jq -c --arg previous "$previous" --arg released "$released" \
    --arg merge_previous "$(ancestry "$merge" "$previous")" --arg merge_released "$(ancestry "$merge" "$released")" \
    --slurpfile commits "$scratch/ancestry.jsonl" --slurpfile files "$scratch/presence.jsonl" \
    '{number, title, body, state: (if .merged then "MERGED" else (.state | ascii_upcase) end),
      baseRefName: .base.ref, headRefName: .head.ref, mergedAt: .merged_at, url: .html_url,
      previous_snapshot: $previous, released_snapshot: $released,
      merge_commit: {sha: .merge_commit_sha, ancestor_of_previous: $merge_previous, ancestor_of_release: $merge_released},
      commits: $commits, files: $files, scope_review_required: true}' "$scratch/pr.json"
done

exit "$failed"
