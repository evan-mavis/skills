#!/usr/bin/env bash
# Verify GitHub PRs are merged into development.
# Usage: check-prs-merged-to-dev.sh 682 661 262
# Exit 0 if all pass; exit 1 if any fail.

set -euo pipefail

if [[ $# -eq 0 ]]; then
  echo "Usage: $0 <pr-number> [pr-number...]" >&2
  exit 2
fi

fail=0

for pr in "$@"; do
  if ! json=$(gh pr view "$pr" --json number,title,state,baseRefName,mergedAt,url 2>&1); then
    echo "PR #$pr	FAIL	not_found"
    fail=1
    continue
  fi

  state=$(echo "$json" | jq -r '.state')
  base=$(echo "$json" | jq -r '.baseRefName')
  title=$(echo "$json" | jq -r '.title' | tr '\t' ' ')
  merged_at=$(echo "$json" | jq -r '.mergedAt // "null"')

  if [[ "$state" == "MERGED" && "$base" == "development" ]]; then
    echo "PR #$pr	OK	merged_to_development	$merged_at	$title"
  elif [[ "$state" != "MERGED" ]]; then
    echo "PR #$pr	FAIL	not_merged	state=$state	$title"
    fail=1
  else
    echo "PR #$pr	FAIL	wrong_base_branch	base=$base	$title"
    fail=1
  fi
done

exit "$fail"
