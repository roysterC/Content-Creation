// Deterministic traffic simulation for the load-balancer explainer (frames @ 30fps).
// Every packet is precomputed once, so any frame can be rendered in isolation.
import {random} from 'remotion';

export const FPS = 30;
import TL from './timeline.json'; // scene starts, derived from the voiceover lengths
export const S = TL;
export const VO_AT = TL.v;
export const FAIL_AT = TL.failAt; // server 2 dies ("miss a beat…")
export const DETECT_AT = TL.detectAt; // the LB notices and stops routing to it

// layout
export const LB = {x: 505, y: 960, w: 400, h: 130};
export const SERVER_X = [215, 505, 795];
export const SERVER_Y = 1290;
export const SERVER = {w: 230, h: 200};
export const CLIENT_X = [185, 345, 505, 665, 825];
export const CLIENT_Y = 700;

export const COL = {
  bg: '#0a0e14',
  ink: '#e9eef5',
  dim: '#8b98a9',
  line: '#223044',
  req: '#39d0ff',
  lb: '#ffb020',
  ok: '#3ddc84',
  bad: '#ff4d5e',
  users: ['#ff6fb1', '#b6f35a', '#a98bff'],
};

export type Packet = {
  id: number;
  spawn: number;
  client: number;
  target: number;
  direct: boolean; // no load balancer yet (the hook)
  dur: number; // how long it stays "in service" on the server
  color: string;
  label?: string;
  fail?: boolean; // arrives at a dead / overloaded server
};

export const TRAVEL_DIRECT = 26;
export const LEG_A = 16;
export const IN_LB = 4;
export const LEG_B = 18;
export const arrival = (p: Packet) => p.spawn + (p.direct ? TRAVEL_DIRECT : LEG_A + IN_LB + LEG_B);

// least-connections: servers already carrying work when the scene starts
export const LC_PRELOAD = [6, 1, 3];

const packets: Packet[] = [];
let id = 0;
const add = (p: Omit<Packet, 'id'>) => packets.push({...p, id: id++});
const rc = (k: string) => Math.floor(random(k) * CLIENT_X.length);

// 1. hook: a flood straight into one server (starts before frame 0 so frame 0 is already busy)
for (let t = -60, i = 0; t < S.fix - 10; i++) {
  const spawn = Math.round(t);
  const p = {spawn, client: rc(`h${i}`), target: 1, direct: true, dur: 70, color: COL.req};
  add({...p, fail: spawn + TRAVEL_DIRECT >= 96});
  t += Math.max(1.1, 6 - (t + 60) * 0.035);
}
// 2. the fix: spread evenly
for (let t = S.fix + 46, i = 0; t < S.rr - 8; t += 5, i++) add({spawn: t, client: rc(`f${i}`), target: i % 3, direct: false, dur: 40, color: COL.req});
// 3. round robin: slow enough to read the 1-2-3
for (let t = S.rr + 6, i = 0; t < S.lc - 20; t += 12, i++) add({spawn: t, client: rc(`r${i}`), target: i % 3, direct: false, dur: 34, color: COL.req, label: String((i % 3) + 1)});
// 4. least connections: pick the server with the fewest open connections at decision time
const live = (s: number, f: number) => packets.filter((p) => p.target === s && arrival(p) <= f && f < arrival(p) + p.dur && p.spawn >= S.lc).length;
for (let t = S.lc + 8, i = 0; t < S.hash - 22; t += 9, i++) {
  const decide = t + LEG_A;
  const load = [0, 1, 2].map((s) => LC_PRELOAD[s] + live(s, decide));
  const target = load.indexOf(Math.min(...load));
  add({spawn: t, client: rc(`l${i}`), target, direct: false, dur: 50 + Math.floor(random(`ld${i}`) * 50), color: COL.req});
}
// 5. ip hash: three users, each always lands on "their" server
const HASH_TARGET = [2, 0, 1];
const USER_CLIENT = [1, 2, 3];
for (let t = S.hash + 8, i = 0; t < S.health - 18; t += 8, i++) {
  const u = Math.floor(random(`u${i}`) * 3);
  add({spawn: t, client: USER_CLIENT[u], target: HASH_TARGET[u], direct: false, dur: 30, color: COL.users[u]});
}
// 6. health checks: server 2 (index 1) dies; until the LB notices, its traffic fails
for (let t = S.health + 6, i = 0; t < S.l4 - 20; t += 7, i++) {
  const decide = t + LEG_A;
  const alive = decide < DETECT_AT ? [0, 1, 2] : [0, 2];
  const target = alive[i % alive.length];
  add({spawn: t, client: rc(`d${i}`), target, direct: false, dur: 30, color: COL.req, fail: target === 1 && t + LEG_A + IN_LB + LEG_B >= FAIL_AT});
}
// 7a. layer 4: only sees an address, spreads evenly
for (let t = S.l4 + 6, i = 0; t < S.l7 - 14; t += 9, i++) add({spawn: t, client: rc(`a${i}`), target: i % 3, direct: false, dur: 30, color: COL.req, label: ':443'});
// 7b. layer 7: reads the path
const PATHS = ['/api/orders', '/img/logo.png', '/api/cart', '/api/login', '/img/hero.jpg'];
for (let t = S.l7 + 10, i = 0, api = 0; t < S.recap - 20; t += 10, i++) {
  const path = PATHS[i % PATHS.length];
  const target = path.startsWith('/img') ? 2 : api++ % 2;
  add({spawn: t, client: rc(`b${i}`), target, direct: false, dur: 30, color: path.startsWith('/img') ? COL.users[2] : COL.req, label: path});
}

export const PACKETS = packets;

/** open connections on a server at frame f (what the server card displays) */
export const conns = (s: number, f: number) => {
  let n = 0;
  for (const p of PACKETS) {
    const a = arrival(p);
    if (p.target === s && !p.fail && a <= f && f < a + p.dur) n++;
  }
  if (f >= S.lc && f < S.hash) n += LC_PRELOAD[s];
  return n;
};
/** requests per second shown in the hook */
export const hookRate = (f: number) => {
  const n = PACKETS.filter((p) => p.direct && p.spawn > f - 30 && p.spawn <= f).length;
  return n;
};
