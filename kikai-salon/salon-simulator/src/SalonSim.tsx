import React from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import cues from './cues.json';
import {Bonus, booked, End, lostPounds, Room, VIEW} from './game';
import {C, PixelText, textSize, wrap} from './pixel';

const K = cues.cue;
const V = cues.vo;
const L = cues.voLen;
const W = 1080;
const H = 1920;

/* ─────────────── HUD ─────────────── */
const pad2 = (n: number) => String(n).padStart(2, '0');
const clock = (f: number) => {
  if (f >= K.nightIn) {
    const m = 47 + Math.floor((f - K.nightIn) / 6);
    return `SUN 21:${pad2(m % 60)}`;
  }
  const m = Math.floor(f / 6);
  return `SAT ${pad2(10 + Math.floor(m / 60))}:${pad2(m % 60)}`;
};

const Hud: React.FC<{f: number}> = ({f}) => {
  const kikai = f >= K.switch;
  const lost = lostPounds(f);
  const lastMiss = K.miss.filter((m) => f >= m).pop() ?? -99;
  const lastBook = K.answer.filter((a) => f >= a).pop() ?? -99;
  const flash = kikai ? f - lastBook < 10 && f % 4 < 2 : f - lastMiss < 18 && f % 4 < 2;
  return (
    <g>
      {kikai ? (
        <PixelText text={`BOOKED ×${booked(f)}`} x={60} y={236} px={5} color={flash ? C.white : C.lime} />
      ) : (
        <PixelText text={`LOST £${String(lost).padStart(3, '0')}`} x={60} y={236} px={5} color={flash ? C.white : C.red} />
      )}
      <PixelText text={clock(f)} x={W - 60} y={236} px={5} color={f >= K.nightIn ? C.blue : C.yellow} align="right" />
    </g>
  );
};

/* ─────────────── frame-0 headline ─────────────── */
const Headline: React.FC<{f: number}> = ({f}) => (
  <g>
    <PixelText text="SALON OWNERS:" x={W / 2} y={306} px={6} color={C.yellow} align="center" />
    <PixelText text="CAN YOU CLEAR" x={W / 2} y={370} px={10} color={C.white} shadow={C.plum} align="center" />
    <PixelText text="SATURDAY?" x={W / 2} y={458} px={14} color={Math.floor(f / 8) % 2 ? C.orange : C.yellow} shadow={C.plum} align="center" />
  </g>
);

/* ─────────────── event banners (latest event wins) ─────────────── */
type Ev = {at: number; until: number; text: string; color: string; px: number};
const MISS_TEXT = ['MISSED CALL!', 'MISSED AGAIN!', 'MISSED!', 'MISSED!!'];
const EVENTS: Ev[] = [
  {at: V.v2, until: K.miss[0], text: 'HANDS FULL!', color: C.white, px: 9},
  ...K.miss.map((m, i) => ({at: m, until: m + 26, text: MISS_TEXT[i], color: C.red, px: 9})),
  {at: K.switch, until: K.unlock, text: 'POWER UP!', color: C.yellow, px: 10},
  {at: K.unlock, until: K.answer[0], text: 'KIKAI UNLOCKED', color: C.orange, px: 7},
  ...K.answer.map((a, i) => ({at: a, until: a + 28, text: `BOOKED ×${i + 1}`, color: C.lime, px: 9})),
  {at: K.nightIn + 2, until: K.nightIn + 22, text: 'AFTER HOURS', color: C.blue, px: 8},
];
const Banner: React.FC<{f: number}> = ({f}) => {
  const live = EVENTS.filter((e) => f >= e.at && f < e.until).sort((a, b) => b.at - a.at)[0];
  if (!live) return null;
  const t = f - live.at;
  const jump = t < 4 ? [6, -10, -4, 0][t] : 0;
  const {h} = textSize(live.text, live.px);
  return (
    <g>
      <PixelText text={live.text} x={W / 2} y={470 - h / 2 + jump} px={live.px} color={live.color} shadow={C.black} align="center" />
      {live.text === 'KIKAI UNLOCKED'
        ? [0, 1, 2, 3, 4, 5].map((i) => (
            <rect key={i} x={140 + i * 160 + ((f + i * 3) % 6) * 2} y={410 + ((i * 37 + f * 3) % 120)} width={8} height={8} fill={C.yellow} opacity={(f + i) % 8 < 5 ? 1 : 0} />
          ))
        : null}
    </g>
  );
};

