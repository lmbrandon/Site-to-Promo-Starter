#!/usr/bin/env bash
# Usage: level-music.sh <in.mp3> <out.mp3> [seconds=60]
# Flattens a music track to a steady ~-30 LUFS bed so it sits under a ~-21 LUFS voiceover.
# Raw tracks swing 4+ LU; this brings that to ~1 LU. Then use data-volume ~0.7 in the composition.
set -euo pipefail
in="$1"; out="$2"; secs="${3:-60}"
ffmpeg -v error -y -i "$in" -t "$secs" \
  -af "acompressor=threshold=-28dB:ratio=8:attack=20:release=300:makeup=4,dynaudnorm=f=500:g=31:p=0.9:m=10,loudnorm=I=-30:TP=-3:LRA=3" \
  -ar 44100 -b:a 192k "$out"
for f in "$out"; do ffmpeg -hide_banner -i "$f" -af ebur128 -f null - 2>&1 | sed -n '/Summary/,$p' | grep -E "I:|LRA:"; done
