"""Music, sound design + voiceover mix for the consistent hashing explainer.
Reads src/timeline.json (scenes + VO starts), src/captions.json (word times) and out/events.json (exact sim events)."""
import json
import math

import numpy as np
import soundfile as sf
from scipy.signal import butter, fftconvolve, resample_poly, sosfilt
from pathlib import Path as _P
HERE = _P(__file__).resolve().parent  # this project folder
TTS_DIR = HERE.parents[1] / 'tools' / 'tts'  # shared Kokoro TTS install


SR = 48000
DUCK_MUSIC = float(__import__('os').environ.get('DUCK_MUSIC', '0'))  # how much the music dips under the voice (0 = not at all: owner wants a steady bed)
MUSIC_GAIN = float(__import__('os').environ.get('MUSIC_GAIN', '0.28'))  # steady bed, never dips; just under the earlier 'loud' 0.4, with a presence-band cut for the voice
FPS = 30
ROOT = f'{HERE}'
T = json.load(open(f'{ROOT}/src/timeline.json'))
CAPS = json.load(open(f'{ROOT}/src/captions.json'))
EV = json.load(open(f'{ROOT}/out/events.json'))


def word(cid, w, nth=0):
    hits = [x for l in CAPS if l['id'] == cid for x in l['words'] if x['t'].lower().startswith(w.lower())]
    return round(hits[nth]['s'])


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
fix = fr(T['ring'])  # the groove arrives with the ring (the relief moment)

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
SP = [880.0, 987.8, 1108.7, 1318.5, 1480.0]  # one pitch per server A–E
for k in ('series', 'modn', 'ring', 'add', 'remove', 'lumpy', 'vnodes', 'real', 'payoff'):
    place(sfx, whoosh(0.45, True), fr(T[k]) - 0.3, 0.15)
# the twists ("the villain?", "a server dies?", "but…"): a soft rising suspense sting
for at in (T['v']['modn'], T['v']['remove'], T['v']['lumpy']):
    t = t_(1.1)
    sting = np.sin(2 * np.pi * np.cumsum(330 + 330 * (t / 1.1) ** 2) / SR) * np.minimum(1, t / 0.3) * np.clip((1.1 - t) / 0.15, 0, 1)
    place(sfx, filt(sting, 'low', 2500) * 0.5, fr(at) - 0.05, 0.12)
# the row: every request is a hit (bright blip, the server's pitch) or a miss (dull tick, then a thud at the database)
for q in EV['reqs']:
    if q['hit']:
        place(sfx, blip(SP[q['s']] * 1.5, 0.05, 0.015), fr(q['decide']), 0.05, pan=(q['s'] - 2) * 0.25)
    else:
        place(sfx, tick(500 + 200 * rng.random(), 0.006), fr(q['decide']), 0.08, pan=(q['s'] - 2) * 0.25)
        place(sfx, boom(0.25, 110, 60, 0.05), fr(q['db']), 0.07)
# a server joins (twice), and the keys reshuffle
for r in EV['runs']:
    place(sfx, whoosh(0.5, False), fr(r['join']), 0.16)
    place(sfx, bell(SP[4], 0.8, 0.4), fr(r['join'] + 12), 0.12)
    for k in range(12):
        place(sfx, whoosh(0.18, True), fr(r['sw'] + k * 1.2), 0.04, pan=rng.uniform(-0.6, 0.6))
# the database chokes (alarm pulse while it's pinned)
for k in range(int((fr(T['ring']) - 2.6) / 0.8)):
    t0 = 2.6 + k * 0.8
    if t0 < fr(T['modn']) - 0.3 or t0 > fr(EV['A']['miss']):
        place(sfx, buzz(0.18), t0, 0.06)
# mod N: the formula ticks over, the moved count rolls
place(sfx, tick(2600, 0.003), fr(EV['A']['modN']), 0.14)
place(sfx, bell(1318.5, 0.9, 0.5), fr(EV['runs'][1]['sw']), 0.14)
for k in range(12):
    place(sfx, tick(1800 + k * 60, 0.003), fr(EV['A']['fourIn5'] - 4 + k * 2.5), 0.07)
