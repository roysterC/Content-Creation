import {loadFont} from '@remotion/fonts';
import React from 'react';
import {AbsoluteFill, Easing, interpolate, random, staticFile, useCurrentFrame} from 'remotion';
import {BULLET_Y, CAN, CAN_CX, FPS, IMPACT, noseX, shownCount} from './timeline';

loadFont({family: 'Inter', url: staticFile('inter-200.woff2'), weight: '200'});
loadFont({family: 'Inter', url: staticFile('inter-300.woff2'), weight: '300'});
loadFont({family: 'Inter', url: staticFile('inter-400.woff2'), weight: '400'});
loadFont({family: 'Inter', url: staticFile('inter-500.woff2'), weight: '500'});
loadFont({family: 'Plex Mono', url: staticFile('mono.woff2'), weight: '400'});

const MONO = '"Plex Mono", monospace';
const SANS = 'Inter, sans-serif';
const RED = '#c4532f';
const BG = '#f7f4ee';
const ease = Easing.bezier(0.45, 0, 0.25, 1);
const ip = (f: number, i: number[], o: number[], e: (n: number) => number = (n) => n) =>
  interpolate(f, i, o, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: e});

/* ───────────── can ───────────── */
const Can: React.FC<{f: number}> = ({f}) => {
  const {x0, x1, top, bottom} = CAN;
  const w = x1 - x0;
  const hit = f >= IMPACT;
  const t = f - IMPACT;
  const bulge = hit ? ip(t, [0, 4, 30], [0, 1, 0.6]) : 0;
  return (
    <g>
      <defs>
        <linearGradient id="body" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#050505" />
          <stop offset="0.05" stopColor="#1d1d1d" />
          <stop offset="0.09" stopColor="#6e6e6e" />
          <stop offset="0.115" stopColor="#f4f4f4" />
          <stop offset="0.14" stopColor="#5e5e5e" />
          <stop offset="0.19" stopColor="#141414" />
          <stop offset="0.46" stopColor="#0b0b0b" />
          <stop offset="0.5" stopColor="#262626" />
          <stop offset="0.55" stopColor="#0b0b0b" />
          <stop offset="0.83" stopColor="#141414" />
          <stop offset="0.885" stopColor="#8e8e8e" />
          <stop offset="0.905" stopColor="#ececec" />
          <stop offset="0.925" stopColor="#7a7a7a" />
          <stop offset="0.965" stopColor="#1a1a1a" />
          <stop offset="1" stopColor="#040404" />
        </linearGradient>
        <linearGradient id="chrome" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#4c4c4c" />
          <stop offset="0.08" stopColor="#d6d6d6" />
          <stop offset="0.13" stopColor="#ffffff" />
          <stop offset="0.2" stopColor="#959595" />
          <stop offset="0.45" stopColor="#6a6a6a" />
          <stop offset="0.52" stopColor="#c4c4c4" />
          <stop offset="0.62" stopColor="#7a7a7a" />
          <stop offset="0.86" stopColor="#c9c9c9" />
          <stop offset="0.9" stopColor="#ffffff" />
          <stop offset="0.95" stopColor="#8a8a8a" />
          <stop offset="1" stopColor="#444" />
        </linearGradient>
        <radialGradient id="lid" cx="0.45" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#f4f4f4" />
          <stop offset="0.6" stopColor="#bdbdbd" />
          <stop offset="1" stopColor="#7d7d7d" />
        </radialGradient>
        <filter id="shadowBlur" x="-30%" y="-200%" width="160%" height="500%">
          <feGaussianBlur stdDeviation={14} />
        </filter>
      </defs>
      {/* ground shadow */}
      <ellipse cx={CAN_CX + 10} cy={bottom + 20} rx={w * 0.66} ry={24} fill="#000" opacity={0.22} filter="url(#shadowBlur)" />
      {/* shoulder (top taper) */}
      <path d={`M ${x0 + 30} ${top + 18} L ${x1 - 30} ${top + 18} C ${x1 - 8} ${top + 40} ${x1} ${top + 70} ${x1} ${top + 92} L ${x0} ${top + 92} C ${x0} ${top + 70} ${x0 + 8} ${top + 40} ${x0 + 30} ${top + 18} Z`} fill="url(#chrome)" />
      {/* lid */}
      <ellipse cx={CAN_CX} cy={top + 16} rx={w / 2 - 30} ry={18} fill="url(#lid)" />
      <ellipse cx={CAN_CX} cy={top + 16} rx={w / 2 - 30} ry={18} fill="none" stroke="#8d8d8d" strokeWidth={4} />
      <rect x={CAN_CX - 70} y={top + 8} width={70} height={14} rx={7} fill="#7f7f7f" />
      <rect x={CAN_CX - 60} y={top + 11} width={40} height={6} rx={3} fill="#4a4a4a" />
      <ellipse cx={CAN_CX + 34} cy={top + 15} rx={28} ry={8} fill="none" stroke="#8f8f8f" strokeWidth={3} />
      {/* body */}
      <path
        d={`M ${x0} ${top + 90} L ${x1} ${top + 90} L ${x1} ${bottom - 62} L ${x0} ${bottom - 62} Z`}
        fill="url(#body)"
        transform={bulge ? `translate(${CAN_CX} ${BULLET_Y}) scale(${1 + bulge * 0.02} ${1 - bulge * 0.01}) translate(${-CAN_CX} ${-BULLET_Y})` : undefined}
      />
      {/* base */}
      <path d={`M ${x0} ${bottom - 64} L ${x1} ${bottom - 64} C ${x1} ${bottom - 30} ${x1 - 12} ${bottom - 8} ${x1 - 34} ${bottom} L ${x0 + 34} ${bottom} C ${x0 + 12} ${bottom - 8} ${x0} ${bottom - 30} ${x0} ${bottom - 64} Z`} fill="url(#chrome)" />
      {/* label */}
      <g fill="#f1f1f1" textAnchor="middle" fontFamily={SANS}>
        <text x={CAN_CX} y={950} fontWeight={300} fontSize={112} letterSpacing={18}>
          KIKAI
        </text>
        <text x={CAN_CX} y={1012} fontWeight={400} fontSize={13} letterSpacing={3.2} opacity={0.85}>
          ALWAYS ON | EVERY CALL | BOOKED
        </text>
        <rect x={CAN_CX - 110} y={1088} width={220} height={2} opacity={0.55} />
        <text x={CAN_CX} y={1148} fontWeight={400} fontSize={19} letterSpacing={1} opacity={0.75}>
          330 ML · SALON EDITION
        </text>
      </g>
      {/* highlight band over the print */}
      <rect x={x0 + w * 0.1} y={top + 92} width={w * 0.035} height={bottom - top - 156} fill="#fff" opacity={0.12} />
    </g>
  );
};

