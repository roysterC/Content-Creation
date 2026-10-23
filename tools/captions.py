"""Word-level caption timings for an episode, derived from its voiceover audio.

Kokoro gives no timestamps, so: pauses in each VO wav mark phrase breaks (snapped to the
script's punctuation), and inside a phrase the time is shared out by each word's phoneme count.
Display text cleans initialisms (P.O.V. → POV) and applies the episode's CAPTION_SUBS
(e.g. "four twenty-nine" → "429"), merging the spoken words a substitution covers.

Usage (from the repo root or anywhere):  python3 -I tools/captions.py tech-explainers/<episode>
Reads  <ep>/vo.py (LINES, FIXES, optional CAPTION_SUBS), <ep>/public/vo/*.wav, <ep>/src/timeline.json
Writes <ep>/src/captions.json   [{id, words: [{t, s, e}]}]  (s/e in absolute frames @30fps)
"""
import importlib.util
import json
import re
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

FPS = 30
PUNCT_END = re.compile(r'[,.;:!?…]+$|\.\.\.$')


def load_episode(ep: Path):
    spec = importlib.util.spec_from_file_location('ep_vo', ep / 'vo.py')
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def display(word: str) -> str:
    w = re.sub(r'((?:[A-Za-z]\.){2,})', lambda m: m.group(1).replace('.', ''), word)  # P.O.V. → POV
    w = w.replace('...', '…')
    return w


def bare(word: str) -> str:
    return re.sub(r'[^a-z0-9\'-]', '', word.lower().replace('.', ''))


def speech_runs(a, sr, hop=0.01, min_gap=0.09, rel_db=-34):
    n = int(hop * sr)
    frames = len(a) // n
    rms = np.sqrt(np.mean(a[: frames * n].reshape(frames, n) ** 2, axis=1) + 1e-12)
    on = 20 * np.log10(rms / rms.max()) > rel_db
    idx = np.where(on)[0]
    if not len(idx):
        return 0, len(a) / sr, []
    s0, s1 = idx[0] * hop, (idx[-1] + 1) * hop
    gaps = []
    i = idx[0]
    while i <= idx[-1]:
        if not on[i]:
            j = i
            while j <= idx[-1] and not on[j]:
                j += 1
            if (j - i) * hop >= min_gap:
                gaps.append((i * hop, j * hop))
            i = j
        else:
            i += 1
    return s0, s1, gaps


def align(words, weights, s0, s1, gaps):
    """Return (start, end) seconds per word."""
    n = len(words)
    total = sum(weights)
    speech = (s1 - s0) - sum(b - a for a, b in gaps)
    # where each phrase boundary would fall if speech were uniform
    bounds = [i for i, w in enumerate(words[:-1]) if PUNCT_END.search(w)]
    cum = np.cumsum(weights) / total
    used = set()
    snapped = {}  # word index → gap
    for bi in bounds:
        expect_speech = cum[bi] * speech
        # convert speech-time to clock time by walking the gaps
        t = s0 + expect_speech
        for a, b in gaps:
            if a < t:
                t += b - a
        best, bd = None, 0.45
        for k, (a, b) in enumerate(gaps):
            d = abs((a + b) / 2 - t)
            if k not in used and d < bd and all(k > u for u in used):
                best, bd = k, d
        if best is not None:
            used.add(best)
            snapped[bi] = gaps[best]
    # split into segments at snapped gaps and distribute by weight inside each
    out = [None] * n
    seg_start_word, seg_t = 0, s0
    cuts = sorted(snapped.items())
    for bi, (a, b) in cuts + [(n - 1, (s1, s1))]:
        ws = weights[seg_start_word : bi + 1]
        span = a - seg_t
        t = seg_t
        for k, w in enumerate(ws):
            d = span * w / sum(ws)
            out[seg_start_word + k] = (t, t + d)
            t += d
        seg_start_word, seg_t = bi + 1, b
    return out


def main(ep: Path):
    vo = load_episode(ep)
    subs = getattr(vo, 'CAPTION_SUBS', {})
    fixes = getattr(vo, 'FIXES', {})
    T = json.load(open(ep / 'src/timeline.json'))
    from kokoro_onnx import Kokoro  # only for the phonemizer

    tts = Path(vo.TTS)
    k = Kokoro(str(tts / 'model/kokoro-q8.onnx'), str(next(tts.glob('voices*.npz'))))
    out = []
    for cid, text, _speed in vo.LINES:
        a, sr = sf.read(ep / f'public/vo/{cid}.wav')
        if a.ndim > 1:
            a = a.mean(1)
        s0, s1, gaps = speech_runs(a, sr)
        words = text.split()
        weights = []
        for w in words:
            ph = k.tokenizer.phonemize(w, 'en-us')
            for x, y in fixes.items():
                ph = ph.replace(x, y)
            weights.append(len(re.sub(r'[ˈˌː\s.,!?;:…]', '', ph)) + 1.5)
        times = align(words, weights, s0, s1, gaps)
        # display tokens, merging substitutions
        disp = []
        i = 0
        keys = [(kk.split(), vv) for kk, vv in subs.items()]
        while i < len(words):
            hit = None
            for kw, vv in keys:
                seq = [bare(w) for w in words[i : i + len(kw)]]
                if seq == [bare(x) for x in kw]:
                    hit = (len(kw), vv)
                    break
            if hit:
                m, vv = hit
                tail = PUNCT_END.search(words[i + m - 1])
                disp.append((vv + (tail.group(0) if tail else ''), times[i][0], times[i + m - 1][1]))
                i += m
            else:
                disp.append((display(words[i]), *times[i]))
                i += 1
        at = T['v'][cid]
        out.append({'id': cid, 'words': [{'t': t, 's': round(at + s * FPS, 2), 'e': round(at + e * FPS, 2)} for t, s, e in disp]})
        print(f'{cid:8s} {len(gaps)} pauses, {len(disp)} words, {s1 - s0:.2f}s speech')
    json.dump(out, open(ep / 'src/captions.json', 'w'), indent=1, ensure_ascii=False)
    print('wrote', ep / 'src/captions.json')


if __name__ == '__main__':
    main(Path(sys.argv[1]).resolve())
