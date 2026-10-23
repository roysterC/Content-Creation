"""Music, sound design + voiceover mix for the rate limiting explainer.
Reads src/timeline.json (scenes + VO starts) and out/events.json (exact event timings)."""
import json
import math

import numpy as np
import soundfile as sf
from scipy.signal import butter, fftconvolve, resample_poly, sosfilt
from pathlib import Path as _P
HERE = _P(__file__).resolve().parent  # this project folder
TTS_DIR = HERE.parents[1] / 'tools' / 'tts'  # shared Kokoro TTS install


SR = 48000
FPS = 30
ROOT = f'{HERE}'
T = json.load(open(f'{ROOT}/src/timeline.json'))
EV = json.load(open(f'{ROOT}/out/events.json'))
P = EV['pkts']
DUR = T['total'] / FPS
N = int((DUR + 0.5) * SR)
rng = np.random.default_rng(7)
fr = lambda f: f / FPS
t_ = lambda s: np.arange(int(s * SR)) / SR


def filt(x, kind, f, order=2):
    return sosfilt(butter(order, f, btype=kind, fs=SR, output='sos'), x, axis=0)


def env(n, a, r):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / r)


def place(b, sig, at, g=1.0, pan=0.0):
    i = int(at * SR)
    if i < 0:  # started before frame 0: keep only the audible tail
        sig, i = sig[-i:], 0
    if i >= N or len(sig) == 0:
        return
    j = min(N, i + len(sig))
    s = sig[: j - i] * g
    b[i:j, 0] += s * math.cos((pan + 1) * math.pi / 4) * 1.414
    b[i:j, 1] += s * math.sin((pan + 1) * math.pi / 4) * 1.414


def bus():
    return np.zeros((N, 2))


def load(p):
    a, sr = sf.read(p)
    if a.ndim > 1:
        a = a.mean(1)
    return resample_poly(a, SR, sr) if sr != SR else a


def reverb(x, sec=1.8, mix=0.25):
    t = t_(sec)
    out = x.copy()
    for c in range(2):
        ir = filt(rng.standard_normal(len(t)), 'low', 6000) * np.exp(-t * 6.9 / sec)
        ir /= np.sqrt((ir ** 2).sum())
        out[:, c] += fftconvolve(x[:, c], ir)[: len(x)] * mix
    return out


def tick(freq=1900, dec=0.007):
    """Crisp clock tick: a sharp click plus a short woody tone."""
    n = int(0.05 * SR)
    t = np.arange(n) / SR
    click = filt(rng.standard_normal(n), 'high', 3500) * np.exp(-t / 0.0025)
    tone = np.sin(2 * np.pi * freq * t) * np.exp(-t / dec) + np.sin(2 * np.pi * freq * 2.4 * t) * np.exp(-t / (dec * 0.5)) * 0.4
    return click * 0.8 + tone * 0.7


def boom(length=1.6, f0=70, f1=30, dec=0.45):
    t = t_(length)
    f = f1 + (f0 - f1) * np.exp(-t * 6)
    return np.tanh(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / dec) * 2.0)


def noise_burst(length, lo, hi, dec):
    n = int(length * SR)
    return filt(rng.standard_normal(n), 'band', [lo, hi]) * env(n, 0.001, dec)


def whoosh(length=0.6, up=True):
    n = int(length * SR)
    t = np.arange(n) / SR
    x = rng.standard_normal(n)
    out = np.zeros(n)
    blk = int(0.01 * SR)
    for i in range(0, n, blk):
        u = i / n if up else 1 - i / n
        c = 400 * (6000 / 400) ** u
        seg = filt(x[max(0, i - 1500) : i + blk], 'band', [c * 0.6, min(c * 1.6, 20000)])
        out[i : i + blk] = seg[-len(out[i : i + blk]) :]
    return out * np.sin(np.pi * t / length) ** 1.5


def bell(f0, length=2.0, b=1.0):
    t = t_(length)
    x = sum(a * np.sin(2 * np.pi * f0 * r * t) * np.exp(-t / d) for r, a, d in ((1, 1, 1.4), (2, 0.5, 0.9), (2.76, 0.3 * b, 0.6), (5.4, 0.15 * b, 0.3)))
    return x * np.minimum(1, t / 0.002) * 0.35


def ring_burst():
    t = t_(0.4)
    x = (np.sin(2 * np.pi * 400 * t) + np.sin(2 * np.pi * 450 * t)) * 0.5
    x *= np.minimum(1, np.minimum(t / 0.01, (0.4 - t) / 0.01))
    return filt(np.tanh(x * 1.6), 'band', [300, 3400])


