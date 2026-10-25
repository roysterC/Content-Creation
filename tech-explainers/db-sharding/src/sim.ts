// Database sharding explainer: a deterministic traffic + storage simulation, every beat anchored to the spoken word.
// Every route on screen is decided by the real rule of that moment (one DB → id mod 4 → by range → id mod 4 → id mod 5),
// every load meter counts the requests that actually landed on that shard, and the resharding move is real modular arithmetic.
import {random} from 'remotion';
import TL from './timeline.json';
import CAPS from './captions.json';

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
export const SHARD_COL = [COL.req, COL.pink, COL.violet, COL.ok, COL.amber];

export const word = (id: string, w: string, nth = 0) => {
  const l = CAPS.find((x) => x.id === id);
  const hits = l?.words.filter((x) => x.t.toLowerCase().startsWith(w.toLowerCase())) ?? [];
  if (!hits[nth]) throw new Error(`no word ${w} in ${id}`);
  return Math.round(hits[nth].s);
};

export const A = {
  oneDb: word('hook', 'one'),
  split: word('fix', 'split'),
  shards: word('fix', 'shards'),
  router: word('key', 'router'),
  hashes: word('key', 'hashes'),
  mod4: word('key', 'mod'),
  same: word('key', 'same'),
  every: word('key', 'every'),
  first: word('range', 'first'),
  next: word('range', 'next'),
  but: word('range', 'but'),
  newUsers: word('range', 'new'),
  last: word('range', 'last'),
  hotKey: word('hot', 'hot'),
  star: word('hot', 'star'),
  millions: word('hot', 'millions'),
  oneShard: word('hot', 'one'),
  cache: word('hot', 'cache'),
  top: word('cross', 'top'),
  asking: word('cross', 'asking'),
  merging: word('cross', 'merging'),
  fifth: word('reshard', 'fifth'),
  mod5: word('reshard', 'mod'),
  moves: word('reshard', 'moves'),
  fourIn5: word('reshard', '4'),
  consistent: word('reshard', 'consistent'),
  episode: word('reshard', 'episode'),
  payoff: word('payoff', '100'),
  all: word('payoff', 'all'),
};

// ── layout ──
export const SPAWN_Y = 590;
export const ROUTER = {x: 540, y: 790, w: 480, h: 110};
export const DB = {x: 540, top: 990, bottom: 1300, w: 480}; // the single database (hook)
export const SHARD = {top: 1000, bottom: 1300};
const X4 = [175, 395, 615, 835];
const X5 = [125, 300, 475, 650, 825];
const ease = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
export const SPLIT_END = A.split + 24;
export const ROUTER_ON = A.split + 30;
export const RESHARD = {a: A.fifth - 4, b: A.fifth + 20};
export const splitT = (f: number) => ease((f - A.split) / (SPLIT_END - A.split));
export const reshardT = (f: number) => ease((f - RESHARD.a) / (RESHARD.b - RESHARD.a));
export const shardX = (i: number, f: number) => {
  const r = reshardT(f);
  if (i === 4) return 1180 + (X5[4] - 1180) * r;
  const x4 = 540 + (X4[i] - 540) * splitT(f);
  return x4 + (X5[i] - x4) * r;
};
export const shardW = (f: number) => 170 - 20 * reshardT(f);
export const nShards = (f: number) => (f >= RESHARD.a ? 5 : 4);

// ── routing rule at the moment a request reaches the router ──
export const RANGE_ON = A.first - 4;
export const RANGE_OFF = S.hot;
export type Rule = 'mod4' | 'range' | 'mod5';
export const ruleAt = (f: number): Rule => (f >= A.mod5 ? 'mod5' : f >= RANGE_ON && f < RANGE_OFF ? 'range' : 'mod4');
export const RANGE_SIZE = 25_000_000;
export const route = (id: number, f: number) => {
  const r = ruleAt(f);
  if (r === 'range') return Math.min(3, Math.floor(id / RANGE_SIZE));
  return id % (r === 'mod5' ? 5 : 4);
};

// ── the hot key and its cache ──
export const STAR_ID = 4409; // 4409 mod 4 = 1
export const STAR_SHARD = STAR_ID % 4;
export const CACHE_ON = A.cache - 2;
export const CACHE_OFF = S.cross + 24;
export const CACHE_Y = 938;

// ── traffic ──
export const L1 = 15; // spawn → router
export const L2 = 15; // router → shard
export const DIRECT = 26; // spawn → the single database
export type Kind = 'user' | 'signup' | 'fan';
export type Pkt = {i: number; spawn: number; x0: number; kind: Kind; id: number; direct: boolean; target: number; toCache: boolean};
export const atRouter = (p: Pkt) => p.spawn + L1;
export const arriveAt = (p: Pkt) => (p.direct ? p.spawn + DIRECT : p.spawn + L1 + (p.toCache ? 8 : L2));