/* ─────────────── GAME OVER? ... NOT QUITE ─────────────── */
const GameOver: React.FC<{f: number}> = ({f}) => {
  if (f < K.gameOver || f >= K.notQuite + 14) return null;
  const nq = f >= K.notQuite;
  const dim = nq ? 0.6 * (1 - (f - K.notQuite) / 14) : 0.65;
  const blink = Math.floor((f - K.gameOver) / 6) % 2 === 0;
  return (
    <g>
      <rect x={0} y={VIEW.y} width={W} height={VIEW.rows * 8} fill="#000" opacity={dim} />
      {nq ? (
        <PixelText text="NOT QUITE!" x={W / 2} y={850} px={12} color={C.yellow} shadow={C.plum} align="center" />
      ) : (
        <PixelText text="GAME OVER?" x={W / 2} y={850} px={12} color={C.red} shadow={C.black} align="center" opacity={blink ? 1 : 0.35} />
      )}
    </g>
  );
};

/* ─────────────── RPG dialogue box: the captions ─────────────── */
const DIALOGUE: [keyof typeof V, string][] = [
  ['v1', 'SALON OWNERS. CAN YOU CLEAR SATURDAY WITHOUT MISSING A SINGLE CALL?'],
  ['v2', "YOUR HANDS ARE FULL. THE PHONE'S RINGING."],
  ['v3', 'MISSED! MINUS ONE CLIENT. MISSED AGAIN!'],
  ['v4', 'GAME OVER? NOT QUITE.'],
  ['v5', 'POWER UP! KIKAI: THE AI RECEPTIONIST FOR UK SALONS.'],
  ['v6', "IT PICKS UP WHILE YOU'RE BUSY, DAY OR NIGHT, AND BOOKS THEM STRAIGHT INTO YOUR DIARY."],
  ['v7', 'BONUS ROUND. A FREE CONSULTATION!'],
  ['v8', "WE'LL LOOK AT THE CALLS YOU'RE MISSING, AND SHOW YOU HOW KIKAI WOULD WORK FOR YOUR SALON."],
];
const BOX = {x: 56, y: 1240, w: 860, h: 250};
const Dialogue: React.FC<{f: number}> = ({f}) => {
  if (f >= K.card) return null;
  const i = DIALOGUE.map(([id]) => V[id]).filter((at) => f >= at).length - 1;
  const [id, text] = DIALOGUE[Math.max(0, i)];
  const at = V[id];
  const shown = Math.floor(text.length * Math.max(0, Math.min(1, (f - at) / (L[id as keyof typeof L] * 0.85))));
  const lines = wrap(text, 32);
  // reveal across the wrapped lines without reflowing them
  let left = shown;
  const visible = lines
    .split('\n')
    .map((ln) => {
      const s = ln.slice(0, Math.max(0, left));
      left -= ln.length + 1;
      return s;
    })
    .join('\n');
  const done = shown >= text.length;
  return (
    <g>
      <rect x={BOX.x} y={BOX.y} width={BOX.w} height={BOX.h} fill={C.white} />
      <rect x={BOX.x + 8} y={BOX.y + 8} width={BOX.w - 16} height={BOX.h - 16} fill="#120a2a" />
      <rect x={BOX.x + 16} y={BOX.y + 16} width={BOX.w - 32} height={BOX.h - 32} fill="none" stroke={C.lavender} strokeWidth={4} />
      <PixelText text={visible} x={BOX.x + 40} y={BOX.y + 40} px={4} color={C.white} lineGap={3} />
      {done && Math.floor(f / 8) % 2 ? <PixelText text="▼" x={BOX.x + BOX.w - 60} y={BOX.y + BOX.h - 62} px={4} color={C.yellow} /> : null}
    </g>
  );
};

/* ─────────────── persistent CTA tag: Kikai unlocked → end screen ─────────────── */
const CtaTag: React.FC<{f: number}> = ({f}) => {
  if (f < K.unlock || f >= K.card) return null;
  const px = 4;
  const parts: [string, string][] = [
    ['COMMENT ', C.white],
    ['"FREE"', C.yellow],
    [' FOR A FREE CONSULTATION', C.white],
  ];
  const total = textSize(parts.map((p) => p[0]).join(''), px).w;
  const x0 = (W - total) / 2;
  const onBar = (f - K.grid0) % 60 < 6;
  let x = x0;
  return (
    <g>
      <rect x={x0 - 24} y={296} width={total + 48} height={60} fill={onBar ? C.orange : C.black} />
      <rect x={x0 - 18} y={302} width={total + 36} height={48} fill={C.black} />
      {parts.map(([t, col]) => {
        const el = <PixelText key={t} text={t} x={x} y={312} px={px} color={col} />;
        x += t.length * 6 * px;
        return el;
      })}
    </g>
  );
};

