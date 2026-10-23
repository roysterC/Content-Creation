import React from 'react';
import {AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {A, COL, emailOf, foundAt, INDEX_WINDOW, N_ROWS, S, SCAN_DONE, scanPos, scanSeconds, TARGET_EMAIL, TARGET_ID, TREE} from './sim';
import CAPS from './captions.json';
import {Captions} from '../../_shared/Captions';
import {ShareOutro} from '../../_shared/ShareOutro';

for (const w of ['400', '500', '600', '800']) loadFont({family: 'Inter', url: staticFile(`inter-${w}.woff2`), weight: w});
for (const w of ['400', '600']) loadFont({family: 'Plex Mono', url: staticFile(`mono-${w}.woff2`), weight: w});
const SANS = 'Inter, sans-serif';
const MONO = '"Plex Mono", monospace';

const ease = Easing.bezier(0.25, 0.1, 0.25, 1);
const ip = (f: number, i: number[], o: number[], e = ease) => interpolate(f, i, o, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: e});
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const n = (x: number) => Math.round(x).toLocaleString('en-GB');

/* ───────── copy ───────── */
type Copy = {at: number; until: number; kicker: string; head: string[]; kColor?: string};
const COPY: Copy[] = [
  {at: S.hook, until: S.series, kicker: 'DATABASE INDEXES · EXPLAINED', head: ['POV: your database', 'hit a million rows.'], kColor: COL.bad},
  {at: S.series, until: S.scan, kicker: 'EXPERT IN UNDER 1 MINUTE', head: ['Database indexes,', 'expert level.'], kColor: COL.amber},
  {at: S.scan, until: S.index, kicker: '01 · FULL TABLE SCAN', head: ['No index?', 'Check every row.'], kColor: COL.bad},
  {at: S.index, until: S.btree, kicker: '02 · THE INDEX', head: ['A sorted copy,', 'with pointers.'], kColor: COL.ok},
  {at: S.btree, until: S.cost, kicker: '03 · B-TREE', head: ['1M rows,', '4 hops.'], kColor: COL.req},
  {at: S.cost, until: S.explain, kicker: '04 · THE COST', head: ['Every write updates', 'every index.'], kColor: COL.amber},
  {at: S.explain, until: S.recap, kicker: '05 · EXPLAIN', head: ['Check it,', 'don’t guess.'], kColor: COL.violet},
];
const Headline: React.FC<{f: number; c: Copy}> = ({f, c}) => {
  if (f < c.at - 1 || f >= c.until) return null;
  const out = ip(f, [c.until - 8, c.until], [1, 0]);
  return (
    <div style={{position: 'absolute', left: 70, right: 120, top: 250, opacity: out}}>
      <div style={{fontFamily: MONO, fontWeight: 600, fontSize: 27, letterSpacing: 3, color: c.kColor ?? COL.amber, opacity: c.at === 0 ? 1 : ip(f, [c.at, c.at + 8], [0, 1])}}>{c.kicker}</div>
      <div style={{marginTop: 18}}>
        {c.head.map((line, i) => {
          const p = c.at === 0 ? 1 : ip(f, [c.at + 3 + i * 5, c.at + 15 + i * 5], [0, 1]);
          return (
            <div key={i} style={{fontFamily: SANS, fontWeight: 800, fontSize: 76, lineHeight: 1.08, letterSpacing: -2, color: COL.ink, opacity: p, translate: `0 ${(1 - p) * 26}px`}}>
              {line}
            </div>
          );
        })}
      </div>
    </div>
  );
};
const Progress: React.FC<{f: number}> = ({f}) => {
  const marks = [S.scan, S.index, S.btree, S.cost, S.explain, S.recap];
  return (
    <div style={{position: 'absolute', left: 70, right: 150, top: 232, height: 4, display: 'flex', gap: 8}}>
      {marks.map((m, i) => (
        <div key={i} style={{flex: 1, borderRadius: 2, background: '#1c2838', overflow: 'hidden'}}>
          <div style={{width: `${ip(f, [m, marks[i + 1] ?? S.total], [0, 100], Easing.linear)}%`, height: '100%', background: COL.amber}} />
        </div>
      ))}
    </div>
  );
};

