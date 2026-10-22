import React from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {BrickWall, Glow, Layer, PhoneFlat, Ribbon, SmallDiary, spline} from './art';
import cues from './cues.json';
import {Diary, Entry, INK} from './diary';
import {Bokeh, Caller, PriyaHead, PriyaShoulders} from './people';
import {Salon} from './salon';
import {EASE, EASE_OUT, ip, P, SANS, SERIF} from './theme';

const S = cues.scenes;
const X = cues.sfx;
const V = cues.vo;
type SceneName = keyof typeof S;
const useAbs = (name: SceneName) => useCurrentFrame() + S[name].start;

const Overlay: React.FC<{text: string; at: number; abs: number; top: number; size?: number; color?: string; hold?: number; italic?: boolean}> = ({
  text,
  at,
  abs,
  top,
  size = 78,
  color = P.cream,
  hold,
  italic = true,
}) => {
  const inn = ip(abs, [at, at + 14], [0, 1], EASE_OUT);
  const out = hold ? ip(abs, [at + hold, at + hold + 12], [1, 0]) : 1;
  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: 70,
        right: 70,
        textAlign: 'center',
        fontFamily: SERIF,
        fontStyle: italic ? 'italic' : 'normal',
        fontSize: size,
        lineHeight: 1.1,
        color,
        opacity: inn * out,
        translate: `0 ${(1 - inn) * 24}px`,
        filter: `blur(${(1 - inn) * 6}px)`,
        textShadow: '0 4px 30px rgba(30,15,5,0.55)',
      }}
    >
      {text}
    </div>
  );
};

/* 1 ─ Saturday rush */
export const Rush: React.FC = () => {
  const abs = useAbs('rush');
  const push = ip(abs, [0, S.rush.dur], [0, 1], EASE);
  const rack = ip(abs, [X.ringStart + 6, X.ringStart + 20], [0, 1], EASE);
  return (
    <Salon
      cam={{x: 660, y: 1470, s: 1 + push * 0.2}}
      ring={abs - X.ringStart}
      focus={{bg: 2.5, mid: 1.5, priya: rack * 5, fg: 4 - rack * 4}}
    />
  );
};

/* 2 ─ The missed moment */
export const Missed: React.FC = () => {
  const abs = useAbs('missed');
  const f = abs - S.missed.start;
  const turn = ip(f, [10, 28], [-0.8, 0.5], EASE);
  const brow = ip(f, [24, 32], [0, 1], EASE_OUT) * ip(f, [70, 86], [1, 0.4]);
  const blink = f > 40 && f < 45 ? 1 : 0;
  const rack = ip(f, [44, 58], [0, 1], EASE);
  const g = ip(abs, [X.glow, X.glow + 16], [0, 1], EASE_OUT);
  const ring = abs - X.ringStart;
  return (
    <AbsoluteFill style={{background: '#3a2219'}}>
      <Layer cam={{x: 540, y: 900, s: 1 + f * 0.0008}} depth={0.6}>
        <Bokeh seed="m" tone="warm" />
      </Layer>
      <Layer cam={{x: 430, y: 800, s: 1 + f * 0.0012}} blur={rack * 7}>
        <g transform="translate(450 780)">
          <PriyaShoulders back />
          <PriyaHead turn={turn} gaze={turn > 0.2 ? 0.6 : -0.5} brow={brow} blink={blink} smile={-0.1} tilt={turn * 4} />
        </g>
      </Layer>
      {/* foiled hands, out of focus in front */}
      <Layer blur={9}>
        <g transform="translate(140 1440) rotate(-14)">
          <rect x={-120} y={-60} width={240} height={150} rx={10} fill="#dfe3e6" stroke="#aab0b5" strokeWidth={6} />
          <path d="M -90 -20 L 80 -30 M -80 30 L 90 20" stroke="#b9bfc4" strokeWidth={5} />
          <ellipse cx={-120} cy={30} rx={70} ry={52} fill={P.skin} />
          <ellipse cx={120} cy={10} rx={66} ry={50} fill={P.skin} />
        </g>
      </Layer>
      <Layer cam={{x: 800, y: 1560, s: 1 + f * 0.001}} blur={7 - rack * 7}>
        <rect x={-100} y={1430} width={1300} height={600} fill={P.woodLight} />
        <rect x={-100} y={1430} width={1300} height={20} fill={P.brass} />
        <PhoneFlat x={790} y={1580} s={2.6} ring={ring} ringEnd={X.glow - X.ringStart} rot={-10} />
      </Layer>
      <Layer blend="screen" cam={{x: 800, y: 1560, s: 1 + f * 0.001}}>
        <Glow id="mGlow" x={790} y={1560} r={300 + g * 500} o={g} />
        <Glow id="mGlowCore" x={790} y={1560} r={160} o={g} />
        <Glow id="mFace" x={520} y={860} r={340} o={g * 0.35} />
      </Layer>
    </AbsoluteFill>
  );
};

