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
t = T['series'] + F('series') + 8
# (scene, min frames, tail frames after the line ends)
for scene, minlen, tail in [('fix', 290, 10), ('hitrate', 150, 10), ('ttl', 250, 12), ('lru', 170, 14), ('layers', 200, 18), ('recap', 190, 60)]:
    T[scene], v[scene] = t, t + 6
    t += max(minlen, 6 + F(scene) + tail)
T['total'], T['v'] = t, v
json.dump(T, open(HERE / 'src/timeline.json', 'w'), indent=1)
print('total %.1fs' % (t / 30), {k: T[k] for k in T if k != 'v'})
