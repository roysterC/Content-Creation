"""Full soundtrack for the "Free consultation" reel: original music, sound design
and the voiceover, on the shared timeline in free-consult/src/cues.json.

Bad -> good switch:
  0 .. switch   tense: soft A-minor bed, clock ticks on a 120 BPM grid (louder than
                the bed), salon ambience, UK phone ring cut dead when it rings out,
                one "missed" thunk per card, whooshes + muted dings at the rival salon
  switch ..     upbeat house, 120 BPM, D major: kick, offbeat hats, piano stabs,
                a riser through the bar before the drop
  drop          full groove + bass + claps, landing exactly on "A free consultation"
  card          groove thins out, one warm chord to the end
"""
import glob
import json

import numpy as np
import soundfile as sf
from scipy.signal import butter, fftconvolve, resample_poly, sosfilt
from pathlib import Path as _P
HERE = _P(__file__).resolve().parent  # this project folder


SR = 48000
ROOT = f'{HERE}'
C = json.load(open(f'{ROOT}/src/cues.json'))
FPS = C['fps']
DUR = C['total'] / FPS
N = int((DUR + 1.0) * SR)
rng = np.random.default_rng(7)
S = C['sfx']

fr = lambda f: f / FPS
t_ = lambda sec: np.arange(int(sec * SR)) / SR
note = lambda m: 440.0 * 2 ** ((m - 69) / 12)


def bus():
    return np.zeros((N, 2))


def place(b, sig, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    if i >= N or i + len(sig) <= 0:
        return
    if i < 0:
        sig = sig[-i:]
        i = 0
    j = min(N, i + len(sig))
    s = sig[: j - i] * gain
    if s.ndim == 1:
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        b[i:j, 0] += s * l * 1.414
        b[i:j, 1] += s * r * 1.414
    else:
        b[i:j] += s


def filt(sig, kind, f, order=2):
    return sosfilt(butter(order, f, btype=kind, fs=SR, output='sos'), sig, axis=0)


def env_ar(n, a, r):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / r)


def noise(sec):
    return rng.standard_normal(int(sec * SR))


def load(path, gain=1.0):
    a, sr = sf.read(path)
    if a.ndim > 1:
        a = a.mean(1)
    if sr != SR:
        a = resample_poly(a, SR, sr)
    return a * gain


def reverb(stereo, seconds=2.2, mix=0.25, damp=5000):
    t = t_(seconds)
    out = stereo.copy()
    for ch in range(2):
        ir = filt(rng.standard_normal(len(t)), 'low', damp) * np.exp(-t * 6.9 / seconds)
        ir[: int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))
        ir /= np.sqrt(np.sum(ir ** 2))
        out[:, ch] += fftconvolve(stereo[:, ch], ir)[: len(stereo)] * mix
    return out


# ── instruments ──────────────────────────────────────────────
def piano(freq, length=1.2, vel=1.0):
    t = t_(length)
    out = np.zeros_like(t)
    for h in range(1, 9):
        fh = freq * h * np.sqrt(1 + 0.0004 * h * h)
        if fh > 12000:
            break
        amp = (1 / h ** 1.1) * (0.6 + 0.4 * vel)
        dec = 2.2 / (1 + 0.35 * h) * (220 / max(freq, 110)) ** 0.25
        out += amp * np.sin(2 * np.pi * fh * t + rng.random()) * np.exp(-t / dec)
    out = out * np.minimum(1, t / 0.003)
    rel = int(0.08 * SR)
    out[-rel:] *= np.linspace(1, 0, rel)
    return out * 0.5


def pad(freqs, length, cutoff=1400, attack=1.2, release=0.8):
    t = t_(length)
    out = np.zeros_like(t)
    for f in freqs:
        for d in (-0.006, 0, 0.007):
            ph = 2 * np.pi * f * (1 + d) * t + rng.random() * 6
            out += np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.15 * np.sin(3 * ph)
    out = filt(out / (len(freqs) * 3), 'low', cutoff)
    e = np.minimum(1, t / attack) * np.minimum(1, (length - t) / release)
    return out * np.clip(e, 0, 1)


