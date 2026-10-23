"""Voiceover for the database indexes explainer (Kokoro, local)."""
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
    ('hook', "P.O.V.: your database just hit a million rows... and every search crawls!", 1.08),
    ('series', "Here's database indexes. Expert level, in under a minute.", 1.08),
    ('scan', "Without an index, finding one user means checking every row. A million rows, a million checks.", 1.12),
    ('index', "An index is a sorted copy of one column, with a pointer back to each row. Like the index at the back of a book.", 1.12),
    ('btree', "Databases store it as a B-tree. So finding one row in a million takes just three or four hops.", 1.1),
    ('cost', "But indexes aren't free: every insert updates every index. So index what you search by, not everything.", 1.14),
    ('explain', "Not sure? Run explain, and see if your query scans the whole table.", 1.12),
    ('share', "Follow for more, and send this to a friend who needs to learn indexes!", 1.1),
]
# caption display text for spoken phrases (tools/captions.py)
CAPTION_SUBS = {'a million rows': '1M rows', 'a million checks': '1M checks', 'a million': '1M', 'three or four': '3–4', 'explain': 'EXPLAIN'}
FIXES = {'kˈɪkaɪ': 'kˈiːkaɪ', 'pˈiː.ˈoʊ.vˈiː.:': 'pˌiːoʊvˈiː:', 'ˈaɪ.pˈiː.': 'ˌaɪpˈiː', 'ˈeɪ.pˈiː.ˈaɪ.': 'ˌeɪpiːˈaɪ', 'ˈɛkspɜːt': 'ˈɛkspɚt', 'tˈiː.tˈiː.ˈɛl.': 'tˌiːtiːˈɛl', 'ˈɛl.ˈɑːɹ.jˈuː.': 'ˌɛlɑːɹjˈuː', 'sˈiː.dˈiː.ˈɛn.': 'sˌiːdiːˈɛn', 'ɹᵻdiz': 'ɹˈɛdɪs'}


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
