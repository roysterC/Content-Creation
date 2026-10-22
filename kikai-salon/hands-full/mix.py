"""Full soundtrack for "Hands Full": original music, salon sound design and the
voiceover, on the shared timeline in hands-full/src/cues.json.

Music: D major, 81.8 BPM so that bar 9 lands exactly on the end card.
  bars 0-1  plucked guitar over the busy salon
  bar 2     soft swell as the amber light appears
  bars 2-5  guitar + pad + piano, ducked under the phone call
  bars 6-7  piano alone, intimate (after hours)
  bar 7.5-8 everything back in, warmest point (morning)
  bar 9     one warm D major chord, held to the end
"""
import glob
import json

import numpy as np
import soundfile as sf
from scipy.signal import butter, fftconvolve, resample_poly, sosfilt
from pathlib import Path as _P
HERE = _P(__file__).resolve().parent  # this project folder
TTS_DIR = HERE.parents[1] / 'tools' / 'tts'  # shared Kokoro TTS install


SR = 48000
ROOT = f'{HERE}'
C = json.load(open(f'{ROOT}/src/cues.json'))
FPS = C['fps']
DUR = C['total'] / FPS
N = int((DUR + 1.0) * SR)
rng = np.random.default_rng(11)

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
def pluck(freq, length=2.2, bright=0.5, decay=0.996):
    """Karplus-Strong, vectorised one period at a time."""
    n = int(length * SR)
    P = max(2, int(SR / freq))
    y = np.zeros(n + P + 1)
    burst = rng.uniform(-1, 1, P)
    burst = filt(burst, 'low', 1500 + bright * 6000)
    y[1 : P + 1] = burst
    k = P + 1
    while k < len(y):
        e = min(len(y), k + P)
        y[k:e] = decay * 0.5 * (y[k - P : e - P] + y[k - P - 1 : e - P - 1])
        k = e
    out = y[1 : n + 1]
    out = filt(out, 'high', 70)
    fade = int(0.05 * SR)
    out[-fade:] *= np.linspace(1, 0, fade)
    return out / (np.max(np.abs(out)) + 1e-9)


def piano(freq, length=3.0, vel=1.0):
    t = t_(length)
    out = np.zeros_like(t)
    B = 0.0004
    for h in range(1, 9):
        fh = freq * h * np.sqrt(1 + B * h * h)
        if fh > 12000:
            break
        amp = (1 / h ** 1.15) * (0.6 + 0.4 * vel)
        dec = 2.6 / (1 + 0.35 * h) * (220 / max(freq, 110)) ** 0.25
        out += amp * np.sin(2 * np.pi * fh * t + rng.random()) * np.exp(-t / dec)
    ham = filt(rng.standard_normal(len(t)), 'band', [800, 4000]) * np.exp(-t * 90) * 0.05
    out = (out + ham) * np.minimum(1, t / 0.004)
    rel = int(0.15 * SR)
    out[-rel:] *= np.linspace(1, 0, rel)
    return out * 0.5


def pad(freqs, length, cutoff=1400, attack=1.2):
    t = t_(length)
    out = np.zeros_like(t)
    for f in freqs:
        for d in (-0.006, 0, 0.007):
            ph = 2 * np.pi * f * (1 + d) * t + rng.random() * 6
            out += np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.15 * np.sin(3 * ph)
    out = filt(out / (len(freqs) * 3), 'low', cutoff)
    e = np.minimum(1, t / attack) * np.minimum(1, (length - t) / 0.8)
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
        f = rng.uniform(f_lo, f_hi)
        tt = t_(0.3)
        g = np.sin(2 * np.pi * f * tt) * np.exp(-tt * 18) * rng.uniform(0.2, 0.6)
        i = int(at * SR)
        out[i : i + len(g)] += g
    return out * np.sin(np.pi * np.arange(len(out)) / len(out)) * 0.25


# ── music ────────────────────────────────────────────────────
BAR = fr(C['sfx']['card']) / 9
BEAT = BAR / 4
music = bus()
# chord tones (MIDI): bass, arpeggio voicing
CH = {
    'D': (38, [50, 57, 62, 66, 69]),
    'A/C#': (37, [49, 57, 61, 64, 69]),
    'Bm': (35, [47, 54, 59, 62, 66]),
    'G': (31, [43, 50, 55, 59, 62]),
    'Em': (28, [40, 47, 52, 55, 59]),
    'A': (33, [45, 52, 57, 61, 64]),
}
PROG = ['D', 'A/C#', 'Bm', 'G', 'D', 'A/C#', 'Bm', 'G', 'Em']
ARP = [0, 2, 3, 4, 3, 2, 1, 2]  # eighth-note pattern indices