/* 3 ─ Kikai answers */
const TRACK = spline([
  [1820, 1270],
  [1760, 900],
  [1560, 640],
  [1250, 700],
  [1000, 920],
  [760, 760],
  [560, 1060],
  [470, 1290],
]);

const DIARY_NEW: Entry[] = [
  {id: 'a1', col: 0, row: 1.5, text: 'Cut & colour', at: X.write1, amber: true, dur: 30},
  {id: 'a2', col: 3, row: 1.5, text: 'Thu · patch test', at: X.write2, amber: true, dur: 24},
];

export const Answers: React.FC = () => {
  const abs = useAbs('answers');
  const f = abs - S.answers.start;
  const head = ip(f, [2, X.splitAt - S.answers.start - 4], [0, 1], EASE);
  const hi = Math.round(head * (TRACK.length - 1));
  const pan = Math.max(0, Math.min(1080, TRACK[hi][0] - 600));
  const split = ip(abs, [X.splitAt, X.splitAt + 12], [0, 1], EASE_OUT);
  const close = ip(abs, [X.closeAt, X.closeAt + 14], [0, 1], EASE);
  const callerSmile = ip(abs, [V.k2, V.k2 + 60], [0.4, 1]);
  const talk = abs >= V.c1 && abs < V.c1 + cues.voLen.c1 ? 1 : 0;
  const arrive = ip(f, [X.splitAt - S.answers.start - 12, X.splitAt - S.answers.start + 4], [0, 1]);

  return (
    <AbsoluteFill style={{background: '#4a2e1f'}}>
      {/* A: tracking shot along the desk */}
      <AbsoluteFill style={{translate: `${-pan}px 0`}}>
        <Layer w={2160} blur={10}>
          <BrickWall w={2160} h={1000} seed="deskwall" />
          <rect width={2160} height={1000} fill="#2a160c" opacity={0.35} />
        </Layer>
        <Layer w={2160}>
          <polygon points="0,980 2160,980 2160,1920 0,1920" fill={P.woodLight} />
          {Array.from({length: 12}).map((_, i) => (
            <path key={i} d={`M 0 ${1020 + i * 80} Q 1080 ${1000 + i * 82} 2160 ${1030 + i * 80}`} stroke={P.wood} strokeWidth={3} fill="none" opacity={0.5} />
          ))}
          <rect x={0} y={970} width={2160} height={18} fill="#000" opacity={0.2} />
          <g transform="translate(470 1340) scale(2.4)">
            <SmallDiary x={0} y={0} glow={arrive} />
          </g>
          <g transform="translate(1300 1180) scale(2.2)">
            <path d="M -34 0 L 34 0 L 28 44 L -28 44 Z" fill="#e6dac3" />
            {[-30, -10, 10, 30, 0].map((a, i) => (
              <path key={i} transform={`rotate(${a * 1.6})`} d="M 0 0 C -12 -20 -8 -44 0 -52 C 8 -44 12 -20 0 0 Z" fill={i % 2 ? P.leaf2 : P.sageDeep} />
            ))}
          </g>
          <g transform="translate(1000 1500) rotate(12)">
            <rect x={-150} y={-10} width={300} height={20} rx={10} fill={P.charcoal} />
            {Array.from({length: 24}).map((_, i) => (
              <rect key={i} x={-140 + i * 12} y={-30} width={4} height={22} fill={P.charcoal} />
            ))}
          </g>
          <PhoneFlat x={1820} y={1300} s={2.3} ring={-1} rot={-12} />
        </Layer>
        <Layer w={2160} blend="screen">
          <Glow id="trkPhone" x={1820} y={1280} r={520} o={ip(f, [0, 30], [1, 0.4])} />
          <Glow id="trkDiary" x={470} y={1330} r={420} o={arrive * 0.8} />
          <Ribbon id="trk" pts={TRACK} head={head} tail={0.4} width={22} />
        </Layer>
      </AbsoluteFill>

      {/* B/C: diary (bottom half, then full) */}
      <AbsoluteFill style={{opacity: split}}>
        <AbsoluteFill style={{background: '#6e4426'}} />
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
          <g transform={`translate(${40 - close * 40} ${1120 - close * 520}) scale(${1 + close * 0.08})`}>
            <Diary abs={abs} entries={[...INK, ...DIARY_NEW]} />
          </g>
        </svg>
      </AbsoluteFill>
      {/* B: caller at home, top half */}
      <AbsoluteFill style={{height: 960, overflow: 'hidden', translate: `0 ${(-1 + split) * 960 - close * 980}px`}}>
        <svg width={1080} height={960} viewBox="0 0 1080 960">
          <rect width={1080} height={960} fill="#ead6c6" />
          <rect x={740} y={90} width={260} height={380} rx={8} fill="#f8ead2" stroke="#c9ab8a" strokeWidth={10} />
          <circle cx={870} cy={230} r={70} fill="#d79a6a" opacity={0.6} />
          <rect x={90} y={160} width={180} height={220} rx={6} fill={P.sage} opacity={0.5} />
          <rect x={0} y={600} width={1080} height={360} rx={40} fill="#c46e4e" />
          <rect x={-40} y={520} width={1160} height={160} rx={60} fill="#b65f41" />
          <g transform="translate(540 450)">
            <Caller talk={talk} smile={callerSmile} />
          </g>
          <ellipse cx={160} cy={640} rx={110} ry={70} fill="#e7c889" />
          <Glow id="lamp" x={980} y={540} r={300} o={0.35} />
        </svg>
        <div style={{position: 'absolute', bottom: 0, left: 0, right: 0, height: 6, background: P.cream, opacity: 0.9}} />
      </AbsoluteFill>
      <Overlay text="Answered. Booked. Patch test sorted." at={X.overlay3} abs={abs} top={300} size={84} />
    </AbsoluteFill>
  );
};

