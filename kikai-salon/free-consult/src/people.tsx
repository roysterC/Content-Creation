import React from 'react';
import {random, useCurrentFrame} from 'remotion';
import {P} from './theme';

type Face = {
  turn: number; // -1 looking to frame-left … 0 front … 1 frame-right
  gaze?: number; // extra eye offset in the look direction
  brow?: number; // 0 rest → 1 raised
  smile?: number; // 0 neutral → 1 big smile
  open?: number; // mouth open (laugh/talk) 0..1
  blink?: number; // 0 open → 1 closed
  tilt?: number; // head tilt degrees
};

/** Priya's head, close-up scale (~420px tall). Origin = centre of face. */
export const PriyaHead: React.FC<Face> = ({turn, gaze = 0, brow = 0, smile = 0, open = 0, blink = 0, tilt = 0}) => {
  const fx = turn * 58;
  const sp = 62 * (1 - 0.28 * Math.abs(turn));
  const eyeY = 6;
  const near = turn >= 0 ? 1 : -1;
  const eye = (cx: number, big: number, k: string) => {
    const h = 15 * big * (1 - blink * 0.92);
    return (
      <g key={k}>
        <path d={`M ${cx - 26 * big} ${eyeY} Q ${cx} ${eyeY - h * 1.6} ${cx + 26 * big} ${eyeY} Q ${cx} ${eyeY + h * 1.1} ${cx - 26 * big} ${eyeY} Z`} fill="#f4ebe0" />
        {blink < 0.7 ? <circle cx={cx + gaze * 10 + turn * 5} cy={eyeY - 1} r={11 * big} fill="#2a1a14" /> : null}
        {blink < 0.7 ? <circle cx={cx + gaze * 10 + turn * 5 + 4} cy={eyeY - 5} r={3.5 * big} fill="#fff" /> : null}
        <path d={`M ${cx - 28 * big} ${eyeY + 1} Q ${cx} ${eyeY - h * 1.7 - 2} ${cx + 28 * big} ${eyeY - 2}`} stroke={P.hair} strokeWidth={6} fill="none" strokeLinecap="round" />
        <path d={`M ${cx - 16 * big} ${eyeY + 20} Q ${cx} ${eyeY + 26} ${cx + 16 * big} ${eyeY + 19}`} stroke={P.skinShade} strokeWidth={3} fill="none" opacity={0.45} />
      </g>
    );
  };
  const bY = -40 - brow * 16;
  const mouthW = 38 + smile * 10;
  return (
    <g transform={`rotate(${tilt})`}>
      {/* hair behind + bun */}
      <ellipse cx={-turn * 30} cy={-20} rx={178} ry={206} fill={P.hair} />
      <circle cx={-turn * 60} cy={-210} r={86} fill={P.hair} />
      <path d={`M ${-turn * 60 - 60} -230 Q ${-turn * 60} -280 ${-turn * 60 + 60} -230`} stroke={P.hairHi} strokeWidth={8} fill="none" />
      {/* neck */}
      <path d="M -62 140 L 62 140 L 70 300 L -70 300 Z" fill={P.skinShade} />
      {/* ears + hoops */}
      {[-1, 1].map((side) => {
        const vis = side === -near ? 1 : 1 - Math.abs(turn);
        const ex = side * (148 - Math.abs(turn) * 20) - turn * 26;
        return vis > 0.05 ? (
          <g key={side} opacity={vis}>
            <ellipse cx={ex} cy={20} rx={20} ry={34} fill={P.skin} />
            <circle cx={ex + side * 2} cy={84} r={34} fill="none" stroke={P.gold} strokeWidth={7} />
          </g>
        ) : null;
      })}
      {/* face */}
      <ellipse cx={fx * 0.25} cy={10} rx={148} ry={186} fill={P.skin} />
      <defs>
        <filter id="faceShade" x="-100%" y="-50%" width="300%" height="200%">
          <feGaussianBlur stdDeviation={28} />
        </filter>
      </defs>
      <ellipse cx={fx * 0.25 - turn * 95 - 40 * Math.sign(turn || 1)} cy={30} rx={50} ry={150} fill={P.skinShade} opacity={0.18 * Math.abs(turn)} filter="url(#faceShade)" />
      {/* cheeks */}
      <circle cx={fx - sp - 10} cy={78} r={34} fill="#c0675a" opacity={0.18 + smile * 0.1} />
      <circle cx={fx + sp + 10} cy={78} r={34} fill="#c0675a" opacity={0.18 + smile * 0.1} />
      {/* eyes */}
      {eye(fx - sp, near < 0 ? 1.08 : 0.92, 'l')}
      {eye(fx + sp, near > 0 ? 1.08 : 0.92, 'r')}
      {/* brows */}
      <path d={`M ${fx - sp - 32} ${bY + 8} Q ${fx - sp} ${bY - 10} ${fx - sp + 30} ${bY + 4 - brow * 4}`} stroke={P.hair} strokeWidth={11} fill="none" strokeLinecap="round" />
      <path d={`M ${fx + sp - 30} ${bY + 4 - brow * 4} Q ${fx + sp} ${bY - 10} ${fx + sp + 32} ${bY + 8}`} stroke={P.hair} strokeWidth={11} fill="none" strokeLinecap="round" />
      {/* nose */}
      <path d={`M ${fx + turn * 10} 20 Q ${fx + turn * 26 + 4} 70 ${fx + turn * 14 + 12} 86 Q ${fx} 94 ${fx - 14} 86`} stroke={P.skinShade} strokeWidth={5} fill="none" strokeLinecap="round" />
      {/* mouth */}
      {open > 0.05 ? (
        <path
          d={`M ${fx - mouthW} 120 Q ${fx} ${126 + 14 * smile + 28 * open} ${fx + mouthW} 120 Q ${fx} ${128 + smile * 4} ${fx - mouthW} 120 Z`}
          fill="#5a2a22"
        />
      ) : null}
      <path d={`M ${fx - mouthW} ${120 - smile * 4} Q ${fx} ${124 + smile * 16} ${fx + mouthW} ${120 - smile * 4}`} stroke="#6a3226" strokeWidth={6} fill="none" strokeLinecap="round" />
      <path d={`M ${fx - 18} 146 Q ${fx} 152 ${fx + 18} 146`} stroke={P.skinShade} strokeWidth={4} fill="none" opacity={0.5} />
      {/* hairline + loose strands */}
      <path
        d={`M -160 -10 Q -170 -180 ${fx * 0.4} -190 Q 170 -180 160 -10 Q 150 -110 ${fx * 0.4 + 40} -120 Q -40 -150 -120 -90 Q -150 -60 -160 -10 Z`}
        fill={P.hair}
      />
      <path d={`M ${-150 + turn * 10} -60 Q ${-170 + turn * 10} 40 ${-140 + turn * 10} 110`} stroke={P.hair} strokeWidth={6} fill="none" />
      <path d={`M ${150 + turn * 10} -60 Q ${168 + turn * 10} 30 ${144 + turn * 10} 96`} stroke={P.hair} strokeWidth={5} fill="none" />
    </g>
  );
};

