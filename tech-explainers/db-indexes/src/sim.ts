// Database indexes explainer: deterministic table data, scan position, sorted index and
// B-tree search path. Beats are anchored to the spoken words (captions.json).
import {random} from 'remotion';
import TL from './timeline.json';
import CAPS from './captions.json';

export const FPS = 30;
export const S = TL;
export const COL = {
  bg: '#0a0e14',
  ink: '#e9eef5',
  dim: '#8b98a9',
  line: '#223044',
  req: '#39d0ff',
  ok: '#3ddc84',
  bad: '#ff4d5e',
  amber: '#ffb020',
  pink: '#ff6fb1',
  violet: '#a98bff',
};

/** frame a word starts in a line (nth word whose text starts with `w`) */
export const word = (id: string, w: string, nth = 0) => {
  const l = CAPS.find((x) => x.id === id);
  const hits = l?.words.filter((x) => x.t.toLowerCase().startsWith(w.toLowerCase())) ?? [];
  if (!hits[nth]) throw new Error(`no word ${w} in ${id}`);
  return Math.round(hits[nth].s);
};

export const N_ROWS = 1_000_000;
export const TARGET_ID = 847_203;
export const TARGET_EMAIL = 'zoe@mail.com';
const NAMES = ['aaron', 'abby', 'adam', 'aisha', 'alex', 'amir', 'anna', 'ben', 'bella', 'cara', 'chen', 'dan', 'dev', 'ella', 'emma', 'eric', 'fatima', 'finn', 'gia', 'hana', 'harry', 'isla', 'ivan', 'jade', 'jack', 'kai', 'kemi', 'leo', 'lily', 'luca', 'maya', 'max', 'mia', 'nadia', 'noah', 'omar', 'olivia', 'priya', 'quinn', 'raj', 'rosa', 'sam', 'sara', 'tom', 'uma', 'vera', 'will', 'xena', 'yara', 'yusuf', 'zack', 'zara', 'zuri'];
/** the email stored in row `id` (the table is in insertion order, not sorted) */
export const emailOf = (id: number) => (id === TARGET_ID ? TARGET_EMAIL : `${NAMES[Math.floor(random(`n${id}`) * NAMES.length)]}${Math.floor(random(`d${id}`) * 90 + 10)}@mail.com`);

// ── the full scan: which row the scanner is on at frame f ──
export const A = {
  everyRow: word('scan', 'row'),
  millionChecks: word('scan', '1m checks'),
  sorted: word('index', 'sorted'),
  pointer: word('index', 'pointer'),
  book: word('index', 'book'),
  btree: word('btree', 'b-tree'),
  hops: [word('btree', 'finding'), word('btree', 'one'), word('btree', 'in'), word('btree', 'takes')],
  hopCount: word('btree', '3–4'),
  insert: word('cost', 'insert'),
  everyIndex: word('cost', 'every', 1),
  searchBy: word('cost', 'search'),
  runExplain: word('explain', 'explain'),
  scans: word('explain', 'scans'),
};
const KEYS: [number, number][] = [
  [-1, 290_000],
  [S.series, 640_000],
  [A.everyRow - 14, 845_000],
  [A.everyRow, TARGET_ID],
  [A.everyRow + 12, TARGET_ID + 40],
  [A.millionChecks + 26, N_ROWS],
];
export const scanPos = (f: number) => {
  if (f <= KEYS[0][0]) return KEYS[0][1];
  for (let i = 1; i < KEYS.length; i++) {
    const [f0, v0] = KEYS[i - 1];
    const [f1, v1] = KEYS[i];
    if (f <= f1) {
      const t = (f - f0) / (f1 - f0);
      const e = i === 3 ? 1 - (1 - t) * (1 - t) : t; // ease into the target row
      return Math.round(v0 + (v1 - v0) * e);
    }
  }
  return N_ROWS;
};
/** the scan has found zoe (but must keep going: emails aren't known to be unique) */
export const foundAt = A.everyRow;
export const SCAN_DONE = A.millionChecks + 26;
/** one full scan of 1M small, cached rows ≈ 150 ms (typical Postgres/MySQL); an indexed lookup ≈ 0.1 ms */
export const SCAN_MS = 150;
export const scanMs = (rows: number) => (rows / N_ROWS) * SCAN_MS;

// ── the sorted index (a window near "z") ──
export const INDEX_WINDOW = [
  {email: 'yara31@mail.com', id: 512_884},
  {email: 'yusuf18@mail.com', id: 77_310},
  {email: 'zack52@mail.com', id: 930_447},
  {email: 'zara07@mail.com', id: 264_019},
  {email: TARGET_EMAIL, id: TARGET_ID},
  {email: 'zuri44@mail.com', id: 401_662},
  {email: 'zuri90@mail.com', id: 15_973},
];

// ── B-tree: root → branch → leaf → row (4 page reads) ──
export const TREE = {
  root: ['h', 'p'],
  branches: [['b', 'e'], ['k', 'm'], ['s', 'w']],
  leaves: ['w–x', 'x–y', 'y–z'],
  path: ['root', 'branch 3', 'leaf: y–z', `row ${TARGET_ID.toLocaleString('en-GB')}`],
};
