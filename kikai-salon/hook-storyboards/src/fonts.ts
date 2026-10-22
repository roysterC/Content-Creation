import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

let done = false;
export const loadFonts = () => {
  if (done) return;
  done = true;
  loadFont({family: 'Instrument Serif', url: staticFile('serif.woff2'), weight: '400'});
  loadFont({family: 'Instrument Serif', url: staticFile('serif-italic.woff2'), weight: '400', style: 'italic'});
  loadFont({family: 'Caveat', url: staticFile('caveat.woff2'), weight: '600'});
  for (const w of ['400', '500', '600', '700']) loadFont({family: 'Inter', url: staticFile(`inter-${w}.woff2`), weight: w});
};
