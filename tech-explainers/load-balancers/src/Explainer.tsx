import React from 'react';
import {AbsoluteFill, Easing, interpolate, random, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {arrival, CLIENT_X, CLIENT_Y, COL, conns, DETECT_AT, FAIL_AT, hookRate, IN_LB, LB, LEG_A, LEG_B, Packet, PACKETS, S, SERVER, SERVER_X, SERVER_Y, TRAVEL_DIRECT} from './sim';

for (const w of ['400', '500', '600', '800']) loadFont({family: 'Inter', url: staticFile(`inter-${w}.woff2`), weight: w});
for (const w of ['400', '600']) loadFont({family: 'Plex Mono', url: staticFile(`mono-${w}.woff2`), weight: w});
const SANS = 'Inter, sans-serif';
const MONO = '"Plex Mono", monospace';

const ease = Easing.bezier(0.25, 0.1, 0.25, 1);
const ip = (f: number, i: number[], o: number[], e = ease) => interpolate(f, i, o, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: e});
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* ───────── scene copy ───────── */
type Copy = {at: number; until: number; kicker: string; head: string[]; sub: string; kColor?: string};
const COPY: Copy[] = [
  {at: S.hook, until: S.series, kicker: 'LOAD BALANCERS · EXPLAINED', head: ['POV: your app', 'just went viral.'], sub: 'Every request lands on one machine.'},
  {at: S.series, until: S.fix, kicker: 'EXPERT IN UNDER 1 MINUTE', head: ['Load balancers,', 'expert level.'], sub: 'Let’s fix it.', kColor: COL.lb},
  {at: S.fix, until: S.rr, kicker: '01 · THE FIX', head: ['Put a load balancer', 'in front.'], sub: 'It spreads requests across many servers.', kColor: COL.lb},
  {at: S.rr, until: S.lc, kicker: '02 · ROUND ROBIN', head: ['Take turns:', '1, 2, 3, repeat.'], sub: 'Simple, but blind to how busy each server is.', kColor: COL.lb},
  {at: S.lc, until: S.hash, kicker: '03 · LEAST CONNECTIONS', head: ['Send it to whoever’s', 'least busy.'], sub: 'Best when some requests take longer than others.', kColor: COL.lb},
  {at: S.hash, until: S.health, kicker: '04 · IP HASH (STICKY)', head: ['Same user,', 'same server.'], sub: 'hash(client IP) picks the server, so sessions stick.', kColor: COL.lb},
  {at: S.health, until: S.l4, kicker: '05 · HEALTH CHECKS', head: ['Dead servers', 'get skipped.'], sub: 'The LB pings each server. Miss a beat, you’re out.', kColor: COL.ok},
  {at: S.l4, until: S.l7, kicker: '06 · LAYER 4', head: ['Layer 4 only sees', 'the address.'], sub: 'Routes by IP + port. Very fast, no peeking.', kColor: COL.lb},
  {at: S.l7, until: S.recap, kicker: '06 · LAYER 7', head: ['Layer 7 reads', 'the request.'], sub: 'Routes by URL, headers, cookies. Smarter.', kColor: COL.lb},
];