/* ───────── the users table ───────── */
const ROW_H = 48;
const VISIBLE = 13;
const Table: React.FC<{f: number; x: number; y: number; w: number; mode: 'scan' | 'target'; insertAt?: number}> = ({f, x, y, w, mode, insertAt}) => {
  const pos = mode === 'scan' ? scanPos(f) : TARGET_ID;
  const mid = Math.floor(VISIBLE / 2);
  const rows = Array.from({length: VISIBLE}, (_, i) => pos - mid + i).filter((id) => id >= 1 && id <= N_ROWS);
  const found = mode === 'scan' && f >= foundAt && f < foundAt + 16;
  const done = mode === 'scan' && f >= SCAN_DONE;
  const ins = insertAt !== undefined ? ip(f, [insertAt, insertAt + 10], [0, 1]) : 0;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, borderRadius: 18, background: '#0f1621', border: '2px solid #2c3c52', overflow: 'hidden'}}>
      <div style={{height: 54, background: '#152132', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', fontFamily: MONO, fontSize: 22}}>
        <span style={{color: COL.ink, fontWeight: 600, letterSpacing: 1}}>users</span>
        <span style={{color: COL.dim}}>{n(N_ROWS + (ins > 0.5 ? 1 : 0))} rows</span>
      </div>
      <div style={{display: 'flex', padding: '8px 20px', fontFamily: MONO, fontSize: 19, color: COL.dim, borderBottom: '1px solid #223044'}}>
        <span style={{width: 130}}>id</span>
        <span>email</span>
      </div>
      {rows.map((id, i) => {
        const isT = id === TARGET_ID;
        const cur = mode === 'scan' && i === mid && !done;
        const hot = (mode === 'target' && isT) || (cur && isT && f >= foundAt);
        return (
          <div key={i} style={{height: ROW_H, display: 'flex', alignItems: 'center', padding: '0 20px', fontFamily: MONO, fontSize: 22, color: hot ? '#0a0e14' : cur ? COL.ink : '#6f7c8f', background: hot ? COL.ok : cur ? 'rgba(57,208,255,0.18)' : 'transparent', borderLeft: cur ? `4px solid ${COL.req}` : '4px solid transparent'}}>
            <span style={{width: 130, fontVariantNumeric: 'tabular-nums'}}>{n(id)}</span>
            <span>{emailOf(id)}</span>
          </div>
        );
      })}
      {insertAt !== undefined ? (
        <div style={{height: ROW_H, display: 'flex', alignItems: 'center', padding: '0 20px', fontFamily: MONO, fontSize: 22, color: COL.ink, background: `rgba(255,176,32,${0.25 * ins})`, opacity: ins}}>
          <span style={{width: 130}}>{n(N_ROWS + 1)}</span>
          <span>ivy@mail.com</span>
        </div>
      ) : null}
      {found ? (
        <div style={{position: 'absolute', right: 16, top: 54 + 38 + mid * ROW_H + 8, padding: '4px 12px', borderRadius: 8, background: COL.ok, color: '#0a0e14', fontFamily: MONO, fontWeight: 600, fontSize: 20}}>MATCH (keep scanning…)</div>
      ) : null}
    </div>
  );
};

const QueryBar: React.FC<{f: number; o: number}> = ({f, o}) => (
  <div style={{position: 'absolute', left: 70, right: 150, top: 488, opacity: o, padding: '12px 18px', borderRadius: 12, background: '#121a26', border: '1.5px solid #2c3c52', fontFamily: MONO, fontSize: 22, color: COL.dim, whiteSpace: 'nowrap', overflow: 'hidden'}}>
    <span style={{color: COL.violet}}>SELECT</span> * <span style={{color: COL.violet}}>FROM</span> users <span style={{color: COL.violet}}>WHERE</span> email = <span style={{color: COL.amber}}>'{TARGET_EMAIL}'</span>
    {f < SCAN_DONE ? <span style={{opacity: Math.floor(f / 8) % 2 ? 1 : 0.2}}> ▍</span> : null}
  </div>
);

