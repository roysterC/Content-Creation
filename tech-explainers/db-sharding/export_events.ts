// Dumps exact event timings so mix.py can sync sounds to them.
// Run from this folder:  npx esbuild export_events.ts --bundle --platform=node --format=cjs --outfile=out/export.cjs --log-level=error && node out/export.cjs > out/events.json
import {A, arriveAt, atRouter, gatherArrive, L1, L2, MERGED, PILLS, PKTS, ROUTER_ON, S, scatterArrive, SCATTER, CACHE_ON, RESHARD} from './src/sim';
console.log(
  JSON.stringify({
    S,
    A,
    routerOn: ROUTER_ON,
    cacheOn: CACHE_ON,
    reshard: RESHARD,
    pkts: PKTS.map((p) => ({spawn: p.spawn, router: atRouter(p), arrive: arriveAt(p), direct: p.direct, target: p.target, toCache: p.toCache, kind: p.kind})),
    pills: PILLS.map((p) => ({router: p.spawn + L1, leave: p.leave, arrive: p.leave + L2, shard: p.shard})),
    scatter: [0, 1, 2, 3].map((i) => ({leave: SCATTER + i * 2, arrive: scatterArrive(i), back: gatherArrive(i)})),
    merged: MERGED,
  }),
);
