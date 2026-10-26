import React from 'react';
import {AbsoluteFill, Easing, interpolate, random, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {
  A, COL, DB, dbLoad, FEATURE, hitRate, keyCachedAt, KEYS, LEG, LOOKUPS, modAt, MORPH, MOVED_ADD, MOVED_MOD, MOVED_REMOVE, onRing, ownerMod, ownerRing, ptsAt, REQS, RING, RING_ADD, RING_REMOVE, RING_VNODES, ringOwner, ringPoints, ringState, ROW_H, ROW_Y, rowN5, rowW, rowX, RUNS, runAt, S, SERVERS, SHARE_LUMPY, SHARE_VNODES, SPAWN_Y, VPOS,
} from './sim';
import CAPS from './captions.json';
import {Captions} from '../../_shared/Captions';

for (const w of ['400', '500', '600', '800']) loadFont({family: 'Inter', url: staticFile(`inter-${w}.woff2`), weight: w});
for (const w of ['400', '600']) loadFont({family: 'Plex Mono', url: staticFile(`mono-${w}.woff2`), weight: w});
const SANS = 'Inter, sans-serif';
const MONO = '"Plex Mono", monospace';

const ease = Easing.bezier(0.25, 0.1, 0.25, 1);
const glide = Easing.bezier(0.4, 0, 0.6, 1);
const pop = Easing.bezier(0.2, 1.6, 0.4, 1);
const ip = (f: number, i: number[], o: number[], e = ease) => interpolate(f, i, o, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: e});
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* ───────── copy ───────── */
type Copy = {at: number; until: number; kicker: string; head: string[]; kColor?: string};
const COPY: Copy[] = [
  {at: S.hook, until: S.series, kicker: 'CONSISTENT HASHING · EXPLAINED', head: ['POV: add a server,', 'the site gets slower.'], kColor: COL.bad},
  {at: S.series, until: S.modn, kicker: 'EXPERT IN UNDER 1 MINUTE', head: ['Consistent hashing,', 'expert level.'], kColor: COL.amber},
  {at: S.modn, until: S.ring, kicker: '01 · THE VILLAIN: MOD N', head: ['4 servers → 5,', '4 in 5 keys move.'], kColor: COL.bad},
  {at: S.ring, until: S.add, kicker: '02 · THE RING', head: ['Keys walk clockwise', 'to the next server.'], kColor: COL.req},
  {at: S.add, until: S.remove, kicker: '03 · ADD A SERVER', head: ['It only takes from', 'one neighbour.'], kColor: COL.amber},
  {at: S.remove, until: S.lumpy, kicker: '04 · LOSE A SERVER', head: ['Its keys slide', 'to the next one.'], kColor: COL.pink},
  {at: S.lumpy, until: S.vnodes, kicker: '05 · LUMPY SLICES', head: ['One point each?', 'Uneven work.'], kColor: COL.bad},
  {at: S.vnodes, until: S.real, kicker: '06 · VIRTUAL NODES', head: ['100 points each,', 'even slices.'], kColor: COL.ok},
  {at: S.real, until: S.payoff, kicker: 'IN THE WILD', head: ['Cassandra. Dynamo.', 'Thousands of machines.'], kColor: COL.violet},
];
const Headline: React.FC<{f: number; c: Copy}> = ({f, c}) => {
  if (f < c.at - 1 || f >= c.until) return null;
  const out = ip(f, [c.until - 8, c.until], [1, 0]);
  return (
    <div style={{position: 'absolute', left: 70, right: 120, top: 250, opacity: out}}>
      <div style={{fontFamily: MONO, fontWeight: 600, fontSize: 27, letterSpacing: 3, color: c.kColor ?? COL.amber, opacity: c.at === 0 ? 1 : ip(f, [c.at, c.at + 8], [0, 1])}}>{c.kicker}</div>
      <div style={{marginTop: 18}}>
        {c.head.map((line, i) => {
          const p = c.at === 0 ? 1 : ip(f, [c.at + 3 + i * 5, c.at + 15 + i * 5], [0, 1]);
          return (
            <div key={i} style={{fontFamily: SANS, fontWeight: 800, fontSize: 76, lineHeight: 1.08, letterSpacing: -2, color: COL.ink, opacity: p, translate: `0 ${(1 - p) * 26}px`}}>
              {line}
            </div>
          );
        })}
      </div>
    </div>
  );
};
const Progress: React.FC<{f: number}> = ({f}) => {
  const marks = [S.modn, S.ring, S.add, S.remove, S.lumpy, S.vnodes, S.real, S.payoff];
  return (
    <div style={{position: 'absolute', left: 70, right: 150, top: 232, height: 4, display: 'flex', gap: 8}}>
      {marks.map((m, i) => (
        <div key={i} style={{flex: 1, borderRadius: 2, background: '#1c2838', overflow: 'hidden'}}>
          <div style={{width: `${ip(f, [m, marks[i + 1] ?? S.total], [0, 100], Easing.linear)}%`, height: '100%', background: COL.amber}} />
        </div>
      ))}
    </div>
  );
};
const loadCol = (l: number) => (l >= 85 ? COL.bad : l >= 55 ? COL.amber : COL.ok);
const hitCol = (h: number) => (h >= 85 ? COL.ok : h >= 55 ? COL.amber : COL.bad);

