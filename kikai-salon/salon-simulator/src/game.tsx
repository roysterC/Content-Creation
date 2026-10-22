import React from 'react';
import {random} from 'remotion';
import cues from './cues.json';
import {Block, C, discRows, PixelText, Sprite} from './pixel';

const K = cues.cue;
const V = cues.vo;
export const U = 8; // one game pixel = 8 screen pixels
export const VIEW = {y: 580, cols: 135, rows: 80}; // the game viewport

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const prog = (f: number, a: number, b: number) => clamp01((f - a) / (b - a));
const steps = (x: number, n: number) => Math.floor(x * n) / n; // stepped motion reads as pixel animation

/* ─────────────── sprites ─────────────── */
const STYLIST = [
  '.......000......',
  '......00000.....',
  '.....0000000....',
  '.....00000000...',
  '....444000000...',
  '...4404400000...',
  '...44444400.0...',
  '...4444440......',
  '....44444.......',
  '.....444........',
  '....eeeeeee.....',
  '...eee000eee....',
  '...ee00000ee....',
  '...ee00000ee....',
  '...ee00000.e....',
  '....e00000.44...',
  '....0000000.....',
  '....0000000.....',
  '.....55.55......',
  '.....55.55......',
  '.....55.55......',
  '.....55.55......',
  '....000.000.....',
];
const CLIENT = [
  '....66.66.....',
  '...6464646....',
  '..644444446...',
  '..f44444446...',
  '.ff0444444....',
  '.ffff44444....',
  '..fff4444.....',
  '...ff.........',
  '..1111111.....',
  '.111111111.0..',
  '.111111111.0..',
  '.111111111.0..',
  '.1111111110...',
  '00000000000...',
  '....00........',
  '....00........',
  '..000000......',
];
const DRYER = ['.555555.', '55666655', '.555555.', '....55..', '....55..'];
const PHONE = [
  '..8888888888..',
  '.888888888888.',
  '888........888',
  '88..888888..88',
  '....888888....',
  '..8888888888..',
  '.888877778888.',
  '.888877778888.',
  '88888888888888',
];
const PLANT = ['..3..3..', '.333.33.', '3b33333.', '.33b333.', '..3333..', '...33...', '.444444.', '.444444.', '..4444..', '..4444..', '..4444..'];
const CALL_TOKEN = ['.888888.', '88....88', '8.8888.8', '..8888..', '.888888.', '.887788.', '.888888.'];

const STYLIST_AT = {x: 47, y: 28};
const CLIENT_AT = {x: 33, y: 32};
const PHONE_AT = {x: 92, y: 27};
const DIARY_AT = {x: 109, y: 31};
const SIGN_AT = {x: 98, y: 3};

/* ─────────────── game state, all derived from the frame ─────────────── */
const preRings = [
  [-60, K.miss[0]],
  [K.miss[0] + 10, K.miss[1]],
  [K.miss[1] + 6, K.miss[2]],
  [K.miss[2] + 4, K.miss[3]],
];
const kikaiRings = K.answer.map((a) => [a - 16, a]);
export const ringing = (f: number) => [...preRings, ...kikaiRings].some(([a, b]) => f >= a && f < b);
const buzzing = (f: number) => ringing(f) && f % 15 < 10;

export const lostPounds = (f: number) => K.miss.reduce((s, m) => s + (f < m ? 0 : Math.min(45, 5 + 5 * Math.floor((f - m) / 2))), 0);
export const booked = (f: number) => K.answer.filter((a) => f >= a).length;
export const night = (f: number) => steps(prog(f, K.nightIn, K.nightIn + 12), 6);
const kikaiOn = (f: number) => f >= K.switch;

