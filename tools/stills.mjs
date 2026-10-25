// Render many stills from one bundle:  node tools/stills.mjs <project-dir> <CompositionId> <outdir> <scale> f1 f2 ...
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';
const [proj, id, outdir, scale, ...frames] = process.argv.slice(2);
const serveUrl = await bundle({entryPoint: path.resolve(proj, 'src/index.ts'), publicDir: path.resolve(proj, 'public')});
const browserExecutable = process.env.CHROME || undefined;
const composition = await selectComposition({serveUrl, id, browserExecutable});
fs.mkdirSync(outdir, {recursive: true});
for (const f of frames) {
  await renderStill({serveUrl, composition, frame: Number(f), output: path.join(outdir, `f${String(f).padStart(4, '0')}.png`), scale: Number(scale), browserExecutable});
  process.stdout.write(f + ' ');
}
console.log('done');
