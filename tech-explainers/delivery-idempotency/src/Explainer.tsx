import React from 'react';
import {AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {
  A, along, AMBIENT, BADGES, balanceAt, BOTTOM, BUILD, CHARGES, COL, DIAGRAM_ON, DRIVERS, E, EdgeName, H1, H2, H3, HOME, IN_FLIGHT, lightOn, N, ON_PRESSES, ORDERS, PKT_DUR, PKTS, QUEUE_MSG, Ride, RIDES_FIX2, RIDES_HOOK, RIDES_HOP2, Row, RUNS_SET, RUNS_SUB, S, SHOP, statusAt, TOGGLE_PRESSES, toggleOn,
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
const win = (f: number, a: number, b: number, fade = 8) => ip(f, [a - fade, a, b - fade, b], [0, 1, 1, 0]);

/* ───────── copy ───────── */
type Copy = {at: number; until: number; kicker: string; head: string[]; kColor?: string};
const COPY: Copy[] = [
  {at: S.hook, until: S.lead, kicker: 'IDEMPOTENCY · REAL SYSTEM DESIGN', head: ['POV: one order,', 'two drivers.'], kColor: COL.bad},
  {at: S.lead, until: S.idea, kicker: 'LET’S BUILD IT', head: ['A delivery app’s', 'order flow.'], kColor: COL.req},
  {at: S.idea, until: S.code, kicker: '01 · THE IDEA', head: ['ON, not TOGGLE.', 'Again = no change.'], kColor: COL.amber},
  {at: S.code, until: S.hop1, kicker: '02 · IN CODE', head: ['Set it.', 'Don’t add to it.'], kColor: COL.violet},
  {at: S.hop1, until: S.reuse, kicker: '03 · THE PHONE RETRIES', head: ['Send an order key.', 'Same key, same order.'], kColor: COL.req},
  {at: S.reuse, until: S.hop2, kicker: '04 · KEY REUSED?', head: ['Different basket?', 'Reject it.'], kColor: COL.bad},
  {at: S.hop2, until: S.fix2, kicker: '05 · THE QUEUE REDELIVERS', head: ['At least once means', 'sometimes twice.'], kColor: COL.bad},
  {at: S.fix2, until: S.hop3, kicker: '06 · DEDUPE THE WORKER', head: ['One driver', 'per order.'], kColor: COL.ok},
  {at: S.hop3, until: S.rule, kicker: '07 · THE PAYMENT TIMES OUT', head: ['Same key on retry,', 'one charge.'], kColor: COL.violet},
  {at: S.rule, until: S.payoff, kicker: 'THE RULE', head: ['If it can run twice,', 'make twice safe.'], kColor: COL.ok},
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
  const marks = [S.idea, S.code, S.hop1, S.reuse, S.hop2, S.fix2, S.hop3, S.rule, S.payoff];
  return (
    <div style={{position: 'absolute', left: 70, right: 150, top: 232, height: 4, display: 'flex', gap: 6}}>
      {marks.map((m, i) => (
        <div key={i} style={{flex: 1, borderRadius: 2, background: '#1c2838', overflow: 'hidden'}}>
          <div style={{width: `${ip(f, [m, marks[i + 1] ?? S.total], [0, 100], Easing.linear)}%`, height: '100%', background: COL.amber}} />
        </div>
      ))}
    </div>
  );
};
const panel: React.CSSProperties = {position: 'absolute', borderRadius: 20, background: '#0d131c', border: '2px solid #223044', overflow: 'hidden'};

/* ───────── the map ───────── */
const MapView: React.FC<{f: number; x: number; y: number; w: number; h: number; rides: Ride[]; o?: number; big?: boolean}> = ({f, x, y, w, h, rides, o = 1, big}) => {
  if (o <= 0) return null;
  const P = (p: {x: number; y: number}) => ({x: p.x * w, y: p.y * h});
  const home = P(HOME);
  const shop = P(SHOP);
  const s = big ? 1.4 : 1;
  const arrived = rides.filter((r) => f >= r.end).length;
  return (
    <div style={{...panel, left: x, top: y, width: w, height: h, opacity: o, background: '#0c1219'}}>
      <svg width={w} height={h} style={{position: 'absolute'}}>
        {/* streets */}
        {[0.12, 0.4, 0.55, 0.78].map((yy) => (
          <line key={`h${yy}`} x1={0} y1={yy * h} x2={w} y2={yy * h} stroke="#1a2534" strokeWidth={big ? 22 : 14} strokeLinecap="round" />
        ))}
        {[0.18, 0.42, 0.62, 0.92].map((xx) => (
          <line key={`v${xx}`} x1={xx * w} y1={0} x2={xx * w} y2={h} stroke="#1a2534" strokeWidth={big ? 22 : 14} strokeLinecap="round" />
        ))}
        {/* ride paths */}
        {rides.map((r) =>
          f >= r.start - 10 ? (
            <polyline key={`p${r.name}`} points={r.path.map((p) => `${P(p).x},${P(p).y}`).join(' ')} fill="none" stroke={r.col} strokeWidth={4 * s} strokeDasharray={`${6 * s} ${10 * s}`} opacity={0.6} />
          ) : null,
        )}
        {/* shop + home */}
        <g transform={`translate(${shop.x} ${shop.y})`}>
          <circle r={22 * s} fill="#1f1a0c" stroke={COL.amber} strokeWidth={3} />
          <text y={9 * s} textAnchor="middle" fontSize={24 * s}>
            🍕
          </text>
        </g>
        <g transform={`translate(${home.x} ${home.y})`}>
          <circle r={26 * s} fill="#0f1a24" stroke={arrived > 1 ? COL.bad : COL.req} strokeWidth={3} />
          <text y={10 * s} textAnchor="middle" fontSize={28 * s}>
            🏠
          </text>
        </g>
        {/* scooters */}
        {rides.map((r) => {
          if (f < r.start) return null;
          const t = ip(f, [r.start, r.end], [0, 1], glide);
          const p = P(along(r.path, t));
          return (
            <g key={r.name} transform={`translate(${p.x} ${p.y})`}>
              <circle r={22 * s} fill={r.col} opacity={0.2} />
              <circle r={14 * s} fill={r.col} />
              <text y={6 * s} textAnchor="middle" fontSize={16 * s}>
                🛵
              </text>
              <text y={-24 * s} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={18 * s} fill={r.col}>
                {r.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

/* hook: the full-screen map + two "on the way" notifications, then it shrinks away as the system builds */
const HookMap: React.FC<{f: number}> = ({f}) => {
  if (f >= S.idea) return null;
  const t = ip(f, [S.lead + 4, S.lead + 68], [0, 1], glide);
  const o = ip(f, [S.idea - 30, S.idea - 6], [1, 0]);
  const x = lerp(70, BOTTOM.x, t);
  const y = lerp(560, BOTTOM.y, t);
  const w = lerp(830, BOTTOM.w, t);
  const h = lerp(880, BOTTOM.h, t);
  const note = (name: string, col: string, at: number, i: number) => (
    <div key={name} style={{position: 'absolute', left: 90, right: 170, top: 580 + i * 92, padding: '14px 20px', borderRadius: 18, background: 'rgba(18,24,34,0.94)', border: `2.5px solid ${col}`, display: 'flex', gap: 14, alignItems: 'center', opacity: ip(f, [at, at + 6], [0, 1]) * (1 - t), translate: `0 ${(1 - ip(f, [at, at + 8], [0, 1], pop)) * -30}px`}}>
      <span style={{fontSize: 32}}>🛵</span>
      <span style={{fontFamily: SANS, fontWeight: 700, fontSize: 28, color: COL.ink}}>
        {name} is on the way <span style={{fontFamily: MONO, fontWeight: 400, fontSize: 22, color: COL.dim}}>· order A12</span>
      </span>
    </div>
  );
  return (
    <>
      <MapView f={f} x={x} y={y} w={w} h={h} rides={RIDES_HOOK} o={o} big={t < 0.5} />
      {note('Sam', COL.ok, -10, 0)}
      {note('Priya', COL.bad, A.two - 10, 1)}
    </>
  );
};

/* ───────── the system diagram ───────── */
const LABEL: Record<string, string> = {phone: '📱 your app', api: 'Order API', pay: 'Payments', queue: 'Queue', kitchen: 'Kitchen', dispatch: 'Driver dispatch'};
const Node: React.FC<{f: number; id: string}> = ({f, id}) => {
  const b = N[id];
  const p = ip(f, [BUILD[id], BUILD[id] + 10], [0, 1], pop);
  if (p <= 0) return null;
  const st = statusAt(id, f);
  const crashed = id === 'dispatch' && st?.t.startsWith('✗');
  const border = st ? st.c : '#2c3c52';
  return (
    <div style={{...panel, left: b.x, top: b.y, width: b.w, height: b.h, opacity: Math.min(1, p), scale: String(0.7 + 0.3 * p), border: `2.5px solid ${border}`, background: crashed ? '#1a0d10' : '#0d131c', boxShadow: st ? `0 0 26px ${st.c}33` : undefined, padding: '12px 18px'}}>
      <div style={{fontFamily: MONO, fontWeight: 600, fontSize: 23, letterSpacing: 1, color: COL.ink}}>{LABEL[id]}</div>
      {st ? (
        <div style={{marginTop: 6, fontFamily: MONO, fontWeight: 600, fontSize: 20, color: st.c, whiteSpace: 'nowrap', opacity: ip(f, [st.from, st.from + 6], [0, 1])}}>{st.t}</div>
      ) : id === 'phone' ? (
        <div style={{marginTop: 6, fontFamily: MONO, fontSize: 19, color: COL.dim}}>£24 order</div>
      ) : null}
    </div>
  );
};
const Queue: React.FC<{f: number}> = ({f}) => {
  const b = N.queue;
  const p = ip(f, [BUILD.queue, BUILD.queue + 10], [0, 1], pop);
  if (p <= 0) return null;
  const msgs = QUEUE_MSG.filter((m) => f >= m.from && f < m.to);
  const fl = IN_FLIGHT.filter((m) => f >= m.from && f < m.to);
  return (
    <div style={{...panel, left: b.x, top: b.y, width: b.w, height: b.h, opacity: Math.min(1, p), scale: String(0.7 + 0.3 * p), display: 'flex', alignItems: 'center', gap: 16, padding: '0 18px'}}>
      <div style={{fontFamily: MONO, fontWeight: 600, fontSize: 23, color: COL.ink}}>Queue</div>
      <div style={{fontFamily: MONO, fontSize: 19, color: COL.dim}}>at-least-once</div>
      <div style={{flex: 1}} />
      {msgs.map((m) => (
        <div key={m.from} style={{padding: '8px 14px', borderRadius: 10, border: `2px solid ${m.back ? COL.amber : COL.req}`, background: m.back ? '#1a1406' : '#0f1a24', fontFamily: MONO, fontWeight: 600, fontSize: 20, color: m.back ? COL.amber : COL.req, scale: String(ip(f, [m.from, m.from + 8], [0.6, 1], pop))}}>
          {m.label}
        </div>
      ))}
      {fl.map((m) => (
        <div key={`fl${m.from}`} style={{padding: '8px 14px', borderRadius: 10, border: `2px dashed ${COL.dim}`, fontFamily: MONO, fontSize: 19, color: COL.dim}}>
          A12 in flight · waiting for “done”
        </div>
      ))}
    </div>
  );
};
const ptAt = (pts: {x: number; y: number}[], t: number) => ({x: lerp(pts[0].x, pts[1].x, t), y: lerp(pts[0].y, pts[1].y, t)});
const Wires: React.FC<{f: number}> = ({f}) => {
  const out: React.ReactNode[] = [];
  const edgeOn = (e: EdgeName) => {
    const map: Record<EdgeName, string> = {phoneApi: 'api', apiPhone: 'api', apiPay: 'pay', payApi: 'pay', apiQueue: 'queue', queueKitchen: 'kitchen', queueDispatch: 'dispatch', dispatchQueue: 'dispatch'};
    return f >= BUILD[map[e]] + 6;
  };
  (Object.keys(E) as EdgeName[]).forEach((e) => {
    if (!edgeOn(e)) return;
    const [a, b] = E[e];
    out.push(<line key={e} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#25344a" strokeWidth={3} strokeDasharray="6 8" />);
  });
  // ambient: other customers' orders
  for (const m of AMBIENT) {
    if (f < m.at || f >= m.at + PKT_DUR || !edgeOn(m.edge)) continue;
    const p = ptAt(E[m.edge], ip(f, [m.at, m.at + PKT_DUR], [0, 1], glide));
    out.push(<circle key={`a${m.at}`} cx={p.x} cy={p.y} r={6.5} fill={COL.dim} opacity={0.8} />);
  }
  // the story's packets
  for (const k of PKTS) {
    if (f < k.at) continue;
    const end = k.lost ? k.at + PKT_DUR / 2 : k.at + PKT_DUR;
    if (f < end) {
      const p = ptAt(E[k.edge], ip(f, [k.at, k.at + PKT_DUR], [0, 1], glide));
      const w = k.label.length * 12.4 + 22;
      const right = k.edge === 'apiPhone' || k.edge === 'dispatchQueue';
      out.push(
        <g key={`k${k.at}${k.edge}`} transform={`translate(${p.x} ${p.y})`}>
          <circle r={16} fill={k.col} opacity={0.2} />
          <circle r={8} fill={k.col} />
          <g transform={`translate(${right ? 16 : k.edge === 'payApi' ? -w / 2 : 16} ${k.edge === 'apiPay' ? -48 : k.edge === 'payApi' ? 14 : -18})`}>
            <rect width={w} height={34} rx={9} fill="#0f1621" stroke={k.col} strokeWidth={2} />
            <text x={11} y={24} fontFamily={MONO} fontWeight={600} fontSize={20} fill={k.col}>
              {k.label}
            </text>
          </g>
        </g>,
      );
    } else if (k.lost && f < end + 36) {
      const p = ptAt(E[k.edge], 0.5);
      const q = (f - end) / 36;
      out.push(
        <g key={`x${k.at}`} transform={`translate(${p.x} ${p.y})`} opacity={q < 0.75 ? 1 : (1 - q) * 4}>
          {q < 0.3 ? [0, 1, 2, 3, 4, 5, 6, 7].map((i) => <circle key={i} cx={Math.cos((i / 8) * Math.PI * 2) * (12 + q * 140)} cy={Math.sin((i / 8) * Math.PI * 2) * (12 + q * 140)} r={5 * (1 - q / 0.3)} fill={COL.bad} />) : null}
          <path d="M -13 -13 L 13 13 M 13 -13 L -13 13" stroke={COL.bad} strokeWidth={6} strokeLinecap="round" />
          <g transform={`translate(${k.edge === 'payApi' ? -60 : 22} ${k.edge === 'payApi' ? 40 : 8})`}>
            <rect width={k.edge === 'payApi' ? 120 : 134} height={32} rx={8} fill="#1a0d10" stroke={COL.bad} strokeWidth={2} />
            <text x={10} y={22} fontFamily={MONO} fontWeight={600} fontSize={20} fill={COL.bad}>
              {k.edge === 'payApi' ? 'timed out' : 'reply lost'}
            </text>
          </g>
        </g>,
      );
    }
  }
  // the rule: safe-to-retry badges on each hop
  for (const b of BADGES) {
    const o = ip(f, [b.at, b.at + 8], [0, 1]) * ip(f, [S.payoff - 6, S.payoff], [1, 0]);
    if (o <= 0) continue;
    const p = ptAt(E[b.edge], 0.5);
    const w = b.t.length * 12.4 + 46;
    const glow = f >= A.safe ? 0.5 + 0.5 * Math.sin((f - A.safe) / 4) : 0;
    out.push(
      <g key={`b${b.edge}`} opacity={o} transform={`translate(${p.x - (b.edge === 'apiPay' ? w / 2 : 0) + (b.edge === 'apiPay' ? 0 : 14)} ${p.y - 17}) scale(${ip(f, [b.at, b.at + 8], [0.6, 1], pop)})`}>
        <rect width={w} height={34} rx={17} fill="#10261a" stroke={COL.ok} strokeWidth={2.5} style={{filter: glow ? `drop-shadow(0 0 ${8 * glow}px ${COL.ok})` : undefined}} />
        <text x={12} y={24} fontFamily={MONO} fontWeight={600} fontSize={20} fill={COL.ok}>
          ✓ {b.t}
        </text>
      </g>,
    );
  }
  return <svg width={1080} height={1920} style={{position: 'absolute'}}>{out}</svg>;
};

/* ───────── bottom panels ───────── */
const Table: React.FC<{f: number; title: string; cols: string[]; widths: number[]; rows: Row[]; box: {x: number; y: number; w: number; h: number}; o: number; note?: React.ReactNode}> = ({f, title, cols, widths, rows, box, o, note}) => {
  if (o <= 0) return null;
  const vis = rows.filter((r) => f >= r.at && f < r.to);
  return (
    <div style={{...panel, left: box.x, top: box.y, width: box.w, height: box.h, opacity: o}}>
      <div style={{padding: '12px 20px', borderBottom: '2px solid #1c2838', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <span style={{fontFamily: MONO, fontWeight: 600, fontSize: 21, letterSpacing: 2, color: COL.dim}}>{title}</span>
        {note}
      </div>
      <div style={{display: 'flex', padding: '10px 20px 4px', fontFamily: MONO, fontSize: 18, color: COL.dim}}>
        {cols.map((c, i) => (
          <span key={c} style={{width: widths[i]}}>
            {c}
          </span>
        ))}
      </div>
      <div style={{padding: '0 14px'}}>
        {vis.map((r) => {
          const p = ip(f, [r.at, r.at + 8], [0, 1], pop);
          const col = r.bad ? COL.bad : r.good ? COL.ok : COL.ink;
          return (
            <div key={r.at} style={{display: 'flex', marginTop: 8, padding: '10px 6px', borderRadius: 12, background: r.bad ? '#2a0f13' : r.good ? '#10261a' : '#121a26', border: `2px solid ${r.bad ? COL.bad : r.good ? COL.ok : '#2c3c52'}`, opacity: p, scale: String(0.85 + 0.15 * p), fontFamily: MONO, fontWeight: 600, fontSize: 22, color: col, whiteSpace: 'nowrap'}}>
              {r.cells.map((c, i) => (
                <span key={i} style={{width: widths[i], paddingLeft: 6}}>
                  {c}
                </span>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};
const Bottom: React.FC<{f: number}> = ({f}) => {
  const ordersO = win(f, S.hop1 + 6, S.hop2);
  const h2 = win(f, S.hop2 + 6, S.hop3);
  const h3 = win(f, S.hop3 + 6, S.rule);
  const rw1 = f >= H1.rewind && f < H1.rewind + 12 ? 1 - (f - H1.rewind) / 12 : 0;
  const twoOrders = f >= H1.a13 && f < H1.rewind;
  const fixWorld = f >= H2.rewind;
  const mapBox = {x: 500, y: BOTTOM.y, w: 400, h: BOTTOM.h};
  const rides = fixWorld ? RIDES_FIX2 : RIDES_HOP2;
  const h2rw = f >= H2.rewind && f < H2.rewind + 12 ? 1 - (f - H2.rewind) / 12 : 0;
  return (
    <>
      <Table
        f={f}
        title="ORDERS"
        cols={['order', 'key', 'basket']}
        widths={[150, 210, 420]}
        rows={ORDERS}
        box={BOTTOM}
        o={ordersO * (1 - rw1 * 0.6)}
        note={twoOrders ? <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 28, color: COL.bad}}>2 orders for 1 dinner</span> : f >= H1.k1 && f < S.hop2 ? <span style={{fontFamily: MONO, fontWeight: 600, fontSize: 20, color: COL.violet}}>key saved with its result</span> : null}
      />
      <Table
        f={f}
        title="DRIVERS"
        cols={['order', 'driver']}
        widths={[110, 280]}
        rows={DRIVERS}
        box={{x: 70, y: BOTTOM.y, w: 410, h: BOTTOM.h}}
        o={h2 * (1 - h2rw * 0.6)}
        note={fixWorld && f >= A.oneRule - 4 ? <span style={{fontFamily: MONO, fontWeight: 600, fontSize: 18, color: COL.ok, opacity: ip(f, [A.oneRule - 4, A.oneRule + 6], [0, 1])}}>UNIQUE(order)</span> : null}
      />
      <MapView f={f} {...mapBox} rides={rides} o={h2 * (1 - h2rw)} />
      <Table
        f={f}
        title="YOUR CARD"
        cols={['', '', '']}
        widths={[150, 260, 380]}
        rows={CHARGES}
        box={{...BOTTOM, h: 250}}
        o={h3}
        note={f >= H3.charged ? <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 30, color: f >= A.once ? COL.ok : COL.ink}}>£24 taken{f >= A.once ? ' · once ✓' : ''}</span> : null}
      />
    </>
  );
};

/* ───────── overlays: the idea (switches) and the code ───────── */
const Switch: React.FC<{f: number; x: number; label: string; presses: number[]; on: boolean; col: string; result: string; resultCol: string; resultAt: number}> = ({f, x, label, presses, on, col, result, resultCol, resultAt}) => {
  const n = presses.filter((p) => f >= p).length;
  const pressing = presses.some((p) => f >= p && f < p + 5);
  // before its first press, a finger-hover pulse: the switch is about to be tapped
  const hover = n === 0 ? 0.5 + 0.5 * Math.sin(f / 4) : 0;
  return (
    <div style={{...panel, left: x, top: 560, width: 400, height: 760, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 30, boxShadow: hover ? `0 0 ${10 + 22 * hover}px ${col}55` : undefined, border: `2px solid ${hover ? col : '#223044'}`}}>
      <div style={{fontFamily: MONO, fontWeight: 600, fontSize: 26, color: col, letterSpacing: 3}}>{label}</div>
      {/* bulb */}
      <svg width={180} height={220} viewBox="0 0 100 120" style={{marginTop: 26}}>
        {on ? <circle cx={50} cy={45} r={44 + 4 * Math.sin(f / 5)} fill={COL.amber} opacity={0.18 + 0.08 * Math.sin(f / 5)} /> : null}
        <path d="M50 8 a34 34 0 0 1 20 61 v14 h-40 v-14 a34 34 0 0 1 20 -61 z" fill={on ? '#ffd166' : '#1c2838'} stroke={on ? COL.amber : '#3a4f6a'} strokeWidth={3} />
        <rect x={34} y={87} width={32} height={8} rx={3} fill="#3a4f6a" />
        <rect x={37} y={98} width={26} height={8} rx={3} fill="#3a4f6a" />
      </svg>
      {/* switch */}
      <div style={{marginTop: 24, width: 150, height: 210, borderRadius: 24, background: '#1a2230', border: '3px solid #3a4f6a', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{width: 84, height: 150, borderRadius: 16, background: pressing ? '#2b3b52' : '#223044', border: `3px solid ${col}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontWeight: 600, fontSize: 22, color: col, scale: pressing ? '0.92' : '1'}}>{label}</div>
      </div>
      <div style={{marginTop: 26, fontFamily: MONO, fontSize: 26, color: COL.dim}}>
        presses: <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 40, color: COL.ink}}>{n}</span>
      </div>
      <div style={{marginTop: 12, fontFamily: SANS, fontWeight: 800, fontSize: 32, color: resultCol, opacity: ip(f, [resultAt, resultAt + 8], [0, 1])}}>{result}</div>
    </div>
  );
};
const Idea: React.FC<{f: number}> = ({f}) => {
  const o = win(f, S.idea + 6, S.code);
  if (o <= 0) return null;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: o}}>
      <Switch f={f} x={70} label="ON" presses={ON_PRESSES} on={lightOn(f)} col={COL.ok} result="still just on ✓" resultCol={COL.ok} resultAt={ON_PRESSES[4] + 4} />
      <Switch f={f} x={500} label="TOGGLE" presses={TOGGLE_PRESSES} on={toggleOn(f)} col={COL.bad} result="on? off? depends" resultCol={COL.bad} resultAt={A.whoKnows} />
      <div style={{position: 'absolute', left: 70, right: 180, top: 1350, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 40, color: COL.amber, opacity: ip(f, [A.idempotent - 4, A.idempotent + 8], [0, 1])}}>
        idempotent = doing it again changes nothing
      </div>
    </div>
  );
};
const CodeCard: React.FC<{f: number; top: number; code: string; runs: number[]; value: string; verdict: string; good: boolean; at: number}> = ({f, top, code, runs, value, verdict, good, at}) => {
  const n = runs.filter((r) => f >= r).length;
  const flash = runs.reduce((m, r) => Math.max(m, f >= r && f < r + 12 ? 1 - (f - r) / 12 : 0), 0);
  const col = good ? COL.ok : COL.bad;
  return (
    <div style={{...panel, left: 70, top, width: 830, height: 330, opacity: ip(f, [at - 6, at + 6], [0, 1]), background: '#080c12', padding: '24px 30px', border: `2px solid ${n >= 2 ? col : '#223044'}`}}>
      <div style={{fontFamily: MONO, fontSize: 36, color: COL.ink, whiteSpace: 'pre', background: `rgba(57,208,255,${0.18 * flash})`, borderRadius: 8, padding: '4px 10px', margin: '0 -10px'}}>{code}</div>
      <div style={{marginTop: 22, display: 'flex', gap: 30, alignItems: 'baseline'}}>
        <span style={{fontFamily: MONO, fontSize: 26, color: COL.dim}}>runs: <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 40, color: COL.ink}}>{n}</span></span>
        <span style={{fontFamily: MONO, fontSize: 28, color: COL.dim}}>→ <span style={{fontWeight: 600, color: n >= 2 ? col : COL.ink}}>{value}</span></span>
      </div>
      <div style={{marginTop: 22, fontFamily: SANS, fontWeight: 800, fontSize: 36, color: col, opacity: n >= 2 ? ip(f, [runs[1], runs[1] + 8], [0, 1]) : 0}}>{verdict}</div>
    </div>
  );
};
const Code: React.FC<{f: number}> = ({f}) => {
  const o = win(f, S.code + 6, S.hop1);
  if (o <= 0) return null;
  const bal = balanceAt(f);
  return (
    <div style={{position: 'absolute', inset: 0, opacity: o}}>
      <CodeCard f={f} top={590} at={A.set} code={'order.status = "paid"'} runs={RUNS_SET} value={'status: "paid"'} verdict="idempotent ✓ (ON)" good={true} />
      <CodeCard f={f} top={960} at={A.take} code={'balance -= 24'} runs={RUNS_SUB} value={`balance: £${bal}`} verdict="not idempotent ✗ (TOGGLE)" good={false} />
    </div>
  );
};

/* ───────── recap ───────── */
const RECAP = [
  ['Idempotent = ON, not TOGGLE', 'doing it again changes nothing'],
  ['App → API: send an order key', 'same key → same order · new basket → reject'],
  ['Queue → worker: skip done work', 'at-least-once means sometimes twice'],
  ['Payments: reuse the key', 'a retry never charges twice'],
];
const RECAP_COL = [COL.amber, COL.req, COL.ok, COL.violet];
const Recap: React.FC<{f: number}> = ({f}) => {
  const r = S.payoff;
  if (f < r) return null;
  return (
    <div style={{position: 'absolute', left: 70, right: 150, top: 250, scale: String(1 + 0.02 * ip(f, [r, S.total], [0, 1], Easing.linear)), transformOrigin: '0 0'}}>
      <div style={{fontFamily: MONO, fontWeight: 600, fontSize: 27, letterSpacing: 3, color: COL.amber, opacity: ip(f, [r, r + 8], [0, 1])}}>RECAP</div>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 76, lineHeight: 1.08, letterSpacing: -2, color: COL.ink, marginTop: 18, opacity: ip(f, [r + 4, r + 14], [0, 1])}}>Delivery app,</div>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 76, lineHeight: 1.08, letterSpacing: -2, color: COL.ink, opacity: ip(f, [r + 8, r + 18], [0, 1])}}>in 4 lines.</div>
      <div style={{marginTop: 110}}>
        {RECAP.map(([a, b], i) => {
          const p = ip(f, [r + 22 + i * 14, r + 34 + i * 14], [0, 1]);
          const col = RECAP_COL[i];
          const g = f >= r + 80 ? Math.max(0, 1 - Math.abs(((f - r - 80) / 22) % 4 - i)) : 0;
          return (
            <div key={i} style={{display: 'flex', gap: 28, alignItems: 'flex-start', marginBottom: 74, opacity: p, translate: `${(1 - p) * -30}px 0`}}>
              <div style={{width: 54, height: 54, borderRadius: 14, border: `3px solid ${col}`, background: `${col}${Math.round(g * 60).toString(16).padStart(2, '0')}`, boxShadow: `0 0 ${24 * g}px ${col}`, scale: String(1 + 0.08 * g), display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none'}}>
                <svg width={28} height={28} viewBox="0 0 24 24">
                  <path d="M4 12.5l5 5L20 6.5" fill="none" stroke={col} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 44, color: COL.ink, letterSpacing: -0.5}}>{a}</div>
                <div style={{fontFamily: MONO, fontSize: 27, color: COL.dim, marginTop: 6}}>{b}</div>
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
  const breathe = 1.0 + 0.01 * Math.sin((f / 90) * Math.PI);
  const diag = DIAGRAM_ON(f) ? ip(f, [S.idea - 8, S.idea + 4, S.hop1 - 4, S.hop1 + 8], [1, 0.08, 0.08, 1]) * ip(f, [S.payoff - 8, S.payoff + 4], [1, 0]) : 0;
  const rw = [H1.rewind, H2.rewind].reduce((m, at) => Math.max(m, f >= at && f < at + 12 ? 1 - (f - at) / 12 : 0), 0);
  return (
    <AbsoluteFill style={{background: COL.bg}}>
      <AbsoluteFill style={{backgroundImage: 'radial-gradient(rgba(140,160,190,0.08) 1.5px, transparent 1.5px)', backgroundSize: '36px 36px', backgroundPosition: `0 ${-f * 0.4}px`}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 60% at 50% 55%, rgba(57,208,255,0.05), rgba(0,0,0,0) 70%)'}} />
      <AbsoluteFill style={{scale: String(breathe), transformOrigin: '540px 980px'}}>
        <div style={{position: 'absolute', inset: 0, opacity: diag}}>
          {['phone', 'api', 'pay', 'kitchen', 'dispatch'].map((id) => (
            <Node key={id} f={f} id={id} />
          ))}
          <Queue f={f} />
          <Wires f={f} />
          <Bottom f={f} />
        </div>
        <HookMap f={f} />
        <Idea f={f} />
        <Code f={f} />
      </AbsoluteFill>
      {rw > 0 ? <AbsoluteFill style={{background: `rgba(169,139,255,${0.08 * rw})`}} /> : null}
      {COPY.map((c, i) => (
        <Headline key={i} f={f} c={c} />
      ))}
      <Recap f={f} />
      <Progress f={f} />
      {captions ? <Captions f={f} lines={CAPS} accent={COL.amber} /> : null}
    </AbsoluteFill>
  );
};
