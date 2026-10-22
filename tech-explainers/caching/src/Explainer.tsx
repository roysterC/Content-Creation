import React from 'react';
import {AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {COL, dbBusy, hitRate, L, NODE, PRICE_CHANGE, priceInDb, PT, Req, REQS, S, slotsAt} from './sim';

for (const w of ['400', '500', '600', '800']) loadFont({family: 'Inter', url: staticFile(`inter-${w}.woff2`), weight: w});
for (const w of ['400', '600']) loadFont({family: 'Plex Mono', url: staticFile(`mono-${w}.woff2`), weight: w});
const SANS = 'Inter, sans-serif';
const MONO = '"Plex Mono", monospace';

const ease = Easing.bezier(0.25, 0.1, 0.25, 1);
const ip = (f: number, i: number[], o: number[], e = ease) => interpolate(f, i, o, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: e});
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const fmt = (ms: number) => `${Math.round(ms).toLocaleString('en-GB')} ms`;

/* ───────── copy ───────── */
type Copy = {at: number; until: number; kicker: string; head: string[]; sub: string; kColor?: string};
const COPY: Copy[] = [
  {at: S.hook, until: S.series, kicker: 'CACHING · EXPLAINED', head: ['POV: your homepage', 'takes 4 seconds.'], sub: 'Every request crawls to the database.', kColor: COL.miss},
  {at: S.series, until: S.fix, kicker: 'EXPERT IN UNDER 1 MINUTE', head: ['Caching,', 'expert level.'], sub: 'Let’s make it fast.', kColor: COL.db},
  {at: S.fix, until: S.hitrate, kicker: '01 · THE CACHE', head: ['Save the answer.', 'Serve it again.'], sub: 'Miss: go to the database. Hit: answer instantly.', kColor: COL.cache},
  {at: S.hitrate, until: S.ttl, kicker: '02 · HIT RATE', head: ['Warm cache,', 'quiet database.'], sub: 'Most requests never touch the DB.', kColor: COL.hit},
  {at: S.ttl, until: S.lru, kicker: '03 · TTL', head: ['Every item has', 'a time to live.'], sub: 'When it expires, the next request gets fresh data.', kColor: COL.db},
  {at: S.lru, until: S.layers, kicker: '04 · EVICTION (LRU)', head: ['Cache full?', 'Drop the least recent.'], sub: 'Least recently used goes first.', kColor: COL.miss},
  {at: S.layers, until: S.recap, kicker: '05 · CACHE LAYERS', head: ['Check the fastest', 'cache first.'], sub: 'Browser → CDN → Redis → database.', kColor: COL.req},
];