/** Shoulders in sage tee + black apron. back=true shows crossed straps. */
export const PriyaShoulders: React.FC<{back?: boolean; drop?: number}> = ({back, drop = 0}) => (
  <g transform={`translate(0 ${drop})`}>
    <path d="M -330 560 Q -330 330 -150 290 L 150 290 Q 330 330 330 560 L 340 1100 L -340 1100 Z" fill={P.sageTee} />
    <path d="M -80 290 Q 0 330 80 290" stroke="#7d9b7d" strokeWidth={10} fill="none" />
    {back ? (
      <>
        <path d="M -150 300 L 120 800" stroke={P.charcoal} strokeWidth={56} />
        <path d="M 150 300 L -120 800" stroke={P.charcoal} strokeWidth={56} />
      </>
    ) : (
      <>
        <path d="M -120 300 L -150 520 L 150 520 L 120 300" stroke={P.charcoal} strokeWidth={40} fill="none" />
        <path d="M -170 500 L 170 500 L 200 1100 L -200 1100 Z" fill={P.charcoal} />
        <rect x={-70} y={600} width={140} height={90} rx={10} fill="#232220" />
      </>
    )}
  </g>
);

/** Caller at home: front-facing, curly hair, phone at her ear. */
export const Caller: React.FC<{talk: number; smile: number}> = ({talk, smile}) => {
  const frame = useCurrentFrame();
  const mouth = talk > 0 ? Math.abs(Math.sin(frame / 2.3)) * talk : 0;
  const nod = Math.sin(frame / 14) * 3;
  const skin = '#e2b394';
  const hair = '#7c3a20';
  return (
    <g transform={`rotate(${nod * 0.6})`}>
      {/* body: cosy jumper */}
      <path d="M -230 420 Q -230 230 -90 200 L 90 200 Q 230 230 230 420 L 240 760 L -240 760 Z" fill="#c9b6d6" />
      <path d="M -80 200 Q 0 250 80 200" stroke="#b3a0c2" strokeWidth={14} fill="none" />
      {/* curls behind */}
      {Array.from({length: 22}).map((_, i) => {
        const a = (i / 22) * Math.PI * 2;
        return <circle key={i} cx={Math.cos(a) * 130} cy={-20 + Math.sin(a) * 140 + (Math.sin(a) > 0.4 ? 30 : 0)} r={52 + random(`cr${i}`) * 14} fill={hair} />;
      })}
      <rect x={-40} y={110} width={80} height={100} fill="#cf9c7c" />
      <ellipse cx={0} cy={0} rx={112} ry={136} fill={skin} />
      {/* fringe curls */}
      {Array.from({length: 8}).map((_, i) => (
        <circle key={i} cx={-96 + i * 28} cy={-110 + Math.abs(i - 3.5) * 8} r={34} fill={hair} />
      ))}
      {/* smiling eyes */}
      <path d="M -66 -4 Q -42 -24 -18 -4" stroke="#2a1a14" strokeWidth={7} fill="none" strokeLinecap="round" />
      <path d="M 18 -4 Q 42 -24 66 -4" stroke="#2a1a14" strokeWidth={7} fill="none" strokeLinecap="round" />
      <path d="M -70 -44 Q -44 -58 -18 -46" stroke={hair} strokeWidth={8} fill="none" strokeLinecap="round" />
      <path d="M 18 -46 Q 44 -58 70 -44" stroke={hair} strokeWidth={8} fill="none" strokeLinecap="round" />
      <circle cx={-66} cy={42} r={24} fill="#e08a7a" opacity={0.35} />
      <circle cx={66} cy={42} r={24} fill="#e08a7a" opacity={0.35} />
      <path d="M -4 6 Q 6 36 -6 46" stroke="#b9805f" strokeWidth={5} fill="none" strokeLinecap="round" />
      {mouth > 0.05 ? <ellipse cx={0} cy={78} rx={30 + smile * 8} ry={6 + mouth * 16} fill="#6b2c25" /> : null}
      <path d={`M -36 ${74 - smile * 4} Q 0 ${86 + smile * 16} 36 ${74 - smile * 4}`} stroke="#8a3a2c" strokeWidth={6} fill="none" strokeLinecap="round" />
      {/* hand + phone at ear */}
      <path d="M 190 420 Q 220 250 150 70" stroke="#c9b6d6" strokeWidth={70} strokeLinecap="round" fill="none" />
      <g transform="translate(128 10) rotate(14)">
        <rect x={-22} y={-70} width={44} height={120} rx={12} fill="#2b2a28" />
      </g>
      <ellipse cx={150} cy={50} rx={36} ry={44} fill={skin} />
    </g>
  );
};

