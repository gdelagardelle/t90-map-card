import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
await build({
  entryPoints:[fileURLToPath(new URL('./card.js',import.meta.url))],
  outfile:fileURLToPath(new URL('../../dist/vacuum-controls-card.js',import.meta.url)),
  bundle:true,format:'esm',minify:true,legalComments:'inline'
});
