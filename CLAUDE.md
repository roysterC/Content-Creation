# Content-Creation

Short-form vertical video (Instagram Reels / TikTok) for **two separate accounts**, built in code with Remotion, Kokoro TTS, numpy audio and ffmpeg.

| Account | Folder | Skill |
|---|---|---|
| **Tech explainer page** ("expert in under 1 minute", POV hooks) | `tech-explainers/` | `tech-explainer-reels` |
| **Kikai**, the AI receptionist for UK hair salons | `kikai-salon/` | `kikai-salon-reels` |
| Shared pipeline: setup, voice, render, checks | `tools/` | `reel-production` |

## Start of every session
1. Run `./setup.sh` once (installs the Remotion toolchain, the Kokoro voice model and the Python deps, and checks ffmpeg/Chromium). The workspace is fresh each session.
2. Read the skill for the account you're working on, plus `reel-production`.

## Rules
- **Never mix the two brands**: different audience, voice, palette, CTA and captions. If a request is ambiguous, ask which account it's for.
- Every project is self-contained: `src/` (Remotion), `public/` (fonts, VO, assets), `vo.py` (voice), `mix.py` (music + SFX + VO), and for the explainers `export_events.ts` (feeds exact animation timings to the mixer).
- The user wants a **draft before every full render**: storyboard stills or a low-res video with sound.
- Commit the source of every new episode or project (not `out/`), and update `tech-explainers/topics.md` or the results log in the Kikai skill.
