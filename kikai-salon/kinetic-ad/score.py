"""Original music + SFX score for the Kikai ad v1 cut (857 frames @ 30fps).

120 BPM, so one beat is 15 video frames. The grid starts at t=0, so the drop on
beat 11 lands exactly on the "Meet Kikai" reveal (frame 165) and the stat slams
land on beats 42, 44, 46 and 48.
"""
import numpy as np
import soundfile as sf
from scipy.signal import butter, fftconvolve, resample_poly, sosfilt
from pathlib import Path as _P
HERE = _P(__file__).resolve().parent  # this project folder
TTS_DIR = HERE.parents[1] / 'tools' / 'tts'  # shared Kokoro TTS install


SR = 48000
DUR = 857 / 30
N = int(DUR * SR) + SR  # 1 s spare for tails, trimmed at the end
BEAT = 0.5
SFX_DIR = f'{HERE}/public/sfx'
OUT = f'{HERE}/out/score-v1.wav'
rng = np.random.default_rng(7)


def fr(frame):
    return frame / 30


def t_arr(sec):
    return np.arange(int(sec * SR)) / SR


def place(bus, sig, at, gain=1.0):
    i = int(at * SR)
    if i >= len(bus):
        return
    j = min(len(bus), i + len(sig))
    bus[i:j] += sig[: j - i] * gain


def filt(sig, kind, f):
    sos = butter(2 if kind != 'band' else 2, f, btype=kind, fs=SR, output='sos')
    return sosfilt(sos, sig)


def saw(freq, t):
    """PolyBLEP band-limited sawtooth."""
    dt = freq / SR
    ph = (freq * t) % 1.0
    y = 2 * ph - 1
    m = ph < dt
    x = ph[m] / dt
    y[m] -= x + x - x * x - 1
    m = ph > 1 - dt
    x = (ph[m] - 1) / dt
    y[m] -= x * x + x + x + 1
    return y


def note(n):  # MIDI → Hz
    return 440 * 2 ** ((n - 69) / 12)


# ── instruments ──────────────────────────────────────────────
def kick():
    t = t_arr(0.45)
    f = 45 + 110 * np.exp(-t * 32)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t * 7.5)
    click = filt(rng.standard_normal(len(t)), 'high', 2500) * np.exp(-t * 400) * 0.3
    return np.tanh((body + click) * 1.6)


def clap():
    t = t_arr(0.3)
    n = filt(rng.standard_normal(len(t)), 'band', [900, 3200])
    env = np.zeros_like(t)
    for d in (0, 0.011, 0.022):
        env += np.where(t >= d, np.exp(-(t - d) * 140), 0)
    env += np.where(t >= 0.03, 0.6 * np.exp(-(t - 0.03) * 16), 0)
    return n * env * 0.9


def hat(open_=False):
    t = t_arr(0.22 if open_ else 0.06)
    n = filt(rng.standard_normal(len(t)), 'high', 7500)
    return n * np.exp(-t * (11 if open_ else 70)) * (0.5 if open_ else 0.4)


def bass(freq, length=0.22):
    t = t_arr(length)
    s = saw(freq, t) * 0.6 + np.sin(2 * np.pi * freq * t) * 0.7
    s = filt(s, 'low', 420)
    env = np.minimum(1, t / 0.004) * (0.55 + 0.45 * np.exp(-t * 14)) * np.minimum(1, (length - t) / 0.02)
    return s * env


def supersaw(freqs, length, cutoff, voices=5, detune=0.012):
    t = t_arr(length)
    out = np.zeros_like(t)
    for f in freqs:
        for v in range(voices):
            d = 1 + detune * (v - (voices - 1) / 2) / ((voices - 1) / 2)
            out += saw(f * d, t + rng.random())
    out /= len(freqs) * voices
    return filt(out, 'low', cutoff)


def pluck(freqs, length=0.3):
    s = supersaw(freqs, length, 3200, voices=3)
    t = t_arr(length)
    return s * np.exp(-t * 11) * np.minimum(1, t / 0.003) * 2.2


def impact(big=True):
    t = t_arr(1.6 if big else 0.7)
    f = 38 + 70 * np.exp(-t * 18)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * (3 if big else 6))
    crash = filt(rng.standard_normal(len(t)), 'high', 3000) * np.exp(-t * (3.5 if big else 8)) * 0.35
    return np.tanh((boom + crash) * 1.4)