const Headline: React.FC<{f: number; c: Copy}> = ({f, c}) => {
  if (f < c.at - 1 || f >= c.until) return null;
  const out = ip(f, [c.until - 8, c.until], [1, 0]);
  const inK = c.at === 0 ? 1 : ip(f, [c.at, c.at + 8], [0, 1]);
  return (
    <div style={{position: 'absolute', left: 70, right: 120, top: 250, opacity: out}}>
      <div style={{fontFamily: MONO, fontWeight: 600, fontSize: 27, letterSpacing: 3, color: c.kColor ?? COL.bad, opacity: inK}}>{c.kicker}</div>
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
  const o = ip(f, [c.at + 18, c.at + 28, c.until - 8, c.until], [0, 1, 1, 0]);
  return <div style={{position: 'absolute', left: 70, right: 150, top: 1450, fontFamily: MONO, fontSize: 31, lineHeight: 1.35, color: COL.dim, opacity: c.at === 0 ? ip(f, [S.series - 8, S.series], [1, 0]) : o}}>{c.sub}</div>;
};

/* ───────── diagram pieces ───────── */
const serverX = (s: number, f: number) => (s === 1 ? SERVER_X[1] : lerp(SERVER_X[1], SERVER_X[s], ip(f, [S.fix + 14, S.fix + 42], [0, 1], Easing.bezier(0.2, 0.9, 0.3, 1))));
const serverVis = (s: number, f: number) => (s === 1 ? 1 : ip(f, [S.fix + 14, S.fix + 24], [0, 1]));
const lbVis = (f: number) => ip(f, [S.fix, S.fix + 16], [0, 1]);
const lbY = (f: number) => LB.y - (1 - ip(f, [S.fix, S.fix + 18], [0, 1], Easing.bezier(0.2, 1.4, 0.4, 1))) * 90;
const isDown = (s: number, f: number) => s === 1 && f >= FAIL_AT && f < S.l4;
const NAMES = (f: number) => (f >= S.l7 ? ['API-1', 'API-2', 'STATIC'] : ['SERVER 1', 'SERVER 2', 'SERVER 3']);

const Client: React.FC<{x: number; color: string; o: number; hot: number}> = ({x, color, o, hot}) => (
  <g transform={`translate(${x} ${CLIENT_Y})`} opacity={o}>
    <rect x={-40} y={-30} width={80} height={54} rx={8} fill="#0f1621" stroke={color} strokeWidth={2.5} />
    <rect x={-30} y={-21} width={60} height={34} rx={3} fill={color} opacity={0.12 + 0.35 * hot} />
    <path d="M -52 32 L 52 32" stroke={color} strokeWidth={4} strokeLinecap="round" />
  </g>
);

const Server: React.FC<{s: number; f: number}> = ({s, f}) => {
  const x = serverX(s, f);
  const vis = serverVis(s, f);
  if (vis <= 0) return null;
  const n = conns(s, f);
  const hook = f < S.fix;
  const cap = hook ? 9 : 12;
  const load = Math.min(1, n / cap);
  const overloaded = hook && f >= 92;
  const down = isDown(s, f);
  const st = down ? COL.bad : overloaded ? COL.bad : load > 0.75 ? COL.lb : COL.ok;
  const shake = overloaded ? (random(`sh${f}`) - 0.5) * 10 : 0;
  const lastHit = PACKETS.filter((p) => p.target === s && arrival(p) <= f && arrival(p) > f - 8).length;
  const glow = Math.min(1, lastHit * 0.6);
  const {w, h} = SERVER;
  const hashTag = f >= S.hash && f < S.health;
  const hashUser = [1, 2, 0][s];
  return (
    <g transform={`translate(${x - w / 2 + shake} ${SERVER_Y - h / 2})`} opacity={vis * (down ? 0.75 : 1)}>
      <rect width={w} height={h} rx={16} fill="#0f1621" stroke={down || overloaded ? COL.bad : glow > 0 ? COL.req : '#2c3c52'} strokeWidth={down || overloaded ? 3 : 2 + glow * 1.5} />
      {[0, 1, 2].map((r) => (
        <g key={r} transform={`translate(18 ${20 + r * 34})`}>
          <rect width={w - 36} height={24} rx={5} fill="#152132" />
          <circle cx={w - 54} cy={12} r={5} fill={down ? '#3a2a2e' : st} opacity={down ? 1 : 0.5 + 0.5 * ((Math.floor(f / (4 + r)) + r) % 2)} />
          <rect x={10} y={10} width={60} height={4} rx={2} fill="#2c3c52" />
        </g>
      ))}
      <text x={0} y={-16} fontFamily={MONO} fontSize={23} fill={COL.dim} letterSpacing={1}>
        {hook ? 'SERVER' : NAMES(f)[s]}
      </text>
      <text x={18} y={146} fontFamily={MONO} fontSize={23} fill={COL.dim}>
        {hook ? 'CPU' : 'load'}
      </text>
      <text x={w - 18} y={146} fontFamily={MONO} fontSize={23} fill={down ? COL.bad : COL.ink} textAnchor="end">
        {down ? 'DOWN' : hook ? `${Math.round(load * 100)}%` : `${n} conn`}
      </text>
      <rect x={18} y={162} width={w - 36} height={14} rx={7} fill="#152132" />
      <rect x={18} y={162} width={(w - 36) * (down ? 0 : load)} height={14} rx={7} fill={st} />
      {hashTag ? <circle cx={w - 22} cy={-14} r={12} fill={COL.users[hashUser]} /> : null}
      {down ? (
        <g transform={`translate(${w / 2} ${h / 2 - 20})`} opacity={ip(f, [FAIL_AT, FAIL_AT + 6], [0, 1])}>
          <path d="M -34 -34 L 34 34 M 34 -34 L -34 34" stroke={COL.bad} strokeWidth={9} strokeLinecap="round" />
        </g>
      ) : null}
    </g>
  );
};

const LoadBalancer: React.FC<{f: number}> = ({f}) => {
  const o = lbVis(f);
  if (o <= 0) return null;
  const y = lbY(f);
  const pass = PACKETS.some((p) => !p.direct && p.spawn + LEG_A <= f && f < p.spawn + LEG_A + IN_LB + 3);
  const l4 = f >= S.l4 && f < S.l7;
  const l7 = f >= S.l7 && f < S.recap;
  return (
    <g opacity={o}>
      <rect x={LB.x - LB.w / 2} y={y - LB.h / 2} width={LB.w} height={LB.h} rx={22} fill="#1a1406" stroke={COL.lb} strokeWidth={pass ? 4 : 3} />
      <rect x={LB.x - LB.w / 2} y={y - LB.h / 2} width={LB.w} height={LB.h} rx={22} fill={COL.lb} opacity={pass ? 0.12 : 0.04} />
      {/* fan icon */}
      <g transform={`translate(${LB.x - LB.w / 2 + 62} ${y})`} stroke={COL.lb} strokeWidth={4} strokeLinecap="round" fill="none">
        <path d="M -22 0 L 0 0 M 0 0 L 22 -20 M 0 0 L 22 0 M 0 0 L 22 20" />
        <circle cx={-22} cy={0} r={5} fill={COL.lb} />
      </g>
      <text x={LB.x + 30} y={y - 6} fontFamily={MONO} fontWeight={600} fontSize={27} fill={COL.lb} textAnchor="middle" letterSpacing={2}>
        LOAD BALANCER
      </text>
      <text x={LB.x + 30} y={y + 32} fontFamily={MONO} fontSize={21} fill={COL.dim} textAnchor="middle">
        {f < S.rr ? 'spreading traffic' : f < S.lc ? 'next = (last + 1) % 3' : f < S.hash ? 'next = min(conns)' : f < S.health ? 'next = hash(ip) % 3' : f < S.l4 ? 'health check: every 1s' : l4 ? 'sees: 203.0.113.7:443' : l7 ? 'sees: GET /api/orders' : ''}
      </text>
    </g>
  );
};

const Routes: React.FC<{f: number}> = ({f}) => {
  const o = lbVis(f);
  const y = lbY(f) + LB.h / 2;
  return (
    <g>
      {/* client → LB funnel */}
      {CLIENT_X.map((cx, i) => (
        <line key={`c${i}`} x1={cx} y1={CLIENT_Y + 40} x2={f < S.fix ? SERVER_X[1] : LB.x} y2={f < S.fix ? SERVER_Y - SERVER.h / 2 : lbY(f) - LB.h / 2} stroke="#1c2838" strokeWidth={2} strokeDasharray="4 8" />
      ))}
      {[0, 1, 2].map((s) => {
        const dead = s === 1 && f >= DETECT_AT && f < S.l4;
        return (
          <line
            key={s}
            x1={LB.x}
            y1={y}
            x2={serverX(s, f)}
            y2={SERVER_Y - SERVER.h / 2}
            stroke={dead ? COL.bad : '#2a3a50'}
            strokeWidth={dead ? 2 : 3}
            strokeDasharray={dead ? '6 10' : undefined}
            opacity={o * serverVis(s, f) * (dead ? 0.6 : 1)}
          />
        );
      })}
    </g>
  );
};

const packetPos = (p: Packet, f: number) => {
  const cx = CLIENT_X[p.client];
  const c0 = {x: cx, y: CLIENT_Y + 30};
  const sx = serverX(p.target, f);
  const top = SERVER_Y - SERVER.h / 2 + 6;
  if (p.direct) {
    const t = ip(f, [p.spawn, p.spawn + TRAVEL_DIRECT], [0, 1], Easing.bezier(0.45, 0, 0.6, 1));
    return {x: lerp(c0.x, sx, t), y: lerp(c0.y, top, t), seen: true};
  }
  const y = lbY(f);
  const a = ip(f, [p.spawn, p.spawn + LEG_A], [0, 1], Easing.bezier(0.45, 0, 0.6, 1));
  if (f < p.spawn + LEG_A) return {x: lerp(c0.x, LB.x, a), y: lerp(c0.y, y - LB.h / 2 + 8, a), seen: true};
  if (f < p.spawn + LEG_A + IN_LB) return {x: LB.x, y, seen: false};
  const b = ip(f, [p.spawn + LEG_A + IN_LB, p.spawn + LEG_A + IN_LB + LEG_B], [0, 1], Easing.bezier(0.3, 0, 0.5, 1));
  return {x: lerp(LB.x, sx, b), y: lerp(y + LB.h / 2 - 8, top, b), seen: true};
};

const Packets: React.FC<{f: number}> = ({f}) => (
  <g>
    {PACKETS.filter((p) => f >= p.spawn && f < arrival(p) + 14).map((p) => {
      const a = arrival(p);
      if (f >= a) {
        // absorbed (ring) or rejected (red burst)
        const k = (f - a) / 14;
        const x = serverX(p.target, f);
        const y = SERVER_Y - SERVER.h / 2 + 6;
        return p.fail ? (
          <g key={p.id} opacity={1 - k} transform={`translate(${x + (random(`fx${p.id}`) - 0.5) * 120} ${y - k * 70})`}>
            <path d="M -9 -9 L 9 9 M 9 -9 L -9 9" stroke={COL.bad} strokeWidth={4} strokeLinecap="round" />
          </g>
        ) : (
          <circle key={p.id} cx={x} cy={y} r={8 + k * 26} fill="none" stroke={p.color} strokeWidth={3} opacity={(1 - k) * 0.8} />
        );
      }
      const pos = packetPos(p, f);
      if (!pos.seen) return null;
      const late = p.fail && f > a - 8;
      const col = late ? COL.bad : p.color;
      return (
        <g key={p.id}>
          <circle cx={pos.x} cy={pos.y} r={18} fill={col} opacity={0.16} />
          <circle cx={pos.x} cy={pos.y} r={9} fill={col} />
          {p.label ? (
            <g transform={`translate(${pos.x + 16} ${pos.y - 15})`}>
              <rect width={p.label.length * 13.5 + 18} height={30} rx={8} fill="#0f1621" stroke={col} strokeWidth={1.5} />
              <text x={9} y={21} fontFamily={MONO} fontSize={21} fill={col}>
                {p.label}
              </text>
            </g>
          ) : null}
        </g>
      );
    })}
  </g>
);

const Heartbeats: React.FC<{f: number}> = ({f}) => {
  if (f < S.health + 10 || f >= S.l4 - 10) return null;
  const out: React.ReactNode[] = [];
  for (let b = S.health + 10; b <= f; b += 30) {
    for (const s of [0, 1, 2]) {
      const t = (f - b) / 14;
      const x0 = LB.x;
      const y0 = lbY(f) + LB.h / 2;
      const x1 = serverX(s, f) + 40;
      const y1 = SERVER_Y - SERVER.h / 2;
      const dead = isDown(s, b + 7);
      if (t >= 0 && t <= 1) out.push(<circle key={`o${b}${s}`} cx={lerp(x0 - 30, x1, t)} cy={lerp(y0, y1, t)} r={6} fill={COL.ok} opacity={0.9} />);
      const r = (f - b - 14) / 14;
      if (!dead && r >= 0 && r <= 1) out.push(<circle key={`r${b}${s}`} cx={lerp(x1, x0 - 30, r)} cy={lerp(y1, y0, r)} r={6} fill={COL.ok} opacity={0.5} />);
      if (dead && f - b >= 14 && f - b < 40)
        out.push(
          <text key={`t${b}${s}`} x={x1 - 40} y={y1 - 22} fontFamily={MONO} fontSize={22} fill={COL.bad} textAnchor="middle" opacity={ip(f - b, [14, 18, 34, 40], [0, 1, 1, 0])}>
            timeout
          </text>,
        );
    }
  }
  return <g>{out}</g>;
};

/* ───────── hook counter ───────── */
const HookCounter: React.FC<{f: number}> = ({f}) => {
  if (f >= S.fix) return null;
  const showRate = ip(f, [S.series - 8, S.series], [1, 0]);
  const rate = Math.round(hookRate(f) * 463 + f * 9);
  const o = ip(f, [S.fix - 10, S.fix], [1, 0]);
  const stamp = ip(f, [104, 110], [0, 1], Easing.bezier(0.2, 1.6, 0.4, 1));
  return (
    <>
      <div style={{position: 'absolute', left: 70, top: 496, opacity: o * showRate, display: 'flex', alignItems: 'baseline', gap: 16}}>
        <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 64, color: f >= 92 ? COL.bad : COL.req, letterSpacing: -1, fontVariantNumeric: 'tabular-nums'}}>{rate.toLocaleString('en-GB')}</span>
        <span style={{fontFamily: MONO, fontSize: 28, color: COL.dim}}>requests / sec</span>
      </div>
      {f >= 104 ? (
        <div style={{position: 'absolute', left: 0, right: 0, top: SERVER_Y - 30, display: 'flex', justifyContent: 'center', opacity: o}}>
          <div style={{rotate: '-6deg', scale: String(0.6 + 0.4 * stamp), opacity: stamp, padding: '10px 24px', border: `5px solid ${COL.bad}`, borderRadius: 14, background: 'rgba(10,14,20,0.85)', fontFamily: MONO, fontWeight: 600, fontSize: 38, color: COL.bad, letterSpacing: 2}}>
            503 SERVICE UNAVAILABLE
          </div>
        </div>
      ) : null}
    </>
  );
};