def pad(freqs, length, cutoff=900, attack=1.5):
    t = t_(length)
    x = sum(np.sin(2 * np.pi * f * (1 + d) * t + rng.random() * 6) for f in freqs for d in (-0.004, 0, 0.005))
    x = filt(x / (len(freqs) * 3), 'low', cutoff)
    return x * np.clip(np.minimum(t / attack, (length - t) / 1.0), 0, 1)


def blip(freq, length=0.09, dec=0.03):
    t = t_(length)
    return np.sin(2 * np.pi * freq * t) * np.exp(-t / dec) * np.minimum(1, t / 0.002)


def buzz(length=0.16):
    t = t_(length)
    x = np.sign(np.sin(2 * np.pi * 140 * t)) * 0.5 + np.sign(np.sin(2 * np.pi * 147 * t)) * 0.5
    return filt(x, 'low', 2500) * np.exp(-t / 0.07) * 0.6


sfx, music = bus(), bus()
fix = fr(T['fix'])

# ── music: tension in the hook, then a light, driving groove from "the fix" ──
BPM = 112
BEAT = 60 / BPM
# hook: rising pad + quickening pulse, cut at the fix
hl = fix
hp = pad((110.0, 164.8, 220.0, 261.6), hl, 700, 1.0) * np.linspace(0.5, 1.0, int(hl * SR))[: int(hl * SR)]
place(music, hp, 0, 0.5)
tb = 0.0
while tb < hl - 0.05:
    u = tb / hl
    t = t_(0.18)
    place(music, np.sin(2 * np.pi * (52 + 40 * np.exp(-t * 40)) * t) * np.exp(-t / 0.07), tb, 0.55)
    tb += 0.55 - 0.3 * u
place(music, whoosh(1.2, True), fix - 1.2, 0.35)


def kick():
    t = t_(0.35)
    return np.tanh(np.sin(2 * np.pi * np.cumsum(46 + 110 * np.exp(-t * 32)) / SR) * np.exp(-t / 0.12) * 1.4)


def hat(open_=False):
    t = t_(0.16 if open_ else 0.04)
    return filt(rng.standard_normal(len(t)), 'high', 7500) * np.exp(-t * (16 if open_ else 90)) * 0.3


def pluck(m, length=0.3, bright=3200):
    f = 440 * 2 ** ((m - 69) / 12)
    t = t_(length)
    x = sum(2 * ((f * (1 + d) * t) % 1) - 1 for d in (-0.005, 0.005)) / 2
    return filt(x, 'low', bright) * np.exp(-t / 0.09) * np.minimum(1, t / 0.003)


# Am - F - C - G
PROG = [([57, 60, 64], 45), ([53, 57, 60], 41), ([48, 52, 55], 48), ([55, 59, 62], 43)]
end = DUR
bar = 0
while fix + bar * 4 * BEAT < end:
    notes, root = PROG[bar % 4]
    for b in range(4):
        tb = fix + (bar * 4 + b) * BEAT
        if tb >= end - 0.05:
            break
        place(music, kick(), tb, 0.55)
        place(music, hat(True), tb + BEAT / 2, 0.22)
        for q in (0.25, 0.75):
            place(music, hat(), tb + BEAT * q, 0.16)
        bt = t_(BEAT * 0.45)
        place(music, filt(np.sin(2 * np.pi * 440 * 2 ** ((root - 69) / 12) * bt), 'low', 400) * np.minimum(1, (BEAT * 0.45 - bt) / 0.03), tb + BEAT / 2, 0.5)
        for k in range(4):  # quiet 16th arpeggio
            place(music, pluck(notes[(b * 4 + k) % 3] + 12), tb + k * BEAT / 4, 0.09, pan=0.3 if k % 2 else -0.3)
    place(music, pad([440 * 2 ** ((m - 69) / 12) for m in notes], 4 * BEAT + 0.5, 900, 0.4), fix + bar * 4 * BEAT, 0.22)
    bar += 1
# fade the groove out at the very end
tN = np.arange(N) / SR
music *= np.interp(tN, [0, DUR - 1.2, DUR], [1, 1, 0])[:, None]

# ── sound design ──
for k in ('series', 'bucket', 'window', 'shared', 'retry', 'recap'):
    place(sfx, whoosh(0.45, True), fr(T[k]) - 0.3, 0.16)
