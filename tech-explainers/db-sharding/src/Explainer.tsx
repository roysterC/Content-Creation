import React from 'react';
import {AbsoluteFill, Easing, interpolate, random, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {
  A, arriveAt, atRouter, CACHE_OFF, CACHE_ON, CACHE_Y, COL, DB, DIRECT, gatherArrive, gatherLeave, L1, L2, loadAt, MERGED, MOVES, nShards, PILLS, PKTS, RANGE_OFF, RANGE_ON, reshardT, ROUTER, ROUTER_ON, ruleAt, S, SCATTER, scatterArrive, SHARD, SHARD_COL, shardW, shardX, slot4, slot5, SPAWN_Y, SPLIT_END, STAR_SHARD, STORED, users,
} from './sim';
import CAPS from './captions.json';
import {Captions} from '../../_shared/Captions';

for (const w of ['400', '500', '600', '800']) loadFont({family: 'Inter', url: staticFile(`inter-${w}.woff2`), weight: w});
for (const w of ['400', '600']) loadFont({family: 'Plex Mono', url: staticFile(`mono-${w}.woff2`), weight: w});
const SANS = 'Inter, sans-serif';
const MONO = '"Plex Mono", monospace';

const ease = Easing.bezier(0.25, 0.1, 0.25, 1);
const glide = Easing.bezier(0.4, 0, 0.6, 1);
const ip = (f: number, i: number[], o: number[], e = ease) => interpolate(f, i, o, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: e});
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const n = (x: number) => Math.round(x).toLocaleString('en-GB');

/* ───────── copy ───────── */
type Copy = {at: number; until: number; kicker: string; head: string[]; kColor?: string};
const COPY: Copy[] = [
  {at: S.hook, until: S.series, kicker: 'DATABASE SHARDING · EXPLAINED', head: ['POV: one database,', 'every single write.'], kColor: COL.bad},
  {at: S.series, until: S.fix, kicker: 'EXPERT IN UNDER 1 MINUTE', head: ['Database sharding,', 'expert level.'], kColor: COL.amber},
  {at: S.fix, until: S.key, kicker: '01 · SPLIT IT', head: ['Many databases.', 'Each holds a slice.'], kColor: COL.ok},
  {at: S.key, until: S.range, kicker: '02 · THE SHARD KEY', head: ['Same user,', 'same shard.'], kColor: COL.req},
  {at: S.range, until: S.hot, kicker: '03 · BY RANGE', head: ['Simple. Until', 'the new users land.'], kColor: COL.amber},
  {at: S.hot, until: S.cross, kicker: '04 · THE HOT KEY', head: ['One star.', 'One melting shard.'], kColor: COL.pink},
  {at: S.cross, until: S.reshard, kicker: '05 · CROSS-SHARD', head: ['Ask every shard,', 'then merge.'], kColor: COL.violet},
  {at: S.reshard, until: S.payoff, kicker: '06 · RESHARDING', head: ['Add one shard,', 'move 80% of users.'], kColor: COL.amber},
  {at: S.payoff, until: S.total, kicker: 'SHARDED', head: ['No single database', 'holds them all.'], kColor: COL.ok},
];
const Headline: React.FC<{f: number; c: Copy}> = ({f, c}) => {
  if (f < c.at - 1 || f >= c.until) return null;
  const out = c.until === S.total ? 1 : ip(f, [c.until - 8, c.until], [1, 0]);
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
  const marks = [S.fix, S.key, S.range, S.hot, S.cross, S.reshard, S.payoff];
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

/* ───────── helpers ───────── */
const loadCol = (l: number) => (l >= 85 ? COL.bad : l >= 55 ? COL.amber : COL.ok);
const Cylinder: React.FC<{x: number; top: number; bottom: number; w: number; stroke: string; fill: string; sw?: number}> = ({x, top, bottom, w, stroke, fill, sw = 3}) => {
  const rx = w / 2;
  const ry = Math.max(12, w * 0.1);
  return (
    <g>
      <path d={`M ${x - rx} ${top} L ${x - rx} ${bottom} A ${rx} ${ry} 0 0 0 ${x + rx} ${bottom} L ${x + rx} ${top}`} fill={fill} stroke={stroke} strokeWidth={sw} />
      <ellipse cx={x} cy={top} rx={rx} ry={ry} fill="#152132" stroke={stroke} strokeWidth={sw} />
    </g>
  );
};

/* users online (stat 1 of 2 on the first screen) */
const UsersCounter: React.FC<{f: number}> = ({f}) => {
  const o = f < S.fix ? ip(f, [A.split - 30, A.split - 10], [1, 0]) : ip(f, [S.payoff - 2, S.payoff + 10], [0, 1]);
  if (o <= 0) return null;
  const pay = f >= S.payoff;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 492, textAlign: 'center', opacity: o, fontFamily: MONO, fontSize: 30, color: COL.dim}}>
      <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 46, color: COL.ink, letterSpacing: -1}}>{n(users(f))}</span> users
      {pay ? <div style={{fontSize: 24, marginTop: 4, color: COL.ok, opacity: ip(f, [A.all - 30, A.all - 16], [0, 1])}}>5 shards · ~20 million each</div> : null}
    </div>
  );
};

