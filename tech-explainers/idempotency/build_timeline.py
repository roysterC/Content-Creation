"""Scene timings from the voiceover lengths → src/timeline.json (read by the video AND mix.py).
Rate-limiting style: villain hook → series line → quick fix → rapid twists, each beat's 'but…' the open loop. Ends on the 4-line recap card (no follow/share); loops to frame 0.
Each scene = 6 + VO frames + tail; open-loop lines get a short tail so the answer snaps in."""
import json, math
from pathlib import Path
HERE = Path(__file__).resolve().parent
vo = json.load(open(HERE / 'src/vo.json'))
F = lambda k: math.ceil(vo[k] * 30)
T, v = {}, {}
t = 0
for scene, lead_in, tail in [('hook', 4, 8), ('lead', 4, 12), ('naive', 6, 14), ('key', 6, 12), ('replay', 6, 14), ('stripe', 6, 12), ('race', 6, 14), ('client', 6, 14), ('payoff', 6, 110)]:
    T[scene], v[scene] = t, t + lead_in
    t += lead_in + F(scene) + tail
T['total'], T['v'] = t, v
json.dump(T, open(HERE / 'src/timeline.json', 'w'), indent=1)
print('total %.1fs' % (t / 30), {k: T[k] for k in T if k != 'v'})
