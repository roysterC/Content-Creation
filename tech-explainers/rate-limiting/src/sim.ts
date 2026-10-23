// Deterministic traffic + token-bucket simulation for the rate limiting explainer (frames @ 30fps).
// Every 429 on screen is decided by a real token bucket (capacity 10, steady refill), never faked.
import {random} from 'remotion';
import TL from './timeline.json';

export const FPS = 30;
export const S = TL;

export const COL = {
  bg: '#0a0e14',
  ink: '#e9eef5',
  dim: '#8b98a9',
  line: '#223044',
  req: '#39d0ff',
  ok: '#3ddc84',
  bad: '#ff4d5e',
  amber: '#ffb020',
  pink: '#ff6fb1',
  violet: '#a98bff',
};

// ── layout (main diagram) ──
export const CLIENTS = [
  {name: 'bot', x: 190, color: COL.bad},
  {name: 'alice', x: 400, color: COL.pink},
  {name: 'ben', x: 610, color: COL.violet},
  {name: 'cara', x: 820, color: COL.req},
];
export const CLIENT_Y = 710;
export const GATE = {x: 520, y: 955, w: 820, h: 120};
export const SERVER = {x: 540, y: 1275, w: 300, h: 190};
export const CAP = 10;

// leg durations
export const LG = 12; // client → gate
export const THRU = 3;
export const GS = 14; // gate → server
export const BOUNCE = 13; // gate → back to the client (429)
export const DIRECT = 22; // client → server (no limiter yet)

export type Outcome = 'ok' | '429' | 'timeout';
export type Pkt = {id: number; c: number; spawn: number; gated: boolean; outcome: Outcome; retryAfter?: boolean; through?: boolean};
export const decideAt = (p: Pkt) => p.spawn + LG;
export const arriveAt = (p: Pkt) => (p.gated ? p.spawn + LG + THRU + GS : p.spawn + DIRECT);
export const endAt = (p: Pkt) => (p.outcome === '429' ? decideAt(p) + BOUNCE : arriveAt(p));

// ── refill rates (tokens per frame) per scene ──
const GATE_ON = S.fix + 30;
const refillAt = (f: number) => (f < S.bucket ? 1 / 3 : f < S.window ? 1 / 8 : 1 / 30); // 10/s in the fix; slow + visible in the bucket scene; slow in retry

// ── scripted traffic ──
type Plan = {c: number; spawn: number};
const plan: Plan[] = [];
// hook + series: the bot floods straight into the server; normal users trickle in (pre-rolled so frame 0 is busy)
for (let t = -60, i = 0; t < S.fix - 4; i++) {
  plan.push({c: 0, spawn: Math.round(t)});
  t += 1.4;
}
for (const c of [1, 2, 3]) for (let t = -50 + c * 7, i = 0; t < S.fix - 4; i++, t += 16 + Math.floor(random(`u${c}${i}`) * 10)) plan.push({c, spawn: t});
// fix: the limiter is in; the bot keeps spamming at 30/s, the budget is 10/s → two in three bounce
for (let t = S.fix + 20; t < S.bucket - 20; t += 1) plan.push({c: 0, spawn: t});
for (const c of [1, 2, 3]) for (let t = S.fix + 22 + c * 5, i = 0; t < S.bucket - 20; i++, t += 16 + Math.floor(random(`f${c}${i}`) * 10)) plan.push({c, spawn: t});
// bucket: buckets reset full; alice spends single tokens, then bursts; the bot spams until it runs dry
plan.push({c: 1, spawn: S.bucket + 66}, {c: 1, spawn: S.bucket + 92});
for (let k = 0; k < 6; k++) plan.push({c: 1, spawn: S.bucket + 165 + k * 3});
for (let t = S.bucket + 150; t < S.window - 18; t += 2) plan.push({c: 0, spawn: t});
for (const c of [2, 3]) for (let t = S.bucket + 40 + c * 9; t < S.window - 18; t += 44) plan.push({c, spawn: t});
// retry: alice is out of tokens → 429 + Retry-After → waits 2s → succeeds; the bot ignores it and keeps bouncing
export const RETRY = {first: S.retry + 12, wait0: S.retry + 12 + LG + BOUNCE, again: S.retry + 12 + LG + BOUNCE + 60};
plan.push({c: 1, spawn: RETRY.first}, {c: 1, spawn: RETRY.again});
for (let t = S.retry + 4; t < S.recap - 14; t += 3) plan.push({c: 0, spawn: t});

