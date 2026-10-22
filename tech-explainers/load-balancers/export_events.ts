// Dumps the exact packet schedule so mix.py can sync sounds to it.
// Run from this folder:  npx esbuild export_events.ts --bundle --platform=node --format=cjs --outfile=out/export.cjs --log-level=error && node out/export.cjs > out/packets.json
import {PACKETS, arrival, S, FAIL_AT, DETECT_AT} from './src/sim';
console.log(JSON.stringify({S, FAIL_AT, DETECT_AT, packets: PACKETS.map((p) => ({spawn: p.spawn, arr: arrival(p), target: p.target, fail: !!p.fail, direct: p.direct, label: p.label ?? null}))}));
