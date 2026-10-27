import React from 'react';
import {AbsoluteFill, Easing, interpolate, random, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {A, COL, Ev, KEY, LEG, ledgerAt, phoneAt, PRICE, RUN, S, short, tableAt, TAPS, WORLDS, worldAt} from './sim';
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
  {at: S.hook, until: S.lead, kicker: 'IDEMPOTENCY · EXPLAINED', head: ['What actually happens', 'when you tap Pay twice.'], kColor: COL.amber},
  {at: S.lead, until: S.naive, kicker: 'EXPERT IN UNDER 1 MINUTE', head: ['It went through.', 'The reply got lost.'], kColor: COL.req},
  {at: S.naive, until: S.key, kicker: '01 · NO PROTECTION', head: ['Two taps,', 'two charges.'], kColor: COL.bad},
  {at: S.key, until: S.replay, kicker: '02 · IDEMPOTENCY KEY', head: ['One key', 'per checkout.'], kColor: COL.violet},
  {at: S.replay, until: S.stripe, kicker: '03 · REPLAY, DON’T REDO', head: ['Same key?', 'Same answer.'], kColor: COL.ok},
  {at: S.stripe, until: S.race, kicker: '04 · IN THE WILD', head: ['Stripe does', 'exactly this.'], kColor: COL.violet},
  {at: S.race, until: S.client, kicker: '05 · BOTH AT ONCE', head: ['Lock the key.', 'Only one wins.'], kColor: COL.amber},
  {at: S.client, until: S.payoff, kicker: '06 · WHO MAKES THE KEY', head: ['The app.', 'Never the server.'], kColor: COL.pink},
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
  const marks = [S.naive, S.key, S.replay, S.stripe, S.race, S.client, S.payoff];
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

// a quick "rewind" flash when the account resets for the next demonstration
const worldFade = (f: number) => {
  const w = WORLDS[worldAt(f)];
  if (!w) return 0;
  const inn = Number.isFinite(w.from) ? ip(f, [w.from, w.from + 10], [0, 1]) : 1;
  const out = ip(f, [w.to - 8, w.to], [1, 0]);
  return Math.min(inn, out);
};

/* ───────── layout ───────── */
const PH = {x: 225, y: 1010, s: 0.95, w: 320, h: 600};
const SRV = {x: 530, y: 560, w: 380, h: 126};
const KEYS = {x: 530, y: 716, w: 380, h: 250};
const LED = {x: 530, y: 996, w: 380, h: 330};
const REQ_A = {x: 384, y: 850}; // phone edge (out)
const REQ_B = {x: SRV.x, y: SRV.y + 38}; // server edge (in)
const RES_A = {x: SRV.x, y: SRV.y + 100};
const RES_B = {x: 384, y: 905};
const panel: React.CSSProperties = {position: 'absolute', borderRadius: 20, background: '#0d131c', border: '2px solid #223044', overflow: 'hidden'};

/* ───────── the phone ───────── */
const Phone: React.FC<{f: number}> = ({f}) => {
  const wi = worldAt(f);
  const w = WORLDS[wi];
  const st = phoneAt(f);
  const fade = worldFade(f);
  const o = ip(f, [S.payoff - 4, S.payoff + 8], [1, 0]);
  if (o <= 0) return null;
  const spin = (f * 14) % 360;
  const showKey = w && w.keys && (wi > 2 || f >= A.unique - 2);
  const keyO = showKey ? (wi === 2 ? ip(f, [A.unique - 2, A.unique + 8], [0, 1]) : 1) : 0;
  const keyStruck = wi === 4 && f >= A.letServer - 2;
  const keyGlow = wi === 4 && f >= A.app - 10 && f < A.letServer - 2 ? 0.5 + 0.5 * Math.sin((f - A.app) / 4) : 0;
  return (
    <div style={{position: 'absolute', opacity: o, left: PH.x - PH.w / 2, top: PH.y - PH.h / 2, width: PH.w, height: PH.h, scale: String(PH.s), borderRadius: 46, background: '#121212', boxShadow: '0 30px 60px rgba(0,0,0,0.5), inset 0 0 0 3px #333'}}>
      <div style={{position: 'absolute', inset: 12, borderRadius: 36, background: '#0f1621', overflow: 'hidden', padding: '34px 22px', opacity: 0.35 + 0.65 * fade}}>
        <div style={{fontFamily: MONO, fontSize: 18, color: COL.dim}}>food.app/checkout</div>
        <div style={{marginTop: 26, fontFamily: SANS, fontWeight: 700, fontSize: 28, color: COL.ink}}>Dinner order</div>
        <div style={{marginTop: 6, fontFamily: MONO, fontSize: 19, color: COL.dim}}>2 items · delivery</div>
        <div style={{marginTop: 22, display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontSize: 22, color: COL.dim}}>
          <span>total</span>
          <span style={{color: COL.ink}}>£{PRICE}.00</span>
        </div>
        <div style={{position: 'relative', marginTop: 24, height: 66, borderRadius: 16, background: st.state === 'paid' ? '#1f3a2b' : COL.amber, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 27, color: st.state === 'paid' ? COL.ok : '#1a1406', opacity: st.state === 'processing' ? 0.7 : 1}}>
          {st.state === 'paid' ? 'Paid ✓' : `Pay £${PRICE}.00`}
          {/* tap ripples */}
          {TAPS.filter((t) => t.world === wi && f >= t.at && f < t.at + 18).map((t) => {
            const k = (f - t.at) / 18;
            return <div key={t.at} style={{position: 'absolute', left: '50%', top: '50%', width: 40 + k * 120, height: 40 + k * 120, marginLeft: -(20 + k * 60), marginTop: -(20 + k * 60), borderRadius: 999, border: `4px solid ${COL.ink}`, opacity: 1 - k}} />;
          })}
        </div>
        <div style={{marginTop: 14, height: 44, opacity: keyO}}>
          <div style={{display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 999, border: `2px solid ${keyStruck ? COL.dim : COL.violet}`, background: keyGlow > 0 ? `rgba(169,139,255,${0.12 + 0.2 * keyGlow})` : '#151026', fontFamily: MONO, fontSize: 19, color: keyStruck ? COL.dim : COL.violet, textDecoration: keyStruck ? 'line-through' : undefined}}>
            🔑 {short(KEY)}
          </div>
        </div>
        <div style={{marginTop: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12}}>
          {st.state === 'paid' ? (
            <svg width={80} height={80} viewBox="0 0 24 24" style={{scale: String(ip(f - st.since, [0, 6], [0.6, 1], pop))}}>
              <circle cx={12} cy={12} r={10} fill="none" stroke={COL.ok} strokeWidth={1.8} />
              <path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke={COL.ok} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : st.state === 'processing' ? (
            <>
              <svg width={80} height={80} viewBox="0 0 24 24" style={{rotate: `${spin}deg`}}>
                <circle cx={12} cy={12} r={9} fill="none" stroke="#2b3b52" strokeWidth={2.4} />
                <path d="M12 3 a9 9 0 0 1 9 9" fill="none" stroke={COL.amber} strokeWidth={2.4} strokeLinecap="round" />
              </svg>
              <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 24, color: COL.dim}}>processing…</div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

/* ───────── the server, its key table, and the card's charges ───────── */
const serverNote = (f: number) => {
  const wi = worldAt(f);
  if (wi < 0) return null;
  const evs = RUN[wi].evs;
  for (const e of [...evs].reverse()) {
    if (f >= e.arrive && f < e.respLeave + 4) {
      if (e.outcome === 'replayed') return {t: f < A.skips - 2 && wi === 2 ? 'key found…' : 'key found → replay ✓', c: COL.ok};
      if (e.outcome === 'conflict') return {t: 'key locked → 409', c: COL.amber};
      if (wi === 4) return {t: 'new key → charge again', c: COL.bad};
      if (!e.key) return {t: f < e.charged ? 'new payment → charging…' : 'charged ✓', c: f < e.charged ? COL.amber : COL.ink};
      return {t: f < e.charged ? 'lock key → charging…' : 'charged ✓ · result saved', c: f < e.charged ? COL.amber : COL.ok};
    }
  }
  return null;
};
const Server: React.FC<{f: number}> = ({f}) => {
  const o = ip(f, [S.payoff - 4, S.payoff + 8], [1, 0]);
  if (o <= 0) return null;
  const note = serverNote(f);
  return (
    <div style={{...panel, left: SRV.x, top: SRV.y, width: SRV.w, height: SRV.h, opacity: o, border: `2px solid ${note ? note.c : '#2c3c52'}`}}>
      <div style={{padding: '16px 20px'}}>
        <div style={{fontFamily: MONO, fontWeight: 600, fontSize: 24, letterSpacing: 2, color: COL.dim}}>PAYMENTS API</div>
        <div style={{marginTop: 14, fontFamily: MONO, fontWeight: 600, fontSize: 24, color: note?.c ?? COL.dim}}>{note ? note.t : 'waiting…'}</div>
      </div>
    </div>
  );
};
const Keys: React.FC<{f: number}> = ({f}) => {
  const wi = worldAt(f);
  const w = WORLDS[wi];
  const o = ip(f, [S.payoff - 4, S.payoff + 8], [1, 0]) * (wi === 2 ? ip(f, [A.idem - 6, A.idem + 4], [0.35, 1]) : wi > 2 ? 1 : 0.35);
  if (o <= 0) return null;
  const rows = tableAt(f);
  const fade = worldFade(f);
  const lookups = wi >= 0 ? RUN[wi].evs.filter((e) => e.outcome !== 'charged' && f >= e.arrive && f < e.arrive + 26) : [];
  const saveHi = wi === 2 && f >= A.saves - 4 && f < A.sameKey ? 0.5 + 0.5 * Math.sin((f - A.saves) / 4) : 0;
  return (
    <div style={{...panel, left: KEYS.x, top: KEYS.y, width: KEYS.w, height: KEYS.h, opacity: o}}>
      <div style={{padding: '14px 20px', borderBottom: '2px solid #1c2838', fontFamily: MONO, fontWeight: 600, fontSize: 22, letterSpacing: 2, color: COL.violet}}>IDEMPOTENCY KEYS</div>
      <div style={{padding: '10px 20px', opacity: fade}}>
        {!w?.keys ? <div style={{fontFamily: MONO, fontSize: 22, color: COL.dim, marginTop: 8}}>none: every request is new</div> : null}
        {rows.map((r) => {
          const done = f >= r.doneAt;
          const hi = lookups.some((e) => e.key === r.key) ? 1 : saveHi;
          const p = ip(f, [r.from, r.from + 8], [0, 1], pop);
          return (
            <div key={r.key} style={{marginTop: 8, padding: '8px 12px', borderRadius: 12, background: hi ? `rgba(61,220,132,${0.08 + 0.14 * hi})` : '#121a26', border: `2px solid ${done ? COL.ok : COL.amber}`, scale: String(0.8 + 0.2 * p), opacity: p}}>
              <div style={{fontFamily: MONO, fontWeight: 600, fontSize: 22, color: COL.violet}}>🔑 {r.key.length > 12 ? short(r.key) : r.key}</div>
              <div style={{fontFamily: MONO, fontSize: 20, color: done ? COL.ok : COL.amber, marginTop: 2}}>{done ? `✓ ${r.chargeId} · 200 saved` : '🔒 in progress'}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
const Ledger: React.FC<{f: number}> = ({f}) => {
  const o = ip(f, [S.payoff - 4, S.payoff + 8], [1, 0]);
  if (o <= 0) return null;
  const rows = ledgerAt(f);
  const fade = worldFade(f);
  const twice = rows.length > 1;
  return (
    <div style={{...panel, left: LED.x, top: LED.y, width: LED.w, height: LED.h, opacity: o, border: `2px solid ${twice ? COL.bad : '#223044'}`}}>
      <div style={{padding: '14px 20px', borderBottom: '2px solid #1c2838', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
        <span style={{fontFamily: MONO, fontWeight: 600, fontSize: 22, letterSpacing: 2, color: COL.dim}}>YOUR CARD</span>
        <span style={{fontFamily: MONO, fontWeight: 600, fontSize: 21, color: twice ? COL.bad : COL.ink, opacity: fade}}>
          <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 34}}>£{rows.length * PRICE}</span> taken
        </span>
      </div>
      <div style={{padding: '10px 20px', opacity: fade}}>
        {rows.map((c, i) => {
          const p = ip(f, [c.at, c.at + 8], [0, 1], pop);
          return (
            <div key={c.id} style={{marginTop: 10, display: 'flex', justifyContent: 'space-between', whiteSpace: 'nowrap', padding: '10px 14px', borderRadius: 12, background: i > 0 ? '#2a0f13' : '#121a26', border: `2px solid ${i > 0 ? COL.bad : '#2c3c52'}`, scale: String(0.8 + 0.2 * p), opacity: p}}>
              <span style={{fontFamily: MONO, fontSize: 22, color: COL.dim}}>{c.id} food.app</span>
              <span style={{fontFamily: MONO, fontWeight: 600, fontSize: 24, color: i > 0 ? COL.bad : COL.ink}}>−£{PRICE}.00</span>
            </div>
          );
        })}
        {twice ? (
          <div style={{marginTop: 18, textAlign: 'center', whiteSpace: 'nowrap', fontFamily: SANS, fontWeight: 800, fontSize: 38, color: COL.bad, scale: String(ip(f, [rows[1].at, rows[1].at + 8], [1.4, 1], pop))}}>CHARGED TWICE</div>
        ) : rows.length === 1 && (worldAt(f) === 2 || worldAt(f) === 3) ? (
          <div style={{marginTop: 18, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 36, color: COL.ok, opacity: ip(f, [rows[0].at + 10, rows[0].at + 20], [0, 1])}}>charged once ✓</div>
        ) : null}
      </div>
    </div>
  );
};

/* ───────── requests and responses on the wire ───────── */
const Pill: React.FC<{x: number; y: number; text: string; col: string; keyTxt?: string}> = ({x, y, text, col, keyTxt}) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r={16} fill={col} opacity={0.18} />
    <circle r={8} fill={col} />
    <g transform="translate(16 -42)">
      <rect width={text.length * 13.6 + 22 + (keyTxt ? keyTxt.length * 13.6 + 34 : 0)} height={36} rx={10} fill="#0f1621" stroke={col} strokeWidth={2.5} />
      <text x={11} y={25} fontFamily={MONO} fontWeight={600} fontSize={22} fill={col}>
        {text}
        {keyTxt ? <tspan fill={COL.violet}>{'  🔑' + keyTxt}</tspan> : null}
      </text>
    </g>
  </g>
);
const Wire: React.FC<{f: number}> = ({f}) => {
  const o = ip(f, [S.payoff - 4, S.payoff + 8], [1, 0]);
  if (o <= 0) return null;
  const wi = worldAt(f);
  const out: React.ReactNode[] = [];
  if (wi >= 0)
    RUN[wi].evs.forEach((e: Ev) => {
      // request: phone → server
      if (f >= e.tap + 2 && f < e.arrive + 6) {
        const t = ip(f, [e.tap + 2, e.arrive], [0, 1], glide);
        if (f < e.arrive) out.push(<Pill key={`q${e.i}`} x={lerp(REQ_A.x, REQ_B.x, t)} y={lerp(REQ_A.y, REQ_B.y, t)} text="POST" col={COL.req} keyTxt={e.key && e.key === KEY ? short(KEY).slice(0, 4) : undefined} />);
        else out.push(<circle key={`qa${e.i}`} cx={REQ_B.x} cy={REQ_B.y} r={10 + (f - e.arrive) * 3} fill="none" stroke={COL.req} strokeWidth={3} opacity={1 - (f - e.arrive) / 6} />);
      }
      // response: server → phone (or lost on the way)
      const mid = e.respLeave + LEG / 2;
      const end = e.lost ? mid : e.respArrive;
      if (f >= e.respLeave && f < end) {
        const t = ip(f, [e.respLeave, e.respArrive], [0, 1], glide);
        const txt = e.status === 409 ? '409' : e.outcome === 'replayed' ? '200 replay' : '200 OK';
        const col = e.status === 409 ? COL.amber : COL.ok;
        out.push(<Pill key={`r${e.i}`} x={lerp(RES_A.x, RES_B.x, t)} y={lerp(RES_A.y, RES_B.y, t)} text={txt} col={col} />);
      }
      if (e.lost && f >= mid && f < mid + 40) {
        const k = (f - mid) / 40;
        const x = lerp(RES_A.x, RES_B.x, 0.5);
        const y = lerp(RES_A.y, RES_B.y, 0.5);
        out.push(
          <g key={`x${e.i}`} opacity={k < 0.8 ? 1 : (1 - k) * 5}>
            {k < 0.3
              ? Array.from({length: 8}).map((_, p) => {
                  const a = (p / 8) * Math.PI * 2;
                  return <circle key={p} cx={x + Math.cos(a) * (14 + k * 160)} cy={y + Math.sin(a) * (14 + k * 160)} r={5 * (1 - k / 0.3)} fill={COL.bad} />;
                })
              : null}
            <path d={`M ${x - 14} ${y - 14} L ${x + 14} ${y + 14} M ${x + 14} ${y - 14} L ${x - 14} ${y + 14}`} stroke={COL.bad} strokeWidth={6} strokeLinecap="round" />
            <text x={x} y={y + 50} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={25} fill={COL.bad}>
              reply lost
            </text>
          </g>,
        );
      }
    });
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', opacity: o}}>
      <line x1={REQ_A.x} y1={REQ_A.y} x2={REQ_B.x} y2={REQ_B.y} stroke="#1e2b3d" strokeWidth={3} strokeDasharray="6 9" />
      <line x1={RES_A.x} y1={RES_A.y} x2={RES_B.x} y2={RES_B.y} stroke="#1e2b3d" strokeWidth={3} strokeDasharray="6 9" />
      {out}
    </svg>
  );
};

/* the Stripe request, as it really looks */
const StripeCard: React.FC<{f: number}> = ({f}) => {
  const o = ip(f, [A.stripe - 6, A.stripe + 6, S.race - 6, S.race + 4], [0, 1, 1, 0]);
  if (o <= 0) return null;
  const second = ip(f, [A.sameResp - 4, A.sameResp + 6], [0, 1]);
  return (
    <div style={{...panel, left: 70, top: 1356, width: 860, height: 190, opacity: o, background: '#080c12', padding: '16px 24px'}}>
      <div style={{fontFamily: MONO, fontSize: 23, lineHeight: '38px', color: COL.ink, whiteSpace: 'pre'}}>
        <span style={{color: COL.req}}>POST</span> https://api.stripe.com/v1/payment_intents
      </div>
      <div style={{fontFamily: MONO, fontSize: 23, lineHeight: '38px', color: COL.violet, whiteSpace: 'pre', background: `rgba(169,139,255,${0.08 + 0.12 * Math.max(0, Math.sin((f - A.header) / 4))})`, borderRadius: 6, margin: '0 -8px', padding: '0 8px'}}>
        Idempotency-Key: {KEY.slice(0, 23)}…
      </div>
      <div style={{fontFamily: MONO, fontSize: 23, lineHeight: '38px', color: COL.ok, whiteSpace: 'pre', opacity: second}}>
        ↻ same key again → same response, no new charge
      </div>
      <div style={{fontFamily: MONO, fontSize: 19, lineHeight: '32px', color: COL.dim, opacity: second}}>keys are kept for at least 24 hours</div>
    </div>
  );
};

/* who makes the key: phone vs server */
const KeyMaker: React.FC<{f: number}> = ({f}) => {
  const o = ip(f, [A.app - 8, A.app + 4, S.payoff - 6, S.payoff + 4], [0, 1, 1, 0]);
  if (o <= 0) return null;
  const bad = ip(f, [A.letServer - 2, A.letServer + 8], [0, 1]);
  return (
    <div style={{position: 'absolute', left: 70, right: 150, top: 1360, display: 'flex', gap: 18, opacity: o}}>
      <div style={{flex: 1, padding: '16px 20px', borderRadius: 18, border: `2.5px solid ${COL.ok}`, background: '#10261a', opacity: 1 - 0.55 * bad}}>
        <div style={{fontFamily: MONO, fontWeight: 600, fontSize: 24, color: COL.ok}}>key made on the phone ✓</div>
        <div style={{fontFamily: MONO, fontSize: 21, color: COL.dim, marginTop: 6}}>every retry carries the same one</div>
      </div>
      <div style={{flex: 1, padding: '16px 20px', borderRadius: 18, border: `2.5px solid ${COL.bad}`, background: '#1a0d10', opacity: bad}}>
        <div style={{fontFamily: MONO, fontWeight: 600, fontSize: 24, color: COL.bad}}>key made by the server ✗</div>
        <div style={{fontFamily: MONO, fontSize: 21, color: COL.dim, marginTop: 6}}>a retry gets a new one: no match</div>
      </div>
    </div>
  );
};

/* ───────── recap: 4 lines (no follow/share; it loops back to the hook) ───────── */
const RECAP = [
  ['Retries are normal', 'lost replies, bad signal, double taps'],
  ['Send an idempotency key', 'one per checkout, on every retry'],
  ['Same key → replay, don’t redo', 'save the result, send it again'],
  ['Lock it · make it in the app', 'parallel taps: only one charge'],
];
const RECAP_COL = [COL.req, COL.violet, COL.ok, COL.amber];
const Recap: React.FC<{f: number}> = ({f}) => {
  const r = S.payoff;
  if (f < r) return null;
  return (
    <div style={{position: 'absolute', left: 70, right: 150, top: 250, scale: String(1 + 0.02 * ip(f, [r, S.total], [0, 1], Easing.linear)), transformOrigin: '0 0'}}>
      <div style={{fontFamily: MONO, fontWeight: 600, fontSize: 27, letterSpacing: 3, color: COL.amber, opacity: ip(f, [r, r + 8], [0, 1])}}>RECAP</div>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 76, lineHeight: 1.08, letterSpacing: -2, color: COL.ink, marginTop: 18, opacity: ip(f, [r + 4, r + 14], [0, 1])}}>Idempotency,</div>
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
  // a soft flash when the demo rewinds
  const rw = WORLDS.slice(1).reduce((m, w) => Math.max(m, f >= w.from && f < w.from + 12 ? 1 - (f - w.from) / 12 : 0), 0);
  return (
    <AbsoluteFill style={{background: COL.bg}}>
      <AbsoluteFill style={{backgroundImage: 'radial-gradient(rgba(140,160,190,0.08) 1.5px, transparent 1.5px)', backgroundSize: '36px 36px', backgroundPosition: `0 ${-f * 0.4}px`}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 60% at 50% 55%, rgba(169,139,255,0.05), rgba(0,0,0,0) 70%)'}} />
      <AbsoluteFill style={{scale: String(breathe), transformOrigin: '540px 980px'}}>
        <Server f={f} />
        <Keys f={f} />
        <Ledger f={f} />
        <Phone f={f} />
        <Wire f={f} />
        <StripeCard f={f} />
        <KeyMaker f={f} />
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
