// Shared timing for the bullet hook (the audio script mirrors these numbers).
export const FPS = 30;
export const TOTAL = 300; // 10 s
export const IMPACT = 225; // frame of impact (7.5 s)
export const START_COUNT = 300;
export const EXP = 2.2; // countdown slows as it nears zero

/** Continuous "frames to impact" at video frame f. */
export const countAt = (f: number) => (f >= IMPACT ? 0 : START_COUNT * Math.pow((IMPACT - f) / IMPACT, EXP));
/** What the counter displays. */
export const shownCount = (f: number) => (f >= IMPACT ? 0 : Math.max(1, Math.ceil(countAt(f))));

// world geometry (close-up frame = scale 1)
export const CAN = {x0: 563, x1: 987, top: 640, bottom: 1391};
export const CAN_CX = (CAN.x0 + CAN.x1) / 2;
export const BULLET_Y = 992;
export const PX_PER_COUNT = 3.6;
export const noseX = (f: number) => CAN.x0 - countAt(f) * PX_PER_COUNT;
