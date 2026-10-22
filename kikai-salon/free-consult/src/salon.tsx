import React from 'react';
import {AbsoluteFill} from 'remotion';
import {
  BigPlant,
  BrickWall,
  Cam,
  Client,
  Desk,
  DIARY,
  Door,
  Floor,
  Glow,
  Layer,
  Mirror,
  Pendant,
  PHONE,
  PriyaAtDoor,
  PriyaWorking,
  Ribbon,
  spline,
  StylistJo,
  StylistSam,
  TrailingPlant,
} from './art';
import {P} from './theme';

export const DESK_RIBBON = spline([
  [PHONE.x, PHONE.y - 10],
  [905, 1440],
  [830, 1385],
  [745, 1440],
  [DIARY.x - 10, DIARY.y - 8],
]);

export type SalonProps = {
  cam: Cam;
  night?: number;
  people?: Partial<Record<'sam' | 'jo' | 'c1' | 'c2' | 'priya' | 'cfg', number>>;
  door?: {priya: number; reach: number; sign: number};
  rain?: number;
  ring?: number;
  ringEnd?: number;
  glow?: number;
  ribbons?: {head: number; o: number}[];
  diaryGlow?: number;
  focus?: {bg?: number; mid?: number; priya?: number; fg?: number};
};

export const Salon: React.FC<SalonProps> = ({
  cam,
  night = 0,
  people = {},
  door = {priya: 0, reach: 0, sign: 0},
  rain = 0,
  ring = -1,
  ringEnd,
  glow = 0,
  ribbons = [],
  diaryGlow = 0,
  focus = {},
}) => {
  const pp = {sam: 1, jo: 1, c1: 1, c2: 1, priya: 1, cfg: 1, ...people};
  const bulbs = 1 - Math.min(1, night * 1.4);
  const dusk = Math.max(0, Math.sin(Math.PI * Math.min(1, night * 1.15)));
  return (
    <AbsoluteFill style={{background: P.charcoal}}>
      {/* background plane */}
      <Layer cam={cam} depth={0.55} blur={focus.bg ?? 0}>
        <BrickWall w={1080} h={1280} seed="wall" />
        <rect x={0} y={0} width={1080} height={1280} fill="url(#wallShade)" />
        <defs>
          <linearGradient id="wallShade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#000" stopOpacity={0.35} />
            <stop offset="0.35" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={0.25} />
          </linearGradient>
        </defs>
        <rect x={0} y={0} width={1080} height={112} fill={P.charcoal} />
        <Door x={40} y={300} w={330} h={972} night={night} sign={door.sign} rain={rain} />
        <TrailingPlant x={720} y={210} seed="tp1" len={240} />
        <line x1={720} y1={110} x2={720} y2={186} stroke="#c9b58f" strokeWidth={3} />
        <Mirror cx={560} cy={610} r={108} on={bulbs} />
        <Mirror cx={880} cy={610} r={108} on={bulbs} />
        <Pendant x={560} len={130} on={bulbs} />
        <Pendant x={880} len={130} on={bulbs} />
        <rect x={400} y={796} width={700} height={36} rx={4} fill={P.woodLight} />
        <rect x={400} y={830} width={700} height={14} fill={P.woodDark} />
        {[440, 470, 640, 680, 980, 1010].map((bx, i) => (
          <rect key={i} x={bx} y={756 - (i % 2) * 14} width={22} height={40 + (i % 2) * 14} rx={6} fill={i % 3 ? '#e9dcc3' : P.sageDeep} />
        ))}
        <BigPlant x={1075} y={1160} s={0.75} />
        <Floor y0={1270} />
      </Layer>

      {/* sun shafts through the door */}
      <Layer cam={cam} depth={0.65} blend="screen" opacity={(1 - night) * 0.42}>
        <defs>
          <linearGradient id="beam" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff2cc" stopOpacity={0.9} />
            <stop offset="1" stopColor="#fff2cc" stopOpacity={0} />
          </linearGradient>
        </defs>
        <polygon points="80,340 200,340 900,1700 560,1920" fill="url(#beam)" />
        <polygon points="230,340 330,340 1080,1450 1000,1650" fill="url(#beam)" opacity={0.7} />
      </Layer>

      {/* midground: stations */}
      <Layer cam={cam} depth={0.8} blur={focus.mid ?? 0}>
        <g opacity={pp.c1}>
          <Client x={560} y={880} s={0.9} hair="#b48a5a" />
        </g>
        <g opacity={pp.c2}>
          <Client x={880} y={880} s={0.9} hair="#3a2a22" curls />
        </g>
        <g opacity={pp.sam}>
          <StylistSam x={418} y={820} />
        </g>
        <g opacity={pp.jo}>
          <StylistJo x={1012} y={820} />
        </g>
        <g opacity={door.priya}>
          <PriyaAtDoor x={300} y={780} reach={door.reach} />
        </g>
      </Layer>

      {/* Priya and her client */}
      <Layer cam={cam} depth={1} blur={focus.priya ?? 0}>
        <g opacity={pp.cfg}>
          <Client x={250} y={1330} s={1.35} hair="#6b3f26" foils={8} />
        </g>
        <g opacity={pp.priya}>
          <PriyaWorking x={470} y={1180} />
        </g>
      </Layer>

      {/* foreground desk */}
      <Layer cam={cam} depth={1.2} blur={focus.fg ?? 0}>
        <Desk ring={ring} ringEnd={ringEnd} diaryGlow={diaryGlow} />
      </Layer>

      {/* time of day */}
      <AbsoluteFill style={{background: '#ff9346', mixBlendMode: 'multiply', opacity: dusk * 0.42}} />
      <AbsoluteFill style={{background: '#1a2547', mixBlendMode: 'multiply', opacity: night * 0.8}} />
      <Layer cam={cam} depth={0.65} blend="screen" opacity={night * 0.5}>
        <defs>
          <linearGradient id="street" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#7d9ad6" stopOpacity={0.8} />
            <stop offset="1" stopColor="#7d9ad6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <polygon points="70,330 340,330 760,1920 120,1920" fill="url(#street)" />
      </Layer>
      <Layer cam={cam} depth={0.55} blend="screen" opacity={bulbs * 0.8}>
        <Glow id="pend1" x={560} y={300} r={130} o={0.6} />
        <Glow id="pend2" x={880} y={300} r={130} o={0.6} />
        <Glow id="mir1" x={560} y={610} r={230} o={0.25} />
        <Glow id="mir2" x={880} y={610} r={230} o={0.25} />
      </Layer>

      {/* Kikai's light */}
      <Layer cam={cam} depth={1.2} blend="screen">
        <Glow id="phoneGlow" x={PHONE.x} y={PHONE.y - 10} r={420} o={glow} />
        <Glow id="phoneGlowCore" x={PHONE.x} y={PHONE.y - 6} r={130} o={glow} />
        <Glow id="diaryGlow" x={DIARY.x} y={DIARY.y} r={260} o={diaryGlow * 0.8} />
        {ribbons.map((r, i) => (
          <Ribbon key={i} id={`deskRib${i}`} pts={DESK_RIBBON} head={r.head} o={r.o} width={10} tail={0.6} />
        ))}
      </Layer>
    </AbsoluteFill>
  );
};