def bell(f0, length=2.5, bright=1.0):
    t = t_(length)
    out = np.zeros_like(t)
    for ratio, amp, dec in ((1, 1, 1.6), (2.0, 0.5, 1.1), (2.76, 0.35 * bright, 0.7), (5.4, 0.2 * bright, 0.4), (8.93, 0.1 * bright, 0.25)):
        out += amp * np.sin(2 * np.pi * f0 * ratio * t) * np.exp(-t / dec)
    return out * np.minimum(1, t / 0.002) * 0.35


def shimmer(length, f_lo=2000, f_hi=6000, density=40):
    out = np.zeros(int(length * SR))
    for _ in range(int(density * length)):
        at = rng.uniform(0, length - 0.3)
        tt = t_(0.3)
        g = np.sin(2 * np.pi * rng.uniform(f_lo, f_hi) * tt) * np.exp(-tt * 18) * rng.uniform(0.2, 0.6)
        i = int(at * SR)
        out[i : i + len(g)] += g
    return out * np.sin(np.pi * np.arange(len(out)) / len(out)) * 0.25


def kick(punch=1.0):
    t = t_(0.42)
    f = 46 + 110 * np.exp(-t * 28)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7.5)
    click = filt(noise(0.42), 'band', [1500, 6000]) * np.exp(-t * 400) * 0.25 * punch
    return np.tanh((body + click) * 1.6) * 0.8


def hat(open_=False):
    n = 0.16 if open_ else 0.045
    return filt(noise(n), 'high', 7500) * env_ar(int(n * SR), 0.001, 0.05 if open_ else 0.012) * 0.5


def clap():
    out = np.zeros(int(0.3 * SR))
    for k, d in enumerate((0, 0.011, 0.022)):
        b = filt(noise(0.3), 'band', [900, 2600]) * env_ar(int(0.3 * SR), 0.0005, 0.008 if k < 2 else 0.07)
        i = int(d * SR)
        out[i:] += b[: len(out) - i]
    return out * 0.7


def bass(freq, length):
    t = t_(length)
    saw = 2 * ((freq * t) % 1) - 1
    s = filt(saw, 'low', 420) + 0.6 * np.sin(2 * np.pi * freq * t)
    return s * np.minimum(1, t / 0.006) * np.minimum(1, (length - t) / 0.03) * 0.55


def thunk(f0):
    """Dull 'missed' notification: a falling sine bump with a soft click."""
    t = t_(0.35)
    f = f0 * (1 - 0.35 * np.minimum(1, t / 0.12))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 14)
    c = filt(noise(0.35), 'band', [800, 3000]) * np.exp(-t * 300) * 0.3
    return (s + c) * 0.7


def whoosh(length=0.45, lo=400, hi=4000):
    n = noise(length)
    t = t_(length)
    out = np.zeros_like(n)
    seg = int(0.01 * SR)
    for i in range(0, len(n) - seg, seg):
        fc = lo + (hi - lo) * np.sin(np.pi * i / len(n))
        out[i : i + seg] = filt(n[max(0, i - 400) : i + seg], 'band', [fc * 0.7, fc * 1.3])[-seg:]
    return out * np.sin(np.pi * t / length) ** 2 * 0.6


def tick():
    t = t_(0.05)
    return (np.sin(2 * np.pi * 1900 * t) * 0.6 + filt(noise(0.05), 'high', 3000) * 0.4) * np.exp(-t * 160)


# ── timeline ─────────────────────────────────────────────────
SW = fr(S['switch'])
DROP = fr(S['drop'])
CARD = fr(S['card'])
G0 = fr(S['grid0'])
BEAT = 0.5
BAR = 2.0

music = bus()
sfx = bus()
amb = bus()

# ── 1. tense half ────────────────────────────────────────────
# soft bed: A minor -> F, filtered, slow swell
for k, chord in enumerate(((57, 60, 64), (53, 57, 60), (57, 60, 64))):
    t0 = k * 3.2
    if t0 >= SW:
        break
    ln = min(3.2 + 0.8, SW - t0 + 0.3)
    place(music, pad([note(m - 12) for m in chord], ln, cutoff=850, attack=0.8, release=0.3), t0, 0.24)
