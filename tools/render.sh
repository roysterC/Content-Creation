#!/bin/bash
# Render a composition, master its audio and mux the final MP4.
#   tools/render.sh <project-dir> <CompositionId> <audio.wav> <out.mp4> [draft]
# final: lossless PNG frames + CRF 12, two-pass loudness (-14 LUFS target, limiter headroom so AAC never clips)
# draft: 0.4x scale, quick single-pass loudness, for approvals
set -e
source "$(dirname "$0")/env.sh"
P="$(cd "$1" && pwd)"; COMP="$2"; WAV="$(realpath "$3")"; OUT="$(realpath -m "$4")"; MODE="${5:-final}"
cd "$P"; mkdir -p out
B=(--browser-executable="$CHROME"); [ -z "$CHROME" ] && B=()
if [ "$MODE" = draft ]; then
  npx remotion render src/index.ts "$COMP" out/_silent.mp4 --scale=0.4 --concurrency="$RENDER_CONCURRENCY" "${B[@]}" --log=error
  ffmpeg -y -loglevel error -i "$WAV" -af "alimiter=limit=0.7:level=false,loudnorm=I=-14:TP=-2:LRA=11" -ar 48000 out/_master.wav
  ffmpeg -y -loglevel error -i out/_silent.mp4 -i out/_master.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 160k -shortest "$OUT"
else
  J=$(ffmpeg -hide_banner -i "$WAV" -af "alimiter=limit=0.7:level=false,loudnorm=I=-14:TP=-2:LRA=11:print_format=json" -f null - 2>&1 | sed -n '/^{/,/^}/p')
  read I TP LRA TH < <(echo "$J" | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['input_i'],d['input_tp'],d['input_lra'],d['input_thresh'])")
  ffmpeg -y -loglevel error -i "$WAV" -af "alimiter=limit=0.7:level=false,loudnorm=I=-14:TP=-2:LRA=11:measured_I=$I:measured_TP=$TP:measured_LRA=$LRA:measured_thresh=$TH:linear=true,aresample=48000,alimiter=limit=0.6:level=false:attack=1:release=40" -ar 48000 -c:a pcm_s24le out/_master.wav
  npx remotion render src/index.ts "$COMP" out/_silent.mp4 --image-format=png --crf=12 --concurrency="$RENDER_CONCURRENCY" "${B[@]}" --log=error
  ffmpeg -y -loglevel error -i out/_silent.mp4 -i out/_master.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest -movflags +faststart "$OUT"
fi
echo "duration: $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT")s"
ffmpeg -hide_banner -i "$OUT" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):"
