import React from 'react';
import {Composition} from 'remotion';
import cues from './cues.json';
import {HandsFull} from './HandsFull';

export const Root: React.FC = () => (
  <Composition id="HandsFull" component={HandsFull} durationInFrames={cues.total} fps={30} width={1080} height={1920} />
);
