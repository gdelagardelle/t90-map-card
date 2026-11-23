import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import { scan } from './fixture.mjs';

const bundle=await readFile('dist/t90-map-card.js');
const server=http.createServer((req,res)=>{
  if(req.url==='/card.js'){res.setHeader('Content-Type','text/javascript');return res.end(bundle);}
  res.setHeader('Content-Type','text/html');
  res.end('<!doctype html><t90-map-editor></t90-map-editor><script type="module" src="/card.js"></script>');
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN});
try {
  const page=await browser.newPage();page.setDefaultTimeout(12000);
  await page.goto('http://127.0.0.1:'+server.address().port);
  await page.waitForFunction(()=>customElements.get('t90-map-editor'));
  await page.evaluate(async svg=>{
    await customElements.whenDefined('t90-map-editor');
    const editor=window.editor=document.querySelector('t90-map-editor');
    const state=(state,attributes={})=>({state,attributes});
    window.calls=[];
    window.h={config:{version:'2026.11.3'},states:{
      'vacuum.private':state('docked',{friendly_name:'PRIVATE HOUSEHOLD',rooms:{PRIVATE_ROOM:0}}),
      'image.private':state('now'), 'image.stranger':state('now'),
      'select.private_mop':state('on'), 'vacuum.second':state('idle'), 'vacuum.unsupported':state('idle')},
      entities:{'vacuum.private':{device_id:'private-device',platform:'ecovacs'},'image.private':{device_id:'private-device'},
        'select.private_mop':{device_id:'private-device',translation_key:'mop_mode'},
        'image.stranger':{device_id:'someone'},'vacuum.second':{device_id:'other',platform:'roborock'},
        'vacuum.unsupported':{device_id:'shark',platform:'shark'}},
      devices:{'private-device':{model_id:'b7vftn',name:'PRIVATE SERIAL'}},
      fetchWithAuth:async path=>{calls.push(path);return new Response(svg);},
      callService(){throw Error('Unexpected robot command');}};
    editor.hass=h;editor.setConfig({type:'custom:t90-map-card',maps:{privateSavedLayout:1}});
    editor.addEventListener('config-changed',e=>window.saved=e.detail.config);
  },scan());
  const e=page.locator('t90-map-editor');
  await e.getByLabel('Vacuum',{exact:true}).selectOption('vacuum.private');
  await e.getByText('Map verified for this vacuum.').waitFor();assert.equal(await e.locator('img').isVisible(),true);
  assert.deepEqual(await page.evaluate(()=>[saved.map_entity,saved.maps]),['image.private',{privateSavedLayout:1}]);
  assert.equal(await e.locator('option[value="image.stranger"]').count(),0);
  await e.locator('summary').click();
  await page.waitForFunction(()=>editor.shadowRoot.querySelector('textarea').value);
  const report=await e.locator('textarea').inputValue();
  for(const text of ['T90 MAX PLUS OMNI','Card version: 0.3.','Room cleaning: Detected','Robot position: Detected','Mop settings: Detected','2026.11.3']) assert.ok(report.includes(text),text);
  assert.doesNotMatch(report,/private|vacuum\.|image\.|https?:|PRIVATE_ROOM/i);
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async t=>window.clip=t}}));
  await e.getByRole('button',{name:'Copy test details'}).click();assert.equal(await page.evaluate(()=>clip),report);
  await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:undefined});document.execCommand=()=>false;});
  await e.getByRole('button',{name:'Copy test details'}).click();await e.getByText(/device’s Copy command/).waitFor();
  await e.getByLabel('Vacuum',{exact:true}).selectOption('vacuum.second');assert.equal(await page.evaluate(()=>saved.map_entity),'');
  await e.getByText(/enable its map image/).waitFor();
  await e.getByLabel('Vacuum',{exact:true}).selectOption('vacuum.unsupported');await e.getByText(/different tester module/).waitFor();
  await page.evaluate(()=>{editor.setConfig({entity:'vacuum.private',map_entity:'image.stranger'});});
  await e.getByText(/belongs to a different device/).waitFor();
  await page.evaluate(()=>{window.n=calls.length;h.states['image.second_private']={state:'now',attributes:{}};h.entities['image.second_private']={device_id:'private-device'};editor.hass=h;});
  await e.getByLabel('Vacuum',{exact:true}).selectOption('vacuum.second');
  await e.getByLabel('Vacuum',{exact:true}).selectOption('vacuum.private');
  assert.equal(await page.evaluate(()=>saved.map_entity),'');assert.equal(await page.evaluate(()=>calls.length===n),true);
  console.log('Guided setup verified map pairing, ambiguous and missing maps, on-device preview, unsupported integrations, report privacy and clipboard fallback.');
} finally {await browser.close();await new Promise(done=>server.close(done));}
