---
name: tech-explainer-reels
description: Make episodes for the tech explainer page ("be an expert in anything tech, in under 1 minute"): POV hook, animated system-design diagrams, male American voiceover, under 60s. Use for any tech/software/system-design explainer video, cover or caption.
---

# Tech explainer reels: "Expert in under 1 minute"

Use with `reel-production` (pipeline, voice, mix, checks). **Topic list: `tech-explainers/topics.md`.** It's the owner's canonical numbered list. The next episode is the first one not done, in list order, unless the owner picks another. Update its status column after every draft and render.

## The page
- USP: **be an expert in anything tech, in under 1 minute.** Every episode is under 60s.
- Audience: developers, CS students, people prepping for system design interviews, and the tech-curious.
- Every episode's main hook uses **"POV: …"**. This is a standing instruction from the owner.
- This page is completely separate from Kikai. Never use Kikai branding, salon language or the "Comment BOOK" CTA here.

## Episode format (keep it identical across episodes so the series is recognisable)

**No recap card.** Retention dropped sharply at the old "<Topic>, in 4 lines" recap: viewers liked and left. So we go straight from the last concept to one combined follow + share beat. The summary list lives in the post caption instead.
| Beat | On screen | Voice (am_michael) |
|---|---|---|
| Hook (0s) | Kicker `<TOPIC> · EXPLAINED` (red) + headline `POV: …` **fully visible at frame 0**, with the problem already animating (flood, slow loading…) | "P.O.V.: … !" |
| Series card | Kicker `EXPERT IN UNDER 1 MINUTE` + `<Topic>, / expert level.` while the problem keeps playing | "Here's <topic>. Expert level, in under a minute." |
| 4–6 concept scenes | Kicker `01 · NAME` … headline 2 short lines and a progress bar under the header | One idea per scene, said as it happens on screen |
| **Follow + share (last beat, ~4.5s)** | `<ShareOutro follow line={…}>`: kicker `FOLLOW + SHARE` · `Send this / to a friend.` · "who needs to learn **<topic>**." · **Follow for more** pill + "expert in anything tech, in under 1 minute". The paper plane darts to the platform share button | "Follow for more, and send this to a friend who needs to learn <topic>!" |
| **Loop** | Last 14 frames dissolve into frame 0 (`<Frame f={0}>`), so the reel replays seamlessly | — |
| **Captions (whole video)** | `<Captions>`: word-by-word subtitles of the voice at y≈1428, ≤ 3 words per chunk, spoken word in amber. They replace the old mono sub line | — |

Show, don't tell: each concept is a **live, deterministic simulation** (precomputed in `src/sim.ts`) that visibly does the thing. Examples: packets routed by the algorithm, real LRU/TTL cache logic deciding HIT or MISS. Nothing on screen should be fake.

## Visual identity (copy from `tech-explainers/caching/src/Explainer.tsx`)
- Background `#0a0e14` with a drifting dot grid (36px), a soft radial glow, and a subtle 1–1.2% "breathing" scale on the diagram so no shot is ever static.
- Colours:
  - ink `#e9eef5`, dim `#8b98a9`, lines `#223044`
  - request/cyan `#39d0ff`, amber `#ffb020`, ok/green `#3ddc84`, bad/red `#ff4d5e`, pink `#ff6fb1`, violet `#a98bff`
- Type:
  - headline Inter 800, 76px, −2 letter-spacing, top 250, left 70
  - kicker Plex Mono 600, 27px, letter-spacing 3
  - captions Inter 800 54px, white with the spoken word in amber, on a dark pill at top 1428 (the old mono sub line is gone)
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
1. Copy `tech-explainers/db-indexes` (the newest: captions, follow + share ending, loop, no recap) to `tech-explainers/<topic>`. Rename the composition ids and the audio file names.
2. Write ~8 VO lines (hook, series, 4–5 concepts, **follow + share**) and keep total speech ≤ 46s. Aim for ~48–52s total.
   - Update `LINES` in `vo.py` (and `FIXES` for any initialisms) and run it.
   - Add `CAPTION_SUBS` for anything that should read differently from how it's spoken, e.g. `{'four twenty-nine': '429', 'ten requests': '10 requests'}`.
3. Edit the scene list in `build_timeline.py` (last concept, then `('share', 140, 26)`, no recap) and run it.
4. `python3 -I ../../tools/captions.py .` writes `src/captions.json` (word timings from the audio). **Re-run it whenever the VO or timeline changes.**
5. Rewrite `src/sim.ts` for the new topic's mechanics and `src/Explainer.tsx` scenes. Keep the shared pieces: Headline, Progress, the `Frame` + loop wrapper, `<ShareOutro follow …>` and `<Captions lines={CAPS}>` from `tech-explainers/_shared/`.
   - **Numbers must be realistic.** Developers will check them. If something needs to feel slower or bigger, find the honest version (e.g. traffic piling up into a queue) rather than inflating a figure.
   - Time any "said it, show it" beat (stamps, reveals) off `captions.json` word times, not guesses.
6. Stills sheet, then low-res draft with sound for the owner, then full render, cover and captions.
7. Add the episode to `topics.md`.

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
Both captions should also say "Send it to a friend who needs this 📤", matching the share beat at the end of the video (shares are the strongest reach signal after saves).
Push **saves** (the strongest signal for educational content). Post each new episode 1–2 days after the last one, and link the two in a comment.
