---
name: tech-explainer-reels
description: Make episodes for the tech explainer page ("be an expert in anything tech, in under 1 minute"): POV hook, animated system-design diagrams, male American voiceover, under 60s. Use for any tech/software/system-design explainer video, cover or caption.
---

# Tech explainer reels: "Expert in under 1 minute"

Use with `reel-production` (pipeline, voice, mix, checks). Topic backlog and episode log: `tech-explainers/topics.md`.

## The page
- USP: **be an expert in anything tech, in under 1 minute.** Every episode is under 60s.
- Audience: developers, CS students, people prepping for system design interviews, and the tech-curious.
- Every episode's main hook uses **"POV: …"**. This is a standing instruction from the owner.
- This page is completely separate from Kikai. Never use Kikai branding, salon language or the "Comment BOOK" CTA here.

## Episode format (keep it identical across episodes so the series is recognisable)
| Beat | On screen | Voice (am_michael) |
|---|---|---|
| Hook (0s) | Kicker `<TOPIC> · EXPLAINED` (red) + headline `POV: …` **fully visible at frame 0**, with the problem already animating (flood, slow loading…) | "P.O.V.: … !" |
| Series card | Kicker `EXPERT IN UNDER 1 MINUTE` + `<Topic>, / expert level.` while the problem keeps playing | "Here's <topic>. Expert level, in under a minute." |
| 4–6 concept scenes | Kicker `01 · NAME` … headline 2 short lines, a sub line in mono at y≈1450, and a progress bar under the header | One idea per scene, said as it happens on screen |
| Recap | `RECAP` · `<Topic>, / in 4 lines.` · 4 ticked lines · **Follow for more** pill · "Be an expert in anything tech, in under 1 minute." | "That's <topic>. Follow, and be an expert in anything tech, in under a minute." |

Show, don't tell: each concept is a **live, deterministic simulation** (precomputed in `src/sim.ts`) that visibly does the thing. Examples: packets routed by the algorithm, real LRU/TTL cache logic deciding HIT or MISS. Nothing on screen should be fake.

## Visual identity (copy from `tech-explainers/caching/src/Explainer.tsx`)
- Background `#0a0e14` with a drifting dot grid (36px), a soft radial glow, and a subtle 1–1.2% "breathing" scale on the diagram so no shot is ever static.
- Colours:
  - ink `#e9eef5`, dim `#8b98a9`, lines `#223044`
  - request/cyan `#39d0ff`, amber `#ffb020`, ok/green `#3ddc84`, bad/red `#ff4d5e`, pink `#ff6fb1`, violet `#a98bff`
- Type:
  - headline Inter 800, 76px, −2 letter-spacing, top 250, left 70
  - kicker Plex Mono 600, 27px, letter-spacing 3
  - sub Plex Mono 31px, dim, top 1450
  - diagram labels Plex Mono 20–27px (never under 20px at 1080 wide)
- The diagram lives between y ≈ 550 and 1400 and stays clear of the right rail (x > 930 below y 980).
- Packets are dots with glow (r 9 + r 18 at 16%), optionally with a pill label. A ring on arrival, a red ✕ burst for failures, and a HIT/MISS bubble.

## Voice and sound
- Voice: Kokoro **`am_michael`**, en-us, speed 1.05–1.14. The owner switched this page to a male American voice.
- Music:
  - Hook: a tense rising pad with a quickening pulse.
  - When "the fix" arrives: a light groove, 112 BPM, Am–F–C–G, soft kick, offbeat hats, a quiet 16th arpeggio and a pad.
  - Fade out at the end.
- SFX are synced to `export_events.ts` output: a blip per event, with pitch carrying meaning (e.g. per server, up = hit, down = miss), a buzz for failures, a whoosh on scene changes and a bell on the follow pill.
- Voice 10 dB or more above the bed in every line.

## Starting a new episode
1. Copy `tech-explainers/caching` to `tech-explainers/<topic>`. Rename the composition ids and the audio file names.
2. Write ~8 VO lines (hook, series, 4–5 concepts, recap) and keep total speech ≤ 46s. Update `LINES` in `vo.py` (and `FIXES` for any initialisms) and run it.
3. Edit the scene list in `build_timeline.py` and run it. It writes `src/timeline.json` from `src/vo.json` (hook VO at frame 4, each scene = max(min, 6 + VO frames + tail)).
4. Rewrite `src/sim.ts` for the new topic's mechanics and `src/Explainer.tsx` scenes, keeping the shared components (Headline, Sub, Progress, Recap).
5. Stills sheet, then low-res draft with sound for the owner, then full render, cover and captions.
6. Add the episode to `topics.md`.

## Cover (`Cover` composition)
Amber pill `EXPERT IN UNDER 1 MIN`, the topic in giant Inter 800 (158–190px), the POV line in mono under it, and the hook's most dramatic frame below (the 503 crash, the 4-second load…). Keep everything inside y 240–1680 for the Instagram grid crop.

## Captions
Instagram:
```
POV: <hook>… <punchline>. <emoji>

Here's <topic>, in under a minute:

<emoji> <concept>: <one line>   (×4–5)

Save this for your next system design interview 📌
Follow to be an expert in anything tech, in under 1 minute.

#systemdesign #softwareengineering #backend #<topic> #programming #techexplained #codinginterview #learntocode …
```
TikTok: one line hook + "explained in under a minute. Save it for your next interview 📌" + 6 hashtags.
Push **saves** (the strongest signal for educational content). Post each new episode 1–2 days after the last one, and link the two in a comment.
