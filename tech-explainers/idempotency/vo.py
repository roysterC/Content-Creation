"""Voiceover for the idempotency explainer (#12): curiosity hook, lead, rapid twists, 4-line recap; no captions, loops (Kokoro, local)."""
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
    ('hook', "Here's what actually happens when you tap Pay twice.", 1.06),
    ('lead', "Most of the time, your first payment already went through. The reply just never made it back to your phone.", 1.12),
    ('naive', "So the server sees a second payment, and charges you again. Two charges, one order.", 1.12),
    ('key', "The fix is idempotency. The app creates one unique key for this checkout, and sends it with every retry.", 1.14),
    ('replay', "The server saves each key with its result. Same key again? It skips the charge, and replays the first answer.", 1.14),
    ('stripe', "That's exactly how Stripe works: same Idempotency-Key header, same response.", 1.1),
    ('race', "But what if both taps land at the same moment? Lock the key first, so only one goes through.", 1.14),
    ('client', "And the key must come from the app. Let the server make it, and every retry looks brand new.", 1.14),
    ('payoff', "Tap it ten times. Charged once.", 1.0),
]
CAPTION_SUBS = {'ten times': '10 times'}
FIXES = {'ˈaɪdmpoʊtənsi': 'ˌaɪdɛmpˈoʊtənsi ', 'kˈɪkaɪ': 'kˈiːkaɪ', 'pˈiː.ˈoʊ.vˈiː.:': 'pˌiːoʊvˈiː:', 'ˈaɪ.pˈiː.': 'ˌaɪpˈiː', 'ˈeɪ.pˈiː.ˈaɪ.': 'ˌeɪpiːˈaɪ', 'ˈɛkspɜːt': 'ˈɛkspɚt', 'tˈiː.tˈiː.ˈɛl.': 'tˌiːtiːˈɛl', 'ˈɛl.ˈɑːɹ.jˈuː.': 'ˌɛlɑːɹjˈuː', 'sˈiː.dˈiː.ˈɛn.': 'sˌiːdiːˈɛn', 'ɹᵻdiz': 'ɹˈɛdɪs', 'sˌiːdiːˈɛnˈɛs': 'sˌiːdiːˈɛnz', 'ˈaɪdmpoʊtənt': 'ˌaɪdɛmpˈoʊtənt', 'ˈeɪ.ˈɛm.': 'ˌeɪˈɛm', 'ˈaɪ.dˈiː.': 'ˌaɪdˈiː', 'sˈiː.ˈaɪ.': 'sˌiːˈaɪ'}


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
