// Consistent hashing explainer: a deterministic simulation, every beat anchored to the spoken word.
// Servers and keys are placed by a real 32-bit hash (FNV-1a + fmix32) of their IP / key name.
// Mod-N routing, ring ownership, moved-key counts, shares and the cache hit/miss traffic are all computed, never drawn by hand.
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

export const word = (id: string, w: string, nth = 0) => {
  const l = CAPS.find((x) => x.id === id);
  const hits = l?.words.filter((x) => x.t.toLowerCase().startsWith(w.toLowerCase())) ?? [];
  if (!hits[nth]) throw new Error(`no word ${w} in ${id}`);
  return Math.round(hits[nth].s);
};

export const A = {
  add: word('hook', 'add'),
  rush: word('hook', 'rush'),
  slower: word('hook', 'slower'),
  villain: word('modn', 'villain'),
  modN: word('modn', 'mod'),
  four: word('modn', 'four'),
  five: word('modn', 'five'),
  fourIn5: word('modn', '4'),
  miss: word('modn', 'miss'),
  database: word('modn', 'database'),
  hit: word('modn', 'hit'),
  ringWord: word('ring', 'ring'),
  keysOn: word('ring', 'keys'),
  clockwise: word('ring', 'clockwise'),
  next: word('ring', 'next'),
  addRing: word('add', 'add'),
  takes: word('add', 'takes'),
  neighbour: word('add', 'neighbour'),
  oneIn5: word('add', '1'),
  not: word('add', 'not'),
  dies: word('remove', 'dies'),
  slide: word('remove', 'slide'),
  stays: word('remove', 'stays'),
  slices: word('lumpy', 'slices'),
  double: word('lumpy', 'double'),
  hundred: word('vnodes', '100'),
  virtual: word('vnodes', 'virtual'),
  even: word('vnodes', 'even'),
  cassandra: word('real', 'cassandra'),
  dynamo: word('real', 'dynamo'),
  thousands: word('real', 'thousands'),
};

// ── the hash ──
export const hash32 = (s: string) => {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35) >>> 0;
  h ^= h >>> 16;
  return h >>> 0;
};
const U = 2 ** 32;

// ── servers (placed on the ring by hash of their IP) ──
export const SERVERS = [
  {name: 'A', ip: '10.0.0.117', color: COL.req},
  {name: 'B', ip: '10.0.0.214', color: COL.pink},
  {name: 'C', ip: '10.0.0.147', color: COL.violet},
  {name: 'D', ip: '10.0.0.184', color: COL.ok},
  {name: 'E', ip: '10.0.0.26', color: COL.amber},
].map((s) => ({...s, pos: hash32(s.ip) / U}));
export const VNODES = 100;
export const VPOS = SERVERS.map((s) => Array.from({length: VNODES}, (_, k) => hash32(`${s.ip}#${k}`) / U));

// ── keys: 40 sample cache keys ──
export const KEYS = Array.from({length: 40}, (_, i) => {
  const name = `user:${1000 + i}`;
  const h = hash32(name);
  return {name, h, pos: h / U};
});

// ── mod N ──
export const ownerMod = (k: number, n: number) => KEYS[k].h % n;

// ── ring ──
type Pt = {pos: number; s: number};
export const ringPoints = (servers: number[], vnodes: boolean): Pt[] =>
  servers.flatMap((s) => (vnodes ? VPOS[s].map((pos) => ({pos, s})) : [{pos: SERVERS[s].pos, s}])).sort((a, b) => a.pos - b.pos);
export const ownerRing = (pts: Pt[], pos: number) => {
  for (const p of pts) if (p.pos >= pos) return p;
  return pts[0];
};
export const sharesOf = (pts: Pt[]) => {
  const out: Record<number, number> = {};
  pts.forEach((p, i) => {
    const prev = i > 0 ? pts[i - 1].pos : pts[pts.length - 1].pos - 1;
    out[p.s] = (out[p.s] ?? 0) + (p.pos - prev);
  });
  return out;
};

// ring states through the episode
export const RING_ADD = A.takes - 2; // E starts owning its slice
export const RING_REMOVE = A.slide - 2; // B's slice goes to its neighbour
export const RING_VNODES = A.virtual; // 100 points per server
export const ringState = (f: number) => {
  if (f >= RING_VNODES) return {servers: [0, 2, 3, 4], vnodes: true};
  if (f >= RING_REMOVE) return {servers: [0, 2, 3, 4], vnodes: false};
  if (f >= RING_ADD) return {servers: [0, 1, 2, 3, 4], vnodes: false};
  return {servers: [0, 1, 2, 3], vnodes: false};
};
const PTS_CACHE = new Map<string, Pt[]>();
export const ptsAt = (f: number) => {
  const st = ringState(f);
  const key = st.servers.join() + st.vnodes;
  if (!PTS_CACHE.has(key)) PTS_CACHE.set(key, ringPoints(st.servers, st.vnodes));
  return PTS_CACHE.get(key)!;
};
export const ringOwner = (k: number, f: number) => ownerRing(ptsAt(f), KEYS[k].pos).s;

const four = ringPoints([0, 1, 2, 3], false);
const five = ringPoints([0, 1, 2, 3, 4], false);
const noB = ringPoints([0, 2, 3, 4], false);
const vn = ringPoints([0, 2, 3, 4], true);
export const MOVED_MOD = KEYS.filter((_, k) => ownerMod(k, 4) !== ownerMod(k, 5)).length; // 33 of 40
export const MOVED_ADD = KEYS.filter((k) => ownerRing(four, k.pos).s !== ownerRing(five, k.pos).s).length; // 8 of 40
export const MOVED_REMOVE = KEYS.filter((k) => ownerRing(five, k.pos).s !== ownerRing(noB, k.pos).s).length; // only B's keys
export const SHARE_LUMPY = sharesOf(noB);
export const SHARE_VNODES = sharesOf(vn);
export const E_SHARE = sharesOf(five)[4];

