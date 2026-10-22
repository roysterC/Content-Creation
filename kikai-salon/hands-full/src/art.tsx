import React, {useMemo} from 'react';
import {AbsoluteFill, Img, random, staticFile, useCurrentFrame} from 'remotion';
import {HAND, mix, P, SANS} from './theme';

export type Cam = {x: number; y: number; s: number; px?: number; py?: number};
export const CAM0: Cam = {x: 540, y: 960, s: 1};

/** One parallax plane: full-frame SVG moved by the camera, with its own depth-of-field blur. */
export const Layer: React.FC<{
  cam?: Cam;
  depth?: number;
  blur?: number;
  blend?: React.CSSProperties['mixBlendMode'];
  opacity?: number;
  w?: number;
  h?: number;
  children: React.ReactNode;
}> = ({cam = CAM0, depth = 1, blur = 0, blend, opacity = 1, w = 1080, h = 1920, children}) => (
  <AbsoluteFill
    style={{
      transformOrigin: `${cam.x}px ${cam.y}px`,
      scale: String(1 + (cam.s - 1) * depth),
      translate: `${(cam.px ?? 0) * depth}px ${(cam.py ?? 0) * depth}px`,
      filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
      mixBlendMode: blend,
      opacity,
    }}
  >
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{overflow: 'visible'}}>
      {children}
    </svg>
  </AbsoluteFill>
);

/* ─────────────── environment ─────────────── */

export const BrickWall: React.FC<{w: number; h: number; seed: string; x?: number; y?: number}> = ({w, h, seed, x = 0, y = 0}) => {
  const bricks = useMemo(() => {
    const bw = 96;
    const bh = 38;
    const g = 6;
    const cols = ['#a95c43', '#b4664b', '#9d523b', '#b8704f', '#a35a40', '#c07a58', '#ab6247'];
    const out: React.ReactNode[] = [];
    for (let r = 0; r * (bh + g) < h; r++) {
      for (let c = -1; c * (bw + g) < w + bw; c++) {
        const bx = c * (bw + g) + (r % 2 ? (bw + g) / 2 : 0);
        const col = cols[Math.floor(random(`${seed}-${r}-${c}`) * cols.length)];
        out.push(<rect key={`${r}-${c}`} x={bx} y={r * (bh + g)} width={bw} height={bh} rx={4} fill={col} />);
      }
    }
    return out;
  }, [w, h, seed]);
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={w} height={h} fill={P.mortar} />
      {bricks}
    </g>
  );
};

export const Floor: React.FC<{y0: number; vp?: {x: number; y: number}}> = ({y0, vp = {x: 560, y: 420}}) => {
  const lines: React.ReactNode[] = [];
  const H = 1920;
  for (let i = -16; i <= 16; i++) {
    const bx = 540 + i * 120;
    const xAt = (y: number) => vp.x + (bx - vp.x) * ((y - vp.y) / (H - vp.y));
    lines.push(<line key={`v${i}`} x1={xAt(y0)} y1={y0} x2={xAt(H + 200)} y2={H + 200} stroke={P.woodDark} strokeWidth={3} opacity={0.55} />);
  }
  for (let k = 1; k < 9; k++) {
    const y = y0 + (H - y0) * Math.pow(k / 9, 1.5);
    lines.push(<line key={`h${k}`} x1={0} y1={y} x2={1080} y2={y} stroke={P.woodDark} strokeWidth={2} opacity={0.3} />);
  }
  return (
    <g>
      <defs>
        <linearGradient id="floorG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b98457" />
          <stop offset="1" stopColor="#8d5c38" />
        </linearGradient>
      </defs>
      <rect x={-200} y={y0} width={1480} height={H - y0 + 400} fill="url(#floorG)" />
      {lines}
      <rect x={-200} y={y0} width={1480} height={14} fill="#000" opacity={0.18} />
    </g>
  );
};

