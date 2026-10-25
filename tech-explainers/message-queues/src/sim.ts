// Message queues explainer: every beat anchored to the spoken word (captions.json).
// Structure: hook → lead → value beats that each end on an open loop. No CTA card; the end loops to frame 0.
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
  wifi: word('lead', 'wi-fi'),
  jam: word('lead', 'traffic'),
  sameWay: word('lead', 'every'),
  charge: word('chain', 'charge'),
  wallet: word('chain', 'wallet'),
  seat: word('chain', 'seat'),
  issue: word('chain', 'issue'),
  slow: word('chain', 'slow'),
  couldWait: word('loop1', 'could'),
  chargeNow: word('queue', 'charge'),
  rest: word('queue', 'rest'),
  workers: word('queue', 'workers'),
  confirmed: word('queue', 'ticket'),
  crashQ: word('loop2', 'worker'),
  done: word('ack', 'done'),
  crash: word('ack', 'crash'),
  comesBack: word('ack', 'comes'),
  another: word('ack', 'another'),
  nothing: word('ack', 'nothing'),
  twice: word('loop3', 'twice'),
  issueTwice: word('loop3', 'issue'),
  idem: word('idem', 'idempotent'),
  changes: word('idem', 'changes'),
  soon: word('idem', 'full'),
  grows: word('spike', 'grows'),
  addWorkers: word('spike', 'add'),
  drains: word('spike', 'drains'),
  catches: word('spike', 'catches'),
  gone: word('spike', 'gone'),
};

// the serial checkout: each step's real-ish duration
export const STEPS = [
  {name: 'charge card', s: 0.3, at: A.charge},
  {name: 'add to wallet', s: 0.4, at: A.wallet},
  {name: 'update seat map', s: 0.2, at: A.seat},
  {name: 'issue ticket', s: 2.5, at: A.issue},
];
export const SERIAL_TOTAL = STEPS.reduce((n, x) => n + x.s, 0); // 3.4 s

// ticket day: arrivals jump, the queue grows, then more workers drain it
export const QUEUE_PEAK = 4812;
export const queueLen = (f: number) => {
  if (f < A.grows - 10) return 0;
  if (f < A.addWorkers) return Math.round(QUEUE_PEAK * Math.min(1, (f - (A.grows - 10)) / (A.addWorkers - A.grows + 10)));
  const drainEnd = A.catches;
  return Math.max(0, Math.round(QUEUE_PEAK * (1 - (f - A.addWorkers) / (drainEnd - A.addWorkers))));
};
export const workerCount = (f: number) => (f < A.addWorkers ? 3 : Math.min(9, 3 + Math.floor((f - A.addWorkers) / 3)));