def riser(length):
    t = t_arr(length)
    n = rng.standard_normal(len(t))
    out = np.zeros_like(t)
    block = int(0.02 * SR)
    for i in range(0, len(t), block):
        c = 300 * (8000 / 300) ** (i / len(t))
        seg = filt(n[max(0, i - 2000) : i + block], 'band', [c * 0.7, min(c * 1.4, 20000)])
        out[i : i + block] = seg[-len(out[i : i + block]) :]
    tone = np.sin(2 * np.pi * np.cumsum(200 * 6 ** (t / length)) / SR) * 0.15
    return (out * 0.8 + tone) * (t / length) ** 2


def buzz():  # phone vibration
    t = t_arr(0.32)
    s = np.sign(np.sin(2 * np.pi * 170 * t)) * 0.4 + np.sin(2 * np.pi * 85 * t)
    gate = (np.sin(2 * np.pi * 26 * t) > -0.2).astype(float)
    return filt(s * gate, 'low', 900) * np.minimum(1, (0.32 - t) / 0.03) * 0.6


def pop(f0=900, f1=520):
    t = t_arr(0.09)
    f = f1 + (f0 - f1) * np.exp(-t * 60)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 45) * 0.7


def tick():
    t = t_arr(0.012)
    return filt(rng.standard_normal(len(t)), 'high', 4000) * np.exp(-t * 500) * 0.35


def glitch():
    t = t_arr(0.4)
    base = np.sign(np.sin(2 * np.pi * 310 * t)) * 0.3 + rng.standard_normal(len(t)) * 0.3
    gate = ((t * 40).astype(int) % 3 != 1).astype(float)
    crushed = np.round(base * 6) / 6
    return filt(crushed * gate, 'band', [400, 6000]) * np.exp(-t * 4)


def load(name):
    a, sr = sf.read(f'{SFX_DIR}/{name}')
    if a.ndim > 1:
        a = a.mean(1)
    return resample_poly(a, SR, sr) if sr != SR else a


def reverb(sig, decay=0.7, mix=0.22):
    t = t_arr(2.0)
    ir = filt(rng.standard_normal(len(t)), 'low', 5000) * np.exp(-t * 6.9 / (decay * 3))
    ir /= np.sqrt(np.sum(ir ** 2))
    wet = fftconvolve(sig, ir)[: len(sig)]
    return sig + wet * mix


# ── music ────────────────────────────────────────────────────
drums = np.zeros(N)
music = np.zeros(N)  # pads, bass, plucks (sidechained)
kick_times = []

DROP = 11 * BEAT  # 5.5 s, frame 165
GONE = fr(137)
GROOVE_END = 50 * BEAT  # "Still booked" (25.0 s)
FINAL_HIT = 52 * BEAT  # CTA button (26.0 s)

# chords: Dm, Bb, F, C (vi–IV–I–V in F)
CHORDS = [
    (50, [62, 65, 69, 72]),  # D: D F A C
    (46, [62, 65, 70, 74]),  # Bb: D F Bb D
    (41, [60, 65, 69, 72]),  # F: C F A C
    (48, [60, 64, 67, 74]),  # C: C E G D
]

# intro: dark pad + ticking hats + sub pulse, cut dead on "gone."
pad = supersaw([note(n) for n in (50, 57, 62, 65)], GONE, 900, voices=5) * 0.9
pad *= np.minimum(1, t_arr(GONE) / 1.2)
place(music, pad, 0)
b = 1
while b * BEAT < GONE - 0.05:
    for s16 in range(4):
        tt = b * BEAT + s16 * BEAT / 4
        if tt < GONE:
            place(drums, hat(), tt, 0.35 if s16 % 2 else 0.6)
    place(music, bass(note(38), 0.3), b * BEAT, 0.55)
    b += 1
place(drums, riser(DROP - GONE - 0.02), GONE + 0.02, 0.55)

# groove from the drop
bar = 0
t0 = DROP
while t0 < GROOVE_END:
    root, voicing = CHORDS[bar % 4]
    bar_len = min(4 * BEAT, GROOVE_END - t0)
    place(music, supersaw([note(n) for n in voicing], bar_len, 2400) * 0.55, t0)
    for beat in range(4):
        bt = t0 + beat * BEAT
        if bt >= GROOVE_END:
            break
        place(drums, kick(), bt, 1.0)
        kick_times.append(bt)
        if beat in (1, 3):
            place(drums, clap(), bt, 0.75)
        place(drums, hat(open_=True), bt + BEAT / 2, 0.5)
        place(drums, hat(), bt + BEAT / 4, 0.25)
        place(drums, hat(), bt + 3 * BEAT / 4, 0.25)
        place(music, bass(note(root - 12)), bt + BEAT / 2, 0.9)
        if beat in (1, 3):
            place(music, pluck([note(n + 12) for n in voicing[1:]]), bt + 3 * BEAT / 4, 0.5)
    t0 += 4 * BEAT
    bar += 1

