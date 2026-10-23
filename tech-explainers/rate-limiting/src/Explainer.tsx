import React from 'react';
import {AbsoluteFill, Easing, interpolate, random, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {
  arriveAt, BOUNCE, BURST1, BURST2, CAP, W, CLIENT_Y, CLIENTS, COL, decideAt, DIRECT, GATE, gateOn, GS, LG, Pkt, PKTS, RETRY, S, SERVER, serverLoad, SH, SH_PKTS, shAllowedBeforeRedis, shArrive, shGlobal, shLocal, THRU, tokensAt,
} from './sim';

for (const w of ['400', '500', '600', '800']) loadFont({family: 'Inter', url: staticFile(`inter-${w}.woff2`), weight: w});
for (const w of ['400', '600']) loadFont({family: 'Plex Mono', url: staticFile(`mono-${w}.woff2`), weight: w});
const SANS = 'Inter, sans-serif';
const MONO = '"Plex Mono", monospace';

const ease = Easing.bezier(0.25, 0.1, 0.25, 1);
const ip = (f: number, i: number[], o: number[], e = ease) => interpolate(f, i, o, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: e});
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const glide = Easing.bezier(0.4, 0, 0.6, 1);

/* ───────── copy ───────── */
type Copy = {at: number; until: number; kicker: string; head: string[]; sub: string; kColor?: string};
const COPY: Copy[] = [
  {at: S.hook, until: S.series, kicker: 'RATE LIMITING · EXPLAINED', head: ['POV: one user is', 'hammering your API.'], sub: 'Everyone else times out.', kColor: COL.bad},
  {at: S.series, until: S.fix, kicker: 'EXPERT IN UNDER 1 MINUTE', head: ['Rate limiting,', 'expert level.'], sub: 'Let’s give everyone a fair share.', kColor: COL.amber},
  {at: S.fix, until: S.bucket, kicker: '01 · THE BUDGET', head: ['Every user', 'gets a budget.'], sub: 'Go over it: 429 Too Many Requests.', kColor: COL.amber},
  {at: S.bucket, until: S.window, kicker: '02 · TOKEN BUCKET', head: ['Spend a token.', 'Wait for a refill.'], sub: 'Bursts are fine. Spam runs dry.', kColor: COL.amber},
  {at: S.window, until: S.shared, kicker: '03 · FIXED vs SLIDING', head: ['Count per window,', 'mind the edge.'], sub: 'Sliding windows stop the double-up.', kColor: COL.req},
  {at: S.shared, until: S.retry, kicker: '04 · MANY SERVERS', head: ['One shared', 'counter.'], sub: 'Keep limits in Redis, not on each server.', kColor: COL.pink},
  {at: S.retry, until: S.recap, kicker: '05 · RETRY-AFTER', head: ['Tell clients when', 'to come back.'], sub: 'Good clients wait. Bad ones keep bouncing.', kColor: COL.ok},
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
const Sub: React.FC<{f: number; c: Copy}> = ({f, c}) => {
  if (f < c.at || f >= c.until) return null;
  const o = c.at === 0 ? ip(f, [c.until - 8, c.until], [1, 0]) : ip(f, [c.at + 18, c.at + 28, c.until - 8, c.until], [0, 1, 1, 0]);
  return <div style={{position: 'absolute', left: 70, right: 150, top: 1450, fontFamily: MONO, fontSize: 31, lineHeight: 1.35, color: COL.dim, opacity: o}}>{c.sub}</div>;
};
const Progress: React.FC<{f: number}> = ({f}) => {
  const marks = [S.fix, S.bucket, S.window, S.shared, S.retry, S.recap];
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

/* ───────── hook: the flood counter ───────── */
const HookCounter: React.FC<{f: number}> = ({f}) => {
  if (f >= S.series) return null;
  const n = PKTS.filter((p) => p.c === 0 && !p.gated && p.spawn > f - 30 && p.spawn <= f).length;
  const rate = n * 57 + Math.floor(f * 3.1);
  return (
    <div style={{position: 'absolute', left: 70, top: 496, display: 'flex', alignItems: 'baseline', gap: 16, opacity: ip(f, [S.series - 8, S.series], [1, 0])}}>
      <span style={{fontFamily: MONO, fontWeight: 600, fontSize: 30, color: COL.bad}}>bot:</span>
      <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 60, color: COL.bad, letterSpacing: -1, fontVariantNumeric: 'tabular-nums'}}>{rate.toLocaleString('en-GB')}</span>
      <span style={{fontFamily: MONO, fontSize: 28, color: COL.dim}}>requests / sec</span>
    </div>
  );
};