/* ───────────── bullet ───────────── */
const Bullet: React.FC<{nx: number}> = ({nx}) => {
  const L = 256;
  const H = 62;
  const x0 = nx - L;
  const y0 = BULLET_Y - H / 2;
  return (
    <g>
      <defs>
        <linearGradient id="brass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6e4c1c" />
          <stop offset="0.16" stopColor="#e9c27a" />
          <stop offset="0.3" stopColor="#c69548" />
          <stop offset="0.65" stopColor="#8d6127" />
          <stop offset="1" stopColor="#4b300f" />
        </linearGradient>
        <linearGradient id="trail" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="#cfcac1" stopOpacity={0.9} />
          <stop offset="1" stopColor="#cfcac1" stopOpacity={0} />
        </linearGradient>
      </defs>
      {/* shock cone */}
      {[
        [-1, 20, 640],
        [-1, 30, 560],
        [-1, 40, 460],
        [1, 20, 640],
        [1, 30, 560],
        [1, 40, 460],
      ].map(([s, a, len], i) => {
        const r = (a * Math.PI) / 180;
        return <line key={i} x1={nx - 30} y1={BULLET_Y + s * 4} x2={nx - 30 - Math.cos(r) * len} y2={BULLET_Y + s * Math.sin(r) * len} stroke="#d4cfc6" strokeWidth={2} opacity={0.75 - i * 0.03} />;
      })}
      {/* vapour trail */}
      <rect x={x0 - 900} y={BULLET_Y - 9} width={910} height={18} rx={9} fill="url(#trail)" />
      {/* body */}
      <path
        d={`M ${x0 + 6} ${y0} L ${x0 + 120} ${y0} C ${nx - 70} ${y0 + 1} ${nx - 10} ${y0 + 14} ${nx} ${BULLET_Y} C ${nx - 10} ${y0 + H - 14} ${nx - 70} ${y0 + H - 1} ${x0 + 120} ${y0 + H} L ${x0 + 6} ${y0 + H} Q ${x0} ${y0 + H} ${x0} ${y0 + H - 6} L ${x0} ${y0 + 6} Q ${x0} ${y0} ${x0 + 6} ${y0} Z`}
        fill="url(#brass)"
      />
      <rect x={x0 + 70} y={y0 + 1} width={10} height={H - 2} fill="#3d270b" opacity={0.75} />
      <rect x={x0 + 82} y={y0 + 8} width={3} height={H - 16} fill="#f3d79c" opacity={0.5} />
      <path d={`M ${x0 + 12} ${y0 + 9} L ${nx - 60} ${y0 + 12}`} stroke="#fff3d6" strokeWidth={4} strokeLinecap="round" opacity={0.6} />
    </g>
  );
};

