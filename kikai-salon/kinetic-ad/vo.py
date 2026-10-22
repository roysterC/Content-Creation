"""Generate Kikai ad voiceover clips with Kokoro (local, offline).

Writes one WAV per line into the Remotion project's public/vo/ and a
timing.json with each clip's duration in seconds.
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

NARRATOR = 'bm_george'
KIKAI = 'bf_emma'
CALLER = 'bf_isabella'

# id, voice, text, speed
LINES = [
    ('hook', NARRATOR, "P.O.V. You're mid-balayage, and the phone rings.", 1.15),
    ('problem1', NARRATOR, 'Every missed call is a booking.', 1.12),
    ('problem2', NARRATOR, 'Gone.', 1.0),
    ('reveal1', NARRATOR, 'Meet Kikai.', 1.05),
    ('reveal2', NARRATOR, 'Your new front desk.', 1.1),
    ('callIntro', NARRATOR, "Salon's shut. Kikai isn't.", 1.15),
    ('msg0', CALLER, 'Hiya, any chance of a blow dry Saturday afternoon?', 1.15),
    ('msg1', KIKAI, 'Jess has half past two on Saturday. Shall I pop you in?', 1.1),
    ('msg2', CALLER, 'Go on then!', 1.15),
    ('diary', NARRATOR, 'Straight into the diary.', 1.15),
    ('awkward', NARRATOR, 'And it handles the awkward ones.', 1.15),
    ('stat0', NARRATOR, 'Twenty four seven.', 1.15),
    ('stat1', NARRATOR, 'Five channels. One inbox.', 1.2),
    ('stat2', NARRATOR, 'Live in a week.', 1.15),
    ('stat3', NARRATOR, 'Keep your number.', 1.15),
    ('cta1', NARRATOR, 'Hands full.', 1.05),
    ('cta2', NARRATOR, 'Still booked.', 1.05),
    ('cta3', NARRATOR, 'Get Kikai.', 1.05),
]

# espeak gets these wrong; swap in the right phonemes.
FIXES = {
    'bˈaleɪɪdʒ': 'bˌaləjˈɑːʒ',
    'kˈɪkaɪ': 'kˈiːkaɪ',
    'lˈɪv ɪn': 'lˈaɪv ɪn',
}


def load_voices():
    voices = {}
    for name in {NARRATOR, KIKAI, CALLER}:
        raw = np.fromfile(f'{TTS}/node_modules/kokoro-js/voices/{name}.bin', dtype=np.float32)
        voices[name] = raw.reshape(-1, 1, 256)
    path = f'{TTS}/voices.npz'
    np.savez(path, **voices)
    return path, voices


def trim(audio, sr, thresh=0.01, pad=0.04):
    idx = np.where(np.abs(audio) > thresh)[0]
    if len(idx) == 0:
        return audio
    a = max(0, idx[0] - int(pad * sr))
    b = min(len(audio), idx[-1] + int(pad * sr))
    return audio[a:b]


def main():
    only = set(sys.argv[1:])
    os.makedirs(OUT, exist_ok=True)
    vpath, voices = load_voices()
    k = Kokoro(f'{TTS}/model/kokoro-q8.onnx', vpath)
    timing = json.load(open(TIMING)) if os.path.exists(TIMING) else {}
    for cid, voice, text, speed in LINES:
        if only and cid not in only:
            continue
        ph = k.tokenizer.phonemize(text, 'en-gb')
        for bad, good in FIXES.items():
            ph = ph.replace(bad, good)
        audio, sr = k.create(ph, voice=voice,speed=speed, is_phonemes=True)
        audio = trim(audio, sr)
        sf.write(f'{OUT}/{cid}.wav', audio, sr)
        timing[cid] = round(len(audio) / sr, 3)
        print(f'{cid:10s} {timing[cid]:5.2f}s  {ph}')
    json.dump(timing, open(TIMING, 'w'), indent=1)


if __name__ == '__main__':
    main()
