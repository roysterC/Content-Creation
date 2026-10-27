// Idempotency explainer (#12): a real (tiny) payments server, run over each scene's taps.
// No key → every request charges. Idempotency key → the first request locks the key, charges, saves the result;
// a repeat replays the saved answer; a repeat that arrives while the first is still running gets 409 (Stripe behaves the same way).
// Ledger rows, key-table rows, responses and the phone's state all come from that processor, timed off the spoken word.
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
  tap: word('hook', 'tap'),
  twice: word('hook', 'twice'),
  payment: word('lead', 'payment'),
  through: word('lead', 'through'),
  reply: word('lead', 'reply'),
  never: word('lead', 'never'),
  second: word('naive', 'second'),
  charges: word('naive', 'charges'),
  twoCharges: word('naive', 'two'),
  idem: word('key', 'idempotency'),
  unique: word('key', 'unique'),
  sends: word('key', 'sends'),
  every: word('key', 'every'),
  saves: word('replay', 'saves'),
  result: word('replay', 'result'),
  sameKey: word('replay', 'same'),
  skips: word('replay', 'skips'),
  replays: word('replay', 'replays'),
  answer: word('replay', 'answer'),
  stripe: word('stripe', 'stripe'),
  header: word('stripe', 'idempotency'),
  sameResp: word('stripe', 'same', 1),
  both: word('race', 'both'),
  sameMoment: word('race', 'same'),
  lock: word('race', 'lock'),
  onlyOne: word('race', 'only'),
  goes: word('race', 'through'),
  app: word('client', 'app'),
  letServer: word('client', 'let'),
  brandNew: word('client', 'brand'),
};

export const KEY = '7f3a9c2e-41d8-4b6a-9e0f-2c5d1b8a6e3f';
export const short = (k: string) => k.slice(0, 8) + '…';
export const PRICE = 24;

// ── the taps, per world (the account and server memory reset between worlds) ──
export type Tap = {tap: number; arrive: number; work?: number; key: 'none' | 'app' | 'server'; lost?: boolean; holdReply?: number};
export type World = {from: number; to: number; keys: boolean; taps: Tap[]; serverKeys?: string[]};
export const WORLDS: World[] = [
  // hook: a quick look — two taps, two charges
  {from: -Infinity, to: S.lead, keys: false, taps: [{tap: -26, arrive: -6, work: 12, key: 'none', lost: true}, {tap: A.tap, arrive: A.tap + 16, work: 8, key: 'none'}]},
  // lead + naive: slow motion. The first one goes through; its reply is lost; the second tap charges again
  {from: S.lead, to: S.key, keys: false, taps: [{tap: A.payment - 20, arrive: A.payment, work: A.through - A.payment, key: 'none', lost: true, holdReply: A.reply}, {tap: A.second - 6, arrive: A.second + 12, work: A.charges - A.second - 12, key: 'none'}]},
  // the key: first request locks + charges + saves; its reply is lost; the retry replays the saved answer
  {from: S.key, to: S.race, keys: true, taps: [{tap: A.sends - 4, arrive: A.sends + 16, work: 14, key: 'app', lost: true}, {tap: A.sameKey, arrive: A.sameKey + 18, key: 'app', holdReply: A.replays}]},
  // both taps at once: one holds the lock, the other gets 409
  {from: S.race, to: S.client, keys: true, taps: [{tap: A.sameMoment, arrive: A.lock - 6, work: A.onlyOne - A.lock + 6, key: 'app'}, {tap: A.sameMoment + 4, arrive: A.lock - 2, key: 'app'}]},
  // server-made keys: every retry gets a fresh key, so nothing matches
  {from: S.client, to: S.payoff + 20, keys: true, serverKeys: ['a1f04d7b-…', 'c94e2b10-…'], taps: [{tap: A.letServer + 4, arrive: A.letServer + 22, work: 10, key: 'server', lost: true}, {tap: A.letServer + 36, arrive: A.letServer + 54, work: A.brandNew - A.letServer - 54 + 2, key: 'server'}]},
];
export const worldAt = (f: number) => WORLDS.findIndex((w) => f >= w.from && f < w.to);

export const LEG = 16; // phone ↔ server travel (frames)
export type Outcome = 'charged' | 'replayed' | 'conflict';
export type Ev = {i: number; world: number; tap: number; arrive: number; key: string | null; outcome: Outcome; charged: number; respLeave: number; respArrive: number; lost: boolean; status: number};
export type KeyRow = {key: string; from: number; doneAt: number; chargeId: string};
export type Charge = {id: string; at: number};

// ── the server ──
export const RUN = WORLDS.map((w, wi) => {
  const evs: Ev[] = [];
  const table: KeyRow[] = [];
  const ledger: Charge[] = [];
  let n = 0;
  const order = w.taps.map((t, i) => ({t, i})).sort((a, b) => a.t.arrive - b.t.arrive);
  for (const {t, i} of order) {
    const key = t.key === 'app' ? KEY : t.key === 'server' ? w.serverKeys![i] : null;
    const row = key ? table.find((r) => r.key === key) : undefined;
    let outcome: Outcome;
    let charged = -1;
    let respLeave: number;
    let status = 200;
    if (row && row.doneAt <= t.arrive) {
      outcome = 'replayed'; // the saved result, sent again: no new charge
      respLeave = Math.max(t.arrive + 4, t.holdReply ?? 0);
    } else if (row) {
      outcome = 'conflict'; // the first request still holds the lock
      status = 409;
      respLeave = t.arrive + 4;
    } else {
      charged = t.arrive + (t.work ?? 10);
      const id = `ch_${++n}`;
      ledger.push({id, at: charged});
      if (key) table.push({key, from: t.arrive, doneAt: charged, chargeId: id});
      outcome = 'charged';
      respLeave = Math.max(charged + 2, t.holdReply ?? 0);
    }
    evs.push({i, world: wi, tap: t.tap, arrive: t.arrive, key, outcome, charged, respLeave, respArrive: respLeave + LEG, lost: !!t.lost, status});
  }
  return {evs: evs.sort((a, b) => a.i - b.i), table, ledger};
});

// state helpers
export const ledgerAt = (f: number) => {
  const wi = worldAt(f);
  return wi < 0 ? [] : RUN[wi].ledger.filter((c) => c.at <= f);
};
export const tableAt = (f: number) => {
  const wi = worldAt(f);
  return wi < 0 ? [] : RUN[wi].table.filter((r) => r.from <= f);
};
// the phone: spinning from a tap until a successful response lands
export const phoneAt = (f: number) => {
  const wi = worldAt(f);
  if (wi < 0) return {state: 'idle' as const, since: 0};
  const evs = RUN[wi].evs;
  const ok = evs.filter((e) => !e.lost && e.status === 200 && e.respArrive <= f).sort((a, b) => a.respArrive - b.respArrive)[0];
  if (ok) return {state: 'paid' as const, since: ok.respArrive};
  const tapped = evs.filter((e) => e.tap <= f);
  if (tapped.length) return {state: 'processing' as const, since: Math.min(...tapped.map((e) => e.tap))};
  return {state: 'idle' as const, since: 0};
};
export const TAPS = WORLDS.flatMap((w, wi) => w.taps.map((t) => ({world: wi, at: t.tap})));
