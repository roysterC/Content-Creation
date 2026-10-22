"""Overlay Instagram Reels / TikTok UI zones on stills to check nothing important sits under them.
Usage: python3 tools/safe_zones.py out.png still1.png still2.png ...   (stills at any scale of 1080x1920)
Zones (1080x1920): header y<220 · caption/username band y>1560 · right action rail x>930, 980<y<1560"""
import sys
from PIL import Image, ImageDraw
out, files = sys.argv[1], sys.argv[2:]
tiles = []
for f in files:
    im = Image.open(f).convert('RGBA'); k = im.width / 1080
    ov = Image.new('RGBA', im.size, (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
    for box in ([0, 0, 1080, 220], [0, 1560, 1080, 1920], [930, 980, 1080, 1560]):
        d.rectangle([int(c * k) for c in box], fill=(255, 0, 0, 60))
    tiles.append(Image.alpha_composite(im, ov).convert('RGB'))
W = sum(t.width for t in tiles) + 6 * (len(tiles) - 1); H = max(t.height for t in tiles)
sheet = Image.new('RGB', (W, H), 'white'); x = 0
for t in tiles:
    sheet.paste(t, (x, 0)); x += t.width + 6
sheet.save(out); print('wrote', out)
