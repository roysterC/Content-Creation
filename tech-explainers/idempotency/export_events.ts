// Dumps exact event timings so mix.py can sync sounds to them.
// Run from this folder:  npx esbuild export_events.ts --bundle --platform=node --format=cjs --outfile=out/export.cjs --log-level=error && node out/export.cjs > out/events.json
import {A, RUN, S, WORLDS} from './src/sim';
console.log(
  JSON.stringify({
    S,
    A,
    rewinds: WORLDS.slice(1).map((w) => w.from),
    evs: RUN.flatMap((r) => r.evs.map((e) => ({tap: e.tap, arrive: e.arrive, charged: e.charged, outcome: e.outcome, leave: e.respLeave, back: e.respArrive, lost: e.lost, status: e.status}))),
    charges: RUN.flatMap((r) => r.ledger.map((c, i) => ({at: c.at, dup: i > 0}))),
  }),
);