/* ─────────────── the salon ─────────────── */
export const Room: React.FC<{f: number}> = ({f}) => {
  const n = night(f);
  const staff = f < K.nightIn + 2;
  const bob = Math.floor(f / 8) % 2;
  const shake = buzzing(f) ? (f % 4 < 2 ? -1 : 1) : 0;
  const lastMiss = K.miss.filter((m) => f >= m).pop();
  const missFlash = lastMiss !== undefined && f - lastMiss < 12 && (f - lastMiss) % 4 < 2;
  const k = kikaiOn(f);
  const phoneRemap = k ? {'8': C.orange, '7': C.yellow} : missFlash ? {'8': C.white} : undefined;
  const hands = f >= V.v2 && f < K.miss[3] + 10 && ringing(f);

  return (
    <g transform={`translate(0 ${VIEW.y})`}>
      {/* wall, wallpaper dots, wainscot */}
      <Block x={0} y={0} w={135} h={50} u={U} fill={C.pink} />
      {Array.from({length: 17 * 5}).map((_, i) => {
        const cx = (i % 17) * 8 + ((Math.floor(i / 17) % 2) * 4) + 2;
        const cy = Math.floor(i / 17) * 7 + 3;
        return <Block key={i} x={cx} y={cy} w={1} h={1} u={U} fill={C.white} opacity={0.5} />;
      })}
      <Block x={0} y={37} w={135} h={1} u={U} fill={C.white} />
      <Block x={0} y={38} w={135} h={12} u={U} fill={C.plum} />
      {Array.from({length: 12}).map((_, i) => (
        <Block key={i} x={i * 12 + 3} y={40} w={7} h={8} u={U} fill="#6a1f47" />
      ))}
      {/* floor: salon checkerboard */}
      {Array.from({length: 6 * 27}).map((_, i) => {
        const cx = i % 27;
        const cy = Math.floor(i / 27);
        return <Block key={i} x={cx * 5} y={50 + cy * 5} w={5} h={5} u={U} fill={(cx + cy) % 2 ? C.black : C.white} />;
      })}

      {/* window: day sky, or night with the moon */}
      <Block x={4} y={6} w={22} h={24} u={U} fill={C.white} />
      <Block x={5} y={7} w={20} h={22} u={U} fill={n > 0.5 ? C.navy : C.blue} />
      {n > 0.5 ? (
        <>
          <Sprite id="moon" rows={discRows(3, '7')} x={17 * U} y={9 * U} u={U} />
          <Block x={18} y={9} w={3} h={3} u={U} fill={C.navy} />
          {[
            [7, 10],
            [11, 16],
            [8, 22],
            [21, 20],
            [14, 9],
          ].map(([sx, sy], i) => (
            <Block key={i} x={sx} y={sy} w={1} h={1} u={U} fill={C.yellow} opacity={(f + i * 5) % 20 < 14 ? 1 : 0.3} />
          ))}
          <PixelText text="CLOSED" x={15 * U} y={25 * U + 2} px={3} color={C.red} align="center" />
        </>
      ) : (
        <>
          <Sprite id="sun" rows={discRows(3, 'a')} x={17 * U} y={9 * U} u={U} />
          <Block x={(Math.floor(f / 6) % 26) - 6} y={18} w={8} h={2} u={U} fill={C.white} />
          <Block x={(Math.floor(f / 6) % 26) - 4} y={17} w={4} h={1} u={U} fill={C.white} />
        </>
      )}
      <Block x={14.5} y={7} w={1} h={22} u={U} fill={C.white} />
      <Block x={5} y={17.5} w={20} h={1} u={U} fill={C.white} />

      {/* mirror */}
      <Block x={31} y={7} w={18} h={24} u={U} fill={C.orange} />
      <Block x={32} y={8} w={16} h={22} u={U} fill={C.lgrey} />
      {[0, 1, 2, 3].map((i) => (
        <Block key={i} x={35 + i} y={11 + i * 2} w={1} h={2} u={U} fill={C.white} />
      ))}

      {/* "NEXT SALON" sign: where missed callers go */}
      <Block x={SIGN_AT.x} y={SIGN_AT.y} w={34} h={7} u={U} fill={C.brown} />
      <Block x={SIGN_AT.x + 1} y={SIGN_AT.y + 1} w={32} h={5} u={U} fill="#7a3a22" />
      <PixelText text="NEXT SALON →" x={(SIGN_AT.x + 17) * U} y={(SIGN_AT.y + 2) * U - 2} px={3} color={C.white} align="center" />

      <Sprite id="plant" rows={PLANT} x={70 * U} y={39 * U} u={U} />

      {/* client + stylist, with her hands full */}
      {staff ? (
        <>
          <Sprite id="client" rows={CLIENT} x={CLIENT_AT.x * U} y={CLIENT_AT.y * U} u={U} />
          <Sprite id="stylist" rows={STYLIST} x={STYLIST_AT.x * U} y={STYLIST_AT.y * U} u={U} />
          {/* arm up to the hairdryer */}
          <Block x={49} y={38 - bob} w={2} h={2} u={U} fill={C.brown} />
          <Block x={46} y={37 - bob} w={3} h={2} u={U} fill={C.pink} />
          <Sprite id="dryer" rows={DRYER} x={39 * U} y={(34 - bob) * U} u={U} />
          {[0, 1, 2].map((i) => {
            const t = ((f + i * 4) % 12) / 12;
            return <Block key={i} x={38 - t * 4} y={34 - bob + i} w={1.5} h={0.5} u={U} fill={C.white} opacity={1 - t} />;
          })}
          {hands ? (
            <g>
              <Block x={52} y={19} w={9} h={7} u={U} fill={C.white} />
              <Block x={54} y={26} w={2} h={1} u={U} fill={C.white} />
              <PixelText text="!!" x={56.5 * U} y={20.5 * U} px={4} color={C.red} align="center" />
            </g>
          ) : null}
        </>
      ) : null}
      {/* puff as they head home */}
      {f >= K.nightIn && f < K.nightIn + 10
        ? [CLIENT_AT, STYLIST_AT].map((p, j) =>
            Array.from({length: 10}).map((_, i) => {
              const a = (i / 10) * Math.PI * 2;
              const r = 4 + (f - K.nightIn) * 1.2;
              return <Block key={`${j}-${i}`} x={p.x + 7 + Math.cos(a) * r} y={p.y + 9 + Math.sin(a) * r} w={1} h={1} u={U} fill={C.white} />;
            }),
          )
        : null}

      {/* reception desk, phone, diary */}
      <Block x={84} y={36} w={42} h={2} u={U} fill={C.orange} />
      <Block x={85} y={38} w={40} h={18} u={U} fill={C.brown} />
      <Block x={88} y={41} w={15} h={12} u={U} fill="#8a3f28" />
      <Block x={107} y={41} w={15} h={12} u={U} fill="#8a3f28" />
      <Diary f={f} />
      {k ? <Halo f={f} /> : null}
      <Sprite id="phone" rows={PHONE} x={(PHONE_AT.x + shake) * U} y={(PHONE_AT.y - (buzzing(f) && f % 6 < 3 ? 1 : 0)) * U} u={U} remap={phoneRemap} />
      {buzzing(f) ? <RingWaves f={f} /> : null}
      {k ? <KBadge /> : null}

      {/* night falls */}
      {n > 0 ? <Block x={0} y={0} w={135} h={80} u={U} fill="#0b1030" opacity={n * 0.55} /> : null}
      {k && n > 0 ? <Halo f={f} glowOnly /> : null}

      <MissEffects f={f} />
      <AnswerEffects f={f} />
      <Orb f={f} />
    </g>
  );
};