// ── the row of cache servers (hook + mod N), with real hit/miss traffic ──
export const ROW_Y = 900; // top of the server boxes
export const ROW_H = 170;
export const DB = {x: 540, top: 1220, bottom: 1330, w: 300};
export const SPAWN_Y = 610;
const X4 = [190, 410, 630, 850];
const X5 = [130, 300, 470, 640, 810];
const sm = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
// E joins the row twice: once in the hook (the symptom), once in the replay (the cause)
export const RUNS = [
  {start: -70, join: A.add - 4, sw: A.add + 14, end: S.modn},
  {start: S.modn + 4, join: A.five - 10, sw: A.five + 6, end: S.ring},
];
export const runAt = (f: number) => (f < S.modn ? 0 : 1);
export const rowN5 = (f: number) => {
  const r = RUNS[runAt(f)];
  return f < S.modn ? sm((f - r.join) / 14) * (1 - 0) : f < S.modn + 14 ? 1 - sm((f - S.modn) / 14) : sm((f - r.join) / 14);
};
export const rowX = (i: number, f: number) => {
  const t = rowN5(f);
  if (i === 4) return 1180 + (X5[4] - 1180) * t;
  return X4[i] + (X5[i] - X4[i]) * t;
};
export const rowW = (f: number) => 150 - 14 * rowN5(f);
export const modAt = (f: number) => (f >= RUNS[runAt(f)].sw ? 5 : 4);

export const LEG = 16; // spawn → server, server → DB
export type Req = {i: number; run: number; spawn: number; x0: number; key: number; decide: number; server: number; hit: boolean; dbArrive: number; dbDone: number};
export const REQS: Req[] = (() => {
  const out: Req[] = [];
  let i = 0;
  RUNS.forEach((r, run) => {
    // the cache is warm under mod 4: every key cached on its mod-4 server
    const cached: {server: number; from: number}[] = KEYS.map((_, k) => ({server: ownerMod(k, 4), from: -1e9}));
    const misses: number[] = [];
    for (let t = r.start; t < r.end - LEG * 2; i++) {
      const spawn = Math.round(t);
      const fresh = random(`fresh${i}`) < 0.05; // ~5% of requests are for keys never seen before: a normal cache miss
      const key = Math.floor(random(`key${i}`) * KEYS.length);
      const decide = spawn + LEG;
      const n = decide >= r.sw ? 5 : 4;
      const server = KEYS[key].h % n;
      const c = cached[key];
      const hit = !fresh && c.server === server && c.from <= decide;
      let dbArrive = -1;
      let dbDone = -1;
      if (!hit) {
        dbArrive = decide + LEG;
        // the database slows down as misses pile in: latency grows with its recent load
        const recent = misses.filter((m) => m > dbArrive - 40).length;
        dbDone = dbArrive + 10 + recent * 6;
        misses.push(dbArrive);
        if (!fresh) cached[key] = {server, from: dbDone};
      }
      out.push({i, run, spawn, x0: 150 + random(`x${i}`) * 780, key, decide, server, hit, dbArrive, dbDone});
      t += 0.9 + 0.5 * random(`dt${i}`);
    }
  });
  return out;
})();
// cache state of a key at frame f (for the dots inside each server box)
export const keyCachedAt = (k: number, f: number) => {
  const run = runAt(f);
  const r = RUNS[run];
  const n = modAt(f);
  const server = KEYS[k].h % n;
  if (n === 4) return true;
  // moved keys are empty until a miss brings them back from the database
  if (ownerMod(k, 4) === ownerMod(k, 5)) return true;
  return REQS.some((q) => q.run === run && q.key === k && !q.hit && q.server === server && q.dbDone <= f && q.decide >= r.sw);
};
export const hitRate = (f: number) => {
  const run = runAt(f);
  const done = REQS.filter((q) => q.run === run && q.decide <= f).slice(-40);
  if (!done.length) return 95;
  return Math.round((done.filter((q) => q.hit).length / done.length) * 100);
};
export const dbLoad = (f: number) => {
  const run = runAt(f);
  let s = 0;
  for (const q of REQS) if (q.run === run && !q.hit && q.dbArrive <= f && q.dbArrive > f - 40) s += 1 - (f - q.dbArrive) / 40;
  return Math.min(100, Math.round((s / 9) * 100));
};

// ── ring geometry ──
export const RING = {x: 540, y: 1030, r: 330};
export const ang = (pos: number) => pos * Math.PI * 2 - Math.PI / 2; // 0 at the top, clockwise
export const onRing = (pos: number, r = RING.r) => ({x: RING.x + Math.cos(ang(pos)) * r, y: RING.y + Math.sin(ang(pos)) * r});
export const MORPH = {a: S.ring + 2, b: S.ring + 26}; // the row bends into the ring

// featured key: walks clockwise to its server
export const FEATURE = (() => {
  let best = 0;
  let bd = -1;
  KEYS.forEach((k, i) => {
    const o = ownerRing(four, k.pos);
    const d = (o.pos - k.pos + 1) % 1;
    if (d > 0.08 && d < 0.22 && d > bd) {
      best = i;
      bd = d;
    }
  });
  return best;
})();

// lookups pinging around the ring: a key lights up and its request walks clockwise to the owner
export const LOOKUPS = (() => {
  const out: {at: number; key: number}[] = [];
  for (let t = MORPH.b + 4, i = 0; t < S.total; i++, t += 7 + Math.floor(random(`lk${i}`) * 5)) out.push({at: t, key: Math.floor(random(`lkk${i}`) * KEYS.length)});
  return out;
})();
