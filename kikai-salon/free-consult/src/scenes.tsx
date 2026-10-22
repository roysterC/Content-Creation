import React from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {BrickWall, Glow, Layer, PhoneFlat, Ribbon, SmallDiary, spline} from './art';
import cues from './cues.json';
import {Diary, Entry, INK} from './diary';
import {Bokeh, PriyaHead, PriyaShoulders} from './people';
import {Salon} from './salon';
import {EASE, EASE_OUT, ip, P, SANS, SERIF} from './theme';

const S = cues.scenes;
const X = cues.sfx;
const V = cues.vo;
type SceneName = keyof typeof S;
const useAbs = (name: SceneName) => useCurrentFrame() + S[name].start;

/* 1 ─ Hook: busy Saturday, the phone is already ringing on frame 0 */
export const Hook: React.FC = () => {
  const abs = useAbs('hook');
  const push = ip(abs, [0, S.hook.dur], [0, 1], EASE);
  return <Salon cam={{x: 760, y: 1500, s: 1.08 + push * 0.14, py: -150 - push * 40}} ring={abs} focus={{bg: 1.5, mid: 0.8}} />;
};

/* the desk close-up, shared by the missed call and Kikai answering */
const PHONE_AT = {x: 760, y: 1440};
const DIARY_AT = {x: 290, y: 1490};
const DESK_RIBBON = spline([
  [PHONE_AT.x - 40, PHONE_AT.y - 40],
  [700, 1250],
  [520, 1220],
  [380, 1330],
  [DIARY_AT.x + 10, DIARY_AT.y - 20],
]);

const DeskShot: React.FC<{
  f: number;
  ring: number;
  ringEnd?: number;
  glow: number;
  ribbon?: number;
  diaryGlow?: number;
  face: {turn: number; brow?: number; smile?: number; blink?: number; open?: number};
  rack: number; // 0 focus on Priya, 1 focus on the phone
}> = ({f, ring, ringEnd, glow, ribbon = 0, diaryGlow = 0, face, rack}) => (
  <AbsoluteFill style={{background: '#3a2219'}}>
    <Layer cam={{x: 540, y: 900, s: 1.02 + f * 0.0008}} depth={0.6}>
      <Bokeh seed="desk" tone="warm" />
    </Layer>
    <Layer cam={{x: 420, y: 1000, s: 1 + f * 0.0012}} blur={rack * 6}>
      <g transform="translate(420 1000) scale(0.92)">
        <PriyaShoulders back />
        <PriyaHead turn={face.turn} gaze={face.turn > 0.2 ? 0.6 : -0.5} brow={face.brow} smile={face.smile} blink={face.blink} open={face.open} tilt={face.turn * 4} />
      </g>
    </Layer>
    {/* her hands: full of foils and a tint brush, out of focus in front */}
    <Layer blur={8}>
      <g transform="translate(120 1210) rotate(-14)">
        <rect x={-120} y={-60} width={240} height={150} rx={10} fill="#dfe3e6" stroke="#aab0b5" strokeWidth={6} />
        <path d="M -90 -20 L 80 -30 M -80 30 L 90 20" stroke="#b9bfc4" strokeWidth={5} />
        <ellipse cx={-110} cy={30} rx={70} ry={52} fill={P.skin} />
        <ellipse cx={120} cy={10} rx={66} ry={50} fill={P.skin} />
        <rect x={130} y={-120} width={18} height={130} rx={8} fill={P.charcoal} transform="rotate(30 140 0)" />
      </g>
    </Layer>
    <Layer cam={{x: PHONE_AT.x, y: PHONE_AT.y, s: 1 + f * 0.001}} blur={6 - rack * 6}>
      <rect x={-100} y={1300} width={1300} height={700} fill={P.woodLight} />
      <rect x={-100} y={1300} width={1300} height={18} fill={P.brass} />
      {Array.from({length: 8}).map((_, i) => (
        <path key={i} d={`M -100 ${1360 + i * 76} Q 540 ${1345 + i * 78} 1200 ${1368 + i * 76}`} stroke={P.wood} strokeWidth={3} fill="none" opacity={0.45} />
      ))}
      <g transform={`translate(${DIARY_AT.x} ${DIARY_AT.y}) scale(1.6)`}>
        <SmallDiary x={0} y={0} glow={diaryGlow} />
      </g>
      <PhoneFlat x={PHONE_AT.x} y={PHONE_AT.y} s={2.4} ring={ring} ringEnd={ringEnd} rot={-10} />
    </Layer>
    <Layer blend="screen" cam={{x: PHONE_AT.x, y: PHONE_AT.y, s: 1 + f * 0.001}}>
      <Glow id="dGlow" x={PHONE_AT.x} y={PHONE_AT.y - 20} r={300 + glow * 420} o={glow} />
      <Glow id="dGlowCore" x={PHONE_AT.x} y={PHONE_AT.y - 20} r={150} o={glow} />
      <Glow id="dFace" x={440} y={1000} r={340} o={glow * 0.35} />
      <Glow id="dDiary" x={DIARY_AT.x} y={DIARY_AT.y} r={260} o={diaryGlow * 0.8} />
      <Ribbon id="dRib" pts={DESK_RIBBON} head={ribbon} tail={0.5} width={16} o={ip(ribbon, [0.85, 1], [1, 0])} />
    </Layer>
  </AbsoluteFill>
);