place(music, pad([note(33)], SW, cutoff=200, attack=1.5, release=0.2), 0, 0.3)
# clock ticks on the 120 BPM grid (continuous with the house that follows), louder than the bed
k = 0
while G0 - k * BEAT > 0:
    k += 1
for i in range(-k, 200):
    at = G0 + i * BEAT
    if at < 0 or at >= SW - 0.01:
        continue
    place(sfx, tick(), at, 0.28 if i % 2 == 0 else 0.18, pan=0.15)

# salon ambience: hairdryer, room tone, chatter (hook + missed)
busy_end = fr(C['scenes']['lost']['start'])
L = int(busy_end * SR)
t = np.arange(L) / SR
n = filt(rng.standard_normal(L), 'band', [700, 5200]) * (1 + 0.15 * np.sin(2 * np.pi * 0.35 * t))
place(amb, n * 0.12 * np.minimum(1, (busy_end - t) / 0.08), 0, 0.5, pan=-0.5)
place(amb, filt(rng.standard_normal(L), 'low', 400) * 0.05, 0, 1.0)
chat = bus()
files = sorted(glob.glob(f'{ROOT}/audio/chatter/*.wav'))
for stream, pan in ((0, -0.5), (1, 0.4)):
    tt = 0.1 + stream * 0.6
    j = stream
    while tt < busy_end:
        a = load(files[j % len(files)])
        place(chat, filt(a, 'band', [250, 2400]), tt, 0.45, pan=pan)
        tt += len(a) / SR + rng.uniform(0.3, 1.0)
        j += 3
chat = reverb(chat, 1.6, 0.6, damp=3000)
chat[int(busy_end * SR) :] = 0
amb += chat * 0.6

# street ambience at the rival salon
ls, le = fr(C['scenes']['lost']['start']), SW
st = filt(noise(le - ls), 'low', 700) * 0.06
place(amb, st * np.minimum(1, (le - ls - t_(le - ls)) / 0.1), ls, 1.0)
car = filt(noise(1.6), 'band', [150, 900]) * np.sin(np.pi * t_(1.6) / 1.6) ** 2 * 0.25
place(amb, car, ls + 0.3, 1.0, pan=-0.4)
for _ in range(4):
    tt2 = t_(0.12)
    f = np.linspace(rng.uniform(3500, 4500), rng.uniform(5000, 6500), len(tt2))
    place(amb, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt2 / 0.12) * 0.05, ls + rng.uniform(0.2, 2.2), 1.0, pan=0.6)

# UK phone ring from frame 0, cut dead when it rings out
ring_len = fr(S['ringEnd'])
t = t_(ring_len)
cad = t % 3.0
on = filt(((cad < 0.4) | ((cad >= 0.6) & (cad < 1.0))).astype(float), 'low', 60)
tone = filt(np.tanh((np.sin(2 * np.pi * 400 * t) + np.sin(2 * np.pi * 450 * t)) * on * 1.5), 'band', [300, 3500])
tone[-int(0.004 * SR) :] *= np.linspace(1, 0, int(0.004 * SR))
place(sfx, tone, 0, 0.17, pan=0.3)

# one thunk per missed-call card, each a little higher (frame-synced to the counter)
for i, m in enumerate(S['miss']):
    place(sfx, thunk(330 + i * 40), fr(m), 0.55, pan=0.1)

# cards fly to the rival salon; muted dings as they get booked there
for i in range(len(S['miss'])):
    place(sfx, whoosh(0.5), fr(S['fly'] + (len(S['miss']) - 1 - i) * 6), 0.4, pan=-0.3 + i * 0.2)
for i, b in enumerate(S['rivalBooked']):
    place(sfx, filt(bell(note(76 + i), 1.2, 0.4), 'low', 2200), fr(b), 0.28, pan=0.2)

