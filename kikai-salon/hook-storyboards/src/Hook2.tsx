import React from 'react';
import {AbsoluteFill, staticFile} from 'remotion';
import {AmberLight, Box3D, Caption, Grade, PD, Phone3D, SalonBokeh, World} from './common';

/** Overhead macro: phone flat on a stone station counter. */
const Counter: React.FC = () => (
  <Box3D
    w={3000}
    h={60}
    d={3000}
    t={`translate3d(0px, 30px, 0px)`}
    top={{
      backgroundImage: `radial-gradient(ellipse 60% 50% at 55% 45%, rgba(255,245,225,0.15), rgba(0,0,0,0.35) 100%), url(${staticFile('stone.jpg')})`,
      backgroundSize: '100% 100%, 3000px 3000px',
    }}
  />
);

// fingertip target (screen px) — the Accept button
export const ACCEPT = {x: 708, y: 1352};

/** Black nitrile-gloved index finger; tip at (tx, ty), hand out of frame top-right. */
const FINGER = 'M 70 -84 C 260 -92 520 -104 760 -112 C 1100 -150 1500 -180 2000 -200 L 2000 260 C 1500 210 1100 170 760 112 C 520 104 260 94 70 86 C -40 84 -40 -84 70 -84 Z';
const MIDDLE = 'M 640 120 C 700 96 860 92 940 120 C 1000 180 1000 300 920 330 C 820 350 680 320 630 250 C 610 200 610 150 640 120 Z';

const GlovedFinger: React.FC<{tx: number; ty: number; lift: number; blur?: number}> = ({tx, ty, lift, blur = 0}) => {
  const ang = -52;
  return (
    <>
      <svg width={1080} height={1920} style={{position: 'absolute', mixBlendMode: 'multiply'}}>
        <defs>
          <filter id="fsh" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={12 + lift * 0.3} />
          </filter>
        </defs>
        <g transform={`translate(${tx - lift * 1.1} ${ty + lift * 0.55}) rotate(${ang})`} filter="url(#fsh)" opacity={0.6 - lift * 0.0015}>
          <path d={FINGER} fill="#000" />
          <path d={MIDDLE} fill="#000" />
        </g>
      </svg>
      <svg width={1080} height={1920} style={{position: 'absolute', filter: blur ? `blur(${blur}px)` : undefined}}>
        <defs>
          <linearGradient id="glv" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0a0b0d" />
            <stop offset="0.12" stopColor="#22252b" />
            <stop offset="0.3" stopColor="#2c2f36" />
            <stop offset="0.45" stopColor="#1d1f24" />
            <stop offset="0.8" stopColor="#0f1013" />
            <stop offset="1" stopColor="#050506" />
          </linearGradient>
          <linearGradient id="glvM" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#30333a" />
            <stop offset="0.5" stopColor="#141518" />
            <stop offset="1" stopColor="#060607" />
          </linearGradient>
          <filter id="s3"><feGaussianBlur stdDeviation={3} /></filter>
          <filter id="s8"><feGaussianBlur stdDeviation={8} /></filter>
          <radialGradient id="tint" cx="0.38" cy="0.32">
            <stop offset="0" stopColor="#8a4450" />
            <stop offset="0.55" stopColor="#521f2b" />
            <stop offset="1" stopColor="#2a0f15" />
          </radialGradient>
          <clipPath id="fclip"><path d={FINGER} /></clipPath>
        </defs>
        <g transform={`translate(${tx} ${ty}) rotate(${ang})`}>
          <path d={MIDDLE} fill="url(#glvM)" />
          <path d="M 680 140 C 760 120 880 124 930 150" stroke="#6a6f7a" strokeWidth={8} fill="none" opacity={0.5} filter="url(#s3)" />
          <path d={FINGER} fill="url(#glv)" />
          <g clipPath="url(#fclip)">
            {/* broad sheen + sharp specular along the top of the finger */}
            <path d="M 40 -40 C 300 -52 700 -70 2000 -120" stroke="#8d929c" strokeWidth={34} fill="none" opacity={0.35} filter="url(#s8)" />
            <path d="M 60 -46 C 300 -56 640 -70 1200 -96" stroke="#e8ecf2" strokeWidth={5} fill="none" opacity={0.75} filter="url(#s3)" />
            {/* knuckle creases: rings of fine wrinkles */}
            {[300, 330, 360, 700, 735].map((x, i) => (
              <g key={x}>
                <path d={`M ${x} -110 Q ${x + 26} 0 ${x} 120`} stroke="#000" strokeWidth={4} fill="none" opacity={0.7} filter="url(#s3)" />
                <path d={`M ${x + 8} -104 Q ${x + 34} 0 ${x + 8} 114`} stroke="#5d626c" strokeWidth={2.5} fill="none" opacity={i % 2 ? 0.35 : 0.55} filter="url(#s3)" />
              </g>
            ))}
            {/* warm rim light from the salon */}
            <path d="M 40 80 C 300 92 700 108 2000 250" stroke="#ff9c55" strokeWidth={10} fill="none" opacity={0.28} filter="url(#s8)" />
            {/* hair-colour smears: streaky, semi-gloss */}
            {[
              'M 150 -20 C 190 -40 260 -36 300 -10 C 320 10 280 30 240 26 C 200 22 170 30 150 14 Z',
              'M 520 30 C 560 10 640 14 700 40 C 720 60 660 74 600 66 C 560 62 530 56 520 30 Z',
              'M 60 40 C 80 30 120 34 130 48 C 120 62 80 64 60 40 Z',
              'M 380 -70 C 420 -82 470 -80 490 -66 C 470 -54 420 -52 380 -70 Z',
            ].map((d, i) => (
              <g key={i}>
                <path d={d} fill="#4a2119" opacity={0.92} />
                <path d={d} fill="none" stroke="#7a3a2a" strokeWidth={3} opacity={0.6} />
              </g>
            ))}
            <path d="M 170 -22 C 210 -32 250 -30 280 -16" stroke="#fff" strokeWidth={4} fill="none" opacity={0.45} filter="url(#s3)" />
            <path d="M 540 22 C 580 12 630 16 670 30" stroke="#fff" strokeWidth={4} fill="none" opacity={0.4} filter="url(#s3)" />
            {/* fingertip highlight */}
            <ellipse cx={30} cy={-34} rx={34} ry={14} fill="#fff" opacity={0.35} filter="url(#s8)" />
          </g>
        </g>
      </svg>
    </>
  );
};

