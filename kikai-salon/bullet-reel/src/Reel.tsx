import React from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {CallScreen, PH, PW, ScreenState} from './callscreen';
import {BG, Bullet, Can, ease, Impact, ip, MONO, RED, SANS} from './parts';
import {R, RACE_END, reelNose, reelShown, reelSpeed} from './reelTimeline';
import {Easing} from 'remotion';
import {BULLET_Y, CAN, CAN_CX} from './timeline';
import vo from './vo.json';

const F = (id: keyof typeof vo) => Math.ceil(vo[id] * R.fps);

/* ───────────── wireframe versions ───────────── */
const WireCan: React.FC<{phase: number; scan: number}> = ({phase, scan}) => {
  const {x0, x1, top, bottom} = CAN;
  const rx = (x1 - x0) / 2;
  const rings = Array.from({length: 11}).map((_, i) => top + 30 + i * ((bottom - top - 50) / 10));
  const sy = top + 92 + (bottom - top - 112) * scan;
  return (
    <g stroke="#8d877c" strokeWidth={2} fill="none">
      {rings.map((y, i) => (
        <ellipse key={i} cx={CAN_CX} cy={y} rx={i === 0 ? rx - 30 : rx} ry={18} opacity={i === 0 || i === 10 ? 1 : 0.6} />
      ))}
      {/* meridians turning slowly: the can spins on the turntable */}
      {Array.from({length: 24}).map((_, i) => {
        const th = (i / 24) * Math.PI * 2 + phase;
        const x = CAN_CX + Math.cos(th) * rx;
        const front = Math.sin(th) > 0;
        return <line key={i} x1={x} y1={top + 92} x2={x} y2={bottom - 20} opacity={front ? 0.62 : 0.16} strokeDasharray={front ? undefined : '6 8'} />;
      })}
      <ellipse cx={CAN_CX} cy={sy} rx={rx + 6} ry={20} stroke={RED} strokeWidth={2.5} opacity={0.55} />
      <line x1={x0} y1={top + 92} x2={x0} y2={bottom - 20} />
      <line x1={x1} y1={top + 92} x2={x1} y2={bottom - 20} />
    </g>
  );
};
const WireBullet: React.FC<{nx: number; phase: number}> = ({nx, phase}) => {
  const x0 = nx - 256;
  const y0 = BULLET_Y - 31;
  return (
    <g stroke="#8d877c" strokeWidth={2} fill="none">
      <path d={`M ${x0} ${y0} L ${x0 + 120} ${y0} C ${nx - 70} ${y0 + 1} ${nx - 10} ${y0 + 14} ${nx} ${BULLET_Y} C ${nx - 10} ${y0 + 48} ${nx - 70} ${y0 + 61} ${x0 + 120} ${y0 + 62} L ${x0} ${y0 + 62} Z`} />
      {/* rifling lines rolling round the bullet */}
      {Array.from({length: 8}).map((_, i) => {
        const th = (i / 8) * Math.PI * 2 - phase * 2.4;
        if (Math.sin(th) <= 0) return null;
        const y = BULLET_Y + 31 * Math.cos(th);
        return <line key={i} x1={x0} y1={y} x2={x0 + 150} y2={y} opacity={0.6} />;
      })}
      {[40, 90, 140].map((dx) => (
        <ellipse key={dx} cx={x0 + dx} cy={BULLET_Y} rx={6} ry={31} opacity={0.6} />
      ))}
    </g>
  );
};

