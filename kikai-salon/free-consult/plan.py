"""Compute every timing cue for the "Free consultation" reel (frames @ 30fps) from
the voice clip lengths. Writes free-consult/src/cues.json, read by both the
Remotion video and the audio mixer, so picture and sound share one timeline.
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


def longest_pause(cid, min_gap=0.12):
    """Frame offset where speech resumes after the longest internal pause of a clip."""
    a, sr = sf.read(f'{HERE}/public/vo/{cid}.wav')
    hop = int(0.01 * sr)
    rms = np.array([np.sqrt(np.mean(a[i : i + hop] ** 2)) for i in range(0, len(a) - hop, hop)])
    quiet = rms < 0.01
    best, s = (0, 0), None
    for i, q in enumerate(list(quiet) + [False]):
        if q and s is None:
            s = i
        elif not q and s is not None:
            if s > 10 and (i - s) > best[1] - best[0] and (i - s) * 0.01 >= min_gap:
                best = (s, i)
            s = None
    return round(best[1] * 0.01 * FPS)


c = {'fps': FPS, 'vo': {}, 'scenes': {}, 'sfx': {}}


def scene(name, start, dur, fade):
    c['scenes'][name] = {'start': start, 'dur': dur, 'fade': fade}
    return start


# 1. Hook: busy salon, phone already ringing, headline on frame 0
s1 = scene('hook', 0, 0, 0)
c['vo']['v1'] = s1 + 4
c['scenes']['hook']['dur'] = c['vo']['v1'] + L['v1'] + 6

# 2. Missed: hands full, the phone rings out, missed-call cards stack up
s2 = scene('missed', c['scenes']['hook']['dur'], 0, 0)
c['vo']['v2'] = s2 + 4
c['sfx']['miss'] = [s2 + 8, s2 + 32, s2 + 56, c['vo']['v2'] + L['v2'] - 12]  # last one on "rings out"
c['sfx']['ringEnd'] = c['sfx']['miss'][-1]
c['scenes']['missed']['dur'] = c['vo']['v2'] + L['v2'] + 8 - s2

# 3. Lost: the cards fly to the salon down the road, which books them
s3 = scene('lost', s2 + c['scenes']['missed']['dur'], 0, 0)
c['sfx']['fly'] = s3
c['vo']['v3'] = s3 + 6
c['sfx']['rivalBooked'] = [s3 + 22, s3 + 30, s3 + 38, s3 + 46]
c['scenes']['lost']['dur'] = c['vo']['v3'] + L['v3'] + 8 - s3

# 4. Kikai: the switch (music turns upbeat), Kikai answers, diary fills
s4 = scene('kikai', s3 + c['scenes']['lost']['dur'], 0, 0)
c['vo']['v4'] = s4 + 10
c['vo']['v5'] = c['vo']['v4'] + L['v4'] + 6
c['sfx']['nightIn'] = c['vo']['v5'] - 4  # cut to the salon after hours
c['sfx']['dayNight'] = c['vo']['v5'] + 30  # "day or night"
w0 = c['vo']['v5'] + L['v5'] - 44  # "books them straight into your diary"
c['sfx']['diaryIn'] = w0 - 10  # cut to the overhead diary
c['sfx']['write'] = [w0, w0 + 12, w0 + 24, w0 + 36]
c['scenes']['kikai']['dur'] = c['vo']['v5'] + L['v5'] + 8 - s4

# 5. Offer: the drop lands on "A free consultation"
s5 = scene('offer', s4 + c['scenes']['kikai']['dur'], 0, 0)
c['vo']['v6'] = s5 + 4
c['sfx']['drop'] = c['vo']['v6'] + longest_pause('v6')
c['vo']['v7'] = c['vo']['v6'] + L['v6'] + 8
c['sfx']['tick'] = [c['vo']['v7'] + 4, c['vo']['v7'] + longest_pause('v7')]
c['scenes']['offer']['dur'] = c['vo']['v7'] + L['v7'] + 6 - s5

# music grid (120 BPM: 15 frames a beat, 60 a bar), anchored so a bar line is the drop
BEAT = 15
c['sfx']['grid0'] = c['sfx']['drop'] - 60 * math.ceil((c['sfx']['drop'] - s4) / 60)
c['sfx']['switch'] = c['sfx']['grid0'] + BEAT * math.ceil((s4 + 2 - c['sfx']['grid0']) / BEAT)

# 6. End card, cut on the next beat
s6 = s5 + c['scenes']['offer']['dur']
s6 = c['sfx']['grid0'] + BEAT * math.ceil((s6 - c['sfx']['grid0']) / BEAT)
c['scenes']['offer']['dur'] = s6 - s5
s6 = scene('endCard', s6, 0, 12)
c['sfx']['card'] = s6
c['vo']['v8'] = s6 + 14
c['sfx']['pill'] = c['vo']['v8'] + 2  # "Comment free"
end = c['vo']['v8'] + L['v8'] + 45
c['scenes']['endCard']['dur'] = end - s6
c['total'] = end

c['voLen'] = L
json.dump(c, open(f'{HERE}/src/cues.json', 'w'), indent=1)
print(json.dumps(c['scenes']), '\n', json.dumps(c['sfx']), '\ntotal', end, 'frames =', round(end / FPS, 2), 's')
