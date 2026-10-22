"""Compute every timing cue for "Hands Full" (frames @ 30fps) from the voice
clip lengths. Writes hands-full/src/cues.json, read by both the Remotion video
and the audio mixer, so picture and sound share one timeline.
"""
import json
import math
from pathlib import Path as _P
HERE = _P(__file__).resolve().parent  # this project folder
TTS_DIR = HERE.parents[1] / 'tools' / 'tts'  # shared Kokoro TTS install


FPS = 30
vo = json.load(open(f'{HERE}/src/vo-timing.json'))
L = {k: math.ceil(v * FPS) for k, v in vo.items()}

c = {'fps': FPS, 'vo': {}, 'scenes': {}, 'sfx': {}}


def scene(name, start, dur, fade):
    c['scenes'][name] = {'start': start, 'dur': dur, 'fade': fade}
    return start


# 1. Saturday rush
s1 = scene('rush', 0, 108, 0)
c['vo']['s1'] = s1 + 12
c['sfx']['ringStart'] = s1 + 78

# 2. Missed moment
s2 = scene('missed', 108, 92, 4)
c['vo']['s2'] = s2 + 6
c['sfx']['glow'] = s2 + 66  # ring stops mid-ring, amber glow blooms

# 3. Kikai answers
s3 = scene('answers', 200, 296, 14)
c['vo']['k1'] = s3 + 6
c['vo']['c1'] = c['vo']['k1'] + L['k1'] + 4
c['vo']['k2'] = c['vo']['c1'] + L['c1'] + 6
c['sfx']['splitAt'] = s3 + 108
c['sfx']['write1'] = c['vo']['k2'] + 6  # "Half ten with Priya"
c['sfx']['closeAt'] = s3 + 200
c['sfx']['write2'] = c['vo']['k2'] + L['k2'] - 30  # "Thursday okay?"
c['sfx']['overlay3'] = c['sfx']['write2'] + 14
c['scenes']['answers']['dur'] = c['vo']['k2'] + L['k2'] + 22 - s3

# 4. After hours
s4 = scene('afterHours', s3 + c['scenes']['answers']['dur'] - 14, 186, 14)
c['sfx']['lockUp'] = s4 + 46
c['sfx']['night'] = s4 + 70
c['vo']['s4'] = s4 + 26
c['sfx']['nightGlows'] = [s4 + 86, s4 + 122, s4 + 156]

# 5. Morning
s5 = scene('morning', s4 + 186 - 14, 124, 14)
c['sfx']['doorBell'] = s5 + 8
c['sfx']['cupDown'] = s5 + 42
c['sfx']['overhead'] = s5 + 52
c['vo']['s5'] = s5 + 30
c['sfx']['overlay5'] = s5 + 66

# 6. End card
s6 = scene('endCard', s5 + 124 - 16, 10, 16)
c['sfx']['orb'] = s6
c['sfx']['card'] = s6 + 22
c['vo']['s6'] = s6 + 26
end = c['vo']['s6'] + L['s6'] + 20
c['scenes']['endCard']['dur'] = end - s6
c['sfx']['finalChord'] = c['sfx']['card']
c['total'] = end

c['voLen'] = L
json.dump(c, open(f'{HERE}/src/cues.json', 'w'), indent=1)
print(json.dumps(c['scenes']), '\ntotal', end, 'frames =', round(end / FPS, 2), 's')
