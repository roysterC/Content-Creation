"""Chiptune soundtrack for "Salon Simulator": square/triangle/noise voices only,
on the shared timeline in salon-simulator/src/cues.json.

Bad -> good switch:
  0 .. gameOver   tense 8-bit bed (A minor, triangle bass + quiet pulse arps) with
                  HUD clock ticks on the 120 BPM grid, louder than the bed;
                  8-bit phone ring, cut dead on every miss; a fail glide per miss and
                  one coin-counter bleep per £5 step of the LOST counter
  gameOver        descending game-over jingle, music stops; glitch on "Not quite"
  switch          power-up arpeggio on the beat, then 8-bit house (D major arps,
                  kick, hats, triangle bass); coin per booking, rising each time
  drop            treasure fanfare + full groove with lead, on "A free consultation"
  card            groove thins, button press on "Comment free", final chord
"""
import json

import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt
from pathlib import Path as _P
HERE = _P(__file__).resolve().parent  # this project folder

SR = 48000
ROOT = f'{HERE}'
C = json.load(open(f'{ROOT}/src/cues.json'))
K = C['cue']
FPS = C['fps']
DUR = C['total'] / FPS
N = int((DUR + 1.0) * SR)
rng = np.random.default_rng(3)

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
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    b[i:j, 0] += s * l * 1.414
    b[i:j, 1] += s * r * 1.414


def filt(sig, kind, f, order=2):
    return sosfilt(butter(order, f, btype=kind, fs=SR, output='sos'), sig, axis=0)


def env(n, a=0.002, d=0.08, s=0.6, r=0.03):
    """Simple ADSR over n samples (sustain until the release tail)."""
    t = np.arange(n) / SR
    L = n / SR
    e = np.where(t < a, t / max(a, 1e-4), s + (1 - s) * np.exp(-(t - a) / max(d, 1e-4)))
    return e * np.clip((L - t) / max(r, 1e-4), 0, 1)


# ── chip voices ──────────────────────────────────────────────
def sq(freq, dur, duty=0.5, **e):
    t = t_(dur)
    f = np.broadcast_to(freq, t.shape) if np.ndim(freq) else np.full(t.shape, freq)
    ph = np.cumsum(f) / SR
    return np.where((ph % 1) < duty, 1.0, -1.0) * env(len(t), **e)


def tri(freq, dur, **e):
    t = t_(dur)
    ph = (freq * t) % 1
    return (4 * np.abs(ph - 0.5) - 1) * env(len(t), **e)