/* 4 ─ After hours */
const STAMPS = ['Sat 7:42pm', 'Sun 9:10pm', 'Sun 9:47pm'];

export const AfterHours: React.FC = () => {
  const abs = useAbs('afterHours');
  const f = abs - S.afterHours.start;
  const night = ip(f, [16, 70], [0, 1], EASE);
  const pop = (at: number) => ip(f, [at, at + 4], [1, 0]);
  const push = ip(f, [70, S.afterHours.dur], [0, 1], EASE);
  const G = X.nightGlows;
  const glow = Math.max(...G.map((g) => ip(abs, [g, g + 6, g + 40], [0, 1, 0.15])), ip(f, [80, 90], [0, 0.12]));
  const diaryGlow = Math.max(...G.map((g) => ip(abs, [g + 20, g + 28, g + 56], [0, 1, 0.2])));
  return (
    <AbsoluteFill>
      <Salon
        cam={{x: 800, y: 1560, s: 1 + push * 0.3}}
        night={night}
        people={{jo: pop(14), c2: pop(14), sam: pop(22), c1: pop(22), priya: pop(30), cfg: pop(30)}}
        door={{
          priya: ip(f, [30, 34], [0, 1]) * ip(f, [58, 64], [1, 0]),
          reach: ip(f, [36, 42], [0, 1]) * ip(f, [50, 56], [1, 0]),
          sign: ip(f, [42, 50], [0, 1], EASE),
        }}
        rain={ip(f, [60, 90], [0, 1])}
        glow={glow}
        diaryGlow={diaryGlow}
        ribbons={G.map((g) => ({head: ip(abs, [g + 2, g + 26], [0, 1], EASE), o: ip(abs, [g + 22, g + 36], [1, 0])}))}
        focus={{bg: push * 3, mid: push * 2}}
      />
      {G.map((g, i) => (
        <Overlay key={g} text={STAMPS[i]} at={g} abs={abs} top={250} size={70} hold={26} italic={false} color={P.amberSoft} />
      ))}
    </AbsoluteFill>
  );
};

