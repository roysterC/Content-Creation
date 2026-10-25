"""Scene timings from the voiceover lengths → src/timeline.json (read by the video AND mix.py).
Rate-limiting style: villain hook → series line → quick fix → rapid twists, each beat's 'but…' the open loop. No CTA card; loops to frame 0.
Each scene = 6 + VO frames + tail; open-loop lines get a short tail so the answer snaps in."""
import json, math
from pathlib import Path
HERE = Path(__file__).resolve().parent
vo = json.load(open(HERE / 'src/vo.json'))
F = lambda k: math.ceil(vo[k] * 30)
T, v = {}, {}
t = 0
for scene, lead_in, tail in [('hook', 4, 6), ('series', 4, 8), ('fix', 6, 10), ('key', 6, 10), ('range', 6, 12), ('hot', 6, 12), ('cross', 6, 12), ('reshard', 6, 10), ('payoff', 6, 26)]:
    T[scene], v[scene] = t, t + lead_in
    t += lead_in + F(scene) + tail
T['total'], T['v'] = t, v
json.dump(T, open(HERE / 'src/timeline.json', 'w'), indent=1)
print('total %.1fs' % (t / 30), {k: T[k] for k in T if k != 'v'})
