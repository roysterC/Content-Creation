import React from 'react';
import {AbsoluteFill, Img, random, staticFile} from 'remotion';

export const C = {
  amber: '#ffb347',
  amberSoft: '#ffd27f',
  amberCore: '#fff3d1',
  cream: '#f6efe2',
  charcoal: '#1d1c1a',
};
export const SANS = '"Inter", system-ui, sans-serif';
export const SERIF = '"Instrument Serif", Georgia, serif';
export const HAND = '"Caveat", cursive';

/* ───────────── 3D primitives (CSS) ───────────── */

type Face = React.CSSProperties & {children?: React.ReactNode};

/** A CSS box centred on its origin. w along x, h along y, d along z. */
export const Box3D: React.FC<{
  w: number;
  h: number;
  d: number;
  t?: string;
  front?: Face;
  back?: Face;
  top?: Face;
  bottom?: Face;
  left?: Face;
  right?: Face;
}> = ({w, h, d, t = '', front, back, top, bottom, left, right}) => {
  const face = (fw: number, fh: number, tf: string, f?: Face) => {
    if (!f) return null;
    const {children, ...style} = f;
    return (
      <div
        style={{
          position: 'absolute',
          left: -fw / 2,
          top: -fh / 2,
          width: fw,
          height: fh,
          transform: tf,
          backfaceVisibility: 'hidden',
          ...style,
        }}
      >
        {children}
      </div>
    );
  };
  return (
    <div style={{position: 'absolute', left: 0, top: 0, transformStyle: 'preserve-3d', transform: t}}>
      {face(w, h, `translateZ(${d / 2}px)`, front)}
      {face(w, h, `rotateY(180deg) translateZ(${d / 2}px)`, back)}
      {face(w, d, `rotateX(90deg) translateZ(${h / 2}px)`, top)}
      {face(w, d, `rotateX(-90deg) translateZ(${h / 2}px)`, bottom)}
      {face(d, h, `rotateY(-90deg) translateZ(${w / 2}px)`, left)}
      {face(d, h, `rotateY(90deg) translateZ(${w / 2}px)`, right)}
    </div>
  );
};

/** World container: camera at (0,0,0) looking down -z; world origin placed at screen (cx, cy). */
export const World: React.FC<{
  persp?: number;
  cx?: number;
  cy?: number;
  tilt?: number;
  yaw?: number;
  dist?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({persp = 1500, cx = 540, cy = 960, tilt = -20, yaw = 0, dist = 0, style, children}) => (
  <AbsoluteFill style={{perspective: persp, perspectiveOrigin: `540px 960px`, ...style}}>
    <div
      style={{
        position: 'absolute',
        left: cx,
        top: cy,
        transformStyle: 'preserve-3d',
        transform: `translateZ(${-dist}px) rotateX(${tilt}deg) rotateY(${yaw}deg)`,
      }}
    >
      {children}
    </div>
  </AbsoluteFill>
);

/* ───────────── phone ───────────── */

export const PW = 430;
export const PH = 890;
export const PD = 17;

const PhoneGlyph: React.FC<{size: number; color: string; rot?: number}> = ({size, color, rot = 0}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{rotate: `${rot}deg`}}>
    <path
      d="M6.6 10.8a15.5 15.5 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z"
      fill={color}
    />
  </svg>
);

export type ScreenState = 'incoming' | 'missed' | 'kikai' | 'ended' | 'off';

