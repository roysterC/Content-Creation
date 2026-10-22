import React from 'react';
import {Glow, HandText} from './art';
import {ip, P} from './theme';

export type Entry = {id: string; col: number; row: number; text: string; at: number; amber?: boolean; dur?: number};

// column x positions (left page: Priya, Sam · right page: Jo, Notes)
const COLS = [130, 318, 540, 760];
const HEAD = ['Priya', 'Sam', 'Jo', 'Notes'];
const ROW0 = 186;
const ROW = 56;
const TIMES = ['9', '10', '11', '12', '1', '2', '3', '4', '5'];

export const INK: Entry[] = [
  {id: 'i1', col: 0, row: 0, text: 'Mia · trim', at: -1},
  {id: 'i2', col: 1, row: 0.5, text: 'Tom · cut', at: -1},
  {id: 'i3', col: 1, row: 2, text: 'Kev · fade', at: -1},
  {id: 'i4', col: 2, row: 0, text: 'Lou · blow dry', at: -1},
  {id: 'i5', col: 2, row: 3, text: 'Ana · toner', at: -1},
  {id: 'i6', col: 0, row: 4, text: 'Gem · colour', at: -1},
];

/** Overhead open diary, 1000×700 units. `abs` = absolute frame for entry timing. */
export const Diary: React.FC<{abs: number; entries: Entry[]; glow?: number}> = ({abs, entries, glow = 0}) => (
  <g>
    <defs>
      <linearGradient id="spine" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#000" stopOpacity={0} />
        <stop offset="0.5" stopColor="#000" stopOpacity={0.22} />
        <stop offset="1" stopColor="#000" stopOpacity={0} />
      </linearGradient>
    </defs>
    <rect x={16} y={30} width={968} height={664} rx={14} fill="#7c4e2e" />
    <path d="M 30 40 Q 260 26 496 46 L 496 684 Q 260 666 30 680 Z" fill={P.paper} />
    <path d="M 504 46 Q 740 26 970 40 L 970 680 Q 740 666 504 684 Z" fill="#f8f0e0" />
    <rect x={440} y={40} width={120} height={650} fill="url(#spine)" />
    {/* header + ruling */}
    <text x={60} y={108} fontFamily='"Caveat", cursive' fontWeight={600} fontSize={52} fill={P.ink}>
      Saturday
    </text>
    {HEAD.map((h, i) => (
      <text key={h} x={COLS[i]} y={156} fontFamily='"Caveat", cursive' fontWeight={600} fontSize={34} fill="#8a7f72">
        {h}
      </text>
    ))}
    {TIMES.map((t, i) => (
      <g key={t}>
        <line x1={50} y1={ROW0 + i * ROW} x2={480} y2={ROW0 + i * ROW} stroke={P.paperLine} strokeWidth={2} />
        <line x1={520} y1={ROW0 + i * ROW} x2={950} y2={ROW0 + i * ROW} stroke={P.paperLine} strokeWidth={2} />
        <text x={62} y={ROW0 + i * ROW + 36} fontFamily='"Caveat", cursive' fontWeight={600} fontSize={28} fill="#a39684">
          {t}
        </text>
      </g>
    ))}
    <line x1={306} y1={130} x2={306} y2={660} stroke={P.paperLine} strokeWidth={2} />
    <line x1={744} y1={130} x2={744} y2={660} stroke={P.paperLine} strokeWidth={2} />
    {entries.map((e) => {
      const p = e.at < 0 ? 1 : ip(abs, [e.at, e.at + (e.dur ?? 22)], [0, 1]);
      const y = ROW0 + e.row * ROW + 38;
      const recent = e.amber ? ip(abs, [e.at, e.at + 20, e.at + 70], [0, 1, 0.45]) : 0;
      return (
        <g key={e.id}>
          {e.amber && p > 0 ? <Glow id={`eg-${e.id}`} x={COLS[e.col] + 80} y={y - 10} r={110} o={recent * 0.45} /> : null}
          <HandText id={`et-${e.id}`} x={COLS[e.col]} y={y} size={e.col === 3 ? 30 : 34} text={e.text} color={e.amber ? P.amberInk : P.ink} p={p} glow={e.amber} />
        </g>
      );
    })}
    {glow > 0 ? <Glow id="diaryWhole" x={500} y={360} r={620} o={glow * 0.35} /> : null}
  </g>
);