const ScanStats: React.FC<{f: number}> = ({f}) => {
  const rows = scanPos(f);
  const done = f >= SCAN_DONE;
  return (
    <div style={{position: 'absolute', left: 600, top: 640, width: 320}}>
      <div style={{fontFamily: MONO, fontSize: 22, color: COL.dim, letterSpacing: 2}}>ROWS CHECKED</div>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 64, color: done ? COL.bad : COL.ink, letterSpacing: -1.5, fontVariantNumeric: 'tabular-nums'}}>{n(rows)}</div>
      <div style={{marginTop: 30, fontFamily: MONO, fontSize: 22, color: COL.dim, letterSpacing: 2}}>TIME</div>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 64, color: done ? COL.bad : COL.amber, letterSpacing: -1.5, fontVariantNumeric: 'tabular-nums'}}>{scanSeconds(rows).toFixed(1)} s</div>
      {done ? <div style={{marginTop: 20, fontFamily: MONO, fontSize: 22, color: COL.bad, opacity: ip(f, [SCAN_DONE, SCAN_DONE + 8], [0, 1])}}>every row, every time</div> : null}
    </div>
  );
};

/* the sorted index, with a pointer back into the table */
const IndexCard: React.FC<{f: number; x: number; y: number; w: number; title?: string; o?: number; flash?: number; small?: boolean}> = ({f, x, y, w, title = 'INDEX · email (sorted)', o = 1, flash = 0, small}) => {
  const entries = small ? INDEX_WINDOW.slice(2, 6) : INDEX_WINDOW;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, opacity: o, borderRadius: 18, background: '#0d1a12', border: `2px solid ${flash > 0 ? COL.amber : COL.ok}`, overflow: 'hidden', boxShadow: flash > 0 ? `0 0 ${24 * flash}px rgba(255,176,32,0.6)` : undefined}}>
      <div style={{height: 50, background: '#11261a', display: 'flex', alignItems: 'center', padding: '0 16px', fontFamily: MONO, fontWeight: 600, fontSize: small ? 19 : 20, color: COL.ok, letterSpacing: 1}}>{title}</div>
      {entries.map((e, i) => {
        const isT = e.email === TARGET_EMAIL;
        const p = ip(f, [A.sorted + i * 3, A.sorted + 10 + i * 3], [0, 1]);
        return (
          <div key={i} style={{height: small ? 40 : 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', fontFamily: MONO, fontSize: small ? 18 : 20, color: isT && !small && f >= A.pointer ? '#0a0e14' : isT ? COL.ink : '#9fb3a6', background: isT && !small && f >= A.pointer ? COL.ok : 'transparent', opacity: small ? 1 : p}}>
            <span>{e.email.replace('@mail.com', '')}</span>
            <span style={{opacity: f >= A.pointer || small ? 1 : 0}}>→ {n(e.id)}</span>
          </div>
        );
      })}
    </div>
  );
};