for bar, name in enumerate(PROG):
    bass, v = CH[name]
    t0 = bar * BAR
    night = bar in (6, 7)
    morning = bar == 8
    # guitar arpeggio
    if not night:
        g = 0.6 if bar < 2 else 0.26 if bar < 6 else 0.42
        for k, idx in enumerate(ARP):
            at = t0 + k * BEAT / 2
            place(music, pluck(note(v[idx]), 2.0, bright=0.45), at, g * (1.0 if k % 2 == 0 else 0.8), pan=0.35)
    if bar == 7:  # guitar creeps back in for the morning
        for k, idx in enumerate(ARP[4:]):
            place(music, pluck(note(v[idx]), 2.0, bright=0.4), t0 + BAR / 2 + k * BEAT / 2, 0.14 + 0.05 * k, pan=0.35)
    # piano
    if bar >= 2:
        if night:
            for k, idx in enumerate([0, 2, 4, 3]):
                place(music, piano(note(v[idx] + 12), 3.2, 0.6), t0 + k * BEAT, 0.5, pan=-0.2)
        else:
            place(music, piano(note(v[0] + 12), 3.0, 0.7), t0, 0.42, pan=-0.2)
            place(music, piano(note(v[2] + 12), 2.6, 0.6), t0 + BEAT * 1.5, 0.3, pan=-0.2)
            if morning:
                for k, m in enumerate([78, 76, 74, 71, 74, 76]):
                    place(music, piano(note(m), 2.0, 0.9), t0 + k * BEAT * 0.66, 0.34, pan=-0.1)
    # pad
    if bar >= 2:
        place(music, pad([note(x) for x in v[1:4]], BAR + 0.9, cutoff=1100 if night else 1500), t0 - 0.2, 0.2 if night else 0.26)
    # bass
    if bar >= 2 and not night:
        for k in range(2):
            place(music, pad([note(bass + 12)], BEAT * 2, cutoff=500, attack=0.04), t0 + k * BEAT * 2, 0.28)
    # soft shaker in the morning
    if morning:
        for k in range(8):
            s = filt(rng.standard_normal(int(0.12 * SR)), 'band', [5000, 11000]) * env_ar(int(0.12 * SR), 0.02, 0.035)
            place(music, s, t0 + k * BEAT / 2, 0.06 if k % 2 else 0.1, pan=0.2)

# swell when the light appears (bar 2)
place(music, pad([note(x) for x in (62, 66, 69, 74)], 3.2, cutoff=2200, attack=1.4), fr(C['sfx']['glow']) - 0.1, 0.12)

# final chord: D major, held
END = fr(C['sfx']['card'])
tail = DUR - END + 0.6
for m, g in ((38, 0.5), (50, 0.4), (57, 0.32), (62, 0.3), (66, 0.26), (69, 0.22), (74, 0.16)):
    place(music, piano(note(m + 12 if m < 45 else m), min(tail, 6.0), 0.8), END, g * 0.9, pan=-0.2)
for k, m in enumerate([50, 57, 62, 66, 69, 74]):
    place(music, pluck(note(m), min(tail, 4), bright=0.5, decay=0.998), END + k * 0.028, 0.28, pan=0.35)
place(music, pad([note(x) for x in (50, 57, 62, 66)], tail, cutoff=1600, attack=0.4), END, 0.55)
music = reverb(music, 2.6, 0.32)

# ── sound design ─────────────────────────────────────────────
amb = bus()
sfx = bus()
S = C['sfx']
busy_end = fr(C['scenes']['afterHours']['start'] + 40)

# hairdryers (two, panned), salon room tone, scissors
L = int(busy_end * SR)
for pan, f_motor, seed in ((-0.6, 172, 1), (0.7, 191, 2)):
    t = np.arange(L) / SR
    wob = 1 + 0.15 * np.sin(2 * np.pi * (0.3 + seed * 0.11) * t)
    n = filt(rng.standard_normal(L), 'band', [700, 5200]) * wob
    motor = np.sign(np.sin(2 * np.pi * f_motor * t)) * 0.05
    place(amb, (n * 0.16 + filt(motor, 'low', 900)) * np.minimum(1, t / 0.3), 0, 0.5, pan=pan)
