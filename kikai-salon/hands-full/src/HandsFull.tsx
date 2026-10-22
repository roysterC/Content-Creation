import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {Grain, Vignette} from './art';
import cues from './cues.json';
import {AfterHours, Answers, EndCard, Missed, Morning, Rush} from './scenes';
import {ip, loadFonts} from './theme';

loadFonts();

const Fade: React.FC<{fade: number; children: React.ReactNode}> = ({fade, children}) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{opacity: fade > 0 ? ip(f, [0, fade], [0, 1]) : 1}}>{children}</AbsoluteFill>;
};

const SCENES = [
  ['rush', Rush],
  ['missed', Missed],
  ['answers', Answers],
  ['afterHours', AfterHours],
  ['morning', Morning],
  ['endCard', EndCard],
] as const;

export const HandsFull: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    {SCENES.map(([name, El]) => {
      const s = cues.scenes[name];
      return (
        <Sequence key={name} name={name} from={s.start} durationInFrames={s.dur}>
          <Fade fade={s.fade}>
            <El />
          </Fade>
        </Sequence>
      );
    })}
    <Vignette o={0.5} />
    <Grain o={0.08} />
  </AbsoluteFill>
);
