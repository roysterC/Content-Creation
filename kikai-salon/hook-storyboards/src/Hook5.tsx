import React from 'react';
import {AbsoluteFill} from 'remotion';
import {AmberLight, Caption, CallScreen, Grade, PH, PW, ScreenState} from './common';
import {Diary, FlatLay, SAT, SUN} from './diary';

/** A phone lying flat on the table (2D, inside FlatLay). */
const FlatPhone: React.FC<{x: number; y: number; rot: number; state: ScreenState}> = ({x, y, rot, state}) => (
  <div style={{position: 'absolute', left: x, top: y, width: PW, height: PH, rotate: `${rot}deg`}}>
    <div style={{position: 'absolute', inset: 0, borderRadius: 62, background: '#0a0a0b', boxShadow: '0 26px 50px rgba(0,0,0,0.6), 0 4px 10px rgba(0,0,0,0.5), inset 0 0 0 3px #4a4b4f'}} />
    <div style={{position: 'absolute', inset: 12, borderRadius: 52, overflow: 'hidden'}}>
      <CallScreen state={state} />
    </div>
    <div style={{position: 'absolute', inset: 0, borderRadius: 62, background: 'linear-gradient(130deg, rgba(255,255,255,0.14), rgba(255,255,255,0) 40%, rgba(255,255,255,0.06) 75%, rgba(255,255,255,0))'}} />
  </div>
);

/** Graphite pencil; tip at (0,0), body extending along +x. */
const Pencil: React.FC<{x: number; y: number; rot: number; lift: number; blur?: number}> = ({x, y, rot, lift, blur = 0}) => (
  <svg width={1600} height={2400} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
    <defs>
      <linearGradient id="pBody" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#2a2c30" />
        <stop offset="0.3" stopColor="#4a4e55" />
        <stop offset="0.34" stopColor="#1c1d20" />
        <stop offset="0.66" stopColor="#2e3035" />
        <stop offset="0.7" stopColor="#141517" />
        <stop offset="1" stopColor="#0c0c0e" />
      </linearGradient>
      <linearGradient id="pWood" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#e4c08f" />
        <stop offset="0.5" stopColor="#f3d9b0" />
        <stop offset="1" stopColor="#b98c5a" />
      </linearGradient>
      <linearGradient id="pFerrule" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#8c6a2a" />
        <stop offset="0.35" stopColor="#f1d690" />
        <stop offset="0.6" stopColor="#a8822f" />
        <stop offset="1" stopColor="#5e4618" />
      </linearGradient>
      <filter id="pShadow" x="-20%" y="-50%" width="140%" height="200%">
        <feGaussianBlur stdDeviation={8 + lift * 0.2} />
      </filter>
      <filter id="pMotion" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation={`${blur} 1`} />
      </filter>
    </defs>
    {/* shadow on the paper, offset by height */}
    <g transform={`translate(${x + lift * 0.8} ${y + lift * 1.1}) rotate(${rot})`} filter="url(#pShadow)" opacity={0.45 - lift * 0.0015}>
      <path d="M 0 0 L 90 -22 L 900 -22 L 900 22 L 90 22 Z" fill="#000" />
    </g>
    <g transform={`translate(${x} ${y}) rotate(${rot})`} filter={blur ? 'url(#pMotion)' : undefined}>
      <path d="M 0 0 L 90 -22 L 90 22 Z" fill="url(#pWood)" />
      <path d="M 0 0 L 26 -7 L 26 7 Z" fill="#2a2a2c" />
      <path d="M 90 -22 C 96 -14 96 14 90 22" fill="#c9a274" />
      <rect x={90} y={-22} width={700} height={44} fill="url(#pBody)" />
      <rect x={788} y={-23} width={70} height={46} fill="url(#pFerrule)" />
      {[800, 815, 840].map((fx) => (
        <rect key={fx} x={fx} y={-23} width={3} height={46} fill="#5e4618" opacity={0.6} />
      ))}
      <rect x={856} y={-21} width={58} height={42} rx={8} fill="#d98c8a" />
      <rect x={856} y={-21} width={58} height={14} rx={6} fill="#efb3b0" opacity={0.6} />
      <rect x={90} y={-16} width={700} height={4} fill="#fff" opacity={0.18} />
    </g>
  </svg>
);

export const Hook5: React.FC<{beat: number}> = ({beat}) => {
  const left = beat === 2 ? [...SAT.filter((e) => e.row !== 3), {row: 3, text: 'New · cut & colour', amber: true, rot: -0.5}] : SAT.filter((e) => e.row !== 3);
  const phoneState: ScreenState = beat === 2 ? 'kikai' : 'incoming';
  return (
    <AbsoluteFill style={{background: '#20140c'}}>
      <FlatLay tilt={22} scale={1.1} ox={-20} oy={-80}>
        <Diary x={330} y={760} rot={-2} left={left} right={SUN} />
        <FlatPhone x={1180} y={180} rot={14} state={phoneState} />
        {/* empty-slot hint: soft spotlight */}
        {beat < 2 ? <div style={{position: 'absolute', left: 470, top: 1100, width: 520, height: 74, borderRadius: 10, boxShadow: '0 0 0 2px rgba(200,120,40,0.35)', rotate: '-2deg'}} /> : null}
        {beat === 0 ? <Pencil x={650} y={1175} rot={-28} lift={70} /> : null}
        {beat === 1 ? <Pencil x={80} y={980} rot={-24} lift={110} blur={40} /> : null}
      </FlatLay>
      {beat === 2 ? <AmberLight x={480} y={960} r={600} o={0.6} /> : null}
      {beat === 2 ? <AmberLight x={1000} y={160} r={420} o={0.5} /> : null}
      {beat === 1 ? <Caption text="One gap." top={1500} size={130} /> : null}
      <Grade frame={beat + 2} vignette={0.6} />
    </AbsoluteFill>
  );
};