const RingWaves: React.FC<{f: number}> = ({f}) => {
  const w = f % 10 < 5 ? 0 : 1;
  return (
    <g>
      {[0, 1].map((i) => (
        <React.Fragment key={i}>
          <Block x={PHONE_AT.x - 3 - i * 2 - w} y={PHONE_AT.y + 1 - i} w={1} h={3 + i * 2} u={U} fill={C.white} />
          <Block x={PHONE_AT.x + 16 + i * 2 + w} y={PHONE_AT.y + 1 - i} w={1} h={3 + i * 2} u={U} fill={C.white} />
        </React.Fragment>
      ))}
    </g>
  );
};

const Diary: React.FC<{f: number}> = ({f}) => {
  const b = booked(f);
  return (
    <g>
      <Block x={DIARY_AT.x} y={DIARY_AT.y} w={15} h={5} u={U} fill={C.white} />
      <Block x={DIARY_AT.x + 7} y={DIARY_AT.y} w={1} h={5} u={U} fill={C.lgrey} />
      {[0, 1, 2, 3].map((i) => {
        const left = i < 2;
        const x = DIARY_AT.x + (left ? 1 : 9);
        const y = DIARY_AT.y + 1 + (i % 2) * 2;
        const lit = i < b;
        return <Block key={i} x={x} y={y} w={5} h={1} u={U} fill={lit ? C.orange : C.lgrey} />;
      })}
    </g>
  );
};

