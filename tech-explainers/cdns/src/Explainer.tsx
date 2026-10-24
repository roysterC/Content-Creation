import React from 'react';
import {AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {A, COL, DOTS, EDGES, edge, ORIGIN, RTT_EDGE_MS, RTT_ORIGIN_MS, S, SPIKE_USERS, SYDNEY_USER, TOKYO, TRIPS_PER_PAGE} from './sim';
import CAPS from './captions.json';
import {Captions} from '../../_shared/Captions';
import {ShareOutro} from '../../_shared/ShareOutro';

for (const w of ['400', '500', '600', '800']) loadFont({family: 'Inter', url: staticFile(`inter-${w}.woff2`), weight: w});
for (const w of ['400', '600']) loadFont({family: 'Plex Mono', url: staticFile(`mono-${w}.woff2`), weight: w});
const SANS = 'Inter, sans-serif';
const MONO = '"Plex Mono", monospace';

const ease = Easing.bezier(0.25, 0.1, 0.25, 1);
const glide = Easing.bezier(0.4, 0, 0.6, 1);
const ip = (f: number, i: number[], o: number[], e = ease) => interpolate(f, i, o, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: e});
type P = {x: number; y: number};

/* ───────── copy ───────── */
type Copy = {at: number; until: number; kicker: string; head: string[]; kColor?: string};
const COPY: Copy[] = [
  {at: S.hook, until: S.series, kicker: 'CDNS · EXPLAINED', head: ['POV: Australia says', 'your site is slow.'], kColor: COL.bad},
  {at: S.series, until: S.distance, kicker: 'EXPERT IN UNDER 1 MINUTE', head: ['CDNs,', 'expert level.'], kColor: COL.amber},
  {at: S.distance, until: S.fix, kicker: '01 · DISTANCE', head: ['Light is fast.', 'The planet is big.'], kColor: COL.bad},
  {at: S.fix, until: S.edge, kicker: '02 · THE EDGE', head: ['Copies of your site,', 'everywhere.'], kColor: COL.ok},
  {at: S.edge, until: S.offload, kicker: '03 · CACHE AT THE EDGE', head: ['First visitor fetches.', 'Everyone else: local.'], kColor: COL.pink},
  {at: S.offload, until: S.purge, kicker: '04 · OFFLOAD', head: ['The heavy stuff', 'never hits you.'], kColor: COL.req},
  {at: S.purge, until: S.share, kicker: '05 · PURGE', head: ['Changed a file?', 'Purge or rename.'], kColor: COL.violet},
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
  const marks = [S.distance, S.fix, S.edge, S.offload, S.purge, S.share];
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

/* ───────── map helpers ───────── */
const lift = (a: P, b: P) => Math.hypot(b.x - a.x, b.y - a.y) * 0.28;
const ctrl = (a: P, b: P) => ({x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - lift(a, b)});
const arcAt = (a: P, b: P, t: number) => {
  const c = ctrl(a, b);
  const u = 1 - t;
  return {x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y};
};
const arcPath = (a: P, b: P) => {
  const c = ctrl(a, b);
  return `M ${a.x} ${a.y} Q ${c.x} ${c.y} ${b.x} ${b.y}`;
};
const Dot: React.FC<{p: P; color: string; r?: number}> = ({p, color, r = 9}) => (
  <g>
    <circle cx={p.x} cy={p.y} r={r * 2} fill={color} opacity={0.16} />
    <circle cx={p.x} cy={p.y} r={r} fill={color} />
  </g>
);
const Bubble: React.FC<{p: P; text: string; color: string; k: number}> = ({p, text, color, k}) => (
  <g transform={`translate(${p.x - text.length * 8 - 12} ${p.y - 64 - k * 24})`} opacity={ip(k, [0, 0.1, 0.75, 1], [0, 1, 1, 0])}>
    <rect width={text.length * 16 + 24} height={38} rx={10} fill={color} />
    <text x={(text.length * 16 + 24) / 2} y={27} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={23} fill="#0a0e14">
      {text}
    </text>
  </g>
);

const edgesOn = (f: number) => (f < A.copies ? 0 : EDGES.filter((_, i) => f >= A.copies + i * 5).length);

const MapBase: React.FC<{f: number}> = ({f}) => {
  const lit = edgesOn(f);
  return (
    <g>
      {DOTS.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={3} fill="#2e4059" />
      ))}
      {/* origin */}
      <g transform={`translate(${ORIGIN.x} ${ORIGIN.y})`}>
        <rect x={-20} y={-24} width={40} height={48} rx={7} fill="#1a1406" stroke={COL.amber} strokeWidth={3} />
        {[-12, 0, 12].map((y) => (
          <line key={y} x1={-12} y1={y} x2={6} y2={y} stroke={COL.amber} strokeWidth={3} strokeLinecap="round" />
        ))}
      </g>
      <text x={ORIGIN.x - 30} y={ORIGIN.y - 40} fontFamily={MONO} fontSize={22} fill={COL.amber}>
        your server · London
      </text>
      {/* CDN edges */}
      {EDGES.map((e, i) => {
        if (i >= lit) return null;
        const on = A.copies + i * 5;
        const pop = ip(f - on, [0, 6, 14], [0, 1.4, 1]);
        const ring = (((f - on) % 40) + 40) % 40 / 40;
        return (
          <g key={e.name}>
            <circle cx={e.x} cy={e.y} r={10 + ring * 26} fill="none" stroke={COL.ok} strokeWidth={2} opacity={(1 - ring) * 0.5} />
            <circle cx={e.x} cy={e.y} r={10 * pop} fill={COL.ok} />
            {['Frankfurt', 'Mumbai', 'Singapore', 'Tokyo', 'Sydney', 'Johannesburg'].includes(e.name) ? (
              <text x={e.x + (e.name === 'Sydney' ? -14 : 16)} y={e.y + (e.name === 'Sydney' ? -18 : 7)} textAnchor={e.name === 'Sydney' ? 'end' : 'start'} fontFamily={MONO} fontSize={20} fill={COL.ok} opacity={ip(f - on, [4, 12], [0, 1])}>
                {e.name}
              </text>
            ) : null}
          </g>
        );
      })}
    </g>
  );
};