/* 5 ─ Next morning */
const MORNING: Entry[] = [
  {id: 'm1', col: 1, row: 3.5, text: 'Ella · cut', at: X.overhead + 4, amber: true, dur: 14},
  {id: 'm2', col: 2, row: 1.5, text: 'Raj · beard', at: X.overhead + 9, amber: true, dur: 14},
  {id: 'm3', col: 0, row: 3, text: 'Kat · colour', at: X.overhead + 14, amber: true, dur: 14},
  {id: 'm4', col: 2, row: 5, text: 'Bea · blow dry', at: X.overhead + 19, amber: true, dur: 14},
  {id: 'm5', col: 1, row: 5, text: 'Ollie · trim', at: X.overhead + 24, amber: true, dur: 14},
  {id: 'm6', col: 0, row: 6, text: 'Zoe · colour', at: X.overhead + 29, amber: true, dur: 14},
  {id: 'm7', col: 1, row: 7, text: 'Sid · cut', at: X.overhead + 34, amber: true, dur: 14},
  {id: 'm8', col: 2, row: 7, text: 'Fay · toner', at: X.overhead + 39, amber: true, dur: 14},
  {id: 'm9', col: 3, row: 4, text: 'Ring Jen back', at: X.overhead + 44, amber: true, dur: 14},
];

export const Morning: React.FC = () => {
  const abs = useAbs('morning');
  const f = abs - S.morning.start;
  const enter = ip(f, [0, 22], [0, 1], EASE_OUT);
  const smile = ip(f, [22, 38], [0.15, 1]);
  const laugh = ip(f, [36, 41, 50], [0, 1, 0]);
  const drop = ip(f, [30, 46], [0, 22], EASE);
  const cup = ip(abs, [X.cupDown - 8, X.cupDown], [0, 1], EASE);
  const over = ip(abs, [X.overhead, X.overhead + 10], [0, 1], EASE);
  const px = -420 + enter * 960;
  return (
    <AbsoluteFill style={{background: '#e9d2b0'}}>
      <Layer cam={{x: 540, y: 900, s: 1.02 + f * 0.0006}}>
        <Bokeh seed="morn" tone="morning" />
      </Layer>
      <Layer>
        <g transform={`translate(${px} 900)`}>
          <PriyaShoulders drop={drop} />
          <g transform={`translate(0 ${drop * 0.6 + laugh * 6})`}>
            <PriyaHead turn={ip(f, [0, 20], [0.4, 0], EASE)} brow={laugh * 0.5} smile={smile} open={laugh * 0.8} blink={laugh > 0.4 || (f > 18 && f < 22) ? 1 : 0} tilt={laugh * -4} />
          </g>
          {/* takeaway coffee */}
          <g transform={`translate(${210} ${360 + cup * 300})`}>
            <path d="M -50 -110 L 50 -110 L 40 60 L -40 60 Z" fill="#c9a77a" />
            <rect x={-56} y={-130} width={112} height={26} rx={8} fill="#f0e8da" />
            <rect x={-48} y={-50} width={96} height={46} fill="#8a6a45" />
            <ellipse cx={-30} cy={20} rx={44} ry={36} fill={P.skin} opacity={1 - cup} />
          </g>
        </g>
        <rect x={0} y={1560} width={1080} height={400} fill={P.woodLight} />
        <rect x={0} y={1560} width={1080} height={14} fill={P.brass} />
      </Layer>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 15% 20%, rgba(255,244,214,0.75), transparent 55%)', mixBlendMode: 'screen'}} />

      {/* overhead diary filling with amber */}
      <AbsoluteFill style={{opacity: over, background: '#6e4426'}}>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920">
          <g transform={`translate(540 980) scale(${1.04 + (abs - X.overhead) * 0.0012}) translate(-500 -360)`}>
            <Diary abs={abs} entries={[...INK, ...DIARY_NEW, ...MORNING]} glow={ip(abs, [X.overhead + 10, X.overhead + 60], [0, 1])} />
          </g>
        </svg>
      </AbsoluteFill>
      <Overlay text="Never miss a booking." at={X.overlay5} abs={abs} top={330} size={96} />
    </AbsoluteFill>
  );
};