/* 2 ─ Missed: she can't get to it, and it rings out */
export const Missed: React.FC = () => {
  const abs = useAbs('missed');
  const f = abs - S.missed.start;
  const turn = ip(f, [4, 20], [-0.8, 0.5], EASE);
  const brow = ip(f, [16, 24], [0, 1], EASE_OUT) * ip(abs, [X.ringEnd, X.ringEnd + 14], [1, 0.3]);
  const away = ip(abs, [X.ringEnd + 4, X.ringEnd + 20], [0, 1], EASE); // gives up, back to the client
  return (
    <DeskShot
      f={f}
      ring={abs}
      ringEnd={X.ringEnd}
      glow={0}
      face={{turn: turn - away * 1.2, brow, smile: -0.2, blink: f > 34 && f < 39 ? 1 : 0}}
      rack={ip(f, [30, 46], [0, 1], EASE)}
    />
  );
};

/* 3 ─ Lost: the salon down the road picks up instead */
export const Lost: React.FC = () => {
  const abs = useAbs('lost');
  const f = abs - S.lost.start;
  const push = 1.0 + f * 0.0011;
  const lit = ip(abs, [X.rivalBooked[0] - 4, X.rivalBooked[0] + 10], [0.35, 1]);
  return (
    <AbsoluteFill style={{background: '#e9d6b8'}}>
      <AbsoluteFill style={{transformOrigin: '540px 1080px', scale: String(push)}}>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920">
          <defs>
            <linearGradient id="rWin" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffe6b0" />
              <stop offset="1" stopColor="#f2c27a" />
            </linearGradient>
          </defs>
          <BrickWall w={1080} h={1560} seed="rival" />
          <rect width={1080} height={1560} fill="#3b2418" opacity={0.18} />
          {/* fascia */}
          <rect x={90} y={560} width={900} height={150} rx={10} fill="#2f4a4f" />
          <rect x={104} y={574} width={872} height={122} rx={6} fill="none" stroke={P.brass} strokeWidth={4} />
          <text x={540} y={655} textAnchor="middle" fontFamily={SERIF} fontStyle="italic" fontSize={62} fill={P.amberSoft}>
            The Salon Down the Road
          </text>
          {/* awning */}
          {Array.from({length: 10}).map((_, i) => (
            <path key={i} d={`M ${110 + i * 86} 720 L ${196 + i * 86} 720 L ${196 + i * 86} 800 Q ${153 + i * 86} 830 ${110 + i * 86} 800 Z`} fill={i % 2 ? '#f4ecdd' : '#3f6b62'} />
          ))}
          {/* window + door */}
          <rect x={110} y={830} width={600} height={640} rx={8} fill={P.charcoal} />
          <rect x={130} y={850} width={560} height={600} rx={4} fill="url(#rWin)" opacity={lit} />
          <rect x={130} y={850} width={560} height={600} rx={4} fill="#1d2433" opacity={1 - lit} />
          {/* silhouettes inside: a stylist and a happy client */}
          <g opacity={0.55}>
            <ellipse cx={330} cy={1180} rx={58} ry={66} fill="#6b4a33" />
            <path d="M 250 1450 Q 250 1260 330 1250 Q 410 1260 410 1450 Z" fill="#6b4a33" />
            <ellipse cx={520} cy={1110} rx={52} ry={60} fill="#7e5a40" />
            <path d="M 440 1400 Q 450 1190 520 1180 Q 600 1190 600 1400 Z" fill="#7e5a40" />
          </g>
          <path d="M 160 1400 L 400 870" stroke="#fff" strokeWidth={26} opacity={0.18} />
          <rect x={740} y={830} width={230} height={640} rx={8} fill={P.charcoal} />
          <rect x={760} y={850} width={190} height={430} rx={4} fill="url(#rWin)" opacity={lit * 0.9} />
          <rect x={918} y={1150} width={12} height={70} rx={6} fill={P.brass} />
          <g transform="translate(855 960)">
            <rect x={-62} y={-30} width={124} height={54} rx={8} fill={P.cream} stroke={P.brass} strokeWidth={3} />
            <text x={0} y={6} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={26} letterSpacing={3} fill={P.charcoal}>
              OPEN
            </text>
          </g>
          {/* pavement */}
          <rect x={0} y={1470} width={1080} height={460} fill="#b9ab98" />
          {Array.from({length: 7}).map((_, i) => (
            <line key={i} x1={i * 180 - 40} y1={1470} x2={i * 180 - 140} y2={1920} stroke="#a59682" strokeWidth={4} />
          ))}
          <rect x={0} y={1470} width={1080} height={16} fill="#000" opacity={0.15} />
          <g transform="translate(1000 1470)">
            <path d="M -40 0 L 40 0 L 30 -90 L -30 -90 Z" fill="#e2d5bd" />
            {[-26, -8, 10, 26].map((dx, i) => (
              <circle key={i} cx={dx} cy={-110 - (i % 2) * 24} r={30} fill={i % 2 ? P.leaf2 : P.leaf} />
            ))}
          </g>
        </svg>
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 60% 40% at 40% 60%, rgba(255,214,140,0.35), transparent 70%)', mixBlendMode: 'screen', opacity: lit}} />
    </AbsoluteFill>
  );
};

