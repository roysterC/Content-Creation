"""Voice the "Hands Full" Kikai ad with Kokoro (local).

Usage: python3 -I gen_vo_hands_full.py [clip ids...]
Writes WAVs to hands-full/public/vo and durations to hands-full/src/vo-timing.json.
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

NARRATOR = 'bf_emma'  # warm, unhurried
KIKAI = 'bf_isabella'  # clearly different from the narrator
CALLER = 'bf_alice'  # cheerful, younger

LINES = [
    ('s1', NARRATOR, 'Saturday. Every chair full. Both hands busy...', 0.95),
    ('s2', NARRATOR, "and the phone's ringing. Again.", 0.95),
    ('k1', KIKAI, 'Hello, Bramble Hair!', 1.0),
    ('c1', CALLER, 'Hiya! Anything Saturday for a cut and colour?', 1.08),
    ('k2', KIKAI, "Half ten with Priya? As it's colour, you'll need a quick patch test first. Thursday okay?", 1.05),
    ('s4', NARRATOR, "Evenings. Sundays. Nine o'clock at night. Kikai picks up, in your salon's name.", 1.0),
    ('s5', NARRATOR, 'Every call answered. Every booking in the diary.', 1.0),
    ('s6', NARRATOR, 'Kikai. The AI receptionist for UK salons. Live in about a week. We set it all up.', 1.0),
]

FIXES = {
    'kˈɪkaɪ': 'kˈiːkaɪ',
    'pɹˈɪjə': 'pɹˈiːjə',
    'lˈɪv ɪn': 'lˈaɪv ɪn',
}


def trim(audio, sr, thresh=0.008, pad=0.05):
    idx = np.where(np.abs(audio) > thresh)[0]
    if len(idx) == 0:
        return audio
    return audio[max(0, idx[0] - int(pad * sr)) : min(len(audio), idx[-1] + int(pad * sr))]


def main():
    only = set(sys.argv[1:])
    os.makedirs(OUT, exist_ok=True)
    voices = {}
    for name in {NARRATOR, KIKAI, CALLER}:
        raw = np.fromfile(f'{TTS}/node_modules/kokoro-js/voices/{name}.bin', dtype=np.float32)
        voices[name] = raw.reshape(-1, 1, 256)
    vpath = f'{TTS}/voices-hf.npz'
    np.savez(vpath, **voices)
    k = Kokoro(f'{TTS}/model/kokoro-q8.onnx', vpath)
    timing = json.load(open(TIMING)) if os.path.exists(TIMING) else {}
    for cid, voice, text, speed in LINES:
        if only and cid not in only:
            continue
        ph = k.tokenizer.phonemize(text, 'en-gb')
        for bad, good in FIXES.items():
            ph = ph.replace(bad, good)
        audio, sr = k.create(ph, voice=voice, speed=speed, is_phonemes=True)
        audio = trim(audio, sr)
        sf.write(f'{OUT}/{cid}.wav', audio, sr)
        timing[cid] = round(len(audio) / sr, 3)
        print(f'{cid:4s} {timing[cid]:5.2f}s  {ph}')
    json.dump(timing, open(TIMING, 'w'), indent=1)
    print('total speech', round(sum(timing.values()), 2))


if __name__ == '__main__':
    main()
