// Delivery-app idempotency deep dive: one order flow, broken and fixed hop by hop.
// Every beat is anchored to the spoken word (captions.json). The order / driver / charge tables follow the
// real rules shown on screen: no key → a retry creates a new order; same key → the saved order comes back;
// same key + different basket → rejected; at-least-once queue + crash before ack → redelivery; a
// one-driver-per-order rule turns the redelivery into a no-op; a payment retry with the same key charges once.
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
  two: word('hook', 'two'),
  everyBig: word('lead', 'every'),
  build: word('lead', 'build'),
  breakIt: word('lead', 'break'),
  on: word('idea', 'on:'),
  press: word('idea', 'press'),
  toggle: word('idea', 'toggle'),
  presses: word('idea', 'five', 1),
  whoKnows: word('idea', 'who'),
  idempotent: word('idea', 'idempotent'),
  changes: word('idea', 'changes'),
  set: word('code', 'set'),
  paid: word('code', 'paid:'),
  twice1: word('code', 'twice'),
  take: word('code', 'take'),
  balance: word('code', 'balance'),
  twice2: word('code', 'twice', 1),
  down: word('code', 'down'),
  retries: word('hop1', 'retries'),
  twoOrders: word('hop1', 'two'),
  so: word('hop1', 'so'),
  key: word('hop1', 'key'),
  saves: word('hop1', 'saves'),
  result: word('hop1', 'result'),
  sameKey: word('hop1', 'same'),
  hand: word('hop1', 'hand'),
  different: word('reuse', 'different'),
  reject: word('reuse', 'reject'),
  bug: word('reuse', 'bug'),
  queues: word('hop2', 'queues'),
  atLeast: word('hop2', 'least'),
  crashes: word('hop2', 'crashes'),
  comes: word('hop2', 'comes'),
  second: word('hop2', 'second'),
  fix: word('fix2', 'fix'),
  only: word('fix2', 'only'),
  yet: word('fix2', 'yet'),
  oneRule: word('fix2', 'rule'),
  perOrder: word('fix2', 'per'),
  charge: word('hop3', 'charge'),
  timeOut: word('hop3', 'time'),
  retry: word('hop3', 'retry'),
  sameKey3: word('hop3', 'same'),
  once: word('hop3', 'once'),
  anything: word('rule', 'anything'),
  safe: word('rule', 'safe'),
};

export const KEY = '9c1e4b7a-…';

// ── layout ──
export type Box = {x: number; y: number; w: number; h: number};
export const N: Record<string, Box> = {
  phone: {x: 70, y: 496, w: 240, h: 90},
  api: {x: 70, y: 700, w: 320, h: 100},
  pay: {x: 590, y: 700, w: 310, h: 100},
  queue: {x: 70, y: 872, w: 830, h: 84},
  kitchen: {x: 70, y: 1012, w: 320, h: 90},
  dispatch: {x: 590, y: 1012, w: 310, h: 90},
};
export const BOTTOM = {x: 70, y: 1150, w: 830, h: 350};
export type Pt = {x: number; y: number};
export const E = {
  phoneApi: [{x: 150, y: 586}, {x: 150, y: 700}] as Pt[],
  apiPhone: [{x: 250, y: 700}, {x: 250, y: 586}] as Pt[],
  apiPay: [{x: 390, y: 735}, {x: 590, y: 735}] as Pt[],
  payApi: [{x: 590, y: 768}, {x: 390, y: 768}] as Pt[],
  apiQueue: [{x: 230, y: 800}, {x: 230, y: 872}] as Pt[],
  queueKitchen: [{x: 230, y: 956}, {x: 230, y: 1012}] as Pt[],
  queueDispatch: [{x: 700, y: 956}, {x: 700, y: 1012}] as Pt[],
  dispatchQueue: [{x: 800, y: 1012}, {x: 800, y: 956}] as Pt[],
};
export type EdgeName = keyof typeof E;

// the system draws itself during the lead
export const BUILD: Record<string, number> = {
  phone: A.everyBig - 8,
  api: A.everyBig + 6,
  pay: A.everyBig + 20,
  queue: A.everyBig + 34,
  kitchen: A.build - 2,
  dispatch: A.build + 10,
};

