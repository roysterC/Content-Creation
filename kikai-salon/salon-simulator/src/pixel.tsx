import React from 'react';

/** 16-colour retro palette (PICO-8). */
export const C = {
  black: '#000000',
  navy: '#1d2b53',
  plum: '#7e2553',
  green: '#008751',
  brown: '#ab5236',
  dgrey: '#5f574f',
  lgrey: '#c2c3c7',
  white: '#fff1e8',
  red: '#ff004d',
  orange: '#ffa300',
  yellow: '#ffec27',
  lime: '#00e436',
  blue: '#29adff',
  lavender: '#83769c',
  pink: '#ff77a8',
  peach: '#ffccaa',
};
const KEY: Record<string, string> = {
  '0': C.black,
  '1': C.navy,
  '2': C.plum,
  '3': C.green,
  '4': C.brown,
  '5': C.dgrey,
  '6': C.lgrey,
  '7': C.white,
  '8': C.red,
  '9': C.orange,
  a: C.yellow,
  b: C.lime,
  c: C.blue,
  d: C.lavender,
  e: C.pink,
  f: C.peach,
};

/* ─────────────── run-length paths, cached ─────────────── */
const cache = new Map<string, Record<string, string>>();

/** One SVG path per colour for a grid of palette chars ('.' = clear). */
const paths = (key: string, rows: string[], u: number, remap: Record<string, string> = {}) => {
  const k = `${key}|${u}|${JSON.stringify(remap)}`;
  const hit = cache.get(k);
  if (hit) return hit;
  const out: Record<string, string> = {};
  rows.forEach((row, r) => {
    let c = 0;
    while (c < row.length) {
      const ch = row[c];
      let e = c + 1;
      while (e < row.length && row[e] === ch) e++;
      if (ch !== '.' && ch !== ' ') {
        const col = remap[ch] ?? KEY[ch] ?? ch;
        out[col] = (out[col] ?? '') + `M${c * u} ${r * u}h${(e - c) * u}v${u}h${-(e - c) * u}z`;
      }
      c = e;
    }
  });
  cache.set(k, out);
  return out;
};

export const Sprite: React.FC<{id: string; rows: string[]; x: number; y: number; u: number; remap?: Record<string, string>; flip?: boolean; opacity?: number}> = ({
  id,
  rows,
  x,
  y,
  u,
  remap,
  flip,
  opacity = 1,
}) => {
  const p = paths(id, rows, u, remap);
  const w = rows[0].length * u;
  return (
    <g transform={`translate(${Math.round(x)} ${Math.round(y)})${flip ? ` translate(${w} 0) scale(-1 1)` : ''}`} opacity={opacity}>
      {Object.entries(p).map(([col, d]) => (
        <path key={col} d={d} fill={col} />
      ))}
    </g>
  );
};

/* ─────────────── 5x7 pixel font ─────────────── */
const G: Record<string, string> = {
  A: '.###.|#...#|#...#|#####|#...#|#...#|#...#',
  B: '####.|#...#|#...#|####.|#...#|#...#|####.',
  C: '.###.|#...#|#....|#....|#....|#...#|.###.',
  D: '####.|#...#|#...#|#...#|#...#|#...#|####.',
  E: '#####|#....|#....|####.|#....|#....|#####',
  F: '#####|#....|#....|####.|#....|#....|#....',
  G: '.###.|#...#|#....|#.###|#...#|#...#|.####',
  H: '#...#|#...#|#...#|#####|#...#|#...#|#...#',
  I: '.###.|..#..|..#..|..#..|..#..|..#..|.###.',
  J: '..###|...#.|...#.|...#.|...#.|#..#.|.##..',
  K: '#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#',
  L: '#....|#....|#....|#....|#....|#....|#####',
  M: '#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#',
  N: '#...#|#...#|##..#|#.#.#|#..##|#...#|#...#',
  O: '.###.|#...#|#...#|#...#|#...#|#...#|.###.',
  P: '####.|#...#|#...#|####.|#....|#....|#....',
  Q: '.###.|#...#|#...#|#...#|#.#.#|#..#.|.##.#',
  R: '####.|#...#|#...#|####.|#.#..|#..#.|#...#',
  S: '.####|#....|#....|.###.|....#|....#|####.',
  T: '#####|..#..|..#..|..#..|..#..|..#..|..#..',
  U: '#...#|#...#|#...#|#...#|#...#|#...#|.###.',
  V: '#...#|#...#|#...#|#...#|#...#|.#.#.|..#..',
  W: '#...#|#...#|#...#|#.#.#|#.#.#|#.#.#|.#.#.',
  X: '#...#|#...#|.#.#.|..#..|.#.#.|#...#|#...#',
  Y: '#...#|#...#|.#.#.|..#..|..#..|..#..|..#..',
  Z: '#####|....#|...#.|..#..|.#...|#....|#####',
  '0': '.###.|#...#|#..##|#.#.#|##..#|#...#|.###.',
  '1': '..#..|.##..|..#..|..#..|..#..|..#..|.###.',
  '2': '.###.|#...#|....#|...#.|..#..|.#...|#####',
  '3': '####.|....#|....#|.###.|....#|....#|####.',
  '4': '...#.|..##.|.#.#.|#..#.|#####|...#.|...#.',
  '5': '#####|#....|####.|....#|....#|#...#|.###.',
  '6': '..##.|.#...|#....|####.|#...#|#...#|.###.',
  '7': '#####|....#|...#.|..#..|.#...|.#...|.#...',
  '8': '.###.|#...#|#...#|.###.|#...#|#...#|.###.',
  '9': '.###.|#...#|#...#|.####|....#|...#.|.##..',
  ':': '.....|..#..|..#..|.....|..#..|..#..|.....',
  '!': '..#..|..#..|..#..|..#..|..#..|.....|..#..',
  '?': '.###.|#...#|....#|...#.|..#..|.....|..#..',
  '.': '.....|.....|.....|.....|.....|.##..|.##..',
  ',': '.....|.....|.....|.....|.##..|..#..|.#...',
  "'": '..#..|..#..|.#...|.....|.....|.....|.....',
  '"': '.#.#.|.#.#.|.#.#.|.....|.....|.....|.....',
  '-': '.....|.....|.....|#####|.....|.....|.....',
  '+': '.....|..#..|..#..|#####|..#..|..#..|.....',
  '×': '.....|#...#|.#.#.|..#..|.#.#.|#...#|.....',
  '/': '....#|....#|...#.|..#..|.#...|#....|#....',
  '£': '..##.|.#..#|.#...|###..|.#...|.#...|#####',
  '♥': '.....|.#.#.|#####|#####|.###.|..#..|.....',
  '★': '..#..|..#..|#####|.###.|.###.|.#.#.|#...#',
  '→': '.....|..#..|...#.|#####|...#.|..#..|.....',
  '▼': '.....|.....|#####|.###.|..#..|.....|.....',
  '(': '...#.|..#..|.#...|.#...|.#...|..#..|...#.',
  ')': '.#...|..#..|...#.|...#.|...#.|..#..|.#...',
  '&': '.##..|#..#.|#.#..|.#...|#.#.#|#..#.|.##.#',
  '·': '.....|.....|.....|..#..|.....|.....|.....',
  ' ': '.....|.....|.....|.....|.....|.....|.....',
};

