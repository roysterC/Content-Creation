"""Voiceover for the CDNs explainer (Kokoro, local)."""
import json
import os
import sys

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro
from pathlib import Path as _P
HERE = _P(__file__).resolve().parent  # this project folder
TTS_DIR = HERE.parents[1] / 'tools' / 'tts'  # shared Kokoro TTS install


TTS = f'{TTS_DIR}'
OUT = f'{HERE}/public/vo'
TIMING = f'{HERE}/src/vo.json'
V = 'am_michael'

LINES = [
    ('hook', "P.O.V.: your users in Australia say your site is slow... and they're right!", 1.08),
    ('series', "Here's C.D.N.s. Expert level, in under a minute.", 1.08),
    ('distance', "Sydney is seventeen thousand kilometres from your London server. Every round trip takes a quarter of a second, and a page needs several.", 1.16),
    ('fix', "The fix? A C.D.N.: copies of your site on servers all over the world. So Sydney gets served from Sydney.", 1.12),
    ('edge', "The first visitor in a city fetches from London, and the edge keeps a copy. Everyone after that is served locally, in milliseconds.", 1.14),
    ('offload', "C.D.N.s carry the heavy stuff: images, video, scripts. So traffic spikes barely touch your server.", 1.14),
    ('purge', "Changed a file? Purge the cache, or give it a new name, so nobody gets the old one.", 1.12),
    ('share', "Follow for more, and send this to a friend who needs to learn C.D.N.s!", 1.1),
]
# caption display text for spoken phrases (tools/captions.py)
CAPTION_SUBS = {'seventeen thousand kilometres': '17,000 km', 'a quarter of a second': '¼ second'}
FIXES = {'kˈɪkaɪ': 'kˈiːkaɪ', 'pˈiː.ˈoʊ.vˈiː.:': 'pˌiːoʊvˈiː:', 'ˈaɪ.pˈiː.': 'ˌaɪpˈiː', 'ˈeɪ.pˈiː.ˈaɪ.': 'ˌeɪpiːˈaɪ', 'ˈɛkspɜːt': 'ˈɛkspɚt', 'tˈiː.tˈiː.ˈɛl.': 'tˌiːtiːˈɛl', 'ˈɛl.ˈɑːɹ.jˈuː.': 'ˌɛlɑːɹjˈuː', 'sˈiː.dˈiː.ˈɛn.': 'sˌiːdiːˈɛn', 'ɹᵻdiz': 'ɹˈɛdɪs', 'sˌiːdiːˈɛnˈɛs': 'sˌiːdiːˈɛnz'}


def trim(a, sr, th=0.008, pad=0.04):
    idx = np.where(np.abs(a) > th)[0]
    return a[max(0, idx[0] - int(pad * sr)) : idx[-1] + int(pad * sr)] if len(idx) else a


def main():
    only = set(sys.argv[1:])
    os.makedirs(OUT, exist_ok=True)
    raw = np.fromfile(f'{TTS}/node_modules/kokoro-js/voices/{V}.bin', dtype=np.float32).reshape(-1, 1, 256)
    np.savez(f'{TTS}/voices-bullet.npz', **{V: raw})
    k = Kokoro(f'{TTS}/model/kokoro-q8.onnx', f'{TTS}/voices-bullet.npz')
    timing = json.load(open(TIMING)) if os.path.exists(TIMING) else {}
    for cid, text, speed in LINES:
        if only and cid not in only:
            continue
        ph = k.tokenizer.phonemize(text, 'en-us')
        for a, b in FIXES.items():
            ph = ph.replace(a, b)
        audio, sr = k.create(ph, voice=V, speed=speed, is_phonemes=True)
        audio = trim(audio, sr)
        sf.write(f'{OUT}/{cid}.wav', audio, sr)
        timing[cid] = round(len(audio) / sr, 3)
        print(f'{cid} {timing[cid]:5.2f}s  {ph}')
    json.dump(timing, open(TIMING, 'w'), indent=1)


if __name__ == '__main__':
    main()
