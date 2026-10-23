"""Scene timings from the voiceover lengths → src/timeline.json (read by the video AND mix.py).
Run after vo.py. Each scene = max(min frames, 6 + VO frames + tail); the VO starts 6 frames into its scene."""
import json, math
from pathlib import Path
HERE = Path(__file__).resolve().parent
vo = json.load(open(HERE / 'src/vo.json'))
F = lambda k: math.ceil(vo[k] * 30)
T, v = {'hook': 0}, {'hook': 4}
T['series'] = v['hook'] + F('hook') + 6
v['series'] = T['series']
t = T['series'] + F('series') + 6
# (scene, min frames, tail frames after the line ends)
for scene, minlen, tail in [('scan', 200, 14), ('index', 200, 14), ('btree', 200, 18), ('cost', 220, 14), ('explain', 170, 18), ('share', 140, 26)]:
    T[scene], v[scene] = t, t + 6
    t += max(minlen, 6 + F(scene) + tail)
T['total'], T['v'] = t, v
json.dump(T, open(HERE / 'src/timeline.json', 'w'), indent=1)
print('total %.1fs' % (t / 30), {k: T[k] for k in T if k != 'v'})