/* ───────── the two stats on the first screen ───────── */
const Stats: React.FC<{f: number}> = ({f}) => {
  const o = ip(f, [S.ring - 10, S.ring + 4], [1, 0]);
  if (o <= 0) return null;
  const h = hitRate(f);
  const d = dbLoad(f);
  const chip = (label: string, v: number, col: string) => (
    <div style={{flex: 1, padding: '14px 22px', borderRadius: 18, background: '#0f1621', border: `2.5px solid ${col}`}}>
      <div style={{fontFamily: MONO, fontSize: 21, color: COL.dim, letterSpacing: 1}}>{label}</div>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 52, color: col, letterSpacing: -1, lineHeight: 1.05}}>{v}%</div>
    </div>
  );
  return (
    <div style={{position: 'absolute', left: 70, right: 150, top: 486, display: 'flex', gap: 22, opacity: o}}>
      {chip('cache hit rate', h, hitCol(h))}
      {chip('database load', d, loadCol(d))}
    </div>
  );
};

/* ───────── the row of cache servers + the database ───────── */
const rowSlot = (k: number, n: number, f: number) => {
  const s = ownerMod(k, n);
  let j = 0;
  for (let q = 0; q < k; q++) if (ownerMod(q, n) === s) j++;
  return {s, x: rowX(s, f) - 42 + (j % 4) * 28, y: ROW_Y + 74 + Math.floor(j / 4) * 26};
};
// where a key sits in the row at frame f (animating the mod 4 → 5 switch, and the rewind at the replay)
const rowKeyPos = (k: number, f: number) => {
  const run = runAt(f);
  const r = RUNS[run];
  const p4 = rowSlot(k, 4, f);
  const p5 = rowSlot(k, 5, f);
  let t: number;
  if (run === 1 && f < r.sw) t = 1 - ip(f, [S.modn, S.modn + 14], [0, 1], glide); // rewind to mod 4
  else {
    const st = r.sw + (k % 12) * 1.2;
    t = ip(f, [st, st + 14], [0, 1], glide);
  }
  const moves = p4.s !== p5.s;
  return {x: lerp(p4.x, p5.x, t), y: lerp(p4.y, p5.y, t) - (moves ? Math.sin(t * Math.PI) * 70 : 0), s: t > 0.5 ? p5.s : p4.s, moving: moves && t > 0 && t < 1};
};
const Row: React.FC<{f: number}> = ({f}) => {
  const o = ip(f, [MORPH.a, MORPH.a + 16], [1, 0]);
  if (o <= 0) return null;
  const out: React.ReactNode[] = [];
  const w = rowW(f);
  const n5 = rowN5(f);
  const dl = dbLoad(f);
  for (let i = 0; i < 5; i++) {
    if (i === 4 && n5 <= 0) continue;
    const x = rowX(i, f);
    const col = SERVERS[i].color;
    out.push(
      <g key={`s${i}`} opacity={i === 4 ? Math.min(1, n5 * 1.5) : 1}>
        <rect x={x - w / 2} y={ROW_Y} width={w} height={ROW_H} rx={20} fill="#0f1621" stroke={col} strokeWidth={3} />
        <text x={x} y={ROW_Y + 40} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={23} fill={col}>
          cache {SERVERS[i].name}
        </text>
      </g>,
    );
  }
  // key dots inside the boxes: filled = cached here, hollow = empty (the next request for it misses)
  KEYS.forEach((_, k) => {
    const p = rowKeyPos(k, f);
    const cached = keyCachedAt(k, f);
    const col = SERVERS[p.s].color;
    out.push(
      <g key={`k${k}`}>
        {p.moving ? <circle cx={p.x} cy={p.y} r={14} fill={COL.amber} opacity={0.3} /> : null}
        <circle cx={p.x} cy={p.y} r={8} fill={cached ? col : 'none'} stroke={cached ? 'none' : COL.bad} strokeWidth={2.5} />
      </g>,
    );
  });
  // the database
  const shake = dl >= 95 ? (random(`db${f}`) - 0.5) * 6 : 0;
  const rx = DB.w / 2;
  const ry = 22;
  out.push(
    <g key="db" transform={`translate(${shake} 0)`}>
      {dl >= 85 ? <circle cx={DB.x} cy={(DB.top + DB.bottom) / 2} r={190} fill={COL.bad} opacity={0.08 + 0.04 * Math.sin(f / 4)} /> : null}
      <path d={`M ${DB.x - rx} ${DB.top} L ${DB.x - rx} ${DB.bottom} A ${rx} ${ry} 0 0 0 ${DB.x + rx} ${DB.bottom} L ${DB.x + rx} ${DB.top}`} fill={dl >= 85 ? '#1a0d10' : '#0f1621'} stroke={loadCol(dl)} strokeWidth={3.5} />
      <ellipse cx={DB.x} cy={DB.top} rx={rx} ry={ry} fill="#152132" stroke={loadCol(dl)} strokeWidth={3.5} />
      <text x={DB.x} y={DB.top + 70} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={26} fill={loadCol(dl)}>
        database
      </text>
    </g>,
  );
  return <g opacity={o}>{out}</g>;
};