/* ───────── the single database (hook) ───────── */
const BigDb: React.FC<{f: number}> = ({f}) => {
  const o = ip(f, [A.split + 2, A.split + 16], [1, 0]);
  if (o <= 0) return null;
  const load = loadAt(-1, f);
  const shake = load >= 95 ? (random(`bs${f}`) - 0.5) * 7 : 0;
  const pulse = 0.5 + 0.5 * Math.sin(f / 4);
  return (
    <g opacity={o} transform={`translate(${shake} 0)`}>
      <circle cx={DB.x} cy={(DB.top + DB.bottom) / 2} r={300} fill={COL.bad} opacity={0.05 + 0.04 * pulse} />
      <Cylinder x={DB.x} top={DB.top} bottom={DB.bottom} w={DB.w} stroke={COL.bad} fill="#1a0d10" sw={4} />
      <text x={DB.x} y={DB.top + 84} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={36} fill={COL.bad}>
        CPU {load}%
      </text>
      <rect x={DB.x - 170} y={DB.top + 104} width={340} height={16} rx={8} fill="#2a1418" />
      <rect x={DB.x - 170} y={DB.top + 104} width={3.4 * load} height={16} rx={8} fill={COL.bad} />
      <text x={DB.x} y={DB.bottom + 70} textAnchor="middle" fontFamily={MONO} fontSize={26} fill={COL.dim}>
        one database · every write
      </text>
    </g>
  );
};

