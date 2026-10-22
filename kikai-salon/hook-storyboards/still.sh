#!/bin/bash
# usage: ./still.sh HookN [beats...]  -> out/HookN-b<beat>.png
source "$(dirname "$0")/../../tools/env.sh"
id=$1; shift
for b in "${@:-0 1 2}"; do
  npx remotion still src/index.ts $id out/$id-b$b.png --props="{\"beat\":$b}" --browser-executable="$CHROME" --log=error 2>&1 | tail -3
done
