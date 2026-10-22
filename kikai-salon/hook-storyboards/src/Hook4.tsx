import React from 'react';
import {AbsoluteFill, random} from 'remotion';
import {AmberLight, Grade, SalonBokeh} from './common';
import {Diary, FlatLay, SAT, SUN} from './diary';

const PIVOT = {x: 770, y: 1010};

const Blade: React.FC<{angle: number; front?: boolean; o?: number}> = ({angle, front, o = 1}) => {
  const id = front ? 'bf' : 'bb';
  // blade drawn along -x from pivot, upper (front) or lower (back)
  const d = front
    ? 'M 46 -46 L -120 -62 C -330 -60 -540 -40 -690 -8 L -700 2 C -520 4 -320 10 -120 12 L 46 34 Z'
    : 'M 46 46 L -120 62 C -330 60 -540 40 -690 8 L -700 -2 C -520 -4 -320 -10 -120 -12 L 46 -34 Z';
  return (
    <g transform={`translate(${PIVOT.x} ${PIVOT.y}) rotate(${angle})`} opacity={o}>
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1">
          {front ? (
            <>
              <stop offset="0" stopColor="#4a5056" />
              <stop offset="0.25" stopColor="#c9ced3" />
              <stop offset="0.42" stopColor="#ffffff" />
              <stop offset="0.55" stopColor="#8c939a" />
              <stop offset="0.8" stopColor="#d7dbdf" />
              <stop offset="1" stopColor="#5b6168" />
            </>
          ) : (
            <>
              <stop offset="0" stopColor="#3a3f45" />
              <stop offset="0.35" stopColor="#9aa1a8" />
              <stop offset="0.6" stopColor="#e6e9ec" />
              <stop offset="1" stopColor="#4a5056" />
            </>
          )}
        </linearGradient>
      </defs>
      <path d={d} fill={`url(#${id}g)`} />
      {/* bevelled cutting edge */}
      <path d={front ? 'M -690 -2 C -520 6 -320 10 -120 12' : 'M -690 2 C -520 -6 -320 -10 -120 -12'} stroke="#ffffff" strokeWidth={2.5} fill="none" opacity={0.9} />
      <path d={front ? 'M -680 -8 C -520 -28 -320 -36 -120 -38' : 'M -680 8 C -520 28 -320 36 -120 38'} stroke="#2b3035" strokeWidth={2} fill="none" opacity={0.6} />
      {/* shank toward the handle (off frame right) */}
      <path d={front ? 'M 30 -40 C 120 -70 200 -120 270 -160 L 300 -112 C 220 -80 140 -30 40 24 Z' : 'M 30 40 C 120 70 200 120 270 160 L 300 112 C 220 80 140 30 40 -24 Z'} fill={`url(#${id}g)`} />
      <ellipse cx={front ? 360 : 360} cy={front ? -170 : 170} rx={92} ry={64} fill="none" stroke={`url(#${id}g)`} strokeWidth={26} />
      {front ? <path d="M 250 -230 C 300 -300 330 -330 340 -360" stroke="#9aa1a8" strokeWidth={14} strokeLinecap="round" fill="none" /> : null}
    </g>
  );
};

const HairLock: React.FC<{cut: number}> = ({cut}) => {
  const mk = (n: number, seed: string, dark: boolean) =>
    Array.from({length: n}).map((_, i) => {
      const u = random(`${seed}${i}`);
      const top = 250 + u * 400;
      const mid = 380 + u * 150;
      const end = 1120 + random(`${seed}e${i}`) * 300;
      const wob = (random(`${seed}w${i}`) - 0.5) * 34;
      const wave = 10 + random(`${seed}v${i}`) * 16;
      const bend = cut * (u - 0.5) * 26;
      const tone = random(`${seed}t${i}`);
      const color = dark ? (tone > 0.5 ? '#4a2f1b' : '#38220f') : tone > 0.86 ? '#f0cc95' : tone > 0.58 ? '#bf8a55' : tone > 0.3 ? '#94633a' : '#6a4529';
      return {
        d: `M ${top} -20 C ${top + (mid - top) * 0.3 + wob} 380, ${mid + wob + wave} ${PIVOT.y - 300}, ${mid + bend - wave * 0.5} ${PIVOT.y} S ${mid + wob * 0.8 + bend * 2 + wave} ${end - 140}, ${mid + wob * 1.4 + bend * 2.4} ${end}`,
        w: dark ? 3 + random(`${seed}s${i}`) * 4 : 1.1 + random(`${seed}s${i}`) * 2.2,
        color,
        o: dark ? 0.9 : 0.7 + random(`${seed}o${i}`) * 0.3,
      };
    });
  const back = mk(120, 'hb', true);
  const strands = [...mk(230, 'lk', false)];
  return (
    <g>
      <defs>
        <filter id="lb08"><feGaussianBlur stdDeviation={0.7} /></filter>
        <filter id="lb2"><feGaussianBlur stdDeviation={2.2} /></filter>
        <filter id="lb18"><feGaussianBlur stdDeviation={18} /></filter>
      </defs>
      <path d={`M 250 -20 L 650 -20 C 600 400 540 700 530 ${PIVOT.y} L 540 1200 L 380 1200 L 380 ${PIVOT.y} C 370 700 310 400 250 -20 Z`} fill="#5a3a22" opacity={0.75} filter="url(#lb18)" />
      <g filter="url(#lb2)">
        {back.map((s, i) => (
          <path key={`b${i}`} d={s.d} stroke={s.color} strokeWidth={s.w} fill="none" opacity={s.o} strokeLinecap="round" />
        ))}
      </g>
      <g filter="url(#lb08)">
        {strands.map((s, i) => (
          <path key={i} d={s.d} stroke={s.color} strokeWidth={s.w} fill="none" opacity={s.o} strokeLinecap="round" />
        ))}
      </g>
      <path d="M 420 120 C 430 360 440 560 450 760" stroke="#fff0d2" strokeWidth={40} fill="none" opacity={0.16} filter="url(#lb18)" />
    </g>
  );
};