/* ───────── recap ───────── */
const Recap: React.FC<{f: number}> = ({f}) => {
  if (f < S.recap) return null;
  const items = [
    ['Spread traffic', 'across many servers'],
    ['Pick a strategy', 'round robin · least conn · IP hash'],
    ['Health checks', 'skip dead servers automatically'],
    ['L4 vs L7', 'fast by address, or smart by request'],
  ];
  return (
    <div style={{position: 'absolute', left: 70, right: 150, top: 250}}>
      <div style={{fontFamily: MONO, fontWeight: 600, fontSize: 27, letterSpacing: 3, color: COL.lb, opacity: ip(f, [S.recap, S.recap + 8], [0, 1])}}>RECAP</div>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 76, lineHeight: 1.08, letterSpacing: -2, color: COL.ink, marginTop: 18, opacity: ip(f, [S.recap + 4, S.recap + 14], [0, 1])}}>Load balancers,</div>
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
      <div
        style={{
          marginTop: 40,
          display: 'inline-block',
          padding: '20px 34px',
          borderRadius: 999,
          background: COL.lb,
          color: '#1a1406',
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: 36,
          opacity: ip(f, [S.recap + 96, S.recap + 106], [0, 1]),
          scale: String(ip(f, [S.recap + 96, S.recap + 106], [0.85, 1], Easing.bezier(0.2, 1.5, 0.4, 1))),
        }}
      >
        Follow for more
      </div>
      <div style={{marginTop: 22, fontFamily: MONO, fontSize: 29, color: COL.dim, opacity: ip(f, [S.recap + 104, S.recap + 114], [0, 1])}}>Be an expert in anything tech, in under 1 minute.</div>
    </div>
  );
};