/* the Sydney user and their round trips */
const TRIP = 36;
const SydneyTrips: React.FC<{f: number}> = ({f}) => {
  if (f >= S.edge) return null;
  const u = SYDNEY_USER;
  const toEdge = f >= A.sydney2;
  const out: React.ReactNode[] = [<Dot key="u" p={u} color={COL.pink} r={10} />];
  out.push(
    <text key="ul" x={u.x - 18} y={u.y + 42} textAnchor="end" fontFamily={MONO} fontSize={22} fill={COL.pink}>
      user · Sydney
    </text>,
  );
  if (!toEdge) {
    out.push(<path key="arc" d={arcPath(u, ORIGIN)} fill="none" stroke="#4a6080" strokeWidth={2.5} strokeDasharray="6 9" />);
    const t = ((((f + 6) % TRIP) + TRIP) % TRIP) / TRIP;
    const there = t < 0.5;
    const p = there ? arcAt(u, ORIGIN, glide(t * 2)) : arcAt(ORIGIN, u, glide((t - 0.5) * 2));
    out.push(<Dot key="p" p={p} color={there ? COL.req : COL.amber} />);
  } else {
    const e = edge('Sydney');
    const t = ((f - A.sydney2) % 12) / 12;
    const p = t < 0.5 ? {x: u.x + (e.x - u.x) * t * 2, y: u.y + (e.y - u.y) * t * 2} : {x: e.x + (u.x - e.x) * (t - 0.5) * 2, y: e.y + (u.y - e.y) * (t - 0.5) * 2};
    out.push(<Dot key="p" p={p} color={t < 0.5 ? COL.req : COL.ok} r={8} />);
  }
  return <g>{out}</g>;
};

