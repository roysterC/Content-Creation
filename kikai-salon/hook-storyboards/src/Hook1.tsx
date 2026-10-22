import React from 'react';
import {AbsoluteFill, staticFile} from 'remotion';
import {AmberLight, Box3D, Caption, Grade, PD, PH, Phone3D, SalonBokeh, World} from './common';

const EDGE = 220; // desk front edge (z)
const DESK = {w: 2600, h: 80, d: 1600};

const Desk: React.FC = () => (
  <Box3D
    w={DESK.w}
    h={DESK.h}
    d={DESK.d}
    t={`translate3d(0px, ${DESK.h / 2}px, ${EDGE - DESK.d / 2}px)`}
    top={{
      backgroundImage: `linear-gradient(180deg, rgba(20,10,4,0.55) 0%, rgba(20,10,4,0) 45%, rgba(255,230,190,0.08) 100%), url(${staticFile('oak.jpg')})`,
      backgroundSize: '100% 100%, 2600px 1600px',
    }}
    front={{
      backgroundImage: `linear-gradient(180deg, #e2bd63 0px, #a8832f 7px, rgba(20,10,4,0.55) 8px, rgba(10,5,2,0.85) 100%), url(${staticFile('oak.jpg')})`,
      backgroundSize: '100% 100%, 2600px 1600px',
    }}
  />
);

export const Hook1: React.FC<{beat: number}> = ({beat}) => {
  // phone pose per beat
  const pose =
    beat === 0
      ? {z: EDGE - PH / 2 + 60, tip: 0, drop: 0, yaw: -8}
      : beat === 1
        ? {z: EDGE - PH / 2 + 300, tip: 21, drop: 0, yaw: -10}
        : {z: EDGE - PH / 2 + 760, tip: 48, drop: 300, yaw: -14};
  const phoneT = (dx = 0) =>
    `translate3d(0px, ${pose.drop}px, ${EDGE}px) rotateX(${-pose.tip}deg) translate3d(${40 + dx}px, ${-PD / 2 - 1}px, ${pose.z - EDGE}px) rotateX(90deg) rotateZ(${pose.yaw}deg)`;
  const state = beat === 2 ? 'kikai' : 'incoming';
  return (
    <AbsoluteFill style={{background: '#1a0f09'}}>
      <SalonBokeh seed="h1" />
      <World cx={540} cy={1180} tilt={-24} persp={1300} dist={260}>
        <Desk />
        {/* contact shadow */}
        {beat === 0 ? (
          <div
            style={{
              position: 'absolute',
              left: -PH / 2 + 40,
              top: -230,
              width: PH,
              height: 460,
              transform: `translate3d(0, -0.5px, ${pose.z}px) rotateX(90deg) rotateZ(${pose.yaw}deg)`,
              background: 'radial-gradient(closest-side, rgba(0,0,0,0.7), rgba(0,0,0,0))',
              filter: 'blur(8px)',
            }}
          />
        ) : null}
        {beat === 0 ? (
          <>
            <div style={{opacity: 0.28}}>
              <Phone3D t={phoneT(-9)} state={state} />
            </div>
            <div style={{opacity: 0.28}}>
              <Phone3D t={phoneT(9)} state={state} />
            </div>
          </>
        ) : null}
        <Phone3D t={phoneT()} state={state} glow={beat === 2 ? 1 : 0} />
      </World>
      {/* depth of field on the far desk + background */}
      <AbsoluteFill
        style={{
          backdropFilter: 'blur(9px)',
          WebkitMaskImage: 'linear-gradient(180deg, #000 0%, #000 38%, transparent 48%)',
          maskImage: 'linear-gradient(180deg, #000 0%, #000 38%, transparent 48%)',
        }}
      />
      {/* screen light on the desk */}
      <AmberLight x={560} y={1180} r={520} o={beat === 2 ? 0 : 0.0} />
      {beat === 2 ? (
        <>
          <AmberLight x={600} y={1360} r={760} o={0.95} />
          <svg width={1080} height={1920} style={{position: 'absolute', mixBlendMode: 'screen'}}>
            <defs>
              <filter id="rib">
                <feGaussianBlur stdDeviation={14} />
              </filter>
            </defs>
            {[
              'M 120 1760 C 260 1500 520 1700 640 1500 C 720 1360 900 1400 980 1250',
              'M 260 1880 C 380 1640 760 1720 860 1520',
              'M 980 1720 C 860 1560 620 1640 520 1460',
            ].map((d, i) => (
              <g key={i}>
                <path d={d} stroke="#ffcf7a" strokeWidth={34 - i * 8} fill="none" strokeLinecap="round" filter="url(#rib)" opacity={0.9} />
                <path d={d} stroke="#fff1cc" strokeWidth={6 - i} fill="none" strokeLinecap="round" opacity={0.85} />
              </g>
            ))}
            {Array.from({length: 40}).map((_, i) => (
              <circle key={i} cx={200 + ((i * 197) % 760)} cy={1200 + ((i * 131) % 640)} r={2 + (i % 4)} fill="#fff3d1" opacity={0.5 + (i % 3) * 0.15} />
            ))}
          </svg>
        </>
      ) : null}
      {beat === 1 ? <Caption text="Hands full?" top={300} size={120} /> : null}
      <Grade frame={beat} />
    </AbsoluteFill>
  );
};