def nz(dur, rate=12000, **e):
    """Sample-and-hold noise: the crunchy NES noise channel."""
    n = int(dur * SR)
    hold = max(1, int(SR / rate))
    v = np.repeat(rng.uniform(-1, 1, n // hold + 1), hold)[:n]
    return v * env(n, **e)


def blip(freq, dur=0.03, duty=0.5):
    return sq(freq, dur, duty, a=0.001, d=0.01, s=0.5, r=0.005)


def kick():
    t = t_(0.22)
    f = 50 + 140 * np.exp(-t * 35)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 14)


def hat(open_=False):
    return nz(0.12 if open_ else 0.035, 20000, a=0.0005, d=0.03 if open_ else 0.008, s=0.0, r=0.01)


def snare():
    out = nz(0.16, 9000, a=0.0005, d=0.05, s=0.0, r=0.02) * 0.8
    body = sq(190, 0.06, 0.5, a=0.0005, d=0.02, s=0, r=0.01) * 0.3
    out[: len(body)] += body
    return out


def coin(step=0):
    k = 2 ** (step / 12)
    return np.concatenate([sq(note(83) * k, 0.07, 0.5, d=1, s=1, r=0.005), sq(note(88) * k, 0.3, 0.5, d=0.12, s=0.3, r=0.05)])


def arp(notes, each, duty=0.25, dur_each=None):
    return np.concatenate([sq(note(m), dur_each or each, duty, d=0.05, s=0.5, r=0.01) for m in notes])


# ── timeline ─────────────────────────────────────────────────
G0 = fr(K['grid0'])
BEAT = 0.5
BAR = 2.0
SW, DROP, CARD = fr(K['switch']), fr(K['drop']), fr(K['card'])
GOV, NQ = fr(K['gameOver']), fr(K['notQuite'])

music = bus()
sfx = bus()

# ── 1. tense half ────────────────────────────────────────────
TENSE = [(45, [57, 60, 64]), (45, [57, 60, 64]), (41, [53, 57, 60]), (43, [55, 59, 62])]  # Am Am F G
b = 0
while True:
    t0 = G0 - BAR * (100 - b)  # walk the grid back from grid0 to before frame 0
    b += 1
    if t0 + BAR <= 0:
        continue
    if t0 >= GOV:
        break
    root, ch = TENSE[b % 4]
    for k in range(2):  # triangle bass, half notes
        at = t0 + k * BAR / 2
        if 0 <= at < GOV:
            place(music, tri(note(root), min(BAR / 2 - 0.02, GOV - at)), at, 0.32)
    for k in range(8):  # quiet pulse arpeggio, eighths
        at = t0 + k * BEAT / 2
        if 0 <= at < GOV:
            place(music, filt(sq(note(ch[k % 3] + 12), 0.2, 0.125, d=0.06, s=0.2, r=0.02), 'low', 3000), at, 0.07, pan=0.3)
# HUD clock ticks, on the beat, louder than the bed
k = 0
while G0 - k * BEAT > 0:
    k += 1
for i in range(-k, 400):
    at = G0 + i * BEAT
    if 0 <= at < GOV:
        place(sfx, blip(2400, 0.012, 0.5), at, 0.16 if i % 2 == 0 else 0.1, pan=0.4)

# 8-bit phone ring: trill in a UK double-ring cadence, cut dead at the end of each ring
def ring(dur):
    t = t_(dur)
    trill = np.where((t * 25) % 1 < 0.5, note(88), note(91))
    cad = t % 3.0
    on = ((cad < 0.4) | ((cad >= 0.6) & (cad < 1.0))).astype(float)
    return sq(trill, dur, 0.5, a=0.001, d=1, s=1, r=0.004) * on


pre_rings = [[0, K['miss'][0]], [K['miss'][0] + 10, K['miss'][1]], [K['miss'][1] + 6, K['miss'][2]], [K['miss'][2] + 4, K['miss'][3]]]
for a, z in pre_rings:
    place(sfx, filt(ring(fr(z - a)), 'low', 5000), fr(a), 0.1, pan=0.3)
for a in K['answer']:
    place(sfx, filt(ring(fr(16)), 'low', 5000), fr(a - 16), 0.08, pan=0.3)

# each miss: fail glide + one bleep per £5 step of the LOST counter (frame-synced)
for i, m in enumerate(K['miss']):
    gl = np.linspace(note(72 - i), note(48 - i), int(0.28 * SR))
    place(sfx, sq(gl, 0.28, 0.5, d=0.2, s=0.6, r=0.05), fr(m), 0.13, pan=-0.1)
    for s in range(9):
        place(sfx, blip(1600 + s * 60, 0.02), fr(m + 2 * s), 0.07, pan=-0.4)

# game over jingle (the bed has already stopped)
for j, (m, d) in enumerate([(76, 0.14), (75, 0.14), (74, 0.14), (73, 0.5)]):
    place(music, sq(note(m), d, 0.5, d=0.1, s=0.5, r=0.03), GOV + 0.1 + j * 0.15, 0.14)
place(music, tri(note(37), 0.9, d=0.4, s=0.3, r=0.2), GOV + 0.55, 0.3)
# "Not quite": glitch
place(sfx, nz(0.18, 3000, a=0.001, d=0.1, s=0.4, r=0.03), NQ, 0.18)
place(sfx, sq(np.linspace(300, 2400, int(0.16 * SR)), 0.16, 0.125, d=1, s=1, r=0.01), NQ + 0.02, 0.07)
# power-up falling in: rising whistle
fall = fr(K['notQuite'] + 6)
place(sfx, sq(np.geomspace(500, 1800, int((SW - fall) * SR)), SW - fall, 0.25, a=0.05, d=1, s=1, r=0.02), fall, 0.05, pan=0.2)

# ── 2. power up: 8-bit house ─────────────────────────────────
place(sfx, arp([60, 64, 67, 72, 76, 79, 84, 88], 0.045, 0.5), SW, 0.12)
place(sfx, arp([72, 76, 79, 84], 0.06, 0.25), fr(K['unlock']), 0.1)  # item get: "Kikai"

PROG = [(38, [62, 66, 69, 73]), (35, [59, 62, 66, 69]), (31, [55, 59, 62, 66]), (33, [57, 61, 64, 69])]  # Dmaj7 Bm7 Gmaj7 A
LEAD = [81, None, 78, 81, 83, None, 81, 78, 76, None, 74, 76, 78, None, None, None]  # two-bar hook, eighths
nbars = int((DUR + 0.5 - G0) / BAR) + 1
for b in range(nbars):
    t0 = G0 + b * BAR
    pre = t0 < DROP - 1e-6
    lastpre = pre and t0 + BAR > DROP - 1e-6
    late = t0 >= CARD - 1e-6
    root, ch = PROG[b % 4]
    for s in range(16):  # sixteenth-note arpeggio, the chiptune signature
        at = t0 + s * BEAT / 4
        if at < SW - 1e-6 or at >= DUR:
            continue
        m = ch[s % 4] + (12 if (s // 4) % 2 else 0)
        place(music, filt(sq(note(m), 0.11, 0.25, d=0.04, s=0.3, r=0.01), 'low', 2500 if pre else 5000), at, 0.06 if pre else 0.075, pan=-0.3)
    for beat in range(4):
        at = t0 + beat * BEAT
        if at < SW - 1e-6 or at >= DUR:
            continue
        gap = lastpre and beat >= 2
        if not gap:
            place(music, kick(), at, 0.5 if pre else 0.7)
            place(music, hat(open_=not pre), at + BEAT / 2, 0.08 if pre else 0.1, pan=0.3)
        if not pre and not late and beat in (1, 3):
            place(music, snare(), at, 0.22)
        if not pre or b % 2:
            place(music, tri(note(root), BEAT / 2 - 0.03, d=1, s=1, r=0.01), at + BEAT / 2, 0.3 if not late else 0.2)
    if not pre and not late:  # lead hook after the drop
        for s, m in enumerate(LEAD if b % 2 == 0 else LEAD[::-1]):
            if m:
                place(music, filt(sq(note(m), 0.22, 0.5, d=0.1, s=0.5, r=0.03), 'low', 4500), t0 + s * BEAT / 2, 0.06, pan=0.15)

# snare roll + riser through the bar before the drop
rs = DROP - BAR
for i in range(24):
    at = rs + BAR * (1 - (1 - i / 24) ** 1.6)
    place(music, snare(), at, 0.04 + 0.08 * i / 24)
place(music, sq(np.geomspace(200, 1600, int(BAR * SR)), BAR, 0.125, a=BAR * 0.9, d=1, s=1, r=0.01), rs, 0.035)

# drop: treasure fanfare + crash
fan = [(72, 0.1), (76, 0.1), (79, 0.1), (84, 0.6)]
tt = DROP
for m, d in fan:
    place(sfx, sq(note(m), d, 0.5, d=0.15, s=0.6, r=0.05), tt, 0.1)
    place(sfx, sq(note(m - 12), d, 0.25, d=0.15, s=0.6, r=0.05), tt, 0.06)
    tt += d
place(sfx, nz(1.4, 16000, a=0.001, d=0.5, s=0.0, r=0.2), DROP, 0.1)
place(sfx, kick(), DROP, 0.5)

# ── 3. events over the house ─────────────────────────────────
for i, a in enumerate(K['answer']):
    place(sfx, coin(i * 2), fr(a), 0.11, pan=0.1)
# after hours: descending twinkle
for j, m in enumerate([88, 84, 81, 76]):
    place(sfx, tri(note(m), 0.18, d=0.1, s=0.3, r=0.05), fr(K['nightIn']) + j * 0.09, 0.14, pan=-0.3)
# reward list: item-get blips
for i, it in enumerate(K['items']):
    place(sfx, arp([79 + i * 2, 83 + i * 2, 86 + i * 2], 0.05, 0.5), fr(it), 0.09)
# end screen: button press, final chord
place(sfx, blip(900, 0.04), fr(K['claim']), 0.18)
place(sfx, arp([74, 78, 81, 86], 0.05, 0.5), fr(K['claim']) + 0.05, 0.1)
tail = DUR - CARD
for m in (50, 62, 66, 69):
    place(music, (tri if m < 55 else sq)(note(m), min(tail, 3.5), **({} if m < 55 else {'duty': 0.25}), d=0.8, s=0.25, r=0.4), CARD, 0.18 if m < 55 else 0.035)

# ── voiceover + ducking ──────────────────────────────────────
def load(path):
    a, sr = sf.read(path)
    if a.ndim > 1:
        a = a.mean(1)
    if sr != SR:
        from scipy.signal import resample_poly
        a = resample_poly(a, SR, sr)
    return a


vo = bus()
vo_env = np.zeros(N)
for cid, at in C['vo'].items():
    a = load(f'{ROOT}/public/vo/{cid}.wav')
    place(vo, a, fr(at), 1.0)
    i = int(fr(at) * SR)
    vo_env[i : i + len(a)] = 1
k = int(0.15 * SR)
smooth = np.clip(np.convolve(vo_env, np.ones(k) / k, mode='same'), 0, 1)
music *= (1 - 0.72 * smooth)[:, None]
sfx *= (1 - 0.5 * smooth)[:, None]

# soften the square edges a touch (still chiptune, less fatiguing on phone speakers)
music = filt(music, 'low', 9000)
sfx = filt(sfx, 'low', 9000)

MG, SG, VG = 0.5, 0.5, 1.3
mix = music * MG + sfx * SG + vo * VG
mix = mix[: int(DUR * SR)]
fade = int(0.6 * SR)
mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
mix = np.tanh(mix * 1.05) / np.tanh(1.05)
mix /= np.max(np.abs(mix)) / 0.9
(HERE / 'out').mkdir(exist_ok=True)
sf.write(f'{ROOT}/out/salon-sim-audio.wav', mix, SR, subtype='PCM_24')
stems = {'music': music * MG, 'sfx': sfx * SG, 'vo': vo * VG}
for name, s in stems.items():
    np.save(f'{ROOT}/out/stem-{name}.npy', s[: int(DUR * SR)].mean(1).astype(np.float32))

# voice must sit >= 10 dB above music + SFX over 3s from each line start
db = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
bed = (stems['music'] + stems['sfx']).mean(1)
v = stems['vo'].mean(1)
for cid, at in C['vo'].items():
    i = int(fr(at) * SR)
    j = i + min(int(3 * SR), int(C['voLen'][cid] / FPS * SR))
    print(f'{cid}: voice over bed {db(v[i:j]) - db(bed[i:j]):5.1f} dB')
print('wrote soundtrack', round(DUR, 2), 's')
