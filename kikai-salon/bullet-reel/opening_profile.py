"""Opening (0–7.6s) of the bullet reel: bullet speed profile + click schedule.

- Bullet: full speed 0–2.0s, steep drop-off from 2.0s, extra-slow last second,
  stalls a hair from the can at frame 228. Position is the integral of the speed curve.
- Clicks (option A): one per video frame during the race (numbers skip 2–3 per click),
  then exactly one click per number from 2.0s, spacing out as the bullet slows.
Writes bullet/src/opening.json, read by the video and the audio mix.
"""
import json

import numpy as np
from pathlib import Path as _P
HERE = _P(__file__).resolve().parent  # this project folder
TTS_DIR = HERE.parents[1] / 'tools' / 'tts'  # shared Kokoro TTS install


FPS, STALL, RACE_END = 30, 228, 30
START_X, CAN_X0, GAP = -417.0, 563.0, 29.0  # starts just inside the left edge of the wide frame
FROM, TO = 200, 8

# speed (% of top speed) keypoints: (seconds, %)
# race at full speed (camera tracking), then a bullet-time snap and a long crawl
KP = [(0, 100), (1.0, 100), (1.5, 58), (2.0, 32), (2.5, 21), (3.0, 15), (3.5, 11.5), (4.0, 9), (4.5, 7.2),
      (5.0, 5.8), (5.6, 4.2), (6.2, 2.8), (6.6, 1.8), (7.0, 0.9), (7.3, 0.35), (7.6, 0.0)]
ts, vs = zip(*KP)
fine = np.linspace(0, STALL / FPS, 20001)
v = np.interp(fine, ts, vs)
dist = np.concatenate([[0], np.cumsum((v[1:] + v[:-1]) / 2 * np.diff(fine))])
frames = np.arange(STALL + 1)
p = np.interp(frames / FPS, fine, dist / dist[-1])
nose = START_X + (CAN_X0 - GAP - START_X) * p
print('distance covered by the drop-off (1.0s): %.0f%%' % (100 * np.interp(1.0, fine, dist / dist[-1])))

# clicks: race = every frame; then one per number with growing gaps
N2 = None
for n2 in range(30, 70):
    k = n2 - TO  # clicks after the race (n2 → TO)
    avail = STALL - RACE_END
    # geometric gaps from 1 frame up to g_end frames
    for g_end10 in range(50, 160):
        g_end = g_end10 / 10
        gaps = np.round(np.geomspace(1, g_end, k)).astype(int)
        if gaps.sum() == avail:
            N2 = (n2, gaps)
            break
    if N2 and abs(N2[1][-1] - 10) <= 2:
        break
    N2 = None
n2, gaps = N2
clicks = []
for f in range(1, RACE_END + 1):  # race: numbers 200 → n2, one click per frame
    clicks.append({'f': f, 'n': int(round(FROM - (FROM - n2) * f / RACE_END))})
f = RACE_END
n = n2
for g in gaps:
    f += int(g)
    n -= 1
    clicks.append({'f': f, 'n': n})
assert clicks[-1]['f'] == STALL and clicks[-1]['n'] == TO, clicks[-1]

json.dump({'nose': [round(x, 2) for x in nose], 'clicks': clicks, 'from': FROM, 'raceEnd': RACE_END}, open(f'{HERE}/src/opening.json', 'w'))
print('race: 200 →', n2, 'in', RACE_END, 'frames; then', len(gaps), 'single-number clicks, gaps', list(gaps[:6]), '…', list(gaps[-6:]))
print('nose at 0.3s/2.0s/3.5s/6.6s/7.6s:', [round(nose[int(s * 30)]) for s in (0.3, 2.0, 3.5, 6.6, 7.6)])
