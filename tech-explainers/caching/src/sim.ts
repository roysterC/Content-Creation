// Deterministic request + cache simulation for the caching explainer (frames @ 30fps).
// Requests are scripted per scene; whether each one HITs or MISSes is decided by a real
// LRU + TTL cache simulation, so the picture is always telling the truth.
import {random} from 'remotion';
import TL from './timeline.json';

export const FPS = 30;
export const S = TL;

// ── layout ──
export const NODE = {
  browser: {x: 540, y: 670, w: 700, h: 230},
  app: {x: 540, y: 935, w: 300, h: 96},
  cache: {x: 300, y: 1225, w: 380, h: 270},
  db: {x: 775, y: 1235, w: 230, h: 250},
};
export const PT = {
  B: {x: 540, y: NODE.browser.y + NODE.browser.h / 2},
  A: {x: 540, y: NODE.app.y},
  C: {x: NODE.cache.x + 40, y: NODE.cache.y - NODE.cache.h / 2},
  D: {x: NODE.db.x - 10, y: NODE.db.y - NODE.db.h / 2 + 18},
};
export const COL = {
  bg: '#0a0e14',
  ink: '#e9eef5',
  dim: '#8b98a9',
  line: '#223044',
  req: '#39d0ff',
  hit: '#3ddc84',
  miss: '#ff4d5e',
  db: '#ffb020',
  cache: '#ff6fb1',
};

// leg durations (frames)
export const L = {BA: 8, AC: 8, CHECK: 3, CA: 6, AD: 10, DA: 10, AB: 8, WRITE: 8};

export type Kind = 'db' | 'miss' | 'hit';
export type Req = {
  id: number;
  start: number;
  key: string;
  kind: Kind;
  dbT: number;
  ms: number; // latency the browser reports
  value?: string;
  stale?: boolean;
  // derived times
  tCheck: number; // arrives at the cache (hit/miss decided)
  tDbIn: number;
  tDbOut: number;
  tWrite: number; // answer lands in the cache
  tDone: number; // response reaches the browser
};
export type Slot = {key: string; value?: string; at: number; ttlEnd: number; lastUsed: number; evictedAt?: number; evictedKey?: string};

const CAP = 8;
const TTL_LONG = 4000;

// ── the scripted request stream ──
type Plan = {start: number; key: string; dbT: number};
const plan: Plan[] = [];
// hook + series: no cache yet, every request crawls to the database (pre-rolled so frame 0 is busy)
for (let t = -70; t < S.fix - 70; t += 38) plan.push({start: t, key: 'home', dbT: 72});
// the fix: one miss, then hits
plan.push({start: S.fix + 40, key: 'home', dbT: 40});
for (const d of [165, 205, 228, 251]) plan.push({start: S.fix + d, key: 'home', dbT: 40});
// hit rate: a warm-up burst over popular pages
const POP = ['home', 'home', 'products', 'home', 'cart', 'search', 'home', 'products', 'about', 'home', 'blog', 'cart', 'home', 'login', 'products', 'home'];
for (let t = S.hitrate + 4, i = 0; t < S.ttl - 24; t += 5, i++) {
  const key = i === 3 ? 'price' : i < POP.length ? POP[i] : POP[Math.floor(random(`k${i}`) * POP.length)];
  plan.push({start: t, key, dbT: 22});
}
// TTL: the DB price changes; a hit serves the stale copy; the TTL runs out; the next request is fresh
export const PRICE_CHANGE = S.ttl + 12;
export const PRICE_EXPIRES = S.ttl + 150;
plan.push({start: S.ttl + 22, key: 'price', dbT: 30});
plan.push({start: S.ttl + 70, key: 'home', dbT: 30});
plan.push({start: S.ttl + 110, key: 'products', dbT: 30});
plan.push({start: S.ttl + 168, key: 'price', dbT: 34});
// LRU: the cache is full; new pages push out the least recently used
plan.push({start: S.lru + 14, key: 'home', dbT: 30});
plan.push({start: S.lru + 36, key: 'deals', dbT: 26});
plan.push({start: S.lru + 58, key: 'cart', dbT: 26});
plan.push({start: S.lru + 74, key: 'faq', dbT: 26});

