#!/bin/bash
# Storyboard: render key frames at half scale and tile them into out/storyboard.png
#   ./storyboard.sh [frame ...]     (defaults to one or two frames per beat, plus frame 0)
set -e
cd "$(dirname "$0")"
source ../../tools/env.sh
FRAMES=("$@")
[ ${#FRAMES[@]} -eq 0 ] && FRAMES=(0 45 104 150 190 212 250 300 345 380 430 455 500 530 556 585 640 700 772 850)
mkdir -p out/stills
npx remotion bundle src/index.ts --out-dir=out/bundle --log=error >/dev/null
for n in "${FRAMES[@]}"; do
  npx remotion still out/bundle FreeConsult "out/stills/f$(printf %04d "$n").png" --frame="$n" --scale=0.5 --browser-executable="$CHROME" --log=error
done
python3 -I - "${FRAMES[@]}" <<'EOF'
import sys
from PIL import Image, ImageDraw
frames = sys.argv[1:]
ims = [Image.open(f'out/stills/f{int(n):04d}.png').convert('RGB') for n in frames]
w, h = ims[0].size; cols = 5; rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (cols * (w + 8), rows * (h + 40)), 'white')
d = ImageDraw.Draw(sheet)
for i, (n, im) in enumerate(zip(frames, ims)):
    x, y = (i % cols) * (w + 8), (i // cols) * (h + 40)
    sheet.paste(im, (x, y + 32)); d.text((x + 6, y + 8), f'frame {n}  ({int(n) / 30:.1f}s)', fill='black')
sheet.save('out/storyboard.png'); print('wrote out/storyboard.png')
EOF