/* hit / miss traffic through the row */
const RowTraffic: React.FC<{f: number}> = ({f}) => {
  if (f >= MORPH.a + 10) return null;
  const out: React.ReactNode[] = [];
  for (const q of REQS) {
    if (f < q.spawn) continue;
    const end = q.hit ? q.decide + 10 : q.dbArrive + 10;
    if (f >= end) continue;
    if (q.run !== runAt(f)) continue;
    const sx = rowX(q.server, f);
    if (f < q.decide) {
      const t = ip(f, [q.spawn, q.decide], [0, 1], glide);
      const x = lerp(q.x0, sx + (q.x0 - 540) * 0.08, t);
      const y = lerp(SPAWN_Y, ROW_Y - 4, t);
      out.push(
        <g key={q.i} opacity={ip(f, [q.spawn, q.spawn + 4], [0, 1])}>
          <circle cx={x} cy={y} r={14} fill="#c9d4e2" opacity={0.14} />
          <circle cx={x} cy={y} r={7} fill="#c9d4e2" />
        </g>,
      );
    } else if (q.hit) {
      const k = (f - q.decide) / 10;
      out.push(<circle key={q.i} cx={sx} cy={ROW_Y} r={8 + k * 20} fill="none" stroke={COL.ok} strokeWidth={3} opacity={(1 - k) * 0.8} />);
    } else if (f < q.dbArrive) {
      const t = ip(f, [q.decide, q.dbArrive], [0, 1], glide);
      const x = lerp(sx, DB.x + (sx - 540) * 0.25, t);
      const y = lerp(ROW_Y + ROW_H, DB.top - 10, t);
      out.push(
        <g key={q.i}>
          <circle cx={x} cy={y} r={15} fill={COL.bad} opacity={0.18} />
          <circle cx={x} cy={y} r={7.5} fill={COL.bad} />
        </g>,
      );
    } else {
      const k = (f - q.dbArrive) / 10;
      out.push(<circle key={q.i} cx={DB.x + (sx - 540) * 0.25} cy={DB.top} r={8 + k * 18} fill="none" stroke={COL.bad} strokeWidth={3} opacity={(1 - k) * 0.7} />);
    }
  }
  return <g>{out}</g>;
};

/* the formula and the moved count, in the replay */
const ModN: React.FC<{f: number}> = ({f}) => {
  const o = ip(f, [A.modN - 6, A.modN + 6, S.ring - 8, S.ring + 4], [0, 1, 1, 0]);
  if (o <= 0) return null;
  const n = modAt(f) === 5 && f >= RUNS[1].sw ? 5 : 4;
  const flash = ip(f, [RUNS[1].sw, RUNS[1].sw + 4, RUNS[1].sw + 20], [0, 1, 0]);
  const co = ip(f, [A.fourIn5 - 4, A.fourIn5 + 6], [0, 1]);
  return (
    <g opacity={o}>
      <rect x={190} y={740} width={700} height={84} rx={20} fill="#0f1621" stroke={flash > 0 ? COL.amber : '#3a4f6a'} strokeWidth={3} />
      <text x={540} y={794} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={32} fill={COL.ink}>
        server = hash(key) mod <tspan fill={n === 5 ? COL.amber : COL.ink}>{n}</tspan>
      </text>
      <g opacity={co}>
        <rect x={210} y={1400} width={660} height={92} rx={20} fill="#1a1406" stroke={COL.amber} strokeWidth={3} />
        <text x={540} y={1440} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={38} fill={COL.amber}>
          {Math.round(ip(f, [A.fourIn5 - 4, A.fourIn5 + 26], [0, MOVED_MOD], Easing.linear))} of 40 keys moved
        </text>
        <text x={540} y={1475} textAnchor="middle" fontFamily={MONO} fontSize={22} fill={COL.dim} opacity={ip(f, [A.miss - 6, A.miss + 4], [0, 1])}>
          every one now misses → straight to the database
        </text>
      </g>
    </g>
  );
};

