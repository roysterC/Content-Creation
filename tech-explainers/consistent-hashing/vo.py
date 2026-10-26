"""Voiceover for the consistent hashing explainer (series style: villain hook, series line, quick fix, rapid twists, 4-line recap; no captions, loops) (Kokoro, local)."""
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
    ('hook', "P.O.V.: you add one more server to survive the rush... and the whole site gets slower.", 1.1),
    ('series', "Here's consistent hashing. Expert level, in under a minute.", 1.08),
    ('modn', "The villain? Hash mod N. Go from four cache servers to five, and four in five keys move. Every one is a miss, so the database takes the hit.", 1.16),
    ('ring', "The fix: put servers and keys on a ring. Each key walks clockwise, to the next server.", 1.12),
    ('add', "Add a server, and it only takes keys from one neighbour. About one in five move, not four in five.", 1.14),
    ('remove', "A server dies? Its keys slide to the next one. Everyone else stays put.", 1.12),
    ('lumpy', "But one point per server makes lumpy slices. One server gets double the work.", 1.12),
    ('vnodes', "So each server gets a hundred virtual points, and the slices even out.", 1.12),
    ('real', "It's how Cassandra and Amazon's Dynamo spread data across thousands of machines.", 1.12),
    ('payoff', "Add a server now? Almost nothing moves.", 1.04),
]
CAPTION_SUBS = {'four in five': '4 in 5', 'one in five': '1 in 5', 'a hundred': '100'}
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
