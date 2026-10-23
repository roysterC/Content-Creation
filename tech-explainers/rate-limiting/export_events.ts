// Dumps exact event timings so mix.py can sync sounds to them.
// Run from this folder:  npx esbuild export_events.ts --bundle --platform=node --format=cjs --outfile=out/export.cjs --log-level=error && node out/export.cjs > out/events.json
import {PKTS, decideAt, arriveAt, S, SH, SH_PKTS, shArrive, BURST1, BURST2, windowTickFrame, RETRY, tokensAt} from './src/sim';
const firstEmpty = (() => {
  for (let f = S.bucket + 20; f < S.window; f++) if (tokensAt(0, f) < 1) return f;
  return -1;
})();
console.log(
  JSON.stringify({
    S,
    pkts: PKTS.map((p) => ({c: p.c, spawn: p.spawn, decide: decideAt(p), arrive: arriveAt(p), outcome: p.outcome, gated: p.gated, retryAfter: !!p.retryAfter})),
    shared: SH_PKTS.map((p) => ({spawn: p.spawn, arrive: shArrive(p), s: p.s, ok: p.ok})),
    redisIn: SH.redisIn,
    window: [
      ...[...BURST1, ...BURST2].map((x, k) => ({f: windowTickFrame(0, x), ok: true, row: 0, k})),
      ...[...BURST1, ...BURST2].map((x, k) => ({f: windowTickFrame(1, x), ok: k < 10, row: 1, k})),
    ],
    bucketEmpty: firstEmpty,
    retry: RETRY,
  }),
);
