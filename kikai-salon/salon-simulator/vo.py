"""Voice the "Salon Simulator" Kikai reel with Kokoro (local).

Usage: python3 -I vo.py [clip ids...]
Writes WAVs to salon-simulator/public/vo and durations to salon-simulator/src/vo-timing.json.
"""
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
TIMING = f'{HERE}/src/vo-timing.json'

VOICE = 'af_heart'  # expressive American female (the Kikai account voice)

LINES = [
    ('v1', 'Salon owners. Can you clear Saturday without missing a single call?', 1.08),
    ('v2', "Your hands are full. The phone's ringing.", 1.1),
    ('v3', 'Missed! Minus one client. Missed again!', 1.1),
    ('v4', 'Game over? Not quite.', 1.05),
    ('v5', 'Power up! Kikai. The AI receptionist for UK salons.', 1.08),
    ('v6', "It picks up while you're busy, day or night, and books them straight into your diary.", 1.12),
    ('v7', 'Bonus round. A free consultation!', 1.02),
    ('v8', "We'll look at the calls you're missing, and show you how Kikai would work for your salon.", 1.12),
    ('v9', 'Comment free to claim it.', 1.02),
]

FIXES = {
    'kˈɪkaɪ': 'kˈiːkaɪ',
}


def trim(audio, sr, thresh=0.008, pad=0.05):
    idx = np.where(np.abs(audio) > thresh)[0]
    if len(idx) == 0:
        return audio
    return audio[max(0, idx[0] - int(pad * sr)) : min(len(audio), idx[-1] + int(pad * sr))]


def main():
    only = set(sys.argv[1:])
    os.makedirs(OUT, exist_ok=True)
    raw = np.fromfile(f'{TTS}/node_modules/kokoro-js/voices/{VOICE}.bin', dtype=np.float32)
    vpath = f'{TTS}/voices-ss.npz'
    np.savez(vpath, **{VOICE: raw.reshape(-1, 1, 256)})
    k = Kokoro(f'{TTS}/model/kokoro-q8.onnx', vpath)
    timing = json.load(open(TIMING)) if os.path.exists(TIMING) else {}
    for cid, text, speed in LINES:
        if only and cid not in only:
            continue
        ph = k.tokenizer.phonemize(text, 'en-us')
        for bad, good in FIXES.items():
            ph = ph.replace(bad, good)
        audio, sr = k.create(ph, voice=VOICE, speed=speed, is_phonemes=True)
        audio = trim(audio, sr)
        sf.write(f'{OUT}/{cid}.wav', audio, sr)
        timing[cid] = round(len(audio) / sr, 3)
        print(f'{cid:4s} {timing[cid]:5.2f}s  {ph}')
    json.dump(timing, open(TIMING, 'w'), indent=1)
    print('total speech', round(sum(timing.values()), 2))


if __name__ == '__main__':
    main()
