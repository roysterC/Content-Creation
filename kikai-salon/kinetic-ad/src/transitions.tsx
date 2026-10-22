import type {TransitionPresentationComponentProps} from '@remotion/transitions';
import React from 'react';
import {AbsoluteFill} from 'remotion';

type P = TransitionPresentationComponentProps<Record<string, never>>;

// Whip-pan: both scenes slide hard sideways with motion blur.
export const Whip: React.FC<P> = ({children, presentationDirection, presentationProgress: p}) => {
  const exiting = presentationDirection === 'exiting';
  const x = exiting ? -p * 100 : (1 - p) * 100;
  const blur = Math.sin(p * Math.PI) * 40;
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <AbsoluteFill style={{translate: `${x}% 0`, filter: `blur(${blur}px)`}}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

// Zoom punch: outgoing scene rushes toward camera, incoming scene settles from slightly large.
export const ZoomPunch: React.FC<P> = ({children, presentationDirection, presentationProgress: p}) => {
  const exiting = presentationDirection === 'exiting';
  const scale = exiting ? 1 + p * 1.2 : 1.35 - 0.35 * p;
  const opacity = exiting ? 1 - p : Math.min(1, p * 2);
  const blur = exiting ? p * 24 : (1 - p) * 12;
  return (
    <AbsoluteFill style={{scale: String(scale), opacity, filter: `blur(${blur}px)`}}>{children}</AbsoluteFill>
  );
};

// Flash cut: white flash peaks mid-transition.
export const Flash: React.FC<P> = ({children, presentationDirection, presentationProgress: p}) => {
  const exiting = presentationDirection === 'exiting';
  if (exiting) {
    return <AbsoluteFill style={{opacity: p < 0.5 ? 1 : 0}}>{children}</AbsoluteFill>;
  }
  const flash = 1 - Math.abs(p * 2 - 1);
  return (
    <AbsoluteFill style={{opacity: p >= 0.5 ? 1 : 0}}>
      {children}
      <AbsoluteFill style={{background: '#fff', opacity: flash}} />
    </AbsoluteFill>
  );
};

// Vertical slam: incoming scene drops in from top with a hard stop.
export const Slam: React.FC<P> = ({children, presentationDirection, presentationProgress: p}) => {
  const exiting = presentationDirection === 'exiting';
  if (exiting) {
    return <AbsoluteFill style={{translate: `0 ${p * 30}%`, filter: `blur(${p * 20}px)`}}>{children}</AbsoluteFill>;
  }
  return (
    <AbsoluteFill style={{translate: `0 ${-(1 - p) * 100}%`, filter: `blur(${(1 - p) * 30}px)`}}>
      {children}
    </AbsoluteFill>
  );
};
