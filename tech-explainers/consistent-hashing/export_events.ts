// Dumps exact event timings so mix.py can sync sounds to them.
// Run from this folder:  npx esbuild export_events.ts --bundle --platform=node --format=cjs --outfile=out/export.cjs --log-level=error --alias:remotion=../../node_modules/remotion && node out/export.cjs > out/events.json
import {A, LOOKUPS, MORPH, REQS, RING_ADD, RING_REMOVE, RING_VNODES, RUNS, S, KEYS, ptsAt, ownerRing} from './src/sim';
const walk = (k: number, f: number) => {
  const o = ownerRing(ptsAt(f), KEYS[k].pos);
  let d = o.pos - KEYS[k].pos;
  if (d < 0) d += 1;
  return {s: o.s, d};
};
console.log(
  JSON.stringify({
    S,
    A,
    morph: MORPH,
    runs: RUNS,
    ringAdd: RING_ADD,
    ringRemove: RING_REMOVE,
    ringVnodes: RING_VNODES,
    reqs: REQS.map((q) => ({decide: q.decide, hit: q.hit, db: q.dbArrive, s: q.server})),
    lookups: LOOKUPS.filter((l) => l.at < S.payoff && !(l.at >= A.clockwise - 10 && l.at < A.next + 30)).map((l) => {
      const w = walk(l.key, l.at);
      return {at: l.at, end: l.at + 6 + w.d * 40, s: w.s};
    }),
  }),
);
