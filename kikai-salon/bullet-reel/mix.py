"""Sound design + voiceover mix for the Kikai bullet bait-and-switch reel.
Timings mirror bullet/src/reelTimeline.ts (frames @ 30fps)."""
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
R = json.load(open(f'{HERE}/src/reel-timeline.json'))  # shared with reelTimeline.ts
VO = R['v']
ROOT = f'{HERE}'
DUR = R['total'] / FPS
N = int((DUR + 0.5) * SR)
rng = np.random.default_rng(21)
fr = lambda f: f / FPS
t_ = lambda s: np.arange(int(s * SR)) / SR


def filt(x, kind, f, order=2):
    return sosfilt(butter(order, f, btype=kind, fs=SR, output='sos'), x, axis=0)


def env(n, a, r):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / r)


def place(b, sig, at, g=1.0, pan=0.0):
    i = int(at * SR)
    if i >= N:
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


# ── countdown (mirrors reelCount) ────────────────────────────
def count(f):
    if f < R['stall']:
        return 8 + 192 * ((R['stall'] - f) / R['stall']) ** 2.2
    if f < R['resume']:
        return 8
    if f < R['impact']:
        return 8 * (R['impact'] - f) / (R['impact'] - R['resume'])
    return 0


def shown(f):
    return 0 if f >= R['impact'] else max(1, math.ceil(count(f) - 1e-6))


# ── instruments ──────────────────────────────────────────────
def drone(length, f0=110.0, rise=1.0, whine=False, bpm0=72, bpm1=126):
    """Soft tension bed (replaces the buzzy drone): low warm pad that swells,
    a quiet airy riser, and a heartbeat that speeds up. No high whine."""
    t = t_(length)
    u = t / length
    pad_ = sum(np.sin(2 * np.pi * f0 * m * (1 + 0.01 * (rise - 1) * u) * t + k) for k, m in enumerate((1.0, 1.5, 2.0)))
    pad_ = filt(pad_, 'low', 520) * (0.25 + 0.75 * u ** 1.5) * 0.35
    air = filt(rng.standard_normal(len(t)), 'band', [500, 2500]) * (u ** 2.5) * 0.05
    beat = np.zeros(len(t))
    tb = 0.25
    while tb < length - 0.1:
        bpm = bpm0 + (bpm1 - bpm0) * (tb / length) ** 1.5
        for off, g in ((0.0, 1.0), (0.16, 0.6)):
            i = int((tb + off) * SR)
            n = int(0.18 * SR)
            if i + n < len(beat):
                tt = np.arange(n) / SR
                beat[i : i + n] += np.sin(2 * np.pi * (48 + 30 * np.exp(-tt * 40)) * tt) * np.exp(-tt / 0.06) * g
        tb += 60 / bpm
    return pad_ + air + beat * 0.55


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


def splash(length=1.8):
    n = int(length * SR)
    t = np.arange(n) / SR
    am = 0.6 + 0.4 * np.abs(np.sin(2 * np.pi * (18 + 30 * rng.random()) * t))
    return filt(rng.standard_normal(n), 'band', [600, 7000]) * am * np.exp(-t / 0.5)


# ── build ────────────────────────────────────────────────────
sfx = bus()
music = bus()
stall = fr(R['stall'])

# 1. hook: drone + whine, cut dead at the stall
d = drone(stall)
d[-int(0.004 * SR):] *= np.linspace(1, 0, int(0.004 * SR))
place(music, d * np.minimum(1, t_(stall) / 0.05), 0, 0.3)
# clicks from the shared opening schedule: a 30/s rattle while the bullet races,
# then one click per number, spreading out as it brakes
OPEN = json.load(open(f'{ROOT}/src/opening.json'))
CL = OPEN['clicks']
RACE_END = OPEN['raceEnd']
slow = [c for c in CL if c['f'] > RACE_END]
for c in CL:
    if c['f'] <= RACE_END:
        place(sfx, tick(1500 + 3 * c['f']), fr(c['f']), 0.5, pan=0.1)
for i, c in enumerate(slow):
    prog = i / max(1, len(slow) - 1)
    place(sfx, tick(1700 + 800 * prog), fr(c['f']), 0.6 + 0.75 * prog ** 1.3, pan=0.1)