/** Generic smartphone call UI, 430×890. */
export const CallScreen: React.FC<{state: ScreenState; glow?: number}> = ({state, glow = 0}) => {
  if (state === 'off') return <AbsoluteFill style={{background: '#0b0b0c'}} />;
  const wall =
    state === 'kikai'
      ? 'radial-gradient(120% 70% at 50% 18%, #ffcf86 0%, #d9813a 42%, #5a2a14 100%)'
      : state === 'ended'
        ? 'linear-gradient(180deg, #2a2b2f, #141416)'
        : 'radial-gradient(120% 70% at 30% 10%, #6f8f86 0%, #34474a 45%, #15191c 100%)';
  return (
    <AbsoluteFill style={{background: wall, fontFamily: SANS, color: '#fff', borderRadius: 52, overflow: 'hidden'}}>
      {/* status bar */}
      <div style={{position: 'absolute', top: 22, left: 36, right: 36, display: 'flex', justifyContent: 'space-between', fontSize: 19, fontWeight: 600, opacity: 0.95}}>
        <span>10:42</span>
        <span style={{display: 'flex', gap: 6, alignItems: 'flex-end'}}>
          {[8, 11, 14, 17].map((hh) => (
            <span key={hh} style={{width: 4, height: hh, background: '#fff', borderRadius: 2}} />
          ))}
          <span style={{width: 30, height: 14, border: '2px solid #fff', borderRadius: 4, marginLeft: 6, position: 'relative'}}>
            <span style={{position: 'absolute', inset: 2, right: 8, background: '#fff', borderRadius: 1}} />
          </span>
        </span>
      </div>
      <div style={{position: 'absolute', top: 18, left: '50%', width: 18, height: 18, marginLeft: -9, borderRadius: 9, background: '#050505'}} />

      {state === 'incoming' || state === 'ended' ? (
        <>
          <div style={{position: 'absolute', top: 150, width: '100%', textAlign: 'center'}}>
            <div style={{fontSize: 22, opacity: 0.75}}>{state === 'ended' ? 'Call ended' : 'Incoming call · Salon line'}</div>
            <div style={{fontSize: 44, fontWeight: 500, marginTop: 14, letterSpacing: 0.5}}>07700 900314</div>
            <div style={{fontSize: 22, opacity: 0.7, marginTop: 8}}>{state === 'ended' ? '00:00' : 'Mobile'}</div>
          </div>
          <div style={{position: 'absolute', top: 360, left: '50%', marginLeft: -64, width: 128, height: 128, borderRadius: 64, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <svg width={64} height={64} viewBox="0 0 24 24">
              <circle cx={12} cy={8} r={4.2} fill="rgba(255,255,255,0.85)" />
              <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7z" fill="rgba(255,255,255,0.85)" />
            </svg>
          </div>
          {state === 'incoming' ? (
            <div style={{position: 'absolute', bottom: 110, left: 60, right: 60, display: 'flex', justifyContent: 'space-between'}}>
              {[
                ['#eb4d3d', 'Decline', 135],
                ['#34c759', 'Accept', 0],
              ].map(([bg, label, rot]) => (
                <div key={label as string} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12}}>
                  <div style={{width: 96, height: 96, borderRadius: 48, background: bg as string, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 ${30 * glow}px ${C.amber}`}}>
                    <PhoneGlyph size={46} color="#fff" rot={rot as number} />
                  </div>
                  <div style={{fontSize: 20, opacity: 0.85}}>{label}</div>
                </div>
              ))}
            </div>
          ) : null}
        </>
      ) : null}

      {state === 'missed' ? (
        <>
          <div style={{position: 'absolute', top: 120, width: '100%', textAlign: 'center'}}>
            <div style={{fontSize: 22, opacity: 0.8}}>Saturday 14 November</div>
            <div style={{fontSize: 118, fontWeight: 600, letterSpacing: -3, lineHeight: 1.05}}>10:42</div>
          </div>
          <div style={{position: 'absolute', top: 360, left: 22, right: 22, padding: '22px 24px', borderRadius: 26, background: 'rgba(255,255,255,0.22)', display: 'flex', gap: 16, alignItems: 'center'}}>
            <div style={{width: 52, height: 52, borderRadius: 14, background: '#eb4d3d', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <PhoneGlyph size={28} color="#fff" />
            </div>
            <div>
              <div style={{fontSize: 22, fontWeight: 600}}>Missed call</div>
              <div style={{fontSize: 19, opacity: 0.8, marginTop: 3}}>07700 900314 · now</div>
            </div>
          </div>
        </>
      ) : null}

      {state === 'kikai' ? (
        <>
          <div style={{position: 'absolute', top: 120, width: '100%', textAlign: 'center'}}>
            <div style={{display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 20px', borderRadius: 99, background: 'rgba(255,255,255,0.22)', fontSize: 21, fontWeight: 600}}>
              <span style={{width: 12, height: 12, borderRadius: 6, background: '#fff3d1', boxShadow: '0 0 12px #fff3d1'}} />
              Kikai answered
            </div>
            <div style={{fontSize: 44, fontWeight: 500, marginTop: 26}}>07700 900314</div>
            <div style={{fontSize: 22, opacity: 0.85, marginTop: 8}}>00:14</div>
          </div>
          <div style={{position: 'absolute', top: 400, left: 30, right: 30, display: 'flex', flexDirection: 'column', gap: 14}}>
            <div style={{alignSelf: 'flex-start', maxWidth: '80%', padding: '16px 20px', borderRadius: 22, background: 'rgba(0,0,0,0.25)', fontSize: 21, lineHeight: 1.35}}>
              Anything Saturday for a cut and colour?
            </div>
            <div style={{alignSelf: 'flex-end', maxWidth: '80%', padding: '16px 20px', borderRadius: 22, background: 'rgba(255,255,255,0.88)', color: '#3b2412', fontSize: 21, lineHeight: 1.35}}>
              Half ten with Priya? You&apos;ll need a quick patch test first.
            </div>
          </div>
          <div style={{position: 'absolute', bottom: 120, left: 40, right: 40, padding: '20px 24px', borderRadius: 24, background: 'rgba(255,255,255,0.92)', color: '#3b2412', fontSize: 22, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 14}}>
            <svg width={30} height={30} viewBox="0 0 24 24">
              <circle cx={12} cy={12} r={11} fill="#2f7a4f" />
              <path d="M7 12.5l3.2 3.2L17 9" stroke="#fff" strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Booked · Sat 10:30 · Cut &amp; colour
          </div>
        </>
      ) : null}
    </AbsoluteFill>
  );
};

/** Phone as a 3D slab, screen on the front face. Use inside <World>. */
export const Phone3D: React.FC<{t: string; state: ScreenState; glow?: number; lit?: number}> = ({t, state, glow = 0, lit = 1}) => {
  const edge = 'linear-gradient(90deg, #2d2e31, #6d6f74 30%, #3a3b3e 55%, #8a8c90 80%, #2b2c2e)';
  return (
    <Box3D
      w={PW}
      h={PH}
      d={PD}
      t={t}
      front={{
        borderRadius: 62,
        background: '#0a0a0b',
        boxShadow: 'inset 0 0 0 3px #3c3d40',
        children: (
          <>
            <div style={{position: 'absolute', inset: 12, borderRadius: 52, overflow: 'hidden', filter: `brightness(${lit})`}}>
              <CallScreen state={state} glow={glow} />
            </div>
            {/* glass reflection */}
            <div style={{position: 'absolute', inset: 0, borderRadius: 62, background: 'linear-gradient(125deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.04) 32%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.07) 78%, rgba(255,255,255,0) 100%)'}} />
          </>
        ),
      }}
      back={{borderRadius: 62, background: 'linear-gradient(160deg, #3a3b3f, #1f2023)'}}
      top={{borderRadius: 8, background: edge}}
      bottom={{borderRadius: 8, background: edge}}
      left={{borderRadius: 8, background: 'linear-gradient(180deg, #2d2e31, #6d6f74 40%, #2b2c2e)'}}
      right={{borderRadius: 8, background: 'linear-gradient(180deg, #2d2e31, #8a8c90 40%, #2b2c2e)'}}
    />
  );
};

/* ───────────── background & grade ───────────── */

/** Out-of-focus salon interior: warm practicals, mirror bulbs, a figure, window light. */
export const SalonBokeh: React.FC<{seed?: string; figure?: boolean; tone?: number; dim?: number}> = ({seed = 's', figure = true, tone = 0, dim = 0}) => {
  const bulbs = Array.from({length: 26}).map((_, i) => {
    const row = i < 13 ? 0 : 1;
    const k = i % 13;
    const cx = (row ? 620 : 120) + Math.cos((k / 13) * Math.PI * 2) * 170;
    const cy = 520 + Math.sin((k / 13) * Math.PI * 2) * 170;
    return {cx, cy, r: 26 + random(`${seed}b${i}`) * 10};
  });
  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${tone ? '#2c1b14' : '#3b2418'} 0%, #5c3523 45%, #2a1810 100%)`}}>
      <svg width={1080} height={1920} style={{position: 'absolute', filter: 'blur(26px)'}}>
        <rect x={760} y={0} width={360} height={1300} fill="#f7dfb4" opacity={0.55 - dim * 0.4} />
        <rect x={0} y={1150} width={1080} height={800} fill="#20130c" />
        {/* brick suggestion */}
        {Array.from({length: 12}).map((_, i) => (
          <rect key={i} x={0} y={i * 90} width={760} height={6} fill="#2b170f" opacity={0.25} />
        ))}
        {figure ? (
          <g opacity={0.95} transform="translate(0 -260)">
            <ellipse cx={420} cy={760} rx={70} ry={86} fill="#1a1210" />
            <circle cx={440} cy={660} r={44} fill="#1a1210" />
            <path d="M 300 1200 Q 300 900 360 860 L 500 860 Q 560 900 560 1200 Z" fill="#7f9c84" />
            <path d="M 330 880 L 530 1150 M 530 880 L 330 1150" stroke="#191818" strokeWidth={34} />
            <rect x={250} y={700} width={90} height={60} rx={6} fill="#d9dde0" />
            <rect x={232} y={772} width={80} height={52} rx={6} fill="#c9ced2" />
            <ellipse cx={220} cy={900} rx={110} ry={120} fill="#2a1d18" />
          </g>
        ) : null}
      </svg>
      {/* bokeh discs: bright rim, soft core */}
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <defs>
          <radialGradient id={`bk-${seed}`}>
            <stop offset="0" stopColor="#fff1cf" stopOpacity={0.5} />
            <stop offset="0.82" stopColor="#ffe2a6" stopOpacity={0.62} />
            <stop offset="0.95" stopColor="#fff4dc" stopOpacity={0.9} />
            <stop offset="1" stopColor="#fff4dc" stopOpacity={0} />
          </radialGradient>
          <filter id={`bkf-${seed}`}>
            <feGaussianBlur stdDeviation={2.2} />
          </filter>
        </defs>
        <g filter={`url(#bkf-${seed})`} opacity={0.85 - dim * 0.5}>
          {bulbs.map((b, i) => (
            <circle key={i} cx={b.cx} cy={b.cy} r={b.r} fill={`url(#bk-${seed})`} />
          ))}
          {[
            [300, 160, 60],
            [690, 120, 54],
            [960, 380, 70],
          ].map(([x, y, r], i) => (
            <circle key={`p${i}`} cx={x} cy={y} r={r} fill={`url(#bk-${seed})`} opacity={0.7} />
          ))}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/** Photographic finish: warm grade, vignette, grain, gentle highlight bloom. */
export const Grade: React.FC<{grain?: number; vignette?: number; warm?: number; frame?: number}> = ({grain = 0.09, vignette = 0.6, warm = 0.18, frame = 0}) => (
  <>
    <AbsoluteFill style={{background: '#ff9a3c', mixBlendMode: 'soft-light', opacity: warm}} />
    <AbsoluteFill style={{background: 'radial-gradient(ellipse 72% 58% at 50% 46%, transparent 50%, rgba(12,7,4,0.95) 100%)', opacity: vignette, mixBlendMode: 'multiply'}} />
    <AbsoluteFill style={{mixBlendMode: 'overlay', opacity: grain}}>
      <Img src={staticFile(`grain${frame % 6}.png`)} style={{width: 1080, height: 1920}} />
    </AbsoluteFill>
  </>
);

export const AmberLight: React.FC<{x: number; y: number; r: number; o: number}> = ({x, y, r, o}) => (
  <AbsoluteFill style={{mixBlendMode: 'screen', opacity: o, pointerEvents: 'none'}}>
    <div
      style={{
        position: 'absolute',
        left: x - r,
        top: y - r,
        width: r * 2,
        height: r * 2,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${C.amberCore} 0%, rgba(255,190,90,0.85) 14%, rgba(255,160,60,0.4) 38%, rgba(255,150,50,0.12) 62%, rgba(255,150,50,0) 72%)`,
      }}
    />
  </AbsoluteFill>
);

/** Ad caption: big, clean, high contrast. */
export const Caption: React.FC<{text: string; top: number; size?: number; dark?: boolean; italic?: boolean}> = ({text, top, size = 92, dark, italic = true}) => (
  <div
    style={{
      position: 'absolute',
      top,
      left: 60,
      right: 60,
      textAlign: 'center',
      fontFamily: SERIF,
      fontStyle: italic ? 'italic' : 'normal',
      fontSize: size,
      lineHeight: 1.05,
      color: dark ? '#1d1c1a' : '#fff8ec',
      textShadow: dark ? '0 2px 20px rgba(255,255,255,0.4)' : '0 4px 36px rgba(0,0,0,0.65)',
    }}
  >
    {text}
  </div>
);
