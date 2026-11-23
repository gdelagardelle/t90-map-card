import { checkCommandRaces } from './l40s-races.mjs';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import http from 'node:http';
import { chromium } from 'playwright-core';
import { sampleMap, mountDreame, checkDreame } from './dreame.mjs';

const assets=Object.fromEntries(await Promise.all(['stable','beta'].map(async key=>[
  '/'+key+'.js',await readFile(key==='beta'?'dist/dreame-map-card-beta.js':(process.env.STABLE_CARD_JS || 'dist/t90-map-card.js'))
])));
const server=http.createServer((req,res)=>{
  const body=assets[req.url];
  res.setHeader('Content-Type',body?'text/javascript':'text/html');
  res.end(body||'<style>dreame-map-card-beta{display:block}</style>');
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try {
  const page=await browser.newPage({viewport:{width:1410,height:935}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const home='http://127.0.0.1:'+server.address().port;
  await page.goto(home);
  await page.evaluate(async()=>{
    await import('/beta.js');
    if(customElements.get('t90-map-card')||customElements.get('t90-map-editor')) throw Error('Beta registered a stable element.');
    const beta=customElements.get('dreame-map-card-beta');
    if(beta.getConfigElement().tagName.toLowerCase()!=='dreame-map-editor-beta') throw Error('Invalid beta editor');
    await import('/stable.js');
    if(!customElements.get('t90-map-card') || customElements.get('t90-map-card')===beta) throw Error('Stable element collision.');
    window.dreameTesterTag='dreame-map-card-beta';
  });
  if(process.argv.includes('--races-only')) {
    await checkCommandRaces(page);
    assert.deepEqual(errors,[]);
  } else {
    await checkDreame(page);
    await page.evaluate(()=>{window.dreameModel={stem:'l40s_pro_ultra',name:'Dreame L40s Pro Ultra'};});
    await page.evaluate(mountDreame,sampleMap());
    const card=page.locator('dreame-map-card-beta'),frame=card.frameLocator('iframe');
    await frame.locator('[data-regions="2"][data-tracking="live"]').waitFor();
    assert.equal(await card.locator('.identity h2').textContent(),'Dreame L40s Pro Ultra');
    for(const [state,button] of [['docked','start'],['cleaning','pause'],['paused','start'],['cleaning','stop'],['idle','return_to_base']]){
      await card.evaluate((c,state)=>{c.h.states[c.vacuum].state=state;c.refresh();},state);
      await card.locator('[data-action='+button+']').click();
    }
    assert.deepEqual(await page.evaluate(()=>dreameDemo.calls.map(call=>[call[0],call[1],call[3].entity_id])),
      ['start','pause','start','stop','return_to_base'].map(action=>['vacuum',action,'vacuum.l40s_pro_ultra']));
    await page.evaluate(()=>{dreameDemo.calls.length=0;});
    await card.evaluate(async c=>{
      c.h.states[c.vacuum].state='cleaning';
      dreameDemo.map.completed_segments=[7,999,7];
      await c.pullMap(true);
    });
    assert.equal(await card.locator('.room-activity').textContent(),'Robot in Office · Completed: Kitchen');
    await frame.locator('[data-camera="follow"]').click();
    await card.evaluate(async c=>{dreameDemo.map.robot_position=null;await c.pullMap(true);});
    assert.equal(await frame.locator('.viewer').getAttribute('data-camera'),'floor');
    assert.equal(await frame.locator('[data-camera="follow"]').isHidden(),true);
    assert.equal(await card.locator('.room-activity').textContent(),'Completed: Kitchen');
    await card.evaluate(async c=>{
      c.h.states[c.vacuum].state='idle';
      c.toggleRoom(3);
      dreameDemo.map.saved_map_id=22;
      await c.control('start');
    });
    assert.equal(await page.evaluate(()=>dreameDemo.calls.length),0);
    assert.equal(await card.locator('[data-action=start]').isDisabled(),true);
    assert.match(await card.locator('.note').textContent(),/not sent/);
    await card.evaluate(async c=>{
      const normalFetch=c.h.fetchWithAuth;
      let release;
      const inFlight=new Promise(resolve=>{release=resolve;});
      c.h.fetchWithAuth=async (...args)=>{await inFlight;return normalFetch(...args);};
      c.toggleRoom(3);
      const pending=c.control('start');
      c.toggleRoom(3);
      await c.control('start');
      release();
      await pending;
      c.h.fetchWithAuth=normalFetch;
    });
    assert.equal(await page.evaluate(()=>dreameDemo.calls.length),0);
    await card.evaluate(async c=>{
      c.h.entities[c.image].device_id='another-vacuum';
      c.toggleRoom(3);await c.control('start');
    });
    assert.equal(await page.evaluate(()=>dreameDemo.calls.length),0);
    assert.deepEqual(errors,[]);
    await page.goto(home+'/fresh');
    await page.evaluate(async()=>{
      await import('/stable.js');const first=customElements.get('t90-map-card');
      await import('/beta.js');
      if(first!==customElements.get('t90-map-card') || first===customElements.get('dreame-map-card-beta')) throw Error('Stable-first collision.');
    });
    console.log('L40s beta passed namespace coexistence, room activity, missing pose and follow fallback, and floor/device change command cancellation.');
  }
} finally {await browser.close();server.close();}