/* ───────── main diagram ───────── */
const gateVis = (f: number) => ip(f, [S.fix + 14, S.fix + 26], [0, 1]);
const gateY = (f: number) => GATE.y - (1 - ip(f, [S.fix + 14, S.fix + 32], [0, 1], Easing.bezier(0.2, 1.4, 0.4, 1))) * 80;
const serverVis = (f: number) => (f < S.bucket ? 1 : f < S.window ? ip(f, [S.bucket, S.bucket + 12], [1, 0]) : 1);
const GT = (f: number) => gateY(f) - GATE.h / 2; // gate top
const GB = (f: number) => gateY(f) + GATE.h / 2; // gate bottom
const STOP = SERVER.y - SERVER.h / 2;
const serverPoint = (c: number) => SERVER.x + (c - 1.5) * 44;

const Client: React.FC<{f: number; i: number}> = ({f, i}) => {
  const c = CLIENTS[i];
  const hot = PKTS.some((p) => p.c === i && f >= p.spawn && f < p.spawn + 4);
  const bounced = PKTS.some((p) => p.c === i && p.outcome === '429' && f >= decideAt(p) + BOUNCE - 1 && f < decideAt(p) + BOUNCE + 5);
  const x = c.x;
  const y = CLIENT_Y;
  return (
    <g>
      {i === 0 ? (
        <g transform={`translate(${x} ${y})`}>
          <line x1={0} y1={-44} x2={0} y2={-30} stroke={c.color} strokeWidth={3} />
          <circle cx={0} cy={-48} r={5} fill={c.color} />
          <rect x={-40} y={-30} width={80} height={58} rx={14} fill="#1a0d10" stroke={bounced ? '#ffffff' : c.color} strokeWidth={bounced ? 3.5 : 2.5} />
          <rect x={-24} y={-12} width={14} height={10} rx={2} fill={c.color} opacity={hot ? 1 : 0.7} />
          <rect x={10} y={-12} width={14} height={10} rx={2} fill={c.color} opacity={hot ? 1 : 0.7} />
          <rect x={-16} y={10} width={32} height={5} rx={2} fill={c.color} opacity={0.7} />
        </g>
      ) : (
        <g transform={`translate(${x} ${y})`}>
          <rect x={-40} y={-30} width={80} height={54} rx={8} fill="#0f1621" stroke={bounced ? '#ffffff' : c.color} strokeWidth={bounced ? 3.5 : 2.5} />
          <rect x={-30} y={-21} width={60} height={34} rx={3} fill={c.color} opacity={hot ? 0.45 : 0.12} />
          <path d="M -52 32 L 52 32" stroke={c.color} strokeWidth={4} strokeLinecap="round" />
        </g>
      )}
      <text x={x} y={y - 64} textAnchor="middle" fontFamily={MONO} fontSize={22} fill={c.color}>
        {c.name}
      </text>
    </g>
  );
};

const Gate: React.FC<{f: number}> = ({f}) => {
  const o = gateVis(f);
  if (o <= 0) return null;
  const y = gateY(f);
  const x0 = GATE.x - GATE.w / 2;
  const y0 = y - GATE.h / 2;
  const bounce = PKTS.some((p) => p.outcome === '429' && f >= decideAt(p) && f < decideAt(p) + 3);
  return (
    <g opacity={o}>
      <rect x={x0} y={y0} width={GATE.w} height={GATE.h} rx={22} fill="#1a1406" stroke={bounce ? COL.bad : COL.amber} strokeWidth={3} />
      <text x={x0 + 22} y={y0 + 34} fontFamily={MONO} fontWeight={600} fontSize={23} fill={COL.amber} letterSpacing={2}>
        RATE LIMITER
      </text>
      <text x={x0 + GATE.w - 22} y={y0 + 34} textAnchor="end" fontFamily={MONO} fontSize={21} fill={COL.dim}>
        {f >= S.bucket && f < S.window ? 'refill +1 token / 0.27s' : f >= S.retry ? 'budget: 10 tokens' : '10 req / s per user'}
      </text>
      {CLIENTS.map((c, i) => {
        const t = tokensAt(i, f);
        return (
          <g key={i} transform={`translate(${c.x - 75} ${y0 + 58})`}>
            {Array.from({length: CAP}).map((_, k) => {
              const fill = Math.max(0, Math.min(1, t - k));
              return (
                <g key={k}>
                  <rect x={k * 15} y={0} width={11} height={30} rx={3} fill="#2a2210" />
                  <rect x={k * 15} y={30 - 30 * fill} width={11} height={30 * fill} rx={3} fill={t < 1 ? COL.bad : COL.amber} />
                </g>
              );
            })}
            <text x={75} y={52} textAnchor="middle" fontFamily={MONO} fontSize={20} fill={t < 1 ? COL.bad : COL.dim}>
              {Math.floor(t)}/{CAP}
            </text>
          </g>
        );
      })}
    </g>
  );
};