/* 6 ─ End card */
export const EndCard: React.FC = () => {
  const abs = useAbs('endCard');
  const f = abs - S.endCard.start;
  const gather = ip(f, [0, 20], [0, 1], EASE);
  const card = ip(abs, [X.card - 4, X.card + 10], [0, 1], EASE);
  const flash = ip(abs, [X.card - 6, X.card, X.card + 14], [0, 1, 0]);
  const breathe = 1 + Math.sin(f / 18) * 0.04;
  const t = (at: number) => ip(f, [at, at + 16], [0, 1], EASE_OUT);
  const line = (at: number, style: React.CSSProperties, text: string) => (
    <div style={{opacity: t(at), translate: `0 ${(1 - t(at)) * 18}px`}}>
      <div style={style}>{text}</div>
    </div>
  );
  return (
    <AbsoluteFill style={{background: '#20140d'}}>
      <Layer>
        <Bokeh seed="end" tone="dim" />
      </Layer>
      <Layer blend="screen">
        {Array.from({length: 26}).map((_, i) => {
          const sx = random(`ox${i}`) * 1080;
          const sy = 300 + random(`oy${i}`) * 1400;
          const x = sx + (540 - sx) * gather;
          const y = sy + (840 - sy) * gather;
          return <circle key={i} cx={x} cy={y} r={4 + random(`or${i}`) * 6} fill={P.amberSoft} opacity={(1 - gather * 0.8) * (1 - card)} />;
        })}
        <Glow id="orb" x={540} y={840} r={(120 + gather * 220) * breathe} o={gather * (1 - card * 0.6)} />
      </Layer>

      <AbsoluteFill style={{opacity: card, background: P.sageDeep}}>
        <svg width={1080} height={1920} style={{position: 'absolute', mixBlendMode: 'screen'}}>
          <Glow id="cardGlow" x={540} y={760} r={620 * breathe} o={0.55} edge="#ffb75a" core="#ffd89a" />
          <Glow id="cardOrb" x={540} y={640} r={110 * breathe} o={0.9} />
        </svg>
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: P.cream, paddingTop: 220}}>
          {line(28, {fontFamily: SERIF, fontSize: 230, lineHeight: 1, letterSpacing: -2}, 'Kikai')}
          {line(46, {fontFamily: SANS, fontWeight: 500, fontSize: 46, marginTop: 30}, 'The AI receptionist for UK salons')}
          {line(112, {fontFamily: SANS, fontWeight: 400, fontSize: 36, marginTop: 70, opacity: 0.9, color: '#e8efe6'}, 'Keeps your number · Live in about a week')}
          {line(136, {fontFamily: SANS, fontWeight: 600, fontSize: 40, marginTop: 26, color: P.amberSoft}, 'kikaiagency.vercel.app')}
        </AbsoluteFill>
      </AbsoluteFill>
      <AbsoluteFill style={{background: '#fff3d6', opacity: flash * 0.7, mixBlendMode: 'screen'}} />
    </AbsoluteFill>
  );
};