const Headline: React.FC<{f: number; c: Copy}> = ({f, c}) => {
  if (f < c.at - 1 || f >= c.until) return null;
  const out = ip(f, [c.until - 8, c.until], [1, 0]);
  return (
    <div style={{position: 'absolute', left: 70, right: 120, top: 250, opacity: out}}>
      <div style={{fontFamily: MONO, fontWeight: 600, fontSize: 27, letterSpacing: 3, color: c.kColor ?? COL.db, opacity: c.at === 0 ? 1 : ip(f, [c.at, c.at + 8], [0, 1])}}>{c.kicker}</div>
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
const Sub: React.FC<{f: number; c: Copy}> = ({f, c}) => {
  if (f < c.at || f >= c.until) return null;
  const o = c.at === 0 ? ip(f, [c.until - 8, c.until], [1, 0]) : ip(f, [c.at + 18, c.at + 28, c.until - 8, c.until], [0, 1, 1, 0]);
  return <div style={{position: 'absolute', left: 70, right: 150, top: 1450, fontFamily: MONO, fontSize: 31, lineHeight: 1.35, color: COL.dim, opacity: o}}>{c.sub}</div>;
};

const Progress: React.FC<{f: number}> = ({f}) => {
  const marks = [S.fix, S.hitrate, S.ttl, S.lru, S.layers, S.recap];
  return (
    <div style={{position: 'absolute', left: 70, right: 150, top: 232, height: 4, display: 'flex', gap: 8}}>
      {marks.map((m, i) => (
        <div key={i} style={{flex: 1, borderRadius: 2, background: '#1c2838', overflow: 'hidden'}}>
          <div style={{width: `${ip(f, [m, marks[i + 1] ?? S.total], [0, 100], Easing.linear)}%`, height: '100%', background: COL.db}} />
        </div>
      ))}
    </div>
  );
};

/* ───────── what the browser shows ───────── */
const featured = (f: number): {r: Req; live: boolean} | null => {
  const started = REQS.filter((r) => r.start <= f);
  if (!started.length) return null;
  const done = started.filter((r) => r.tDone <= f);
  if (f < S.hitrate) {
    const flying = started.filter((r) => r.tDone > f).sort((a, b) => a.start - b.start);
    // while the slow first miss is in flight in the fix scene, follow it
    if (flying.length && (f < S.fix || flying[0].kind === 'miss')) return {r: flying[0], live: true};
  }
  if (done.length) return {r: done.sort((a, b) => a.tDone - b.tDone)[done.length - 1], live: false};
  return null;
};

const Browser: React.FC<{f: number}> = ({f}) => {
  const {x, y, w, h} = NODE.browser;
  const ft = featured(f);
  let ms = 0;
  let color = COL.dim;
  if (ft) {
    ms = ft.live ? (ft.r.ms * (f - ft.r.start)) / (ft.r.tDone - ft.r.start) : ft.r.ms;
    color = ft.live ? (ms > 1500 ? COL.miss : COL.db) : ft.r.kind === 'hit' ? COL.hit : COL.miss;
  }
  const justDone = ft && !ft.live ? ip(f - ft.r.tDone, [0, 3, 10], [1, 1.12, 1]) : 1;
  const log = REQS.filter((r) => r.tDone <= f && r.start >= S.fix).sort((a, b) => b.tDone - a.tDone).slice(0, 3);
  const visitors = Math.round(ip(f, [40, S.series + 40], [1240, 486], Easing.bezier(0.4, 0, 0.6, 1)));
  const spin = ft?.live ? (f * 18) % 360 : 0;
  return (
    <div style={{position: 'absolute', left: x - w / 2, top: y - h / 2, width: w, height: h, borderRadius: 20, background: '#0f1621', border: '2px solid #2c3c52', overflow: 'hidden'}}>
      <div style={{height: 46, background: '#152132', display: 'flex', alignItems: 'center', gap: 10, padding: '0 18px'}}>
        {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
          <span key={c} style={{width: 13, height: 13, borderRadius: 7, background: c, opacity: 0.85}} />
        ))}
        <div style={{marginLeft: 12, flex: 1, height: 28, borderRadius: 8, background: '#0a0e14', fontFamily: MONO, fontSize: 19, color: COL.dim, display: 'flex', alignItems: 'center', padding: '0 12px'}}>
          shop.com/{ft?.r.key === 'home' || !ft ? '' : ft.r.key}
        </div>
        {f < S.fix ? <span style={{fontFamily: MONO, fontWeight: 600, fontSize: 21, color: COL.miss, marginLeft: 10}}>↓ {visitors.toLocaleString('en-GB')} online</span> : null}
      </div>
      <div style={{display: 'flex', padding: '20px 26px', gap: 24}}>
        <div style={{width: 300}}>
          <div style={{fontFamily: MONO, fontSize: 20, color: COL.dim, letterSpacing: 2, display: 'flex', alignItems: 'center', gap: 10}}>
            {ft?.live ? (
              <svg width={20} height={20} viewBox="0 0 20 20" style={{rotate: `${spin}deg`}}>
                <circle cx={10} cy={10} r={7} fill="none" stroke={COL.dim} strokeWidth={3} strokeDasharray="30 14" />
              </svg>
            ) : null}
            {ft?.live ? 'LOADING' : 'LOADED IN'}
          </div>
          <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 66, letterSpacing: -2, color, fontVariantNumeric: 'tabular-nums', scale: String(justDone), transformOrigin: 'left center', marginTop: 4}}>{ft ? fmt(ms) : '—'}</div>
        </div>
        <div style={{flex: 1, fontFamily: MONO, fontSize: 20, lineHeight: 1.75, paddingTop: 4}}>
          {log.map((r, i) => (
            <div key={r.id} style={{display: 'flex', gap: 12, opacity: 1 - i * 0.28, whiteSpace: 'nowrap'}}>
              <span style={{color: COL.ink, width: 112, overflow: 'hidden'}}>/{r.key}</span>
              <span style={{color: r.kind === 'hit' ? COL.hit : COL.miss, width: 52}}>{r.kind === 'hit' ? 'HIT' : 'MISS'}</span>
              <span style={{color: r.stale ? COL.miss : COL.dim}}>{r.value ? `${r.value}${r.stale ? ' STALE' : ''}` : fmt(r.ms)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ───────── the diagram ───────── */
const cacheVis = (f: number) => ip(f, [S.fix + 22, S.fix + 36], [0, 1]);
const cacheDrop = (f: number) => (1 - ip(f, [S.fix + 22, S.fix + 40], [0, 1], Easing.bezier(0.2, 1.4, 0.4, 1))) * -80;

const App: React.FC<{f: number}> = ({f}) => {
  const {x, y, w, h} = NODE.app;
  const busy = REQS.some((r) => f >= r.start + L.BA - 2 && f < r.start + L.BA + 3);
  return (
    <g>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={18} fill="#0f1621" stroke={busy ? COL.req : '#2c3c52'} strokeWidth={busy ? 3 : 2} />
      <text x={x} y={y + 9} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={26} fill={COL.ink} letterSpacing={2}>
        APP SERVER
      </text>
    </g>
  );
};

const Database: React.FC<{f: number}> = ({f}) => {
  const {x, y, w, h} = NODE.db;
  const busy = dbBusy(f);
  const load = Math.min(1, busy / 3);
  const top = y - h / 2;
  const rx = w / 2;
  const ry = 24;
  const hot = busy > 0;
  const stroke = hot ? COL.db : '#2c3c52';
  const showPrice = f >= S.ttl - 4 && f < S.lru;
  const changed = ip(f, [PRICE_CHANGE, PRICE_CHANGE + 4, PRICE_CHANGE + 24], [0, 1, 0]);
  return (
    <g>
      <path d={`M ${x - rx} ${top} L ${x - rx} ${top + h - ry} A ${rx} ${ry} 0 0 0 ${x + rx} ${top + h - ry} L ${x + rx} ${top}`} fill="#0f1621" stroke={stroke} strokeWidth={hot ? 3 : 2} />
      <ellipse cx={x} cy={top} rx={rx} ry={ry} fill="#152132" stroke={stroke} strokeWidth={hot ? 3 : 2} />
      {[0.33, 0.62].map((k) => (
        <path key={k} d={`M ${x - rx} ${top + h * k} A ${rx} ${ry} 0 0 0 ${x + rx} ${top + h * k}`} fill="none" stroke="#223044" strokeWidth={2} />
      ))}
      <text x={x} y={top + 70} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={24} fill={COL.ink} letterSpacing={2}>
        DATABASE
      </text>
      {hot ? (
        <g transform={`translate(${x} ${top + 118}) rotate(${(f * 9) % 360})`}>
          <circle r={14} fill="none" stroke={COL.db} strokeWidth={4} strokeDasharray="44 44" />
        </g>
      ) : (
        <text x={x} y={top + 126} textAnchor="middle" fontFamily={MONO} fontSize={21} fill={COL.dim}>
          idle
        </text>
      )}
      {showPrice ? (
        <g opacity={ip(f, [S.ttl - 4, S.ttl + 6], [0, 1])}>
          <rect x={x - 95} y={top + 150} width={190} height={36} rx={8} fill={COL.db} opacity={0.1 + 0.4 * changed} />
          <text x={x} y={top + 175} textAnchor="middle" fontFamily={MONO} fontSize={22} fill={COL.db}>
            price = {priceInDb(f)}
          </text>
        </g>
      ) : null}
      <text x={x - rx + 18} y={top + h - 38} fontFamily={MONO} fontSize={19} fill={COL.dim}>
        load
      </text>
      <rect x={x - rx + 74} y={top + h - 52} width={w - 100} height={14} rx={7} fill="#152132" />
      <rect x={x - rx + 74} y={top + h - 52} width={(w - 100) * load} height={14} rx={7} fill={load > 0.6 ? COL.miss : COL.db} />
    </g>
  );
};

const Cache: React.FC<{f: number}> = ({f}) => {
  const o = cacheVis(f);
  if (o <= 0) return null;
  const {x, y, w, h} = NODE.cache;
  const dy = cacheDrop(f);
  const x0 = x - w / 2;
  const y0 = y - h / 2 + dy;
  const slots = slotsAt(f);
  const used = slots.filter((s) => s && s.ttlEnd > f).length;
  const sw = (w - 44) / 2;
  const sh = 42;
  const showTtl = f >= S.ttl + 40;
  const lruScene = f >= S.lru + 8 && f < S.layers;
  let lruIdx = -1;
  if (lruScene && used === 8) {
    let best = Infinity;
    slots.forEach((s, i) => {
      if (s && s.lastUsed < best) {
        best = s.lastUsed;
        lruIdx = i;
      }
    });
  }
  const full = used === 8 && f >= S.lru;
  return (
    <g opacity={o}>
      <rect x={x0} y={y0} width={w} height={h} rx={20} fill="#170d14" stroke={COL.cache} strokeWidth={3} />
      <text x={x0 + 20} y={y0 + 36} fontFamily={MONO} fontWeight={600} fontSize={23} fill={COL.cache} letterSpacing={2}>
        CACHE · REDIS
      </text>
      <text x={x0 + w - 20} y={y0 + 36} textAnchor="end" fontFamily={MONO} fontSize={21} fill={full ? COL.miss : COL.dim}>
        {full ? 'FULL ' : ''}
        {used}/8
      </text>
      {slots.map((s, i) => {
        const cx = x0 + 16 + (i % 2) * (sw + 12);
        const cy = y0 + 54 + Math.floor(i / 2) * (sh + 9);
        if (!s) return <rect key={i} x={cx} y={cy} width={sw} height={sh} rx={8} fill="none" stroke="#3a2232" strokeWidth={1.5} strokeDasharray="5 6" />;
        const expired = s.ttlEnd <= f;
        const fresh = ip(f - s.at, [0, 12], [1, 0]);
        const hitFlash = REQS.some((r) => r.kind === 'hit' && r.key === s.key && f >= r.tCheck && f < r.tCheck + 10);
        const ttlFrac = expired ? 0 : Math.max(0, Math.min(1, (s.ttlEnd - f) / (s.key === 'price' && s.ttlEnd < 3000 ? s.ttlEnd - s.at : 1500)));
        const evict = s.evictedKey && s.evictedAt !== undefined ? ip(f - s.evictedAt, [0, 16], [1, 0]) : 0;
        return (
          <g key={i}>
            <rect x={cx} y={cy} width={sw} height={sh} rx={8} fill={expired ? '#14161a' : '#241321'} stroke={hitFlash ? COL.hit : expired ? '#4a4f58' : COL.cache} strokeWidth={hitFlash ? 3 : 1.5} strokeDasharray={expired ? '5 6' : undefined} opacity={1 - 0.6 * evict} />
            <rect x={cx} y={cy} width={sw} height={sh} rx={8} fill={COL.cache} opacity={fresh * 0.45} />
            <text x={cx + 12} y={cy + 28} fontFamily={MONO} fontSize={20} fill={expired ? '#6b7280' : COL.ink} opacity={1 - evict}>
              {s.key}
              {s.value && !expired ? ` ${s.value}` : ''}
            </text>
            {expired ? (
              <text x={cx + sw - 10} y={cy + 28} textAnchor="end" fontFamily={MONO} fontSize={16} fill="#8b8f98">
                expired
              </text>
            ) : null}
            {showTtl && !expired ? <rect x={cx + 10} y={cy + sh - 8} width={(sw - 20) * ttlFrac} height={4} rx={2} fill={s.key === 'price' ? COL.db : '#7a4466'} /> : null}
            {evict > 0 ? (
              <text x={cx + 12 + (1 - evict) * 60} y={cy + 28} fontFamily={MONO} fontSize={20} fill={COL.miss} opacity={evict} textDecoration="line-through">
                {s.evictedKey}
              </text>
            ) : null}
            {i === lruIdx ? (
              <g transform={`translate(${cx + sw - 52} ${cy - 10})`}>
                <rect width={52} height={22} rx={6} fill={COL.miss} />
                <text x={26} y={16} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={15} fill="#1a0a0c">
                  LRU
                </text>
              </g>
            ) : null}
          </g>
        );
      })}
    </g>
  );
};

const Wires: React.FC<{f: number}> = ({f}) => (
  <g stroke="#223044" strokeWidth={3}>
    <line x1={PT.B.x} y1={PT.B.y} x2={PT.A.x} y2={NODE.app.y - NODE.app.h / 2} />
    <line x1={PT.A.x} y1={PT.A.y} x2={PT.D.x} y2={PT.D.y} />
    <line x1={PT.A.x} y1={PT.A.y} x2={PT.C.x} y2={PT.C.y + cacheDrop(f)} opacity={cacheVis(f)} />
  </g>
);

type Leg = {a: {x: number; y: number}; b: {x: number; y: number}; t0: number; t1: number; color: string; label?: string};
const legs = (r: Req, f: number): Leg[] => {
  const C = {x: PT.C.x, y: PT.C.y + cacheDrop(f)};
  const out: Leg[] = [];
  let t = r.start;
  const push = (a: Leg['a'], b: Leg['b'], d: number, color: string, label?: string) => {
    out.push({a, b, t0: t, t1: t + d, color, label});
    t += d;
  };
  const back = r.kind === 'hit' ? COL.hit : COL.db;
  push(PT.B, PT.A, L.BA, COL.req, `/${r.key}`);
  if (r.kind === 'db') {
    push(PT.A, PT.D, L.AD, COL.req);
  } else {
    push(PT.A, C, L.AC, COL.req);
    out.push({a: C, b: C, t0: t, t1: t + L.CHECK, color: r.kind === 'hit' ? COL.hit : COL.miss});
    t += L.CHECK;
    push(C, PT.A, L.CA, r.kind === 'hit' ? COL.hit : COL.miss);
    if (r.kind === 'miss') push(PT.A, PT.D, L.AD, COL.req);
  }
  if (r.kind !== 'hit') {
    t = r.tDbOut;
    push(PT.D, PT.A, L.DA, COL.db);
    if (r.kind === 'miss') out.push({a: PT.A, b: C, t0: t, t1: t + L.WRITE, color: COL.cache});
  }
  push(PT.A, PT.B, L.AB, back, r.value && r.kind !== 'db' ? r.value : undefined);
  return out;
};

const Packets: React.FC<{f: number}> = ({f}) => {
  const nodes: React.ReactNode[] = [];
  for (const r of REQS) {
    if (f < r.start - 1 || f > r.tDone + 16) continue;
    for (const [k, g] of legs(r, f).entries()) {
      if (f < g.t0 || f >= g.t1) continue;
      const t = ip(f, [g.t0, g.t1], [0, 1], Easing.bezier(0.4, 0, 0.6, 1));
      const px = lerp(g.a.x, g.b.x, t);
      const py = lerp(g.a.y, g.b.y, t);
      nodes.push(
        <g key={`${r.id}-${k}`}>
          <circle cx={px} cy={py} r={18} fill={g.color} opacity={0.16} />
          <circle cx={px} cy={py} r={9} fill={g.color} />
          {g.label && f >= S.fix ? (
            <g transform={`translate(${px + 16} ${py - 15})`}>
              <rect width={g.label.length * 13 + 18} height={30} rx={8} fill="#0f1621" stroke={g.color} strokeWidth={1.5} />
              <text x={9} y={21} fontFamily={MONO} fontSize={20} fill={g.color}>
                {g.label}
              </text>
            </g>
          ) : null}
        </g>,
      );
    }
    // HIT / MISS bubble at the cache
    if (r.kind !== 'db' && f >= r.tCheck && f < r.tCheck + 20) {
      const k = (f - r.tCheck) / 20;
      const hit = r.kind === 'hit';
      nodes.push(
        <g key={`b${r.id}`} transform={`translate(${PT.C.x - 170} ${PT.C.y + cacheDrop(f) - 62 - k * 36})`} opacity={ip(k, [0, 0.1, 0.7, 1], [0, 1, 1, 0])}>
          <rect width={hit ? 78 : 96} height={38} rx={10} fill={hit ? COL.hit : COL.miss} />
          <text x={hit ? 39 : 48} y={27} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={24} fill="#0a0e14">
            {hit ? 'HIT' : 'MISS'}
          </text>
        </g>,
      );
    }
  }
  return <g>{nodes}</g>;
};

const Gauges: React.FC<{f: number}> = ({f}) => {
  const o = ip(f, [S.hitrate, S.hitrate + 12, S.layers - 8, S.layers], [0, 1, 1, 0]);
  if (o <= 0) return null;
  const hr = hitRate(f);
  const load = Math.min(1, dbBusy(f) / 3);
  return (
    <g opacity={o} fontFamily={MONO}>
      <text x={70} y={912} fontSize={20} fill={COL.dim} letterSpacing={2}>
        HIT RATE
      </text>
      <text x={70} y={964} fontFamily={SANS} fontWeight={800} fontSize={50} fill={COL.hit}>
        {Math.round(hr * 100)}%
      </text>
      <text x={765} y={912} fontSize={20} fill={COL.dim} letterSpacing={2}>
        DB LOAD
      </text>
      <rect x={765} y={934} width={150} height={16} rx={8} fill="#152132" />
      <rect x={765} y={934} width={150 * load} height={16} rx={8} fill={load > 0.6 ? COL.miss : COL.db} />
    </g>
  );
};

/* ───────── cache layers ───────── */
const LAYERS = [
  {name: 'Browser cache', ms: '~0 ms', color: COL.hit},
  {name: 'CDN', ms: '~20 ms', color: COL.req},
  {name: 'Redis', ms: '~50 ms', color: COL.cache},
  {name: 'Database', ms: '400+ ms', color: COL.db},
];
const EXAMPLES = [
  {label: 'logo.png', at: 0},
  {label: '/home', at: 1},
  {label: '/cart', at: 2},
  {label: '/orders', at: 3},
];
const Layers: React.FC<{f: number}> = ({f}) => {
  const o = ip(f, [S.layers + 4, S.layers + 16, S.recap - 6, S.recap], [0, 1, 1, 0]);
  if (o <= 0) return null;
  const top = 640;
  const gap = 180;
  const card = {x: 110, w: 820, h: 130};
  const colX = (k: number) => 545 + k * 100;
  const out: React.ReactNode[] = [];
  EXAMPLES.forEach((e, k) => {
    const t0 = S.layers + 28 + k * 30;
    const down = 9;
    const legsDown = e.at + 1; // from the header to its layer
    const tHit = t0 + legsDown * down;
    const tBack = tHit + 6 + legsDown * 5;
    if (f < t0) return;
    const x = colX(k);
    const yOf = (i: number) => top + i * gap + card.h / 2; // -1 = header row
    let y: number;
    let col = COL.req;
    if (f < tHit) {
      const p = (f - t0) / down;
      const i = Math.floor(p);
      y = lerp(yOf(i - 1), yOf(i), ip(p - i, [0, 1], [0, 1], Easing.bezier(0.4, 0, 0.6, 1)));
    } else if (f < tHit + 6) {
      y = yOf(e.at);
      col = LAYERS[e.at].color;
    } else {
      y = lerp(yOf(e.at), yOf(-1), ip(f, [tHit + 6, tBack], [0, 1], Easing.bezier(0.4, 0, 0.6, 1)));
      col = COL.hit;
    }
    // misses on the layers it passed
    for (let i = 0; i < e.at; i++) {
      const tm = t0 + (i + 1) * down;
      if (f >= tm)
        out.push(
          <path key={`m${k}${i}`} d={`M ${x - 9} ${yOf(i) - 9} L ${x + 9} ${yOf(i) + 9} M ${x + 9} ${yOf(i) - 9} L ${x - 9} ${yOf(i) + 9}`} stroke={COL.miss} strokeWidth={4} strokeLinecap="round" opacity={0.85} />,
        );
    }
    if (f >= tHit)
      out.push(
        <g key={`h${k}`} transform={`translate(${x} ${yOf(e.at)})`} opacity={ip(f - tHit, [0, 3], [0, 1])}>
          <circle r={24} fill="none" stroke={LAYERS[e.at].color} strokeWidth={4} />
          <path d="M -10 1 L -3 8 L 11 -7" fill="none" stroke={LAYERS[e.at].color} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
        </g>,
      );
    if (f <= tBack)
      out.push(
        <g key={`p${k}`}>
          <circle cx={x} cy={y} r={18} fill={col} opacity={0.18} />
          <circle cx={x} cy={y} r={9} fill={col} />
        </g>,
      );
  });
  return (
    <AbsoluteFill style={{opacity: o}}>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        {EXAMPLES.map((e, k) => (
          <text key={k} x={colX(k)} y={top - 50} textAnchor="middle" fontFamily={MONO} fontSize={22} fill={COL.dim}>
            {e.label}
          </text>
        ))}
        <line x1={card.x + 40} y1={top - 30} x2={card.x + 40} y2={top + 3 * gap + card.h} stroke="#223044" strokeWidth={3} />
        {LAYERS.map((l, i) => {
          const y = top + i * gap;
          const p = ip(f, [S.layers + 8 + i * 5, S.layers + 20 + i * 5], [0, 1]);
          return (
            <g key={i} opacity={p} transform={`translate(${(1 - p) * -30} 0)`}>
              <rect x={card.x} y={y} width={card.w} height={card.h} rx={20} fill="#0f1621" stroke={l.color} strokeWidth={2.5} />
              <circle cx={card.x + 40} cy={y + card.h / 2} r={9} fill={l.color} />
              <text x={card.x + 76} y={y + 58} fontFamily={SANS} fontWeight={600} fontSize={40} fill={COL.ink}>
                {l.name}
              </text>
              <text x={card.x + 76} y={y + 98} fontFamily={MONO} fontSize={26} fill={l.color}>
                {l.ms}
              </text>
            </g>
          );
        })}
        {out}
      </svg>
    </AbsoluteFill>
  );
};

/* ───────── recap ───────── */
const Recap: React.FC<{f: number}> = ({f}) => {
  if (f < S.recap) return null;
  const items = [
    ['Keep answers close', 'a cache sits in front of the slow thing'],
    ['Hit = instant', 'miss = go to the database, then save it'],
    ['TTL', 'expire items so data stays fresh'],
    ['LRU', 'when full, drop the least recently used'],
  ];
  return (
    <div style={{position: 'absolute', left: 70, right: 150, top: 250}}>
      <div style={{fontFamily: MONO, fontWeight: 600, fontSize: 27, letterSpacing: 3, color: COL.db, opacity: ip(f, [S.recap, S.recap + 8], [0, 1])}}>RECAP</div>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 76, lineHeight: 1.08, letterSpacing: -2, color: COL.ink, marginTop: 18, opacity: ip(f, [S.recap + 4, S.recap + 14], [0, 1])}}>Caching,</div>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 76, lineHeight: 1.08, letterSpacing: -2, color: COL.ink, opacity: ip(f, [S.recap + 8, S.recap + 18], [0, 1])}}>in 4 lines.</div>
      <div style={{marginTop: 70}}>
        {items.map(([a, b], i) => {
          const p = ip(f, [S.recap + 24 + i * 14, S.recap + 36 + i * 14], [0, 1]);
          return (
            <div key={i} style={{display: 'flex', gap: 28, alignItems: 'flex-start', marginBottom: 46, opacity: p, translate: `${(1 - p) * -30}px 0`}}>
              <div style={{width: 54, height: 54, borderRadius: 14, border: `3px solid ${COL.hit}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none'}}>
                <svg width={28} height={28} viewBox="0 0 24 24">
                  <path d="M4 12.5l5 5L20 6.5" fill="none" stroke={COL.hit} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
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
      <div style={{marginTop: 40, display: 'inline-block', padding: '20px 34px', borderRadius: 999, background: COL.db, color: '#1a1406', fontFamily: SANS, fontWeight: 700, fontSize: 36, opacity: ip(f, [S.recap + 96, S.recap + 106], [0, 1]), scale: String(ip(f, [S.recap + 96, S.recap + 106], [0.85, 1], Easing.bezier(0.2, 1.5, 0.4, 1)))}}>
        Follow for more
      </div>
      <div style={{marginTop: 22, fontFamily: MONO, fontSize: 29, color: COL.dim, opacity: ip(f, [S.recap + 104, S.recap + 114], [0, 1])}}>Be an expert in anything tech, in under 1 minute.</div>
    </div>
  );
};

export const Explainer: React.FC = () => {
  const f = useCurrentFrame();
  const mainO = ip(f, [S.layers, S.layers + 12], [1, 0]);
  const breathe = 1.08 + 0.01 * Math.sin((f / 90) * Math.PI); // diagram scaled up for phone legibility
  return (
    <AbsoluteFill style={{background: COL.bg}}>
      <AbsoluteFill style={{backgroundImage: 'radial-gradient(rgba(140,160,190,0.10) 1.5px, transparent 1.5px)', backgroundSize: '36px 36px', backgroundPosition: `0 ${-f * 0.4}px`}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 60% at 50% 55%, rgba(255,111,177,0.05), rgba(0,0,0,0) 70%)'}} />
      {mainO > 0 ? (
        <AbsoluteFill style={{opacity: mainO, scale: String(breathe), transformOrigin: '540px 955px'}}>
          <svg width={1080} height={1920} style={{position: 'absolute'}}>
            <Wires f={f} />
            <App f={f} />
            <Database f={f} />
            <Cache f={f} />
            <Gauges f={f} />
            <Packets f={f} />
          </svg>
          <Browser f={f} />
        </AbsoluteFill>
      ) : null}
      <Layers f={f} />
      {COPY.map((c, i) => (
        <Headline key={i} f={f} c={c} />
      ))}
      {COPY.map((c, i) => (
        <Sub key={`s${i}`} f={f} c={c} />
      ))}
      <Recap f={f} />
      <Progress f={f} />
    </AbsoluteFill>
  );
};