// ── scenes (which overlay owns the screen) ──
export const DIAGRAM_ON = (f: number) => f >= S.lead && f < S.payoff;
export const OVERLAY = (f: number) => (f >= S.idea && f < S.hop1 ? (f < S.code ? 'idea' : 'code') : null);

// ── packets on the wire (scripted from the words, outcomes follow the rules above) ──
export type Pkt = {edge: EdgeName; at: number; dur?: number; label: string; col: string; lost?: boolean};
const blue = COL.req;
const green = COL.ok;
const red = COL.bad;
// hop 1 — without a key, then with one
export const H1 = {
  r1: A.retries - 6, // tap
  a12: A.retries + 18, // order A12 created
  lost1: A.retries + 26,
  r2: A.retries + 40, // the app retries
  a13: A.twoOrders - 6, // a second order: A13
  rewind: A.so - 4,
  k1: A.key + 4,
  saved: A.saves,
  lost2: A.saves + 10,
  k2: A.sameKey - 4,
  seen: A.sameKey + 14,
  back: A.hand,
  okAt: A.hand + 16,
  bad: A.different - 2,
  rejected: A.reject,
  badBack: A.reject + 2,
};
// hop 2 — at-least-once delivery, a crash before "done", then the one-driver rule
export const H2 = {
  publish: A.queues - 6,
  deliver1: A.atLeast - 12,
  sam: A.atLeast + 14,
  crash: A.crashes,
  redeliver: A.comes,
  deliver2: A.comes + 8,
  priya: A.second,
  // fix
  rewind: A.fix - 6,
  publishF: A.fix + 4,
  deliverF1: A.fix + 16,
  samF: A.only + 8,
  crashF: A.only + 26,
  deliverF2: A.yet - 18,
  skip: A.yet,
  ack: A.yet + 10,
};
// hop 3 — the charge
export const H3 = {
  call: A.charge,
  charged: A.charge + 20,
  timeout: A.timeOut + 4,
  retry: A.retry - 2,
  seen: A.sameKey3,
  back: A.sameKey3 + 4,
  once: A.once,
};
export const PKTS: Pkt[] = [
  // hop 1, no key
  {edge: 'phoneApi', at: H1.r1, label: 'place order', col: blue},
  {edge: 'apiPhone', at: H1.a12 + 2, label: 'A12 ✓', col: green, lost: true},
  {edge: 'phoneApi', at: H1.r2, label: 'place order (retry)', col: blue},
  {edge: 'apiPhone', at: H1.a13 + 4, label: 'A13 ✓', col: red},
  // hop 1, with a key
  {edge: 'phoneApi', at: H1.k1, label: 'place order 🔑9c1e', col: blue},
  {edge: 'apiPhone', at: H1.saved + 2, label: 'A12 ✓', col: green, lost: true},
  {edge: 'phoneApi', at: H1.k2, label: 'retry 🔑9c1e', col: blue},
  {edge: 'apiPhone', at: H1.back, label: 'A12 ✓ (same)', col: green},
  // reuse with a different basket
  {edge: 'phoneApi', at: H1.bad - 16, label: '🔑9c1e + dessert', col: COL.amber},
  {edge: 'apiPhone', at: H1.badBack, label: 'rejected', col: red},
  // hop 2
  {edge: 'apiQueue', at: H2.publish, label: 'A12 placed', col: blue},
  {edge: 'queueDispatch', at: H2.deliver1, label: 'A12 placed', col: blue},
  {edge: 'queueKitchen', at: H2.deliver1 + 4, label: 'A12 placed', col: blue},
  {edge: 'queueDispatch', at: H2.deliver2, label: 'A12 placed (again)', col: COL.amber},
  {edge: 'apiQueue', at: H2.publishF, label: 'A12 placed', col: blue},
  {edge: 'queueDispatch', at: H2.deliverF1, label: 'A12 placed', col: blue},
  {edge: 'queueDispatch', at: H2.deliverF2, label: 'A12 placed (again)', col: COL.amber},
  {edge: 'dispatchQueue', at: H2.ack, label: 'done ✓', col: green},
  // hop 3
  {edge: 'apiPay', at: H3.call, label: 'charge £24 🔑9c1e', col: blue},
  {edge: 'payApi', at: H3.charged + 2, label: '200 ✓', col: green, lost: true},
  {edge: 'apiPay', at: H3.retry, label: 'retry 🔑9c1e', col: blue},
  {edge: 'payApi', at: H3.back, label: '200 ✓ (same)', col: green},
];
export const PKT_DUR = 16;

