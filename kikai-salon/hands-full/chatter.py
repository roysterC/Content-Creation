"""Background salon chatter: short lines in several voices, later mixed low,
filtered and reverbed so they read as murmur rather than words."""
import os

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro
from pathlib import Path as _P
HERE = _P(__file__).resolve().parent  # this project folder
TTS_DIR = HERE.parents[1] / 'tools' / 'tts'  # shared Kokoro TTS install


TTS = f'{TTS_DIR}'
OUT = f'{HERE}/audio/chatter'
os.makedirs(OUT, exist_ok=True)

LINES = [
    ('bf_lily', 'Oh that colour is gorgeous on you, honestly.'),
    ('bm_lewis', 'Are you off anywhere nice this summer?'),
    ('bf_alice', "Same as last time, just a bit shorter at the back."),
    ('bm_daniel', "It's been absolutely mad this week, hasn't it."),
    ('bf_lily', 'Do you want a cup of tea while that develops?'),
    ('bf_isabella', 'No, she said she would ring me back later.'),
    ('bm_george', 'I think the match starts at three, so I need to be quick.'),
    ('bf_alice', 'Ooh, I love that, where did you get it?'),
    ('bm_lewis', 'Little bit off the top, keep the length.'),
    ('bf_emma', 'Right, let me just pop that in the diary.'),
    ('bf_isabella', 'My sister had hers done here, she loved it.'),
    ('bm_daniel', 'Shall we go a shade lighter this time?'),
]

names = sorted({v for v, _ in LINES})
voices = {n: np.fromfile(f'{TTS}/node_modules/kokoro-js/voices/{n}.bin', dtype=np.float32).reshape(-1, 1, 256) for n in names}
np.savez(f'{TTS}/voices-chat.npz', **voices)
k = Kokoro(f'{TTS}/model/kokoro-q8.onnx', f'{TTS}/voices-chat.npz')
for i, (v, text) in enumerate(LINES):
    audio, sr = k.create(text, voice=v, speed=1.12, lang='en-gb')
    sf.write(f'{OUT}/{i:02d}.wav', audio, sr)
    print(i, v, round(len(audio) / sr, 2))