const Shears: React.FC<{open: number; blur?: boolean}> = ({open, blur}) => (
  <svg width={1080} height={1920} style={{position: 'absolute'}}>
    <defs>
      <radialGradient id="screw" cx="0.35" cy="0.35">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="0.5" stopColor="#a9afb5" />
        <stop offset="1" stopColor="#3d4248" />
      </radialGradient>
      <filter id="shadowS"><feGaussianBlur stdDeviation={12} /></filter>
    </defs>
    {blur ? [10, 6].map((a, i) => <Blade key={i} angle={a} o={0.18} />) : null}
    <Blade angle={open / 2} />
    <HairLock cut={blur ? 1 : 0} />
    {blur ? [-10, -6].map((a, i) => <Blade key={`f${i}`} angle={a} front o={0.2} />) : null}
    <g opacity={0.35} filter="url(#shadowS)" transform="translate(18 22)">
      <path d={`M ${PIVOT.x - 690} ${PIVOT.y} L ${PIVOT.x} ${PIVOT.y}`} stroke="#000" strokeWidth={50} transform={`rotate(${-open / 2} ${PIVOT.x} ${PIVOT.y})`} />
    </g>
    <Blade angle={-open / 2} front />
    <circle cx={PIVOT.x} cy={PIVOT.y} r={30} fill="url(#screw)" />
    <circle cx={PIVOT.x} cy={PIVOT.y} r={30} fill="none" stroke="#2a2e33" strokeWidth={3} />
    <circle cx={PIVOT.x} cy={PIVOT.y} r={12} fill="#6b7178" />
  </svg>
);

const RingingPhoneBokeh: React.FC = () => (
  <svg width={1080} height={1920} style={{position: 'absolute', filter: 'blur(16px)'}}>
    <rect x={790} y={300} width={200} height={400} rx={30} fill="#1a1a1b" />
    <rect x={802} y={312} width={176} height={376} rx={22} fill="#5f8279" />
    <circle cx={850} cy={620} r={22} fill="#eb4d3d" />
    <circle cx={930} cy={620} r={22} fill="#34c759" />
    <rect x={830} y={400} width={120} height={18} rx={9} fill="#e7efe9" opacity={0.8} />
  </svg>
);

export const Hook4: React.FC<{beat: number}> = ({beat}) => {
  if (beat === 2) {
    const amber = [{row: 3, text: 'New · cut & colour', amber: true, rot: -0.5}];
    return (
      <AbsoluteFill style={{background: '#20140c'}}>
        <FlatLay tilt={26} scale={1.25} ox={-40} oy={-120}>
          <Diary x={480} y={700} rot={-3} left={[...SAT.filter((e) => e.row !== 3), ...amber]} right={SUN} />
        </FlatLay>
        <AmberLight x={450} y={720} r={560} o={0.75} />
        <Grade frame={2} vignette={0.65} />
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{background: '#1d130d'}}>
      <SalonBokeh seed="h4" figure={false} />
      <RingingPhoneBokeh />
      <Shears open={beat === 0 ? 28 : 3} blur={beat === 1} />
      <Grade frame={beat + 4} vignette={0.55} />
    </AbsoluteFill>
  );
};