// ── node status lines ──
type St = {from: number; to: number; t: string; c: string};
export const STATUS: Record<string, St[]> = {
  api: [
    {from: H1.r1 + PKT_DUR, to: H1.r2 + PKT_DUR, t: 'new order → A12', c: COL.ink},
    {from: H1.r2 + PKT_DUR, to: H1.rewind, t: 'new order → A13 ✗', c: red},
    {from: H1.k1 + PKT_DUR, to: H1.k2 + PKT_DUR, t: 'save 🔑 → A12', c: COL.violet},
    {from: H1.k2 + PKT_DUR, to: H1.okAt + 10, t: '🔑 seen → same A12 ✓', c: green},
    {from: H1.bad, to: S.hop2, t: 'new basket → reject', c: red},
    {from: H3.call - 4, to: S.rule, t: 'pay with 🔑9c1e', c: COL.violet},
  ],
  pay: [
    {from: H3.call + PKT_DUR, to: H3.charged, t: 'charging…', c: COL.amber},
    {from: H3.charged, to: H3.retry + PKT_DUR, t: 'charged £24 ✓', c: COL.ink},
    {from: H3.retry + PKT_DUR, to: S.rule, t: 'key seen → same ✓', c: green},
  ],
  dispatch: [
    {from: H2.deliver1 + PKT_DUR, to: H2.crash, t: 'assign → Sam', c: COL.ink},
    {from: H2.crash, to: H2.deliver2 + PKT_DUR, t: '✗ crashed, no “done”', c: red},
    {from: H2.deliver2 + PKT_DUR, to: H2.rewind, t: 'assign → Priya ✗', c: red},
    {from: H2.deliverF1 + PKT_DUR, to: H2.crashF, t: 'no driver yet → Sam', c: COL.ink},
    {from: H2.crashF, to: H2.deliverF2 + PKT_DUR, t: '✗ crashed (restarting)', c: red},
    {from: H2.deliverF2 + PKT_DUR, to: S.hop3, t: 'has a driver → skip ✓', c: green},
  ],
  kitchen: [{from: H2.deliver1 + 4 + PKT_DUR, to: S.fix2, t: 'cook A12', c: COL.ink}],
};
export const statusAt = (node: string, f: number) => (STATUS[node] ?? []).find((s) => f >= s.from && f < s.to);

// ── tables ──
export type Row = {at: number; to: number; cells: string[]; bad?: boolean; good?: boolean};
export const ORDERS: Row[] = [
  {at: H1.a12, to: H1.rewind, cells: ['A12', '—', 'pizza + drink']},
  {at: H1.a13, to: H1.rewind, cells: ['A13', '—', 'pizza + drink'], bad: true},
  {at: H1.saved, to: S.hop2, cells: ['A12', '9c1e…', 'pizza + drink']},
  {at: H1.rejected, to: S.hop2, cells: ['—', '9c1e…', '+ dessert → rejected'], bad: true},
];
export const DRIVERS: Row[] = [
  {at: H2.sam, to: H2.rewind, cells: ['A12', 'Sam']},
  {at: H2.priya, to: H2.rewind, cells: ['A12', 'Priya'], bad: true},
  {at: H2.samF, to: S.hop3, cells: ['A12', 'Sam']},
  {at: H2.skip, to: S.hop3, cells: ['A12', 'Sam (again) → skipped'], good: true},
];
export const CHARGES: Row[] = [
  {at: H3.charged, to: S.rule, cells: ['ch_1', 'food.app', '−£24.00']},
  {at: H3.seen, to: S.rule, cells: ['retry', '🔑 9c1e…', 'no new charge ✓'], good: true},
];
// queue: a message is visible in the queue until a worker takes it; after a crash it comes back
export const QUEUE_MSG = [
  {from: H2.publish + PKT_DUR, to: H2.deliver1, label: 'A12 placed'},
  {from: H2.redeliver - 6, to: H2.deliver2, label: 'A12 placed ↻', back: true},
  {from: H2.publishF + PKT_DUR, to: H2.deliverF1, label: 'A12 placed'},
  {from: H2.crashF + 8, to: H2.deliverF2, label: 'A12 placed ↻', back: true},
];
// "in flight": taken but not yet acknowledged — the broker will hand it out again if no "done" arrives
export const IN_FLIGHT = [
  {from: H2.deliver1, to: H2.redeliver - 6},
  {from: H2.deliverF1, to: H2.crashF + 8},
  {from: H2.deliverF2, to: H2.ack},
];