# ── 2. the switch: upbeat house ──────────────────────────────
# chime + shimmer as the phone glows
place(sfx, bell(note(86), 3.0), SW, 0.45, pan=0.2)
place(sfx, bell(note(81), 2.5), SW + 0.1, 0.3, pan=-0.1)
place(sfx, shimmer(2.0), SW, 0.45)

PROG = [(62, [62, 66, 69, 73]), (59, [59, 62, 66, 69]), (55, [55, 59, 62, 66]), (57, [57, 61, 64, 69])]  # Dmaj7 Bm7 Gmaj7 A
STABS = [0.5, 1.5, 2.75, 3.5]
end_t = DUR + 0.5
nbars = int((end_t - G0) / BAR) + 1
for b in range(nbars):
    t0 = G0 + b * BAR
    pre = t0 < DROP - 1e-6
    lastpre = pre and t0 + BAR > DROP - 1e-6
    after_card = t0 >= CARD - 1e-6
    root, ch = PROG[b % 4]
    for beat in range(4):
        at = t0 + beat * BEAT
        if at < SW - 1e-6 or at >= end_t:
            continue
        gap = lastpre and beat >= 2  # two empty beats before the drop
        if not gap:
            place(music, kick(), at, 0.55 if pre else 0.8)
        if not gap:
            place(music, hat(open_=not pre), at + BEAT / 2, 0.22 if pre else 0.3, pan=0.25)
        if not pre and beat in (1, 3) and not after_card:
            place(music, clap(), at, 0.38, pan=-0.05)
        if not pre:
            place(music, bass(note(root - 24), BEAT / 2 - 0.02), at + BEAT / 2, 0.55 if not after_card else 0.35)
    for s in STABS:
        at = t0 + s * BEAT
        if at < SW - 1e-6 or at >= CARD + 1e-6 and b % 2:
            continue
        for m in ch:
            stab = piano(note(m), 0.5, 0.8)
            place(music, filt(stab, 'low', 1600) if pre else stab, at, 0.16 if pre else 0.2, pan=-0.2)
    place(music, pad([note(m) for m in ch], BAR + 0.3, cutoff=900 if pre else 1800, attack=0.3, release=0.3), max(t0, SW), 0.16)

# riser through the bar before the drop, then the impact
rs = DROP - BAR
rl = BAR
t = t_(rl)
sweep = np.zeros(int(rl * SR))
nz = noise(rl)
seg = int(0.02 * SR)
for i in range(0, len(nz) - seg, seg):
    fc = 500 + 7000 * (i / len(nz)) ** 2
    sweep[i : i + seg] = filt(nz[max(0, i - 800) : i + seg], 'band', [fc * 0.8, fc * 1.25])[-seg:]
place(music, sweep * (t / rl) ** 1.5 * 0.3, rs, 1.0)
place(music, np.sin(2 * np.pi * np.cumsum(220 + 660 * (t / rl) ** 2) / SR) * (t / rl) ** 2 * 0.08, rs, 1.0)
tb = t_(1.6)
boom = np.sin(2 * np.pi * np.cumsum(30 + 60 * np.exp(-tb * 6)) / SR) * np.exp(-tb * 2.5)
place(sfx, np.tanh(boom * 1.4) * 0.8, DROP, 0.3)
place(sfx, filt(noise(1.8), 'high', 4000) * np.exp(-t_(1.8) * 2.2) * 0.35, DROP, 0.35)
place(sfx, shimmer(1.6, 2500, 8000, 70), DROP, 0.5)

# final chord on the end card, held to the end
tail = DUR - CARD + 0.5
for m, g in ((50, 0.4), (57, 0.32), (62, 0.3), (66, 0.26), (69, 0.22), (73, 0.16)):
    place(music, piano(note(m), min(tail, 5.0), 0.8), CARD, g * 0.5, pan=-0.2)
place(music, pad([note(x) for x in (50, 57, 62, 66)], tail, cutoff=1600, attack=0.3), CARD, 0.26)

music = reverb(music, 1.8, 0.18)

# ── 3. sound design over the house ───────────────────────────
DESK = fr(S['switch'] + 24)
place(sfx, shimmer(1.4, 2500, 7000), DESK, 0.45)  # ribbon to the diary