/* ───────────── impact ───────────── */
type P = {x: number; y: number; vx: number; vy: number; r: number; delay: number};
const makeDroplets = (): P[] => {
  const out: P[] = [];
  for (let i = 0; i < 380; i++) {
    const exit = i >= 110;
    const spread = exit ? 58 : 70;
    const base = exit ? 0 : 180;
    const a = ((base + (random(`a${i}`) - 0.5) * 2 * spread) * Math.PI) / 180;
    const sp = (exit ? 260 : 140) + random(`s${i}`) * (exit ? 820 : 460);
    out.push({
      x: exit ? CAN.x1 + 4 : CAN.x0 - 4,
      y: BULLET_Y + (random(`y${i}`) - 0.5) * 18,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp * 0.8 - 40,
      r: 2 + Math.pow(random(`r${i}`), 2.4) * 10,
      delay: random(`d${i}`) * (exit ? 0.35 : 0.25),
    });
  }
  return out;
};
const DROPS = makeDroplets();
const SHARDS = Array.from({length: 16}).map((_, i) => {
  const exit = i >= 6;
  const a = (((exit ? 0 : 180) + (random(`sa${i}`) - 0.5) * 120) * Math.PI) / 180;
  const sp = 220 + random(`ss${i}`) * 500;
  return {x: exit ? CAN.x1 : CAN.x0, y: BULLET_Y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, rot: random(`sr${i}`) * 720 - 360, s: 8 + random(`sz${i}`) * 14};
});

