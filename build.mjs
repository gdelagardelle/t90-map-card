import { build } from 'esbuild';
import { readFile } from 'node:fs/promises';
const scene = await build({entryPoints:['src/ecovacs-preview.js'],bundle:true,minify:true,write:false,legalComments:'inline'});
const template = await readFile('src/scene.html','utf8');
const palette = await readFile('src/appearance.css','utf8');
const html = template.replace('/* APPEARANCE */', () => palette).replace('/* INSERT_BUNDLE */', () => scene.outputFiles[0].text.replace(/<\/script/gi,'<\\/script'));
for (const tester of [false,true]) {
  const cardType = tester ? 'dreame-map-card-beta' : 't90-map-card';
  await build({entryPoints:['src/card.js'],bundle:true,minify:true,format:'esm',loader:{'.css':'text'},supported:{'template-literal':false},legalComments:'inline',outfile:'dist/'+cardType+'.js',
    define:{__DREAME_TESTER__:String(tester),__CARD_TYPE__:JSON.stringify(cardType),__EDITOR_TYPE__:JSON.stringify(tester ? 'dreame-map-editor-beta' : 't90-map-editor')},
    plugins:[{name:'scene-document',setup(b) {
      b.onResolve({filter:/^t90-scene$/}, () => ({path:'scene',namespace:'embedded'}));
      b.onLoad({filter:/.*/,namespace:'embedded'}, () => ({contents:html,loader:'text'}));
    }}]});
}
