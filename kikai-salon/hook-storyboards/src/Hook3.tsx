import React from 'react';
import {AbsoluteFill, random, staticFile} from 'remotion';
import {Box3D, Caption, Grade, PD, Phone3D, SalonBokeh, World} from './common';

export const DECLINE = {x: 372, y: 1752};

/** Tapered, uneven clump of wet hair from a band at the top to a point. */
const clump = (xL: number, xR: number, tx: number, ty: number, seed: string) => {
  const n = 24;
  const L: string[] = [];
  const R: string[] = [];
  for (let k = 0; k <= n; k++) {
    const t = k / n;
    const e = Math.pow(t, 0.75);
    const wob = (1 - t) * 34;
    const yy = -40 + (ty + 40) * t;
    L.push(`${xL + (tx - xL) * e + Math.sin(t * 7 + random(seed) * 6) * wob} ${yy}`);
    R.push(`${xR + (tx - xR) * e + Math.sin(t * 6 + random(seed + 'r') * 6) * wob} ${yy}`);
  }
  return `M ${L.join(' L ')} L ${R.reverse().join(' L ')} Z`;
};

const WetHair: React.FC<{tip: {x: number; y: number}}> = ({tip}) => {
  const {x, y} = tip;
  const clumps = [
    {d: clump(x - 380, x - 110, x - 70, y - 150, 'c1'), o: 0.9},
    {d: clump(x + 50, x + 330, x + 34, y - 190, 'c2'), o: 0.9},
    {d: clump(x - 250, x + 200, x, y, 'c0'), o: 1},
  ];
  const strands = Array.from({length: 80}).map((_, i) => {
    const u = random(`hu${i}`);
    const sx = x - 360 + u * 680;
    const ex = x + (random(`hx${i}`) - 0.5) * 60;
    const ey = y - 20 - random(`hy${i}`) * 220;
    return {d: `M ${sx} -40 C ${sx + (x - sx) * 0.15} ${y * 0.4}, ${ex + (u - 0.5) * 90} ${ey - 220}, ${ex} ${ey}`, w: 1.2 + random(`hw${i}`) * 2.6, hi: random(`hh${i}`) > 0.62};
  });
  return (
    <svg width={1080} height={1920} style={{position: 'absolute'}}>
      <defs>
        <linearGradient id="lockG" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#0a0705" />
          <stop offset="0.38" stopColor="#2a1a12" />
          <stop offset="0.55" stopColor="#3e281d" />
          <stop offset="0.78" stopColor="#170e0a" />
          <stop offset="1" stopColor="#060403" />
        </linearGradient>
        <clipPath id="lockClip">
          {clumps.map((c, i) => (
            <path key={i} d={c.d} />
          ))}
        </clipPath>
        <filter id="hb1"><feGaussianBlur stdDeviation={1} /></filter>
        <filter id="hb6"><feGaussianBlur stdDeviation={6} /></filter>
        <filter id="hb16"><feGaussianBlur stdDeviation={16} /></filter>
      </defs>
      {clumps.map((c, i) => (
        <path key={i} d={c.d} fill="url(#lockG)" opacity={c.o} />
      ))}
      <g clipPath="url(#lockClip)">
        {strands.map((st, i) => (
          <path key={i} d={st.d} stroke={st.hi ? '#5a3c2b' : '#040302'} strokeWidth={st.w} fill="none" opacity={0.75} filter="url(#hb1)" />
        ))}
        <path d={`M ${x - 170} -20 C ${x - 140} ${y * 0.35}, ${x - 60} ${y * 0.68}, ${x - 8} ${y - 30}`} stroke="#f6dfc5" strokeWidth={30} fill="none" opacity={0.22} filter="url(#hb16)" />
        <path d={`M ${x - 158} -20 C ${x - 128} ${y * 0.35}, ${x - 52} ${y * 0.68}, ${x - 8} ${y - 30}`} stroke="#fff4e4" strokeWidth={3} fill="none" opacity={0.55} filter="url(#hb1)" />
        <path d={`M ${x - 120} -20 C ${x - 100} ${y * 0.3}, ${x - 30} ${y * 0.7}, ${x - 2} ${y - 20}`} stroke="#fff4e4" strokeWidth={2} fill="none" opacity={0.4} filter="url(#hb1)" />
        <path d={`M ${x + 140} -20 C ${x + 120} ${y * 0.4}, ${x + 60} ${y * 0.66}, ${x + 30} ${y - 190}`} stroke="#e6c9a8" strokeWidth={16} fill="none" opacity={0.16} filter="url(#hb6)" />
      </g>
      {strands.slice(0, 14).map((st, i) => (
        <path key={`e${i}`} d={st.d} stroke="#1a110c" strokeWidth={1.2} fill="none" opacity={0.65} transform={`translate(${(i % 2 ? 1 : -1) * (24 + i * 5)} 0)`} />
      ))}
    </svg>
  );
};

