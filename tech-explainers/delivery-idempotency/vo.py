"""Voiceover for the delivery-app idempotency deep dive: POV hook, build a real order flow, break it at each hop, fix it with idempotency; no captions, recap, loops (Kokoro, local)."""
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
    ('hook', "P.O.V.: you order dinner once... and two drivers turn up.", 1.06),
    ('lead', "That's not a glitch. It's the problem every big app designs around. Let's build the order flow, and break it.", 1.12),
    ('idea', "First, the idea. A switch that says ON: press it five times, and the light's just on. A switch that says TOGGLE: five presses, and who knows. ON is idempotent. Doing it again changes nothing.", 1.12),
    ('code', "Same in code. Set status to paid: run it twice, still paid. Take twenty-four pounds off the balance: run it twice, and you're down forty-eight.", 1.12),
    ('hop1', "Problem one: bad signal. Your app retries 'place order', and without protection, that's two orders. So the app sends an order key, and the A.P.I. saves it with the result. Same key again? Hand back the same order.", 1.14),
    ('reuse', "Same key, but a different basket? Reject it. That's a bug, not a retry.", 1.1),
    ('hop2', "Problem two, the sneaky one. Queues deliver messages at least once. If dispatch crashes before it says done, 'order placed' comes back. That's your second driver.", 1.14),
    ('fix2', "Fix: dispatch only assigns a driver if order A12 doesn't have one yet. One rule in the database: one driver per order.", 1.12),
    ('hop3', "Problem three: the charge. Payment calls time out too. Every retry reuses the same key, so you're only charged once.", 1.12),
    ('rule', "So here's the rule for any system: anything that can run twice must be safe to run twice.", 1.08),
    ('payoff', "One order. One charge. One driver.", 1.0),
]
CAPTION_SUBS = {'twenty-four pounds': '£24'}
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