export const Hook2: React.FC<{beat: number}> = ({beat}) => {
  const state = beat === 0 ? 'incoming' : beat === 1 ? 'missed' : 'kikai';
  const lift = beat === 0 ? 70 : beat === 1 ? 40 : 190;
  const tip = beat === 2 ? {x: ACCEPT.x + 190, y: ACCEPT.y - 260} : {x: ACCEPT.x + 14, y: ACCEPT.y - 10};
  return (
    <AbsoluteFill style={{background: '#1b130e'}}>
      <SalonBokeh seed="h2" figure={false} />
      <World cx={540} cy={1060} tilt={-62} persp={1500} dist={-430}>
        <Counter />
        <div
          style={{
            position: 'absolute',
            left: -260,
            top: -500,
            width: 520,
            height: 1000,
            transform: `translate3d(0, -0.5px, 0) rotateX(90deg) rotateZ(-6deg)`,
            background: 'radial-gradient(closest-side, rgba(0,0,0,0.75), rgba(0,0,0,0))',
            filter: 'blur(14px)',
          }}
        />
        <Phone3D t={`translate3d(0px, ${-PD / 2 - 1}px, 0px) rotateX(90deg) rotateZ(-6deg)`} state={state} />
      </World>
      {beat === 2 ? <AmberLight x={ACCEPT.x - 160} y={ACCEPT.y - 380} r={820} o={0.75} /> : null}
      <GlovedFinger tx={tip.x} ty={tip.y} lift={lift} blur={beat === 2 ? 3 : 0} />
      {beat === 0 ? <Caption text="Almost…" top={210} size={124} /> : null}
      {beat === 2 ? (
        <div style={{position: 'absolute', top: 120, left: 70, display: 'flex', alignItems: 'center', gap: 14, padding: '14px 26px', borderRadius: 99, background: 'rgba(0,0,0,0.45)', color: '#fff', fontFamily: 'Inter', fontWeight: 600, fontSize: 34, letterSpacing: 2}}>
          <svg width={44} height={28} viewBox="0 0 44 28">
            <path d="M22 0 L0 14 L22 28 Z M44 0 L22 14 L44 28 Z" fill="#fff" />
          </svg>
          REWIND
        </div>
      ) : null}
      <Grade frame={beat + 3} vignette={0.5} />
    </AbsoluteFill>
  );
};