const Server: React.FC<{f: number}> = ({f}) => {
  const o = serverVis(f);
  if (o <= 0) return null;
  const {x, y, w, h} = SERVER;
  const hook = f < S.fix;
  const load = Math.min(1, serverLoad(f) / (hook ? 9 : 14));
  const over = hook && f >= 30;
  const shake = over ? (random(`sh${f}`) - 0.5) * 9 : 0;
  const timeouts = PKTS.filter((p) => p.outcome === 'timeout' && arriveAt(p) <= f).length;
  const st = over ? COL.bad : load > 0.75 ? COL.amber : COL.ok;
  return (
    <g opacity={o} transform={`translate(${x - w / 2 + shake} ${y - h / 2})`}>
      <rect width={w} height={h} rx={18} fill="#0f1621" stroke={over ? COL.bad : '#2c3c52'} strokeWidth={over ? 3 : 2} />
      <text x={22} y={44} fontFamily={MONO} fontWeight={600} fontSize={25} fill={COL.ink} letterSpacing={2}>
        API SERVER
      </text>
      <text x={22} y={96} fontFamily={MONO} fontSize={22} fill={COL.dim}>
        load
      </text>
      <rect x={90} y={80} width={w - 112} height={18} rx={9} fill="#152132" />
      <rect x={90} y={80} width={(w - 112) * load} height={18} rx={9} fill={st} />
      <text x={22} y={148} fontFamily={MONO} fontSize={22} fill={hook && timeouts > 0 ? COL.bad : COL.dim}>
        {hook ? `timeouts: ${timeouts}` : 'healthy'}
      </text>
    </g>
  );
};

const Wires: React.FC<{f: number}> = ({f}) => {
  const g = gateVis(f);
  return (
    <g stroke="#1c2838" strokeWidth={2} strokeDasharray="4 8">
      {CLIENTS.map((c, i) => (
        <line key={i} x1={c.x} y1={CLIENT_Y + 40} x2={g > 0.5 ? c.x : serverPoint(i)} y2={g > 0.5 ? GT(f) : STOP} />
      ))}
      {g > 0.5 && serverVis(f) > 0.5 ? CLIENTS.map((c, i) => <line key={`b${i}`} x1={c.x} y1={GB(f)} x2={serverPoint(i)} y2={STOP} />) : null}
    </g>
  );
};

const Packets: React.FC<{f: number}> = ({f}) => {
  const out: React.ReactNode[] = [];
  for (const p of PKTS) {
    if (f < p.spawn) continue;
    const c = CLIENTS[p.c];
    const sx = c.x;
    const y0 = CLIENT_Y + 36;
    let x = 0;
    let y = 0;
    let col = c.color;
    let label: string | undefined;
    if (!p.gated) {
      const a = arriveAt(p);
      if (f >= a + 12) continue;
      if (f >= a) {
        const k = (f - a) / 12;
        const tx = serverPoint(p.c);
        out.push(
          p.outcome === 'timeout' ? (
            <g key={p.id} opacity={1 - k} transform={`translate(${tx + (random(`tx${p.id}`) - 0.5) * 90} ${STOP - 10 - k * 60})`}>
              <path d="M -9 -9 L 9 9 M 9 -9 L -9 9" stroke={COL.bad} strokeWidth={4} strokeLinecap="round" />
            </g>
          ) : p.c === 0 ? null : (
            <circle key={p.id} cx={tx} cy={STOP} r={8 + k * 22} fill="none" stroke={col} strokeWidth={3} opacity={(1 - k) * 0.7} />
          ),
        );
        continue;
      }
      const t = ip(f, [p.spawn, a], [0, 1], glide);
      x = lerp(sx, serverPoint(p.c), t);
      y = lerp(y0, STOP, t);
    } else {
      const d = decideAt(p);
      if (f < d) {
        const t = ip(f, [p.spawn, d], [0, 1], glide);
        x = sx;
        y = lerp(y0, GT(f) + 6, t);
      } else if (p.outcome === '429') {
        if (f >= d + BOUNCE) continue;
        const t = ip(f, [d, d + BOUNCE], [0, 1], Easing.bezier(0.2, 0.7, 0.4, 1));
        x = sx + Math.sin(t * Math.PI) * 26;
        y = lerp(GT(f) + 6, y0 + 4, t);
        col = COL.bad;
        if (p.c !== 0 || p.id % 5 === 0) label = p.retryAfter && p.c === 1 ? '429 · Retry-After: 2s' : '429';
      } else {
        const a = arriveAt(p);
        if (f < d + THRU) continue;
        const end = p.through ? GB(f) + 90 : STOP;
        if (f >= a + 12) continue;
        if (f >= a) {
          const k = (f - a) / 12;
          if (!p.through && p.c !== 0) out.push(<circle key={p.id} cx={serverPoint(p.c)} cy={STOP} r={8 + k * 22} fill="none" stroke={col} strokeWidth={3} opacity={(1 - k) * 0.7} />);
          continue;
        }
        const t = ip(f, [d + THRU, d + THRU + GS], [0, 1], glide);
        x = lerp(sx, p.through ? sx : serverPoint(p.c), t);
        y = lerp(GB(f) - 6, end, t);
        if (p.through) out.push(<g key={`fade${p.id}`} />);
      }
    }
    out.push(
      <g key={p.id} opacity={p.through && f > decideAt(p) + THRU ? ip(f, [decideAt(p) + THRU, decideAt(p) + THRU + GS], [1, 0]) : 1}>
        <circle cx={x} cy={y} r={16} fill={col} opacity={0.15} />
        <circle cx={x} cy={y} r={8} fill={col} />
        {label ? (
          <g transform={`translate(${x + 14} ${y - 15})`}>
            <rect width={label.length * 12.6 + 18} height={30} rx={8} fill="#1a0d10" stroke={COL.bad} strokeWidth={1.5} />
            <text x={9} y={21} fontFamily={MONO} fontSize={20} fill={COL.bad}>
              {label}
            </text>
          </g>
        ) : null}
      </g>,
    );
  }
  return <g>{out}</g>;
};