/* ───────── the ring ───────── */
const arcPath = (a: number, b: number, r: number) => {
  // clockwise from position a to position b (0..1, b may exceed a by up to 1)
  let span = b - a;
  if (span <= 0) span += 1;
  if (span >= 0.9999) span = 0.9999;
  const p0 = onRing(a, r);
  const p1 = onRing(a + span, r);
  return `M ${p0.x} ${p0.y} A ${r} ${r} 0 ${span > 0.5 ? 1 : 0} 1 ${p1.x} ${p1.y}`;
};
const KEY_R = RING.r - 36;
const ringVis = (f: number) => ip(f, [MORPH.a + 6, MORPH.b], [0, 1]) * ip(f, [S.payoff, S.payoff + 12], [1, 0]);

const RingTrack: React.FC<{f: number}> = ({f}) => {
  const o = ringVis(f);
  if (o <= 0) return null;
  const pts = ptsAt(f);
  const arcsOn = ip(f, [A.next - 6, A.next + 8], [0, 1]);
  const thick = ip(f, [A.slices - 6, A.slices + 6, S.vnodes, S.vnodes + 10], [10, 20, 20, 10]);
  // the slice that just changed hands glows
  const changed = (seg: {a: number; b: number; s: number}) => {
    if (f >= RING_ADD && f < RING_ADD + 30 && seg.s === 4) return ip(f, [RING_ADD, RING_ADD + 30], [1, 0]);
    if (f >= RING_REMOVE && f < RING_REMOVE + 30) {
      const succ = ownerRing(ringPoints([0, 2, 3, 4], false), SERVERS[1].pos).s;
      const b = SERVERS[1].pos;
      const prev = ringPoints([0, 1, 2, 3, 4], false).filter((p) => p.pos < b).pop()?.pos ?? 0;
      if (seg.s === succ && seg.a <= prev + 1e-9 && seg.b >= b - 1e-9) return ip(f, [RING_REMOVE, RING_REMOVE + 30], [1, 0]);
    }
    return 0;
  };
  const segs = pts.map((p, i) => ({a: i > 0 ? pts[i - 1].pos : pts[pts.length - 1].pos - 1, b: p.pos, s: p.s}));
  return (
    <g opacity={o}>
      <circle cx={RING.x} cy={RING.y} r={RING.r} fill="none" stroke="#1c2838" strokeWidth={10} />
      {segs.map((sg, i) => {
        const g = changed(sg);
        return (
          <g key={i} opacity={arcsOn}>
            {g > 0 ? <path d={arcPath(sg.a, sg.b, RING.r)} fill="none" stroke={SERVERS[sg.s].color} strokeWidth={thick + 22} opacity={0.25 * g} strokeLinecap="round" /> : null}
            <path d={arcPath(sg.a, sg.b, RING.r)} fill="none" stroke={SERVERS[sg.s].color} strokeWidth={thick} opacity={0.6} />
          </g>
        );
      })}
    </g>
  );
};