export const Mirror: React.FC<{cx: number; cy: number; r: number; on: number}> = ({cx, cy, r, on}) => (
  <g transform={`translate(${cx} ${cy})`}>
    <defs>
      <linearGradient id="mirrorG" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#d6dcd6" />
        <stop offset="0.55" stopColor="#97aaa6" />
        <stop offset="1" stopColor="#bcc8c2" />
      </linearGradient>
    </defs>
    <circle r={r + 28} fill={P.brassDark} />
    <circle r={r + 20} fill={P.brass} />
    <circle r={r} fill="url(#mirrorG)" />
    <path d={`M ${-r * 0.6} ${-r * 0.2} L ${-r * 0.1} ${-r * 0.7}`} stroke="#fff" strokeWidth={14} strokeLinecap="round" opacity={0.45} />
    <path d={`M ${-r * 0.45} ${r * 0.1} L ${r * 0.15} ${-r * 0.5}`} stroke="#fff" strokeWidth={6} strokeLinecap="round" opacity={0.3} />
    {Array.from({length: 14}).map((_, i) => {
      const a = (i / 14) * Math.PI * 2;
      return <circle key={i} cx={Math.cos(a) * (r + 44)} cy={Math.sin(a) * (r + 44)} r={11} fill={mix('#d8cdb6', '#fff4d6', on)} />;
    })}
  </g>
);

export const Pendant: React.FC<{x: number; len: number; on: number}> = ({x, len, on}) => (
  <g transform={`translate(${x} 0)`}>
    <line x1={0} y1={0} x2={0} y2={len} stroke={P.charcoal} strokeWidth={4} />
    <path d={`M -62 ${len + 56} Q -58 ${len} 0 ${len} Q 58 ${len} 62 ${len + 56} Z`} fill={P.brass} />
    <path d={`M -62 ${len + 56} L 62 ${len + 56}`} stroke={P.brassDark} strokeWidth={6} />
    <ellipse cx={0} cy={len + 62} rx={26} ry={14} fill={mix('#d8cdb6', '#fff4d6', on)} />
  </g>
);

const Leaf: React.FC<{x: number; y: number; rot: number; s?: number; c?: string}> = ({x, y, rot, s = 1, c = P.leaf}) => (
  <path
    transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}
    d="M 0 0 C 10 -14 34 -14 44 0 C 34 14 10 14 0 0 Z"
    fill={c}
  />
);

export const TrailingPlant: React.FC<{x: number; y: number; seed: string; len?: number}> = ({x, y, seed, len = 260}) => {
  const frame = useCurrentFrame();
  return (
    <g transform={`translate(${x} ${y})`}>
      {[-34, -10, 14, 36].map((dx, v) => {
        const L = len * (0.6 + random(`${seed}v${v}`) * 0.5);
        const sway = Math.sin(frame / 40 + v) * 4;
        return (
          <g key={v}>
            <path d={`M ${dx * 0.4} 20 Q ${dx + sway} ${L * 0.5} ${dx * 1.3 + sway} ${L}`} stroke={P.leaf3} strokeWidth={3} fill="none" />
            {Array.from({length: Math.floor(L / 30)}).map((_, i) => {
              const t = (i + 1) / Math.floor(L / 30);
              const lx = dx * 0.4 + (dx * 1.3 - dx * 0.4) * t + sway * t;
              return <Leaf key={i} x={lx} y={20 + (L - 20) * t} rot={i % 2 ? 40 : 140} s={0.55} c={i % 3 ? P.leaf : P.leaf2} />;
            })}
          </g>
        );
      })}
      <path d="M -50 -20 L 50 -20 L 40 30 L -40 30 Z" fill="#d9c7a8" />
      <rect x={-54} y={-26} width={108} height={12} rx={4} fill="#c9b58f" />
    </g>
  );
};

export const BigPlant: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => {
  const frame = useCurrentFrame();
  const leaves = [
    [-20, -380, -70, 1.6],
    [30, -330, -20, 1.7],
    [-60, -280, -120, 1.5],
    [40, -240, 20, 1.6],
    [-30, -190, -150, 1.4],
    [20, -150, 50, 1.4],
    [0, -430, -95, 1.4],
  ];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {leaves.map(([lx, ly, rot, ls], i) => (
        <g key={i}>
          <path d={`M 0 -40 Q ${lx * 0.5} ${ly * 0.6} ${lx} ${ly}`} stroke={P.leaf3} strokeWidth={5} fill="none" />
          <g transform={`rotate(${Math.sin(frame / 50 + i) * 2} ${lx} ${ly})`}>
            <Leaf x={lx} y={ly} rot={rot} s={ls * 2.2} c={i % 2 ? P.leaf : P.leaf3} />
          </g>
        </g>
      ))}
      <path d="M -90 -40 L 90 -40 L 70 110 L -70 110 Z" fill="#e2d5bd" />
      <path d="M -90 -40 L 90 -40 L 86 -10 L -86 -10 Z" fill="#cdbd9e" />
    </g>
  );
};

