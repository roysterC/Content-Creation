// Shared timeline for the Kikai bait-and-switch reel (frames @ 30fps).
// The audio mixer reads the same reel-timeline.json.
import {CAN} from './timeline';
import opening from './opening.json';
import timeline from './reel-timeline.json'; // shared with audio-scripts/mix_bullet_reel.py

export const R = timeline;

// opening: bullet position per frame + click schedule (see audio-scripts/opening_profile.py)
const NOSE: number[] = opening.nose;
const CLICKS: {f: number; n: number}[] = opening.clicks;
export const RACE_END = opening.raceEnd;
const STALL_X = NOSE[NOSE.length - 1];

const lastClick = (f: number) => {
  let lo = 0;
  let hi = CLICKS.length;
  while (lo < hi) {
    const m = (lo + hi) >> 1;
    if (CLICKS[m].f <= f) lo = m + 1;
    else hi = m;
  }
  return lo - 1; // index of the last click at or before f (-1 = none yet)
};

/** The number on screen. */
export const reelShown = (f: number) => {
  if (f < R.stall) {
    const i = lastClick(f);
    return i < 0 ? opening.from : CLICKS[i].n;
  }
  if (f < R.resume) return 8;
  if (f >= R.impact) return 0;
  return Math.max(1, Math.ceil((8 * (R.impact - f)) / (R.impact - R.resume) - 1e-6));
};
/** Bullet nose x (world). */
export const reelNose = (f: number) => {
  if (f <= 0) return NOSE[0];
  if (f < R.stall) return NOSE[Math.floor(f)];
  if (f < R.resume) return STALL_X;
  if (f < R.impact) return STALL_X + ((CAN.x0 - STALL_X) * (f - R.resume)) / (R.impact - R.resume);
  return CAN.x0;
};
/** Bullet speed in world px per frame. */
export const reelSpeed = (f: number) => (f < R.stall - 1 && f >= 0 ? NOSE[Math.floor(f) + 1] - NOSE[Math.floor(f)] : 0);