// ── the map: drivers heading to your door ──
export type Ride = {name: string; col: string; start: number; end: number; path: Pt[]};
// map coords are 0..1 inside whatever box draws the map
const P1: Pt[] = [{x: 0.18, y: 0.2}, {x: 0.18, y: 0.55}, {x: 0.62, y: 0.55}, {x: 0.62, y: 0.78}];
const P2: Pt[] = [{x: 0.92, y: 0.22}, {x: 0.92, y: 0.4}, {x: 0.62, y: 0.4}, {x: 0.62, y: 0.78}];
export const HOME: Pt = {x: 0.62, y: 0.8};
export const SHOP: Pt = {x: 0.18, y: 0.18};
export const RIDES_HOOK: Ride[] = [
  {name: 'Sam', col: COL.ok, start: -60, end: 110, path: P1},
  {name: 'Priya', col: COL.bad, start: -30, end: 116, path: P2},
];
export const RIDES_HOP2: Ride[] = [
  {name: 'Sam', col: COL.ok, start: H2.sam, end: H2.sam + 220, path: P1},
  {name: 'Priya', col: COL.bad, start: H2.priya, end: H2.priya + 200, path: P2},
];
export const RIDES_FIX2: Ride[] = [{name: 'Sam', col: COL.ok, start: H2.samF, end: H2.samF + 220, path: P1}];
export const along = (path: Pt[], t: number): Pt => {
  const seg: number[] = [];
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    const d = Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y);
    seg.push(d);
    total += d;
  }
  let d = Math.max(0, Math.min(1, t)) * total;
  for (let i = 0; i < seg.length; i++) {
    if (d <= seg[i]) {
      const k = d / seg[i];
      return {x: path[i].x + (path[i + 1].x - path[i].x) * k, y: path[i].y + (path[i + 1].y - path[i].y) * k};
    }
    d -= seg[i];
  }
  return path[path.length - 1];
};

// ── the switches (idea) ──
export const ON_PRESSES = [0, 1, 2, 3, 4].map((k) => A.press + k * 8);
export const TOGGLE_PRESSES = [0, 1, 2, 3, 4].map((k) => A.presses + k * 8);
export const lightOn = (f: number) => f >= ON_PRESSES[0]; // ON: first press turns it on, the rest change nothing
export const toggleOn = (f: number) => TOGGLE_PRESSES.filter((p) => f >= p).length % 2 === 1; // starts off; flips every press

// ── code (natural idempotency) ──
export const RUNS_SET = [A.paid, A.twice1];
export const RUNS_SUB = [A.balance, A.twice2];
export const balanceAt = (f: number) => 100 - 24 * RUNS_SUB.filter((r) => f >= r).length;

// ── the rule: every hop gets a "safe to retry" badge ──
export const BADGES: {edge: EdgeName; at: number; t: string}[] = [
  {edge: 'phoneApi', at: A.anything, t: 'order key'},
  {edge: 'apiPay', at: A.anything + 10, t: 'same key'},
  {edge: 'apiQueue', at: A.anything + 20, t: 'dedupe'},
  {edge: 'queueDispatch', at: A.anything + 30, t: '1 driver / order'},
];

// ambient traffic: other customers' orders flowing through, so the system always feels alive
export const AMBIENT = (() => {
  const out: {edge: EdgeName; at: number}[] = [];
  const edges: EdgeName[] = ['phoneApi', 'apiQueue', 'queueKitchen', 'queueDispatch', 'apiPay'];
  let k = 0;
  for (let t = S.lead + 40; t < S.payoff; t += 9, k++) out.push({edge: edges[k % edges.length], at: t});
  return out;
})();
