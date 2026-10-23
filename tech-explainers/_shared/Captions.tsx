import React from 'react';
import {interpolate} from 'remotion';

// Word-by-word captions of the voiceover (timings from tools/captions.py → src/captions.json).
// Shows short chunks (≤ 3 words, broken at punctuation) with the spoken word highlighted.
type Word = {t: string; s: number; e: number};
type Line = {id: string; words: Word[]};

const MAX_WORDS = 3;
const MAX_CHARS = 18;
type Chunk = {words: Word[]; s: number; e: number};

const chunkLines = (lines: Line[]): Chunk[] => {
  const out: Chunk[] = [];
  for (const l of lines) {
    let cur: Word[] = [];
    const flush = () => {
      if (cur.length) out.push({words: cur, s: cur[0].s, e: cur[cur.length - 1].e});
      cur = [];
    };
    for (const w of l.words) {
      const len = cur.reduce((n, x) => n + x.t.length + 1, 0) + w.t.length;
      if (cur.length && (cur.length >= MAX_WORDS || len > MAX_CHARS)) flush();
      cur.push(w);
      if (/[,.;:!?…]$/.test(w.t)) flush();
    }
    flush();
  }
  // hold each chunk until the next one starts, if the gap is short
  for (let i = 0; i < out.length; i++) {
    const next = out[i + 1];
    out[i].e = next && next.s - out[i].e < 18 ? next.s : out[i].e + 8;
  }
  return out;
};

export const Captions: React.FC<{f: number; lines: Line[]; top?: number; accent?: string; ink?: string; font?: string}> = ({f, lines, top = 1428, accent = '#ffb020', ink = '#ffffff', font = 'Inter, sans-serif'}) => {
  const chunks = React.useMemo(() => chunkLines(lines), [lines]);
  const c = chunks.find((k) => f >= k.s - 1 && f < k.e);
  if (!c) return null;
  const pop = interpolate(f, [c.s - 1, c.s + 3], [0.9, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', left: 60, right: 150, top, display: 'flex', justifyContent: 'center'}}>
      <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0 16px', scale: String(pop), padding: '8px 22px', borderRadius: 18, background: 'rgba(10,14,20,0.72)'}}>
        {c.words.map((w, i) => {
          const active = f >= w.s - 1 && f < w.e + 1;
          const said = f >= w.s - 1;
          return (
            <span
              key={i}
              style={{
                fontFamily: font,
                fontWeight: 800,
                fontSize: 54,
                lineHeight: 1.2,
                letterSpacing: -1,
                color: active ? accent : ink,
                opacity: said ? 1 : 0.55,
                display: 'inline-block',
                scale: active ? '1.06' : '1',
                textShadow: '0 3px 0 rgba(0,0,0,0.45)',
              }}
            >
              {w.t}
            </span>
          );
        })}
      </div>
    </div>
  );
};