const IndexScene: React.FC<{f: number}> = ({f}) => {
  const o = ip(f, [S.index, S.index + 14, S.btree - 8, S.btree], [0, 1, 1, 0]);
  if (o <= 0) return null;
  const tx = 70;
  const ty = 590;
  const ix = 588;
  const iy = 640;
  const arrow = ip(f, [A.pointer, A.pointer + 14], [0, 1]);
  const book = ip(f, [A.book - 18, A.book - 6], [0, 1]);
  const targetRowY = ty + 54 + 38 + Math.floor(VISIBLE / 2) * ROW_H + ROW_H / 2;
  const entryY = iy + 50 + 4 * 52 + 26;
  return (
    <AbsoluteFill style={{opacity: o}}>
      <Table f={f} x={tx} y={ty} w={490} mode="target" />
      <IndexCard f={f} x={ix} y={iy} w={330} />
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <path d={`M ${ix} ${entryY} C ${ix - 40} ${entryY} ${ix - 30} ${targetRowY} ${tx + 490 - 4} ${targetRowY}`} fill="none" stroke={COL.ok} strokeWidth={4} strokeDasharray="600" strokeDashoffset={600 * (1 - arrow)} />
        {arrow > 0.95 ? <path d={`M ${tx + 490 + 12} ${targetRowY - 9} L ${tx + 490 - 2} ${targetRowY} L ${tx + 490 + 12} ${targetRowY + 9}`} fill="none" stroke={COL.ok} strokeWidth={4} strokeLinecap="round" /> : null}
      </svg>
      {/* the book analogy */}
      <div style={{position: 'absolute', left: ix, top: iy + 50 + 7 * 52 + 26, width: 330, opacity: book, translate: `0 ${(1 - book) * 16}px`, display: 'flex', gap: 14, alignItems: 'center', padding: '14px 16px', borderRadius: 14, background: '#1a1406', border: `2px solid ${COL.amber}`}}>
        <svg width={44} height={44} viewBox="0 0 24 24">
          <path d="M4 4h7a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4z M20 4h-5a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h5z" fill="none" stroke={COL.amber} strokeWidth={1.8} strokeLinejoin="round" />
        </svg>
        <div style={{fontFamily: MONO, fontSize: 20, color: COL.amber, lineHeight: 1.4}}>
          book index:
          <br />
          zoe ……… p. 847
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* B-tree search: root → branch → leaf → row */
const BTree: React.FC<{f: number}> = ({f}) => {
  const o = ip(f, [S.btree, S.btree + 14, S.cost - 8, S.cost], [0, 1, 1, 0]);
  if (o <= 0) return null;
  const hop = A.hops.filter((h) => f >= h).length; // 0..4
  const nodeW = 210;
  const nodeH = 74;
  const L0 = {x: 540, y: 640};
  const L1 = [240, 540, 840].map((x) => ({x, y: 840}));
  const L2 = [640, 840].map((x) => ({x, y: 1040}));
  const row = {x: 740, y: 1220};
  const on = (k: number) => hop >= k;
  const box = (p: {x: number; y: number}, label: string, k: number, key: string, w = nodeW) => (
    <g key={key}>
      <rect x={p.x - w / 2} y={p.y - nodeH / 2} width={w} height={nodeH} rx={14} fill={on(k) ? '#0d2a33' : '#0f1621'} stroke={on(k) ? COL.req : '#2c3c52'} strokeWidth={on(k) ? 3.5 : 2} />
      <text x={p.x} y={p.y + 8} textAnchor="middle" fontFamily={MONO} fontSize={22} fill={on(k) ? COL.ink : COL.dim}>
        {label}
      </text>
    </g>
  );
  const edge = (a: {x: number; y: number}, b: {x: number; y: number}, k: number, key: string) => (
    <line key={key} x1={a.x} y1={a.y + nodeH / 2} x2={b.x} y2={b.y - nodeH / 2} stroke={on(k) ? COL.req : '#223044'} strokeWidth={on(k) ? 4 : 2} />
  );
  return (
    <AbsoluteFill style={{opacity: o}}>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        {L1.map((p, i) => edge(L0, p, i === 2 ? 2 : 99, `e1${i}`))}
        {L2.map((p, i) => edge(L1[2], p, i === 1 ? 3 : 99, `e2${i}`))}
        <line x1={L2[1].x} y1={L2[1].y + nodeH / 2} x2={row.x} y2={row.y - nodeH / 2} stroke={on(4) ? COL.ok : '#223044'} strokeWidth={on(4) ? 4 : 2} strokeDasharray="8 8" />
        {box(L0, `root: ${TREE.root.join(' | ')}`, 1, 'r')}
        {L1.map((p, i) => box(p, TREE.branches[i].join(' | '), i === 2 ? 2 : 99, `b${i}`, 190))}
        {L2.map((p, i) => box(p, `leaf ${TREE.leaves[i + 1]}`, i === 1 ? 3 : 99, `l${i}`, 190))}
        <g>
          <rect x={row.x - 220} y={row.y - nodeH / 2} width={440} height={nodeH} rx={14} fill={on(4) ? COL.ok : '#0f1621'} stroke={on(4) ? COL.ok : '#2c3c52'} strokeWidth={2} />
          <text x={row.x} y={row.y + 8} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={22} fill={on(4) ? '#0a0e14' : COL.dim}>
            {n(TARGET_ID)} · {TARGET_EMAIL}
          </text>
        </g>
        {/* the searcher */}
        {hop > 0 && hop <= 4 ? (() => {
          const pts = [L0, L1[2], L2[1], row];
          const k = hop - 1;
          const t = ip(f, [A.hops[k], A.hops[k] + 6], [0, 1]);
          const a = pts[Math.max(0, k - 1)];
          const b = pts[k];
          return <circle cx={lerp(a.x, b.x, k === 0 ? 1 : t) - (k === 3 ? 240 : nodeW / 2 + 16)} cy={lerp(a.y, b.y, k === 0 ? 1 : t)} r={10} fill={COL.req} />;
        })() : null}
      </svg>
      <div style={{position: 'absolute', left: 70, top: 1300, display: 'flex', gap: 60, opacity: ip(f, [A.hopCount - 4, A.hopCount + 6], [0, 1])}}>
        <div>
          <div style={{fontFamily: MONO, fontSize: 21, color: COL.dim, letterSpacing: 2}}>WITH INDEX</div>
          <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 52, color: COL.ok}}>4 page reads</div>
        </div>
        <div>
          <div style={{fontFamily: MONO, fontSize: 21, color: COL.dim, letterSpacing: 2}}>WITHOUT</div>
          <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 52, color: COL.bad}}>1,000,000 rows</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* the cost: one insert, written to the table and to every index */
