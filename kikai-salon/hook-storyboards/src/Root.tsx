import React from 'react';
import {Composition} from 'remotion';
import {loadFonts} from './fonts';
import {Hook1} from './Hook1';
import {Hook2} from './Hook2';
import {Hook3} from './Hook3';
import {Hook4} from './Hook4';
import {Hook5} from './Hook5';
import {Hook6} from './Hook6';

loadFonts();

const HOOKS: [string, React.FC<{beat: number}>][] = [['Hook1', Hook1], ['Hook2', Hook2], ['Hook3', Hook3], ['Hook4', Hook4], ['Hook5', Hook5], ['Hook6', Hook6]];

export const Root: React.FC = () => (
  <>
    {HOOKS.map(([id, C]) => (
      <Composition key={id} id={id} component={C} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{beat: 0}} />
    ))}
  </>
);