// ── run the buckets ──
const sorted = plan.sort((a, b) => a.spawn - b.spawn || a.c - b.c);
const tokensLog: number[][] = CLIENTS.map(() => []); // tokens at each frame (for the pips + jars)
const tok = [CAP, CAP, CAP, CAP];
const decisions = new Map<number, Plan[]>();
for (const p of sorted) {
  const d = p.spawn + LG;
  if (!decisions.has(d)) decisions.set(d, []);
  decisions.get(d)!.push(p);
}
const outcome = new Map<Plan, Outcome>();
for (let f = GATE_ON; f < S.total; f++) {
  if (f === S.bucket || f === S.window) tok.fill(CAP); // each demo starts with full buckets
  if (f === S.retry) {
    tok[0] = 0;
    tok[1] = 0; // alice just burst, the bot is spamming: both empty
    tok[2] = tok[3] = CAP;
  }
  for (let c = 0; c < 4; c++) tok[c] = Math.min(CAP, tok[c] + refillAt(f));
  for (const p of decisions.get(f) ?? []) {
    if (p.spawn < S.fix || (f >= S.window && f < S.retry)) continue;
    if (tok[p.c] >= 1) {
      tok[p.c] -= 1;
      outcome.set(p, 'ok');
    } else outcome.set(p, '429');
  }
  for (let c = 0; c < 4; c++) tokensLog[c][f] = tok[c];
}

const pk: Pkt[] = [];
sorted.forEach((p, id) => {
  if (p.spawn < S.fix) {
    // no limiter: the server is swamped, so normal users time out once the flood builds up
    const overloaded = p.spawn + DIRECT >= 36;
    pk.push({id, c: p.c, spawn: p.spawn, gated: false, outcome: p.c !== 0 && overloaded ? 'timeout' : 'ok'});
  } else {
    const o = outcome.get(p) ?? 'ok';
    pk.push({id, c: p.c, spawn: p.spawn, gated: true, outcome: o, retryAfter: o === '429' && p.spawn >= S.retry, through: p.spawn >= S.bucket && p.spawn < S.window});
  }
});
export const PKTS = pk;
export const tokensAt = (c: number, f: number) => (f < GATE_ON ? CAP : tokensLog[c][Math.min(S.total - 1, Math.floor(f))] ?? CAP);
export const gateOn = GATE_ON;

/** requests the server is actually handling (for its load bar) */
export const serverLoad = (f: number) => PKTS.filter((p) => p.outcome !== '429' && arriveAt(p) <= f && arriveAt(p) > f - 20).length;

// ── shared-counter scene: one bot, three servers ──
export const SH = {
  servers: [210, 510, 810],
  y: 1010,
  redis: {x: 510, y: 1290, w: 430, h: 120},
  botX: 510,
  botY: 650,
  redisIn: S.shared + 98,
  redisOn: S.shared + 112,
};
export type ShPkt = {id: number; spawn: number; s: number; ok: boolean};
const shp: ShPkt[] = [];
{
  const local = [0, 0, 0];
  let global = 0;
  for (let t = S.shared + 8, i = 0; t < S.retry - 16; t += 4, i++) {
    const s = i % 3;
    const at = t + 14;
    let ok: boolean;
    if (at < SH.redisOn) {
      ok = local[s] < CAP;
      if (ok) local[s]++;
    } else {
      ok = global < CAP;
      if (ok) global++;
    }
    shp.push({id: i, spawn: t, s, ok});
  }
}
export const SH_PKTS = shp;
export const shArrive = (p: ShPkt) => p.spawn + 14;
export const shLocal = (s: number, f: number) => SH_PKTS.filter((p) => p.s === s && p.ok && shArrive(p) <= f && shArrive(p) < SH.redisOn).length;
export const shGlobal = (f: number) => SH_PKTS.filter((p) => p.ok && shArrive(p) >= SH.redisOn && shArrive(p) <= f).length;
export const shAllowedBeforeRedis = (f: number) => SH_PKTS.filter((p) => p.ok && shArrive(p) <= Math.min(f, SH.redisOn - 1)).length;

// ── fixed vs sliding window scene (x positions on a 0:00–2:00 axis) ──
export const W = {x0: 110, x1: 910, mid: 510};
export const BURST1 = Array.from({length: 10}).map((_, i) => 452 + i * 5.4); // 0:52 → 0:59
export const BURST2 = Array.from({length: 10}).map((_, i) => 514 + i * 5.4); // 1:00 → 1:07
/** frame at which each row's playhead reaches x (row 0 = fixed, row 1 = sliding) */
export const windowTickFrame = (row: number, x: number) =>
  row === 0 ? S.window + 10 + ((x - W.x0) / (W.x1 - W.x0)) * 110 : S.window + 150 + ((x - (BURST1[0] - 20)) / (BURST2[9] + 40 - (BURST1[0] - 20))) * 55;
