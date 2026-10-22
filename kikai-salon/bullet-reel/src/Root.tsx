import React from 'react';
import {Composition} from 'remotion';
import {BulletHook} from './BulletHook';
import {Reel} from './Reel';
import {R} from './reelTimeline';
import {FPS, TOTAL} from './timeline';

export const Root: React.FC = () => (
  <>
    <Composition id="KikaiBulletReel" component={Reel} durationInFrames={R.total} fps={R.fps} width={1080} height={1920} />
    <Composition id="BulletHook" component={BulletHook} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} />
  </>
);