/** Glass shop door with hanging OPEN/CLOSED sign. */
export const Door: React.FC<{x: number; y: number; w: number; h: number; night: number; sign: number; rain: number}> = ({x, y, w, h, night, sign, rain}) => {
  const frame = useCurrentFrame();
  const flip = Math.cos(Math.PI * sign);
  const back = sign > 0.5;
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <linearGradient id="outsideDay" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff6dc" />
          <stop offset="1" stopColor="#f3dfb4" />
        </linearGradient>
        <linearGradient id="outsideNight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1b2848" />
          <stop offset="1" stopColor="#2c3d63" />
        </linearGradient>
        <clipPath id="glassClip">
          <rect x={30} y={30} width={w - 60} height={h - 200} rx={6} />
        </clipPath>
      </defs>
      <rect width={w} height={h} rx={10} fill={P.charcoal} />
      <g clipPath="url(#glassClip)">
        <rect x={30} y={30} width={w - 60} height={h - 200} fill="url(#outsideDay)" />
        <rect x={30} y={30} width={w - 60} height={h - 200} fill="url(#outsideNight)" opacity={night} />
        {/* street across the road: faint shopfronts */}
        <g opacity={0.25 + night * 0.25}>
          <rect x={20} y={h * 0.32} width={110} height={h * 0.3} fill={mix('#e3cfa7', '#3b4b70', night)} />
          <rect x={150} y={h * 0.26} width={140} height={h * 0.36} fill={mix('#dcc39a', '#33456a', night)} />
          <circle cx={w * 0.72} cy={h * 0.2} r={26} fill="#ffe7a8" opacity={night} />
          <rect x={w * 0.72 - 4} y={h * 0.2} width={8} height={h * 0.5} fill="#2a3352" opacity={night} />
        </g>
        {/* rain streaks */}
        {Array.from({length: 26}).map((_, i) => {
          const sx = 30 + random(`rx${i}`) * (w - 60);
          const speed = 18 + random(`rs${i}`) * 14;
          const sy = ((frame * speed + random(`ry${i}`) * 2000) % (h + 200)) - 100;
          return <line key={i} x1={sx} y1={sy} x2={sx - 6} y2={sy + 70} stroke="#cfe0ff" strokeWidth={2.5} opacity={rain * 0.5} />;
        })}
        <path d={`M 30 ${h - 300} L ${w - 30} 30`} stroke="#fff" strokeWidth={30} opacity={0.12 * (1 - night)} />
      </g>
      <rect x={w - 60} y={h * 0.5} width={14} height={90} rx={7} fill={P.brass} />
      <rect x={30} y={h - 150} width={w - 60} height={110} rx={6} fill={P.charcoal2} />
      {/* sign */}
      <g transform={`translate(${w / 2} ${h * 0.3})`}>
        <path d="M -50 -70 L 0 -110 L 50 -70" stroke="#e8dcc4" strokeWidth={3} fill="none" />
        <g transform={`scale(${Math.max(0.04, Math.abs(flip))} 1)`}>
          <rect x={-90} y={-70} width={180} height={78} rx={10} fill={back ? P.charcoal2 : P.cream} stroke={P.brass} strokeWidth={4} />
          <text x={0} y={-18} textAnchor="middle" fontFamily={SANS} fontWeight={600} fontSize={34} letterSpacing={4} fill={back ? P.cream : P.charcoal}>
            {back ? 'CLOSED' : 'OPEN'}
          </text>
        </g>
      </g>
    </g>
  );
};

/* ─────────────── people ─────────────── */

