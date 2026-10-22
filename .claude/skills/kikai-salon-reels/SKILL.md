---
name: kikai-salon-reels
description: Make social videos, covers and captions for Kikai, the AI receptionist for UK hair salons (kikaiagency.vercel.app), aimed at salon owners with the "Comment BOOK for a free demo" CTA. Use for any Kikai or salon-account content.
---

# Kikai salon reels

Use with `reel-production` (pipeline, voice, mix, checks). Projects: `kikai-salon/`.

## Brand
- **Kikai**, the AI receptionist for UK salons. It answers salon calls day or night, handles questions and books appointments into the diary. Website: kikaiagency.vercel.app, with copy and images that can be reused. The owner calls it "our" project.
- Audience: **UK hair salon owners and stylists**. They're busy, often mid-appointment with their hands full, and they lose bookings to missed calls.
- This account is completely separate from the tech explainer page. Never use the explainer page's style, POV-series card or "follow for system design" lines here.

## CTA (use it everywhere)
- In the video: a small persistent tag, **Comment “BOOK” for a free demo**, from the moment Kikai appears until the end card, plus a pill on the end card and the line in the voiceover.
- Caption first line: "Comment BOOK for a free demo 👇". Also pin a comment saying the same, and set up an auto-DM on the keyword **BOOK** that sends the demo link (e.g. ManyChat on Instagram).

## Claims
- No absolute promises. "Every single time" was replaced with **"Day or night."** Avoid "never miss a call" style absolutes unless the owner confirms them.

## Voice and look
- Voice: Kokoro **`af_heart`** (expressive American female), en-us. The owner chose American over British because it's more familiar. Fix the pronunciation of Kikai: `'kˈɪkaɪ': 'kˈiːkaɪ'`.
- Stylised beats hyper-realistic. The owner said hyper-realism "isn't your strong suit", so lean on clean motion design and illustration.
- Bullet reel look: warm off-white background, chrome Kikai can, brass bullet, HUD ("REC", "100,000 FPS"), Inter + Plex Mono, red accent.
- The owner likes:
  - frame-synced audio, e.g. one click per countdown number
  - a soft bed rather than buzzy drones, with ticks louder than the bed
  - a clear "bad → good" audio switch: tense, then upbeat house at 120 BPM when Kikai appears
  - the music drop landing exactly on the payoff

## Projects
- `bullet-reel/`: bait-and-switch "bullet about to hit a can" reel (adapted from a Motion Theory reel, rebranded). v7 is 28.3s.
  - Opening: countdown from 200, with a 30/s click rattle while the bullet races, then one click per number as it slows (`opening_profile.py`).
  - VO beats: "You just watched a bullet for seven seconds" → wireframe "doesn't even exist" → phone rings → missed call → "Kikai picks up. Day or night." → impact on the drop → end card.
- `kinetic-ad/`: the first kinetic-type promo, with VO and music-only versions.
- `hands-full/`: the "Hands Full" 30s illustrated ad (stylist mid-colour while the phone rings).
- `hook-storyboards/`: six still storyboards of anticipation hooks (`./still.sh HookN`).
- `free-consult/`: 29s offer reel for a **free consultation**. Its CTA is **Comment “FREE” for a free consultation** (keyword FREE, not BOOK, so it needs its own auto-DM). Reuses the Hands Full art. Beats: frame-0 headline "Salon owners: how many calls did you miss today?" over the busy salon with the phone ringing → missed-call cards stack with a red counter, one thunk per card → cards fly to "The Salon Down the Road" and get booked there → the same desk shot, now answered by Kikai (house music on the beat) → after hours, then the diary filling → the drop lands on "FREE consultation" → end card. `plan.py` puts the drop at the pause in line 6 and puts the switch and end card on the 120 BPM grid. `./storyboard.sh [frames]` renders a stills sheet.

## Results log and lessons
**Bullet reel v7 (Instagram, first ~2 hours):**
- 111 views / 61 viewers, avg watch 10s, 3s hold about 27%, 8 likes, 1 comment, 0 saves, 0 follows.
- Retention dropped 100% → ~30% within 2 seconds, then plateaued around 22% through the countdown, with only a small dip at the 8s switch and ~10% watching to the end.
- Over half the views came from the Reels tab (non-followers).

**Diagnosis:** the body works and the **first 2 seconds don't**. Frame 0 was a small bullet and can on empty beige with no text, so nothing signalled "this is for salon owners", and sound-off viewers missed the ticking tension.

**Rules for the next Kikai video:**
- Put salon-specific **text on frame 0** (e.g. "Salon owners: can you watch this for 7 seconds?").
- Open close and already moving.
- Use a custom cover with the hook text.
- Test openings with Instagram trial reels.
- Consider a small paid boost targeted at UK hairdressers and salon owners, since a new account gets little organic reach.
- The *Hands Full* ad (salon-native hook) is a good next post.

Add new results here after each post: views, 3s hold, avg watch, where the retention graph drops, comments on BOOK.

## Caption template (Instagram)
```
Comment BOOK for a free demo 👇

<hook line tied to the video>

<the pain: missed calls while you're mid-colour → clients ring the next salon>

Kikai is the AI receptionist for UK salons. It answers your calls day or night, handles questions and books appointments straight into your diary, so you can stay with the client in your chair.

💬 Comment BOOK and we'll DM you a free demo.

#salonowner #hairsalon #ukhairdresser #salonlife #hairstylistuk #salonbusiness #aireceptionist #smallbusinessuk
```
TikTok: a shorter version with the CTA first, plus #salontok.
