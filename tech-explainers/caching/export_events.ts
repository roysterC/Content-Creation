// Dumps the exact request timings so mix.py can sync sounds to them.
// Run from this folder:  npx esbuild export_events.ts --bundle --platform=node --format=cjs --outfile=out/export.cjs --log-level=error && node out/export.cjs > out/events.json
import {REQS, SLOT_LOG, S, PRICE_CHANGE, PRICE_EXPIRES} from './src/sim';
console.log(JSON.stringify({S, PRICE_CHANGE, PRICE_EXPIRES, reqs: REQS, evictions: SLOT_LOG.filter((e) => e.slot && e.slot.evictedKey).map((e) => e.f)}));
