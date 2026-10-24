import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Explainer} from './Explainer';

const SANS = 'Inter, sans-serif';
const MONO = '"Plex Mono", monospace';

// Cover: the hook's London ↔ Sydney round trip as the picture, the topic as big type.
// Everything that matters sits inside the 3:4 band (y 240–1680) Instagram keeps on the profile grid.
export const Cover: React.FC = () => (
  <AbsoluteFill style={{background: '#0a0e14'}}>
    <AbsoluteFill style={{translate: '0 210px'}}>
      <Explainer />
    </AbsoluteFill>
    <AbsoluteFill style={{background: 'linear-gradient(#0a0e14 0%, #0a0e14 40.8%, rgba(10,14,20,0) 43.5%, rgba(10,14,20,0) 81%, #0a0e14 82.5%)'}} />
    <div style={{position: 'absolute', top: 300, left: 70, right: 70}}>
      <div style={{display: 'inline-block', padding: '10px 22px', borderRadius: 999, background: '#ffb020', color: '#1a1406', fontFamily: MONO, fontWeight: 600, fontSize: 30, letterSpacing: 2}}>EXPERT IN UNDER 1 MIN</div>
      <div style={{marginTop: 30, fontFamily: SANS, fontWeight: 800, fontSize: 200, lineHeight: 0.98, letterSpacing: -5, color: '#e9eef5'}}>
        CDNs
      </div>
      <div style={{marginTop: 26, fontFamily: MONO, fontSize: 34, color: '#8b98a9'}}>POV: Australia says your site is slow</div>
    </div>
  </AbsoluteFill>
);