/* 4 ─ Kikai: same desk, same phone, now it's answered; then after hours; then the diary */
const NEW: Entry[] = [
  {id: 'n1', col: 0, row: 1.5, text: 'Cut & colour', at: X.write[0], amber: true, dur: 12},
  {id: 'n2', col: 1, row: 3.5, text: 'Ella · trim', at: X.write[1], amber: true, dur: 12},
  {id: 'n3', col: 2, row: 5, text: 'Bea · blow dry', at: X.write[2], amber: true, dur: 12},
  {id: 'n4', col: 3, row: 2.5, text: 'Tue patch test', at: X.write[3], amber: true, dur: 12},
];

export const KikaiScene: React.FC = () => {
  const abs = useAbs('kikai');
  const f = abs - S.kikai.start;
  const sw = X.switch;
  const glow = ip(abs, [sw, sw + 10], [0, 1], EASE_OUT) * (0.85 + 0.15 * Math.sin(f / 7));
  const ribbon = ip(abs, [sw + 24, sw + 60], [0, 1], EASE);
  const diaryGlow = ip(abs, [sw + 50, sw + 62, sw + 110], [0, 1, 0.4]);
  const smile = ip(abs, [sw + 16, sw + 40], [0, 1], EASE);
  const night = ip(abs, [X.nightIn, X.nightIn + 12], [0, 1], EASE);
  const g = X.dayNight;
  const nightGlow = Math.max(ip(abs, [g - 6, g + 2, g + 30], [0, 1, 0.5]), night * 0.25);
  const diary = ip(abs, [X.diaryIn, X.diaryIn + 8], [0, 1], EASE);
  return (
    <AbsoluteFill>
      {abs < X.nightIn + 12 ? (
        <DeskShot
          f={f + 40}
          ring={abs - sw + 6}
          ringEnd={8}
          glow={glow}
          ribbon={ribbon}
          diaryGlow={diaryGlow}
          face={{turn: ip(abs, [sw + 4, sw + 24], [0.5, -0.5], EASE), smile, brow: 0.2 * smile, blink: abs > sw + 50 && abs < sw + 55 ? 1 : 0}}
          rack={ip(abs, [sw, sw + 30], [0.4, 1], EASE)}
        />
      ) : null}
      {abs >= X.nightIn ? (
        <AbsoluteFill style={{opacity: night}}>
          <Salon
            cam={{x: 900, y: 1520, s: 1.12 + (abs - X.nightIn) * 0.002, py: -170}}
            night={1}
            people={{jo: 0, c2: 0, sam: 0, c1: 0, priya: 0, cfg: 0}}
            door={{priya: 0, reach: 0, sign: 1}}
            rain={1}
            ring={abs - g + 10}
            ringEnd={12}
            glow={nightGlow}
            diaryGlow={ip(abs, [g + 14, g + 22, g + 50], [0, 1, 0.3])}
            ribbons={[{head: ip(abs, [g + 2, g + 24], [0, 1], EASE), o: ip(abs, [g + 22, g + 34], [1, 0])}]}
            focus={{bg: 2, mid: 1}}
          />
          <div style={{position: 'absolute', top: 640, left: 0, right: 0, textAlign: 'center', opacity: ip(abs, [g - 4, g + 6], [0, 1])}}>
            <span style={{display: 'inline-block', fontFamily: SANS, fontWeight: 600, fontSize: 44, color: P.amberSoft, background: 'rgba(16,22,40,0.7)', borderRadius: 999, padding: '10px 30px'}}>
              ☾ Sunday · 9:47pm
            </span>
          </div>
        </AbsoluteFill>
      ) : null}
      {abs >= X.diaryIn ? (
        <AbsoluteFill style={{opacity: diary, background: '#6e4426'}}>
          <svg width={1080} height={1920} viewBox="0 0 1080 1920">
            <g transform={`translate(540 960) scale(${1.0 + (abs - X.diaryIn) * 0.0012}) translate(-500 -360)`}>
              <Diary abs={abs} entries={[...INK, ...NEW]} glow={ip(abs, [X.write[3], X.write[3] + 30], [0, 1])} />
            </g>
          </svg>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

/* 5 ─ Offer: the drop lands on "A free consultation" */
const Check: React.FC<{p: number; text: string}> = ({p, text}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 22, opacity: p, translate: `${(1 - p) * -30}px 0`, marginTop: 26}}>
    <div style={{width: 58, height: 58, borderRadius: 29, background: P.amber, display: 'flex', alignItems: 'center', justifyContent: 'center', scale: String(ip(p, [0, 0.6, 1], [0.4, 1.2, 1])), flexShrink: 0}}>
      <svg width={34} height={34} viewBox="0 0 24 24">
        <path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="#2a1a10" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
    <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 42, color: P.cream, lineHeight: 1.15}}>{text}</div>
  </div>
);

