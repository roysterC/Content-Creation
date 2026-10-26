"""Voiceover for the IaC idempotency comment-reply reel (series style: POV hook, reply line, rapid twists, 4-line recap; no captions, loops) (Kokoro, local)."""
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
    ('hook', "P.O.V.: your pipeline re-ran at two A.M.... and now you're paying for two of every server.", 1.1),
    ('series', "You asked why infrastructure as code must be idempotent. Here's why.", 1.1),
    ('script', "A plain script says: create three servers. Run it twice? Six. Every re-run does it all again.", 1.14),
    ('declare', "So Terraform describes what should exist: three servers. Not the steps.", 1.12),
    ('diff', "Each run compares that with reality, and only changes the difference. Already three? No changes.", 1.14),
    ('why', "And re-runs will happen: C.I. retries, teammates, a crash mid-apply. Idempotent means re-running is safe.", 1.14),
    ('drift', "Someone deletes a server by hand? The next run puts it back.", 1.1),
    ('catch', "The catch: a raw shell command in Ansible runs every time. Guard it, or you're back to doubles.", 1.14),
    ('payoff', "Run it once, or a hundred times. Same infrastructure.", 1.04),
]
CAPTION_SUBS = {'two A.M....': '2am…', 'a hundred': '100'}
FIXES = {'kˈɪkaɪ': 'kˈiːkaɪ', 'pˈiː.ˈoʊ.vˈiː.:': 'pˌiːoʊvˈiː:', 'ˈaɪ.pˈiː.': 'ˌaɪpˈiː', 'ˈeɪ.pˈiː.ˈaɪ.': 'ˌeɪpiːˈaɪ', 'ˈɛkspɜːt': 'ˈɛkspɚt', 'tˈiː.tˈiː.ˈɛl.': 'tˌiːtiːˈɛl', 'ˈɛl.ˈɑːɹ.jˈuː.': 'ˌɛlɑːɹjˈuː', 'sˈiː.dˈiː.ˈɛn.': 'sˌiːdiːˈɛn', 'ɹᵻdiz': 'ɹˈɛdɪs', 'sˌiːdiːˈɛnˈɛs': 'sˌiːdiːˈɛnz', 'ˈaɪdmpoʊtənt': 'ˌaɪdɛmpˈoʊtənt', 'ˈeɪ.ˈɛm.': 'ˌeɪˈɛm', 'ˈaɪ.dˈiː.': 'ˌaɪdˈiː', 'sˈiː.ˈaɪ.': 'sˌiːˈaɪ'}


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
