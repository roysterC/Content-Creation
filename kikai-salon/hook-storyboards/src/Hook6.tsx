import React from 'react';
import {AbsoluteFill, staticFile} from 'remotion';
import {AmberLight, Box3D, Caption, Grade, PD, PH, Phone3D, SalonBokeh, SANS, World} from './common';

const EDGE = 260;
const BASE_Y = 1456; // screen y of the bottles' base line on the desk

type Bottle = {kind: 'pump' | 'spray' | 'tube' | 'round' | 'can'; w: number; h: number; body: string[]; cap: string; label: string; sub: string; ink: string};
const BOTTLES: Bottle[] = [
  {kind: 'pump', w: 150, h: 430, body: ['#4f6b55', '#9cbca2', '#6f8f76', '#3d5543'], cap: '#1f1f1f', label: 'BRAMBLE', sub: 'Shampoo', ink: '#f2ece0'},
  {kind: 'spray', w: 140, h: 450, body: ['#cfc6b8', '#ffffff', '#e7e0d4', '#b3a998'], cap: '#2b2a28', label: 'HEAT', sub: 'Protect spray', ink: '#3a3128'},
  {kind: 'tube', w: 130, h: 420, body: ['#e6dccb', '#fffaf0', '#efe6d6', '#c8bba5'], cap: '#5f7a62', label: 'BRAMBLE', sub: 'Conditioner', ink: '#4a3a2c'},
  {kind: 'pump', w: 150, h: 440, body: ['#8a4f21', '#e8a45a', '#b8742f', '#6e3c16'], cap: '#1f1f1f', label: 'BRAMBLE', sub: 'Gloss oil', ink: '#fff3df'},
  {kind: 'can', w: 120, h: 460, body: ['#8e949b', '#f4f6f8', '#b9bfc5', '#6b7178'], cap: '#2b2a28', label: 'HOLD', sub: 'Hairspray', ink: '#2b2a28'},
];