export const Offer: React.FC = () => {
  const abs = useAbs('offer');
  const f = abs - S.offer.start;
  const d = X.drop;
  const gather = ip(abs, [V.v6, d], [0, 1], EASE);
  const slam = ip(abs, [d, d + 7], [0, 1], EASE_OUT);
  const flash = ip(abs, [d - 1, d, d + 10], [0, 1, 0]);
  const shake = abs >= d ? ip(abs - d, [0, 10], [14, 0]) : 0;
  const breathe = 1 + Math.sin(f / 16) * 0.04;
  const label = ip(abs, [V.v6 + 2, V.v6 + 14], [0, 1], EASE_OUT);
  return (
    <AbsoluteFill style={{background: P.sageDark}}>
      <svg width={1080} height={1920} style={{position: 'absolute', mixBlendMode: 'screen'}}>
        <Glow id="offGlow" x={540} y={860} r={(380 + slam * 360) * breathe} o={0.35 + slam * 0.3} edge="#ffb75a" core="#ffd89a" />
        {Array.from({length: 28}).map((_, i) => {
          const sx = random(`fx${i}`) * 1080;
          const sy = 300 + random(`fy${i}`) * 1300;
          const k = Math.min(1, gather * 1.05);
          const x = sx + (540 - sx) * k + Math.sin(f / 9 + i) * 6;
          const y = sy + (860 - sy) * k;
          return <circle key={i} cx={x} cy={y} r={4 + random(`fr${i}`) * 6} fill={P.amberSoft} opacity={(0.9 - k * 0.5) * (1 - slam)} />;
        })}
        {/* burst on the drop */}
        {Array.from({length: 18}).map((_, i) => {
          const a = (i / 18) * Math.PI * 2;
          const r = 200 + slam * 460 + (abs - d) * 2;
          return <circle key={i} cx={540 + Math.cos(a) * r} cy={860 + Math.sin(a) * r * 0.9} r={5} fill={P.amberCore} opacity={abs >= d ? ip(abs - d, [0, 30], [1, 0]) : 0} />;
        })}
      </svg>
      <AbsoluteFill style={{translate: `${(random(`sx${abs}`) - 0.5) * shake}px ${(random(`sy${abs}`) - 0.5) * shake}px`}}>
        <div style={{position: 'absolute', top: 560, left: 0, right: 0, textAlign: 'center', opacity: label * (1 - slam * 0.35)}}>
          <span style={{fontFamily: SANS, fontWeight: 700, fontSize: 38, letterSpacing: 8, color: P.amberSoft}}>OUR OFFER TO YOUR SALON</span>
        </div>
        <div style={{position: 'absolute', top: 640, left: 0, right: 0, textAlign: 'center', opacity: slam, scale: String(1.6 - 0.6 * slam)}}>
          <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 290, lineHeight: 0.92, letterSpacing: -10, color: P.cream}}>FREE</div>
          <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 150, lineHeight: 1, color: P.amberSoft, marginTop: -6}}>consultation</div>
        </div>
        <div style={{position: 'absolute', top: 1130, left: 150, right: 150}}>
          <Check p={ip(abs, [X.tick[0], X.tick[0] + 10], [0, 1], EASE_OUT)} text="We look at the calls you're missing" />
          <Check p={ip(abs, [X.tick[1], X.tick[1] + 10], [0, 1], EASE_OUT)} text="We show you Kikai working for your salon" />
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{background: '#fff3d6', opacity: flash * 0.8, mixBlendMode: 'screen'}} />
    </AbsoluteFill>
  );
};