/** Water drop. stretch>1 = falling (elongated), 0.6 = hanging teardrop. */
const Drop: React.FC<{x: number; y: number; r: number; hanging?: boolean; streak?: number}> = ({x, y, r, hanging, streak = 0}) => (
  <svg width={1080} height={1920} style={{position: 'absolute'}}>
    <defs>
      <radialGradient id="dropBody" cx="0.45" cy="0.6" r="0.6">
        <stop offset="0" stopColor="#f2f5f7" stopOpacity={0.55} />
        <stop offset="0.55" stopColor="#9fb3bd" stopOpacity={0.35} />
        <stop offset="0.85" stopColor="#1e2a30" stopOpacity={0.75} />
        <stop offset="1" stopColor="#0b1013" stopOpacity={0.9} />
      </radialGradient>
      <linearGradient id="streak" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#dfe8ee" stopOpacity={0} />
        <stop offset="1" stopColor="#dfe8ee" stopOpacity={0.45} />
      </linearGradient>
      <filter id="db2"><feGaussianBlur stdDeviation={2} /></filter>
    </defs>
    {streak > 0 ? <rect x={x - r * 0.5} y={y - streak} width={r} height={streak} rx={r * 0.5} fill="url(#streak)" filter="url(#db2)" /> : null}
    <path
      d={
        hanging
          ? `M ${x} ${y - r * 2.1} C ${x + r * 0.35} ${y - r * 1.2}, ${x + r} ${y - r * 0.6}, ${x + r} ${y} A ${r} ${r} 0 1 1 ${x - r} ${y} C ${x - r} ${y - r * 0.6}, ${x - r * 0.35} ${y - r * 1.2}, ${x} ${y - r * 2.1} Z`
          : `M ${x} ${y - r * 1.25} C ${x + r * 0.7} ${y - r * 1.1}, ${x + r} ${y - r * 0.4}, ${x + r} ${y} A ${r} ${r} 0 1 1 ${x - r} ${y} C ${x - r} ${y - r * 0.4}, ${x - r * 0.7} ${y - r * 1.1}, ${x} ${y - r * 1.25} Z`
      }
      fill="url(#dropBody)"
    />
    {/* refracted, inverted glimpse of the warm room */}
    <ellipse cx={x} cy={y + r * 0.35} rx={r * 0.62} ry={r * 0.36} fill="#e3a868" opacity={0.45} filter="url(#db2)" />
    <ellipse cx={x - r * 0.38} cy={y - r * 0.4} rx={r * 0.22} ry={r * 0.14} fill="#fff" opacity={0.95} />
    <ellipse cx={x + r * 0.42} cy={y + r * 0.5} rx={r * 0.1} ry={r * 0.06} fill="#fff" opacity={0.6} />
  </svg>
);

/** Water hitting glass: a thin film, beads, and a little spray. */
const Bead: React.FC<{x: number; y: number; r: number; id: string}> = ({x, y, r, id}) => (
  <g>
    <defs>
      <radialGradient id={id} cx="0.4" cy="0.35" r="0.65">
        <stop offset="0" stopColor="#ffffff" stopOpacity={0.15} />
        <stop offset="0.7" stopColor="#9fb3bd" stopOpacity={0.12} />
        <stop offset="0.92" stopColor="#0d1215" stopOpacity={0.55} />
        <stop offset="1" stopColor="#0d1215" stopOpacity={0} />
      </radialGradient>
    </defs>
    <ellipse cx={x + r * 0.15} cy={y + r * 0.25} rx={r * 1.05} ry={r * 0.7} fill="#000" opacity={0.25} />
    <ellipse cx={x} cy={y} rx={r} ry={r * 0.72} fill={`url(#${id})`} />
    <ellipse cx={x - r * 0.35} cy={y - r * 0.28} rx={r * 0.25} ry={r * 0.14} fill="#fff" opacity={0.9} />
    <path d={`M ${x - r * 0.6} ${y + r * 0.4} Q ${x} ${y + r * 0.7} ${x + r * 0.6} ${y + r * 0.38}`} stroke="#fff" strokeWidth={1.5} fill="none" opacity={0.45} />
  </g>
);

