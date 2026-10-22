# Content-Creation

Code-built short-form videos for two accounts:

- **`tech-explainers/`**: the "expert in anything tech, in under 1 minute" page. Episodes so far: load balancers, caching. Topic backlog: `tech-explainers/topics.md`.
- **`kikai-salon/`**: content for Kikai, the AI receptionist for UK hair salons (bullet bait-and-switch reel, kinetic ad, *Hands Full* illustrated ad, hook storyboards).

## Setup
```bash
./setup.sh
```
This installs Node deps (Remotion 4.0.537, pinned), the Kokoro TTS model and voices, and Python deps (kokoro-onnx, numpy, scipy, soundfile, pillow). It also checks ffmpeg and headless Chromium.

## Make or rebuild an episode (example: caching)
```bash
cd tech-explainers/caching
python3 -I vo.py                    # voiceover → public/vo/*.wav + src/vo.json
python3 -I build_timeline.py         # scene timings from the VO lengths → src/timeline.json
npx esbuild export_events.ts --bundle --platform=node --format=cjs --outfile=out/export.cjs --log-level=error && node out/export.cjs > out/events.json
python3 -I mix.py                   # music + SFX + VO → out/cache-audio.wav
../../tools/render.sh . Caching out/cache-audio.wav out/caching-draft.mp4 draft   # low-res draft
../../tools/render.sh . Caching out/cache-audio.wav out/caching-explained.mp4     # full quality
source ../../tools/env.sh && npx remotion still src/index.ts Cover out/cover.png --frame=100 --image-format=png --browser-executable="$CHROME"
```

## Quality checks
```bash
python3 tools/check_motion.py video.mp4          # dead stretches + loop seam
python3 tools/safe_zones.py sheet.png s1.png ... # platform UI overlap
```

## Layout
```
tools/            setup env, render+master, checks, Kokoro TTS install
tech-explainers/  load-balancers/, caching/, topics.md
kikai-salon/      bullet-reel/, kinetic-ad/, hands-full/, hook-storyboards/, _shared/grain/
.claude/skills/   reel-production, tech-explainer-reels, kikai-salon-reels
```