/* ───────────── the scene (can + bullet), rendered or wireframe ───────────── */
const MOTES = [0.45, 1, 1.8].map((p, li) =>
  Array.from({length: li === 2 ? 10 : 28}).map((_, i) => ({
    x: -4300 + random(`mx${li}-${i}`) * 6200,
    y: 640 + random(`my${li}-${i}`) * 720,
    r: li === 0 ? 3 + random(`mr${li}${i}`) * 3 : li === 1 ? 4 + random(`mr${li}${i}`) * 4 : 16 + random(`mr${li}${i}`) * 14,
    p,
    o: li === 0 ? 0.35 : li === 1 ? 0.5 : 0.22,
  })),
);
const Range: React.FC<{blur: number}> = ({blur}) => (
  <g>
    <defs>
      <filter id="rangeBlur" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation={`${blur} 0`} />
      </filter>
    </defs>
    <g filter={blur > 0.3 ? 'url(#rangeBlur)' : undefined}>
      <line x1={-4500} y1={CAN.bottom + 2} x2={2400} y2={CAN.bottom + 2} stroke="#c9c2b6" strokeWidth={4} />
      {Array.from({length: 15}).map((_, i) => {
        const x = CAN.x0 - 250 * (i + 1);
        return (
          <g key={i}>
            <line x1={x} y1={CAN.bottom + 2} x2={x} y2={CAN.bottom + (i % 2 ? 34 : 58)} stroke="#a39b8e" strokeWidth={5} />
            {i % 2 === 1 ? (
              <text x={x} y={CAN.bottom + 112} textAnchor="middle" fontFamily={MONO} fontSize={46} fill="#948c7f">
                {((250 * (i + 1)) / 1000).toFixed(2)} m
              </text>
            ) : null}
          </g>
        );
      })}
    </g>
  </g>
);