const Halo: React.FC<{f: number; glowOnly?: boolean}> = ({f, glowOnly}) => {
  const r = 10 + (Math.floor(f / 6) % 2);
  return (
    <g opacity={glowOnly ? 0.5 : 0.85}>
      <Sprite id={`halo${r}`} rows={discRows(r, '.', '9')} x={(PHONE_AT.x + 7 - r) * U} y={(PHONE_AT.y + 4 - r) * U} u={U} />
      {glowOnly ? <circle cx={(PHONE_AT.x + 7) * U} cy={(PHONE_AT.y + 4) * U} r={r * U * 1.6} fill={C.orange} opacity={0.25} /> : null}
    </g>
  );
};

const KBadge: React.FC = () => (
  <g>
    <Sprite id="kbadge" rows={discRows(3, 'a', '9')} x={(PHONE_AT.x + 12) * U} y={(PHONE_AT.y - 6) * U} u={U} />
    <PixelText text="K" x={(PHONE_AT.x + 15.5) * U} y={(PHONE_AT.y - 4.5) * U} px={3} color={C.black} align="center" />
  </g>
);

const MissEffects: React.FC<{f: number}> = ({f}) => (
  <g>
    {K.miss.map((m, i) => {
      const t = f - m;
      if (t < 0 || t > 30) return null;
      // the missed caller flies off to the salon next door
      const q = clamp01(t / 22);
      const x = PHONE_AT.x + 3 + (SIGN_AT.x + 40 - PHONE_AT.x) * q;
      const y = PHONE_AT.y - 2 - Math.sin(q * Math.PI) * 20 - q * 14;
      return (
        <g key={m}>
          {q < 1 ? <Sprite id="token" rows={CALL_TOKEN} x={Math.round(x) * U} y={Math.round(y) * U} u={U} /> : null}
          <PixelText text="-1 CLIENT" x={(PHONE_AT.x + 7) * U} y={(PHONE_AT.y - 8 - Math.floor(t / 3)) * U} px={4} color={C.red} shadow={C.black} align="center" opacity={t < 24 ? 1 : 0} />
        </g>
      );
    })}
  </g>
);

const AnswerEffects: React.FC<{f: number}> = ({f}) => (
  <g>
    {K.answer.map((a, i) => {
      const t = f - a;
      if (t < 0 || t > 26) return null;
      // amber pixels run from the phone into the diary
      const dots = Array.from({length: 6}).map((_, j) => {
        const q = clamp01((t - j * 1.5) / 10);
        if (q <= 0 || q >= 1) return null;
        return <Block key={j} x={PHONE_AT.x + 12 + (DIARY_AT.x + 6 - PHONE_AT.x - 12) * q} y={PHONE_AT.y + 1 - Math.sin(q * Math.PI) * 6} w={1} h={1} u={U} fill={C.yellow} />;
      });
      return (
        <g key={a}>
          {dots}
          <PixelText text="BOOKED!" x={(PHONE_AT.x + 7) * U} y={(PHONE_AT.y - 9 - Math.floor(t / 3)) * U} px={4} color={C.lime} shadow={C.black} align="center" opacity={t < 22 ? 1 : 0} />
          {t < 16 ? <Sprite id="coin" rows={discRows(2, 'a', '9')} x={(PHONE_AT.x + 5 + (i % 2 ? 4 : -2)) * U} y={(PHONE_AT.y - 4 - t + Math.floor((t * t) / 18)) * U} u={U} /> : null}
        </g>
      );
    })}
  </g>
);