/** Seated client seen from behind, in a styling chair. */
export const Client: React.FC<{x: number; y: number; s?: number; hair: string; foils?: number; curls?: boolean}> = ({x, y, s = 1, hair, foils = 0, curls}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {/* chair back */}
    <rect x={-95} y={40} width={190} height={210} rx={40} fill={P.charcoal} />
    <rect x={-12} y={250} width={24} height={150} fill="#7d7768" />
    <ellipse cx={0} cy={404} rx={90} ry={16} fill="#5c574d" />
    {/* cape */}
    <path d="M -40 30 Q -120 70 -120 230 L 120 230 Q 120 70 40 30 Z" fill="#3f3c38" />
    {/* head */}
    <rect x={-18} y={10} width={36} height={30} fill={P.skinLight} />
    <ellipse cx={0} cy={-30} rx={52} ry={58} fill={hair} />
    {curls
      ? Array.from({length: 9}).map((_, i) => <circle key={i} cx={Math.cos(i * 0.7) * 40} cy={-40 + Math.sin(i * 1.3) * 32} r={22} fill={hair} />)
      : null}
    {Array.from({length: foils}).map((_, i) => (
      <rect key={i} x={-46 + (i % 4) * 24} y={-74 + Math.floor(i / 4) * 26} width={30} height={20} rx={3} fill="#d9dde0" stroke="#aeb4b8" strokeWidth={2} transform={`rotate(${(i % 3) * 8 - 8})`} />
    ))}
  </g>
);

/** Male stylist, profile facing right, snipping. */
export const StylistSam: React.FC<{x: number; y: number}> = ({x, y}) => {
  const frame = useCurrentFrame();
  const snip = Math.abs(Math.sin(frame / 3)) * 18;
  const arm = Math.sin(frame / 12) * 6;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-34} y={250} width={30} height={200} rx={10} fill="#3d3a36" />
      <rect x={4} y={250} width={30} height={200} rx={10} fill="#34312e" />
      <path d="M -52 70 Q -60 60 -40 50 L 40 50 Q 62 60 54 80 L 48 260 L -46 260 Z" fill="#ece3d1" />
      <path d="M -40 120 L 46 120 L 50 270 L -44 270 Z" fill={P.charcoal} />
      <rect x={-12} y={26} width={26} height={30} fill="#c08e6d" />
      <circle cx={0} cy={0} r={42} fill="#c08e6d" />
      <path d="M -42 -6 Q -40 -48 4 -46 Q 40 -46 40 -16 L 30 -22 Q 0 -30 -30 -14 Z" fill="#2d211b" />
      <path d="M 6 14 Q 30 16 40 6 Q 42 38 14 42 Q -8 42 -16 22 Z" fill="#2d211b" />
      <path d="M 40 -4 L 50 8 L 40 12" fill="#c08e6d" />
      {/* arm to client */}
      <path d={`M 30 80 Q 90 ${120 + arm} 130 ${60 + arm}`} stroke="#ece3d1" strokeWidth={30} strokeLinecap="round" fill="none" />
      <path d={`M 110 ${78 + arm} L 150 ${40 + arm}`} stroke="#c08e6d" strokeWidth={22} strokeLinecap="round" />
      <g transform={`translate(156 ${34 + arm})`}>
        <line x1={0} y1={0} x2={38} y2={-snip * 0.4} stroke="#bfc4c8" strokeWidth={5} strokeLinecap="round" />
        <line x1={0} y1={0} x2={38} y2={snip * 0.4} stroke="#bfc4c8" strokeWidth={5} strokeLinecap="round" />
      </g>
    </g>
  );
};

