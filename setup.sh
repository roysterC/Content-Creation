#!/bin/bash
# One-shot setup for a fresh workspace. Safe to re-run.  Usage: ./setup.sh
set -e
cd "$(dirname "$0")"
source tools/env.sh
echo "== node deps (Remotion toolchain, shared by every project)"
npm ci --no-audit --no-fund --loglevel=error
echo "== TTS deps (Kokoro voices + model shards)"
(cd tools/tts && npm ci --no-audit --no-fund --loglevel=error)
mkdir -p tools/tts/model
if [ ! -s tools/tts/model/kokoro-q8.onnx ]; then
  cat tools/tts/node_modules/kokoro-q8-shards/kokoro-q8.part{0..5}.bin > tools/tts/model/kokoro-q8.onnx
fi
echo "== shared film grain -> projects that use it"
for d in kikai-salon/hands-full kikai-salon/hook-storyboards; do cp --update=none kikai-salon/_shared/grain/grain*.png "$d/public/"; done
echo "== python deps"
python3 -m pip install -q --break-system-packages kokoro-onnx soundfile scipy numpy pillow 2>/dev/null || python3 -m pip install -q kokoro-onnx soundfile scipy numpy pillow
echo "== checks"
command -v ffmpeg >/dev/null && echo "ffmpeg: ok" || echo "ffmpeg: MISSING (install ffmpeg, or: pip install imageio-ffmpeg)"
[ -n "$CHROME" ] && echo "chromium: $CHROME" || echo "chromium: not found; Remotion will try to download its own on first render"
python3 -c "import kokoro_onnx, soundfile, scipy; print('python: ok')"
echo "done"