place(sfx, boom(0.8, 120, 50, 0.15), fr(T['fix'] + 16), 0.3)  # the limiter lands
place(sfx, boom(1.2, 90, 34, 0.3), fr(T['v']['fix'] + 128), 0.45)  # 429 stamp
place(sfx, noise_burst(0.15, 1500, 8000, 0.04), fr(T['v']['fix'] + 128), 0.2)
PITCH = [0, 1046.5, 1318.5, 1567.98]  # alice / ben / cara blips; the bot gets clicks
nb = 0
for p in P:
    if not p['gated']:
        if p['c'] == 0:
            place(sfx, tick(2200 + 500 * rng.random(), 0.003), fr(p['arrive']), 0.07, pan=-0.3)  # the flood
        elif p['outcome'] == 'timeout':
            place(sfx, buzz(0.1), fr(p['arrive']), 0.12, pan=0.1)
        else:
            place(sfx, blip(PITCH[p['c']], 0.08, 0.025), fr(p['arrive']), 0.1)
        continue
    if p['outcome'] == '429':
        nb += 1
        if p['c'] == 0 and nb % 3:
            continue  # thin out the bot's bounces so they stay a texture
        g = 0.065 if p['c'] == 0 else 0.22
        place(sfx, blip(392.0, 0.1, 0.04) + 0.0, fr(p['decide']), g, pan=-0.3 + 0.2 * p['c'])
        place(sfx, blip(293.7, 0.12, 0.05), fr(p['decide']) + 0.05, g * 0.8, pan=-0.3 + 0.2 * p['c'])
    elif p['c'] == 0:
        place(sfx, tick(1800, 0.003), fr(p['decide']), 0.035, pan=-0.3)
    else:
        place(sfx, blip(PITCH[p['c']], 0.08, 0.025), fr(p['decide']), 0.1, pan=-0.3 + 0.2 * p['c'])
        if T['bucket'] <= p['spawn'] < T['window']:
            place(sfx, blip(2637.0, 0.06, 0.012) + blip(3136.0, 0.06, 0.01) * 0.6, fr(p['decide']), 0.12, pan=-0.2)  # coin spent
# bucket refill drips + the bot's jar running dry
for f in range(T['bucket'] + 20, T['window'] - 10, 8):
    place(sfx, blip(1760.0, 0.05, 0.012), fr(f), 0.05, pan=0.1)
if EV['bucketEmpty'] > 0:
    place(sfx, boom(0.5, 140, 60, 0.12), fr(EV['bucketEmpty']), 0.3, pan=0.3)
# fixed vs sliding window: a tick per request as the playhead passes; blocked ones buzz
for w in EV['window']:
    if w['ok']:
        place(sfx, tick(1500 + 40 * (w['k'] % 10), 0.004), fr(w['f']), 0.12)
    else:
        place(sfx, buzz(0.06), fr(w['f']), 0.12)
place(sfx, blip(659.3, 0.25, 0.09), fr(T['window'] + 100), 0.2)  # "20 in 15s" bracket
# many servers: hits per server, then Redis lands and the bounces start
for p in EV['shared']:
    if p['ok']:
        place(sfx, blip([880.0, 1108.7, 1318.5][p['s']], 0.07, 0.02), fr(p['arrive']), 0.09, pan=(p['s'] - 1) * 0.5)
    else:
        place(sfx, blip(392.0, 0.1, 0.04), fr(p['arrive']), 0.15, pan=(p['s'] - 1) * 0.5)
place(sfx, boom(0.8, 120, 50, 0.15), fr(EV['redisIn'] + 10), 0.3)
# retry-after: a soft countdown, then the successful retry
R = EV['retry']
for k in range(3):
    place(sfx, blip(1174.7, 0.08, 0.03), fr(R['wait0'] + k * 30), 0.12)
place(sfx, bell(1567.98, 1.2, 0.5), fr(R['again'] + 29), 0.2)
place(sfx, bell(1318.5, 1.6, 0.4), fr(T['recap'] + 96), 0.18)  # follow button

# ── voice + mix ──
vo = bus()
mask = np.zeros(N)
for cid, at in T['v'].items():
    a = load(f'{ROOT}/public/vo/{cid}.wav')
    place(vo, a, fr(at), 1.0)
    i = int(fr(at) * SR)
    mask[i : i + len(a)] = 1
vo = reverb(vo, 0.5, 0.05)
k = int(0.15 * SR)
m = np.clip(np.convolve(mask, np.ones(k) / k, mode='same'), 0, 1)
music *= (1 - 0.72 * m)[:, None]
sfx *= (1 - 0.5 * m)[:, None]
music = reverb(music, 1.2, 0.15)
sfx = reverb(sfx, 0.9, 0.12)
mix = music * 0.26 + sfx * 0.55 + vo * 1.3
for _n, _b in (('music', music * 0.26), ('vo', vo * 1.3), ('sfx', sfx * 0.55)):
    np.save(f'{ROOT}/out/stem-{_n}.npy', _b[: int(DUR * SR)].mean(1).astype(np.float32))
mix = mix[: int(DUR * SR)]
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
mix /= np.abs(mix).max() / 0.9
sf.write(f'{ROOT}/out/rate-audio.wav', mix, SR, subtype='PCM_24')
print('ok', round(DUR, 2))