/* 429 stamp, when the voice says it */
const Stamp: React.FC<{f: number}> = ({f}) => {
  const at = S.v.fix + 128;
  const o = ip(f, [at, at + 6, at + 70, at + 80], [0, 1, 1, 0]);
  if (o <= 0) return null;
  const pop = ip(f, [at, at + 7], [0.6, 1], Easing.bezier(0.2, 1.6, 0.4, 1));
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 1060, display: 'flex', justifyContent: 'center', opacity: o}}>
      <div style={{rotate: '-5deg', scale: String(pop), padding: '10px 24px', border: `5px solid ${COL.bad}`, borderRadius: 14, background: 'rgba(10,14,20,0.9)', fontFamily: MONO, fontWeight: 600, fontSize: 38, color: COL.bad, letterSpacing: 2}}>
        429 TOO MANY REQUESTS
      </div>
    </div>
  );
};

/* token bucket jars */
const Jars: React.FC<{f: number}> = ({f}) => {
  const o = ip(f, [S.bucket + 8, S.bucket + 22, S.window - 8, S.window], [0, 1, 1, 0]);
  if (o <= 0) return null;
  const jars = [
    {c: 1, x: 330},
    {c: 0, x: 750},
  ];
  return (
    <g opacity={o}>
      {jars.map(({c, x}) => {
        const t = tokensAt(c, f);
        const w = 210;
        const h = 220;
        const top = 1135;
        const color = CLIENTS[c].color;
        const period = 8;
        const drip = ((f - S.bucket) % period) / period;
        const coins: React.ReactNode[] = [];
        for (let k = 0; k < CAP; k++) {
          const fill = Math.max(0, Math.min(1, t - k));
          if (fill <= 0) continue;
          const col = k % 2;
          const row = Math.floor(k / 2);
          coins.push(<circle key={k} cx={x - 36 + col * 72} cy={top + h - 34 - row * 44} r={19} fill={COL.amber} opacity={0.25 + 0.75 * fill} stroke="#8a5a00" strokeWidth={2} />);
        }
        return (
          <g key={c}>
            {/* refill tap */}
            <path d={`M ${x - 60} ${top - 70} L ${x} ${top - 70} L ${x} ${top - 46}`} fill="none" stroke="#4a5d78" strokeWidth={8} strokeLinecap="round" />
            {t < CAP - 0.05 ? <circle cx={x} cy={lerp(top - 40, top + h - 60 - Math.floor(t / 2) * 44, drip)} r={8} fill={COL.amber} opacity={1 - drip * 0.5} /> : null}
            <path d={`M ${x - w / 2} ${top} L ${x - w / 2} ${top + h - 24} Q ${x - w / 2} ${top + h} ${x - w / 2 + 24} ${top + h} L ${x + w / 2 - 24} ${top + h} Q ${x + w / 2} ${top + h} ${x + w / 2} ${top + h - 24} L ${x + w / 2} ${top}`} fill="#0f1621" stroke={t < 1 ? COL.bad : color} strokeWidth={3} />
            {coins}
            <text x={x} y={top + h + 46} textAnchor="middle" fontFamily={MONO} fontSize={24} fill={color}>
              {CLIENTS[c].name}: {Math.floor(t)} tokens
            </text>
            {t < 1 ? (
              <text x={x} y={top + h / 2} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={30} fill={COL.bad}>
                EMPTY
              </text>
            ) : null}
          </g>
        );
      })}
    </g>
  );
};