/** Female stylist, profile facing left, blow-drying. */
export const StylistJo: React.FC<{x: number; y: number}> = ({x, y}) => {
  const frame = useCurrentFrame();
  const wob = Math.sin(frame / 5) * 5;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-34} y={250} width={30} height={200} rx={10} fill="#3d3a36" />
      <rect x={4} y={250} width={30} height={200} rx={10} fill="#34312e" />
      <path d="M -52 70 Q -60 60 -40 50 L 40 50 Q 62 60 54 80 L 48 260 L -46 260 Z" fill="#d6a043" />
      <path d="M -44 120 L 44 120 L 48 270 L -46 270 Z" fill={P.charcoal} />
      <rect x={-12} y={26} width={26} height={30} fill="#6e4430" />
      <circle cx={0} cy={0} r={42} fill="#6e4430" />
      {Array.from({length: 11}).map((_, i) => (
        <circle key={i} cx={Math.cos(i * 0.62 - 0.2) * 40 + 6} cy={-14 + Math.sin(i * 0.62 - 0.2) * -36} r={20} fill="#1f1512" />
      ))}
      <path d="M -40 -6 L -50 6 L -40 12" fill="#6e4430" />
      {/* arm + hairdryer */}
      <path d={`M -30 80 Q -90 ${130 + wob} -120 ${60 + wob}`} stroke="#d6a043" strokeWidth={30} strokeLinecap="round" fill="none" />
      <g transform={`translate(-128 ${42 + wob}) rotate(${-8 + wob * 0.4})`}>
        <rect x={-6} y={0} width={22} height={70} rx={8} fill={P.charcoal} />
        <rect x={-90} y={-30} width={110} height={44} rx={20} fill={P.charcoal2} />
        <rect x={-110} y={-24} width={26} height={32} rx={6} fill={P.charcoal} />
        {[0, 1, 2].map((k) => (
          <line key={k} x1={-120} y1={-18 + k * 12} x2={-150 - ((frame * 4 + k * 9) % 30)} y2={-22 + k * 14} stroke="#fff" strokeWidth={3} opacity={0.35} />
        ))}
      </g>
      <circle cx={-120} cy={60 + wob} r={14} fill="#6e4430" />
    </g>
  );
};

/** Priya from behind (3/4), mid-colour on her client. */
export const PriyaWorking: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => {
  const frame = useCurrentFrame();
  const brush = Math.sin(frame / 6) * 12;
  const foilHand = Math.sin(frame / 9 + 1) * 5;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {/* torso: sage tee with crossed apron straps */}
      <path d="M -125 130 Q -130 95 -90 85 L 90 85 Q 130 95 128 140 L 120 900 L -120 900 Z" fill={P.sageTee} />
      <path d="M -82 90 L 70 470" stroke={P.charcoal} strokeWidth={34} />
      <path d="M 82 90 L -70 470" stroke={P.charcoal} strokeWidth={34} />
      <path d="M -122 450 L 122 450 L 130 900 L -130 900 Z" fill={P.charcoal} />
      <path d="M -122 450 L 122 450 L 122 480 L -122 480 Z" fill="#1f1e1c" />
      <path d="M -20 470 Q -60 520 -40 580 M 20 470 Q 60 520 40 580" stroke={P.charcoal} strokeWidth={18} fill="none" strokeLinecap="round" />
      {/* arms reaching to client (left of frame) */}
      <path d={`M -100 120 Q -190 210 -230 ${150 + foilHand}`} stroke={P.sageTee} strokeWidth={56} strokeLinecap="round" fill="none" />
      <path d={`M -200 ${190 + foilHand * 0.5} Q -250 ${130 + foilHand} -268 ${70 + foilHand}`} stroke={P.skin} strokeWidth={36} strokeLinecap="round" fill="none" />
      <path d={`M 104 130 Q 40 270 -110 ${210 + brush * 0.4}`} stroke={P.sageTee} strokeWidth={56} strokeLinecap="round" fill="none" />
      <path d={`M -60 ${236 + brush * 0.3} Q -150 ${210 + brush} -190 ${150 + brush}`} stroke={P.skin} strokeWidth={36} strokeLinecap="round" fill="none" />
      {/* foil in left hand */}
      <rect x={-320} y={20 + foilHand} width={64} height={46} rx={4} fill="#dfe3e6" stroke="#aab0b5" strokeWidth={3} transform={`rotate(-18 -288 ${43 + foilHand})`} />
      {/* tint brush in right hand */}
      <g transform={`translate(-200 ${142 + brush}) rotate(-50)`}>
        <rect x={-6} y={-70} width={12} height={90} rx={5} fill={P.charcoal} />
        <rect x={-10} y={-96} width={20} height={30} rx={4} fill="#7a3f2a" />
      </g>
      {/* neck, head (back of head, face turned left) */}
      <rect x={-30} y={30} width={60} height={70} fill={P.skinShade} />
      <ellipse cx={0} cy={-30} rx={74} ry={84} fill={P.hair} />
      <path d="M -74 -40 Q -86 0 -62 40 Q -50 10 -56 -30 Z" fill={P.skin} />
      <ellipse cx={58} cy={-18} rx={12} ry={20} fill={P.skin} />
      <circle cx={60} cy={14} r={15} fill="none" stroke={P.gold} strokeWidth={5} />
      <circle cx={10} cy={-118} r={46} fill={P.hair} />
      <path d="M -40 -100 Q 0 -140 40 -100" stroke={P.hairHi} strokeWidth={5} fill="none" />
      <path d="M 60 -40 Q 74 -10 66 20" stroke={P.hair} strokeWidth={4} fill="none" />
    </g>
  );
};