/* ───────── shards ───────── */
const SHARD_LABEL_RANGE = ['0–25M', '25–50M', '50–75M', '75M+'];
const Shards: React.FC<{f: number}> = ({f}) => {
  if (f < A.split) return null;
  const out: React.ReactNode[] = [];
  const w = shardW(f);
  const ns = nShards(f);
  for (let i = 0; i < ns; i++) {
    const x = shardX(i, f);
    const appear = i === 4 ? ip(f, [A.fifth - 4, A.fifth + 8], [0, 1]) : ip(f, [A.split, A.split + 14], [0, 1]);
    const load = loadAt(i, f);
    const hot = load >= 85;
    const shake = hot ? (random(`ss${i}${f}`) - 0.5) * 6 : 0;
    const col = SHARD_COL[i];
    const rangeLbl = f >= RANGE_ON && f < RANGE_OFF ? ip(f, [i === 0 ? A.first : A.next + (i - 1) * 6, (i === 0 ? A.first : A.next + (i - 1) * 6) + 8], [0, 1]) * ip(f, [RANGE_OFF - 8, RANGE_OFF], [1, 0]) : 0;
    out.push(
      <g key={i} opacity={appear} transform={`translate(${shake} 0)`}>
        {hot ? <circle cx={x} cy={(SHARD.top + SHARD.bottom) / 2} r={150} fill={COL.bad} opacity={0.1} /> : null}
        <Cylinder x={x} top={SHARD.top} bottom={SHARD.bottom} w={w} stroke={hot ? COL.bad : col} fill={hot ? '#1a0d10' : '#0f1621'} sw={hot ? 4 : 3} />
        <text x={x} y={SHARD.top + 62} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={24} fill={loadCol(load)}>
          CPU {load}%
        </text>
        <rect x={x - w / 2 + 18} y={SHARD.top + 78} width={w - 36} height={10} rx={5} fill="#1c2838" />
        <rect x={x - w / 2 + 18} y={SHARD.top + 78} width={((w - 36) * load) / 100} height={10} rx={5} fill={loadCol(load)} />
        <text x={x} y={SHARD.bottom + 54} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={25} fill={col} opacity={1 - rangeLbl}>
          shard {i}
        </text>
        <text x={x} y={SHARD.bottom + 54} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={25} fill={COL.amber} opacity={rangeLbl}>
          {SHARD_LABEL_RANGE[i] ?? ''}
        </text>
      </g>,
    );
  }
  // the star's post lives on one shard
  if (f >= PILLS[2].leave + L2 && f < S.cross + 20) {
    const k = ip(f, [PILLS[2].leave + L2, PILLS[2].leave + L2 + 8], [0, 1], Easing.bezier(0.2, 1.6, 0.4, 1)) * ip(f, [S.cross + 6, S.cross + 20], [1, 0]);
    out.push(
      <text key="star" x={shardX(STAR_SHARD, f)} y={SHARD.bottom - 22} textAnchor="middle" fontSize={44 * k} fill={COL.amber}>
        ★
      </text>,
    );
  }
  return <g>{out}</g>;
};

/* new sign-ups tag (drawn above the traffic so it stays readable) */
const SignupTag: React.FC<{f: number}> = ({f}) => {
  if (f < A.newUsers || f >= RANGE_OFF) return null;
  const out: React.ReactNode[] = [];
  {
    const o = ip(f, [A.newUsers, A.newUsers + 8, RANGE_OFF - 10, RANGE_OFF], [0, 1, 1, 0]);
    out.push(
      <g key="new" opacity={o}>
        <rect x={shardX(3, f) - 185} y={SHARD.top - 84} width={270} height={48} rx={24} fill="#1a1406" stroke={COL.amber} strokeWidth={2.5} />
        <text x={shardX(3, f) - 50} y={SHARD.top - 52} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={23} fill={COL.amber}>
          every new sign-up
        </text>
      </g>,
    );
  }
  return <g>{out}</g>;
};