const rate = (f: number) => {
  // frames between ordinary user requests in each scene
  if (f < A.split - DIRECT + 6) return 1.0; // hook + series: one DB takes everything
  if (f < ROUTER_ON - L1) return Infinity; // the split itself: a beat of silence while the data moves
  if (f < S.key) return 1.4;
  if (f < S.range) return 4;
  if (f < A.newUsers - 10) return 1.5;
  if (f < S.hot) return 5; // new sign-ups dominate (below)
  if (f < S.reshard) return 4.5;
  if (f < S.payoff) return 4;
  return 1.3;
};
export const PKTS: Pkt[] = (() => {
  const out: Pkt[] = [];
  let i = 0;
  const add = (spawn: number, kind: Kind, id: number) => {
    const s = Math.round(spawn);
    const direct = s + L1 < ROUTER_ON;
    const x0 = 150 + random(`x${i}`) * 780;
    const target = direct ? -1 : kind === 'fan' ? STAR_SHARD : route(id, s + L1);
    const toCache = kind === 'fan' && s + L1 >= CACHE_ON && s + L1 < CACHE_OFF;
    out.push({i, spawn: s, x0, kind, id, direct, target, toCache});
    i++;
  };
  for (let t = -90; t < S.total - 30; ) {
    const r = rate(t);
    if (r === Infinity) {
      t = ROUTER_ON - L1;
      continue;
    }
    add(t, 'user', Math.floor(random(`id${i}`) * 99_999_999));
    t += r * (0.7 + 0.6 * random(`dt${i}`));
  }
  // range: every new sign-up gets the newest (highest) id → the last shard
  for (let t = A.newUsers - 12, k = 0; t < S.hot - L1 - 2; k++, t += 1.1) add(t, 'signup', 100_000_001 + k * 37);
  // the hot key: a flood of fans asking for the star's post
  for (let t = A.millions - 14, k = 0; t < S.cross + 4; k++, t += 0.75) add(t, 'fan', STAR_ID);
  return out.sort((a, b) => a.spawn - b.spawn);
})();

// load = requests that landed on a shard over the last 40 frames (weighted), as a % of what one database can take
const ARR: number[][] = [[], [], [], [], [], []]; // index 5 = the single DB
for (const p of PKTS) if (!p.toCache) ARR[p.direct ? 5 : p.target].push(arriveAt(p));
const CAP = 15.5;
export const loadAt = (target: number, f: number) => {
  let s = 0;
  for (const a of ARR[target === -1 ? 5 : target]) {
    if (a > f) break;
    if (a > f - 40) s += 1 - (f - a) / 40;
  }
  return Math.min(100, Math.round((s / CAP) * 100));
};

// ── stored users: 40 sample accounts, ids 1000–1039 ──
export const STORED = Array.from({length: 40}, (_, k) => 1000 + k);
// slot inside its shard under mod 4, and under mod 5 (users that don't move keep their slot)
export const slot4 = (id: number) => Math.floor((id - 1000) / 4);
export const MOVES = STORED.filter((id) => id % 4 !== id % 5).length; // 32 of 40: four in five users move
export const slot5 = (() => {
  const m: Record<number, number> = {};
  const used: Set<number>[] = [0, 1, 2, 3, 4].map(() => new Set());
  for (const id of STORED)
    if (id % 4 === id % 5) {
      m[id] = slot4(id);
      used[id % 5].add(m[id]);
    }
  for (const id of STORED)
    if (id % 4 !== id % 5) {
      let s = 0;
      while (used[id % 5].has(s)) s++;
      m[id] = s;
      used[id % 5].add(s);
    }
  return m;
})();

// ── featured requests (labelled pills) ──
export type Pill = {label: string; id: number; spawn: number; leave: number; shard: number; note?: string};
export const PILLS: Pill[] = [
  {label: 'user 1042', id: 1042, spawn: A.router + 2, leave: A.mod4 + 16, shard: 1042 % 4},
  {label: 'user 1042', id: 1042, spawn: A.same - 6, leave: A.same + 18, shard: 1042 % 4, note: 'same shard ✓'},
  {label: '★ cricket star', id: STAR_ID, spawn: A.star - 18, leave: A.star + 6, shard: STAR_SHARD},
];

// ── cross-shard query: scatter to every shard, gather, merge ──
export const SCATTER = A.asking - 6;
export const REPLY_LAT = [4, 8, 6, 12]; // the slowest shard sets the pace
export const scatterArrive = (i: number) => SCATTER + i * 2 + 16;
export const gatherLeave = (i: number) => scatterArrive(i) + REPLY_LAT[i];
export const gatherArrive = (i: number) => gatherLeave(i) + 16;
export const MERGED = Math.max(...[0, 1, 2, 3].map(gatherArrive));

// users counter (two stats on the first screen: users + CPU)
export const users = (f: number) => (f < 60 ? 99_940_000 + f * 1000 : 100_000_000 + (f - 60) * 7);