/** Priya small, full figure, side-on at the door (for the lock-up). */
export const PriyaAtDoor: React.FC<{x: number; y: number; reach: number}> = ({x, y, reach}) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-26} y={250} width={24} height={240} rx={10} fill="#2f2c29" />
    <rect x={2} y={250} width={24} height={240} rx={10} fill="#272522" />
    <path d="M -46 70 Q -50 54 -30 48 L 32 48 Q 52 54 48 76 L 44 270 L -42 270 Z" fill={P.sageTee} />
    <path d="M -40 130 L 44 130 L 48 300 L -44 300 Z" fill={P.charcoal} />
    <path d={`M -20 80 Q ${-60} ${60 - reach * 80} ${-70} ${10 - reach * 140}`} stroke={P.sageTee} strokeWidth={24} strokeLinecap="round" fill="none" />
    <circle cx={-72} cy={4 - reach * 140} r={13} fill={P.skin} />
    <rect x={-10} y={26} width={22} height={28} fill={P.skinShade} />
    <circle cx={0} cy={0} r={36} fill={P.skin} />
    <path d="M -36 4 Q -40 -40 2 -40 Q 38 -38 36 -4 Q 20 -18 -10 -14 Z" fill={P.hair} />
    <circle cx={22} cy={-40} r={20} fill={P.hair} />
    <circle cx={14} cy={20} r={7} fill="none" stroke={P.gold} strokeWidth={3} />
  </g>
);

/* ─────────────── desk, phone, diary ─────────────── */

export const PHONE = {x: 930, y: 1574};
export const DIARY = {x: 720, y: 1588};

const ringOnAt = (f: number) => {
  if (f < 0) return false;
  const m = f % 90;
  return m < 12 || (m >= 18 && m < 30);
};

/** Phone lying flat on the desk; `ring` = frames since ringing began (or -1). */
export const PhoneFlat: React.FC<{x: number; y: number; s?: number; ring: number; ringEnd?: number; rot?: number}> = ({x, y, s = 1, ring, ringEnd = 1e9, rot = -8}) => {
  const frame = useCurrentFrame();
  const active = ring >= 0 && ring < ringEnd;
  const buzzing = active && ringOnAt(ring);
  const jx = buzzing ? Math.sin(frame * 2.7) * 3 : 0;
  return (
    <g transform={`translate(${x + jx} ${y}) rotate(${rot + (buzzing ? Math.sin(frame * 3.1) * 1.5 : 0)}) scale(${s})`}>
      <ellipse cx={4} cy={16} rx={92} ry={18} fill="#000" opacity={0.25} />
      <rect x={-84} y={-38} width={168} height={76} rx={16} fill="#1c1b1a" />
      <rect x={-77} y={-31} width={154} height={62} rx={11} fill={active ? '#f8ecd2' : '#2a2928'} />
      {active ? (
        <g>
          <circle cx={-48} cy={0} r={14} fill="#d9c6a4" />
          <rect x={-24} y={-12} width={60} height={8} rx={4} fill="#cdb894" />
          <rect x={-24} y={4} width={36} height={8} rx={4} fill="#e0d0b2" />
          <circle cx={56} cy={-10} r={9} fill="#7fb37a" />
          <circle cx={56} cy={14} r={9} fill="#d77b6b" />
        </g>
      ) : null}
    </g>
  );
};

