import React from 'react';
import {Easing, interpolate} from 'remotion';

// Closing beat: "Send this to a friend / Teach them <topic> in under a minute." (or a custom `line`).
// `follow` adds the "Follow for more" pill, so one beat carries both asks (the recap card is gone from the format).
// A paper plane flies in, then off toward where the platforms put the share button (right rail).
const ip = (f: number, i: number[], o: number[], e = Easing.bezier(0.25, 0.1, 0.25, 1)) => interpolate(f, i, o, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: e});
const SHARE_BTN = {x: 1004, y: 1385}; // roughly under the Reels/TikTok share icon

const Plane: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M22 2 L11 13" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M22 2 L15 22 L11 13 L2 9 Z" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ShareOutro: React.FC<{f: number; at: number; until: number; topic: string; line?: React.ReactNode; follow?: boolean; accent?: string; ink?: string; dim?: string; sans?: string; mono?: string}> = ({
  f,
  at,
  until,
  topic,
  line,
  follow = false,
  accent = '#ffb020',
  ink = '#e9eef5',
  dim = '#8b98a9',
  sans = 'Inter, sans-serif',
  mono = '"Plex Mono", monospace',
}) => {
  if (f < at - 1) return null;
  const o = ip(f, [at, at + 8, until - 4, until], [0, 1, 1, 1]);
  const t = f - at;
  // plane: flies in to centre, hovers, then darts toward the share button
  const inP = ip(t, [0, 18], [0, 1], Easing.bezier(0.2, 0.9, 0.3, 1));
  const outP = ip(t, [62, 84], [0, 1], Easing.bezier(0.6, 0, 0.8, 0.4));
  const cx = 540;
  const cy = 1000;
  const px = interpolate(inP, [0, 1], [-160, cx]) + (SHARE_BTN.x - cx) * outP;
  const py = interpolate(inP, [0, 1], [1250, cy]) + Math.sin(t / 7) * 8 * (1 - outP) + (SHARE_BTN.y - cy) * outP;
  const size = 300 * (1 - 0.75 * outP);
  const ring = t >= 80 ? ((t - 80) % 26) / 26 : -1;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: o}}>
      <div style={{position: 'absolute', left: 70, right: 120, top: 250}}>
        <div style={{fontFamily: mono, fontWeight: 600, fontSize: 27, letterSpacing: 3, color: accent, opacity: ip(t, [0, 8], [0, 1])}}>{follow ? 'FOLLOW + SHARE' : 'SHARE'}</div>
        {['Send this', 'to a friend.'].map((line, i) => {
          const p = ip(t, [3 + i * 5, 15 + i * 5], [0, 1]);
          return (
            <div key={i} style={{fontFamily: sans, fontWeight: 800, fontSize: 76, lineHeight: 1.08, letterSpacing: -2, color: ink, opacity: p, translate: `0 ${(1 - p) * 26}px`, marginTop: i ? 0 : 18}}>
              {line}
            </div>
          );
        })}
        <div style={{marginTop: 26, fontFamily: sans, fontWeight: 600, fontSize: 44, lineHeight: 1.2, color: dim, opacity: ip(t, [14, 26], [0, 1])}}>
          {line ?? (
            <>
              Teach them <span style={{color: accent}}>{topic}</span>
              <br />
              in under a minute.
            </>
          )}
        </div>
        {follow ? (
          <div style={{marginTop: 34, display: 'flex', alignItems: 'center', gap: 22, opacity: ip(t, [20, 30], [0, 1]), translate: `0 ${(1 - ip(t, [20, 30], [0, 1])) * 14}px`}}>
            <div style={{padding: '18px 30px', borderRadius: 999, background: accent, color: '#1a1406', fontFamily: sans, fontWeight: 700, fontSize: 34, scale: String(1 + 0.04 * Math.max(0, Math.sin((t - 30) / 9)))}}>Follow for more</div>
            <div style={{fontFamily: mono, fontSize: 24, color: dim, lineHeight: 1.35}}>
              expert in anything tech,
              <br />
              in under 1 minute
            </div>
          </div>
        ) : null}
      </div>
      {/* dashed trail */}
      {outP > 0 ? (
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
          <path d={`M ${cx} ${cy} Q ${cx + 260} ${cy + 40} ${px} ${py}`} fill="none" stroke={accent} strokeWidth={4} strokeDasharray="10 14" opacity={0.6 * (1 - ip(t, [84, 100], [0, 1]))} />
        </svg>
      ) : null}
      <div style={{position: 'absolute', left: px - size / 2, top: py - size / 2, width: size, height: size, rotate: `${-8 + 30 * outP}deg`}}>
        <Plane size={size} color={accent} />
      </div>
      {ring >= 0 ? (
        <div style={{position: 'absolute', left: SHARE_BTN.x - 60, top: SHARE_BTN.y - 60, width: 120, height: 120, borderRadius: 60, border: `5px solid ${accent}`, scale: String(0.5 + ring), opacity: 1 - ring}} />
      ) : null}
    </div>
  );
};