/* first visitor in Tokyo misses, the edge fetches from London and keeps a copy; then local hits */
const TokyoVisitors: React.FC<{f: number}> = ({f}) => {
  if (f < S.edge - 2 || f >= S.offload) return null;
  const e = TOKYO;
  const users = [0, 1, 2, 3, 4].map((i) => ({x: e.x - 70 + i * 34, y: e.y + 74 + (i % 2) * 22}));
  const out: React.ReactNode[] = [];
  users.forEach((u, i) => out.push(<Dot key={`u${i}`} p={u} color={COL.violet} r={8} />));
  out.push(
    <text key="tl" x={e.x - 92} y={e.y + 140} fontFamily={MONO} fontSize={20} fill={COL.violet}>
      visitors · Tokyo
    </text>,
  );
  // first visitor
  const v = users[0];
  const t0 = A.first;
  const tMiss = A.fetches;
  const tKeep = A.keeps;
  if (f >= t0 && f < tMiss) {
    const k = ip(f, [t0, tMiss], [0, 1], glide);
    out.push(<Dot key="v1" p={{x: v.x + (e.x - v.x) * k, y: v.y + (e.y - v.y) * k}} color={COL.req} r={8} />);
  }
  if (f >= tMiss && f < tKeep) {
    out.push(<path key="la" d={arcPath(e, ORIGIN)} fill="none" stroke="#4a6080" strokeWidth={2.5} strokeDasharray="6 9" />);
    const k = ip(f, [tMiss, tKeep], [0, 1], Easing.linear);
    const p = k < 0.5 ? arcAt(e, ORIGIN, glide(k * 2)) : arcAt(ORIGIN, e, glide((k - 0.5) * 2));
    out.push(<Dot key="lp" p={p} color={k < 0.5 ? COL.req : COL.amber} />);
  }
  if (f >= tMiss && f < tMiss + 20) out.push(<Bubble key="miss" p={e} text="MISS" color={COL.bad} k={(f - tMiss) / 20} />);
  if (f >= tKeep) {
    const k = ip(f, [tKeep, tKeep + 20], [0, 1]);
    out.push(<circle key="keep" cx={e.x} cy={e.y} r={14 + k * 30} fill="none" stroke={COL.pink} strokeWidth={4} opacity={1 - k} />);
    if (f < tKeep + 26) out.push(<Bubble key="kb" p={e} text="CACHED" color={COL.pink} k={(f - tKeep) / 26} />);
  }
  // everyone after: local hits
  users.slice(1).forEach((u, i) => {
    const s0 = A.everyone + i * 10;
    if (f < s0 || f > s0 + 14) return;
    const k = (f - s0) / 14;
    const p = k < 0.5 ? {x: u.x + (e.x - u.x) * k * 2, y: u.y + (e.y - u.y) * k * 2} : {x: e.x + (u.x - e.x) * (k - 0.5) * 2, y: e.y + (u.y - e.y) * (k - 0.5) * 2};
    out.push(<Dot key={`h${i}`} p={p} color={k < 0.5 ? COL.req : COL.ok} r={7} />);
    if (k > 0.45 && k < 0.95) out.push(<Bubble key={`hb${i}`} p={{x: e.x + 60, y: e.y}} text="HIT" color={COL.ok} k={(k - 0.45) * 2} />);
  });
  return <g>{out}</g>;
};

/* traffic spike, served at the edges */
const Spike: React.FC<{f: number}> = ({f}) => {
  if (f < S.offload - 2 || f >= S.purge) return null;
  const out: React.ReactNode[] = [];
  SPIKE_USERS.forEach((u, i) => {
    const s0 = A.heavy + u.at;
    if (f < s0) return;
    const k = ((f - s0) % 18) / 18;
    out.push(<line key={`l${i}`} x1={u.x} y1={u.y} x2={u.edge.x} y2={u.edge.y} stroke={COL.req} strokeWidth={1.5} opacity={0.35} />);
    out.push(<circle key={`u${i}`} cx={u.x} cy={u.y} r={5} fill={COL.violet} />);
    const p = k < 0.5 ? {x: u.x + (u.edge.x - u.x) * k * 2, y: u.y + (u.edge.y - u.y) * k * 2} : {x: u.edge.x + (u.x - u.edge.x) * (k - 0.5) * 2, y: u.edge.y + (u.y - u.edge.y) * (k - 0.5) * 2};
    out.push(<circle key={`p${i}`} cx={p.x} cy={p.y} r={4.5} fill={k < 0.5 ? COL.req : COL.ok} />);
  });
  const tags = [
    {e: 'Frankfurt', t: 'images'},
    {e: 'Mumbai', t: 'video'},
    {e: 'Singapore', t: 'scripts'},
  ];
  tags.forEach((g, i) => {
    const e = edge(g.e);
    const o = ip(f, [A.heavy + 20 + i * 8, A.heavy + 30 + i * 8], [0, 1]);
    out.push(
      <g key={`t${i}`} opacity={o} transform={`translate(${e.x - 40} ${e.y + 22})`}>
        <rect width={g.t.length * 13 + 20} height={30} rx={8} fill="#0d1a12" stroke={COL.ok} strokeWidth={1.5} />
        <text x={10} y={21} fontFamily={MONO} fontSize={20} fill={COL.ok}>
          {g.t}
        </text>
      </g>,
    );
  });
  return <g>{out}</g>;
};

