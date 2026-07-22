#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 || $# -gt 3 ]]; then
  echo "Usage: encode-capture.sh FRAME_DIR OUTPUT_MP4 [LEGACY_INPUT_FPS]" >&2
  exit 2
fi

frame_dir=$1
output_mp4=$2
legacy_input_fps=${3:-10}
script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

for dependency in ffmpeg ffprobe; do
  if ! command -v "$dependency" >/dev/null 2>&1; then
    echo "$dependency is required" >&2
    exit 1
  fi
done

if [[ ! -d "$frame_dir" ]]; then
  echo "Frame directory does not exist: $frame_dir" >&2
  exit 1
fi

frame_count=$(find "$frame_dir" -maxdepth 1 -type f -name 'frame-*.jpg' | wc -l | tr -d ' ')
if [[ "$frame_count" -eq 0 ]]; then
  echo "No frame-*.jpg files found in: $frame_dir" >&2
  exit 1
fi

mkdir -p "$(dirname "$output_mp4")"

video_filter='scale=1440:900:force_original_aspect_ratio=decrease,pad=1440:900:(ow-iw)/2:(oh-ih)/2:color=white,format=yuv420p,fps=30'
manifest_path="$frame_dir/capture-manifest.json"

if [[ -f "$manifest_path" ]]; then
  if ! command -v node >/dev/null 2>&1; then
    echo "node is required for timestamp-paced captures" >&2
    exit 1
  fi
  timeline_file=$(mktemp /tmp/feature-demo-timeline.XXXXXX)
  trap 'unlink "$timeline_file" 2>/dev/null || true' EXIT
  node "$script_dir/prepare-frame-timeline.mjs" "$frame_dir" "$timeline_file"
  ffmpeg \
    -hide_banner \
    -loglevel error \
    -y \
    -f concat \
    -safe 0 \
    -i "$timeline_file" \
    -vf "$video_filter" \
    -c:v libx264 \
    -crf 23 \
    -preset fast \
    -movflags +faststart \
    "$output_mp4"
else
  echo "No capture manifest found; using legacy input FPS: $legacy_input_fps" >&2
  ffmpeg \
    -hide_banner \
    -loglevel error \
    -y \
    -framerate "$legacy_input_fps" \
    -i "$frame_dir/frame-%05d.jpg" \
    -vf "$video_filter" \
    -c:v libx264 \
    -crf 23 \
    -preset fast \
    -movflags +faststart \
    "$output_mp4"
fi

ffprobe \
  -v error \
  -show_entries stream=codec_name,width,height,r_frame_rate:format=duration,size \
  -of default=noprint_wrappers=1 \
  "$output_mp4"
