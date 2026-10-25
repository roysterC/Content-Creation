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

## Episode structure: hook → lead → value with open loops (from message queues, #5, onwards)

The owner's retention formula, after the data showed people leaving at end cards (recap, follow/share) and
rate limiting (villain hook, early payoff) beating the rest on TikTok (65% 3s hold, 15.8s avg watch vs 50–60% / 11–13s):

| Beat | What it does | Example (message queues) |
|---|---|---|
| **Hook (0–3s)** | A **relatable** POV moment everyone has lived, not just devs. Visible and moving at frame 0 | "POV: you click Pay on Black Friday… and the page just spins." |
| **Lead (3–12s)** | Gets viewers past the point where they'd swipe: names the real cause and **promises a reveal** | "That's not your Wi-Fi. It's a traffic jam in their servers, and every big app fixes it the same way." |
| **Value beats** | Real, information-rich explanation, each a live simulation. **First visual payoff by ~12–15s** | the serial checkout stuck on a 2.5 s warehouse step |
| **Open loop after each value beat** | ONE line of curiosity that the next beat answers, so there's never a natural place to leave. Gets a soft rising "suspense" sting | "But what if most of that could wait?" · "But what if a worker crashes halfway?" · "Which means a message can run twice…" |
| **Series teaser (optional)** | An open loop to a later episode on the list | "Full episode on that soon." (idempotency, #12) |
| **Payoff line → loop** | End on the satisfying line that returns to the hook, then the last 14 frames dissolve into frame 0 | "And that spinner? Gone." → back to the spinner |

**No end cards in the video: no recap, no follow/share.** Viewers leave on cue and it hurts completion.
The asks live in the **post caption** and a **pinned comment** instead (e.g. "Part 2 on idempotency coming 👀 follow so you don't miss it").
Don't shorten for its own sake. The owner wants episodes information-rich for the people who stay (~55–58s is fine, < 60s).

Also give the problem a **character or villain** where you can (the bot, the shopper, the crashing worker, the duplicate parcel). That was rate limiting's edge.

Always:
- **Captions** for the whole video (`<Captions>` at y≈1428, ≤ 3 words per chunk, spoken word in amber).
- A kicker + 2-line headline per beat (`01 · NAME` …) and the progress bar under the header.

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
1. Copy `tech-explainers/message-queues` (the newest: hook → lead → value + open loops, captions, loop, no end cards) to `tech-explainers/<topic>`. Rename the composition ids and the audio file names.
2. Write the VO as separate lines: hook, lead, then value / open-loop pairs, ending on the payoff line. Keep total speech ≤ 53s so the video stays under 60s.
   - Update `LINES` in `vo.py` (and `FIXES` for any initialisms) and run it.
   - Add `CAPTION_SUBS` for anything that should read differently from how it's spoken, e.g. `{'four twenty-nine': '429', 'ten requests': '10 requests'}`.
3. Edit the scene list in `build_timeline.py` (each line is a scene; open-loop lines get a short lead-in/tail so the answer snaps in) and run it.
4. `python3 -I ../../tools/captions.py .` writes `src/captions.json` (word timings from the audio). **Re-run it whenever the VO or timeline changes.**
5. Rewrite `src/sim.ts` for the new topic's mechanics and `src/Explainer.tsx` scenes. Keep the shared pieces: Headline, Progress, the `Frame` + loop wrapper and `<Captions lines={CAPS}>` from `tech-explainers/_shared/`. `<ShareOutro>` is retired from the video.
   - **Numbers must be realistic.** Developers will check them. Use real-world figures (e.g. a 1M-row scan ≈ 150 ms, an indexed lookup ≈ 0.1 ms) rather than inflating them for drama.
   - **Keep the first screen simple:** headline, the visual and at most two stats. The owner rejected a busier hook panel (queue, response time, etc.) as too many numbers and words.
   - Time any "said it, show it" beat (stamps, reveals) off `captions.json` word times, not guesses.
6. Stills sheet, then low-res draft with sound for the owner, then full render, cover and captions.
7. Add the episode to `topics.md`.

## Cover (`Cover` composition)
Amber pill `EXPERT IN UNDER 1 MIN`, the topic in giant Inter 800 (158–190px), the POV line in mono under it, and the hook's most dramatic frame below (the 503 crash, the 4-second load…). Keep everything inside y 240–1680 for the Instagram grid crop.

## Captions (post text: this is where the CTAs live now)
Instagram:
```
POV: <hook>… <punchline>. <emoji>

Here's <topic>, in under a minute:

<emoji> <concept>: <one line>   (×4–5)

Save this for your next system design interview 📌
Send it to a friend who needs this 📤
Follow to be an expert in anything tech, in under 1 minute.

#systemdesign #softwareengineering #backend #<topic> #programming #techexplained #codinginterview #learntocode …
```
TikTok: one line hook + "explained in under a minute. Save it 📌 Send it to a friend 📤" + 6 hashtags.
**Pinned comment:** an open loop to the next episode ("Part 2 on <next topic> coming 👀 follow so you don't miss it").
Push **saves** (the strongest signal for educational content). Post each new episode 1–2 days after the last one, and link the two in a comment. On TikTok, reply to comments with video replies while a post is hot.
