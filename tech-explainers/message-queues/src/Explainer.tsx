import React from 'react';
import {AbsoluteFill, Easing, interpolate, random, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {A, COL, queueLen, S, SERIAL_TOTAL, STEPS, workerCount} from './sim';
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
  {at: S.hook, until: S.lead, kicker: 'MESSAGE QUEUES · EXPLAINED', head: ['POV: tickets drop', 'at 10am…'], kColor: COL.bad},
  {at: S.lead, until: S.chain, kicker: 'EXPERT IN UNDER 1 MINUTE', head: ['It’s not your Wi-Fi.', 'It’s a traffic jam.'], kColor: COL.amber},
  {at: S.chain, until: S.queue, kicker: '01 · ONE SLOW STEP', head: ['Everything at once,', 'so everyone waits.'], kColor: COL.bad},
  {at: S.queue, until: S.ack, kicker: '02 · THE QUEUE', head: ['Do it now,', 'or do it later.'], kColor: COL.ok},
  {at: S.ack, until: S.idem, kicker: '03 · ACKNOWLEDGE', head: ['Not deleted', 'until it’s done.'], kColor: COL.req},
  {at: S.idem, until: S.spike, kicker: '04 · IDEMPOTENCY', head: ['Run it twice,', 'same result.'], kColor: COL.violet},
  {at: S.spike, until: S.total, kicker: '05 · TICKET DAY', head: ['The queue grows.', 'Nothing breaks.'], kColor: COL.amber},
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
  const marks = [S.chain, S.queue, S.ack, S.idem, S.spike];
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

/* ───────── the shopper's phone ───────── */
const chainElapsed = (f: number) => {
  // the serial checkout's clock: runs through each step as the token reaches it, then crawls on issuing the ticket
  if (f < A.charge) return Math.max(0, ((f - S.chain) / (A.charge - S.chain)) * 0.05);
  let t = 0;
  for (let i = 0; i < STEPS.length; i++) {
    const s0 = STEPS[i].at;
    const s1 = STEPS[i + 1]?.at ?? A.slow + 40;
    if (f < s1) return t + STEPS[i].s * ip(f, [s0, s1], [0, 1], Easing.linear);
    t += STEPS[i].s;
  }
  return SERIAL_TOTAL;
};
const phonePose = (f: number) => {
  const K: [number, number, number, number][] = [
    [S.lead + 10, 540, 930, 1.05],
    [S.lead + 34, 200, 930, 0.62],
    [S.queue + 6, 200, 930, 0.62],
    [S.queue + 26, 175, 720, 0.5],
    [A.gone - 14, 175, 720, 0.5],
    [A.gone + 6, 540, 930, 1.05],
  ];
  if (f <= K[0][0]) return {x: K[0][1], y: K[0][2], s: K[0][3]};
  for (let i = 1; i < K.length; i++) {
    if (f <= K[i][0]) {
      const t = ip(f, [K[i - 1][0], K[i][0]], [0, 1], glide);
      return {x: lerp(K[i - 1][1], K[i][1], t), y: lerp(K[i - 1][2], K[i][2], t), s: lerp(K[i - 1][3], K[i][3], t)};
    }
  }
  return {x: K[K.length - 1][1], y: K[K.length - 1][2], s: K[K.length - 1][3]};
};
const Phone: React.FC<{f: number}> = ({f}) => {
  const {x, y, s} = phonePose(f);
  const confirmed = f >= A.confirmed;
  const W = 320;
  const H = 600;
  const spin = (f * 14) % 360;
  const waited = f < S.chain ? 2.1 + f / 30 : f < S.queue ? chainElapsed(f) : 0;
  const po = ip(f, [S.ack + 4, S.ack + 14, A.gone - 16, A.gone - 6], [1, 0, 0, 1]);
  if (po <= 0) return null;
  return (
    <div style={{position: 'absolute', opacity: po, left: x - W / 2, top: y - H / 2, width: W, height: H, scale: String(s), borderRadius: 46, background: '#121212', boxShadow: '0 30px 60px rgba(0,0,0,0.5), inset 0 0 0 3px #333'}}>
      <div style={{position: 'absolute', inset: 12, borderRadius: 36, background: '#0f1621', overflow: 'hidden', padding: '34px 22px'}}>
        <div style={{fontFamily: MONO, fontSize: 18, color: COL.dim}}>tickets.com/checkout</div>
        <div style={{marginTop: 26, display: 'flex', gap: 14, alignItems: 'center'}}>
          <div style={{width: 76, height: 76, borderRadius: 14, background: 'linear-gradient(135deg, #2b3b52, #1a2433)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <svg width={46} height={30} viewBox="0 0 46 30">
              <path d="M3 22 L16 8 L24 14 L34 12 L43 22 L43 26 L3 26 Z" fill="#8b98a9" />
            </svg>
          </div>
          <div>
            <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 24, color: COL.ink}}>Stadium tour</div>
            <div style={{fontFamily: MONO, fontSize: 20, color: COL.dim}}>Block A · seat 12</div>
          </div>
        </div>
        <div style={{marginTop: 18, display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontSize: 20, color: COL.dim}}>
          <span>total</span>
          <span style={{color: COL.ink}}>£89.00</span>
        </div>
        <div style={{marginTop: 26, height: 64, borderRadius: 16, background: confirmed ? '#1f3a2b' : COL.amber, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 26, color: confirmed ? COL.ok : '#1a1406', opacity: confirmed ? 1 : 0.75}}>
          {confirmed ? 'Paid ✓' : 'Pay £89.00'}
        </div>
        <div style={{marginTop: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14}}>
          {confirmed ? (
            <>
              <svg width={84} height={84} viewBox="0 0 24 24" style={{scale: String(ip(f - A.confirmed, [0, 6], [0.6, 1], Easing.bezier(0.2, 1.6, 0.4, 1)))}}>
                <circle cx={12} cy={12} r={10} fill="none" stroke={COL.ok} strokeWidth={1.8} />
                <path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke={COL.ok} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 28, color: COL.ok}}>Ticket confirmed</div>
              <div style={{fontFamily: MONO, fontSize: 20, color: COL.dim}}>in 0.3 s</div>
            </>
          ) : (
            <>
              <svg width={84} height={84} viewBox="0 0 24 24" style={{rotate: `${spin}deg`}}>
                <circle cx={12} cy={12} r={9} fill="none" stroke="#2b3b52" strokeWidth={2.4} />
                <path d="M12 3 a9 9 0 0 1 9 9" fill="none" stroke={COL.amber} strokeWidth={2.4} strokeLinecap="round" />
              </svg>
              <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 26, color: COL.dim}}>processing…</div>
              {waited > 0 ? <div style={{fontFamily: MONO, fontSize: 22, color: COL.bad}}>{waited.toFixed(1)} s</div> : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* ───────── lead: the checkout server drowning ───────── */
const Jam: React.FC<{f: number}> = ({f}) => {
  const o = ip(f, [S.lead + 20, S.lead + 34, S.chain - 8, S.chain], [0, 1, 1, 0]);
  if (o <= 0) return null;
  const box = {x: 720, y: 930, w: 340, h: 250};
  const dots: React.ReactNode[] = [];
  for (let i = 0; i < 70; i++) {
    const t0 = S.lead + 20 + i * 2.4;
    const k = (f - t0) / 22;
    if (k < 0) continue;
    const sy = 560 + random(`jy${i}`) * 760;
    const pile = Math.min(1, k);
    const tx = box.x - box.w / 2 - 14 - random(`jx${i}`) * 120 * Math.min(1, (f - S.lead - 20) / 120);
    const ty = box.y - box.h / 2 + random(`jt${i}`) * box.h;
    dots.push(<circle key={i} cx={lerp(380, tx, glide(pile))} cy={lerp(sy, ty, glide(pile))} r={7} fill={random(`jc${i}`) > 0.8 ? COL.bad : COL.req} opacity={0.85} />);
  }
  const shake = (random(`js${f}`) - 0.5) * 8;
  return (
    <AbsoluteFill style={{opacity: o}}>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        {dots}
        <g transform={`translate(${box.x - box.w / 2 + shake} ${box.y - box.h / 2})`}>
          <rect width={box.w} height={box.h} rx={20} fill="#1a0d10" stroke={COL.bad} strokeWidth={3.5} />
          <text x={24} y={50} fontFamily={MONO} fontWeight={600} fontSize={26} fill={COL.ink} letterSpacing={2}>
            CHECKOUT
          </text>
          <text x={24} y={104} fontFamily={MONO} fontSize={22} fill={COL.dim}>
            fans waiting
          </text>
          <text x={24} y={156} fontFamily={SANS} fontWeight={800} fontSize={52} fill={COL.bad}>
            {n(Math.min(48213, 900 + (f - S.lead) * 310))}
          </text>
          <rect x={24} y={186} width={box.w - 48} height={18} rx={9} fill={COL.bad} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/* ───────── chain: every step in a row ───────── */
const STEP_Y = [650, 800, 950, 1100];
const Chain: React.FC<{f: number}> = ({f}) => {
  const o = ip(f, [S.chain, S.chain + 12, S.queue + 20, S.queue + 34], [0, 1, 1, 0]);
  if (o <= 0) return null;
  const x0 = 470;
  const w = 430;
  const h = 112;
  const cur = STEPS.filter((s) => f >= s.at).length - 1;
  const wait = f >= A.couldWait - 2;
  const goneLater = f >= A.rest; // jobs flying into the queue
  return (
    <AbsoluteFill style={{opacity: o}}>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        {STEPS.map((s, i) => {
          const y = STEP_Y[i];
          const active = i === cur && f < S.queue;
          const slow = i === 3 && f >= A.slow && f < S.queue;
          const dim = wait && i > 0;
          const done = i < cur;
          const fly = i > 0 && goneLater ? ip(f, [A.rest + (i - 1) * 4, A.rest + 14 + (i - 1) * 4], [0, 1], glide) : 0;
          if (fly >= 1) return null;
          const prog = i === 3 ? ip(f, [s.at, A.slow + 40], [0, 0.6], Easing.linear) : 1;
          const card = i === 0 && f >= A.chargeNow;
          return (
            <g key={i} opacity={1 - fly} transform={`translate(${fly * -60} ${fly * 120})`}>
              {i > 0 ? <line x1={x0 + w / 2} y1={STEP_Y[i - 1] + h} x2={x0 + w / 2} y2={y} stroke="#2a3a50" strokeWidth={3} opacity={dim ? 0.4 : 1} /> : null}
              <rect x={x0} y={y} width={w} height={h} rx={18} fill={card ? '#10261a' : slow ? '#2a0f13' : '#0f1621'} stroke={card ? COL.ok : slow ? COL.bad : active ? COL.req : done ? '#3a5a48' : '#2c3c52'} strokeWidth={active || slow || card ? 3.5 : 2} strokeDasharray={dim && !card ? '8 8' : undefined} opacity={dim && !card ? 0.55 : 1} />
              <text x={x0 + 26} y={y + 48} fontFamily={MONO} fontWeight={600} fontSize={26} fill={COL.ink}>
                {s.name}
              </text>
              <text x={x0 + w - 26} y={y + 48} textAnchor="end" fontFamily={MONO} fontSize={24} fill={i === 3 ? COL.bad : COL.dim}>
                {s.s.toFixed(1)} s
              </text>
              {i === 3 && f >= s.at ? (
                <g>
                  <rect x={x0 + 26} y={y + 70} width={w - 52} height={14} rx={7} fill="#152132" />
                  <rect x={x0 + 26} y={y + 70} width={(w - 52) * prog} height={14} rx={7} fill={COL.bad} />
                </g>
              ) : null}
              {done && f < S.queue ? (
                <path d={`M ${x0 + w - 70} ${y + 78} l 8 8 l 16 -16`} fill="none" stroke={COL.ok} strokeWidth={4} strokeLinecap="round" />
              ) : null}
              {dim && !card && f < S.queue ? (
                <text x={x0 + 26} y={y + 92} fontFamily={MONO} fontSize={20} fill={COL.amber}>
                  could wait?
                </text>
              ) : null}
            </g>
          );
        })}
        {/* the order token travelling down the chain */}
        {cur >= 0 && f < A.couldWait ? (
          (() => {
            const i = Math.max(0, cur);
            const y0 = i === 0 ? STEP_Y[0] + h / 2 : STEP_Y[i - 1] + h / 2;
            const t = ip(f, [STEPS[i].at, STEPS[i].at + 8], [0, 1], glide);
            const y = lerp(y0, STEP_Y[i] + h / 2, i === 0 ? 1 : t);
            return (
              <g>
                <circle cx={x0 - 28} cy={y} r={18} fill={COL.req} opacity={0.18} />
                <circle cx={x0 - 28} cy={y} r={10} fill={COL.req} />
              </g>
            );
          })()
        ) : null}
      </svg>
    </AbsoluteFill>
  );
};

/* ───────── the queue, its workers, and what happens when one crashes ───────── */
const LANE = {x: 300, y: 900, w: 620, h: 120};
const WORKER_Y = 1180;
const WX = [420, 610, 800];
type Job = {name: string};
const JOBS: Job[] = [{name: 'add to wallet'}, {name: 'update seats'}, {name: 'issue ticket'}];
const slotX = (i: number) => LANE.x + 20 + i * 196;

const Worker: React.FC<{x: number; y: number; label: string; state: 'idle' | 'busy' | 'done' | 'crashed'; f: number; hi?: boolean}> = ({x, y, label, state, f, hi}) => {
  const col = state === 'crashed' ? COL.bad : state === 'done' ? COL.ok : state === 'busy' ? COL.req : '#4a5d78';
  const rot = state === 'busy' ? (f * 8) % 360 : 0;
  return (
    <g>
      {hi ? <circle cx={x} cy={y} r={62} fill="none" stroke={COL.amber} strokeWidth={3} strokeDasharray="6 8" /> : null}
      <circle cx={x} cy={y} r={44} fill="#0f1621" stroke={col} strokeWidth={3.5} />
      {state === 'crashed' ? (
        <path d={`M ${x - 16} ${y - 16} L ${x + 16} ${y + 16} M ${x + 16} ${y - 16} L ${x - 16} ${y + 16}`} stroke={COL.bad} strokeWidth={6} strokeLinecap="round" />
      ) : state === 'done' ? (
        <path d={`M ${x - 15} ${y + 1} l 10 10 l 20 -22`} fill="none" stroke={COL.ok} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <g transform={`rotate(${rot} ${x} ${y})`}>
          {Array.from({length: 6}).map((_, k) => {
            const a = (k / 6) * Math.PI * 2;
            return <line key={k} x1={x + Math.cos(a) * 10} y1={y + Math.sin(a) * 10} x2={x + Math.cos(a) * 20} y2={y + Math.sin(a) * 20} stroke={col} strokeWidth={5} strokeLinecap="round" />;
          })}
        </g>
      )}
      <text x={x} y={y + 74} textAnchor="middle" fontFamily={MONO} fontSize={20} fill={col}>
        {label}
      </text>
    </g>
  );
};

const JobCard: React.FC<{x: number; y: number; name: string; ghost?: boolean; color?: string}> = ({x, y, name, ghost, color = COL.amber}) => (
  <g opacity={ghost ? 0.35 : 1}>
    <rect x={x} y={y} width={176} height={80} rx={12} fill="#1a1406" stroke={color} strokeWidth={2.5} strokeDasharray={ghost ? '6 6' : undefined} />
    <text x={x + 14} y={y + 34} fontFamily={MONO} fontSize={18} fill={color}>
      message
    </text>
    <text x={x + 14} y={y + 60} fontFamily={MONO} fontWeight={600} fontSize={19} fill={COL.ink}>
      {name}
    </text>
  </g>
);

const Queue: React.FC<{f: number}> = ({f}) => {
  const o = ip(f, [A.rest - 4, A.rest + 8], [0, 1]) * (f < S.loop3 ? 1 : f < S.spike ? ip(f, [S.loop3, S.loop3 + 10], [1, 0]) : ip(f, [S.spike, S.spike + 10, A.gone - 14, A.gone], [0, 1, 1, 0]));
  if (o <= 0) return null;
  const out: React.ReactNode[] = [];
  // the lane
  const spike = f >= S.spike;
  const qn = queueLen(f);
  out.push(
    <g key="lane">
      <rect x={LANE.x} y={LANE.y} width={LANE.w} height={LANE.h} rx={18} fill="#0e1520" stroke={COL.amber} strokeWidth={3} />
      <text x={LANE.x} y={LANE.y - 16} fontFamily={MONO} fontWeight={600} fontSize={22} fill={COL.amber} letterSpacing={2}>
        QUEUE{spike ? ` · ${n(qn)} waiting` : ''}
      </text>
    </g>,
  );
  // the charge step stays synchronous (top right)
  if (f < S.ack) {
    const g = ip(f, [A.chargeNow, A.chargeNow + 6], [0, 1]);
    out.push(
      <g key="charge" opacity={ip(f, [S.queue + 20, S.queue + 34], [0, 1])}>
        <rect x={470} y={650} width={430} height={112} rx={18} fill="#10261a" stroke={COL.ok} strokeWidth={3.5} />
        <text x={496} y={698} fontFamily={MONO} fontWeight={600} fontSize={26} fill={COL.ink}>
          charge card
        </text>
        <text x={874} y={698} textAnchor="end" fontFamily={MONO} fontSize={24} fill={COL.ok}>
          now ✓
        </text>
        <text x={496} y={738} fontFamily={MONO} fontSize={20} fill={COL.dim} opacity={g}>
          the only step you wait for
        </text>
      </g>,
    );
  }
  // job lifecycles (frame windows): in queue → taken (ghost stays) → acked (gone)
  const W = {
    receipt: {inQ: A.rest, take: A.workers, worker: 0, done: A.workers + 40, crash: Infinity},
    stock: {inQ: A.rest + 4, take: A.workers + 14, worker: 2, done: A.done, crash: Infinity},
    warehouse: {inQ: A.rest + 8, take: A.crashQ, worker: 1, done: Infinity, crash: A.crash},
  };
  const retake = A.another; // the issue-ticket message goes to worker 1 after the crash
  const finalDone = A.nothing;
  if (!spike) {
    JOBS.forEach((j, i) => {
      const key = i === 0 ? 'receipt' : i === 1 ? 'stock' : 'warehouse';
      const w = W[key as keyof typeof W];
      if (f < w.inQ) return;
      const fly = ip(f, [w.inQ, w.inQ + 14], [0, 1], glide);
      const sx = lerp(520, slotX(i), fly);
      const sy = lerp(STEP_Y[i + 1], LANE.y + 20, fly);
      let ghost = false;
      let gone = false;
      if (key === 'warehouse') {
        if (f >= w.take && f < w.crash) ghost = true;
        if (f >= A.comesBack && f < retake) ghost = false;
        if (f >= retake && f < finalDone) ghost = true;
        if (f >= finalDone + 6) gone = true;
      } else {
        if (f >= w.take) ghost = true;
        if (f >= w.done + 6) gone = true;
      }
      if (gone) return;
      const back = key === 'warehouse' && f >= A.comesBack && f < A.comesBack + 10 ? ip(f, [A.comesBack, A.comesBack + 6, A.comesBack + 10], [0, 1, 0]) : 0;
      out.push(
        <g key={key}>
          <JobCard x={sx} y={sy} name={j.name} ghost={ghost} color={back > 0 ? COL.ok : COL.amber} />
          {ghost && f >= w.take ? (
            <text x={sx + 88} y={sy + 104} textAnchor="middle" fontFamily={MONO} fontSize={17} fill={COL.dim}>
              in progress…
            </text>
          ) : null}
        </g>,
      );
    });
  } else {
    // ticket day: the lane overflows, then drains as workers are added
    const shown = Math.min(30, Math.ceil(qn / 160));
    for (let k = 0; k < shown; k++) {
      const col = k % 3;
      const row = Math.floor(k / 3);
      out.push(<rect key={`q${k}`} x={LANE.x + 20 + (k % 10) * 58} y={LANE.y + 16 + (Math.floor(k / 10) % 3) * 30} width={50} height={24} rx={5} fill="#2a2210" stroke={COL.amber} strokeWidth={1.5} opacity={0.6 + 0.4 * ((col + row) % 2)} />);
    }
  }
  // workers
  const wc = spike ? workerCount(f) : 3;
  if (!spike) {
    const st = (i: number): 'idle' | 'busy' | 'done' | 'crashed' => {
      if (i === 0) {
        if (f >= finalDone) return 'done';
        if (f >= retake) return 'busy';
        if (f >= W.receipt.done && f < W.receipt.done + 18) return 'done';
        if (f >= W.receipt.take && f < W.receipt.done) return 'busy';
        return 'idle';
      }
      if (i === 1) {
        if (f >= A.crash) return 'crashed';
        if (f >= W.warehouse.take) return 'busy';
        return 'idle';
      }
      if (f >= W.stock.done && f < W.stock.done + 30) return 'done';
      if (f >= W.stock.take && f < W.stock.done) return 'busy';
      return 'idle';
    };
    WX.forEach((x, i) => out.push(<Worker key={`w${i}`} x={x} y={WORKER_Y} label={`worker ${i + 1}`} state={st(i)} f={f} hi={i === 1 && f >= A.crashQ - 4 && f < A.crash} />));
    if (f >= A.done && f < A.done + 30) out.push(<text key="ack" x={WX[2]} y={WORKER_Y - 64} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={22} fill={COL.ok}>“done” → deleted</text>);
    if (f >= A.crash && f < A.crash + 20) {
      const k = (f - A.crash) / 20;
      for (let p = 0; p < 10; p++) {
        const a = (p / 10) * Math.PI * 2;
        out.push(<circle key={`b${p}`} cx={WX[1] + Math.cos(a) * (40 + k * 70)} cy={WORKER_Y + Math.sin(a) * (40 + k * 70)} r={6 * (1 - k)} fill={COL.bad} />);
      }
    }
    if (f >= finalDone && f < S.loop3 + 10) out.push(<text key="nl" x={WX[0]} y={WORKER_Y - 64} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={22} fill={COL.ok}>nothing lost ✓</text>);
  } else {
    for (let i = 0; i < wc; i++) {
      const x = 170 + i * 92;
      const busy = queueLen(f) > 0;
      out.push(
        <g key={`sw${i}`} opacity={ip(f, [A.addWorkers + (i - 3) * 3, A.addWorkers + (i - 3) * 3 + 6], [i < 3 ? 1 : 0, 1])}>
          <circle cx={x} cy={WORKER_Y} r={34} fill="#0f1621" stroke={busy ? COL.req : COL.ok} strokeWidth={3} />
          <g transform={`rotate(${busy ? (f * 9) % 360 : 0} ${x} ${WORKER_Y})`}>
            {Array.from({length: 6}).map((_, k) => {
              const a = (k / 6) * Math.PI * 2;
              return <line key={k} x1={x + Math.cos(a) * 8} y1={WORKER_Y + Math.sin(a) * 8} x2={x + Math.cos(a) * 16} y2={WORKER_Y + Math.sin(a) * 16} stroke={busy ? COL.req : COL.ok} strokeWidth={4} strokeLinecap="round" />;
            })}
          </g>
        </g>,
      );
    }
    out.push(
      <text key="wl" x={170} y={WORKER_Y + 70} fontFamily={MONO} fontSize={22} fill={COL.dim}>
        workers: {wc}
      </text>,
    );
  }
  return (
    <AbsoluteFill style={{opacity: o}}>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        {out}
      </svg>
    </AbsoluteFill>
  );
};

/* ───────── the duplicate shipment, then the idempotent fix ───────── */
const Parcels: React.FC<{f: number}> = ({f}) => {
  const o = ip(f, [A.twice - 6, A.twice + 4, S.spike - 8, S.spike], [0, 1, 1, 0]);
  if (o <= 0) return null;
  const second = ip(f, [A.issueTwice - 4, A.issueTwice + 4], [0, 1]);
  const fixd = ip(f, [A.changes - 4, A.changes + 6], [0, 1]);
  const parcel = (x: number, y: number, col: string, op: number, key: string) => (
    <g key={key} opacity={op} transform={`translate(${x} ${y})`}>
      <path d="M -56 -32 h 112 v 22 a 10 10 0 0 0 0 20 v 22 h -112 v -22 a 10 10 0 0 0 0 -20 z" fill="#1a1406" stroke={col} strokeWidth={3} />
      <line x1={22} y1={-30} x2={22} y2={30} stroke={col} strokeWidth={2} strokeDasharray="4 4" />
      <text x={-40} y={8} fontFamily={MONO} fontWeight={600} fontSize={20} fill={col}>
        A12
      </text>
    </g>
  );
  const dup = second * (1 - fixd);
  return (
    <AbsoluteFill style={{opacity: o}}>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <text x={70} y={680} fontFamily={MONO} fontWeight={600} fontSize={24} fill={COL.dim} letterSpacing={2}>
          TICKETS · Block A, seat 12
        </text>
        {parcel(180, 780, fixd > 0.5 ? COL.ok : COL.amber, 1, 'p1')}
        {parcel(320, 780, COL.bad, dup, 'p2')}
        <text x={390} y={796} fontFamily={SANS} fontWeight={800} fontSize={52} fill={COL.bad} opacity={dup}>
          ×2 issued
        </text>
        <text x={260} y={796} fontFamily={SANS} fontWeight={800} fontSize={52} fill={COL.ok} opacity={fixd}>
          ×1 ✓
        </text>
      </svg>
      {/* the idempotent worker's check */}
      <div style={{position: 'absolute', left: 70, top: 960, right: 150, opacity: ip(f, [A.idem - 6, A.idem + 6], [0, 1]), fontFamily: MONO, fontSize: 24, lineHeight: 1.6, padding: '16px 22px', borderRadius: 14, background: '#121a26', border: `2px solid ${COL.violet}`}}>
        <div style={{color: COL.violet}}>if already_issued(seat A12):</div>
        <div style={{color: COL.dim}}>{'    '}skip  # running twice changes nothing</div>
      </div>
      <div style={{position: 'absolute', right: 160, top: 660, opacity: ip(f, [A.soon - 4, A.soon + 6], [0, 1]), padding: '10px 18px', borderRadius: 999, border: `2px dashed ${COL.violet}`, fontFamily: MONO, fontSize: 20, color: COL.violet}}>
        EP 12 · idempotency · soon
      </div>
    </AbsoluteFill>
  );
};

/* checkout status on ticket day */
const SpikeStatus: React.FC<{f: number}> = ({f}) => {
  const o = ip(f, [S.spike, S.spike + 10, A.gone - 14, A.gone], [0, 1, 1, 0]);
  if (o <= 0) return null;
  const ok = queueLen(f) === 0 && f > A.addWorkers;
  return (
    <div style={{position: 'absolute', left: 470, top: 650, width: 430, height: 112, opacity: o, borderRadius: 18, background: ok ? '#10261a' : '#1a1406', border: `3px solid ${ok ? COL.ok : COL.amber}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 26px', fontFamily: MONO, fontWeight: 600, fontSize: 26, color: COL.ink}}>
      <span>checkout</span>
      <span style={{color: ok ? COL.ok : COL.amber}}>{ok ? 'caught up ✓' : 'taking orders'}</span>
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
  const breathe = 1.0 + 0.012 * Math.sin((f / 90) * Math.PI);
  const shoppers = Math.round(31480 + f * 137);
  return (
    <AbsoluteFill style={{background: COL.bg}}>
      <AbsoluteFill style={{backgroundImage: 'radial-gradient(rgba(140,160,190,0.08) 1.5px, transparent 1.5px)', backgroundSize: '36px 36px', backgroundPosition: `0 ${-f * 0.4}px`}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(255,176,32,0.05), rgba(0,0,0,0) 70%)'}} />
      <AbsoluteFill style={{scale: String(breathe), transformOrigin: '540px 930px'}}>
        <Jam f={f} />
        <Chain f={f} />
        <Queue f={f} />
        <Parcels f={f} />
        <SpikeStatus f={f} />
        <Phone f={f} />
        {f < S.lead + 20 ? (
          <div style={{position: 'absolute', left: 0, right: 0, top: 1262, textAlign: 'center', fontFamily: MONO, fontSize: 26, color: COL.dim, opacity: ip(f, [S.lead + 6, S.lead + 20], [1, 0])}}>
            you + <span style={{color: COL.bad}}>{n(shoppers)}</span> other fans
          </div>
        ) : null}
      </AbsoluteFill>
      {COPY.map((c, i) => (
        <Headline key={i} f={f} c={c} />
      ))}
      <Progress f={f} />
      <Captions f={f} lines={CAPS} accent={COL.amber} />
    </AbsoluteFill>
  );
};