// ── run it through an LRU + TTL cache ──
const slots: (Slot | null)[] = Array(CAP).fill(null);
export const SLOT_LOG: {f: number; i: number; slot: Slot | null}[] = []; // every change to every slot
const dbPrice = (f: number) => (f >= PRICE_CHANGE ? '£15' : '£20');
const reqs: Req[] = [];
const pendingWrites: {f: number; key: string; value?: string}[] = [];
const sorted = [...plan].sort((a, b) => a.start - b.start);

const applyWrites = (upTo: number) => {
  pendingWrites.sort((a, b) => a.f - b.f);
  while (pendingWrites.length && pendingWrites[0].f <= upTo) {
    const w = pendingWrites.shift()!;
    let i = slots.findIndex((s) => s && s.key === w.key);
    if (i < 0) i = slots.findIndex((s) => s === null || (s && s.ttlEnd <= w.f));
    let evictedKey: string | undefined;
    if (i < 0) {
      // evict the least recently used
      let best = 0;
      for (let k = 1; k < CAP; k++) if (slots[k]!.lastUsed < slots[best]!.lastUsed) best = k;
      i = best;
      evictedKey = slots[i]!.key;
    }
    const ttlEnd = w.key === 'price' && w.f < PRICE_EXPIRES ? PRICE_EXPIRES : w.f + TTL_LONG;
    const s: Slot = {key: w.key, value: w.value, at: w.f, ttlEnd, lastUsed: w.f, evictedAt: evictedKey ? w.f : undefined, evictedKey};
    slots[i] = s;
    SLOT_LOG.push({f: w.f, i, slot: {...s}});
  }
};

sorted.forEach((p, n) => {
  const cacheOn = p.start >= S.fix;
  const tCheck = p.start + L.BA + L.AC;
  applyWrites(tCheck);
  let kind: Kind = 'db';
  let value: string | undefined = p.key === 'price' ? dbPrice(tCheck) : undefined;
  let stale = false;
  if (cacheOn) {
    const i = slots.findIndex((s) => s && s.key === p.key && s.ttlEnd > tCheck);
    if (i >= 0) {
      kind = 'hit';
      const s = slots[i]!;
      s.lastUsed = tCheck;
      SLOT_LOG.push({f: tCheck, i, slot: {...s}});
      value = s.value;
      stale = p.key === 'price' && s.value !== dbPrice(tCheck);
    } else kind = 'miss';
  }
  const r: Req = {id: n, start: p.start, key: p.key, kind, dbT: p.dbT, ms: 0, value, stale, tCheck, tDbIn: 0, tDbOut: 0, tWrite: 0, tDone: 0};
  if (kind === 'hit') {
    r.tDone = tCheck + L.CHECK + L.CA + L.AB;
    r.ms = 9 + Math.floor(random(`ms${n}`) * 7);
  } else {
    const out = kind === 'db' ? p.start + L.BA : tCheck + L.CHECK + L.CA;
    r.tDbIn = out + L.AD;
    r.tDbOut = r.tDbIn + p.dbT;
    const back = r.tDbOut + L.DA;
    r.tDone = back + L.AB;
    r.ms = 3900 + Math.floor(random(`ms${n}`) * 260);
    if (kind === 'miss') {
      r.tWrite = back + L.WRITE;
      pendingWrites.push({f: r.tWrite, key: p.key, value});
    }
  }
  reqs.push(r);
});
applyWrites(1e9);
SLOT_LOG.sort((a, b) => a.f - b.f);

export const REQS = reqs;

/** cache slots as they stand at frame f */
export const slotsAt = (f: number) => {
  const out: (Slot | null)[] = Array(CAP).fill(null);
  for (const e of SLOT_LOG) {
    if (e.f > f) break;
    out[e.i] = e.slot;
  }
  return out;
};
/** rolling hit rate over the last n cache checks */
export const hitRate = (f: number, n = 14) => {
  const checks = REQS.filter((r) => r.kind !== 'db' && r.tCheck <= f).slice(-n);
  if (!checks.length) return 0;
  return checks.filter((r) => r.kind === 'hit').length / checks.length;
};
export const dbBusy = (f: number) => REQS.filter((r) => r.kind !== 'hit' && r.tDbIn <= f && f < r.tDbOut).length;
export const priceInDb = dbPrice;