/** The Kikai power-up: falls in after "Not quite", lands on the phone on the beat. */
const Orb: React.FC<{f: number}> = ({f}) => {
  const a = K.notQuite + 6;
  if (f < a || f > K.switch + 20) return null;
  const q = prog(f, a, K.switch);
  const y = -40 + (PHONE_AT.y - 6 + 40) * q * q;
  const land = f - K.switch;
  return (
    <g>
      {q < 1 ? (
        <>
          <Sprite id="orb" rows={discRows(4, 'a', '9')} x={(PHONE_AT.x + 3) * U} y={Math.round(y) * U} u={U} />
          <PixelText text="K" x={(PHONE_AT.x + 7.5) * U} y={(Math.round(y) + 2) * U} px={4} color={C.black} align="center" />
          {[0, 1, 2].map((i) => (
            <Block key={i} x={PHONE_AT.x + 4 + i * 3} y={Math.round(y) - 3 - i * 2 - (f % 4)} w={1} h={1} u={U} fill={C.yellow} />
          ))}
        </>
      ) : null}
      {land >= 0
        ? Array.from({length: 16}).map((_, i) => {
            const ang = (i / 16) * Math.PI * 2;
            const r = 3 + land * 1.4;
            return <Block key={i} x={PHONE_AT.x + 7 + Math.cos(ang) * r} y={PHONE_AT.y + 4 + Math.sin(ang) * r} w={1} h={1} u={U} fill={i % 2 ? C.yellow : C.white} />;
          })
        : null}
    </g>
  );
};

/* ─────────────── bonus round ─────────────── */
export const Bonus: React.FC<{f: number}> = ({f}) => {
  const open = f >= K.drop;
  const t = f - K.drop;
  const pop = open ? Math.min(1, t / 6) : 0;
  const cx = 540;
  const chestY = 900;
  const B = 10; // chest pixel size
  return (
    <g>
      <rect width={1080} height={1920} fill="#120a2a" />
      {Array.from({length: 60}).map((_, i) => {
        const x = Math.floor(random(`bx${i}`) * 135) * U;
        const y = Math.floor(random(`by${i}`) * 240) * U;
        return <rect key={i} x={x} y={y} width={U} height={U} fill={i % 3 ? C.white : C.yellow} opacity={(f + i * 7) % 24 < 16 ? 0.8 : 0.2} />;
      })}
      <PixelText text="BONUS ROUND!" x={cx} y={392} px={10} color={Math.floor(f / 6) % 2 ? C.yellow : C.orange} shadow={C.plum} align="center" />

      {/* light rays out of the chest */}
      {open
        ? Array.from({length: 10}).map((_, i) => {
            const a = (i / 10) * Math.PI * 2 + t * 0.02;
            const r = 900;
            const w = 0.12;
            return (
              <polygon
                key={i}
                points={`${cx},${chestY} ${cx + Math.cos(a - w) * r},${chestY + Math.sin(a - w) * r} ${cx + Math.cos(a + w) * r},${chestY + Math.sin(a + w) * r}`}
                fill={C.yellow}
                opacity={0.14 * pop}
              />
            );
          })
        : null}

      {/* the chest */}
      <g transform={`translate(${cx - 13 * B} ${chestY - (open ? 0 : Math.abs(Math.sin(f / 3)) * 6)})`}>
        <Block x={0} y={4} w={26} h={14} u={B} fill={C.brown} />
        <Block x={0} y={4} w={26} h={2} u={B} fill={C.orange} />
        <Block x={0} y={16} w={26} h={2} u={B} fill={C.orange} />
        <Block x={4} y={4} w={2} h={14} u={B} fill={C.orange} />
        <Block x={20} y={4} w={2} h={14} u={B} fill={C.orange} />
        {open ? (
          <>
            <Block x={1} y={-8} w={24} h={10} u={B} fill="#7a3a22" />
            <Block x={0} y={-10} w={26} h={2} u={B} fill={C.orange} />
            <Block x={2} y={2} w={22} h={2} u={B} fill={C.yellow} />
          </>
        ) : (
          <>
            <Block x={0} y={-2} w={26} h={6} u={B} fill="#8a3f28" />
            <Block x={0} y={-2} w={26} h={2} u={B} fill={C.orange} />
            <Block x={11} y={2} w={4} h={5} u={B} fill={C.yellow} />
          </>
        )}
      </g>
      {/* coins bursting out */}
      {open
        ? Array.from({length: 14}).map((_, i) => {
            const vx = (random(`cvx${i}`) - 0.5) * 22;
            const vy = -14 - random(`cvy${i}`) * 12;
            const x = cx + vx * t;
            const y = chestY + vy * t + 0.9 * t * t;
            if (y > 1900) return null;
            return <Sprite key={i} id="coinB" rows={discRows(2, 'a', '9')} x={Math.round(x / U) * U} y={Math.round(y / U) * U} u={U} />;
          })
        : null}

      {/* the reward */}
      <g opacity={pop}>
        <g transform={`translate(${cx} 520) scale(${open ? 1 + Math.max(0, 0.3 - t * 0.05) : 1}) translate(${-cx} -520)`}>
          <PixelText text="FREE" x={cx} y={520} px={22} color={C.yellow} shadow={C.orange} align="center" />
        </g>
        <PixelText text="CONSULTATION" x={cx} y={706} px={9} color={C.white} shadow={C.plum} align="center" />
      </g>
      <Reward f={f} at={K.items[0]} y={1110} text="A LOOK AT YOUR MISSED CALLS" />
      <Reward f={f} at={K.items[1]} y={1170} text="A KIKAI DEMO FOR YOUR SALON" />
    </g>
  );
};