/* retry-after: alice waits */
const RetryRing: React.FC<{f: number}> = ({f}) => {
  if (f < RETRY.wait0 - 2 || f > RETRY.again + 70) return null;
  const c = CLIENTS[1];
  const p = ip(f, [RETRY.wait0, RETRY.again], [0, 1], Easing.linear);
  const r = 64;
  const waiting = f < RETRY.again;
  const okPkt = PKTS.find((q) => q.c === 1 && q.spawn === RETRY.again);
  const okAt = okPkt ? arriveAt(okPkt) : RETRY.again + 30;
  return (
    <g>
      {waiting ? (
        <g opacity={ip(f, [RETRY.wait0 - 2, RETRY.wait0 + 4], [0, 1])}>
          <circle cx={c.x} cy={CLIENT_Y - 2} r={r} fill="none" stroke="#2a3446" strokeWidth={6} />
          <circle cx={c.x} cy={CLIENT_Y - 2} r={r} fill="none" stroke={COL.ok} strokeWidth={6} strokeDasharray={`${2 * Math.PI * r * (1 - p)} 999`} transform={`rotate(-90 ${c.x} ${CLIENT_Y - 2})`} strokeLinecap="round" />
          <text x={c.x + r + 16} y={CLIENT_Y + 8} fontFamily={MONO} fontWeight={600} fontSize={24} fill={COL.ok}>
            waiting {(2 * (1 - p)).toFixed(1)}s
          </text>
        </g>
      ) : null}
      {f >= okAt ? (
        <g transform={`translate(${serverPoint(1) - 70} ${STOP - 56})`} opacity={ip(f, [okAt, okAt + 4, okAt + 50, okAt + 60], [0, 1, 1, 0])}>
          <rect width={140} height={40} rx={10} fill={COL.ok} />
          <text x={70} y={28} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={24} fill="#0a0e14">
            200 OK
          </text>
        </g>
      ) : null}
    </g>
  );
};

