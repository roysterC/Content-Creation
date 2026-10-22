"""Procedural photo-style textures for the hook storyboards: oak desk top,
paper, and a brushed-metal strip. Written to hooks/public/."""
import numpy as np
from PIL import Image, ImageFilter
from pathlib import Path as _P
HERE = _P(__file__).resolve().parent  # this project folder
TTS_DIR = HERE.parents[1] / 'tools' / 'tts'  # shared Kokoro TTS install


OUT = f'{HERE}/public'
rng = np.random.default_rng(5)


def fbm(h, w, octaves=6, base=4, stretch=(1, 1)):
    out = np.zeros((h, w))
    amp = 1.0
    for o in range(octaves):
        gh = max(2, int(base * 2 ** o / stretch[0]))
        gw = max(2, int(base * 2 ** o / stretch[1]))
        g = rng.standard_normal((gh, gw))
        img = Image.fromarray(((g - g.min()) / (g.max() - g.min()) * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)
        out += (np.asarray(img) / 255.0 - 0.5) * amp
        amp *= 0.55
    return out


def wood(w=2400, h=1400, name='oak.jpg', dark=(88, 50, 27), light=(201, 142, 88)):
    y, x = np.mgrid[0:h, 0:w]
    plank_h = 230
    plank = (y // plank_h).astype(int)
    offs = rng.uniform(0, 1000, plank.max() + 2)[plank]
    tone = rng.uniform(-0.07, 0.07, plank.max() + 2)[plank]
    warp = fbm(h, w, 5, 2, stretch=(1, 10)) * 70 + fbm(h, w, 4, 24, stretch=(1, 18)) * 40
    phase = (y + warp + offs) * 0.2 + np.sin((x + offs) * 0.0025) * 4
    rings = (np.sin(phase) + 1) / 2
    lines = rings ** 8 * (0.5 + fbm(h, w, 3, 6, stretch=(1, 8)) * 1.5)
    streak = fbm(h, w, 7, 6, stretch=(1, 70))
    broad = fbm(h, w, 3, 2, stretch=(1, 4))
    t = np.clip(0.55 + 0.95 * streak + 0.3 * broad - 0.22 * lines + tone, 0, 1)
    img = np.zeros((h, w, 3))
    for c in range(3):
        img[..., c] = dark[c] + (light[c] - dark[c]) * t
    seam = (y % plank_h) < 2
    img[seam] *= 0.5
    pores = (rng.random((h, w)) < 0.006) * rng.uniform(0.5, 0.9, (h, w))
    img *= (1 - pores[..., None] * 0.3)
    Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.5)).save(f'{OUT}/{name}', quality=90)


def paper(w=1600, h=2200):
    mott = fbm(h, w, 5, 3) * 10
    fib = fbm(h, w, 3, 120, stretch=(1, 3)) * 6
    base = np.array([247, 240, 226], dtype=float)
    img = base[None, None, :] + (mott + fib)[..., None]
    img += rng.normal(0, 2.2, (h, w, 1))
    Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).save(f'{OUT}/paper.jpg', quality=92)


def counter(w=2000, h=1200):
    """Pale stone/quartz counter for the basin + station shots."""
    base = np.array([222, 214, 202], dtype=float)
    m = fbm(h, w, 6, 3) * 18
    veins = np.abs(np.sin(fbm(h, w, 5, 3) * 14)) ** 80 * 7 + (rng.random((h, w)) < 0.01) * 10
    img = base[None, None, :] + m[..., None] - veins[..., None]
    img += rng.normal(0, 2.5, (h, w, 1))
    Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).save(f'{OUT}/stone.jpg', quality=90)


wood()
paper()
counter()
print('textures ok')