const Reward: React.FC<{f: number; at: number; y: number; text: string}> = ({f, at, y, text}) => {
  if (f < at) return null;
  const slide = Math.max(0, 8 - (f - at)) * 12;
  return (
    <g transform={`translate(${-slide} 0)`}>
      <rect x={110} y={y - 8} width={44} height={44} fill={C.lime} />
      <PixelText text="+" x={132} y={y + 4 - 2} px={4} color={C.black} align="center" />
      <PixelText text={text} x={176} y={y} px={4} color={C.white} />
    </g>
  );
};

/* ─────────────── end screen ─────────────── */
export const End: React.FC<{f: number}> = ({f}) => {
  const t = f - K.card;
  const press = f >= K.claim && f < K.claim + 6;
  const glow = Math.floor(f / 8) % 2;
  return (
    <g>
      <rect width={1080} height={1920} fill="#0d0a1a" />
      <Sprite id="endOrb" rows={discRows(5, 'a', '9')} x={540 - 5.5 * U} y={430 + (Math.floor(f / 10) % 2) * U} u={U} />
      <PixelText text="K" x={540} y={430 + 3 * U + (Math.floor(f / 10) % 2) * U} px={5} color={C.black} align="center" />
      <PixelText text="KIKAI" x={540} y={560} px={26} color={C.orange} shadow={C.plum} align="center" opacity={t >= 2 ? 1 : 0} />
      <PixelText text={'THE AI RECEPTIONIST\nFOR UK SALONS'} x={540} y={790} px={5} color={C.white} align="center" opacity={t >= 6 ? 1 : 0} />
      <g opacity={t >= 10 ? 1 : 0} transform={`translate(0 ${press ? U : 0})`}>
        <rect x={180} y={960} width={720} height={130} fill={C.plum} />
        <rect x={180} y={952 - (press ? 0 : 0)} width={720} height={122} fill={glow ? C.orange : C.yellow} />
        <rect x={188} y={960} width={704} height={106} fill="none" stroke={C.black} strokeWidth={8} />
        <PixelText text={'COMMENT "FREE"'} x={540} y={987} px={8} color={C.black} align="center" />
      </g>
      <PixelText text="FOR A FREE CONSULTATION" x={540} y={1136} px={5} color={C.white} align="center" opacity={t >= 14 ? 1 : 0} />
      <PixelText text="KIKAIAGENCY.VERCEL.APP" x={540} y={1240} px={3} color={C.lavender} align="center" opacity={t >= 20 ? 1 : 0} />
    </g>
  );
};
