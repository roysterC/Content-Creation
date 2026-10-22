import React from 'react';
import {staticFile} from 'remotion';
import {HAND} from './common';

export type Entry = {row: number; text: string; amber?: boolean; empty?: boolean; strike?: boolean; rot?: number; x?: number};
export const ROWS = ['9:00', '9:30', '10:00', '10:30', '11:00', '11:30', '12:00', '1:00', '2:00', '3:00', '4:00', '5:00'];
const PAGE_W = 640;
const PAGE_H = 900;
const ROW_H = 62;
const TOP = 150;

const Page: React.FC<{title: string; entries: Entry[]; side: 'l' | 'r'; highlight?: number}> = ({title, entries, side, highlight}) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      backgroundImage: `linear-gradient(${side === 'l' ? '90deg' : '270deg'}, rgba(0,0,0,0) 80%, rgba(60,40,20,0.28) 100%), url(${staticFile('paper.jpg')})`,
      backgroundSize: '100% 100%, 800px 1100px',
      fontFamily: HAND,
      color: '#1e2740',
    }}
  >
    <div style={{position: 'absolute', top: 54, left: 60, fontFamily: '"Instrument Serif", serif', fontSize: 52, color: '#3a3128'}}>{title}</div>
    <div style={{position: 'absolute', top: 120, left: 60, right: 50, height: 2, background: '#b9876a', opacity: 0.6}} />
    {ROWS.map((r, i) => (
      <div key={r} style={{position: 'absolute', top: TOP + i * ROW_H, left: 60, right: 50, height: ROW_H, borderBottom: '1.5px solid rgba(120,140,170,0.35)'}}>
        <span style={{position: 'absolute', left: 0, bottom: 10, fontFamily: '"Inter", sans-serif', fontSize: 18, color: '#9a8f80'}}>{r}</span>
      </div>
    ))}
    {highlight !== undefined ? (
      <div style={{position: 'absolute', top: TOP + highlight * ROW_H + 4, left: 118, right: 56, height: ROW_H - 8, borderRadius: 8, boxShadow: 'inset 0 0 0 2px rgba(255,170,70,0.0)'}} />
    ) : null}
    {entries.map((e, i) => (
      <div
        key={i}
        style={{
          position: 'absolute',
          top: TOP + e.row * ROW_H + 4,
          left: e.x ?? 130,
          fontSize: 44,
          lineHeight: `${ROW_H - 6}px`,
          rotate: `${e.rot ?? 0}deg`,
          color: e.amber ? '#c86a08' : '#1e2740',
          textShadow: e.amber ? '0 0 10px rgba(255,180,80,0.95), 0 0 30px rgba(255,170,60,0.8), 0 0 60px rgba(255,160,50,0.5)' : 'none',
          textDecoration: e.strike ? 'line-through' : 'none',
          opacity: e.amber ? 1 : 0.88,
          whiteSpace: 'nowrap',
        }}
      >
        {e.text}
      </div>
    ))}
  </div>
);

/** Open diary, flat (2D), 1320×930 with cover. Place inside <FlatLay>. */
export const Diary: React.FC<{x: number; y: number; left: Entry[]; right: Entry[]; leftTitle?: string; rightTitle?: string; rot?: number}> = ({
  x,
  y,
  left,
  right,
  leftTitle = 'Saturday 14',
  rightTitle = 'Sunday 15',
  rot = 0,
}) => (
  <div style={{position: 'absolute', left: x, top: y, width: PAGE_W * 2 + 40, height: PAGE_H + 30, rotate: `${rot}deg`}}>
    <div style={{position: 'absolute', inset: 0, borderRadius: 12, background: 'linear-gradient(160deg, #6b3726, #4a2418)', boxShadow: '0 30px 60px rgba(0,0,0,0.55), 0 6px 14px rgba(0,0,0,0.4)'}} />
    {(['l', 'r'] as const).map((side) => (
      <div key={side} style={{position: 'absolute', top: 15, left: side === 'l' ? 18 : PAGE_W + 22, width: PAGE_W, height: PAGE_H, boxShadow: '0 1px 0 rgba(0,0,0,0.15), 0 2px 0 #efe6d4, 0 4px 0 #e2d7c2'}}>
        <Page title={side === 'l' ? leftTitle : rightTitle} entries={side === 'l' ? left : right} side={side} />
      </div>
    ))}
    <div style={{position: 'absolute', top: 15, bottom: 15, left: PAGE_W + 10, width: 20, background: 'linear-gradient(90deg, rgba(0,0,0,0.25), rgba(0,0,0,0) 50%, rgba(0,0,0,0.25))'}} />
  </div>
);

/** A table-top seen from above at a slight angle: children are laid out on a 1600×2400 oak surface. */
export const FlatLay: React.FC<{tilt?: number; scale?: number; ox?: number; oy?: number; children: React.ReactNode}> = ({tilt = 24, scale = 1, ox = 0, oy = 0, children}) => (
  <div style={{position: 'absolute', inset: 0, perspective: 1700, perspectiveOrigin: '540px 700px', overflow: 'hidden'}}>
    <div
      style={{
        position: 'absolute',
        left: -260 + ox,
        top: -260 + oy,
        width: 1600,
        height: 2400,
        transformOrigin: '800px 1200px',
        transform: `rotateX(${tilt}deg) scale(${scale})`,
        backgroundImage: `radial-gradient(ellipse 60% 45% at 50% 45%, rgba(255,232,196,0.12), rgba(0,0,0,0.55)), url(${staticFile('oak.jpg')})`,
        backgroundSize: '100% 100%, 2600px 1600px',
      }}
    >
      {children}
    </div>
  </div>
);

export const SAT: Entry[] = [
  {row: 0, text: 'Mia · trim', rot: -1},
  {row: 1, text: 'Tom · fade', rot: 0.5},
  {row: 2, text: 'Lou · blow dry', rot: -0.5},
  {row: 4, text: 'Gem · balayage', rot: 1},
  {row: 5, text: '↳ (cont.)', rot: 0, x: 150},
  {row: 6, text: 'Ana · toner', rot: -1},
  {row: 7, text: 'Kev · cut', rot: 0.5},
  {row: 8, text: 'Jo · colour', rot: -0.5, strike: true},
  {row: 9, text: 'Raj · beard', rot: 1},
  {row: 10, text: 'Ella · cut', rot: 0},
  {row: 11, text: 'Fay · wash & go', rot: -1},
];
export const SUN: Entry[] = [
  {row: 1, text: 'Bea · curls', rot: 0.5},
  {row: 3, text: 'Sid · cut', rot: -1},
  {row: 6, text: 'Zoe · toner', rot: 0},
  {row: 9, text: 'Kat · trim', rot: 0.5},
];
