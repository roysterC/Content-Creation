import {linearTiming, TransitionSeries} from '@remotion/transitions';
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Awkward, CallDemo, CTA, Diary, Hook, Problem, Reveal, Stats} from './scenes';
import {loadFonts} from './theme';
import {SCENE_DURS, SCENE_STARTS, TRANSITIONS, WHOOSH_AT} from './timing';
import {Flash, Slam, Whip, ZoomPunch} from './transitions';
import {Sound} from './ui';

loadFonts();

const SCENES: {name: string; El: React.FC}[] = [
  {name: 'Hook', El: Hook},
  {name: 'Problem', El: Problem},
  {name: 'Reveal', El: Reveal},
  {name: 'Call demo', El: CallDemo},
  {name: 'Diary', El: Diary},
  {name: 'Awkward calls', El: Awkward},
  {name: 'Stats', El: Stats},
  {name: 'CTA', El: CTA},
];
const PRESENTATIONS = [Flash, Whip, ZoomPunch, Whip, Slam, Flash, ZoomPunch];

export const KikaiAd: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    <TransitionSeries>
      {SCENES.map(({name, El}, i) => (
        <React.Fragment key={name}>
          {i > 0 ? (
            <TransitionSeries.Transition
              presentation={{component: PRESENTATIONS[i - 1], props: {}}}
              timing={linearTiming({durationInFrames: TRANSITIONS[i - 1]})}
            />
          ) : null}
          <TransitionSeries.Sequence name={name} durationInFrames={SCENE_DURS[i]}>
            <El />
          </TransitionSeries.Sequence>
        </React.Fragment>
      ))}
    </TransitionSeries>
    {/* whooshes on the whip-pans, slam and zoom punches */}
    {[...WHOOSH_AT, 2, 6].map((k) => (
      <Sound key={k} src="sfx/whoosh.wav" at={SCENE_STARTS[k + 1] - 3} volume={0.45} />
    ))}
  </AbsoluteFill>
);