/* ─────────────── transitions + CRT ─────────────── */
const Dissolve: React.FC<{f: number; at: number}> = ({f, at}) => {
  const d = f - at;
  if (d < -8 || d >= 8) return null;
  const p = d < 0 ? (d + 8) / 8 : 1 - d / 8;
  const S = 60;
  const cells: React.ReactNode[] = [];
  for (let y = 0; y < H / S; y++) {
    for (let x = 0; x < W / S; x++) {
      if (random(`d${at}-${x}-${y}`) < p) cells.push(<rect key={`${x}-${y}`} x={x * S} y={y * S} width={S} height={S} fill="#0d0a1a" />);
    }
  }
  return <g>{cells}</g>;
};

const Scanlines: React.FC = () => (
  <>
    <defs>
      <pattern id="scan" width={6} height={6} patternUnits="userSpaceOnUse">
        <rect width={6} height={2} fill="#000" opacity={0.16} />
      </pattern>
      <radialGradient id="crtVig" cx="50%" cy="50%" r="75%">
        <stop offset="0.6" stopColor="#000" stopOpacity={0} />
        <stop offset="1" stopColor="#000" stopOpacity={0.55} />
      </radialGradient>
    </defs>
    <rect width={W} height={H} fill="url(#scan)" />
    <rect width={W} height={H} fill="url(#crtVig)" />
  </>
);

/* ─────────────── the reel ─────────────── */
export const SalonSim: React.FC = () => {
  const f = useCurrentFrame();
  const room = f < K.bonus;
  const bonus = f >= K.bonus && f < K.card;
  // a hard glitch on "Not quite"; game-feel shake on every hit
  const glitch = f >= K.notQuite && f < K.notQuite + 5;
  const hit = [...K.miss, K.switch, K.drop].filter((h) => f >= h && f < h + 6).pop();
  const amp = hit === undefined ? 0 : (6 - (f - hit)) * 3;
  const shake = `translate(${Math.round((random(`sx${f}`) - 0.5) * amp / 4) * 4} ${Math.round((random(`sy${f}`) - 0.5) * amp / 4) * 4})`;
  return (
    <AbsoluteFill style={{background: '#0d0a1a'}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} shapeRendering="crispEdges">
        {room ? (
          <g transform={glitch ? `translate(${(random(`g${f}`) - 0.5) * 48} 0)` : shake}>
            <rect x={0} y={VIEW.y - 8} width={W} height={8} fill={C.lavender} />
            <rect x={0} y={VIEW.y + VIEW.rows * 8} width={W} height={8} fill={C.lavender} />
            <Room f={f} />
            <GameOver f={f} />
            <Hud f={f} />
            {f < V.v2 ? <Headline f={f} /> : <Banner f={f} />}
          </g>
        ) : null}
        {bonus ? (
          <g transform={shake}>
            <Bonus f={f} />
          </g>
        ) : null}
        {f >= K.card ? <End f={f} /> : null}
        <Dialogue f={f} />
        <CtaTag f={f} />
        <Dissolve f={f} at={K.bonus} />
        <Dissolve f={f} at={K.card} />
        {glitch ? <rect x={0} y={VIEW.y + ((f * 97) % 600)} width={W} height={40} fill={C.blue} opacity={0.5} /> : null}
        <Scanlines />
      </svg>
    </AbsoluteFill>
  );
};

/** Profile-grid cover: the hook frame with the bonus badge, inside the 3:4 band (y 240-1680). */
export const Cover: React.FC = () => (
  <AbsoluteFill>
    <SalonSim />
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} shapeRendering="crispEdges" style={{position: 'absolute'}}>
      <rect x={56} y={1236} width={884} height={272} fill={C.plum} />
      <rect x={48} y={1228} width={884} height={272} fill={C.orange} />
      <rect x={60} y={1240} width={860} height={248} fill="none" stroke={C.black} strokeWidth={8} />
      <PixelText text="BONUS:" x={490} y={1282} px={6} color={C.black} align="center" />
      <PixelText text="FREE CONSULTATION" x={490} y={1364} px={7} color={C.black} align="center" />
    </svg>
  </AbsoluteFill>
);