/** Soft out-of-focus salon backdrop: warm gradient + bokeh. */
export const Bokeh: React.FC<{w?: number; h?: number; tone?: 'warm' | 'morning' | 'dim'; seed?: string}> = ({w = 1080, h = 1920, tone = 'warm', seed = 'b'}) => {
  const frame = useCurrentFrame();
  const bg =
    tone === 'warm' ? ['#7a3f2c', '#a85d42', '#5a3326'] : tone === 'morning' ? ['#d9b48e', '#efd9b8', '#b98a63'] : ['#2a1d18', '#3d2a22', '#1a1310'];
  return (
    <g>
      <defs>
        <linearGradient id={`bk-${seed}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={bg[0]} />
          <stop offset="0.5" stopColor={bg[1]} />
          <stop offset="1" stopColor={bg[2]} />
        </linearGradient>
        <filter id={`bkb-${seed}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={14} />
        </filter>
      </defs>
      <rect width={w} height={h} fill={`url(#bk-${seed})`} />
      <g filter={`url(#bkb-${seed})`}>
        {Array.from({length: 18}).map((_, i) => {
          const x = random(`${seed}x${i}`) * w;
          const y = random(`${seed}y${i}`) * h * 0.7;
          const r = 30 + random(`${seed}r${i}`) * 70;
          const c = i % 4 === 0 ? '#8fae8f' : i % 3 === 0 ? '#ffd9a0' : '#ffe9c4';
          return <circle key={i} cx={x + Math.sin(frame / 60 + i) * 6} cy={y} r={r} fill={c} opacity={tone === 'dim' ? 0.18 : 0.35} />;
        })}
      </g>
    </g>
  );
};
