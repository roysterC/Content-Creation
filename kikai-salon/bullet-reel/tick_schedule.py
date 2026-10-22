"""One click per count: the frame at which each number drops by one.
200 → 008 between frame START and the stall (228): one count per frame at first,
then the gaps stretch out so the last numbers land slowly. Written to
bullet/src/ticks.json and shared by the video and the audio."""
import json
from pathlib import Path as _P
HERE = _P(__file__).resolve().parent  # this project folder
TTS_DIR = HERE.parents[1] / 'tools' / 'tts'  # shared Kokoro TTS install


START, STALL, FROM, TO = 4, 228, 200, 8
K = FROM - TO  # 192 decrements
avail = STALL - START


def build(n1, A, p=2.0):
    iv = [1] * n1
    for k in range(n1, K):
        u = (k - n1 + 1) / (K - n1)
        iv.append(1 + int(round(A * u ** p)))
    return iv


best = None
for n1 in range(100, 185):
    for A10 in range(5, 120):
        iv = build(n1, A10 / 10)
        if sum(iv) == avail and iv[-1] >= 5:
            score = abs(iv[-1] - 9) + (n1 < 140) * 2
            if best is None or score < best[0]:
                best = (score, n1, A10 / 10, iv)
_, n1, A, iv = best
frames, f = [], START
for g in iv:
    f += g
    frames.append(f)
assert frames[-1] == STALL and len(frames) == K
json.dump({'from': FROM, 'to': TO, 'frames': frames}, open(f'{HERE}/src/ticks.json', 'w'))
print('1-frame steps:', n1, 'A', A, 'last gaps:', iv[-12:], 'first ticks:', frames[:5], 'last:', frames[-5:])
