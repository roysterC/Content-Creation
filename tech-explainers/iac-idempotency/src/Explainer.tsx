import React from 'react';
import {AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {A, aliveAt, bashrcAt, COL, DESIRED, fileAt, NO_CHANGE_RUNS, OUT, PATH_LINE, PRICE, S, WORLDS, worldAt} from './sim';
import CAPS from './captions.json';
import {Captions} from '../../_shared/Captions';

for (const w of ['400', '500', '600', '800']) loadFont({family: 'Inter', url: staticFile(`inter-${w}.woff2`), weight: w});
for (const w of ['400', '600']) loadFont({family: 'Plex Mono', url: staticFile(`mono-${w}.woff2`), weight: w});
const SANS = 'Inter, sans-serif';
const MONO = '"Plex Mono", monospace';

const ease = Easing.bezier(0.25, 0.1, 0.25, 1);
const pop = Easing.bezier(0.2, 1.6, 0.4, 1);
const ip = (f: number, i: number[], o: number[], e = ease) => interpolate(f, i, o, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: e});

/* ───────── copy ───────── */
type Copy = {at: number; until: number; kicker: string; head: string[]; kColor?: string};
const COPY: Copy[] = [
  {at: S.hook, until: S.series, kicker: 'YOUR QUESTION · IaC + IDEMPOTENCY', head: ['POV: the 2am retry', 'doubled your servers.'], kColor: COL.bad},
  {at: S.series, until: S.script, kicker: 'EXPERT IN UNDER 1 MINUTE', head: ['Why IaC must', 'be idempotent.'], kColor: COL.amber},
  {at: S.script, until: S.declare, kicker: '01 · A PLAIN SCRIPT', head: ['Every run', 'does it all again.'], kColor: COL.bad},
  {at: S.declare, until: S.diff, kicker: '02 · DECLARE IT', head: ['What should exist,', 'not the steps.'], kColor: COL.req},
  {at: S.diff, until: S.why, kicker: '03 · DIFF, THEN APPLY', head: ['Only change', 'the difference.'], kColor: COL.ok},
  {at: S.why, until: S.drift, kicker: '04 · RE-RUNS WILL HAPPEN', head: ['So re-running', 'must be safe.'], kColor: COL.ok},
  {at: S.drift, until: S.catch, kicker: '05 · DRIFT', head: ['Deleted by hand?', 'Put back.'], kColor: COL.amber},
  {at: S.catch, until: S.payoff, kicker: '06 · THE CATCH', head: ['Raw shell tasks', 'run every time.'], kColor: COL.bad},
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
  const marks = [S.script, S.declare, S.diff, S.why, S.drift, S.catch, S.payoff];
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

const panel: React.CSSProperties = {position: 'absolute', left: 70, width: 860, borderRadius: 22, background: '#0d131c', border: '2px solid #223044', overflow: 'hidden'};
const LANG_COL: Record<string, string> = {sh: COL.amber, hcl: COL.violet, yaml: COL.pink};

/* ───────── the editor ───────── */
const tint = (line: string, lang: string) => {
  // a light syntax tint: strings, keys, comments
  const parts: React.ReactNode[] = [];
  const re = /("[^"]*"|#.*$|\b(resource|count|instance_type|name|shell|lineinfile|path|line|aws|ec2|run-instances)\b|--[a-z-]+)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(line))) {
    if (m.index > last) parts.push(<span key={k++}>{line.slice(last, m.index)}</span>);
    const t = m[0];
    const c = t.startsWith('"') ? COL.ok : t.startsWith('#') ? COL.dim : t.startsWith('--') ? COL.amber : LANG_COL[lang];
    parts.push(
      <span key={k++} style={{color: c}}>
        {t}
      </span>,
    );
    last = m.index + t.length;
  }
  parts.push(<span key={k++}>{line.slice(last)}</span>);
  return parts;
};
// the line the voice is talking about pulses: the raw shell append, as soon as it's named
const hiLine = (f: number, name: string, i: number) => {
  if (name === 'main.tf' && i === 1 && f >= A.exist - 16 && f < A.compares) {
    const p = 0.5 + 0.5 * Math.sin((f - A.exist) / 4);
    return `rgba(57,208,255,${(0.1 + 0.16 * p).toFixed(3)})`;
  }
  if (name !== 'site.yml' || f < A.shell - 4 || f >= A.guard - 4 || (i !== 1 && i !== 2)) return undefined;
  const p = 0.5 + 0.5 * Math.sin((f - A.shell) / 4);
  return `rgba(255,77,94,${(0.1 + 0.16 * p).toFixed(3)})`;
};
const Editor: React.FC<{f: number}> = ({f}) => {
  const file = fileAt(f);
  const o = ip(f, [S.payoff - 4, S.payoff + 8], [1, 0]);
  if (o <= 0) return null;
  const changed = Number.isFinite(file.at) ? ip(f, [file.at, file.at + 10], [0, 1]) : 1;
  return (
    <div style={{...panel, top: 520, height: 238, opacity: o}}>
      <div style={{height: 46, display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px', background: '#111925', borderBottom: '2px solid #1c2838'}}>
        {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
          <div key={c} style={{width: 13, height: 13, borderRadius: 7, background: c, opacity: 0.7}} />
        ))}
        <div style={{marginLeft: 12, fontFamily: MONO, fontWeight: 600, fontSize: 21, color: LANG_COL[file.lang]}}>{file.name}</div>
      </div>
      <div style={{padding: '14px 24px', opacity: file.at === -Infinity ? 1 : changed, translate: `0 ${(1 - changed) * 10}px`}}>
        {file.lines.map((l, i) => (
          <div key={i} style={{fontFamily: MONO, fontSize: 24, lineHeight: '42px', color: COL.ink, whiteSpace: 'pre', borderRadius: 6, margin: '0 -10px', padding: '0 10px', background: hiLine(f, file.name, i)}}>
            {tint(l, file.lang)}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ───────── the terminal: the last three lines of output ───────── */
const OUT_COL = {ok: COL.ok, bad: COL.bad, amber: COL.amber, dim: COL.dim, cmd: COL.ink};
const Terminal: React.FC<{f: number}> = ({f}) => {
  const o = ip(f, [S.payoff - 4, S.payoff + 8], [1, 0]);
  if (o <= 0) return null;
  const shown = OUT.filter((x) => x.at <= f).slice(-3);
  const newest = shown[shown.length - 1];
  const slide = newest ? ip(f, [newest.at, newest.at + 6], [1, 0]) : 0;
  return (
    <div style={{...panel, top: 776, height: 150, background: '#080c12', opacity: o, padding: '14px 22px'}}>
      <div style={{translate: `0 ${slide * 40}px`}}>
        {shown.map((x, i) => (
          <div key={x.at + x.t} style={{fontFamily: MONO, fontSize: 21, lineHeight: '40px', color: OUT_COL[x.c ?? 'cmd'], whiteSpace: 'pre', opacity: i === shown.length - 1 ? 1 - slide : 0.85}}>
            {x.t}
            {i === shown.length - 1 && Math.floor(f / 15) % 2 === 0 ? <span style={{color: COL.dim}}> ▍</span> : null}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ───────── the cloud account ───────── */
const TILE = {w: 186, h: 88, gap: 16};
const Tile: React.FC<{f: number; i: number; name: string; born: number; dies: number; dup: boolean; worldEnd: number}> = ({f, i, name, born, dies, dup, worldEnd}) => {
  const x = (i % 4) * (TILE.w + TILE.gap);
  const y = Math.floor(i / 4) * (TILE.h + TILE.gap);
  const p = born < -100 ? 1 : ip(f, [born, born + 8], [0, 1], pop);
  const gone = dies !== Infinity ? ip(f, [dies - 6, dies], [1, 0]) : 1;
  const reset = ip(f, [worldEnd - 10, worldEnd], [1, 0]);
  const col = dup ? COL.bad : COL.ok;
  const fresh = born > -100 ? ip(f, [born, born + 24], [1, 0]) : 0;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: TILE.w, height: TILE.h, borderRadius: 16, background: dup ? '#1a0d10' : '#0f1a14', border: `2.5px solid ${col}`, opacity: Math.min(gone, reset), scale: String(0.6 + 0.4 * p), boxShadow: `0 0 ${30 * fresh}px ${col}`}}>
      <svg width={40} height={40} viewBox="0 0 24 24" style={{position: 'absolute', left: 16, top: 24}}>
        <rect x={3} y={4} width={18} height={6} rx={1.5} fill="none" stroke={col} strokeWidth={1.8} />
        <rect x={3} y={14} width={18} height={6} rx={1.5} fill="none" stroke={col} strokeWidth={1.8} />
        <circle cx={7} cy={7} r={1.2} fill={col} />
        <circle cx={7} cy={17} r={1.2} fill={col} />
      </svg>
      <div style={{position: 'absolute', left: 66, top: 14, fontFamily: MONO, fontWeight: 600, fontSize: 22, color: COL.ink}}>{name}</div>
      <div style={{position: 'absolute', left: 66, top: 46, fontFamily: MONO, fontSize: 18, color: dup ? COL.bad : COL.dim}}>{dup ? 'duplicate' : `£${PRICE}/mo`}</div>
    </div>
  );
};
const Cloud: React.FC<{f: number}> = ({f}) => {
  const o = ip(f, [S.catch - 8, S.catch + 4], [1, 0]);
  if (o <= 0) return null;
  const wi = worldAt(f);
  const w = WORLDS[wi];
  if (!w) return null;
  const alive = aliveAt(f);
  const n = alive.length;
  const bill = n * PRICE;
  const over = n > DESIRED;
  // stable tile slots: web-2 comes back into its old slot
  const slots: {s: (typeof w.servers)[number]; i: number}[] = [];
  w.servers.forEach((s, k) => {
    const slot = wi === 2 && k === 3 ? 1 : k;
    slots.push({s, i: slot});
  });
  const tfWorld = wi === 2;
  const ghosts = tfWorld ? ip(f, [A.exist - 4, A.exist + 10], [0, 1]) : 0;
  const pulse = NO_CHANGE_RUNS.reduce((m, at) => Math.max(m, f >= at && f < at + 16 ? 1 - (f - at) / 16 : 0), 0);
  return (
    <div style={{...panel, top: 956, height: 450, opacity: o, border: `2px solid ${pulse > 0 ? COL.ok : '#223044'}`, boxShadow: pulse > 0 ? `0 0 ${40 * pulse}px rgba(61,220,132,0.35)` : undefined}}>
      <div style={{height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: '2px solid #1c2838'}}>
        <div style={{fontFamily: MONO, fontWeight: 600, fontSize: 21, letterSpacing: 1, color: COL.dim}}>CLOUD · eu-west-2</div>
        <div style={{display: 'flex', gap: 26, fontFamily: MONO, fontWeight: 600, fontSize: 25}}>
          <span style={{color: over ? COL.bad : COL.ink}}>
            servers <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 34}}>{n}</span>
          </span>
          <span style={{color: over ? COL.bad : COL.ink}}>
            <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 34}}>£{bill}</span>/mo
          </span>
        </div>
      </div>
      <div style={{position: 'absolute', left: 24, top: 86, width: 4 * TILE.w + 3 * TILE.gap, height: 3 * TILE.h + 2 * TILE.gap}}>
        {/* desired state: three dashed outlines */}
        {ghosts > 0
          ? [0, 1, 2].map((i) => (
              <div key={`g${i}`} style={{position: 'absolute', left: i * (TILE.w + TILE.gap), top: 0, width: TILE.w, height: TILE.h, borderRadius: 16, border: `2.5px dashed ${COL.req}`, opacity: ghosts * 0.8}}>
                <div style={{position: 'absolute', left: 0, right: 0, bottom: -30, textAlign: 'center', fontFamily: MONO, fontSize: 18, color: COL.req}}>desired</div>
              </div>
            ))
          : null}
        {slots.map(({s, i}, k) => (f >= s.born && f < s.dies ? <Tile key={k} f={f} i={i} name={s.name} born={s.born} dies={s.dies} dup={s.dup} worldEnd={w.to} /> : null))}
        {/* drift: the hand-deleted server */}
        {tfWorld && f >= A.deletes - 4 && f < A.back ? (
          <div style={{position: 'absolute', left: TILE.w + TILE.gap, top: 0, width: TILE.w, height: TILE.h, borderRadius: 16, border: `2.5px dashed ${COL.bad}`, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: ip(f, [A.deletes - 4, A.deletes + 4], [0, 1])}}>
            <span style={{fontFamily: MONO, fontWeight: 600, fontSize: 20, color: COL.bad}}>deleted by hand</span>
          </div>
        ) : null}
      </div>
      {over && wi !== 2 ? (
        <div style={{position: 'absolute', left: 24, right: 24, bottom: 22, fontFamily: MONO, fontSize: 22, color: COL.bad}}>wanted {DESIRED} · paying for {n}</div>
      ) : null}
      {tfWorld && f >= A.noChanges ? (
        <div style={{position: 'absolute', left: 24, right: 24, bottom: 22, fontFamily: MONO, fontSize: 22, color: COL.ok, opacity: ip(f, [A.noChanges, A.noChanges + 8], [0, 1])}}>
          desired {DESIRED} · actual {n}{n === DESIRED ? ' ✓' : ''}
        </div>
      ) : null}
    </div>
  );
};

/* ───────── ~/.bashrc in the Ansible beat ───────── */
const Bashrc: React.FC<{f: number}> = ({f}) => {
  const o = ip(f, [S.catch - 2, S.catch + 10, S.payoff - 4, S.payoff + 8], [0, 1, 1, 0]);
  if (o <= 0) return null;
  const b = bashrcAt(f);
  const swap = ip(f, [A.guard - 4, A.guard + 4], [0, 1]);
  const base = ["# ~/.bashrc", "alias ll='ls -la'", "export EDITOR=vim"];
  return (
    <div style={{...panel, top: 956, height: 450, opacity: o}}>
      <div style={{height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: '2px solid #1c2838'}}>
        <div style={{fontFamily: MONO, fontWeight: 600, fontSize: 21, letterSpacing: 1, color: COL.dim}}>
          ~/.bashrc on <span style={{color: b.guarded ? COL.ok : COL.ink}}>{b.host}</span>
          {b.guarded ? <span style={{color: COL.ok}}> (fresh server)</span> : null}
        </div>
        <div style={{fontFamily: MONO, fontWeight: 600, fontSize: 25, color: b.copies > 1 ? COL.bad : COL.ok}}>
          copies <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 34}}>{b.copies}</span>
        </div>
      </div>
      <div style={{padding: '18px 26px', opacity: b.guarded ? swap : 1}}>
        {base.map((l) => (
          <div key={l} style={{fontFamily: MONO, fontSize: 23, lineHeight: '46px', color: COL.dim, whiteSpace: 'pre'}}>
            {l}
          </div>
        ))}
        {Array.from({length: b.copies}).map((_, i) => {
          const dup = i > 0;
          return (
            <div key={i} style={{fontFamily: MONO, fontSize: 23, lineHeight: '46px', color: dup ? COL.bad : b.guarded ? COL.ok : COL.amber, whiteSpace: 'pre', display: 'flex', justifyContent: 'space-between', borderRadius: 8, background: dup ? 'rgba(255,77,94,0.1)' : undefined, padding: '0 8px', marginLeft: -8}}>
              <span>{PATH_LINE}</span>
              {dup ? <span style={{fontWeight: 600}}>duplicate ×{i + 1}</span> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ───────── recap: 4 lines (no follow/share; it loops back to the hook) ───────── */
const RECAP = [
  ['Declare the end state', 'what should exist, not the steps'],
  ['Diff, then change only that', 'already there? “No changes.”'],
  ['Re-runs are guaranteed', 'CI retries, teammates, crashes'],
  ['Guard the escape hatches', 'raw shell tasks run every time'],
];
const RECAP_COL = [COL.req, COL.ok, COL.amber, COL.pink];
const Recap: React.FC<{f: number}> = ({f}) => {
  const r = S.payoff;
  if (f < r) return null;
  return (
    <div style={{position: 'absolute', left: 70, right: 150, top: 250, scale: String(1 + 0.02 * ip(f, [r, S.total], [0, 1], Easing.linear)), transformOrigin: '0 0'}}>
      <div style={{fontFamily: MONO, fontWeight: 600, fontSize: 27, letterSpacing: 3, color: COL.amber, opacity: ip(f, [r, r + 8], [0, 1])}}>RECAP</div>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 76, lineHeight: 1.08, letterSpacing: -2, color: COL.ink, marginTop: 18, opacity: ip(f, [r + 4, r + 14], [0, 1])}}>Idempotent IaC,</div>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 76, lineHeight: 1.08, letterSpacing: -2, color: COL.ink, opacity: ip(f, [r + 8, r + 18], [0, 1])}}>in 4 lines.</div>
      <div style={{marginTop: 110}}>
        {RECAP.map(([a, b], i) => {
          const p = ip(f, [r + 22 + i * 14, r + 34 + i * 14], [0, 1]);
          const col = RECAP_COL[i];
          const g = f >= r + 80 ? Math.max(0, 1 - Math.abs(((f - r - 80) / 22) % 4 - i)) : 0;
          return (
            <div key={i} style={{display: 'flex', gap: 28, alignItems: 'flex-start', marginBottom: 74, opacity: p, translate: `${(1 - p) * -30}px 0`}}>
              <div style={{width: 54, height: 54, borderRadius: 14, border: `3px solid ${col}`, background: `${col}${Math.round(g * 60).toString(16).padStart(2, '0')}`, boxShadow: `0 0 ${24 * g}px ${col}`, scale: String(1 + 0.08 * g), display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none'}}>
                <svg width={28} height={28} viewBox="0 0 24 24">
                  <path d="M4 12.5l5 5L20 6.5" fill="none" stroke={col} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
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
    </div>
  );
};

const LOOP = 14;
export const Explainer: React.FC<{captions?: boolean}> = ({captions = false}) => {
  const f = useCurrentFrame();
  const loop = ip(f, [S.total - LOOP, S.total - 1], [0, 1]);
  return (
    <AbsoluteFill>
      <Frame f={f} captions={captions} />
      {loop > 0 ? (
        <AbsoluteFill style={{opacity: loop}}>
          <Frame f={0} captions={captions} />
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

const Frame: React.FC<{f: number; captions: boolean}> = ({f, captions}) => {
  const breathe = 1.0 + 0.01 * Math.sin((f / 90) * Math.PI);
  return (
    <AbsoluteFill style={{background: COL.bg}}>
      <AbsoluteFill style={{backgroundImage: 'radial-gradient(rgba(140,160,190,0.08) 1.5px, transparent 1.5px)', backgroundSize: '36px 36px', backgroundPosition: `0 ${-f * 0.4}px`}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 60% at 50% 55%, rgba(57,208,255,0.05), rgba(0,0,0,0) 70%)'}} />
      <AbsoluteFill style={{scale: String(breathe), transformOrigin: '540px 960px'}}>
        <Editor f={f} />
        <Terminal f={f} />
        <Cloud f={f} />
        <Bashrc f={f} />
      </AbsoluteFill>
      {COPY.map((c, i) => (
        <Headline key={i} f={f} c={c} />
      ))}
      <Recap f={f} />
      <Progress f={f} />
      {captions ? <Captions f={f} lines={CAPS} accent={COL.amber} /> : null}
    </AbsoluteFill>
  );
};