export const SmallDiary: React.FC<{x: number; y: number; glow?: number}> = ({x, y, glow = 0}) => (
  <g transform={`translate(${x} ${y})`}>
    <path d="M -150 -30 L -6 -38 L -6 34 L -158 26 Z" fill={P.paper} />
    <path d="M 6 -38 L 150 -30 L 158 26 L 6 34 Z" fill={P.paperShade} />
    <path d="M -6 -38 L 6 -38 L 6 34 L -6 34 Z" fill="#cdbb9a" />
    {[-18, -4, 10].map((ly) => (
      <g key={ly}>
        <line x1={-140} y1={ly} x2={-20} y2={ly - 4} stroke={P.paperLine} strokeWidth={3} />
        <line x1={20} y1={ly - 4} x2={146} y2={ly} stroke={P.paperLine} strokeWidth={3} />
      </g>
    ))}
    <path d="M -120 -20 L -60 -22 M 40 0 L 110 2" stroke={P.ink} strokeWidth={3} opacity={0.6} />
    <path d="M -120 4 L -50 2" stroke={P.amberInk} strokeWidth={4} opacity={glow} />
  </g>
);

export const Desk: React.FC<{ring: number; ringEnd?: number; diaryGlow?: number}> = ({ring, ringEnd, diaryGlow}) => (
  <g>
    <rect x={500} y={1528} width={640} height={84} rx={6} fill={P.woodLight} />
    <rect x={500} y={1600} width={640} height={10} fill={P.brass} />
    <rect x={500} y={1610} width={640} height={400} fill={P.wood} />
    {Array.from({length: 16}).map((_, i) => (
      <line key={i} x1={520 + i * 40} y1={1612} x2={520 + i * 40} y2={1960} stroke={P.woodDark} strokeWidth={3} opacity={0.5} />
    ))}
    <rect x={500} y={1610} width={640} height={30} fill="#000" opacity={0.15} />
    {/* succulent */}
    <g transform="translate(1046 1508)">
      <path d="M -34 0 L 34 0 L 28 44 L -28 44 Z" fill="#e6dac3" />
      {[-30, -10, 10, 30, 0].map((a, i) => (
        <path key={i} transform={`rotate(${a * 1.6})`} d="M 0 0 C -12 -20 -8 -44 0 -52 C 8 -44 12 -20 0 0 Z" fill={i % 2 ? P.leaf2 : P.sageDeep} />
      ))}
    </g>
    <SmallDiary x={DIARY.x} y={DIARY.y} glow={diaryGlow} />
    <PhoneFlat x={PHONE.x} y={PHONE.y} ring={ring} ringEnd={ringEnd} />
  </g>
);

/* ─────────────── light ─────────────── */

export const Glow: React.FC<{id: string; x: number; y: number; r: number; o: number; core?: string; edge?: string}> = ({id, x, y, r, o, core = P.amberCore, edge = P.amber}) => (
  <g opacity={o}>
    <defs>
      <radialGradient id={id}>
        <stop offset="0" stopColor={core} stopOpacity={1} />
        <stop offset="0.25" stopColor={edge} stopOpacity={0.75} />
        <stop offset="0.6" stopColor={edge} stopOpacity={0.18} />
        <stop offset="1" stopColor={edge} stopOpacity={0} />
      </radialGradient>
    </defs>
    <circle cx={x} cy={y} r={r} fill={`url(#${id})`} />
  </g>
);

/** Smooth Catmull-Rom path through control points, sampled to n points. */
export const spline = (pts: [number, number][], n = 160): [number, number][] => {
  const out: [number, number][] = [];
  const P2 = [pts[0], ...pts, pts[pts.length - 1]];
  const segs = pts.length - 1;
  for (let k = 0; k <= n; k++) {
    const u = (k / n) * segs;
    const i = Math.min(segs - 1, Math.floor(u));
    const t = u - i;
    const [p0, p1, p2, p3] = [P2[i], P2[i + 1], P2[i + 2], P2[i + 3]];
    const f = (a: number, b: number, c: number, d: number) =>
      0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
    out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
  }
  return out;
};