room = filt(rng.standard_normal(L), 'low', 400) * 0.05
place(amb, room, 0, 1.0)
for burst in np.arange(0.3, busy_end - 1, 1.7):
    for k in range(int(rng.integers(3, 6))):
        at = burst + k * rng.uniform(0.11, 0.16)
        s = filt(rng.standard_normal(int(0.03 * SR)), 'band', [3500, 9000]) * env_ar(int(0.03 * SR), 0.001, 0.006)
        ring = np.sin(2 * np.pi * 6200 * t_(0.04)) * env_ar(int(0.04 * SR), 0.001, 0.01) * 0.3
        place(amb, np.concatenate([s, np.zeros(len(ring) - len(s))]) + ring, at, 0.35, pan=0.45)

# murmur: chatter lines, filtered + reverbed, never intelligible
chat = bus()
files = sorted(glob.glob(f'{ROOT}/audio/chatter/*.wav'))
for stream, pan in ((0, -0.5), (1, 0.4), (2, 0.0)):
    t = 0.2 + stream * 0.7
    k = stream
    while t < busy_end:
        a = load(files[k % len(files)])
        place(chat, filt(a, 'band', [250, 2400]), t, 0.5, pan=pan)
        t += len(a) / SR + rng.uniform(0.3, 1.2)
        k += 3
chat = reverb(chat, 1.6, 0.6, damp=3000)
amb += chat * 0.7

# ambience level: busy, then hushed when the light appears, gone in the time-lapse
lvl = np.ones(N)
tt = np.arange(N) / SR
g0 = fr(S['glow'])
lvl *= np.interp(tt, [0, g0, g0 + 0.6, fr(C['scenes']['answers']['start'] + 120), busy_end - 1.2, busy_end], [1, 1, 0.32, 0.25, 0.18, 0])
amb *= lvl[:, None]

# UK phone ring (cut dead mid-ring when Kikai answers)
ring_len = g0 - fr(S['ringStart'])
t = t_(ring_len)
cad = (t % 3.0)
on = ((cad < 0.4) | ((cad >= 0.6) & (cad < 1.0))).astype(float)
on = filt(on, 'low', 60)
tone = (np.sin(2 * np.pi * 400 * t) + np.sin(2 * np.pi * 450 * t)) * on
tone = filt(np.tanh(tone * 1.5), 'band', [300, 3500])
tone[-int(0.004 * SR):] *= np.linspace(1, 0, int(0.004 * SR))
place(sfx, tone, fr(S['ringStart']), 0.2, pan=0.3)

# the light: chime + shimmer
place(sfx, bell(note(86), 3.0), g0, 0.5, pan=0.2)
place(sfx, bell(note(81), 2.5), g0 + 0.12, 0.35, pan=-0.1)
place(sfx, shimmer(2.5), g0, 0.5)
sc = C['scenes']['answers']['start']
place(sfx, shimmer(2.2, 2500, 7000), fr(sc), 0.55)  # ribbon across the desk

# pen in amber (diary writing)
def scribble(length):
    n = int(length * SR)
    t = np.arange(n) / SR
    am = 0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 7 * t + np.sin(2 * np.pi * 2.3 * t)))
    return filt(rng.standard_normal(n), 'band', [1800, 6000]) * am * np.minimum(1, (length - t) / 0.05) * 0.18


place(sfx, scribble(0.9), fr(S['write1']), 0.6, pan=-0.2)
place(sfx, shimmer(1.0, 3000, 7000, 30), fr(S['write1']), 0.4)
place(sfx, scribble(0.7), fr(S['write2']), 0.6, pan=0.2)
place(sfx, shimmer(0.8, 3000, 7000, 30), fr(S['write2']), 0.4)

# after hours: lock click, door, rain, notification chimes
lock = fr(S['lockUp'])
for d in (0, 0.07):
    c = filt(rng.standard_normal(int(0.02 * SR)), 'band', [1500, 7000]) * env_ar(int(0.02 * SR), 0.0005, 0.004)
    place(sfx, c, lock + d, 0.5, pan=-0.6)