const Cost: React.FC<{f: number}> = ({f}) => {
  const o = ip(f, [S.cost, S.cost + 14, S.explain - 8, S.explain], [0, 1, 1, 0]);
  if (o <= 0) return null;
  const idx = [
    {title: 'INDEX · email', keep: true, note: '✓ searched all the time'},
    {title: 'INDEX · name', keep: true, note: '✓ searched'},
    {title: 'INDEX · bio', keep: false, note: '✗ never searched: drop it'},
  ];
  const writes = idx.length + 1;
  const wAt = A.everyIndex;
  const judge = ip(f, [A.searchBy, A.searchBy + 10], [0, 1]);
  const start = {x: 330, y: 560};
  return (
    <AbsoluteFill style={{opacity: o}}>
      <div style={{position: 'absolute', left: 70, top: 520, padding: '10px 18px', borderRadius: 12, background: '#1a1406', border: `2px solid ${COL.amber}`, fontFamily: MONO, fontSize: 22, color: COL.amber, opacity: ip(f, [A.insert - 6, A.insert + 4], [0, 1])}}>
        INSERT ivy@mail.com
      </div>
      <div style={{scale: '0.82', transformOrigin: '70px 620px', position: 'absolute', inset: 0}}>
        <Table f={f} x={70} y={620} w={490} mode="target" insertAt={wAt} />
      </div>
      {idx.map((c, i) => {
        const fl = ip(f, [wAt + 4 + i * 4, wAt + 8 + i * 4, wAt + 22 + i * 4], [0, 1, 0]);
        return (
          <div key={i}>
            <IndexCard f={S.index + 200} x={600} y={620 + i * 250} w={320} title={c.title} flash={fl} small />
            <div style={{position: 'absolute', left: 600, top: 620 + i * 250 + 216, fontFamily: MONO, fontSize: 20, color: c.keep ? COL.ok : COL.bad, opacity: judge}}>{c.note}</div>
          </div>
        );
      })}
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        {Array.from({length: writes}).map((_, k) => {
          const t = ip(f, [wAt + k * 4 - 10, wAt + k * 4], [0, 1], Easing.bezier(0.4, 0, 0.6, 1));
          if (t <= 0 || f > wAt + k * 4 + 12) return null;
          const end = k === 0 ? {x: 330, y: 1150} : {x: 600, y: 620 + (k - 1) * 250 + 25};
          return <circle key={k} cx={lerp(start.x, end.x, t)} cy={lerp(start.y, end.y, t)} r={10} fill={COL.amber} />;
        })}
      </svg>
      <div style={{position: 'absolute', left: 70, top: 1290, fontFamily: SANS, fontWeight: 800, fontSize: 48, color: COL.amber, opacity: ip(f, [wAt + 16, wAt + 26], [0, 1])}}>
        1 insert = {writes} writes
      </div>
    </AbsoluteFill>
  );
};

