import vo from './vo-timing.json';

export const FPS = 30;
type Clip = keyof typeof vo;
/** Clip length in frames. */
export const F = (id: Clip) => Math.ceil(vo[id] * FPS);

export const HOOK = (() => {
  const voAt = 3;
  return {voAt, rings: voAt + F('hook') - 16, dur: voAt + F('hook') + 10};
})();

export const PROBLEM = (() => {
  const notifStagger = 8;
  const slam = 30;
  const gone = slam + F('problem1') + 2;
  return {notifStagger, slam, gone, dur: gone + F('problem2') + 14};
})();

export const REVEAL = (() => {
  const voAt = 3;
  const line2 = voAt + F('reveal1') + 3;
  return {voAt, line2, dur: line2 + F('reveal2') + 14};
})();

export const CALL = (() => {
  const introAt = 6;
  let t = introAt + F('callIntro') + 4;
  const msgs = (['msg0', 'msg1', 'msg2'] as const).map((id) => {
    const m = {id, at: t, len: F(id)};
    t += m.len + 4;
    return m;
  });
  const toast = t;
  return {introAt, msgs, toast, dur: toast + 30};
})();

export const DIARY = {voAt: 2, drop: 16, dur: Math.max(70, 2 + F('diary') + 22)};

export const AWKWARD = {voAt: 2, beat: 40, dur: 120};

export const STATS = (() => {
  let t = 0;
  const beats = (['stat0', 'stat1', 'stat2', 'stat3'] as const).map((id) => {
    const b = {id, at: t, len: Math.max(30, F(id) + 6)};
    t += b.len;
    return b;
  });
  return {beats, dur: t};
})();

export const CTA = (() => {
  const l1 = 0;
  const l2 = l1 + F('cta1') + 2;
  const l3 = l2 + F('cta2') + 4;
  return {l1, l2, l3, dur: l3 + F('cta3') + 32};
})();

export const SCENE_DURS = [HOOK.dur, PROBLEM.dur, REVEAL.dur, CALL.dur, DIARY.dur, AWKWARD.dur, STATS.dur, CTA.dur];
export const TRANSITIONS = [6, 10, 10, 10, 10, 6, 10];
/** Which transitions are whip-pans or slams (get a whoosh). */
export const WHOOSH_AT = [1, 3, 4];

export const SCENE_STARTS = SCENE_DURS.map((_, i) =>
  SCENE_DURS.slice(0, i).reduce((a, b) => a + b, 0) - TRANSITIONS.slice(0, i).reduce((a, b) => a + b, 0),
);
export const TOTAL = SCENE_STARTS[SCENE_STARTS.length - 1] + SCENE_DURS[SCENE_DURS.length - 1];