const Scene: React.FC<{f: number; wire: number; cam: {s: number; cx: number; cy: number}; shake: {x: number; y: number}; envBlur?: number}> = ({f, wire, cam, shake, envBlur = 0}) => {
  const hit = f >= R.impact;
  const jolt = hit ? ip(f - R.impact, [0, 5, 30], [0, 1, 0.7], ease) : 0;
  const reveal = wire; // 0 render, 1 wireframe; drawn as a left→right wipe
  const t = `translate(${cam.cx + shake.x} ${cam.cy + shake.y}) scale(${cam.s}) translate(${-CAN_CX} ${-1015})`;
  return (
    <AbsoluteFill style={{background: BG}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 70% 55% at 55% 50%, rgba(255,255,255,0.65), rgba(0,0,0,0) 70%)'}} />
      {/* grid paper for the wireframe */}
      <AbsoluteFill
        style={{
          opacity: reveal,
          backgroundImage: 'linear-gradient(rgba(120,110,95,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(120,110,95,0.14) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }}
      />
      <svg width={1080} height={1920} style={{position: 'absolute', overflow: 'visible'}}>
        <defs>
          <clipPath id="wipeRender">
            <rect x={reveal * 1200 - 60} y={-200} width={1400} height={2400} />
          </clipPath>
          <clipPath id="wipeWire">
            <rect x={-200} y={-200} width={reveal * 1200 - 60 + 200} height={2400} />
          </clipPath>
        </defs>
        <g clipPath={reveal > 0 ? 'url(#wipeRender)' : undefined}>
          <g transform={t}>
            {!hit ? <Bullet nx={reelNose(f)} speed={reelSpeed(f)} seed={f} /> : null}
            <g transform={`translate(${jolt * 14} 0) rotate(${jolt * 1.6} ${CAN_CX} ${CAN.bottom})`}>
              <Can f={f} impact={R.impact} />
            </g>
            <Impact f={f} impact={R.impact} />
          </g>
        </g>
        {reveal > 0 ? (
          <g clipPath="url(#wipeWire)">
            <g transform={t}>
              <WireBullet nx={reelNose(f)} phase={(f - R.wireIn) * 0.045} />
              <WireCan phase={(f - R.wireIn) * 0.045} scan={0.5 - 0.5 * Math.cos(((f - R.wireIn) / 40) * Math.PI)} />
              <g fontFamily={MONO} fontSize={22} fill="#8d877c">
                <text x={CAN_CX - 60} y={CAN.top - 40}>can.obj · 2,048 verts</text>
                <text x={reelNose(f) - 300} y={BULLET_Y - 70}>projectile.obj</text>
                <text x={CAN.x0 - 380} y={CAN.bottom + 90}>velocity = 0.0001x  |  eta = {Math.floor(f / 8) % 2 ? 'never' : 'never_'}</text>
                <text x={CAN.x1 + 30} y={CAN.top + 140}>rot {(((f - R.wireIn) * 0.045 * 180) / Math.PI).toFixed(1)}°</text>
              </g>
            </g>
            <line x1={reveal * 1200 - 60} y1={0} x2={reveal * 1200 - 60} y2={1920} stroke={RED} strokeWidth={3} opacity={reveal < 1 ? 0.8 : 0} />
          </g>
        ) : null}
      </svg>
    </AbsoluteFill>
  );
};

/* ───────────── captions: words land in time with the voice ───────────── */
const Caption: React.FC<{f: number; l1: string; l2: string; at: number; len: number; until: number; top: number}> = ({f, l1, l2, at, len, until, top}) => {
  if (f < at - 2 || f > until + 10) return null;
  const words = [...l1.split(' ').map((w) => ({w, line: 1})), ...l2.split(' ').map((w) => ({w, line: 2}))];
  const step = (len * 0.85) / words.length;
  const out = ip(f, [until, until + 8], [1, 0]);
  const line = (n: number) => (
    <div style={n === 1 ? {fontFamily: SANS, fontWeight: 400, fontSize: 48, color: '#4a4640'} : {fontFamily: SANS, fontWeight: 600, fontSize: 62, color: '#141414', marginTop: 6}}>
      {words.map((wd, i) =>
        wd.line === n ? (
          <span key={i} style={{opacity: ip(f, [at + i * step, at + i * step + 5], [0, 1]), marginRight: '0.26em', display: 'inline-block', translate: `0 ${ip(f, [at + i * step, at + i * step + 6], [10, 0], ease)}px`}}>
            {wd.w}
          </span>
        ) : null,
      )}
    </div>
  );
  return (
    <div style={{position: 'absolute', top, left: 50, right: 50, textAlign: 'center', opacity: out, letterSpacing: -0.5}}>
      {line(1)}
      {line(2)}
    </div>
  );
};

const CAP_LOW = 1290; // bottom captions sit above the platform caption band
const CAP_HIGH = 230; // top captions sit below the platform header

/* ───────────── persistent CTA: from the Kikai beat to the end card ───────────── */
const BAR0 = R.impact - 120; // the music's bar grid (120 BPM, 60 frames a bar)
const CtaTag: React.FC<{f: number}> = ({f}) => {
  const a = R.kikai + 10;
  if (f < a - 1 || f > R.cta + 12) return null;
  const o = ip(f, [a, a + 8, R.cta, R.cta + 10], [0, 1, 1, 0]);
  const since = (f - BAR0) % 60;
  const pulse = f >= R.kikai + 20 ? ip(since, [0, 10], [1, 0]) : 0;
  return (
    <div style={{position: 'absolute', top: 385, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: o, translate: `0 ${ip(f, [a, a + 10], [-16, 0], ease)}px`}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 14, padding: '12px 26px 12px 20px', borderRadius: 999, background: '#141414', color: '#fff', fontFamily: SANS, fontWeight: 500, fontSize: 29, scale: String(1 + 0.045 * pulse), boxShadow: '0 10px 26px rgba(0,0,0,0.18)'}}>
        <svg width={30} height={30} viewBox="0 0 24 24">
          <path d="M4 5h16v11H9l-5 4z" fill="none" stroke="#fff" strokeWidth={2} strokeLinejoin="round" />
        </svg>
        <span>
          Comment <b style={{color: '#f0a24a'}}>“BOOK”</b> for a free demo
        </span>
      </div>
    </div>
  );
};

/* ───────────── phone ───────────── */
const SCREEN_W = 440;
const SCREEN_H = 910;
const Phone: React.FC<{f: number; inner: number; screen: ScreenState; children: React.ReactNode; scale: number; buzz: boolean}> = ({f, inner, screen, children, scale, buzz}) => {
  const k = SCREEN_W / PW;
  const jx = buzz ? Math.sin(f * 2.6) * 5 : 0;
  return (
    <div style={{position: 'absolute', left: 540 - (SCREEN_W + 30) / 2 + jx, top: 960 - (SCREEN_H + 30) / 2, width: SCREEN_W + 30, height: SCREEN_H + 30, scale: String(scale)}}>
      <div style={{position: 'absolute', inset: 0, borderRadius: 64, background: '#121212', boxShadow: '0 40px 80px rgba(0,0,0,0.28), inset 0 0 0 3px #3b3b3b'}} />
      <div style={{position: 'absolute', left: 15, top: 15, width: SCREEN_W, height: SCREEN_H, borderRadius: 50, overflow: 'hidden', background: BG}}>
        {/* the can scene, shrunk into the feed */}
        <div style={{position: 'absolute', left: 0, top: (SCREEN_H - 1920 * (SCREEN_W / 1080)) / 2, width: 1080, height: 1920, transformOrigin: '0 0', scale: String(SCREEN_W / 1080), opacity: 1 - inner}}>
          {children}
        </div>
        <div style={{position: 'absolute', left: 0, top: 0, width: PW, height: PH, transformOrigin: '0 0', scale: String(k), opacity: inner}}>
          <CallScreen state={screen} />
        </div>
      </div>
    </div>
  );
};

/* ───────────── HUD ───────────── */
const WIDE_CAM = {s: 0.52, cx: 760, cy: 900}; // framed high so the counter + captions clear the platform UI
const pad = (n: number) => String(Math.floor(n)).padStart(2, '0');
const HUD: React.FC<{f: number}> = ({f}) => {
  const tc = `00:00:${pad(f / R.fps)}:${pad(f % R.fps)}`;
  const on = Math.floor(f / 15) % 2 === 0;
  return (
    <AbsoluteFill style={{fontFamily: MONO, pointerEvents: 'none'}}>
      <div style={{position: 'absolute', top: 128, left: 26, display: 'flex', alignItems: 'center', gap: 16, fontSize: 26, color: '#1d1d1d'}}>
        <span style={{width: 16, height: 16, borderRadius: 8, background: '#e2412f', opacity: on ? 1 : 0.25}} />
        <span>REC</span>
        <span style={{marginLeft: 14}}>{tc}</span>
      </div>
      <div style={{position: 'absolute', top: 128, right: 26, fontSize: 26, color: '#1d1d1d'}}>100,000 FPS</div>
      {[
        {top: 190, left: 10, b: 'Top', s: 'Left'},
        {top: 190, right: 10, b: 'Top', s: 'Right'},
        {top: 1780, left: 10, b: 'Bottom', s: 'Left'},
        {top: 1780, right: 10, b: 'Bottom', s: 'Right'},
      ].map((c, i) => (
        <div key={i} style={{position: 'absolute', top: c.top, left: c.left, right: c.right, width: 58, height: 52, [`border${c.b}`]: '3px solid #2a2a2a', [`border${c.s}`]: '3px solid #2a2a2a'} as React.CSSProperties} />
      ))}
    </AbsoluteFill>
  );
};

const COUNTER_TOP = 1262; // clear of the Reels/TikTok caption band (y > 1560)
const BigCounter: React.FC<{label: string; value: string; color: string; labelColor?: string; o: number; pulse?: number}> = ({label, value, color, labelColor = '#6e6a64', o, pulse = 0}) => (
  <div style={{position: 'absolute', top: COUNTER_TOP, left: 0, right: 0, textAlign: 'center', opacity: o}}>
    <div style={{fontFamily: MONO, fontSize: 30, letterSpacing: 6, color: labelColor}}>{label}</div>
    <div style={{fontFamily: SANS, fontWeight: 200, fontSize: 210, lineHeight: 1.05, color, letterSpacing: -4, scale: String(1 + pulse * 0.06)}}>{value}</div>
  </div>
);

/* ───────────── the reel ───────────── */
export const Reel: React.FC = () => {
  const f = useCurrentFrame();

  // camera on the can scene
  // camera: locked wide while the bullet races; slow push-in once it brakes (2.0s);
  // quick pull back to the wide shot after the stall, as the narrator comes in.
  const WIDE = WIDE_CAM;
  const CLOSE = {s: 1.0, cx: 775, cy: 860};
  const push = ip(f, [RACE_END, R.stall], [0, 1], Easing.bezier(0.35, 0, 0.55, 1));
  const pull = ip(f, [R.stall + 2, R.stall + 12], [0, 1], Easing.bezier(0.15, 0.85, 0.25, 1));
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const opening =
    f < RACE_END ? {s: WIDE.s, cx: WIDE.cx, cy: WIDE.cy} : {s: lerp(WIDE.s, CLOSE.s, push), cx: lerp(WIDE.cx, CLOSE.cx, push), cy: lerp(WIDE.cy, CLOSE.cy, push)};
  const envBlur = 0;
  // after the pull-out the camera never sits still: a slow creep in on the frozen bullet,
  // eased back to wide while the phone screen covers the scene
  const drift = ip(f, [R.stall + 12, R.rings[0], R.zoomBack - 8], [0, 1, 0], Easing.bezier(0.33, 0, 0.67, 1));
  const afterStall = {
    s: lerp(CLOSE.s, WIDE.s, pull) * (1 + 0.2 * drift),
    cx: lerp(CLOSE.cx, WIDE.cx, pull) - 70 * drift,
    cy: lerp(CLOSE.cy, WIDE.cy, pull) + 12 * drift,
  };
  const late = {
    s: ip(f, [R.zoomBack, R.resume, R.impact, R.impact + 30], [WIDE.s, 1.04, 1.1, 1.04], ease),
    cx: ip(f, [R.zoomBack, R.resume, R.impact, R.impact + 30], [WIDE.cx, 775, 760, 700], ease),
    cy: ip(f, [R.zoomBack, R.resume, R.impact], [WIDE.cy, 865, 855], ease),
  };
  const cam = f < R.stall ? opening : f < R.zoomBack ? afterStall : late;
  const pullBlur = f >= R.stall && f < R.stall + 14 ? Math.sin(Math.PI * ip(f, [R.stall + 2, R.stall + 12], [0, 1])) * 5 : 0;
  const amp = f >= R.impact ? ip(f - R.impact, [0, 14], [22, 0]) : f >= R.stall && f < R.stall + 8 ? ip(f - R.stall, [0, 8], [10, 0]) : 0;
  const shake = {x: (random(`x${f}`) - 0.5) * amp * 2, y: (random(`y${f}`) - 0.5) * amp * 2};
  const wire = ip(f, [R.wireIn, R.wireIn + 14, R.wireOut - 8, R.wireOut + 4], [0, 1, 1, 0], ease);

  // phone: shrink in, then zoom back out into the scene
  const phoneIn = ip(f, [R.shrink, R.shrink + 30], [0, 1], ease);
  const phoneOut = ip(f, [R.zoomBack, R.resume], [0, 1], ease);
  const inPhone = f >= R.shrink && f < R.resume;
  const sceneScaleInPhone = 1 + (SCREEN_W / 1080 - 1) * phoneIn; // full screen → fits the phone screen
  const phoneFrameScale = 1 / (SCREEN_W / 1080) + (1 - 1 / (SCREEN_W / 1080)) * phoneIn;
  const zoomScale = 1 + (1080 / SCREEN_W - 1) * phoneOut;
  const inner = ip(f, [R.rings[0] - 10, R.rings[0]], [0, 1]) * ip(f, [R.zoomBack - 6, R.zoomBack + 4], [1, 0]);
  const screen: ScreenState = f >= R.kikai ? 'kikai' : f >= R.missed ? 'missed' : 'incoming';
  const ringing = R.rings.some((r) => f >= r && f < r + 14);
  const beatK = phoneIn * (1 - phoneOut); // 0 at both transitions, so they stay seamless
  const bob = Math.sin(((f - R.shrink) / 30) * Math.PI * 0.7) * 7 * beatK;
  const tilt = Math.sin(((f - R.shrink) / 30) * Math.PI * 0.45) * 0.9 * beatK;
  const creep = ip(f, [R.missed, R.zoomBack], [0, 1]);

  // counters
  const shown = reelShown(f);
  const red = ip(shown, [12, 20], [1, 0]);
  const cColor = `rgb(${Math.round(27 + 169 * red)},${Math.round(27 + 56 * red)},${Math.round(27 + 20 * red)})`;
  let pulse = 0;
  if (shown <= 12) {
    let k = f;
    while (k > 0 && reelShown(k - 1) === shown) k--;
    pulse = ip(f - k, [0, 6], [1, 0]);
  }
  const countO = f < R.stall + 4 ? 1 : f < R.resume ? ip(f, [R.stall + 4, R.stall + 10], [1, 0]) : ip(f, [R.resume, R.resume + 6, R.impact + 16, R.impact + 22], [0, 1, 1, 0]);
  const ringN = R.rings.filter((r) => f >= r).length;
  const ringO = ip(f, [R.rings[0] - 4, R.rings[0] + 4, R.zoomBack - 8, R.zoomBack], [0, 1, 1, 0]);
  const flash = f >= R.impact ? ip(f - R.impact, [0, 1, 5], [0, 0.9, 0]) : 0;

  // end card + loop
  const card = ip(f, [R.card, R.card + 14], [0, 1], ease);
  const cardT = ip(f, [R.card, R.total], [0, 1]);
  const pillFill = ip(f, [R.v.v7, R.v.v7 + 6], [0, 1]);
  const loop = ip(f, [R.loopOut, R.total - 1], [0, 1], ease);

  const sceneEl = (
    <AbsoluteFill style={{filter: pullBlur > 0.1 ? `blur(${pullBlur}px)` : undefined}}>
      <Scene f={f} wire={wire} cam={cam} shake={shake} envBlur={envBlur} />
    </AbsoluteFill>
  );
  const loopScene = <Scene f={0} wire={0} cam={WIDE_CAM} shake={{x: 0, y: 0}} />;

  return (
    <AbsoluteFill style={{background: BG}}>
      {!inPhone ? (
        sceneEl
      ) : (
        <AbsoluteFill style={{transform: `translateY(${-125 * beatK + bob}px) scale(${1 - 0.22 * beatK + 0.035 * creep * beatK}) rotate(${tilt}deg)`}}>
          <AbsoluteFill style={{scale: String(zoomScale)}}>
            <Phone f={f} inner={inner} screen={screen} scale={phoneFrameScale} buzz={ringing}>
              {sceneEl}
            </Phone>
          </AbsoluteFill>
        </AbsoluteFill>
      )}

      {/* counters */}
      {!inPhone ? (
        <BigCounter label={f >= R.impact ? 'IMPACT' : 'FRAMES TO IMPACT'} labelColor={f >= R.impact ? RED : '#6e6a64'} value={String(shown).padStart(3, '0')} color={cColor} o={countO} pulse={pulse} />
      ) : (
        <BigCounter
          label={f >= R.kikai ? 'ANSWERED BY KIKAI' : f >= R.missed ? 'MISSED CALL' : 'RINGS'}
          labelColor={f >= R.kikai ? '#b86a14' : f >= R.missed ? RED : '#6e6a64'}
          value={f >= R.kikai ? '001' : String(Math.max(1, ringN)).padStart(3, '0')}
          color={f >= R.kikai ? '#d4790c' : f >= R.missed ? RED : '#1b1b1b'}
          o={ringO}
          pulse={f >= R.booked ? ip(f - R.booked, [0, 8], [1, 0]) : f >= R.kikai ? ip(f - R.kikai, [0, 8], [1, 0]) : 0}
        />
      )}

      {/* captions */}
      <Caption f={f} l1="You just watched a bullet" l2="for 7 seconds." at={R.v.v1} len={F('v1')} until={R.v.v2 - 10} top={CAP_LOW} />
      <Caption f={f} l1="A bullet" l2="that doesn't even exist." at={R.v.v2} len={F('v2')} until={R.v.v3 - 10} top={CAP_LOW} />
      <Caption f={f} l1="And you're still here," l2="waiting for it to hit." at={R.v.v3} len={F('v3')} until={R.shrink + 6} top={CAP_LOW} />
      <Caption f={f} l1="But your callers?" l2="They won't wait that long." at={R.v.v4} len={F('v4')} until={R.kikai - 6} top={CAP_HIGH} />
      <Caption f={f} l1="Kikai picks up." l2="Day or night." at={R.v.v5} len={F('v5')} until={R.zoomBack - 4} top={CAP_HIGH} />

      <AbsoluteFill style={{background: '#fffaf0', opacity: flash}} />
      <CtaTag f={f} />

      {/* end card */}
      <AbsoluteFill style={{background: BG, opacity: card}}>
        <AbsoluteFill style={{background: `radial-gradient(ellipse 65% 42% at ${35 + 30 * cardT}% ${44 + 6 * Math.sin(cardT * Math.PI)}%, rgba(255,255,255,0.8), rgba(255,255,255,0) 70%)`}} />
      </AbsoluteFill>
      <AbsoluteFill style={{opacity: card, alignItems: 'center', justifyContent: 'center', scale: String(1 + 0.07 * cardT)}}>
        <div style={{display: 'flex', fontFamily: SANS, fontWeight: 300, fontSize: 170, letterSpacing: 34, color: '#141414', marginLeft: 34}}>
          {'KIKAI'.split('').map((ch, i) => {
            const p = ip(f, [R.card + 4 + i * 3, R.card + 16 + i * 3], [0, 1], ease);
            return (
              <span key={i} style={{opacity: p, translate: `0 ${(1 - p) * 30}px`, filter: `blur(${(1 - p) * 8}px)`, color: i === 1 || i === 4 ? '#141414' : '#141414'}}>
                {ch}
              </span>
            );
          })}
        </div>
        <div style={{marginTop: 26, fontFamily: MONO, fontSize: 24, letterSpacing: ip(f, [R.v.v6 + 30, R.total], [8, 5.5]), color: '#6e6a64', opacity: ip(f, [R.v.v6 + 30, R.v.v6 + 46], [0, 1])}}>
          THE AI RECEPTIONIST FOR UK SALONS
        </div>
        <div
          style={{
            marginTop: 90,
            padding: '22px 40px',
            borderRadius: 999,
            border: '2px solid #1b1b1b',
            fontFamily: SANS,
            fontWeight: 500,
            fontSize: 34,
            background: `rgba(20,20,20,${pillFill})`,
            color: pillFill > 0.5 ? '#fff' : '#1b1b1b',
            opacity: ip(f, [R.cta, R.cta + 10], [0, 1]),
            scale: String(ip(f, [R.cta, R.cta + 10], [0.85, 1], ease) * (1 + 0.08 * ip(f, [R.v.v7, R.v.v7 + 4, R.v.v7 + 14], [0, 1, 0]))),
          }}
        >
          Comment “BOOK” for a free demo
        </div>
      </AbsoluteFill>

      {/* loop back to the first frame */}
      <AbsoluteFill style={{opacity: loop}}>
        {loopScene}
        <BigCounter label="FRAMES TO IMPACT" value="200" color="#1b1b1b" o={1} />
      </AbsoluteFill>
      <HUD f={f} />
    </AbsoluteFill>
  );
};
