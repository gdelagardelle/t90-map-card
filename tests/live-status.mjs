import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import http from 'node:http';
import {chromium} from 'playwright-core';
import {mapTime,mapAge,liveState} from '../src/live-status.js';
import {scan} from './fixture.mjs';

const now=Date.now();
assert.equal(mapAge('cleaning',now-119999,now),'');
assert.equal(mapAge('cleaning',now-120000,now),'Last map update 2 min ago');
assert.equal(mapAge('returning',now-3600000,now),'Last map update 1 h ago');
assert.equal(mapAge('cleaning',null,now),'Map time unavailable');
assert.equal(mapAge('cleaning',now+5000000,now),'Map time unavailable');
assert.equal(mapAge('docked',now-86400000,now),'');
assert.equal(mapTime({state:'not-a-time',last_changed:new Date(now).toISOString()}),now);
assert.equal(mapTime({state:'3'}),null);
assert.equal(liveState('docked',false,'washing_mop',null,now,false),'Robot offline');
assert.equal(liveState('cleaning',true,'washing_mop',null,now,false),'Cleaning');
const cmd={action:'Start',result:'Accepted by Home Assistant',at:now};
assert.equal(liveState('idle',true,'',cmd,now,false),'Start sent');
assert.match(liveState('idle',true,'',cmd,now+45000,false),/unconfirmed/);
assert.equal(liveState('cleaning',true,'',cmd,now+47000,false),'Cleaning');
assert.equal(liveState('idle',true,'',cmd,now+49000,false),'Idle');

const js=await readFile('dist/t90-map-card.js');
const server=http.createServer((req,res)=>{
  const module=req.url==='/card.js';res.setHeader('Content-Type',module?'text/javascript':'text/html');
  res.end(module?js:'<!doctype html><meta name="viewport" content="width=device-width"><t90-map-card></t90-map-card><script type="module" src="/card.js"></script>');
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try {
  for(const rr of [false,true]){
    const page=await browser.newPage({viewport:{width:390,height:820}});page.setDefaultTimeout(15000);
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+server.address().port);
    await page.evaluate(async({rr,svg})=>{
      await customElements.whenDefined('t90-map-card');
      const card=window.card=document.querySelector('t90-map-card');
      const entity='vacuum.fixture',image='image.fixture';
      const platform=rr?'roborock':'ecovacs';
      const station=rr?'sensor.fixture_status':'sensor.fixture_station_state';
      const canvas=document.createElement('canvas');canvas.width=160;canvas.height=100;
      const context=canvas.getContext('2d');context.fillStyle='#5d6d7e';context.fillRect(0,0,160,100);
      context.fillStyle='#f0b27a';context.fillRect(4,4,152,92);
      const png=await new Promise(resolve=>canvas.toBlob(resolve));
      const h=window.h={connected:true,states:{
        [entity]:{state:'docked',attributes:{rooms:{Kitchen:1},battery_level:82}},
        [image]:{state:new Date(Date.now()-150000).toISOString(),attributes:{}},
        [station]:{state:'idle',attributes:{}}},
        entities:Object.fromEntries([entity,image,station].map(id=>[id,{platform,device_id:'fake'}])),
        fetchWithAuth:async()=>new Response(rr?png:svg),callService:async()=>{},
        callWS:async req=>req.service==='get_maps'?{response:{[entity]:{maps:[{flag:1,rooms:{1:'Kitchen'}}]}}}:{}};
      window.state=(v,s)=>{h.states[entity].state=v;h.states[station].state=s;card.hass=h;};
      card.setConfig({entity,map_entity:image,map_source:rr?'roborock_qrevo':'ecovacs'});card.hass=h;
    },{rr,svg:scan()});
    await page.waitForFunction(()=>card.mapReady && card.frame.contentDocument.querySelector('.viewer')?.dataset.rendered==='true');
    const line=page.locator('.compact-state');
    assert.equal(await line.isVisible(),true);assert.equal(await line.textContent(),'Docked');
    await page.locator('[data-action=start]').click();
    await page.waitForFunction(()=>card.q('.compact-state').textContent==='Start sent');
    await page.evaluate(()=>state('docked','washing_mop'));assert.equal(await line.textContent(),'Washing mop');
    await page.evaluate(()=>state('cleaning','idle'));assert.equal(await line.textContent(),'Cleaning');
    const pin=page.frameLocator('iframe').locator('.map-age-pin');
    await pin.waitFor();assert.equal(await pin.textContent(),'Last map update 2 min ago');
    await page.evaluate(async()=>{await card.pullMap();card.refreshLiveStatus();});
    assert.equal(await pin.textContent(),'Last map update 2 min ago');
    await page.evaluate(()=>{h.states['image.fixture'].state=new Date().toISOString();card.hass=h;});
    await page.waitForFunction(()=>card.mapReady && card.mapStamp===h.states['image.fixture'].state && card.frame.contentDocument.querySelector('.map-age-pin')?.hidden);
    await page.evaluate(()=>state('returning','idle'));assert.equal(await line.textContent(),'Returning home');
    await page.evaluate(()=>{h.connected=false;card.hass=h;});assert.equal(await line.textContent(),'Robot offline');
    assert.deepEqual(errors,[]);await page.close();
  }
  console.log('Verified command and telemetry transitions for both robots, stale map age, polling, refresh and mobile visibility.');
} finally {await browser.close();await new Promise(ok=>server.close(ok));}