/* 6 ─ End card */
export const EndCard: React.FC = () => {
  const abs = useAbs('endCard');
  const f = abs - S.endCard.start;
  const breathe = 1 + Math.sin(f / 18) * 0.04;
  const t = (at: number) => ip(f, [at, at + 14], [0, 1], EASE_OUT);
  const pill = ip(abs, [X.pill, X.pill + 6], [0, 1]);
  const pop = ip(abs, [X.pill, X.pill + 4, X.pill + 14], [0, 1, 0]);
  const line = (at: number, style: React.CSSProperties, text: string) => (
    <div style={{opacity: t(at), translate: `0 ${(1 - t(at)) * 18}px`}}>
      <div style={style}>{text}</div>
    </div>
  );
  return (
    <AbsoluteFill style={{background: P.sageDeep}}>
      <svg width={1080} height={1920} style={{position: 'absolute', mixBlendMode: 'screen'}}>
        <Glow id="cardGlow" x={540} y={760} r={620 * breathe} o={0.55} edge="#ffb75a" core="#ffd89a" />
        <Glow id="cardOrb" x={540} y={600} r={110 * breathe} o={0.9} />
      </svg>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: P.cream, paddingBottom: 60, scale: String(1 + f * 0.0006)}}>
        {line(2, {fontFamily: SERIF, fontSize: 230, lineHeight: 1, letterSpacing: -2}, 'Kikai')}
        {line(10, {fontFamily: SANS, fontWeight: 500, fontSize: 46, marginTop: 26}, 'The AI receptionist for UK salons')}
        <div style={{opacity: t(16), translate: `0 ${(1 - t(16)) * 18}px`, marginTop: 80}}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 16,
              padding: '22px 36px',
              borderRadius: 999,
              border: `3px solid ${P.amber}`,
              background: `rgba(255,179,71,${pill})`,
              color: pill > 0.5 ? '#2a1a10' : P.cream,
              fontFamily: SANS,
              fontWeight: 700,
              fontSize: 34,
              scale: String(1 + 0.08 * pop),
              boxShadow: `0 0 ${50 * pill}px rgba(255,179,71,0.5)`,
            }}
          >
            Comment “FREE” for a free consultation
          </div>
        </div>
        {line(30, {fontFamily: SANS, fontWeight: 600, fontSize: 36, marginTop: 40, color: P.amberSoft}, 'kikaiagency.vercel.app')}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
