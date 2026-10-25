"""Scene timings from the voiceover lengths → src/timeline.json (read by the video AND mix.py).
New structure: hook → lead → value beats, each ending in a one-line open loop. No series card, no CTA card.
Each scene = 6 + VO frames + tail; open-loop lines get a short tail so the answer snaps in."""
import json, math
from pathlib import Path
HERE = Path(__file__).resolve().parent
vo = json.load(open(HERE / 'src/vo.json'))
F = lambda k: math.ceil(vo[k] * 30)
T, v = {}, {}
t = 0
for scene, lead_in, tail in [('hook', 4, 6), ('lead', 4, 8), ('chain', 6, 6), ('loop1', 2, 6), ('queue', 6, 6), ('loop2', 2, 6), ('ack', 6, 6), ('loop3', 2, 8), ('idem', 6, 8), ('spike', 6, 22)]:
    T[scene], v[scene] = t, t + lead_in
    t += lead_in + F(scene) + tail
T['total'], T['v'] = t, v
json.dump(T, open(HERE / 'src/timeline.json', 'w'), indent=1)
print('total %.1fs' % (t / 30), {k: T[k] for k in T if k != 'v'})