# the race: a supersonic whizz that drops away as time slows at 2.0s
race_t = fr(RACE_END)
n = int((race_t + 0.2) * SR)
tt = np.arange(n) / SR
whz = filt(rng.standard_normal(n), 'band', [1800, 7000]) * np.minimum(1, tt / 0.08)
whz *= np.clip((race_t + 0.2 - tt) / 0.35, 0, 1)
place(sfx, whz, 0.0, 0.16, pan=-0.2)
# time-slow "whoomp": a falling tone + downward noise sweep
t = t_(1.0)
fall = np.sin(2 * np.pi * np.cumsum(220 * np.exp(-t * 2.2) + 45) / SR) * np.exp(-t / 0.45)
place(sfx, fall, race_t - 0.05, 0.45)
place(sfx, whoosh(0.9, False), race_t - 0.1, 0.22)
# the stall: hit + air
place(sfx, boom(1.4, 90, 34, 0.35), stall, 0.75)
place(sfx, noise_burst(0.25, 2000, 9000, 0.04), stall, 0.3)
place(sfx, bell(130.8, 2.5, 0.3), stall, 0.35)

# 2. bed under the voice: low pad, D minor colour
span = fr(R['kikai']) - stall  # the 'bad' stretch, stall → Kikai
for i, (chord, at, ln) in enumerate([((146.8, 220.0, 293.7), stall + 0.6, span * 0.42), ((116.5, 174.6, 233.1), stall + span * 0.4, span * 0.4), ((130.8, 196.0, 261.6), stall + span * 0.74, span * 0.4)]):
    place(music, pad(chord, ln, 800, 1.2), at, 0.32)

# 3. wireframe: scan sweep + data blips, and back
place(sfx, whoosh(0.5, True), fr(R['wireIn']) - 0.05, 0.25)
for k in range(10):
    place(sfx, np.sin(2 * np.pi * rng.choice([1320, 1760, 2093, 2637]) * t_(0.05)) * env(int(0.05 * SR), 0.002, 0.02), fr(R['wireIn']) + 0.15 + k * 0.09, 0.12, pan=rng.uniform(-0.5, 0.5))
place(sfx, whoosh(0.45, False), fr(R['wireOut']) - 0.2, 0.22)

# 4. into the phone
place(sfx, whoosh(0.8, False), fr(R['shrink']), 0.3)
for r in R['rings']:
    place(sfx, ring_burst(), fr(r), 0.22, pan=0.1)
    place(sfx, ring_burst(), fr(r) + 0.55, 0.22, pan=0.1)
# missed: dull thud + falling tone
place(sfx, boom(0.6, 120, 60, 0.12), fr(R['missed']), 0.5)
t = t_(0.5)
place(sfx, np.sin(2 * np.pi * np.cumsum(660 - 300 * t / 0.5) / SR) * np.exp(-t / 0.18) * 0.4, fr(R['missed']) + 0.05, 0.35)
# Kikai picks up
place(sfx, bell(1174.7, 2.4), fr(R['kikai']), 0.38)
place(sfx, bell(1568.0, 2.0, 0.6), fr(R['kikai']) + 0.12, 0.22)
place(sfx, bell(1760.0, 1.4, 0.4), fr(R['booked']), 0.25)

# 5. back to the can: rising whoosh, drone returns, last 8 ticks, silence, impact
place(sfx, whoosh(0.6, True), fr(R['zoomBack']), 0.32)
imp = fr(R['impact'])
dl = imp - fr(R['resume']) - 0.12
d2 = drone(dl, 110.0, 1.0, False, 120, 150)
d2[-int(0.004 * SR):] *= np.linspace(1, 0, int(0.004 * SR))
place(music, d2 * np.minimum(1, t_(dl) / 0.08), fr(R['resume']), 0.3)
for f in range(R['resume'] + 1, R['impact']):
    if shown(f) != shown(f - 1):
        place(sfx, tick(2300 + (8 - shown(f)) * 90), fr(f), 1.35, pan=0.1)
place(sfx, boom(2.2, 75, 28, 0.7), imp, 1.0)
place(sfx, noise_burst(0.35, 1500, 12000, 0.06), imp, 0.55)
metal = sum(np.sin(2 * np.pi * f * t_(0.9)) * np.exp(-t_(0.9) / d) for f, d in ((1180, 0.25), (2710, 0.15), (4130, 0.09), (6020, 0.06)))
place(sfx, metal * 0.25, imp + 0.005, 0.5, pan=0.2)
place(sfx, splash(2.0), imp + 0.03, 0.4, pan=0.35)
place(sfx, filt(rng.standard_normal(int(2.5 * SR)), 'high', 5000) * np.exp(-t_(2.5) / 0.9) * 0.15, imp + 0.1, 0.5, pan=0.4)

