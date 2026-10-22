import {loadFont} from '@remotion/fonts';
import {Easing, interpolate, staticFile} from 'remotion';

export const P = {
  cream: '#f4ecdd',
  paper: '#fbf5e8',
  paperShade: '#efe4cf',
  paperLine: '#e2d4bb',
  ink: '#3b3631',
  charcoal: '#2b2a28',
  charcoal2: '#3a3835',
  sage: '#8aa88a',
  sageTee: '#93b093',
  sageDeep: '#5f7a62',
  sageDark: '#46604b',
  mortar: '#d6c1a4',
  wood: '#a8724b',
  woodDark: '#80532f',
  woodLight: '#c6925f',
  brass: '#c9a24a',
  brassDark: '#9c7a2f',
  amber: '#ffb347',
  amberInk: '#d4740a',
  amberSoft: '#ffd27f',
  amberCore: '#fff3d1',
  skin: '#9a6243',
  skinShade: '#7a4930',
  skinLight: '#b37756',
  hair: '#1b1514',
  hairHi: '#3a2b26',
  leaf: '#4f7a52',
  leaf2: '#6c9a5e',
  leaf3: '#3c5f41',
  gold: '#d6a73a',
  night: '#16213d',
};

export const SERIF = '"Instrument Serif", Georgia, serif';
export const SANS = '"Inter", system-ui, sans-serif';
export const HAND = '"Caveat", cursive';

export const EASE = Easing.bezier(0.45, 0, 0.2, 1);
export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);

/** Clamped interpolate with optional easing. */
export const ip = (f: number, i: number[], o: number[], ease: (n: number) => number = (n) => n) =>
  interpolate(f, i, o, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export const mix = (a: string, b: string, t: number) => {
  const A = hex(a);
  const B = hex(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`;
};

let loaded = false;
export const loadFonts = () => {
  if (loaded) return;
  loaded = true;
  loadFont({family: 'Instrument Serif', url: staticFile('serif.woff2'), weight: '400'});
  loadFont({family: 'Instrument Serif', url: staticFile('serif-italic.woff2'), weight: '400', style: 'italic'});
  loadFont({family: 'Caveat', url: staticFile('caveat.woff2'), weight: '600'});
  for (const w of ['400', '500', '600']) {
    loadFont({family: 'Inter', url: staticFile(`inter-${w}.woff2`), weight: w});
  }
};