const Impact: React.FC<{f: number}> = ({f}) => {
  const t = (f - IMPACT) / FPS; // seconds since impact
  if (t < 0) return null;
  const g = 300;
  const jet = ip(t, [0.12, 0.5, 2.2], [0, 1, 0.75]);
  return (
    <g>
      <defs>
        <radialGradient id="drop" cx="0.38" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#ffe3a3" />
          <stop offset="0.45" stopColor="#f5ac36" />
          <stop offset="1" stopColor="#b8650f" />
        </radialGradient>
        <radialGradient id="mist">
          <stop offset="0" stopColor="#f7b545" stopOpacity={0.55} />
          <stop offset="1" stopColor="#f7b545" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="jetG" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#c46f12" />
          <stop offset="0.4" stopColor="#f6b445" />
          <stop offset="1" stopColor="#f6b445" stopOpacity={0.2} />
        </linearGradient>
        <filter id="mistBlur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={18} />
        </filter>
      </defs>
      {/* mist clouds at both holes */}
      <ellipse cx={CAN.x1 + 40 + t * 140} cy={BULLET_Y - t * 20} rx={60 + t * 220} ry={40 + t * 120} fill="url(#mist)" filter="url(#mistBlur)" opacity={ip(t, [0, 0.15, 2.5], [0, 1, 0.4])} />
      <ellipse cx={CAN.x0 - 30 - t * 80} cy={BULLET_Y} rx={40 + t * 120} ry={30 + t * 70} fill="url(#mist)" filter="url(#mistBlur)" opacity={ip(t, [0, 0.15, 2.5], [0, 0.8, 0.3])} />
      {/* pressure jets arcing out of the holes */}
      {[0, 1, 2].map((k) => {
        const len = jet * (360 + k * 90);
        const drop = jet * (60 + k * 50);
        return (
          <path
            key={`j${k}`}
            d={`M ${CAN.x1 - 4} ${BULLET_Y + k * 4} Q ${CAN.x1 + len * 0.55} ${BULLET_Y - 30 - k * 24} ${CAN.x1 + len} ${BULLET_Y + drop}`}
            stroke="url(#jetG)"
            strokeWidth={16 - k * 4}
            fill="none"
            strokeLinecap="round"
            opacity={0.9}
          />
        );
      })}
      <path d={`M ${CAN.x0 + 4} ${BULLET_Y} Q ${CAN.x0 - jet * 140} ${BULLET_Y - 30} ${CAN.x0 - jet * 230} ${BULLET_Y + jet * 70}`} stroke="url(#jetG)" strokeWidth={9} fill="none" strokeLinecap="round" opacity={0.85} />
      {/* droplets */}
      {DROPS.map((d, i) => {
        const tt = t - d.delay;
        if (tt <= 0) return null;
        const x = d.x + d.vx * tt;
        const y = d.y + d.vy * tt + 0.5 * g * tt * tt;
        const vy = d.vy + g * tt;
        const ang = (Math.atan2(vy, d.vx) * 180) / Math.PI;
        const sp = Math.hypot(d.vx, vy);
        const stretch = 1 + Math.min(1.6, sp / 500);
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${ang})`} opacity={ip(t, [1.4, 2.0], [1, 0])}>
            <ellipse rx={d.r * stretch} ry={d.r} fill="url(#drop)" />
            <ellipse cx={-d.r * 0.3} cy={-d.r * 0.35} rx={d.r * 0.35} ry={d.r * 0.2} fill="#fff" opacity={0.75} />
          </g>
        );
      })}
      {/* aluminium shards */}
      {SHARDS.map((s, i) => {
        const x = s.x + s.vx * t;
        const y = s.y + s.vy * t + 0.5 * g * t * t;
        return (
          <g key={`s${i}`} transform={`translate(${x} ${y}) rotate(${s.rot * t})`}>
            <path d={`M ${-s.s} ${-s.s * 0.3} L ${s.s} ${-s.s * 0.6} L ${s.s * 0.2} ${s.s * 0.7} Z`} fill={i % 2 ? '#d9d9d9' : '#1b1b1b'} stroke="#888" strokeWidth={1} />
          </g>
        );
      })}
      {/* torn holes */}
      <g>
        <circle cx={CAN.x0 + 6} cy={BULLET_Y} r={13} fill="#120a03" />
        {[0, 1, 2, 3, 4].map((k) => {
          const a = (k / 5) * Math.PI * 2 + 0.3;
          return <path key={k} d={`M ${CAN.x0 + 6 + Math.cos(a) * 10} ${BULLET_Y + Math.sin(a) * 10} L ${CAN.x0 + 6 + Math.cos(a + 0.3) * 22} ${BULLET_Y + Math.sin(a + 0.3) * 22} L ${CAN.x0 + 6 + Math.cos(a + 0.6) * 10} ${BULLET_Y + Math.sin(a + 0.6) * 10} Z`} fill="#bdbdbd" />;
        })}
        {[0, 1, 2, 3, 4, 5].map((k) => {
          const a = (k / 6) * Math.PI * 2;
          return <path key={`e${k}`} d={`M ${CAN.x1 - 6 + Math.cos(a) * 14} ${BULLET_Y + Math.sin(a) * 14} L ${CAN.x1 + 16 + Math.cos(a + 0.25) * 30} ${BULLET_Y + Math.sin(a + 0.25) * 30} L ${CAN.x1 - 6 + Math.cos(a + 0.5) * 14} ${BULLET_Y + Math.sin(a + 0.5) * 14} Z`} fill={k % 2 ? '#dcdcdc' : '#9a9a9a'} />;
        })}
      </g>
      {/* the bullet leaving the far side, very fast */}
      {t < 0.12 ? (
        <g transform={`translate(${t * 9000} 0)`} opacity={1 - t / 0.12}>
          <Bullet nx={CAN.x1 + 120} />
        </g>
      ) : null}
    </g>
  );
};

/* ───────────── HUD ───────────── */
const pad = (n: number, w = 2) => String(Math.floor(n)).padStart(w, '0');

const HUD: React.FC<{f: number; shake: {x: number; y: number}}> = ({f, shake}) => {
  const shown = shownCount(f);
  const hit = f >= IMPACT;
  const red = ip(shown, [12, 20], [1, 0]);
  const lastTicks = shown <= 12 && !hit;
  // pulse on each change in the final stretch
  let pulse = 0;
  if (lastTicks || hit) {
    let k = f;
    while (k > 0 && shownCount(k - 1) === shown) k--;
    pulse = ip(f - k, [0, 6], [1, 0]);
  }
  const color = `rgb(${Math.round(27 + (196 - 27) * red)},${Math.round(27 + (83 - 27) * red)},${Math.round(27 + (47 - 27) * red)})`;
  const sec = f / FPS;
  const tc = `00:00:${pad(sec)}:${pad(f % FPS)}`;
  const recOn = Math.floor(f / 15) % 2 === 0;
  const fadeOut = ip(f, [IMPACT + 36, IMPACT + 46], [1, 0]);
  const tag = ip(f, [IMPACT + 44, IMPACT + 60], [0, 1], ease);
  return (
    <AbsoluteFill style={{fontFamily: MONO}}>
      <div style={{position: 'absolute', top: 128, left: 26, display: 'flex', alignItems: 'center', gap: 16, fontSize: 26, color: '#1d1d1d'}}>
        <span style={{width: 16, height: 16, borderRadius: 8, background: '#e2412f', opacity: recOn ? 1 : 0.25}} />
        <span>REC</span>
        <span style={{marginLeft: 14}}>{tc}</span>
      </div>
      <div style={{position: 'absolute', top: 128, right: 26, fontSize: 26, color: '#1d1d1d'}}>100,000 FPS</div>
      {/* viewfinder corners */}
      {[
        {top: 190, left: 10, b: 'Top', s: 'Left'},
        {top: 190, right: 10, b: 'Top', s: 'Right'},
        {top: 1780, left: 10, b: 'Bottom', s: 'Left'},
        {top: 1780, right: 10, b: 'Bottom', s: 'Right'},
      ].map((c, i) => (
        <div key={i} style={{position: 'absolute', top: c.top, left: c.left, right: c.right, width: 58, height: 52, [`border${c.b}`]: '3px solid #2a2a2a', [`border${c.s}`]: '3px solid #2a2a2a'} as React.CSSProperties} />
      ))}
      {/* counter */}
      <div style={{position: 'absolute', top: 1540, left: 0, right: 0, textAlign: 'center', opacity: fadeOut, translate: `${shake.x * 0.4}px ${shake.y * 0.4}px`}}>
        <div style={{fontSize: 30, letterSpacing: 6, color: hit ? RED : '#6e6a64'}}>{hit ? 'IMPACT' : 'FRAMES TO IMPACT'}</div>
        <div style={{fontFamily: SANS, fontWeight: 200, fontSize: 210, lineHeight: 1.05, color, scale: String(1 + pulse * 0.06), letterSpacing: -4}}>
          {String(shown).padStart(3, '0')}
        </div>
      </div>
      {/* end tag */}
      <div style={{position: 'absolute', top: 1560, left: 0, right: 0, textAlign: 'center', opacity: tag, translate: `0 ${(1 - tag) * 20}px`}}>
        <div style={{fontFamily: SANS, fontWeight: 300, fontSize: 64, color: '#1b1b1b', letterSpacing: -1}}>Never miss the moment.</div>
        <div style={{marginTop: 22, fontSize: 24, letterSpacing: 5, color: '#6e6a64'}}>KIKAI · AI RECEPTIONIST FOR SALONS</div>
      </div>
    </AbsoluteFill>
  );
};

/* ───────────── composition ───────────── */
export const BulletHook: React.FC = () => {
  const f = useCurrentFrame();
  const hit = f >= IMPACT;
  // camera: wide (your 185 frame) → close (your 012 frame) → slight push at impact
  const s = ip(f, [0, 44, 173, IMPACT, IMPACT + 70], [0.56, 0.617, 1, 1.08, 1.0], ease);
  const cx = ip(f, [0, 44, 173, IMPACT, IMPACT + 70], [745, 717, 775, 760, 650], ease);
  const cy = ip(f, [0, 44, 173, IMPACT, IMPACT + 70], [1110, 1097, 1015, 1000, 980], ease);
  const amp = hit ? ip(f - IMPACT, [0, 14], [22, 0]) : 0;
  const shake = {x: (random(`sx${f}`) - 0.5) * amp * 2, y: (random(`sy${f}`) - 0.5) * amp * 2};
  const jolt = hit ? ip(f - IMPACT, [0, 5, 30], [0, 1, 0.7], ease) : 0;
  const flash = hit ? ip(f - IMPACT, [0, 1, 5], [0, 0.9, 0]) : 0;
  return (
    <AbsoluteFill style={{background: BG}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 70% 55% at 55% 50%, rgba(255,255,255,0.65), rgba(0,0,0,0) 70%)'}} />
      <svg width={1080} height={1920} style={{position: 'absolute', overflow: 'visible'}}>
        <g transform={`translate(${cx + shake.x} ${cy + shake.y}) scale(${s}) translate(${-CAN_CX} ${-1015})`}>
          {!hit ? <Bullet nx={noseX(f)} /> : null}
          <g transform={`translate(${jolt * 14} 0) rotate(${jolt * 1.6} ${CAN_CX} ${CAN.bottom})`}>
            <Can f={f} />
          </g>
          <Impact f={f} />
        </g>
      </svg>
      <HUD f={f} shake={shake} />
      <AbsoluteFill style={{background: '#fffaf0', opacity: flash}} />
    </AbsoluteFill>
  );
};