/* purge: a wave from London clears every edge copy; the renamed file is fetched fresh */
const Purge: React.FC<{f: number}> = ({f}) => {
  if (f < S.purge - 2 || f >= S.share) return null;
  const out: React.ReactNode[] = [];
  const r = ip(f, [A.purge, A.purge + 40], [0, 1100], Easing.bezier(0.3, 0, 0.6, 1));
  if (f >= A.purge && f < A.purge + 44) out.push(<circle key="w" cx={ORIGIN.x} cy={ORIGIN.y} r={r} fill="none" stroke={COL.violet} strokeWidth={5} opacity={ip(f, [A.purge + 30, A.purge + 44], [0.9, 0])} />);
  EDGES.forEach((e) => {
    const d = Math.hypot(e.x - ORIGIN.x, e.y - ORIGIN.y);
    const hit = f >= A.purge && r >= d;
    const fresh = f >= A.rename + 6;
    out.push(<circle key={e.name} cx={e.x} cy={e.y} r={11} fill={fresh ? COL.ok : hit ? '#4a4f58' : COL.ok} stroke={hit && !fresh ? COL.violet : 'none'} strokeWidth={3} />);
  });
  const name = f >= A.rename ? 'logo.v2.png' : 'logo.png';
  const flash = ip(f, [A.changed, A.changed + 4, A.changed + 20], [0, 1, 0]) + ip(f, [A.rename, A.rename + 4, A.rename + 20], [0, 1, 0]);
  out.push(
    <g key="file" transform={`translate(${ORIGIN.x - 24} ${ORIGIN.y + 40})`}>
      <rect width={name.length * 14 + 26} height={38} rx={9} fill="#16121f" stroke={COL.violet} strokeWidth={2 + flash * 2} />
      <text x={13} y={26} fontFamily={MONO} fontSize={22} fill={COL.violet}>
        {name}
      </text>
    </g>,
  );
  return <g>{out}</g>;
};

/* two stats under the map */
const Stats: React.FC<{f: number}> = ({f}) => {
  let a: [string, string, string];
  let b: [string, string, string];
  if (f < A.everyTrip) {
    a = ['DISTANCE', '17,000 km', COL.ink];
    b = ['ROUND TRIP', `~${RTT_ORIGIN_MS} ms`, COL.bad];
  } else if (f < S.fix) {
    const trips = Math.min(TRIPS_PER_PAGE, 1 + Math.floor((f - A.everyTrip) / TRIP));
    a = ['ROUND TRIPS', `${trips} × ${RTT_ORIGIN_MS} ms`, COL.ink];
    b = ['PAGE LOAD', `~${((trips * RTT_ORIGIN_MS) / 1000).toFixed(2)} s`, COL.bad];
  } else if (f < S.edge) {
    const on = f >= A.sydney2;
    a = ['ROUND TRIP', on ? `~${RTT_EDGE_MS} ms` : `~${RTT_ORIGIN_MS} ms`, on ? COL.ok : COL.bad];
    b = ['PAGE LOAD', on ? `~${(TRIPS_PER_PAGE * RTT_EDGE_MS) / 1000} s` : '~1.04 s', on ? COL.ok : COL.bad];
  } else return null;
  const o = ip(f, [S.edge - 8, S.edge], [1, 0]);
  return (
    <div style={{position: 'absolute', left: 70, right: 150, top: 1232, display: 'flex', gap: 60, opacity: o}}>
      {[a, b].map(([l, v, c], i) => (
        <div key={i}>
          <div style={{fontFamily: MONO, fontSize: 22, color: COL.dim, letterSpacing: 2}}>{l}</div>
          <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 60, color: c, letterSpacing: -1.5, fontVariantNumeric: 'tabular-nums'}}>{v}</div>
        </div>
      ))}
    </div>
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
  const mapO = ip(f, [S.share - 8, S.share], [1, 0]);
  const breathe = 1.0 + 0.012 * Math.sin((f / 90) * Math.PI);
  return (
    <AbsoluteFill style={{background: COL.bg}}>
      <AbsoluteFill style={{backgroundImage: 'radial-gradient(rgba(140,160,190,0.08) 1.5px, transparent 1.5px)', backgroundSize: '36px 36px', backgroundPosition: `0 ${-f * 0.4}px`}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(57,208,255,0.05), rgba(0,0,0,0) 70%)'}} />
      {mapO > 0 ? (
        <AbsoluteFill style={{opacity: mapO, scale: String(breathe), transformOrigin: '540px 900px'}}>
          <svg width={1080} height={1920} style={{position: 'absolute'}}>
            <MapBase f={f} />
            <SydneyTrips f={f} />
            <TokyoVisitors f={f} />
            <Spike f={f} />
            <Purge f={f} />
          </svg>
        </AbsoluteFill>
      ) : null}
      <Stats f={f} />
      {COPY.map((c, i) => (
        <Headline key={i} f={f} c={c} />
      ))}
      <ShareOutro f={f} at={S.share} until={S.total} topic="CDNs" follow line={<>who needs to learn <span style={{color: COL.amber}}>CDNs</span>.</>} accent={COL.amber} ink={COL.ink} dim={COL.dim} sans={SANS} mono={MONO} />
      <Progress f={f} />
      <Captions f={f} lines={CAPS} accent={COL.amber} />
    </AbsoluteFill>
  );
};
