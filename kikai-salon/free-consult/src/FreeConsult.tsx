import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {Grain, Vignette} from './art';
import cues from './cues.json';
import {EndCard, Hook, KikaiScene, Lost, Missed, Offer} from './scenes';
import {ip, loadFonts, P, SANS, SERIF} from './theme';
import {AnsweredCard, CAP_HIGH, Caption, CtaTag, Headline, MissCounter, MissedStack, RivalChips} from './ui';

loadFonts();

const S = cues.scenes;
const X = cues.sfx;
const V = cues.vo;

const Fade: React.FC<{fade: number; children: React.ReactNode}> = ({fade, children}) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{opacity: fade > 0 ? ip(f, [0, fade], [0, 1]) : 1}}>{children}</AbsoluteFill>;
};

const SCENES = [
  ['hook', Hook],
  ['missed', Missed],
  ['lost', Lost],
  ['kikai', KikaiScene],
  ['offer', Offer],
  ['endCard', EndCard],
] as const;

export const FreeConsult: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {SCENES.map(([name, El]) => {
        const s = S[name];
        return (
          <Sequence key={name} name={name} from={s.start} durationInFrames={s.dur}>
            <Fade fade={s.fade}>
              <El />
            </Fade>
          </Sequence>
        );
      })}
      <Vignette o={0.45} />
      <Grain o={0.07} />

      {/* overlays */}
      <Headline f={f} until={S.missed.start + 6} />
      <MissCounter f={f} />
      <MissedStack f={f} />
      <RivalChips f={f} />
      <AnsweredCard f={f} />
      <Caption f={f} l1="That's a client who rings" l2="the salon down the road." at={X.fly + 12} until={S.kikai.start} top={250} />
      <Caption f={f} l1="Meet Kikai." l2="The AI receptionist for UK salons" at={V.v4} until={X.nightIn} top={CAP_HIGH} serif />
      <Caption f={f} l1="Answers your calls," l2="day or night." at={X.nightIn + 2} until={X.diaryIn} top={CAP_HIGH} />
      <Caption f={f} l1="Books them straight" l2="into your diary." at={X.diaryIn + 2} until={S.offer.start} top={CAP_HIGH} />
      <CtaTag f={f} />
    </AbsoluteFill>
  );
};

/** Profile-grid cover: the hook frame plus the offer badge, all inside the 3:4 band (y 240-1680). */
export const Cover: React.FC = () => (
  <AbsoluteFill>
    <FreeConsult />
    <div style={{position: 'absolute', top: 1180, left: 0, right: 0, textAlign: 'center'}}>
      <div style={{display: 'inline-block', background: P.amber, color: '#2a1a10', borderRadius: 40, padding: '22px 50px 26px', boxShadow: '0 20px 50px rgba(0,0,0,0.45)', rotate: '-3deg'}}>
        <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 96, lineHeight: 1, letterSpacing: -3}}>FREE</div>
        <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 72, lineHeight: 1}}>consultation</div>
      </div>
    </div>
  </AbsoluteFill>
);