# 6. card + CTA
place(sfx, whoosh(0.7, True), fr(R['card']) - 0.3, 0.2)
place(sfx, bell(880.0, 3.0, 0.5), fr(R['card']) + 0.3, 0.22)
place(sfx, noise_burst(0.05, 800, 5000, 0.01) * 0.6 + np.sin(2 * np.pi * 1400 * t_(0.05)) * env(int(0.05 * SR), 0.001, 0.015), fr(R['cta']), 0.4)

# 7. loop: bring the opening drone back in so the restart is seamless
lo = fr(R['total'] - R['loopOut'])
d3 = drone(lo, 110.0, 1.0, False, 72, 72)
place(music, d3 * np.linspace(0, 1, len(d3)) ** 2, fr(R['loopOut']), 0.3)


# ── the good: upbeat track from "Kikai picks up" to the loop ──
# 120 BPM, one beat = 15 frames. The beat grid is anchored so the impact is the downbeat of bar 3;
# the track fades in on the Kikai beat (which sits on a beat of that grid).
BPM = 120
BEAT = 60 / BPM
G0 = fr(R['kikai'])
GRID0 = fr(R['impact']) - 8 * BEAT
assert (R['kikai'] - (R['impact'] - 120)) % 15 == 0 and R['kikai'] >= R['impact'] - 120
G_END = fr(R['loopOut']) + 0.8
good = bus()
kick_times = []


def kick():
    t = t_(0.4)
    f = 48 + 120 * np.exp(-t * 35)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.13)
    return np.tanh((x + filt(rng.standard_normal(len(t)), 'high', 3000) * np.exp(-t * 300) * 0.25) * 1.5)


def clap():
    t = t_(0.25)
    n = filt(rng.standard_normal(len(t)), 'band', [1000, 4000])
    e = sum(np.where(t >= d, np.exp(-(t - d) * 160), 0) for d in (0, 0.01, 0.021)) + np.where(t >= 0.03, 0.5 * np.exp(-(t - 0.03) * 18), 0)
    return n * e * 0.8


def hat(open_=False):
    t = t_(0.2 if open_ else 0.05)
    return filt(rng.standard_normal(len(t)), 'high', 7000) * np.exp(-t * (14 if open_ else 80)) * (0.45 if open_ else 0.3)


def pluck_chord(ms, length=0.35, bright=4000):
    t = t_(length)
    x = np.zeros_like(t)
    for m in ms:
        f = 440 * 2 ** ((m - 69) / 12)
        for d in (-0.006, 0.006):
            ph = (f * (1 + d) * t) % 1.0
            x += 2 * ph - 1
    x = filt(x / (len(ms) * 2), 'low', bright)
    return x * np.exp(-t / 0.12) * np.minimum(1, t / 0.003)


def bassnote(m, length=0.22):
    f = 440 * 2 ** ((m - 69) / 12)
    t = t_(length)
    x = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)
    return filt(x, 'low', 600) * np.minimum(1, t / 0.004) * np.minimum(1, (length - t) / 0.02) * 0.8


def bell2(m, length=0.6):
    f = 440 * 2 ** ((m - 69) / 12)
    t = t_(length)
    return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 3 * t) * np.exp(-t / 0.05)) * np.exp(-t / 0.25) * 0.35


# D major: D, A, Bm, G voicings (MIDI) + bass roots
CH = {'D': ([62, 66, 69, 74], 38), 'A': ([61, 64, 69, 73], 45), 'Bm': ([62, 66, 71, 74], 47), 'G': ([62, 67, 71, 74], 43)}
PROG = ['D', 'A', 'D', 'A', 'Bm', 'G', 'D']
MELODY = [78, 76, 74, 76, 78, 81, 78, 76]  # light topline from the drop
build0, build1 = fr(R['zoomBack']), fr(R['impact'])
bar = 0
while GRID0 + bar * 4 * BEAT < G_END:
    chord, root = CH[PROG[bar % len(PROG)]]
    for b in range(4):
        tb = GRID0 + (bar * 4 + b) * BEAT
        if tb >= G_END:
            break
        if tb < G0 - 0.01:
            continue
        building = build0 <= tb < build1
        if not building:
            place(good, kick(), tb, 0.9)
            kick_times.append(tb)
        if b in (1, 3) and not building:
            place(good, clap(), tb, 0.55)
        place(good, hat(True), tb + BEAT / 2, 0.35)
        for q in (0.25, 0.75):
            place(good, hat(), tb + BEAT * q, 0.25)
        # offbeat bass + chord stabs
        place(good, bassnote(root), tb + BEAT / 2, 0.7)
        place(good, pluck_chord(chord), tb + BEAT / 2, 0.5, pan=-0.2)
        if b == 3:
            place(good, pluck_chord(chord), tb + BEAT * 0.75, 0.35, pan=0.2)
        # topline after the drop
        if tb >= build1:
            place(good, bell2(MELODY[(bar * 4 + b) % len(MELODY)]), tb, 0.16, pan=0.25)
    bar += 1
