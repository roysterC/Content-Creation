"""Voiceover for the database sharding explainer (rate-limiting style: villain hook, series line, quick fix, rapid twists; no CTA, loops) (Kokoro, local)."""
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
    ('hook', "P.O.V.: a hundred million users... and one database is taking every write.", 1.1),
    ('series', "Here's database sharding. Expert level, in under a minute.", 1.08),
    ('fix', "The fix? Split users across many databases, called shards. Each holds a slice of the data, and the traffic.", 1.16),
    ('key', "Which shard holds you? The router hashes your user I.D., say, I.D. mod four. Same user, same shard, every time.", 1.16),
    ('range', "Or split by range: first twenty-five million here, next twenty-five there. But new sign-ups all pile onto the last shard.", 1.16),
    ('hot', "Next villain: the hot key. A cricket star posts, and millions hit one shard. Fix: cache it.", 1.14),
    ('cross', "The catch? Top posts worldwide means asking every shard, then merging.", 1.12),
    ('reshard', "Add a fifth shard? Mod five moves four in five users. Consistent hashing fixes that. Episode soon.", 1.12),
    ('payoff', "A hundred million users. No single database holds them all.", 1.06),
]
# caption display text for spoken phrases (tools/captions.py)
CAPTION_SUBS = {'a hundred million': '100 million', 'twenty-five million': '25 million', 'next twenty-five': 'next 25', 'mod four': 'mod 4', 'mod five': 'Mod 5', 'four in five': '4 in 5'}
FIXES = {'kˈɪkaɪ': 'kˈiːkaɪ', 'pˈiː.ˈoʊ.vˈiː.:': 'pˌiːoʊvˈiː:', 'ˈaɪ.pˈiː.': 'ˌaɪpˈiː', 'ˈeɪ.pˈiː.ˈaɪ.': 'ˌeɪpiːˈaɪ', 'ˈɛkspɜːt': 'ˈɛkspɚt', 'tˈiː.tˈiː.ˈɛl.': 'tˌiːtiːˈɛl', 'ˈɛl.ˈɑːɹ.jˈuː.': 'ˌɛlɑːɹjˈuː', 'sˈiː.dˈiː.ˈɛn.': 'sˌiːdiːˈɛn', 'ɹᵻdiz': 'ɹˈɛdɪs', 'sˌiːdiːˈɛnˈɛs': 'sˌiːdiːˈɛnz', 'ˈaɪdmpoʊtənt': 'ˌaɪdɛmpˈoʊtənt', 'ˈeɪ.ˈɛm.': 'ˌeɪˈɛm', 'ˈaɪ.dˈiː.': 'ˌaɪdˈiː'}


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
