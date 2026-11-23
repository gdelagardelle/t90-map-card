import { build } from 'esbuild';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root=fileURLToPath(new URL('../../',import.meta.url));
const scene=await build({absWorkingDir:root,entryPoints:['src/ecovacs-preview.js'],bundle:true,minify:true,write:false,legalComments:'inline'});
const base=await readFile(new URL('../../src/scene.html',import.meta.url),'utf8');
const palette=await readFile(new URL('../../src/appearance.css',import.meta.url),'utf8');
const html=base.replace('/* APPEARANCE */',()=>palette)
  .replace('/* INSERT_BUNDLE */',()=>scene.outputFiles[0].text.replace(/<\/script/gi,'<\\/script'))
  .replace('</head>','<style>#layout-status,.tools>button:not([data-view]),.map-editor{display:none!important}</style></head>')
  .replace('Follow Deebot','Follow robot').replace('Ecovacs map','Valetudo map');
await build({absWorkingDir:root,entryPoints:['testers/valetudo/card.js'],outfile:'dist/valetudo-map-card.js',bundle:true,minify:true,format:'esm',legalComments:'inline',plugins:[{
  name:'valetudo-scene',setup(b){
    b.onResolve({filter:/^valetudo-scene$/},()=>({path:'scene',namespace:'scene'}));
    b.onLoad({filter:/.*/,namespace:'scene'},()=>({contents:html,loader:'text'}));
  }
}]});