/* ───────── progress bar (sits under the headline, clear of the platform header) ───────── */
const Progress: React.FC<{f: number}> = ({f}) => {
  const marks = [S.fix, S.rr, S.lc, S.hash, S.health, S.l4, S.recap];
  return (
    <div style={{position: 'absolute', left: 70, right: 150, top: 232, height: 4, display: 'flex', gap: 8}}>
      {marks.map((m, i) => {
        const end = marks[i + 1] ?? S.total;
        return (
          <div key={i} style={{flex: 1, borderRadius: 2, background: '#1c2838', overflow: 'hidden'}}>
            <div style={{width: `${ip(f, [m, end], [0, 100], Easing.linear)}%`, height: '100%', background: COL.lb}} />
          </div>
        );
      })}
    </div>
  );
};

export const Explainer: React.FC = () => {
  const f = useCurrentFrame();
  const recapDim = ip(f, [S.recap, S.recap + 16], [1, 0]);
  const hashScene = f >= S.hash && f < S.health;
  // gentle camera breathing so no shot is ever static
  const breathe = 1 + 0.012 * Math.sin((f / 90) * Math.PI);
  return (
    <AbsoluteFill style={{background: COL.bg}}>
      <AbsoluteFill style={{backgroundImage: 'radial-gradient(rgba(140,160,190,0.10) 1.5px, transparent 1.5px)', backgroundSize: '36px 36px', backgroundPosition: `0 ${-f * 0.4}px`}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 60% at 50% 55%, rgba(57,208,255,0.06), rgba(0,0,0,0) 70%)'}} />
      <AbsoluteFill style={{opacity: recapDim, scale: String(breathe)}}>
        <svg width={1080} height={1920} style={{position: 'absolute'}}>
          <Routes f={f} />
          {CLIENT_X.map((x, i) => {
            const user = hashScene ? [-1, 0, 1, 2, -1][i] : -1;
            const hot = PACKETS.some((p) => p.client === i && f >= p.spawn && f < p.spawn + 6) ? 1 : 0;
            return <Client key={i} x={x} color={user >= 0 ? COL.users[user] : '#4a5d78'} o={hashScene && user < 0 ? 0.3 : 1} hot={hot} />;
          })}
          <text x={CLIENT_X[0] - 52} y={CLIENT_Y - 54} fontFamily={MONO} fontSize={22} fill={COL.dim} letterSpacing={2}>
            CLIENTS
          </text>
          <LoadBalancer f={f} />
          <Heartbeats f={f} />
          {[0, 1, 2].map((s) => (
            <Server key={s} s={s} f={f} />
          ))}
          <Packets f={f} />
        </svg>
      </AbsoluteFill>
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