def scribble(length):
    n = int(length * SR)
    t = np.arange(n) / SR
    am = 0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 7 * t + np.sin(2 * np.pi * 2.3 * t)))
    return filt(rng.standard_normal(n), 'band', [1800, 6000]) * am * np.minimum(1, (length - t) / 0.05) * 0.18


# after hours: rain, a quick ring answered with a chime
ni, di = fr(S['nightIn']), fr(S['diaryIn'])
rn = filt(noise(di - ni + 0.4), 'band', [400, 7000]) * 0.07
rn *= np.clip(np.minimum(t_(len(rn) / SR) / 0.3, (len(rn) / SR - t_(len(rn) / SR)) / 0.3), 0, 1)
place(sfx, rn, ni, 0.6, pan=-0.3)
dn = fr(S['dayNight'])
place(sfx, bell(note(83), 2.0, 0.6), dn, 0.32, pan=0.3)
place(sfx, bell(note(88), 1.8, 0.6), dn + 0.1, 0.22, pan=0.3)
place(sfx, shimmer(1.0, 2500, 6500, 30), dn, 0.35)
for i, w in enumerate(S['write']):
    place(sfx, scribble(0.35), fr(w), 0.6, pan=-0.3 + 0.2 * i)
    place(sfx, bell(note(86 + [0, 2, 4, 7][i]), 0.8, 0.5), fr(w), 0.16)

# checklist pops + end-card pill
for i, tk in enumerate(S['tick']):
    place(sfx, thunk(620 + i * 120) * 0.6, fr(tk), 0.45)
    place(sfx, bell(note(90 + i * 2), 0.8, 0.5), fr(tk), 0.2)
place(sfx, shimmer(0.8, 2000, 8000, 60), CARD, 0.4)
place(sfx, thunk(700), fr(S['pill']), 0.5)
place(sfx, bell(note(93), 2.5, 0.7), fr(S['pill']), 0.2)

# ── voiceover + ducking ──────────────────────────────────────
vo = bus()
vo_env = np.zeros(N)
for cid, at in C['vo'].items():
    a = load(f'{ROOT}/public/vo/{cid}.wav')
    place(vo, a, fr(at), 1.0)
    i = int(fr(at) * SR)
    vo_env[i : i + len(a)] = 1
vo = reverb(vo, 0.6, 0.05, damp=4500)
k = int(0.15 * SR)
smooth = np.clip(np.convolve(vo_env, np.ones(k) / k, mode='same'), 0, 1)
music *= (1 - 0.72 * smooth)[:, None]
sfx *= (1 - 0.5 * smooth)[:, None]
amb *= (1 - 0.5 * smooth)[:, None]

MG, SG, AG, VG = 0.36, 0.5, 0.38, 1.3
mix = music * MG + sfx * SG + amb * AG + vo * VG
mix = mix[: int(DUR * SR)]
fade = int(0.6 * SR)
mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
mix = np.tanh(mix * 1.05) / np.tanh(1.05)
mix /= np.max(np.abs(mix)) / 0.9
(HERE / 'out').mkdir(exist_ok=True)
sf.write(f'{ROOT}/out/free-consult-audio.wav', mix, SR, subtype='PCM_24')
stems = {'music': music * MG, 'sfx': sfx * SG + amb * AG, 'vo': vo * VG}
for name, b in stems.items():
    np.save(f'{ROOT}/out/stem-{name}.npy', b[: int(DUR * SR)].mean(1).astype(np.float32))

# voice must sit >= 10 dB above music + SFX over 3s from each line start
db = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
bed = (stems['music'] + stems['sfx']).mean(1)
v = stems['vo'].mean(1)
for cid, at in C['vo'].items():
    i = int(fr(at) * SR)
    j = i + min(int(3 * SR), int(C['voLen'][cid] / FPS * SR))
    print(f'{cid}: voice over bed {db(v[i:j]) - db(bed[i:j]):5.1f} dB')
print('wrote soundtrack', round(DUR, 2), 's')