place(sfx, buzz(0.3), fr(EV['A']['hit']), 0.16)
# the row bends into a ring
place(sfx, whoosh(0.9, True), fr(EV['morph']['a']), 0.2)
place(sfx, bell(1046.5, 1.6, 0.5), fr(EV['morph']['b']), 0.18)
# the featured key walks clockwise (a rising run), then lands on its server
cw, nx = word('ring', 'clockwise'), word('ring', 'next')
for k in range(8):
    place(sfx, blip(784.0 * 2 ** (k * 2 / 12), 0.07, 0.02), fr(cw + (nx + 4 - cw) * k / 8), 0.09)
place(sfx, bell(1567.98, 1.2, 0.5), fr(nx + 4), 0.18)
# lookups pinging around the ring (quiet)
for l in EV['lookups']:
    place(sfx, blip(SP[l['s']] * 2, 0.05, 0.015), fr(l['end']), 0.035, pan=(l['s'] - 2) * 0.25)
# add a server: pop, its slice changes hands, the count
place(sfx, blip(1975.5, 0.12, 0.04), fr(word('add', 'add')), 0.14)
place(sfx, whoosh(0.4, True), fr(EV['ringAdd']), 0.14)
for k in range(9):
    place(sfx, tick(2000 + k * 80, 0.003), fr(word('add', '1') - 6 + k * 2.2), 0.08)
# a server dies, its keys slide to the neighbour
place(sfx, boom(0.8, 120, 45, 0.15), fr(word('remove', 'dies')), 0.32)
place(sfx, buzz(0.3), fr(word('remove', 'dies')), 0.18)
place(sfx, whoosh(0.5, True), fr(EV['ringRemove']), 0.16)
place(sfx, bell(1318.5, 1.2, 0.5), fr(word('remove', 'stays')), 0.16)
# lumpy: the overloaded server
place(sfx, buzz(0.35), fr(word('lumpy', 'double')), 0.16)
# virtual nodes: a shimmer of 100s of points, then the slices even out
hu = word('vnodes', '100')
for k in range(50):
    place(sfx, blip(1800 + 1400 * rng.random(), 0.04, 0.01), fr(hu - 4 + k * 0.6), 0.04, pan=rng.uniform(-0.7, 0.7))
place(sfx, bell(1567.98, 1.6, 0.5), fr(word('vnodes', 'even')), 0.22)
# in the wild: the chips
for w in ('cassandra', 'dynamo', 'thousands'):
    place(sfx, blip(1318.5, 0.1, 0.03), fr(word('real', w)), 0.12)
# recap: a soft tick as each of the 4 lines lands
for i in range(4):
    place(sfx, blip(SP[i] * 1.5, 0.08, 0.025), fr(T['payoff'] + 24 + i * 14), 0.14)
place(sfx, bell(1567.98, 1.8, 0.5), fr(word('payoff', 'moves')), 0.2)

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
music *= (1 - DUCK_MUSIC * m)[:, None]  # 0 = music never dips under the voice
# a fixed (never moving) cut in the music's speech-presence band, so a loud bed doesn't mask the words
music = music - 0.55 * filt(music, 'band', [1500, 4200])
sfx *= (1 - 0.35 * m)[:, None]  # duck effects less under the voice: owner wants them louder
music = reverb(music, 1.2, 0.15)
sfx = reverb(sfx, 0.9, 0.12)
mix = music * MUSIC_GAIN + sfx * 1.0 + vo * 1.3
for _n, _b in (('music', music * MUSIC_GAIN), ('vo', vo * 1.3), ('sfx', sfx * 1.0)):
    np.save(f'{ROOT}/out/stem-{_n}.npy', _b[: int(DUR * SR)].mean(1).astype(np.float32))
mix = mix[: int(DUR * SR)]
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
mix /= np.abs(mix).max() / 0.9
sf.write(f'{ROOT}/out/ch-audio.wav', mix, SR, subtype='PCM_24')
print('ok', round(DUR, 2))