export const textSize = (text: string, px: number, spacing = 1, lineGap = 3) => {
  const lines = text.split('\n');
  return {w: Math.max(...lines.map((l) => l.length)) * (5 + spacing) * px - spacing * px, h: lines.length * (7 + lineGap) * px - lineGap * px};
};

const glyphRows = (line: string, spacing: number) => {
  const rows: string[] = [];
  for (let r = 0; r < 7; r++) {
    rows.push(
      [...line]
        .map((ch) => (G[ch.toUpperCase()] ?? G[' ']).split('|')[r].replace(/#/g, 'x'))
        .join('.'.repeat(spacing)),
    );
  }
  return rows;
};

/** Pixel text. x/y = top-left (or top-centre with align="center"). Supports \n. */
export const PixelText: React.FC<{
  text: string;
  x: number;
  y: number;
  px: number;
  color: string;
  shadow?: string;
  align?: 'left' | 'center' | 'right';
  spacing?: number;
  lineGap?: number;
  opacity?: number;
}> = ({text, x, y, px, color, shadow, align = 'left', spacing = 1, lineGap = 3, opacity = 1}) => {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <g opacity={opacity}>
      {lines.map((line, i) => {
        const {w} = textSize(line, px, spacing);
        const lx = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
        const ly = y + i * (7 + lineGap) * px;
        const rows = glyphRows(line, spacing);
        return (
          <g key={i}>
            {shadow ? <Sprite id={`t:${line}:${spacing}`} rows={rows} x={lx + px} y={ly + px} u={px} remap={{x: shadow}} /> : null}
            <Sprite id={`t:${line}:${spacing}`} rows={rows} x={lx} y={ly} u={px} remap={{x: color}} />
          </g>
        );
      })}
    </g>
  );
};

/** Word-wrap to a character width. */
export const wrap = (text: string, cols: number) => {
  const out: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    if ((line + ' ' + word).trim().length > cols) {
      out.push(line);
      line = word;
    } else line = (line + ' ' + word).trim();
  }
  if (line) out.push(line);
  return out.join('\n');
};

/** Pixel circle (filled) as rows, for coins and orbs. */
export const discRows = (r: number, fill: string, rim?: string) => {
  const n = r * 2 + 1;
  return Array.from({length: n}, (_, y) =>
    Array.from({length: n}, (_, x) => {
      const d = Math.hypot(x - r, y - r);
      return d <= r - 0.6 ? fill : d <= r + 0.3 ? rim ?? fill : '.';
    }).join(''),
  );
};

/** Solid pixel rectangle snapped to a grid unit. */
export const Block: React.FC<{x: number; y: number; w: number; h: number; u: number; fill: string; opacity?: number}> = ({x, y, w, h, u, fill, opacity}) => (
  <rect x={Math.round(x * u)} y={Math.round(y * u)} width={Math.round(w * u)} height={Math.round(h * u)} fill={fill} opacity={opacity} />
);