/* EXPLAIN: before and after */
const Explain: React.FC<{f: number}> = ({f}) => {
  const o = ip(f, [S.explain, S.explain + 12, S.recap - 6, S.recap], [0, 1, 1, 0]);
  if (o <= 0) return null;
  const type = (s: string, at: number, cps = 1.6) => s.slice(0, Math.max(0, Math.floor((f - at) * cps)));
  const q1 = "EXPLAIN SELECT * FROM users WHERE email = 'zoe@mail.com';";
  const q2 = 'CREATE INDEX ON users (email);';
  const t1 = A.runExplain - 4;
  const r1 = A.scans;
  const t2 = r1 + 22;
  const r2 = t2 + Math.ceil(q2.length / 2.2) + 4;
  const line = (txt: React.ReactNode, c = COL.ink) => <div style={{fontFamily: MONO, fontSize: 24, lineHeight: 1.55, color: c, whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>{txt}</div>;
  return (
    <AbsoluteFill style={{opacity: o}}>
      <div style={{position: 'absolute', left: 70, right: 150, top: 600, borderRadius: 18, background: '#0b0f15', border: '2px solid #2c3c52', overflow: 'hidden'}}>
        <div style={{height: 44, background: '#152132', display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px'}}>
          {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
            <span key={c} style={{width: 12, height: 12, borderRadius: 6, background: c}} />
          ))}
          <span style={{marginLeft: 10, fontFamily: MONO, fontSize: 19, color: COL.dim}}>psql · shop</span>
        </div>
        <div style={{padding: '18px 22px', minHeight: 560}}>
          {line(<>{'> '}{type(q1, t1)}</>)}
          {f >= r1 ? line('  Seq Scan on users', COL.bad) : null}
          {f >= r1 + 4 ? line('  → reads every row', COL.dim) : null}
          {f >= t2 ? line(<>{'\n> '}{type(q2, t2, 2.2)}</>, COL.amber) : null}
          {f >= r2 ? line(<>{'\n> '}EXPLAIN SELECT … WHERE email = 'zoe@mail.com';</>) : null}
          {f >= r2 + 6 ? line('  Index Scan using users_email_idx', COL.ok) : null}
          {f >= r2 + 10 ? line('  → jumps straight to the row', COL.dim) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ───────── recap ───────── */
const Recap: React.FC<{f: number}> = ({f}) => {
  if (f < S.recap || f >= S.share) return null;
  const items = [
    ['Full table scan', 'no index = check every row'],
    ['Index', 'a sorted copy of a column, with pointers'],
    ['B-tree', '1M rows in about 4 hops'],
    ['Not free', 'every write updates every index'],
  ];
  return (
    <div style={{position: 'absolute', left: 70, right: 150, top: 250, opacity: ip(f, [S.share - 8, S.share], [1, 0])}}>
      <div style={{fontFamily: MONO, fontWeight: 600, fontSize: 27, letterSpacing: 3, color: COL.amber, opacity: ip(f, [S.recap, S.recap + 8], [0, 1])}}>RECAP</div>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 76, lineHeight: 1.08, letterSpacing: -2, color: COL.ink, marginTop: 18, opacity: ip(f, [S.recap + 4, S.recap + 14], [0, 1])}}>Database indexes,</div>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 76, lineHeight: 1.08, letterSpacing: -2, color: COL.ink, opacity: ip(f, [S.recap + 8, S.recap + 18], [0, 1])}}>in 4 lines.</div>
      <div style={{marginTop: 70}}>
        {items.map(([a, b], i) => {
          const p = ip(f, [S.recap + 24 + i * 14, S.recap + 36 + i * 14], [0, 1]);
          return (
            <div key={i} style={{display: 'flex', gap: 28, alignItems: 'flex-start', marginBottom: 46, opacity: p, translate: `${(1 - p) * -30}px 0`}}>
              <div style={{width: 54, height: 54, borderRadius: 14, border: `3px solid ${COL.ok}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none'}}>
                <svg width={28} height={28} viewBox="0 0 24 24">
                  <path d="M4 12.5l5 5L20 6.5" fill="none" stroke={COL.ok} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 46, color: COL.ink, letterSpacing: -0.5}}>{a}</div>
                <div style={{fontFamily: MONO, fontSize: 29, color: COL.dim, marginTop: 6}}>{b}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{marginTop: 40, display: 'inline-block', padding: '20px 34px', borderRadius: 999, background: COL.amber, color: '#1a1406', fontFamily: SANS, fontWeight: 700, fontSize: 36, opacity: ip(f, [S.recap + 96, S.recap + 106], [0, 1]), scale: String(ip(f, [S.recap + 96, S.recap + 106], [0.85, 1], Easing.bezier(0.2, 1.5, 0.4, 1)) * (1 + 0.04 * Math.max(0, Math.sin((f - S.recap - 106) / 9))))}}>
        Follow for more
      </div>
      <div style={{marginTop: 22, fontFamily: MONO, fontSize: 29, color: COL.dim, opacity: ip(f, [S.recap + 104, S.recap + 114], [0, 1])}}>Be an expert in anything tech, in under 1 minute.</div>
    </div>
  );
};

export const Explainer: React.FC = () => {
  const f = useCurrentFrame();
  const scanO = ip(f, [S.index - 8, S.index], [1, 0]);
  const breathe = 1.0 + 0.012 * Math.sin((f / 90) * Math.PI);
  return (
    <AbsoluteFill style={{background: COL.bg}}>
      <AbsoluteFill style={{backgroundImage: 'radial-gradient(rgba(140,160,190,0.10) 1.5px, transparent 1.5px)', backgroundSize: '36px 36px', backgroundPosition: `0 ${-f * 0.4}px`}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 60% at 50% 55%, rgba(61,220,132,0.05), rgba(0,0,0,0) 70%)'}} />
      <AbsoluteFill style={{scale: String(breathe), transformOrigin: '540px 960px'}}>
        {scanO > 0 ? (
          <AbsoluteFill style={{opacity: scanO}}>
            <QueryBar f={f} o={1} />
            <Table f={f} x={70} y={590} w={490} mode="scan" />
            <ScanStats f={f} />
          </AbsoluteFill>
        ) : null}
        <IndexScene f={f} />
        <BTree f={f} />
        <Cost f={f} />
        <Explain f={f} />
      </AbsoluteFill>
      {COPY.map((c, i) => (
        <Headline key={i} f={f} c={c} />
      ))}
      <Recap f={f} />
      <ShareOutro f={f} at={S.share} until={S.total} topic="database indexes" accent={COL.amber} ink={COL.ink} dim={COL.dim} sans={SANS} mono={MONO} />
      <Progress f={f} />
      <Captions f={f} lines={CAPS} accent={COL.amber} />
    </AbsoluteFill>
  );
};
