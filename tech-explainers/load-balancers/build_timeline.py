"""Scene timings from the voiceover lengths → src/timeline.json (read by the video AND mix.py).
Run after vo.py. Each scene = max(min frames, 6 + VO frames + 14); failAt/detectAt are anchored to the health-check line."""
import json, math
from pathlib import Path
HERE = Path(__file__).resolve().parent
vo = json.load(open(HERE / 'src/vo.json'))
F = lambda k: math.ceil(vo[k] * 30)
T, v = {'hook': 0}, {'hook': 4}
v['series'] = v['hook'] + F('hook') + 8
T['series'] = v['series']
T['fix'] = v['series'] + F('series') + 8
t = T['fix']
for scene, minlen in [('fix', 150), ('rr', 150), ('lc', 126), ('hash', 140), ('health', 190), ('l4', 96), ('l7', 150), ('recap', 190)]:
    T[scene], v[scene] = t, t + 6
    t += max(minlen, 6 + F(scene) + 14)
T['total'] = t
T['failAt'] = T['health'] + 6 + 84  # "Miss a beat…"
T['detectAt'] = T['health'] + 6 + 122  # "…traffic just flows around it"
T['v'] = v
json.dump(T, open(HERE / 'src/timeline.json', 'w'), indent=1)
print('total %.1fs' % (t / 30))
