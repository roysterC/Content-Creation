import React from 'react';
import cues from './cues.json';
import {EASE, EASE_OUT, ip, P, SANS, SERIF} from './theme';

const X = cues.sfx;
const S = cues.scenes;

/* ─────────────── hook headline: fully visible on frame 0 ─────────────── */
export const Headline: React.FC<{f: number; until: number}> = ({f, until}) => {
  const out = ip(f, [until - 8, until], [1, 0]);
  const breathe = 1 + Math.sin(f / 14) * 0.006;
  return (
    <div style={{position: 'absolute', top: 250, left: 56, right: 56, opacity: out, translate: `0 ${(1 - out) * -20}px`}}>
      <div style={{background: P.plate, borderRadius: 40, padding: '34px 44px 42px', scale: String(breathe), boxShadow: '0 24px 60px rgba(0,0,0,0.35)'}}>
        <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 40, letterSpacing: 6, color: P.amberSoft}}>SALON OWNERS:</div>
        <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 92, lineHeight: 1.04, letterSpacing: -2, color: P.cream, marginTop: 12}}>
          How many calls did you <span style={{color: P.redSoft}}>miss</span> today?
        </div>
      </div>
    </div>
  );
};

/* ─────────────── captions (sound-off viewers) ─────────────── */
export const CAP_HIGH = 330; // under the CTA tag
export const CAP_LOW = 1330; // above the platform caption band

export const Caption: React.FC<{f: number; l1: React.ReactNode; l2?: React.ReactNode; at: number; until: number; top: number; serif?: boolean}> = ({f, l1, l2, at, until, top, serif}) => {
  if (f < at - 1 || f > until + 1) return null;
  const inn = ip(f, [at, at + 9], [0, 1], EASE_OUT);
  const out = ip(f, [until - 7, until], [1, 0]);
  const line = (txt: React.ReactNode, k: number) => {
    const p = ip(f, [at + k * 6, at + k * 6 + 10], [0, 1], EASE_OUT);
    return (
      <div style={{opacity: p, translate: `0 ${(1 - p) * 16}px`}}>
        <span
          style={{
            display: 'inline-block',
            background: P.plate,
            borderRadius: 22,
            padding: serif ? '6px 28px 14px' : '10px 26px 14px',
            margin: '5px 0',
            fontFamily: serif && k === 0 ? SERIF : SANS,
            fontStyle: serif && k === 0 ? 'italic' : 'normal',
            fontWeight: serif && k === 0 ? 400 : 700,
            fontSize: serif && k === 0 ? 104 : 52,
            lineHeight: 1.1,
            letterSpacing: serif && k === 0 ? -1 : -0.5,
            color: P.cream,
          }}
        >
          {txt}
        </span>
      </div>
    );
  };
  return (
    <div style={{position: 'absolute', top, left: top < 900 ? 50 : 150, right: top < 900 ? 50 : 150, textAlign: 'center', opacity: inn * out}}>
      {line(l1, 0)}
      {l2 ? line(l2, 1) : null}
    </div>
  );
};

/* ─────────────── missed-call counter ─────────────── */
const lastHit = (f: number, hits: number[]) => hits.filter((h) => f >= h).pop();

export const MissCounter: React.FC<{f: number}> = ({f}) => {
  const n = X.miss.filter((m) => f >= m).length;
  if (n === 0) return null;
  const o = ip(f, [X.miss[0], X.miss[0] + 6, X.fly, X.fly + 8], [0, 1, 1, 0]);
  const h = lastHit(f, X.miss) ?? 0;
  const pulse = ip(f - h, [0, 8], [1, 0]);
  return (
    <div style={{position: 'absolute', top: 250, left: 0, right: 0, textAlign: 'center', opacity: o}}>
      <div style={{display: 'inline-block', background: P.plate, borderRadius: 36, padding: '18px 56px 10px'}}>
        <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 34, letterSpacing: 7, color: P.redSoft}}>MISSED CALLS</div>
        <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 150, lineHeight: 1.0, color: P.red, scale: String(1 + 0.12 * pulse), letterSpacing: -3}}>{n}</div>
        <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 32, color: P.cream, opacity: 0.85, marginTop: 2, marginBottom: 6}}>…while you're mid-colour</div>
      </div>
    </div>
  );
};

/* ─────────────── notification cards ─────────────── */
const PhoneIcon: React.FC<{color: string; hang?: boolean}> = ({color, hang}) => (
  <svg width={46} height={46} viewBox="0 0 24 24" style={{rotate: hang ? '135deg' : '0deg'}}>
    <path
      d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.12.37 2.33.57 3.6.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z"
      fill={color}
    />
  </svg>
);

export const Notice: React.FC<{icon: string; title: string; sub: string; right: string; tint: string; titleColor?: string; hang?: boolean; glow?: number}> = ({
  icon,
  title,
  sub,
  right,
  tint,
  titleColor = '#1d1a17',
  hang,
  glow = 0,
}) => (
  <div
    style={{
      width: 780,
      height: 124,
      borderRadius: 34,
      background: 'rgba(252,248,240,0.97)',
      display: 'flex',
      alignItems: 'center',
      gap: 26,
      padding: '0 30px',
      boxSizing: 'border-box',
      boxShadow: `0 18px 40px rgba(0,0,0,0.35), 0 0 ${60 * glow}px ${20 * glow}px rgba(255,179,71,${0.55 * glow})`,
    }}
  >
    <div style={{width: 76, height: 76, borderRadius: 38, background: tint, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
      {icon === 'phone' ? <PhoneIcon color="#fff" hang={hang} /> : <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 40, color: '#fff'}}>{icon}</span>}
    </div>
    <div style={{flex: 1, fontFamily: SANS}}>
      <div style={{fontWeight: 700, fontSize: 38, color: titleColor}}>{title}</div>
      <div style={{fontWeight: 500, fontSize: 28, color: '#7a7168', marginTop: 2}}>{sub}</div>
    </div>
    <div style={{fontFamily: SANS, fontWeight: 500, fontSize: 26, color: '#9a9086', alignSelf: 'flex-start', marginTop: 26}}>{right}</div>
  </div>
);

