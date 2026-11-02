import React from 'react';
import {AbsoluteFill, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';

for (const w of ['600', '800']) loadFont({family: 'Inter', url: staticFile(`inter-${w}.woff2`), weight: w});
for (const w of ['400', '600']) loadFont({family: 'Plex Mono', url: staticFile(`mono-${w}.woff2`), weight: w});
const SANS = 'Inter, sans-serif';
const MONO = '"Plex Mono", monospace';
const C = {bg: '#0a0e14', ink: '#e9eef5', dim: '#8b98a9', ok: '#3ddc84', bad: '#ff4d5e', amber: '#ffb020', req: '#39d0ff'};

// Question-hook cover: one big question, one picture (two drivers closing in on one door).
// Everything that matters sits inside the 3:4 band (y 240–1680) Instagram keeps on the profile grid.
const QUESTIONS: Record<string, React.ReactNode[]> = {
  a: [
    'Why did',
    <>
      <span style={{color: C.bad}}>TWO</span> drivers
    </>,
    'turn up?',
  ],
  b: [
    <>
      Would <span style={{color: C.amber}}>your</span>
    </>,
    'app send',
    <>
      <span style={{color: C.bad}}>TWO</span> drivers?
    </>,
  ],
};

const Note: React.FC<{name: string; col: string; y: number; tilt: number}> = ({name, col, y, tilt}) => (
  <div style={{position: 'absolute', left: 80, right: 80, top: y, padding: '22px 28px', borderRadius: 26, background: 'rgba(20,27,38,0.97)', border: `4px solid ${col}`, display: 'flex', alignItems: 'center', gap: 20, rotate: `${tilt}deg`, boxShadow: `0 18px 40px rgba(0,0,0,0.5), 0 0 40px ${col}33`}}>
    <span style={{fontSize: 52}}>🛵</span>
    <div>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 44, color: C.ink}}>{name} is on the way</div>
      <div style={{fontFamily: MONO, fontSize: 28, color: C.dim, marginTop: 2}}>your order · A12</div>
    </div>
  </div>
);

export const CoverQ: React.FC<{variant?: 'a' | 'b'}> = ({variant = 'a'}) => {
  const q = QUESTIONS[variant];
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <AbsoluteFill style={{backgroundImage: 'radial-gradient(rgba(140,160,190,0.09) 1.5px, transparent 1.5px)', backgroundSize: '36px 36px'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 70% 40% at 50% 78%, rgba(255,77,94,0.16), rgba(0,0,0,0) 70%)'}} />
      {/* the question */}
      <div style={{position: 'absolute', top: 270, left: 70, right: 60}}>
        {q.map((line, i) => (
          <div key={i} style={{fontFamily: SANS, fontWeight: 800, fontSize: variant === 'b' ? 124 : 132, lineHeight: 1.0, whiteSpace: 'nowrap', letterSpacing: -5, color: C.ink}}>
            {line}
          </div>
        ))}
      </div>
      {/* two notifications, both for the same order */}
      <Note name="Sam" col={C.ok} y={720} tilt={-1.5} />
      <Note name="Priya" col={C.bad} y={880} tilt={1.5} />
      {/* the street: two scooters closing in on one door */}
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <rect x={60} y={1290} width={960} height={70} rx={35} fill="#151e2b" />
        <line x1={110} y1={1325} x2={970} y2={1325} stroke="#2a3a50" strokeWidth={5} strokeDasharray="26 22" />
        {/* trails */}
        <path d="M 120 1325 L 390 1325" stroke={C.ok} strokeWidth={8} strokeDasharray="4 18" strokeLinecap="round" opacity={0.8} />
        <path d="M 960 1325 L 690 1325" stroke={C.bad} strokeWidth={8} strokeDasharray="4 18" strokeLinecap="round" opacity={0.8} />
        {/* the house */}
        <circle cx={540} cy={1230} r={150} fill={C.bad} opacity={0.12} />
        <text x={540} y={1300} textAnchor="middle" fontSize={190}>
          🏠
        </text>
        {/* scooters */}
        <g transform="translate(330 1325)">
          <circle r={74} fill={C.ok} opacity={0.18} />
          <text y={-88} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={40} fill={C.ok}>
            Sam
          </text>
        </g>
        <g transform="translate(750 1325)">
          <circle r={74} fill={C.bad} opacity={0.18} />
          <text y={-88} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={40} fill={C.bad}>
            Priya
          </text>
        </g>
      </svg>
      {/* scooters as HTML so the left one can be mirrored to face the house (SVG emoji ignore flips) */}
      <div style={{position: 'absolute', left: 330 - 60, top: 1325 - 66, width: 120, textAlign: 'center', fontSize: 96, lineHeight: '120px', transform: 'scaleX(-1)'}}>🛵</div>
      <div style={{position: 'absolute', left: 750 - 60, top: 1325 - 66, width: 120, textAlign: 'center', fontSize: 96, lineHeight: '120px'}}>🛵</div>
      {/* what it teaches */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 1460, display: 'flex', justifyContent: 'center'}}>
        <div style={{padding: '14px 28px', borderRadius: 999, background: C.amber, color: '#1a1406', fontFamily: MONO, fontWeight: 600, fontSize: 32, letterSpacing: 1}}>idempotency · real system design</div>
      </div>
    </AbsoluteFill>
  );
};