place(sfx, filt(rng.standard_normal(int(0.25 * SR)), 'low', 200) * env_ar(int(0.25 * SR), 0.002, 0.05), lock - 0.25, 0.6, pan=-0.6)
rain_start = fr(C['scenes']['afterHours']['start'] + 56)
rain_end = fr(C['scenes']['morning']['start'] + 10)
rl = rain_end - rain_start
rn = filt(rng.standard_normal(int(rl * SR)), 'band', [400, 7000]) * 0.08
drops = np.zeros(int(rl * SR))
for _ in range(int(rl * 60)):
    i = int(rng.uniform(0, rl - 0.01) * SR)
    d = filt(rng.standard_normal(int(0.008 * SR)), 'high', 2500) * env_ar(int(0.008 * SR), 0.0003, 0.002)
    drops[i : i + len(d)] += d * rng.uniform(0.1, 0.5)
r = (rn + drops * 0.3) * np.clip(np.minimum(np.arange(len(rn)) / (1.2 * SR), (len(rn) - np.arange(len(rn))) / (0.6 * SR)), 0, 1)
place(sfx, r, rain_start, 0.33, pan=-0.3)
place(sfx, r[::-1].copy(), rain_start, 0.22, pan=0.4)
for k, g in enumerate(S['nightGlows']):
    place(sfx, bell(note(81 + k * 2), 2.0, 0.6), fr(g), 0.32, pan=0.3)
    place(sfx, bell(note(86 + k * 2), 1.8, 0.6), fr(g) + 0.1, 0.22, pan=0.3)
    place(sfx, shimmer(1.0, 2500, 6500, 30), fr(g), 0.35)

# morning: shop door bell, birds, cup down, entries filling
db = fr(S['doorBell'])
for k in range(7):
    place(sfx, bell(rng.uniform(2300, 3100), 0.9, 1.2), db + k * rng.uniform(0.045, 0.07), 0.16 * (1 - k * 0.1), pan=-0.5)
for _ in range(6):
    at = db + rng.uniform(0, 2.8)
    tt2 = t_(0.12)
    f = np.linspace(rng.uniform(3500, 4500), rng.uniform(5000, 6500), len(tt2))
    chirp = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt2 / 0.12) * 0.06
    place(sfx, chirp, at, 1.0, pan=rng.uniform(-0.8, -0.2))
cup = fr(S['cupDown'])
place(sfx, filt(rng.standard_normal(int(0.12 * SR)), 'low', 600) * env_ar(int(0.12 * SR), 0.001, 0.025), cup, 0.8)
place(sfx, filt(rng.standard_normal(int(0.03 * SR)), 'band', [1500, 4000]) * env_ar(int(0.03 * SR), 0.0005, 0.006), cup + 0.004, 0.3)
place(sfx, shimmer(1.8, 2500, 7000, 45), fr(S['overhead']), 0.45)

# end: orb gathers, final chime
place(sfx, shimmer(0.8, 2000, 8000, 60) * np.linspace(0.2, 1, int(0.8 * SR)), fr(S['orb']), 0.5)
place(sfx, bell(note(86), 4.0), END, 0.45)
place(sfx, bell(note(93), 3.0, 0.6), END + 0.15, 0.25)

# ── voiceover ────────────────────────────────────────────────
vo = bus()
vo_env = np.zeros(N)
for cid, at in C['vo'].items():
    a = load(f'{ROOT}/public/vo/{cid}.wav')
    if cid == 'c1':  # caller sounds like she's on a phone, lightly
        a = filt(a, 'band', [250, 5000]) * 1.25
    place(vo, a, fr(at), 1.0, pan=0.0)
    i = int(fr(at) * SR)
    vo_env[i : i + len(a)] = 1
vo = reverb(vo, 0.8, 0.08, damp=4000)
k = int(0.12 * SR)
smooth = np.convolve(vo_env, np.ones(k) / k, mode='same')
duck = 1 - 0.55 * np.clip(smooth, 0, 1)
music *= duck[:, None]
amb *= (1 - 0.4 * np.clip(smooth, 0, 1))[:, None]

mix = music * 0.56 + amb * 0.45 + sfx * 0.8 + vo * 1.25
mix = mix[: int(DUR * SR)]
fade = int(0.5 * SR)
mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
mix /= np.max(np.abs(mix)) / 0.9
sf.write(f'{ROOT}/out/soundtrack.wav', mix, SR, subtype='PCM_24')
for name, b in (('music', music * 0.56), ('vo', vo * 1.25), ('amb', amb * 0.45), ('sfx', sfx * 0.8)):
    np.save(f'{ROOT}/out/stem-{name}.npy', b[: int(DUR * SR)].mean(1).astype(np.float32))
print('bar', round(BAR, 3), 's; wrote soundtrack', round(DUR, 2), 's')