/* stored users: 40 dots that live in the database, then move to their shard (id mod 4), then to id mod 5 */
const bigSlot = (k: number) => ({x: DB.x - 7 * 21 + (k % 8) * 42, y: DB.top + 160 + Math.floor(k / 8) * 28});
const shardSlot = (shard: number, s: number, f: number) => ({x: shardX(shard, f) - 45 + (s % 4) * 30, y: SHARD.top + 128 + Math.floor(s / 4) * 34});
const Stored: React.FC<{f: number}> = ({f}) => {
  const dim = f >= RANGE_ON && f < RANGE_OFF ? ip(f, [RANGE_ON, RANGE_ON + 8, RANGE_OFF - 8, RANGE_OFF], [1, 0.3, 0.3, 1]) : 1;
  const out: React.ReactNode[] = [];
  STORED.forEach((id, k) => {
    const s4 = {shard: id % 4, slot: slot4(id)};
    const s5 = {shard: id % 5, slot: slot5[id]};
    const moves = s4.shard !== s5.shard;
    const st = A.split + (k % 10) * 1.6;
    const t1 = ip(f, [st, st + 14], [0, 1], glide);
    const big = bigSlot(k);
    const p4 = shardSlot(s4.shard, s4.slot, f);
    let x = lerp(big.x, p4.x, t1);
    let y = lerp(big.y, p4.y, t1) - Math.sin(t1 * Math.PI) * 60;
    let col = t1 < 0.5 ? COL.bad : SHARD_COL[s4.shard];
    const mt = A.moves - 4 + (k % 16) * 1.5;
    const t2 = ip(f, [mt, mt + 16], [0, 1], glide);
    if (t2 > 0) {
      const p5 = shardSlot(s5.shard, s5.slot, f);
      x = lerp(x, p5.x, t2);
      y = lerp(y, p5.y, t2) - (moves ? Math.sin(t2 * Math.PI) * 90 : 0);
      if (t2 > 0.5) col = SHARD_COL[s5.shard];
    }
    const stayRing = !moves && f >= A.fourIn5 - 4 && f < S.payoff;
    const moveRing = moves && f >= mt && f < mt + 20;
    out.push(
      <g key={id} opacity={dim}>
        {moveRing ? <circle cx={x} cy={y} r={14} fill={COL.amber} opacity={0.25} /> : null}
        <circle cx={x} cy={y} r={9} fill={col} />
        {stayRing ? <circle cx={x} cy={y} r={13} fill="none" stroke={COL.ink} strokeWidth={2.5} opacity={ip(f, [A.fourIn5 - 4, A.fourIn5 + 4], [0, 1])} /> : null}
      </g>,
    );
  });
  return <g>{out}</g>;
};

/* ───────── the router ───────── */
const ruleText = (f: number) => {
  const r = ruleAt(f);
  if (f >= A.mod5) return f < A.mod5 + 14 ? 'id mod 4 → id mod 5' : 'shard = id mod 5';
  if (r === 'range') return 'shard = id range';
  return 'shard = id mod 4';
};
const Router: React.FC<{f: number}> = ({f}) => {
  const o = ip(f, [SPLIT_END - 10, SPLIT_END + 2], [0, 1]);
  if (o <= 0) return null;
  // readout: what the router is working out right now
  let read = ruleText(f);
  let rc = COL.ink;
  const pill = PILLS.find((p) => f >= p.spawn + L1 && f < p.leave + 6);
  if (pill) {
    if (pill.id === PILLS[0].id && f < A.mod4 - 2 && pill === PILLS[0]) read = `hash(${pill.id}) …`;
    else read = `${pill.id} mod 4 = ${pill.shard}`;
    rc = SHARD_COL[pill.shard];
  }
  if (f >= A.top - 4 && f < S.reshard - 6) {
    read = f < MERGED ? 'top posts worldwide?' : 'merged ✓';
    rc = f < MERGED ? COL.violet : COL.ok;
  }
  const flash = pill ? 1 : 0;
  return (
    <g opacity={o}>
      <rect x={ROUTER.x - ROUTER.w / 2} y={ROUTER.y - ROUTER.h / 2} width={ROUTER.w} height={ROUTER.h} rx={22} fill="#0f1621" stroke={flash ? rc : '#3a4f6a'} strokeWidth={3} />
      <text x={ROUTER.x - ROUTER.w / 2 + 22} y={ROUTER.y - ROUTER.h / 2 + 32} fontFamily={MONO} fontWeight={600} fontSize={20} letterSpacing={2} fill={COL.dim}>
        ROUTER
      </text>
      <text x={ROUTER.x} y={ROUTER.y + 32} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={32} fill={rc}>
        {read}
      </text>
    </g>
  );
};
const Wires: React.FC<{f: number}> = ({f}) => {
  const o = ip(f, [SPLIT_END - 6, SPLIT_END + 4], [0, 0.9]);
  if (o <= 0) return null;
  const ns = nShards(f);
  return (
    <g stroke="#1e2b3d" strokeWidth={2.5} strokeDasharray="5 9" opacity={o}>
      {Array.from({length: ns}).map((_, i) => (
        <line key={i} x1={ROUTER.x + (i - (ns - 1) / 2) * 40} y1={ROUTER.y + ROUTER.h / 2} x2={shardX(i, f)} y2={SHARD.top - 16} opacity={i === 4 ? reshardT(f) : 1} />
      ))}
    </g>
  );
};