// Ofcom drama range, never a real number
const NUMBERS = ['07700 900412', '07700 900873', '07700 900129', '07700 900566'];
const STACK_TOP = 560;
const STACK_GAP = 140;
const WINDOW = {x: 540, y: 1080}; // the rival salon's window, in the "lost" scene

/** Missed-call cards stacking up, then flying off to the salon down the road. */
export const MissedStack: React.FC<{f: number}> = ({f}) => {
  if (f < X.miss[0] - 1 || f > X.fly + 60) return null;
  return (
    <>
      {X.miss.map((t, i) => {
        if (f < t) return null;
        const p = ip(f, [t, t + 10], [0, 1], EASE_OUT);
        const k = X.miss.slice(i + 1).reduce((a, tj) => a + ip(f, [tj, tj + 10], [0, 1], EASE), 0); // cards above this one
        const fi = X.fly + (X.miss.length - 1 - i) * 6;
        const q = ip(f, [fi, fi + 22], [0, 1], EASE);
        if (q >= 1) return null;
        const y0 = STACK_TOP + k * STACK_GAP;
        const x = 540 + (WINDOW.x - 540) * q - Math.sin(q * Math.PI) * 260;
        const y = y0 + (WINDOW.y - y0) * q - Math.sin(q * Math.PI) * 120;
        const s = (0.9 + 0.1 * p) * (1 - 0.035 * k) * (1 - 0.75 * q);
        const ago = Math.round((f - t) / 30);
        return (
          <div
            key={t}
            style={{
              position: 'absolute',
              left: x - 390,
              top: y - (1 - p) * 50,
              opacity: p * (1 - 0.14 * k) * (1 - q * q),
              scale: String(s),
              rotate: `${q * -14}deg`,
              zIndex: 10 + i,
            }}
          >
            <Notice icon="phone" hang tint={P.red} title="Missed call" titleColor="#b5332a" sub={`${NUMBERS[i]} · Mobile`} right={ago < 1 ? 'now' : `${ago}s ago`} />
          </div>
        );
      })}
    </>
  );
};

/** The mirror image of the missed card: Kikai picks up. */
export const AnsweredCard: React.FC<{f: number}> = ({f}) => {
  const a = X.switch + 2;
  if (f < a - 1 || f >= X.nightIn) return null;
  const p = ip(f, [a, a + 12], [0, 1], EASE_OUT);
  const out = ip(f, [X.nightIn - 8, X.nightIn], [1, 0]);
  const secs = Math.max(0, Math.floor((f - a) / 30));
  return (
    <div style={{position: 'absolute', left: 150, top: STACK_TOP + 90 - (1 - p) * 50, opacity: p * out, scale: String(0.9 + 0.1 * p)}}>
      <Notice icon="phone" tint={P.amberInk} title="Answered by Kikai" titleColor={P.amberInk} sub={`“Hello, Bramble Hair!” · 0:0${Math.min(9, secs)}`} right="live" glow={ip(f, [a, a + 20, a + 60], [0, 1, 0.5])} />
    </div>
  );
};

/** "Booked" chips popping up on the rival salon. */
export const RivalChips: React.FC<{f: number}> = ({f}) => (
  <>
    {X.rivalBooked.map((t, i) => {
      if (f < t) return null;
      const p = ip(f, [t, t + 8], [0, 1], EASE_OUT);
      const bump = ip(f, [t, t + 4, t + 10], [0.7, 1.12, 1]);
      return (
        <div
          key={t}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 860 + i * 92,
            textAlign: 'center',
            opacity: p * ip(f, [S.kikai.start - 6, S.kikai.start], [1, 0]),
          }}
        >
          <span style={{display: 'inline-block', scale: String(bump), background: P.green, color: '#fff', borderRadius: 999, padding: '12px 34px', fontFamily: SANS, fontWeight: 700, fontSize: 40, boxShadow: '0 10px 24px rgba(0,0,0,0.3)'}}>
            ✓ Booked
          </span>
        </div>
      );
    })}
  </>
);

/* ─────────────── persistent CTA tag: Kikai → end card ─────────────── */
export const CtaTag: React.FC<{f: number}> = ({f}) => {
  const a = X.switch + 8;
  const z = X.card + 10;
  if (f < a - 1 || f > z + 1) return null;
  const o = ip(f, [a, a + 8, z - 10, z], [0, 1, 1, 0]);
  const pulse = ip((f - X.grid0) % 60, [0, 10], [1, 0]); // nudges on every bar
  return (
    <div style={{position: 'absolute', top: 236, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: o, translate: `0 ${ip(f, [a, a + 10], [-16, 0], EASE)}px`}}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '12px 28px 12px 22px',
          borderRadius: 999,
          background: '#1c140f',
          color: '#fff',
          fontFamily: SANS,
          fontWeight: 500,
          fontSize: 30,
          scale: String(1 + 0.04 * pulse),
          boxShadow: '0 10px 26px rgba(0,0,0,0.3)',
        }}
      >
        <svg width={30} height={30} viewBox="0 0 24 24">
          <path d="M4 5h16v11H9l-5 4z" fill="none" stroke="#fff" strokeWidth={2} strokeLinejoin="round" />
        </svg>
        <span>
          Comment <b style={{color: P.amber}}>“FREE”</b> for a free consultation
        </span>
      </div>
    </div>
  );
};