# build: snare roll accelerating into the drop
k = 0
tt = build0 + 0.15
while tt < build1 - 0.02:
    place(good, clap() * 0.6, tt, 0.15 + 0.6 * (tt - build0) / (build1 - build0))
    step = BEAT / 4 if tt < build1 - 0.45 else BEAT / 8  # build is ~1.4s now
    tt += step
place(good, kick() * 1.2, build1, 1.0)
crash = filt(rng.standard_normal(int(2.0 * SR)), 'high', 5000) * np.exp(-t_(2.0) / 0.6) * 0.5
place(good, crash, build1, 0.5, pan=0.1)

# sidechain pump
duckk = np.ones(N)
tN = np.arange(N) / SR
for kt in kick_times:
    i = int(kt * SR)
    j = min(N, i + int(0.3 * SR))
    duckk[i:j] = np.minimum(duckk[i:j], 1 - 0.45 * np.exp(-(tN[i:j] - kt) * 10))
good *= duckk[:, None]
# filter down during the build, open again on the drop
lp = filt(good, 'low', 500)
w = np.interp(tN, [build0 - 0.1, build0 + 0.3, build1 - 0.05, build1], [0, 1, 1, 0])
good = good * (1 - w[:, None]) + lp * w[:, None]
# fade in on the Kikai chime, fade out into the loop
gfade = np.interp(tN, [G0 - 0.05, G0 + 0.25, fr(R['loopOut']), fr(R['total'])], [0, 1, 1, 0])
good *= gfade[:, None]
# extra room under the tagline line
v6s = fr(VO['v6'])
good *= np.interp(tN, [v6s - 0.25, v6s, v6s + 3.4, v6s + 3.7], [1, 0.62, 0.62, 1])[:, None]

# the bad bed bows out as the good arrives
bad_gate = np.interp(tN, [G0 - 0.4, G0, fr(R['loopOut']) - 0.01, fr(R['loopOut'])], [1, 0, 0, 1])
music *= bad_gate[:, None]

# ── voice + mix ──────────────────────────────────────────────
vo = bus()
mask = np.zeros(N)
for cid, at in VO.items():
    a = load(f'{ROOT}/public/vo/{cid}.wav')
    place(vo, a, fr(at), 1.35 if cid == 'v7' else 1.0)  # lift the CTA line over the track
    i = int(fr(at) * SR)
    mask[i : i + len(a)] = 1
vo = reverb(vo, 0.7, 0.07)
k = int(0.15 * SR)
duck = 1 - 0.5 * np.clip(np.convolve(mask, np.ones(k) / k, mode='same'), 0, 1)
music *= duck[:, None]
music = reverb(music, 2.0, 0.25)
good *= (1 - 0.68 * np.clip(np.convolve(mask, np.ones(k) / k, mode='same'), 0, 1))[:, None]
good = reverb(good, 1.2, 0.12)
sfx = reverb(sfx, 1.4, 0.18)

mix = music * 0.7 + good * 0.3 + sfx * 0.85 + vo * 1.25
for _n, _b in (('good', good * 0.3), ('vo', vo * 1.25), ('bad', music * 0.7)):
    np.save(f'{ROOT}/out/stem-{_n}.npy', _b[: int(DUR * SR)].mean(1).astype(np.float32))
mix = mix[: int(DUR * SR)]
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
mix /= np.abs(mix).max() / 0.9
sf.write(f'{ROOT}/out/reel-audio.wav', mix, SR, subtype='PCM_24')
print('ok', round(DUR, 2))
