// Dumps exact event timings so mix.py can sync sounds to them.
// Run from this folder:  npx esbuild export_events.ts --bundle --platform=node --format=cjs --outfile=out/export.cjs --log-level=error && node out/export.cjs > out/events.json
import {A, BADGES, BUILD, CHARGES, DRIVERS, H1, H2, H3, ON_PRESSES, ORDERS, PKTS, PKT_DUR, RUNS_SET, RUNS_SUB, S, TOGGLE_PRESSES} from './src/sim';
console.log(
  JSON.stringify({
    S, A, H1, H2, H3, PKT_DUR,
    build: Object.values(BUILD),
    pkts: PKTS.map((p) => ({at: p.at, lost: !!p.lost, bad: p.col === '#ff4d5e'})),
    rows: [...ORDERS, ...DRIVERS, ...CHARGES].map((r) => ({at: r.at, bad: !!r.bad, good: !!r.good})),
    on: ON_PRESSES, toggle: TOGGLE_PRESSES, runs: [...RUNS_SET, ...RUNS_SUB],
    badges: BADGES.map((b) => b.at),
  }),
);