/** Ribbon of amber light travelling along `pts`. head 0→1, tail length as a fraction. */
export const Ribbon: React.FC<{id: string; pts: [number, number][]; head: number; tail?: number; width?: number; o?: number}> = ({
  id,
  pts,
  head,
  tail = 0.45,
  width = 16,
  o = 1,
}) => {
  const frame = useCurrentFrame();
  const n = pts.length - 1;
  const hi = Math.round(Math.max(0, Math.min(1, head)) * n);
  const ti = Math.max(0, Math.round((head - tail) * n));
  if (hi <= ti || o <= 0) return null;
  const segs: React.ReactNode[] = [];
  for (let i = ti; i < hi; i++) {
    const a = (i - ti) / Math.max(1, hi - ti);
    const wob = Math.sin(i / 6 - frame / 5) * 2;
    segs.push(
      <line
        key={i}
        x1={pts[i][0]}
        y1={pts[i][1] + wob}
        x2={pts[i + 1][0]}
        y2={pts[i + 1][1] + wob}
        stroke={P.amberSoft}
        strokeWidth={width * (0.35 + 0.65 * a)}
        strokeLinecap="round"
        opacity={a}
      />,
    );
  }
  const [hx, hy] = pts[hi];
  return (
    <g opacity={o}>
      <defs>
        <filter id={`${id}-b`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={width * 0.9} />
        </filter>
      </defs>
      <g filter={`url(#${id}-b)`}>{segs}</g>
      <g>{segs}</g>
      <Glow id={`${id}-h`} x={hx} y={hy} r={width * 6} o={1} />
      {Array.from({length: 10}).map((_, k) => {
        const age = (frame + k * 7) % 24;
        const back = Math.max(ti, hi - Math.round(age * 1.5));
        const [sx, sy] = pts[back];
        return (
          <circle
            key={k}
            cx={sx + (random(`${id}sx${k}`) - 0.5) * 60}
            cy={sy + (random(`${id}sy${k}`) - 0.5) * 60 - age * 1.5}
            r={2 + random(`${id}sr${k}`) * 4}
            fill={P.amberCore}
            opacity={(1 - age / 24) * 0.9}
          />
        );
      })}
    </g>
  );
};

/* ─────────────── post ─────────────── */

export const Grain: React.FC<{o?: number}> = ({o = 0.07}) => {
  const frame = useCurrentFrame();
  const i = Math.floor(frame / 2) % 6;
  return (
    <AbsoluteFill style={{mixBlendMode: 'overlay', opacity: o, pointerEvents: 'none'}}>
      <Img src={staticFile(`grain${i}.png`)} style={{width: 1080, height: 1920}} />
    </AbsoluteFill>
  );
};

export const Vignette: React.FC<{o?: number}> = ({o = 0.55}) => (
  <AbsoluteFill style={{background: 'radial-gradient(ellipse 75% 60% at 50% 48%, transparent 55%, rgba(20,12,6,0.9) 100%)', opacity: o, mixBlendMode: 'multiply'}} />
);

export const HandText: React.FC<{x: number; y: number; size: number; text: string; color: string; p?: number; id: string; glow?: boolean; anchor?: 'start' | 'middle'}> = ({
  x,
  y,
  size,
  text,
  color,
  p = 1,
  id,
  glow,
  anchor = 'start',
}) => {
  const w = text.length * size * 0.46 + size;
  const x0 = anchor === 'middle' ? x - w / 2 : x;
  return (
    <g>
      <defs>
        <clipPath id={`${id}-c`}>
          <rect x={x0 - 10} y={y - size * 1.1} width={(w + 20) * p} height={size * 1.6} />
        </clipPath>
        {glow ? (
          <filter id={`${id}-g`} x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur stdDeviation={size * 0.18} />
          </filter>
        ) : null}
      </defs>
      <g clipPath={`url(#${id}-c)`}>
        {glow ? (
          <text x={x} y={y} fontFamily={HAND} fontWeight={600} fontSize={size} fill={P.amber} textAnchor={anchor} filter={`url(#${id}-g)`} opacity={0.9}>
            {text}
          </text>
        ) : null}
        <text x={x} y={y} fontFamily={HAND} fontWeight={600} fontSize={size} fill={color} textAnchor={anchor}>
          {text}
        </text>
      </g>
      {glow && p > 0 && p < 1 ? <Glow id={`${id}-nib`} x={x0 + (w + 20) * p - 10} y={y - size * 0.3} r={size * 0.9} o={1} /> : null}
    </g>
  );
};