// A and B hash to nearby points: spread their IP labels apart so they don't overlap
const LABEL_NUDGE: Record<string, number> = (() => {
  const d = SERVERS[0].pos - SERVERS[1].pos;
  return Math.abs(d) < 0.06 ? {A: Math.sign(d) * 0.03, B: -Math.sign(d) * 0.03} : {};
})();
const RingServers: React.FC<{f: number}> = ({f}) => {
  const o = ringVis(f);
  if (o <= 0) return null;
  const out: React.ReactNode[] = [];
  const vOn = ip(f, [A.hundred - 4, A.hundred + 26], [0, 1]);
  for (let i = 0; i < 5; i++) {
    const s = SERVERS[i];
    let vis = 1;
    if (i === 4) vis = f < A.addRing - 2 ? 0 : ip(f, [A.addRing - 2, A.addRing + 8], [0, 1]);
    if (i === 1) vis = ip(f, [A.slide - 6, A.slide + 10], [1, 0]);
    if (vis <= 0) continue;
    const p = onRing(s.pos);
    const lpOut = onRing(s.pos + (LABEL_NUDGE[s.name] ?? 0), RING.r + 66);
    // keep labels out of the platform's right-hand button rail: those go just inside the ring instead
    const lp = lpOut.x > 880 && lpOut.y > 960 ? onRing(s.pos, RING.r - 92) : lpOut;
    const dead = i === 1 && f >= A.dies;
    const sc = i === 4 ? ip(f, [A.addRing - 2, A.addRing + 8], [0.4, 1], pop) : 1;
    const nodeO = 1 - 0.75 * vOn;
    out.push(
      <g key={i} opacity={vis}>
        <g transform={`translate(${p.x} ${p.y}) scale(${sc})`} opacity={nodeO}>
          <circle r={32} fill="#0f1621" stroke={dead ? COL.bad : s.color} strokeWidth={4} />
          {dead ? (
            <path d="M -13 -13 L 13 13 M 13 -13 L -13 13" stroke={COL.bad} strokeWidth={6} strokeLinecap="round" />
          ) : (
            <text y={10} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={28} fill={s.color}>
              {s.name}
            </text>
          )}
        </g>
        <text x={lp.x} y={lp.y + 7} textAnchor="middle" fontFamily={MONO} fontSize={20} fill={dead ? COL.bad : COL.dim} opacity={1 - vOn}>
          {s.ip}
        </text>
      </g>,
    );
    // its 100 virtual points
    if (vOn > 0 && i !== 1) {
      VPOS[i].forEach((vp, k) => {
        const t = ip(f, [A.hundred - 4 + (k % 25) * 0.8, A.hundred + 8 + (k % 25) * 0.8], [0, 1], glide);
        if (t <= 0) return;
        let d = vp - s.pos;
        if (d > 0.5) d -= 1;
        if (d < -0.5) d += 1;
        const pos = s.pos + d * t;
        const a = onRing(pos, RING.r - 13);
        const b = onRing(pos, RING.r + 13);
        out.push(<line key={`v${i}_${k}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={s.color} strokeWidth={3} opacity={0.95} />);
      });
    }
  }
  return <g opacity={o}>{out}</g>;
};

// a key's ring owner color (white until the slices are shown)
const keyColor = (k: number, f: number) => (f < A.next - 4 ? '#c9d4e2' : SERVERS[ringOwner(k, f)].color);
const RingKeys: React.FC<{f: number}> = ({f}) => {
  if (f < MORPH.a || f >= S.payoff + 14) return null;
  const out: React.ReactNode[] = [];
  const fade = ip(f, [S.payoff, S.payoff + 12], [1, 0]);
  KEYS.forEach((key, k) => {
    // morph: from its slot in the row to its point on the ring
    const t = ip(f, [MORPH.a + (k % 10) * 1.2, MORPH.b - 8 + (k % 10) * 1.2], [0, 1], glide);
    const from = rowKeyPos(k, MORPH.a);
    const to = onRing(key.pos, KEY_R);
    let x = lerp(from.x, to.x, t);
    let y = lerp(from.y, to.y, t);
    let col = t < 1 ? SERVERS[from.s].color : keyColor(k, f);
    // keys that change owner hop as they change colour
    let flash = 0;
    for (const at of [RING_ADD, RING_REMOVE, RING_VNODES]) {
      if (f >= at && f < at + 20 && ringOwner(k, at - 1) !== ringOwner(k, at)) {
        flash = 1 - (f - at) / 20;
        const hop = Math.sin(((f - at) / 20) * Math.PI) * 26;
        const c = onRing(key.pos, KEY_R - hop);
        x = c.x;
        y = c.y;
      }
    }
    // everyone else stays put: a calm white ring on the keys that didn't move
    const stay = f >= A.stays - 2 && f < A.stays + 26 && ringOwner(k, RING_REMOVE - 1) === ringOwner(k, RING_REMOVE) ? ip(f, [A.stays - 2, A.stays + 6, A.stays + 18, A.stays + 26], [0, 1, 1, 0]) : 0;
    out.push(
      <g key={k} opacity={fade}>
        {flash > 0 ? <circle cx={x} cy={y} r={16} fill={COL.amber} opacity={0.35 * flash} /> : null}
        <circle cx={x} cy={y} r={8} fill={col} />
        {stay > 0 ? <circle cx={x} cy={y} r={14} fill="none" stroke={COL.ink} strokeWidth={2} opacity={stay} /> : null}
      </g>,
    );
  });
  return <g>{out}</g>;
};

/* a lookup: the key lights up and its request walks clockwise to the server that owns it */
const walkTo = (k: number, f: number) => {
  const pts = ptsAt(f);
  const o = ownerRing(pts, KEYS[k].pos);
  let d = o.pos - KEYS[k].pos;
  if (d < 0) d += 1;
  return {owner: o.s, end: KEYS[k].pos + d, d};
};
const Lookups: React.FC<{f: number}> = ({f}) => {
  if (f < MORPH.b || f >= S.payoff) return null;
  const out: React.ReactNode[] = [];
  for (const l of LOOKUPS) {
    if (f < l.at || f >= l.at + 22) continue;
    if (f >= A.clockwise - 10 && f < A.next + 30) continue; // the featured walk has the stage
    const w = walkTo(l.key, l.at);
    const dur = 6 + w.d * 40;
    const t = ip(f, [l.at, l.at + dur], [0, 1], glide);
    const col = SERVERS[w.owner].color;
    if (f < l.at + dur) {
      const p = onRing(lerp(KEYS[l.key].pos, w.end, t), KEY_R + 18);
      out.push(<circle key={l.at} cx={p.x} cy={p.y} r={6} fill={col} opacity={0.9} />);
    } else {
      const k = (f - l.at - dur) / 10;
      const p = onRing(w.end, RING.r);
      if (k < 1) out.push(<circle key={l.at} cx={p.x} cy={p.y} r={30 + k * 22} fill="none" stroke={col} strokeWidth={2.5} opacity={(1 - k) * 0.6} />);
    }
  }
  return <g opacity={ringVis(f)}>{out}</g>;
};

/* the featured key's walk */
const Featured: React.FC<{f: number}> = ({f}) => {
  const a = A.clockwise - 8;
  if (f < a || f >= A.next + 40) return null;
  const k = FEATURE;
  const w = walkTo(k, a);
  const t = ip(f, [A.clockwise, A.next + 4], [0, 1], glide);
  const p = onRing(lerp(KEYS[k].pos, w.end, t), KEY_R + 18);
  const kp = onRing(KEYS[k].pos, KEY_R - 70);
  const o = ip(f, [a, a + 6, A.next + 30, A.next + 40], [0, 1, 1, 0]);
  const arrived = f >= A.next + 4;
  const sp = onRing(w.end, RING.r);
  const col = arrived ? SERVERS[w.owner].color : COL.ink;
  return (
    <g opacity={o}>
      <path d={arcPath(KEYS[k].pos, lerp(KEYS[k].pos, w.end, t) + 1e-4, KEY_R + 18)} fill="none" stroke={COL.amber} strokeWidth={4} strokeDasharray="2 8" strokeLinecap="round" />
      <circle cx={p.x} cy={p.y} r={16} fill={COL.amber} opacity={0.25} />
      <circle cx={p.x} cy={p.y} r={9} fill={COL.amber} />
      <g transform={`translate(${kp.x} ${kp.y})`}>
        <rect x={-74} y={-22} width={148} height={44} rx={22} fill="#0f1621" stroke={col} strokeWidth={3} />
        <text y={8} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={21} fill={col}>
          {KEYS[k].name}
        </text>
      </g>
      {arrived ? <circle cx={sp.x} cy={sp.y} r={40 + ((f - A.next - 4) % 14) * 2} fill="none" stroke={SERVERS[w.owner].color} strokeWidth={3} opacity={0.7} /> : null}
    </g>
  );
};

/* top-of-diagram notes: moved counts, real systems */
const Note: React.FC<{o: number; big: string; small?: string; col: string; so?: number}> = ({o, big, small, col, so = 1}) =>
  o > 0 ? (
    <div style={{position: 'absolute', left: 0, right: 0, top: 508, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: o}}>
      <div style={{padding: '12px 30px', borderRadius: 20, background: '#0f1621', border: `3px solid ${col}`, fontFamily: SANS, fontWeight: 800, fontSize: 40, color: col}}>{big}</div>
      {small ? <div style={{marginTop: 10, fontFamily: MONO, fontSize: 23, color: COL.dim, opacity: so}}>{small}</div> : null}
    </div>
  ) : null;
const Notes: React.FC<{f: number}> = ({f}) => {
  const addO = ip(f, [A.oneIn5 - 6, A.oneIn5 + 4, S.remove - 6, S.remove + 4], [0, 1, 1, 0]);
  const remO = ip(f, [A.slide + 4, A.slide + 14, S.lumpy - 6, S.lumpy + 4], [0, 1, 1, 0]);
  const realO = ip(f, [A.cassandra - 6, A.cassandra + 4, S.payoff - 6, S.payoff + 4], [0, 1, 1, 0]);
  const moved = Math.round(ip(f, [A.oneIn5 - 6, A.oneIn5 + 14], [0, MOVED_ADD], Easing.linear));
  return (
    <>
      <Note o={addO} big={`${moved} of 40 keys moved`} small={`mod N moved ${MOVED_MOD}`} col={COL.ok} so={ip(f, [A.not - 4, A.not + 6], [0, 1])} />
      <Note o={remO} big={`only B’s ${MOVED_REMOVE} keys moved`} col={COL.pink} />
      {realO > 0 ? (
        <div style={{position: 'absolute', left: 70, right: 150, top: 512, display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', opacity: realO}}>
          {[
            ['Apache Cassandra', A.cassandra],
            ['Amazon Dynamo', A.dynamo],
            ['1,000s of machines', A.thousands],
          ].map(([t, at]) => (
            <div key={t as string} style={{padding: '10px 22px', borderRadius: 999, border: `2.5px solid ${COL.violet}`, background: '#120f22', fontFamily: MONO, fontWeight: 600, fontSize: 24, color: COL.violet, opacity: ip(f, [(at as number) - 4, (at as number) + 6], [0, 1]), scale: String(ip(f, [(at as number) - 4, (at as number) + 6], [0.8, 1], pop))}}>
              {t}
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
};

/* shares of the ring, inside it */
const Shares: React.FC<{f: number}> = ({f}) => {
  const o = ip(f, [A.slices - 8, A.slices + 4, S.real - 8, S.real + 4], [0, 1, 1, 0]);
  if (o <= 0) return null;
  const ev = ip(f, [A.even - 6, A.even + 18], [0, 1], glide);
  const dbl = ip(f, [A.double - 4, A.double + 6], [0, 1]) * (1 - ev);
  const order = [0, 2, 3, 4];
  return (
    <g opacity={o}>
      <text x={RING.x} y={RING.y - 128} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={21} letterSpacing={2} fill={COL.dim}>
        SHARE OF THE WORK
      </text>
      {order.map((s, i) => {
        const v = lerp(SHARE_LUMPY[s], SHARE_VNODES[s], ev);
        const y = RING.y - 86 + i * 58;
        const hot = s === 2 && dbl > 0;
        const col = hot ? COL.bad : SERVERS[s].color;
        return (
          <g key={s}>
            <text x={RING.x - 170} y={y + 9} fontFamily={SANS} fontWeight={800} fontSize={28} fill={SERVERS[s].color}>
              {SERVERS[s].name}
            </text>
            <rect x={RING.x - 135} y={y - 10} width={250} height={22} rx={11} fill="#1c2838" />
            <rect x={RING.x - 135} y={y - 10} width={250 * Math.min(1, v / 0.5)} height={22} rx={11} fill={col} />
            <text x={RING.x + 175} y={y + 9} textAnchor="end" fontFamily={MONO} fontWeight={600} fontSize={24} fill={col}>
              {Math.round(v * 100)}%
            </text>
          </g>
        );
      })}
      <g opacity={dbl} transform={`translate(${RING.x} ${RING.y + 170})`}>
        <rect x={-120} y={-24} width={240} height={46} rx={23} fill="#1a0d10" stroke={COL.bad} strokeWidth={2.5} />
        <text y={9} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={23} fill={COL.bad}>
          C: ~2× its share
        </text>
      </g>
      <g opacity={ip(f, [A.even + 10, A.even + 20], [0, 1])} transform={`translate(${RING.x} ${RING.y + 170})`}>
        <rect x={-120} y={-24} width={240} height={46} rx={23} fill="#10261a" stroke={COL.ok} strokeWidth={2.5} />
        <text y={9} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={23} fill={COL.ok}>
          all ~25% ✓
        </text>
      </g>
    </g>
  );
};

/* the row servers bending into ring nodes */
const Morph: React.FC<{f: number}> = ({f}) => {
  if (f < MORPH.a || f >= MORPH.b + 4) return null;
  const out: React.ReactNode[] = [];
  for (let i = 0; i < 4; i++) {
    const t = ip(f, [MORPH.a, MORPH.b], [0, 1], glide);
    const p = onRing(SERVERS[i].pos);
    const x = lerp(rowX(i, MORPH.a), p.x, t);
    const y = lerp(ROW_Y + ROW_H / 2, p.y, t);
    out.push(<circle key={i} cx={x} cy={y} r={lerp(70, 32, t)} fill="none" stroke={SERVERS[i].color} strokeWidth={4} opacity={1 - t * 0.6} />);
  }
  return <g>{out}</g>;
};

/* ───────── recap: 4 lines (no follow/share; it loops back to the hook) ───────── */
const RECAP = [
  ['Servers + keys on a ring', 'each key → next server, clockwise'],
  ['Add a server: ~1/N moves', '4 → 5 servers: 1 in 5 keys, not 4 in 5'],
  ['Lose one: its neighbour covers', 'everyone else stays put'],
  ['Virtual nodes even it out', '100 points per server ≈ fair slices'],
];
const Recap: React.FC<{f: number}> = ({f}) => {
  const r = S.payoff;
  if (f < r) return null;
  return (
    <div style={{position: 'absolute', left: 70, right: 150, top: 250, scale: String(1 + 0.02 * ip(f, [r, S.total], [0, 1], Easing.linear)), transformOrigin: '0 0'}}>
      <div style={{fontFamily: MONO, fontWeight: 600, fontSize: 27, letterSpacing: 3, color: COL.amber, opacity: ip(f, [r, r + 8], [0, 1])}}>RECAP</div>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 76, lineHeight: 1.08, letterSpacing: -2, color: COL.ink, marginTop: 18, opacity: ip(f, [r + 4, r + 14], [0, 1])}}>Consistent hashing,</div>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 76, lineHeight: 1.08, letterSpacing: -2, color: COL.ink, opacity: ip(f, [r + 8, r + 18], [0, 1])}}>in 4 lines.</div>
      <div style={{marginTop: 110}}>
        {RECAP.map(([a, b], i) => {
          const p = ip(f, [r + 22 + i * 14, r + 34 + i * 14], [0, 1]);
          const col = SERVERS[[0, 4, 1, 3][i]].color;
          // after all four land, a glow walks down the list (a reading guide, and keeps the frame alive)
          const g = f >= r + 80 ? Math.max(0, 1 - Math.abs(((f - r - 80) / 22) % 4 - i)) : 0;
          return (
            <div key={i} style={{display: 'flex', gap: 28, alignItems: 'flex-start', marginBottom: 74, opacity: p, translate: `${(1 - p) * -30}px 0`}}>
              <div style={{width: 54, height: 54, borderRadius: 14, border: `3px solid ${col}`, background: `${col}${Math.round(g * 60).toString(16).padStart(2, '0')}`, boxShadow: `0 0 ${24 * g}px ${col}`, scale: String(1 + 0.08 * g), display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none'}}>
                <svg width={28} height={28} viewBox="0 0 24 24">
                  <path d="M4 12.5l5 5L20 6.5" fill="none" stroke={col} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 46, color: COL.ink, letterSpacing: -0.5}}>{a}</div>
                <div style={{fontFamily: MONO, fontSize: 29, color: COL.dim, marginTop: 6}}>{b}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const LOOP = 14;
export const Explainer: React.FC<{captions?: boolean}> = ({captions = false}) => {
  const f = useCurrentFrame();
  const loop = ip(f, [S.total - LOOP, S.total - 1], [0, 1]);
  return (
    <AbsoluteFill>
      <Frame f={f} captions={captions} />
      {loop > 0 ? (
        <AbsoluteFill style={{opacity: loop}}>
          <Frame f={0} captions={captions} />
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

const Frame: React.FC<{f: number; captions: boolean}> = ({f, captions}) => {
  const breathe = 1.0 + 0.012 * Math.sin((f / 90) * Math.PI);
  return (
    <AbsoluteFill style={{background: COL.bg}}>
      <AbsoluteFill style={{backgroundImage: 'radial-gradient(rgba(140,160,190,0.08) 1.5px, transparent 1.5px)', backgroundSize: '36px 36px', backgroundPosition: `0 ${-f * 0.4}px`}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 60% at 50% 52%, rgba(169,139,255,0.05), rgba(0,0,0,0) 70%)'}} />
      <AbsoluteFill style={{scale: String(breathe), transformOrigin: '540px 1000px'}}>
        <svg width={1080} height={1920} style={{position: 'absolute'}}>
          <Row f={f} />
          <RowTraffic f={f} />
          <ModN f={f} />
          <RingTrack f={f} />
          <Morph f={f} />
          <RingServers f={f} />
          <RingKeys f={f} />
          <Lookups f={f} />
          <Featured f={f} />
          <Shares f={f} />
        </svg>
      </AbsoluteFill>
      <Stats f={f} />
      <Notes f={f} />
      {COPY.map((c, i) => (
        <Headline key={i} f={f} c={c} />
      ))}
      <Recap f={f} />
      <Progress f={f} />
      {captions ? <Captions f={f} lines={CAPS} accent={COL.amber} /> : null}
    </AbsoluteFill>
  );
};
