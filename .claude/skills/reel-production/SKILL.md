---
name: reel-production
description: Shared pipeline for building, voicing, mixing, rendering and checking vertical reels in this repo (Remotion + Kokoro TTS + numpy audio + ffmpeg). Use for any video work in this repo, alongside the account skill.
---

# Reel production pipeline

Covers how every video in this repo gets made. Pair it with the account skill (`tech-explainer-reels` or `kikai-salon-reels`) for brand, voice and format.

## 0. Setup (every fresh session)
```bash
./setup.sh            # npm ci (Remotion 4.0.537 pinned), Kokoro model + voices, python deps, grain copies, ffmpeg/Chromium check
source tools/env.sh   # exports REPO, CHROME (headless shell path), RENDER_CONCURRENCY
```
- Node deps live in the repo-root `node_modules`. Project `package.json` files are just `{"type":"module"}`, and Node resolves upward.
- Pass `--browser-executable="$CHROME"` to every `npx remotion` call, and keep `--concurrency` at or below the CPU count (2 in the cloud workspace).

## 1. Project anatomy (copy an existing project as the template)
```
<project>/
  src/index.ts, Root.tsx      compositions (main 1080x1920@30 + "Cover")
  src/timeline.json           scene starts + VO start frames, derived from VO lengths (single source of truth)
  src/sim.ts                  deterministic simulation that drives the visuals (explainers)
  src/Explainer.tsx           the scenes
  public/                     fonts (inter-*.woff2, mono-*.woff2), vo/*.wav
  vo.py                       Kokoro voiceover → public/vo + src/vo.json
  mix.py                      music + SFX + VO → out/<name>-audio.wav, stems → out/stem-*.npy
  export_events.ts            dumps sim timings to out/*.json so sounds land on exact frames
```

## 2. Workflow, in order
1. **Script.** Write the VO lines first. Keep the total under the format's length (explainers: under 60s).
2. **Voice.** `python3 -I vo.py [ids]` generates the lines and prints durations + phonemes. Read the phonemes and fix mispronunciations with the `FIXES` dict (see below).
3. **Timeline.** Derive scene starts from the VO lengths (`scene = 6 + ceil(len*30) + tail`, with a minimum length per scene). Write `src/timeline.json`. Video and audio both read it, so they can't drift apart.
4. **Build scenes.** Anchor in-scene beats to the moment the key phrase is spoken (estimate from position in the line).
5. **Storyboard.** Render stills at key frames (`--scale=0.5`), tile them into a sheet with PIL and look at them. Fix layout, overlap and legibility before any video render.
6. **Draft.** The user always wants a **draft before a full render**: a stills sheet and/or `tools/render.sh <proj> <Comp> <wav> <out> draft` (0.4× scale, with sound).
7. **Full render** after approval: `tools/render.sh <proj> <Comp> <wav> <out>`. This uses PNG frames + CRF 12, two-pass loudness to −14 LUFS, and a limiter at 0.6 so AAC never clips.
8. **Check the final file** (not the draft): grab frames with ffmpeg at each beat plus **frame 0**, then run the checks in section 5. Only then send it.
9. Deliver: the video, the cover PNG, and captions for Instagram and TikTok.

## 3. Voice (Kokoro, local, offline)
- Voices used: `af_heart` (expressive American female) and `am_michael` (American male). Other options: `am_puck`, `am_fenrir`, `am_adam`, `am_onyx`, `af_bella`, `af_nicole`, … (see `tools/tts/node_modules/kokoro-js/voices/`).
- Language `en-us`. Speed 1.05–1.14 (faster for dense lines).
- Initialisms written with dots (P.O.V., I.P., A.P.I., T.T.L., L.R.U., C.D.N.) phonemize with stops. Map them in `FIXES`, e.g. `'pˈiː.ˈoʊ.vˈiː.:': 'pˌiːoʊvˈiː:'`, `'ˈaɪ.pˈiː.': 'ˌaɪpˈiː'`, `'ˈeɪ.pˈiː.ˈaɪ.': 'ˌeɪpiːˈaɪ'`, `'tˈiː.tˈiː.ˈɛl.': 'tˌiːtiːˈɛl'`, `'ˈɛl.ˈɑːɹ.jˈuː.': 'ˌɛlɑːɹjˈuː'`, `'sˈiː.dˈiː.ˈɛn.': 'sˌiːdiːˈɛn'`.
- Other fixes: `'ˈɛkspɜːt': 'ˈɛkspɚt'` (American "expert"), `'ɹᵻdiz': 'ɹˈɛdɪs'` (Redis), `'kˈɪkaɪ': 'kˈiːkaɪ'` (Kikai).

## 4. Audio mix (numpy/scipy, 48 kHz)
- Buses: `music`, `sfx`, `vo`. Duck music ~72% and SFX ~50% under the voice (mask smoothed over 150 ms).
- **Voice must sit ≥ 10 dB above music+SFX** in every line. Measure from the stems:
  `20log10(rms(vo)) − 20log10(rms(music+sfx))` over 3s from each VO start. Fix by lowering the bed, never by crushing the voice.
- Sync SFX to exported events (`export_events.ts` → `out/*.json`), not to guesses.
- `place()` must handle negative start times (pre-rolled events): trim the head.
- Music bars: if a drop must land on an event, anchor the beat grid to that event (`GRID0 = event − n·bar`) and skip notes before the fade-in.

## 5. Checks before delivering
- **Frame 0 carries the hook**: the headline is fully visible (no fade-in) and something is already moving. Most viewers decide in under 2 seconds.
- **Safe zones** (1080×1920): header y < 220, caption/username band y > 1560, right action rail x > 930 for 980 < y < 1560. Run `python3 tools/safe_zones.py sheet.png stills...`.
- **No dead stretches**: `python3 tools/check_motion.py video.mp4` should report no static hold ≥ 0.8s unless intentional (add slow camera drift or breathing).
- **Loudness** around −14 to −15 LUFS, peak ≤ −1 dBFS after AAC (`tools/render.sh` prints both).
- **Text**: no overlapping labels, no text that collides with a counter, and every caption has cleared before the next one starts.
- Loop seam: if the reel loops, the last→first frame diff should be close to a normal frame change.

## 6. Covers
- Composition `Cover` (1080×1920, 120 frames) that renders the main scene and overlays a big title. Render it with `npx remotion still … Cover --frame=<n>`.
  `<Freeze>` did not work for this, so use a real frame instead.
- Keep everything important inside the **middle 3:4 band (y 240–1680)**, which is what Instagram's profile grid shows.

## 7. Gotchas already hit
- `interpolate` input ranges must be strictly increasing.
- Remotion's static server does **not follow symlinks** in `public/`. Copy files instead (`setup.sh` copies the shared grain).
- Single-pass `loudnorm` straight into AAC overshot to +2 dBFS. Always master to WAV with headroom first (`tools/render.sh` does this).
- The PyPI package `agent-reach` is an unrelated project, and installs of unreviewed GitHub code are blocked in this workspace.
- Don't scale an element twice (container + child). It shrank the phone mock to nothing once.
