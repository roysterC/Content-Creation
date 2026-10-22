import React from 'react';
import {Composition} from 'remotion';
import {KikaiAd} from './KikaiAd';
import {TOTAL} from './timing';

export const Root: React.FC = () => (
  <Composition id="KikaiAd" component={KikaiAd} durationInFrames={TOTAL} fps={30} width={1080} height={1920} />
);
