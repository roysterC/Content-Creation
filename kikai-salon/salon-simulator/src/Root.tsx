import React from 'react';
import {Composition} from 'remotion';
import cues from './cues.json';
import {Cover, SalonSim} from './SalonSim';

export const Root: React.FC = () => (
  <>
    <Composition id="SalonSim" component={SalonSim} durationInFrames={cues.total} fps={30} width={1080} height={1920} />
    <Composition id="Cover" component={Cover} durationInFrames={120} fps={30} width={1080} height={1920} />
  </>
);
