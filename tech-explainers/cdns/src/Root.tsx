import React from 'react';
import {Composition} from 'remotion';
import {Explainer} from './Explainer';
import {Cover} from './Cover';
import {FPS, S} from './sim';

export const Root: React.FC = () => (
  <>
    <Composition id="Cdns" component={Explainer} durationInFrames={S.total} fps={FPS} width={1080} height={1920} />
    <Composition id="Cover" component={Cover} durationInFrames={120} fps={FPS} width={1080} height={1920} />
  </>
);
