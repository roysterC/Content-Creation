import {loadFont} from '@remotion/fonts';
import {Easing, staticFile} from 'remotion';

export const C = {
  paper: '#fbfaf6',
  paper2: '#f3f0e8',
  ink: '#1a1916',
  night: '#0d0d0f',
  clay: '#c4532f',
  clayDeep: '#9e3d1f',
  sage: '#2f6b4f',
  sageSoft: '#dcebe2',
  muted: '#6f6a60',
  line: '#e4e0d6',
  red: '#ff4d4f',
};

export const SERIF = '"Instrument Serif", Georgia, serif';
export const SANS = '"Inter", system-ui, sans-serif';

export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);

export const clamp = {
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp',
} as const;

let loaded = false;
export const loadFonts = () => {
  if (loaded) return;
  loaded = true;
  loadFont({family: 'Instrument Serif', url: staticFile('serif.woff2'), weight: '400'});
  loadFont({
    family: 'Instrument Serif',
    url: staticFile('serif-italic.woff2'),
    weight: '400',
    style: 'italic',
  });
  for (const w of ['400', '500', '600', '700', '800']) {
    loadFont({family: 'Inter', url: staticFile(`inter-${w}.woff2`), weight: w});
  }
};
