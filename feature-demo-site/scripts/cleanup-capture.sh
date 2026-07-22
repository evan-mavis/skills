#!/usr/bin/env bash
set -euo pipefail

if [[ $# -eq 0 ]]; then
  echo "Usage: cleanup-capture.sh RAW_DIR [RAW_DIR ...]" >&2
  exit 2
fi

if ! command -v trash >/dev/null 2>&1; then
  echo "The trash command is required for recoverable cleanup" >&2
  exit 1
fi

for target in "$@"; do
  if [[ ! -e "$target" ]]; then
    echo "Capture path does not exist: $target" >&2
    exit 1
  fi
  if [[ ! -d "$target" ]]; then
    echo "Cleanup only accepts raw frame directories: $target" >&2
    exit 1
  fi

  name=$(basename "$target")
  case "$name" in
    raw|raw-*|*-raw|*-frames) ;;
    *)
      echo "Refusing directory without a raw or *-frames name: $target" >&2
      exit 1
      ;;
  esac

  resolved_parent=$(cd "$(dirname "$target")" && pwd -P)
  resolved_target="$resolved_parent/$name"
  if [[ "$resolved_target" == "/" || "$resolved_target" == "$HOME" ]]; then
    echo "Refusing broad cleanup target: $resolved_target" >&2
    exit 1
  fi

  trash "$resolved_target"
  echo "Moved capture frames to Trash: $resolved_target"
done