const BottleArt: React.FC<{b: Bottle; id: string}> = ({b, id}) => {
  const {w, h} = b;
  const bodyTop = b.kind === 'can' ? 70 : b.kind === 'tube' ? 30 : 110;
  const bodyH = h - bodyTop;
  return (
    <svg width={w + 80} height={h + 20} viewBox={`-40 0 ${w + 80} ${h + 20}`} style={{position: 'absolute', left: -40, top: 0, overflow: 'visible'}}>
      <defs>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={b.body[3]} />
          <stop offset="0.22" stopColor={b.body[1]} />
          <stop offset="0.5" stopColor={b.body[2]} />
          <stop offset="0.85" stopColor={b.body[0]} />
          <stop offset="1" stopColor={b.body[3]} />
        </linearGradient>
        <linearGradient id={`${id}c`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity={0.5} />
          <stop offset="0.3" stopColor="#fff" stopOpacity={0.25} />
          <stop offset="1" stopColor="#000" stopOpacity={0.6} />
        </linearGradient>
      </defs>
      {/* body */}
      {b.kind === 'round' ? (
        <path d={`M 0 ${bodyTop + 50} Q 0 ${bodyTop} ${w * 0.3} ${bodyTop} L ${w * 0.7} ${bodyTop} Q ${w} ${bodyTop} ${w} ${bodyTop + 50} L ${w} ${h - 14} Q ${w} ${h} ${w - 14} ${h} L 14 ${h} Q 0 ${h} 0 ${h - 14} Z`} fill={`url(#${id}b)`} />
      ) : b.kind === 'tube' ? (
        <path d={`M 6 ${bodyTop} L ${w - 6} ${bodyTop} L ${w * 0.86} ${h - 60} L ${w * 0.14} ${h - 60} Z`} fill={`url(#${id}b)`} />
      ) : (
        <rect x={0} y={bodyTop} width={w} height={bodyH} rx={b.kind === 'can' ? 8 : 26} fill={`url(#${id}b)`} />
      )}
      {/* specular streak */}
      <rect x={w * 0.18} y={bodyTop + 20} width={w * 0.07} height={bodyH - 60} rx={4} fill="#fff" opacity={0.45} />
      {/* caps / heads */}
      {b.kind === 'pump' ? (
        <g>
          <rect x={w * 0.3} y={bodyTop - 26} width={w * 0.4} height={30} rx={6} fill={b.cap} />
          <rect x={w * 0.43} y={30} width={w * 0.14} height={bodyTop - 50} fill="#2a2a2a" />
          <path d={`M ${w * 0.32} 10 L ${w * 0.68} 10 L ${w * 0.68} 40 L ${w * 0.32} 40 Z M ${w * 0.32} 14 L ${-w * 0.08} 18 L ${-w * 0.08} 30 L ${w * 0.32} 32 Z`} fill={b.cap} />
          <rect x={w * 0.3} y={bodyTop - 26} width={w * 0.4} height={30} rx={6} fill={`url(#${id}c)`} />
        </g>
      ) : b.kind === 'spray' ? (
        <g>
          <rect x={w * 0.3} y={bodyTop - 24} width={w * 0.4} height={28} rx={5} fill={b.cap} />
          <path d={`M ${w * 0.25} ${bodyTop - 24} L ${w * 0.25} 20 Q ${w * 0.3} 0 ${w * 0.6} 4 L ${w * 0.95} 8 L ${w * 0.95} 40 L ${w * 0.7} 44 L ${w * 0.72} ${bodyTop - 24} Z`} fill={b.cap} />
          <path d={`M ${w * 0.5} 44 Q ${w * 0.4} 80 ${w * 0.55} 92`} stroke={b.cap} strokeWidth={12} fill="none" strokeLinecap="round" />
        </g>
      ) : b.kind === 'tube' ? (
        <g>
          <rect x={w * 0.2} y={h - 62} width={w * 0.6} height={62} rx={10} fill={b.cap} />
          <rect x={w * 0.2} y={h - 62} width={w * 0.6} height={62} rx={10} fill={`url(#${id}c)`} />
          <rect x={0} y={bodyTop - 26} width={w} height={26} rx={3} fill={b.body[3]} />
        </g>
      ) : b.kind === 'round' ? (
        <g>
          <rect x={w * 0.2} y={bodyTop - 70} width={w * 0.6} height={72} rx={10} fill={b.cap} />
          <rect x={w * 0.2} y={bodyTop - 70} width={w * 0.6} height={72} rx={10} fill={`url(#${id}c)`} />
        </g>
      ) : (
        <g>
          <path d={`M 8 ${bodyTop} Q ${w * 0.5} ${bodyTop - 40} ${w - 8} ${bodyTop} Z`} fill={b.body[2]} />
          <rect x={w * 0.12} y={6} width={w * 0.76} height={bodyTop - 14} rx={14} fill={b.cap} />
          <rect x={w * 0.12} y={6} width={w * 0.76} height={bodyTop - 14} rx={14} fill={`url(#${id}c)`} />
        </g>
      )}
      {/* label */}
      <g fontFamily={SANS} textAnchor="middle" fill={b.ink}>
        <text x={w / 2} y={bodyTop + bodyH * 0.42} fontSize={w * 0.17} fontWeight={600} letterSpacing={3}>
          {b.label}
        </text>
        <text x={w / 2} y={bodyTop + bodyH * 0.42 + w * 0.17} fontSize={w * 0.11} opacity={0.85}>
          {b.sub}
        </text>
      </g>
      <rect x={0} y={bodyTop} width={w} height={bodyH} rx={b.kind === 'can' ? 8 : 26} fill={`url(#${id}c)`} opacity={b.kind === 'tube' || b.kind === 'round' ? 0 : 0.35} />
    </svg>
  );
};

export const Hook6: React.FC<{beat: number}> = ({beat}) => {
  const spacing = 192;
  const x0 = -70;
  // tilt (deg) per bottle, toppling to the right
  const tilts =
    beat === 0 ? [18, 0, 0, 0, 0] : beat === 1 ? [66, 57, 46, 35, 27] : [66, 57, 46, 35, 12];
  return (
    <AbsoluteFill style={{background: '#1a0f09'}}>
      <SalonBokeh seed="h6" />
      <World cx={540} cy={1400} tilt={-16} persp={1300} dist={140}>
        <Box3D
          w={2800}
          h={80}
          d={1600}
          t={`translate3d(0px, 40px, ${EDGE - 800}px)`}
          top={{backgroundImage: `linear-gradient(180deg, rgba(20,10,4,0.6) 0%, rgba(20,10,4,0) 50%), url(${staticFile('oak.jpg')})`, backgroundSize: '100% 100%, 2600px 1600px'}}
          front={{backgroundImage: `linear-gradient(180deg, #e2bd63 0px, #a8832f 7px, rgba(20,10,4,0.3) 8px, rgba(10,5,2,0.7) 100%), url(${staticFile('oak.jpg')})`, backgroundSize: '100% 100%, 2600px 1600px'}}
        />
        <Phone3D t={`translate3d(640px, ${-PD / 2 - 1}px, ${EDGE - 230}px) rotateX(90deg) rotateZ(-84deg)`} state={beat === 2 ? 'kikai' : 'incoming'} glow={beat === 2 ? 1 : 0} />
      </World>
      <AbsoluteFill style={{backdropFilter: 'blur(10px)', WebkitMaskImage: 'linear-gradient(180deg, #000 0%, #000 40%, transparent 52%)', maskImage: 'linear-gradient(180deg, #000 0%, #000 40%, transparent 52%)'}} />
      {BOTTLES.map((b, i) => {
        const left = x0 + i * spacing;
        return (
          <div key={i} style={{position: 'absolute', left, top: BASE_Y - b.h, width: b.w, height: b.h}}>
            {/* contact shadow */}
            <div style={{position: 'absolute', left: -10, right: -30, bottom: -14, height: 26, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', filter: 'blur(8px)', opacity: tilts[i] > 30 ? 0.5 : 1}} />
            <div style={{position: 'absolute', inset: 0, transformOrigin: '100% 100%', rotate: `${tilts[i]}deg`, filter: beat === 1 && i === 5 ? 'none' : undefined}}>
              <BottleArt b={b} id={`b${i}`} />
            </div>
          </div>
        );
      })}
      {beat === 2 ? (
        <>
          <AmberLight x={880} y={1250} r={640} o={0.85} />
          <svg width={1080} height={1920} style={{position: 'absolute', mixBlendMode: 'screen'}}>
            <defs>
              <filter id="r6"><feGaussianBlur stdDeviation={12} /></filter>
            </defs>
            <path d="M 1060 1500 C 1020 1300 940 1160 830 1060" stroke="#ffcf7a" strokeWidth={30} fill="none" strokeLinecap="round" filter="url(#r6)" />
            <path d="M 1060 1500 C 1020 1300 940 1160 830 1060" stroke="#fff1cc" strokeWidth={5} fill="none" strokeLinecap="round" />
          </svg>
        </>
      ) : null}
      {beat === 1 ? <Caption text="Wait for it." top={330} size={120} /> : null}
      <Grade frame={beat + 5} />
    </AbsoluteFill>
  );
};
