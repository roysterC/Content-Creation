import React from 'react';
import {Audio} from '@remotion/media';
import {Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, SANS} from './theme';

export const PHONE_PATH =
  'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z';

export const PhoneIcon: React.FC<{size: number; color: string; rotate?: number; missed?: boolean}> = ({
  size,
  color,
  rotate = 0,
  missed,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{rotate: `${rotate}deg`}}>
    <path d={PHONE_PATH} />
    {missed ? (
      <>
        <path d="M22 2 16 8" />
        <path d="M16 2 22 8" />
      </>
    ) : null}
  </svg>
);

export const CheckIcon: React.FC<{size: number; color: string; progress?: number}> = ({size, color, progress = 1}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - progress} />
  </svg>
);

/** Spring progress (0→1) starting at `start` frames. */
export const usePop = (start: number, damping = 14, stiffness = 170) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: frame - start, fps, config: {damping, stiffness, mass: 0.7}});
};

/** Words pop in one by one: slide up, unblur, scale. */
export const Kinetic: React.FC<{
  text: string;
  start: number;
  stagger?: number;
  style?: React.CSSProperties;
  wordStyle?: (word: string, i: number) => React.CSSProperties | undefined;
}> = ({text, start, stagger = 3, style, wordStyle}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const words = text.split(' ');
  return (
    <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: '0.26em', ...style}}>
      {words.map((w, i) => {
        const s = spring({frame: frame - start - i * stagger, fps, config: {damping: 13, stiffness: 190, mass: 0.6}});
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              opacity: Math.min(1, s * 1.5),
              translate: `0 ${(1 - s) * 70}px`,
              scale: String(0.75 + 0.25 * s),
              filter: `blur(${Math.max(0, (1 - s) * 10)}px)`,
              ...wordStyle?.(w, i),
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

export const Phone: React.FC<{
  width: number;
  height: number;
  screen: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({width, height, screen, style, children}) => (
  <div
    style={{
      width,
      height,
      borderRadius: 96,
      background: '#1c1b19',
      padding: 16,
      boxShadow: '0 60px 120px rgba(0,0,0,0.35), inset 0 0 0 3px #3a3834',
      position: 'relative',
      ...style,
    }}
  >
    <div style={{width: '100%', height: '100%', borderRadius: 80, background: screen, overflow: 'hidden', position: 'relative'}}>
      {children}
      <div
        style={{
          position: 'absolute',
          top: 24,
          left: '50%',
          translate: '-50% 0',
          width: 200,
          height: 52,
          borderRadius: 30,
          background: '#0a0a0a',
        }}
      />
    </div>
  </div>
);

export const Pill: React.FC<{children: React.ReactNode; bg: string; color: string; style?: React.CSSProperties}> = ({
  children,
  bg,
  color,
  style,
}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 14,
      padding: '14px 30px',
      borderRadius: 999,
      background: bg,
      color,
      fontFamily: SANS,
      fontWeight: 600,
      fontSize: 34,
      ...style,
    }}
  >
    {children}
  </div>
);

export const Dot: React.FC<{color?: string; size?: number}> = ({color = C.sage, size = 18}) => (
  <div style={{width: size, height: size, borderRadius: 99, background: color}} />
);

/** Play a file from public/ starting at `at` (frames, relative to the parent sequence). */
export const Sound: React.FC<{src: string; at: number; volume?: number}> = ({src, at, volume = 1}) => (
  <Sequence from={at} layout="none">
    <Audio src={staticFile(src)} volume={volume} />
  </Sequence>
);
