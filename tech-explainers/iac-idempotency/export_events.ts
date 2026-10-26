// Dumps exact event timings so mix.py can sync sounds to them.
// Run from this folder:  npx esbuild export_events.ts --bundle --platform=node --format=cjs --outfile=out/export.cjs --log-level=error && node out/export.cjs > out/events.json
import {A, NO_CHANGE_RUNS, OUT, S, WORLDS} from './src/sim';
console.log(
  JSON.stringify({
    S,
    A,
    out: OUT.filter((o) => o.at >= 0).map((o) => ({at: o.at, c: o.c ?? 'cmd'})),
    births: WORLDS.flatMap((w) => w.servers.filter((s) => s.born >= 0).map((s) => ({at: s.born, dup: s.dup}))),
    noChange: NO_CHANGE_RUNS,
  }),
);