/* the cache in front of the hot shard */
const Cache: React.FC<{f: number}> = ({f}) => {
  const o = ip(f, [CACHE_ON - 4, CACHE_ON + 6, CACHE_OFF - 12, CACHE_OFF], [0, 1, 1, 0]);
  if (o <= 0) return null;
  const x = shardX(STAR_SHARD, f);
  const hits = PKTS.filter((p) => p.toCache && arriveAt(p) <= f).length;
  const s = ip(f, [CACHE_ON - 4, CACHE_ON + 6], [0.7, 1], Easing.bezier(0.2, 1.6, 0.4, 1));
  return (
    <g opacity={o} transform={`translate(${x} ${CACHE_Y}) scale(${s})`}>
      <rect x={-112} y={-36} width={224} height={72} rx={16} fill="#10261a" stroke={COL.ok} strokeWidth={3.5} />
      <text x={-92} y={-4} fontFamily={MONO} fontWeight={600} fontSize={22} fill={COL.ok} letterSpacing={2}>
        CACHE
      </text>
      <text x={-92} y={24} fontFamily={MONO} fontSize={20} fill={COL.ink}>
        hits: {n(hits)}
      </text>
    </g>
  );
};

/* ───────── traffic ───────── */
const Packets: React.FC<{f: number}> = ({f}) => {
  const out: React.ReactNode[] = [];
  for (const p of PKTS) {
    if (f < p.spawn) continue;
    const a = arriveAt(p);
    if (f >= a + 10) continue;
    const startX = p.x0;
    let x: number;
    let y: number;
    let col = p.kind === 'signup' ? COL.amber : p.kind === 'fan' ? COL.pink : p.direct ? COL.req : '#c9d4e2';
    if (p.direct) {
      const tx = DB.x + (p.x0 - 540) * 0.35;
      if (f >= a) {
        const k = (f - a) / 10;
        out.push(<circle key={p.i} cx={tx} cy={DB.top} r={8 + k * 20} fill="none" stroke={COL.bad} strokeWidth={3} opacity={(1 - k) * 0.6} />);
        continue;
      }
      const t = ip(f, [p.spawn, a], [0, 1], glide);
      x = lerp(startX, tx, t);
      y = lerp(SPAWN_Y, DB.top, t);
    } else {
      const r = atRouter(p);
      const rx = ROUTER.x + (p.x0 - 540) * 0.3;
      if (f < r) {
        const t = ip(f, [p.spawn, r], [0, 1], glide);
        x = lerp(startX, rx, t);
        y = lerp(SPAWN_Y, ROUTER.y - ROUTER.h / 2, t);
      } else {
        if (f < r + 2) continue;
        const tx = shardX(p.target, f);
        const ty = p.toCache ? CACHE_Y - 36 : SHARD.top - 16;
        if (p.kind === 'user') col = SHARD_COL[p.target];
        if (f >= a) {
          const k = (f - a) / 10;
          out.push(<circle key={p.i} cx={tx} cy={ty} r={8 + k * 18} fill="none" stroke={p.toCache ? COL.ok : col} strokeWidth={3} opacity={(1 - k) * 0.7} />);
          continue;
        }
        const t = ip(f, [r + 2, a], [0, 1], glide);
        x = lerp(ROUTER.x + (p.target - 1.5) * 40, tx, t);
        y = lerp(ROUTER.y + ROUTER.h / 2, ty, t);
      }
    }
    const fadeIn = ip(f, [p.spawn, p.spawn + 5], [0, 1]);
    out.push(
      <g key={p.i} opacity={fadeIn}>
        <circle cx={x} cy={y} r={15} fill={col} opacity={0.16} />
        <circle cx={x} cy={y} r={7.5} fill={col} />
      </g>,
    );
  }
  return <g>{out}</g>;
};

