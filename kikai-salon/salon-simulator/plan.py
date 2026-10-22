"""Compute every timing cue for "Salon Simulator" (frames @ 30fps) from the voice
clips. Game events are pinned to words via the pauses inside each line. Writes
salon-simulator/src/cues.json, read by both the Remotion video and the mixer.
"""
import json
import math
from pathlib import Path as _P

import numpy as np
import soundfile as sf

HERE = _P(__file__).resolve().parent  # this project folder

FPS = 30
vo = json.load(open(f'{HERE}/src/vo-timing.json'))
L = {k: math.ceil(v * FPS) for k, v in vo.items()}


def resumes(cid, min_gap=0.1):
    """Frame offsets where speech resumes after each internal pause of a clip."""
    a, sr = sf.read(f'{HERE}/public/vo/{cid}.wav')
    hop = int(0.01 * sr)
    rms = np.array([np.sqrt(np.mean(a[i : i + hop] ** 2)) for i in range(0, len(a) - hop, hop)])
    out, s = [], None
    for i, q in enumerate(list(rms < 0.01) + [False]):
        if q and s is None:
            s = i
        elif not q and s is not None:
            if s > 10 and (i - s) * 0.01 >= min_gap:
                out.append(round(i * 0.01 * FPS))
            s = None
    return out


R = {k: resumes(k) for k in L}
c = {'fps': FPS, 'vo': {}, 'cue': {}, 'resumes': R}
V, K = c['vo'], c['cue']

# 1. Hook + play: headline on frame 0, phone already ringing, hands full
V['v1'] = 4
V['v2'] = V['v1'] + L['v1'] + 6
V['v3'] = V['v2'] + L['v2'] + 6
K['miss'] = [V['v3'] + 2, V['v3'] + R['v3'][-1]]  # "Missed!" ... "Missed again!"
K['miss'] += [V['v3'] + L['v3'] + 6, V['v3'] + L['v3'] + 18]  # two more, rapid fire

# 2. Game over? Not quite.
K['gameOver'] = K['miss'][-1] + 14
V['v4'] = K['gameOver'] + 4
K['notQuite'] = V['v4'] + R['v4'][0]

# music grid: 120 BPM = 15 frames a beat, 60 a bar; the drop sits on a bar line
BEAT = 15
power = V['v4'] + L['v4'] + 4

# 3. Power up: Kikai unlocked, then it answers while you're busy, day or night
V['v5'] = K['switch'] = power
K['unlock'] = V['v5'] + R['v5'][0]  # "Kikai."
V['v6'] = V['v5'] + L['v5'] + 4
r6 = R['v6']
K['answer'] = [V['v6'] + 2, V['v6'] + r6[0] - 2, V['v6'] + r6[-1] + 2, V['v6'] + r6[-1] + 22]
K['nightIn'] = V['v6'] + r6[0] + 4  # dusk falls between "day" and "night"

# bonus round; pad its start so switch -> drop is a whole number of beats
bonus = V['v6'] + L['v6'] + 6
pad = -(bonus + 10 + R['v7'][-1] - power) % BEAT
K['bonus'] = bonus + pad
V['v7'] = K['bonus'] + 10
K['drop'] = V['v7'] + R['v7'][-1]  # "A free consultation!"
K['grid0'] = K['drop'] - 60 * math.ceil((K['drop'] - power) / 60)

# 4. Bonus round reward list
V['v8'] = V['v7'] + L['v7'] + 8
K['items'] = [V['v8'] + 4, V['v8'] + R['v8'][0]]

# 5. End screen, cut on the next beat
end0 = V['v8'] + L['v8'] + 6
K['card'] = K['grid0'] + BEAT * math.ceil((end0 - K['grid0']) / BEAT)
V['v9'] = K['card'] + 12
K['claim'] = V['v9'] + 2
c['total'] = V['v9'] + L['v9'] + 48
c['voLen'] = L
json.dump(c, open(f'{HERE}/src/cues.json', 'w'), indent=1)
print(json.dumps(V), '\n', json.dumps(K), '\nresumes', json.dumps(R), '\ntotal', c['total'], 'frames =', round(c['total'] / FPS, 2), 's')