/* ───────── fixed vs sliding window ───────── */
const secX = (s: number) => W.x0 + ((W.x1 - W.x0) * s) / 120;
const Windows: React.FC<{f: number}> = ({f}) => {
  const o = ip(f, [S.window + 4, S.window + 16, S.shared - 6, S.shared], [0, 1, 1, 0]);
  if (o <= 0) return null;
  const t = f - S.window;
  const rows = [
    {y: 860, label: 'FIXED WINDOW', sweep: [10, 120]},
    {y: 1230, label: 'SLIDING WINDOW · last 60s', sweep: [150, 205]},
  ];
  const ticks = [...BURST1, ...BURST2];
  return (
    <AbsoluteFill style={{opacity: o}}>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        {rows.map((r, ri) => {
          const vis = ri === 0 ? 1 : ip(t, [140, 152], [0, 1]);
          if (vis <= 0) return null;
          const head = ri === 0 ? ip(t, r.sweep, [W.x0, W.x1], Easing.linear) : ip(t, r.sweep, [BURST1[0] - 20, BURST2[9] + 40], Easing.linear);
          const seen = ticks.filter((x) => x <= head);
          // decide each tick: fixed = per-minute counter; sliding = last 60s
          const allowed = (x: number, k: number) => {
            if (ri === 0) {
              const win = x < W.mid ? BURST1 : BURST2;
              return win.indexOf(x) < 10;
            }
            const prev = ticks.slice(0, k).filter((y, j) => y > x - (W.mid - W.x0) && allowedSlide[j]);
            return prev.length < 10;
          };
          const allowedSlide: boolean[] = [];
          ticks.forEach((x, k) => allowedSlide.push(allowed(x, k)));
          const inWin1 = seen.filter((x) => x < W.mid).length;
          const inWin2 = seen.filter((x) => x >= W.mid).length;
          const slideCount = ri === 1 ? ticks.filter((x, k) => x <= head && x > head - (W.mid - W.x0) && allowedSlide[k]).length : 0;
          return (
            <g key={ri} opacity={vis}>
              <text x={W.x0} y={r.y - 150} fontFamily={MONO} fontWeight={600} fontSize={24} fill={ri === 0 ? COL.req : COL.ok} letterSpacing={2}>
                {r.label}
              </text>
              <text x={W.x1} y={r.y - 150} textAnchor="end" fontFamily={MONO} fontSize={22} fill={COL.dim}>
                limit 10 / min
              </text>
              {/* windows */}
              {ri === 0
                ? [0, 1].map((k) => (
                    <g key={k}>
                      <rect x={k ? W.mid + 3 : W.x0} y={r.y - 110} width={W.mid - W.x0 - 3} height={110} rx={10} fill={k ? '#0f1a26' : '#121b29'} stroke="#223044" strokeWidth={2} />
                      <text x={(k ? W.mid + 3 : W.x0) + 14} y={r.y - 80} fontFamily={MONO} fontSize={21} fill={COL.dim}>
                        {k ? '1:00–2:00' : '0:00–1:00'} · {k ? inWin2 : inWin1}/10
                      </text>
                    </g>
                  ))
                : (
                    <rect x={Math.max(W.x0, head - (W.mid - W.x0))} y={r.y - 110} width={Math.min(W.mid - W.x0, head - W.x0)} height={110} rx={10} fill="rgba(61,220,132,0.08)" stroke={COL.ok} strokeWidth={2.5} />
                  )}
              {ri === 1 ? (
                <text x={Math.max(W.x0, head - (W.mid - W.x0)) + 14} y={r.y - 80} fontFamily={MONO} fontSize={21} fill={COL.ok}>
                  last 60s · {slideCount}/10
                </text>
              ) : null}
              <line x1={W.x0} y1={r.y} x2={W.x1} y2={r.y} stroke="#4a5d78" strokeWidth={3} />
              {[0, 60, 120].map((s) => (
                <g key={s}>
                  <line x1={secX(s)} y1={r.y} x2={secX(s)} y2={r.y + 14} stroke="#4a5d78" strokeWidth={3} />
                  <text x={secX(s)} y={r.y + 44} textAnchor="middle" fontFamily={MONO} fontSize={21} fill={COL.dim}>
                    {s / 60}:00
                  </text>
                </g>
              ))}
              {ticks.map((x, k) => {
                if (x > head) return null;
                const ok = ri === 0 ? allowed(x, k) : allowedSlide[k];
                const p = ip(head - x, [0, 8], [0, 1]);
                return <rect key={k} x={x - 2} y={r.y - 52 * p} width={4} height={52 * p} rx={2} fill={ok ? COL.ok : COL.bad} />;
              })}
              {ri === 1
                ? ticks.map((x, k) =>
                    x <= head && !allowedSlide[k] ? (
                      <path key={`x${k}`} d={`M ${x - 6} ${r.y - 68} L ${x + 6} ${r.y - 56} M ${x + 6} ${r.y - 68} L ${x - 6} ${r.y - 56}`} stroke={COL.bad} strokeWidth={3} strokeLinecap="round" />
                    ) : null,
                  )
                : null}
              <line x1={head} y1={r.y - 120} x2={head} y2={r.y + 10} stroke="#ffffff" strokeWidth={2} opacity={0.6} />
              {ri === 0 && head > BURST2[9] ? (
                <g opacity={ip(t, [100, 108], [0, 1])}>
                  <path d={`M ${BURST1[0] - 6} ${r.y + 64} L ${BURST1[0] - 6} ${r.y + 76} L ${BURST2[9] + 6} ${r.y + 76} L ${BURST2[9] + 6} ${r.y + 64}`} fill="none" stroke={COL.bad} strokeWidth={3} />
                  <text x={(BURST1[0] + BURST2[9]) / 2} y={r.y + 108} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={24} fill={COL.bad}>
                    20 requests in 15s, all allowed
                  </text>
                </g>
              ) : null}
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

/* ───────── many servers, one shared counter ───────── */
const Shared: React.FC<{f: number}> = ({f}) => {
  const o = ip(f, [S.shared + 2, S.shared + 14, S.retry - 6, S.retry], [0, 1, 1, 0]);
  if (o <= 0) return null;
  const redis = ip(f, [SH.redisIn, SH.redisIn + 14], [0, 1]);
  const redisY = SH.redis.y - (1 - ip(f, [SH.redisIn, SH.redisIn + 16], [0, 1], Easing.bezier(0.2, 1.4, 0.4, 1))) * 70;
  const sw = 200;
  const sh = 150;
  const leaked = shAllowedBeforeRedis(f);
  return (
    <AbsoluteFill style={{opacity: o}}>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        {/* bot */}
        <g transform={`translate(${SH.botX} ${SH.botY})`}>
          <line x1={0} y1={-44} x2={0} y2={-30} stroke={COL.bad} strokeWidth={3} />
          <circle cx={0} cy={-48} r={5} fill={COL.bad} />
          <rect x={-40} y={-30} width={80} height={58} rx={14} fill="#1a0d10" stroke={COL.bad} strokeWidth={2.5} />
          <rect x={-24} y={-12} width={14} height={10} rx={2} fill={COL.bad} />
          <rect x={10} y={-12} width={14} height={10} rx={2} fill={COL.bad} />
        </g>
        <text x={SH.botX + 64} y={SH.botY + 8} fontFamily={MONO} fontSize={22} fill={COL.bad}>
          bot · budget 10
        </text>
        {SH.servers.map((x, s) => {
          const n = shLocal(s, f);
          return (
            <g key={s}>
              <line x1={SH.botX} y1={SH.botY + 36} x2={x} y2={SH.y - sh / 2} stroke="#1c2838" strokeWidth={2} strokeDasharray="4 8" />
              <rect x={x - sw / 2} y={SH.y - sh / 2} width={sw} height={sh} rx={16} fill="#0f1621" stroke="#2c3c52" strokeWidth={2} />
              <text x={x} y={SH.y - 26} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={22} fill={COL.ink}>
                SERVER {s + 1}
              </text>
              <text x={x} y={SH.y + 22} textAnchor="middle" fontFamily={MONO} fontSize={24} fill={redis > 0.5 ? COL.dim : COL.amber} opacity={1 - redis * 0.6}>
                {redis > 0.5 ? '→ redis' : `local ${n}/10`}
              </text>
              {redis > 0 ? <line x1={x} y1={SH.y + sh / 2} x2={SH.redis.x} y2={redisY - SH.redis.h / 2} stroke={COL.pink} strokeWidth={3} opacity={redis} /> : null}
            </g>
          );
        })}
        {/* the leak, before Redis */}
        <g opacity={ip(f, [S.shared + 66, S.shared + 76, SH.redisIn + 10, SH.redisIn + 24], [0, 1, 1, 0])}>
          <text x={SH.botX} y={SH.y + 150} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={28} fill={COL.bad}>
            bot got {leaked} through · limit was 10
          </text>
          <text x={SH.botX} y={SH.y + 190} textAnchor="middle" fontFamily={MONO} fontSize={22} fill={COL.dim}>
            each server hands out its own budget
          </text>
        </g>
        {redis > 0 ? (
          <g opacity={redis}>
            <rect x={SH.redis.x - SH.redis.w / 2} y={redisY - SH.redis.h / 2} width={SH.redis.w} height={SH.redis.h} rx={20} fill="#170d14" stroke={COL.pink} strokeWidth={3} />
            <text x={SH.redis.x} y={redisY - 12} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={24} fill={COL.pink} letterSpacing={2}>
              REDIS · shared counter
            </text>
            <text x={SH.redis.x} y={redisY + 32} textAnchor="middle" fontFamily={MONO} fontSize={28} fill={shGlobal(f) >= CAP ? COL.bad : COL.ink}>
              rate:bot = {shGlobal(f)}/10
            </text>
          </g>
        ) : null}
        {SH_PKTS.map((p) => {
          const a = shArrive(p);
          if (f < p.spawn || f > a + 14) return null;
          const x1 = SH.servers[p.s];
          const y1 = SH.y - sh / 2 + 4;
          if (f < a) {
            const t = ip(f, [p.spawn, a], [0, 1], glide);
            return (
              <g key={p.id}>
                <circle cx={lerp(SH.botX, x1, t)} cy={lerp(SH.botY + 36, y1, t)} r={16} fill={COL.bad} opacity={0.15} />
                <circle cx={lerp(SH.botX, x1, t)} cy={lerp(SH.botY + 36, y1, t)} r={8} fill={COL.bad} />
              </g>
            );
          }
          const k = (f - a) / 14;
          if (p.ok) return <circle key={p.id} cx={x1} cy={y1} r={8 + k * 22} fill="none" stroke={COL.amber} strokeWidth={3} opacity={(1 - k) * 0.7} />;
          return (
            <g key={p.id} opacity={1 - k}>
              <circle cx={lerp(x1, SH.botX, k * 0.5)} cy={lerp(y1, SH.botY + 36, k * 0.5)} r={8} fill={COL.bad} />
              <text x={lerp(x1, SH.botX, k * 0.5) + 14} y={lerp(y1, SH.botY + 36, k * 0.5) + 7} fontFamily={MONO} fontSize={20} fill={COL.bad}>
                429
              </text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

/* ───────── recap ───────── */
const Recap: React.FC<{f: number}> = ({f}) => {
  if (f < S.recap) return null;
  const items = [
    ['Give every user a budget', 'e.g. 10 requests per second'],
    ['Over it? 429', 'Too Many Requests, plus Retry-After'],
    ['Token bucket', 'bursts are fine, spam runs dry'],
    ['Share the counter', 'one Redis for every server'],
  ];
  return (
    <div style={{position: 'absolute', left: 70, right: 150, top: 250}}>
      <div style={{fontFamily: MONO, fontWeight: 600, fontSize: 27, letterSpacing: 3, color: COL.amber, opacity: ip(f, [S.recap, S.recap + 8], [0, 1])}}>RECAP</div>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 76, lineHeight: 1.08, letterSpacing: -2, color: COL.ink, marginTop: 18, opacity: ip(f, [S.recap + 4, S.recap + 14], [0, 1])}}>Rate limiting,</div>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 76, lineHeight: 1.08, letterSpacing: -2, color: COL.ink, opacity: ip(f, [S.recap + 8, S.recap + 18], [0, 1])}}>in 4 lines.</div>
      <div style={{marginTop: 70}}>
        {items.map(([a, b], i) => {
          const p = ip(f, [S.recap + 24 + i * 14, S.recap + 36 + i * 14], [0, 1]);
          return (
            <div key={i} style={{display: 'flex', gap: 28, alignItems: 'flex-start', marginBottom: 46, opacity: p, translate: `${(1 - p) * -30}px 0`}}>
              <div style={{width: 54, height: 54, borderRadius: 14, border: `3px solid ${COL.ok}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none'}}>
                <svg width={28} height={28} viewBox="0 0 24 24">
                  <path d="M4 12.5l5 5L20 6.5" fill="none" stroke={COL.ok} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
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
      <div style={{marginTop: 40, display: 'inline-block', padding: '20px 34px', borderRadius: 999, background: COL.amber, color: '#1a1406', fontFamily: SANS, fontWeight: 700, fontSize: 36, opacity: ip(f, [S.recap + 96, S.recap + 106], [0, 1]), scale: String(ip(f, [S.recap + 96, S.recap + 106], [0.85, 1], Easing.bezier(0.2, 1.5, 0.4, 1)) * (1 + 0.04 * Math.max(0, Math.sin((f - S.recap - 106) / 9))))}}>
        Follow for more
      </div>
      <div style={{marginTop: 22, fontFamily: MONO, fontSize: 29, color: COL.dim, opacity: ip(f, [S.recap + 104, S.recap + 114], [0, 1])}}>Be an expert in anything tech, in under 1 minute.</div>
    </div>
  );
};

export const Explainer: React.FC = () => {
  const f = useCurrentFrame();
  const mainO = f < S.window ? 1 : f < S.retry ? ip(f, [S.window, S.window + 12], [1, 0]) : f < S.recap ? ip(f, [S.retry, S.retry + 12], [0, 1]) : ip(f, [S.recap, S.recap + 14], [1, 0]);
  const breathe = 1.04 + 0.01 * Math.sin((f / 90) * Math.PI);
  void LG;
  void DIRECT;
  void gateOn;
  return (
    <AbsoluteFill style={{background: COL.bg}}>
      <AbsoluteFill style={{backgroundImage: 'radial-gradient(rgba(140,160,190,0.10) 1.5px, transparent 1.5px)', backgroundSize: '36px 36px', backgroundPosition: `0 ${-f * 0.4}px`}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 60% at 50% 55%, rgba(255,176,32,0.05), rgba(0,0,0,0) 70%)'}} />
      {mainO > 0 ? (
        <AbsoluteFill style={{opacity: mainO, scale: String(breathe), transformOrigin: '540px 960px'}}>
          <svg width={1080} height={1920} style={{position: 'absolute'}}>
            <Wires f={f} />
            {CLIENTS.map((_, i) => (
              <Client key={i} f={f} i={i} />
            ))}
            <Server f={f} />
            <Jars f={f} />
            <Gate f={f} />
            <Packets f={f} />
            <RetryRing f={f} />
          </svg>
          <Stamp f={f} />
        </AbsoluteFill>
      ) : null}
      <Windows f={f} />
      <Shared f={f} />
      {COPY.map((c, i) => (
        <Headline key={i} f={f} c={c} />
      ))}
      {COPY.map((c, i) => (
        <Sub key={`s${i}`} f={f} c={c} />
      ))}
      <HookCounter f={f} />
      <Recap f={f} />
      <Progress f={f} />
    </AbsoluteFill>
  );
};