/* labelled requests: user 1042 (twice) and the cricket star */
const Pills: React.FC<{f: number}> = ({f}) => {
  const out: React.ReactNode[] = [];
  PILLS.forEach((p, k) => {
    const end = p.leave + L2;
    if (f < p.spawn || f >= end + 40) return;
    let x: number;
    let y: number;
    const tx = shardX(p.shard, f);
    if (f < p.spawn + L1) {
      const t = ip(f, [p.spawn, p.spawn + L1], [0, 1], glide);
      x = ROUTER.x;
      y = lerp(SPAWN_Y - 10, ROUTER.y - ROUTER.h / 2 - 30, t);
    } else if (f < p.leave) {
      x = ROUTER.x;
      y = ROUTER.y - ROUTER.h / 2 - 30;
    } else {
      const t = ip(f, [p.leave, end], [0, 1], glide);
      x = lerp(ROUTER.x, tx, t);
      y = lerp(ROUTER.y + ROUTER.h / 2 + 10, SHARD.top - 40, t);
    }
    const col = f >= p.leave ? SHARD_COL[p.shard] : p.id === PILLS[2].id ? COL.amber : COL.ink;
    const fade = ip(f, [p.spawn, p.spawn + 5, end + 26, end + 40], [0, 1, 1, 0]);
    const w = p.label.length * 13 + 30;
    out.push(
      <g key={k} opacity={fade}>
        <rect x={x - w / 2} y={y - 22} width={w} height={44} rx={22} fill="#0f1621" stroke={col} strokeWidth={3} />
        <text x={x} y={y + 8} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={22} fill={col}>
          {p.label}
        </text>
        {p.note && f >= end ? (
          <text x={tx} y={SHARD.top - 76} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={30} fill={COL.ok} opacity={ip(f, [end, end + 6], [0, 1])}>
            {p.note}
          </text>
        ) : null}
      </g>,
    );
  });
  return <g>{out}</g>;
};

/* cross-shard query: scatter, gather, merge */
const CrossQuery: React.FC<{f: number}> = ({f}) => {
  if (f < SCATTER || f > S.reshard + 10) return null;
  const out: React.ReactNode[] = [];
  for (let i = 0; i < 4; i++) {
    const leave = SCATTER + i * 2;
    const arr = scatterArrive(i);
    const gl = gatherLeave(i);
    const ga = gatherArrive(i);
    const sx = shardX(i, f);
    const rx = ROUTER.x + (i - 1.5) * 40;
    if (f >= leave && f < arr) {
      const t = ip(f, [leave, arr], [0, 1], glide);
      out.push(<circle key={`s${i}`} cx={lerp(rx, sx, t)} cy={lerp(ROUTER.y + ROUTER.h / 2, SHARD.top - 16, t)} r={9} fill={COL.violet} />);
    }
    if (f >= arr && f < gl) out.push(<circle key={`w${i}`} cx={sx} cy={SHARD.top - 16} r={10 + ((f - arr) % 10) * 2} fill="none" stroke={COL.violet} strokeWidth={2.5} opacity={1 - ((f - arr) % 10) / 10} />);
    if (f >= gl && f < ga + 4) {
      const t = ip(f, [gl, ga], [0, 1], glide);
      const x = lerp(sx, rx, t);
      const y = lerp(SHARD.top - 16, ROUTER.y + ROUTER.h / 2 + 4, t);
      out.push(
        <g key={`g${i}`}>
          <rect x={x - 40} y={y - 17} width={80} height={34} rx={10} fill="#16122a" stroke={SHARD_COL[i]} strokeWidth={2} />
          <text x={x} y={y + 7} textAnchor="middle" fontFamily={MONO} fontSize={18} fill={SHARD_COL[i]}>
            top 3
          </text>
        </g>,
      );
    }
    if (i === 3 && f >= arr && f < gl) out.push(<text key="slow" x={sx - 20} y={SHARD.top - 44} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={23} fill={COL.amber}>slowest…</text>);
  }
  // the merged answer
  const mo = ip(f, [MERGED, MERGED + 8, S.reshard - 4, S.reshard + 8], [0, 1, 1, 0]);
  if (mo > 0)
    out.push(
      <g key="merged" opacity={mo} transform={`translate(540 ${ROUTER.y - ROUTER.h / 2 - 70})`}>
        <rect x={-300} y={-40} width={600} height={80} rx={18} fill="#10261a" stroke={COL.ok} strokeWidth={3} />
        <text x={0} y={-4} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={24} fill={COL.ok}>
          4 shards → 1 answer
        </text>
        <text x={0} y={24} textAnchor="middle" fontFamily={MONO} fontSize={19} fill={COL.dim}>
          only as fast as the slowest shard
        </text>
      </g>,
    );
  return <g>{out}</g>;
};