const Splash: React.FC<{x: number; y: number}> = ({x, y}) => (
  <svg width={1080} height={1920} style={{position: 'absolute'}}>
    <defs>
      <radialGradient id="film" cx="0.45" cy="0.4">
        <stop offset="0" stopColor="#e7eff3" stopOpacity={0.22} />
        <stop offset="0.85" stopColor="#c7d6de" stopOpacity={0.12} />
        <stop offset="1" stopColor="#c7d6de" stopOpacity={0} />
      </radialGradient>
      <filter id="sb2"><feGaussianBlur stdDeviation={1.2} /></filter>
    </defs>
    <path d={`M ${x - 120} ${y + 10} C ${x - 130} ${y - 50}, ${x - 30} ${y - 70}, ${x + 40} ${y - 52} C ${x + 130} ${y - 40}, ${x + 150} ${y + 20}, ${x + 90} ${y + 46} C ${x + 30} ${y + 70}, ${x - 100} ${y + 60}, ${x - 120} ${y + 10} Z`} fill="url(#film)" />
    <path d={`M ${x - 112} ${y + 2} C ${x - 110} ${y - 44}, ${x - 30} ${y - 60}, ${x + 40} ${y - 46}`} stroke="#fff" strokeWidth={3} fill="none" opacity={0.6} filter="url(#sb2)" />
    {[
      [-170, -40, 18],
      [150, -70, 14],
      [190, 30, 22],
      [-60, -120, 10],
      [60, 100, 12],
      [-200, 60, 9],
      [240, -10, 8],
      [10, -160, 7],
      [-120, 110, 11],
    ].map(([dx, dy, r], i) => (
      <Bead key={i} x={x + dx} y={y + dy} r={r} id={`bd${i}`} />
    ))}
    {Array.from({length: 16}).map((_, i) => {
      const a = random(`sp${i}`) * Math.PI - Math.PI;
      const d = 90 + random(`sd${i}`) * 200;
      return <ellipse key={`s${i}`} cx={x + Math.cos(a) * d} cy={y + Math.sin(a) * d * 0.9} rx={2 + random(`sr${i}`) * 3} ry={5 + random(`sq${i}`) * 6} transform={`rotate(${(a * 180) / Math.PI + 90} ${x + Math.cos(a) * d} ${y + Math.sin(a) * d * 0.9})`} fill="#eef4f7" opacity={0.55} filter="url(#sb2)" />;
    })}
  </svg>
);

export const Hook3: React.FC<{beat: number}> = ({beat}) => {
  const tip = {x: DECLINE.x + 30, y: 760};
  return (
    <AbsoluteFill style={{background: '#20160f'}}>
      <SalonBokeh seed="h3" figure={false} dim={0.2} />
      <World cx={540} cy={1330} tilt={-46} persp={1500} dist={-330}>
        <Box3D
          w={3000}
          h={60}
          d={3000}
          t="translate3d(0px, 30px, 0px)"
          top={{
            backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.4), rgba(0,0,0,0) 40%), url(${staticFile('stone.jpg')})`,
            backgroundSize: '100% 100%, 3000px 3000px',
          }}
        />
        <div style={{position: 'absolute', left: -250, top: -480, width: 500, height: 960, transform: 'translate3d(0, -0.5px, 0) rotateX(90deg) rotateZ(4deg)', background: 'radial-gradient(closest-side, rgba(0,0,0,0.7), rgba(0,0,0,0))', filter: 'blur(14px)'}} />
        <Phone3D t={`translate3d(0px, ${-PD / 2 - 1}px, 0px) rotateX(90deg) rotateZ(4deg)`} state={beat === 2 ? 'ended' : 'incoming'} lit={beat === 2 ? 0.85 : 1} />
      </World>
      <AbsoluteFill style={{backdropFilter: 'blur(18px)', WebkitMaskImage: 'linear-gradient(180deg, #000 0%, #000 34%, transparent 46%)', maskImage: 'linear-gradient(180deg, #000 0%, #000 34%, transparent 46%)'}} />
      <WetHair tip={tip} />
      {beat === 0 ? <Drop x={tip.x} y={tip.y + 34} r={30} hanging /> : null}
      {beat === 1 ? <Drop x={DECLINE.x} y={DECLINE.y - 150} r={30} streak={300} /> : null}
      {beat === 2 ? <Splash x={DECLINE.x} y={DECLINE.y} /> : null}
      {beat === 2 ? <Caption text="That was a cut and colour." top={170} size={96} /> : null}
      <Grade frame={beat + 1} vignette={0.55} />
    </AbsoluteFill>
  );
};