# snare-roll build into the stat slams (awkward → stats flash at frame 627)
roll_start, roll_end = 38 * BEAT, 42 * BEAT
steps = 16
for k in range(steps):
    pos = roll_start + (roll_end - roll_start) * (1 - (1 - k / steps) ** 1.6)
    place(drums, clap(), pos, 0.2 + 0.5 * k / steps)
place(drums, riser(roll_end - roll_start), roll_start, 0.35)

# ending: stab on "Still booked", final chord hit with the button
place(music, pluck([note(n + 12) for n in CHORDS[2][1]], 0.5), GROOVE_END, 0.9)
place(drums, kick(), GROOVE_END, 1.0)
end_len = DUR + 0.5 - FINAL_HIT
final = supersaw([note(n) for n in (53, 60, 65, 69, 72)], end_len, 2800) * np.exp(-t_arr(end_len) * 1.1) * 0.9
place(music, final, FINAL_HIT)
place(drums, impact(big=True), FINAL_HIT, 0.6)

# sidechain pump on the tonal bus
duck = np.ones(N)
t1 = np.arange(N) / SR
for kt in kick_times:
    i = int(kt * SR)
    j = min(N, i + int(0.35 * SR))
    tt = t1[i:j] - kt
    duck[i:j] = np.minimum(duck[i:j], 1 - 0.65 * np.exp(-tt * 9))
music *= duck

# sit the music back under the call demo (frames 221–443) so the SFX read
auto = np.ones(N)
a, b2 = int(fr(221) * SR), int(fr(443) * SR)
ramp = int(0.25 * SR)
auto[a:b2] = 0.6
auto[a : a + ramp] = np.linspace(1, 0.6, ramp)
auto[b2 - ramp : b2] = np.linspace(0.6, 1, ramp)

music_bus = reverb(music, mix=0.25) * 0.8 + drums * 0.75
music_bus *= auto

# ── SFX ──────────────────────────────────────────────────────
sfx = np.zeros(N)
ring = load('ring.wav')[: int(fr(70) * SR)]
ring *= np.minimum(1, (len(ring) - np.arange(len(ring))) / (0.08 * SR))
place(sfx, ring, 0, 0.45)
place(sfx, load('thud.wav'), fr(44), 0.9)  # "rings." zoom punch

for f in (71, 82, 93, 104):  # missed-call notifications
    place(sfx, buzz(), fr(f), 0.55)
place(sfx, load('whoosh.wav'), fr(122), 0.3)  # text slam
place(sfx, impact(big=True), GONE, 0.9)  # "gone."
place(sfx, glitch(), fr(143), 0.45)

whoosh = load('whoosh.wav')
for f in (157, 219, 431, 499, 735):  # whip, zoom, whip, slam, zoom
    place(sfx, whoosh, fr(f), 0.6)
place(sfx, impact(big=False), DROP, 0.6)

# call demo (scene starts at 221)
for f in (243, 317, 381):  # caller bubbles
    place(sfx, pop(700, 420), fr(f), 0.6)
for f, chars in ((271, 58), (335, 55)):  # Kikai bubbles + typing
    place(sfx, pop(1100, 700), fr(f), 0.6)
    frames = int(np.ceil(chars / 1.7))
    k = 0.0
    while k < frames:
        place(sfx, tick(), fr(f + 2 + k), 0.5 + 0.3 * rng.random())
        k += 1.4 + rng.random() * 1.2
place(sfx, load('chime.wav'), fr(399), 0.75)  # Booked

place(sfx, pop(600, 300), fr(449), 0.5)  # diary block drops in
place(sfx, load('thud.wav'), fr(455), 0.7)

place(sfx, load('thud.wav'), fr(509), 0.8)  # slam lands
for f in (545, 589):
    place(sfx, load('thud.wav'), fr(f), 0.6)
for f in (515, 559, 603):  # answer pills
    place(sfx, pop(1000, 750), fr(f), 0.45)

for k in range(4):  # stat slams, on beats 42, 44, 46, 48
    place(sfx, impact(big=False), (42 + 2 * k) * BEAT, 0.65)

place(sfx, load('chime.wav'), FINAL_HIT + 0.03, 0.6)  # Get Kikai button

# ── master ───────────────────────────────────────────────────
mix = music_bus * 0.5 + sfx * 0.85
mix = np.tanh(mix * 1.2) / np.tanh(1.2)
mix = mix[: int(DUR * SR)]
fade = int(0.6 * SR)
mix[-fade:] *= np.linspace(1, 0, fade)
mix /= np.max(np.abs(mix)) / 0.89
stereo = np.stack([mix, mix], axis=1)
sf.write(OUT, stereo, SR, subtype='PCM_24')
print('wrote', OUT, round(len(mix) / SR, 3), 's')