/* resharding: the count of users that moved, and the teaser */
const Reshard: React.FC<{f: number}> = ({f}) => {
  if (f < A.fourIn5 - 6 || f >= S.payoff + 6) return null;
  const moved = Math.round(ip(f, [A.moves - 4, A.moves + 36], [0, MOVES], Easing.linear));
  const o = ip(f, [A.fourIn5 - 6, A.fourIn5 + 4, S.payoff - 6, S.payoff + 6], [0, 1, 1, 0]);
  return (
    <g opacity={o} transform={`translate(540 ${ROUTER.y - ROUTER.h / 2 - 82})`}>
      <rect x={-300} y={-46} width={600} height={92} rx={18} fill="#1a1406" stroke={COL.amber} strokeWidth={3} />
      <text x={0} y={14} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={40} fill={COL.amber}>
        {moved} of 40 users moved
      </text>
    </g>
  );
};
const LOOP = 14;
export const Explainer: React.FC = () => {
  const f = useCurrentFrame();
  const loop = ip(f, [S.total - LOOP, S.total - 1], [0, 1]);
  return (
    <AbsoluteFill>
      <Frame f={f} />
      {loop > 0 ? (
        <AbsoluteFill style={{opacity: loop}}>
          <Frame f={0} />
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

const Frame: React.FC<{f: number}> = ({f}) => {
  const breathe = 1.0 + 0.012 * Math.sin((f / 90) * Math.PI);
  const teaser = ip(f, [A.consistent - 4, A.consistent + 6, S.payoff - 4, S.payoff + 6], [0, 1, 1, 0]);
  return (
    <AbsoluteFill style={{background: COL.bg}}>
      <AbsoluteFill style={{backgroundImage: 'radial-gradient(rgba(140,160,190,0.08) 1.5px, transparent 1.5px)', backgroundSize: '36px 36px', backgroundPosition: `0 ${-f * 0.4}px`}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(57,208,255,0.05), rgba(0,0,0,0) 70%)'}} />
      <AbsoluteFill style={{scale: String(breathe), transformOrigin: '540px 980px'}}>
        <svg width={1080} height={1920} style={{position: 'absolute'}}>
          <Wires f={f} />
          <BigDb f={f} />
          <Shards f={f} />
          <Stored f={f} />
          <Router f={f} />
          <Cache f={f} />
          <Packets f={f} />
          <Pills f={f} />
          <SignupTag f={f} />
          <CrossQuery f={f} />
          <Reshard f={f} />
        </svg>
        {teaser > 0 ? (
          <div style={{position: 'absolute', left: 0, right: 0, top: 548, textAlign: 'center', opacity: teaser}}>
            <span style={{display: 'inline-block', padding: '10px 20px', borderRadius: 999, border: `2px dashed ${COL.violet}`, background: '#0f0c1c', fontFamily: MONO, fontSize: 26, color: COL.violet}}>EP 11 · consistent hashing · soon</span>
          </div>
        ) : null}
      </AbsoluteFill>
      <UsersCounter f={f} />
      {COPY.map((c, i) => (
        <Headline key={i} f={f} c={c} />
      ))}
      <Progress f={f} />
      <Captions f={f} lines={CAPS} accent={COL.amber} />
    </AbsoluteFill>
  );
};
